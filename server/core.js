var _ = require('lodash');
var memory = require('./memory.js');
var util = require('../client/util.js');
var expressm = require('express');
var fs = require('fs')


var mongo = require("mongojs");
var jsonpack = require('jsonpack');

var EventEmitter = require('events').EventEmitter;

/** 
 init - callback function that is invoked after the server is created but before it runs 
 */
exports.start = function(options) {

    require('util').inherits(util.Ontology, EventEmitter);
    
    var $N = new util.Ontology(['User', 'Trust', 'Value']);
    $N = _.extend($N, util);
    
    $N.server = options;

    var focusHistory = [];
    var focusHistoryMaxAge = 24 * 60 * 60 * 1000; //in ms
    //var attention = memory.Attention(0.95);
    //var logMemory = util.createRingBuffer(256);
    $N.server.interestTime = {};	//accumualted time per interest, indexed by tag URI

    var db = null;
    if (options.databaseURL) {
        //"mydb"; // "username:password@example.com/mydb"
        var dbURL = $N.server.databaseURL; //|| process.env.MongoURL;
        db = mongo.connect(dbURL, ["obj", "sys"]);
    }
    else {
        //http://www.tingodb.com/info/ ??
    }


    function startPlugin(kv, options) {
        var v = kv;

        var p = require('../plugin/' + v).plugin;
        if (typeof (p) == "function")
            p = p($N);
        else if (p != undefined) {
            console.error(v + ' plugin format needs upgraded');
            return;
        }

        $N.server.plugins[v] = {enabled: true, plugin: p};

        $N.nlog('Started plugin: ' + p.name);
        p.start(options);

    }

   
    //calls a plugin operation
    function plugins(operation, parameter) {
        var plugins = $N.server.plugins;

        for (var p in plugins) {
            if (plugins[p].enabled != false) {
                var pp = plugins[p].plugin;
                if (!pp)
                    continue;
                if (pp[operation]) {
                    var result = pp[operation](parameter);
                    if (result)
                        parameter = result;
                }
            }
        }
        return parameter;
    }
    $N.plugins = plugins;


    function saveState(onSaved, onError) {
        if (!db) {  if (onSaved) onSaved(); return; }

        var state = {
            id: 'state',
            interestTime: $N.server.interestTime,
            clientState: $N.server.clientState,
            users: $N.server.users,
            modifiedAt: Date.now()
        };
        db.sys.update({id: "state"}, state, {upsert: true}, function(err, saved) {
            if (err || !saved) {
                if (onError) {
                    nlog('saveState: ' + err);
                    onError(err);
                }
            }
            else {
                if (onSaved)
                    onSaved();
            }

        });
    }
    $N.saveState = saveState;


    function loadState(f) {
        if (!db) {  if (f) f(); return; }
        
        db.sys.find({id: "state"}, function(err, state) {

            if (err || !state || (state.length === 0)) {
                nlog("No previous system state found");
            }
            else {
                var now = Date.now();
                var x = state[0];
                //nlog('Resuming from ' + (now - x.when) / 1000.0 + ' seconds since last system update'); 
                $N.server.interestTime = x.interestTime;
                $N.server.clientState = x.clientState;
                $N.server.users = x.users || {};
                //$N.server.currentClientID = x.currentClientID || {};
                //nlog('Users: ' +  _.keys($N.server.users).length + ' ' + _.keys($N.server.currentClientID).length);

                /*if (x.plugins) {
                 for (var pl in x.plugins) {
                 if (!$N.server.plugins[pl])
                 $N.server.plugins[pl] = {};
                 if (x.plugins[pl].enabled)
                 $N.server.plugins[pl].enabled = x.plugins[pl].enabled;
                 }
                 }*/

            }

            if (f)
                f();

        });

    }

    function deleteObject(objectID, whenFinished, contentAddedToDeletedObject, byClientID) {

        if (byClientID) {
            getObjectByID(objectID, function(err, o) {
                if (!o) {
                    whenFinished('Does not exist');
                    return;
                }

                if (o.author != byClientID) {
                    whenFinished('Not authorized');
                    return;
                }
                deleteObject(objectID, whenFinished, contentAddedToDeletedObject, null);
            });
            return;
        }

        $N.remove(objectID);

        function objectRemoved(uri) {
            var a = {
                'id': uri,
                'removed': true
            };
            if (contentAddedToDeletedObject)
                a.content = contentAddedToDeletedObject;
            return a;
        }

        //TODO move to 'removed' db collection

        db.obj.remove({id: objectID}, function(err, docs) {

            if (err) {
                nlog('error deleting ' + objectID + ':' + err);
                if (whenFinished)
                    whenFinished(err);
            }
            else {
                //broadcast removal of objectID
                pub(objectRemoved(objectID));

                //remove replies                
                db.obj.remove({$or: [{replyTo: objectID}, {author: objectID}]}, function(err, docs) {

                    //nlog('deleted ' + objectID);

                    if (!err) {
                        //TODO publish deleted objects here

                        //console.log('DELETED: ', docs);

                        if (whenFinished)
                            whenFinished();
                    }
                    else {
                        nlog('deleteObject [replies & authored]: ' + err);
                        if (whenFinished)
                            whenFinished(err);
                    }
                });
            }
        });
    }
    $N.deleteObject = deleteObject;

    function deleteObjects(objs, whenFinished) {
        if (objs.length === 0) {
            if (whenFinished)
                whenFinished();
            return;
        }
        function d() {
            var n = objs.pop();

            if (n) {

                if (typeof n != "string")
                    n = n.id;

                $N.deleteObject(n, d);
            }
            else {
                if (whenFinished)
                    whenFinished();
            }
        }
        d();
    }    
    $N.deleteObjects = deleteObjects;


    function deleteObjectsWithTag(tag, callback) {
        var existing = [];

        $N.getObjectsByTag(tag, function(o) {
            existing.push(o);
        }, function() {
            $N.deleteObjects(existing, callback);
        });
    }        
    $N.deleteObjectsWithTag = deleteObjectsWithTag;

    function noticeAll(l) {
        var i = 0;

        function remaining() {
            if (i < l.length) {
                notice(l[i++], remaining);
            }
        }
        remaining();
    }
    $N.noticeAll = noticeAll;

    
    
    function notice(o, whenFinished, socket) {

        if (o._id)
            delete o._id;

        o = util.objExpand(o);

        var _tag = $N.objTags(o);	//provides an index for faster DB querying ($in)
        if (_tag.length > 0)
            o._tag = _tag;


        //nlog('notice: ' + JSON.stringify(o, null, 4));

        if (o.modifiedAt === undefined)
            o.modifiedAt = o.createdAt;

        //attention.notice(o, 0.1);

        db.obj.update({id: o.id}, o, {upsert: true}, function(err) {
            if (err) {
                nlog('notice: ' + err);
                return;
            }

            $N.add(o);
            
            if (whenFinished)
                whenFinished();
        });

    }
    $N.notice = notice;


    function addProperties(ap) {
        for (var i = 0; i < ap.length; i++) {
            properties[ap[i].uri] = ap[i];
        }

        //TODO broadcast change in properties?
    }
    $N.addProperties = addProperties;

    /*function addTags(at, defaultTag) {
        at.forEach(function(t) {
            if (!t)
                return;

            if (defaultTag)
                t.tag = defaultTag;

            if (!Array.isArray(t.properties)) {
                var propertyArray = [];
                _.each(t.properties, function(prop, uri) {
                    if (prop != null)
                        propertyArray.push(_.extend(prop, {uri: uri}));
                });

                addProperties(propertyArray);
                t.properties = _.keys(t.properties);
            }

            if (tags[t.uri]) {
                if (tags[t.uri].properties) {
                    t.properties = _.union(tags[t.uri].properties, t.properties);
                }
            }

            tags[t.uri] = t;
        });

        //TODO broadcast change in tags?
    }
    $N.addTags = addTags;*/


    //unpacks an array of objects, returning a new array of the unpacked objects, optionally as nobjects
    function unpack(x, notNobject) {
        return x.map(function(y) {
            delete y._id;
            delete y._tag;
            if (notNobject)
                return y;
            return new $N.nobject(y);
        });
    }

    function getObjectByID(uri, whenFinished) {
        /*if ($N.class[uri] != undefined) {
            //it's a tag
            whenFinished(tags[uri]);
        }
        else {*/
        
        db.obj.ensureIndex({id: "hashed"}, function(err, res) {
            if (err) {
                console.error('ENSURE INDEX id', err);
            }

            db.obj.find({'id': uri}, function(err, docs) {
                if (err) {
                    nlog('getObjectByID: ' + err);
                    whenFinished(err, null);
                }
                else if (docs.length == 1) {
                    whenFinished(null, unpack(docs)[0]);                    
                }
                else {
                    //none found
                    whenFinished(true, null);
                }
            });
        });
    }
    $N.getObjectByID = getObjectByID;
    $N.getObjectSnapshot = getObjectByID; //DEPRECATED

    function getObjectsByAuthor(a, withObjects) {

        db.obj.ensureIndex({author: "hashed"}, function(err, res) {
            if (err) {
                console.error('ENSURE INDEX author', err);
                return;
            }

            db.obj.find({author: a}, function(err, docs) {
                if (err) {
                    nlog('getObjectsByAuthor: ' + err);
                    withObjects([]);
                }
                else {
                    withObjects(unpack(docs));                    
                    withObjects(docs);
                }
            });
        });
    }
    $N.getObjectsByAuthor = getObjectsByAuthor;


    function getObjectsByTag(t, withObject, whenFinished) {
        if (!db) { whenFinished(); return; }
        
        //t can be a single string, or an array of strings

        if (!Array.isArray(t))
            t = [t];

        db.obj.ensureIndex({_tag: 1}, function(err, res) {
            if (err) {
                console.error('ENSURE INDEX _tag', err);
            }

            db.obj.find({_tag: {$in: t}}, function(err, docs) {
                if (err) {
                    nlog('getObjectsByTag: ' + err);
                }
                else {
                    docs = unpack(docs);
                    for (var i = 0; i < docs.length; i++) {
                        var d = docs[i];
                        withObject(d);
                    }
                    if (whenFinished)
                        whenFinished();
                }
            });

        });

    }
    $N.getObjectsByTag = getObjectsByTag;


    /*
     function getObjectsByTags(tags, withObjects) {
     db.obj.find({ tag: { $in: tags } }, function(err, docs) {
     
     
     if (!err) {						
     withObjects(docs);
     }		
     else {
     nlog('getObjectsByTags: ' + err);
     }
     });		
     }
     that.getObjectsByTags = getObjectsByTags;
     */


    function refactorObjectTag(fromTag, toTag) {
        var objects = [];
        getObjectsByTag(fromTag, function(x) {
            objects.push(x);
        }, function() {
            _.each(objects, function(o) {
                //console.log('Refactor from:', o);
                util.objRemoveTag(o, fromTag);
                util.objAddTag(o, toTag);
                //console.log('  Refactor to:', o);
                $N.notice(o);
            });
        })
    }
    $N.refactorObjectTag = refactorObjectTag;

    function getTagCounts(whenFinished) {

        db.obj.find(function(err, docs) {
            if (err) {
                nlog('getTagCounts: ' + err);
            }
            else {
                var totals = {};

                docs.forEach(function(d) {
                    var ts = util.objTagStrength(d);
                    for (var dt in ts) {
                        if (totals[dt] == undefined)
                            totals[dt] = 0;
                        totals[dt] += ts[dt];
                    }
                });
            }

            whenFinished(totals);
        });
    }



    //process.stdin.on('keypress', function(char, key) {
    //	  if (key && key.ctrl && key.name == 'c') {
    //   	    nlog('State saved');
    //		saveState();
    //	    process.exit();
    //	  }
    //});

    function finish() {
        saveState(
                function() {
                    nlog("State saved");
                },
                function(err) {
                    nlog("State not save " + err);
                }
        );
        process.exit();
        console.log('FINISHED');
    }

    process.on('SIGINT', finish);
    process.on('SIGTERM', finish);


    function nlog(x) {
        var xs = x;
        if (typeof (x) != "string")
            xs = JSON.stringify(x, null, 4);

        var msg = new Date() + ': ' + xs;

        console.log(x);
    }


    function compactObjects(list) {
        return list.map(util.objCompact);
        
        /*return list.map(function(o) {
            return util.objCompact(o);
        });*/
    }

    function objCanSendTo(o, cid) {
        var ObjScope = util.ObjScope;
        var scope = o.scope || options.client.defaultScope;
        if (scope === ObjScope.ServerSelf) {
            if (o.author)
                return (o.author === cid);
            return true;
        }
        else if (scope === ObjScope.ServerFollow) {
            if (o.author) {
                if (o.author === cid) //self
                    return true;

                var userRelations = $N.getGraphDistances("Trust", $N.userNodeFilter);
                //console.log(userRelations);
                if (userRelations[o.author]) {
                    var dist = userRelations[o.author][cid];
                    if (dist===undefined) return false;
                    dist = dist.distance;
                    if (typeof dist === "number")
                        if ((dist > 0) && (dist < Infinity))
                            return (1.0 / dist) >= $N.server.trustThreshold;
                }
                else
                    return false;
            }
            return true;
        }
        /*else if (scope == ObjScope.Global) {
         }*/
        return true;
    }

    function objAccessFilter(objs, req, withObjects) {
        var cid = getCurrentClientID(req);

        //console.log('objAccessFilter', cid, getClientSelves(req), getSessionKey(req));

        withObjects(_.filter(objs, function(o) {
            return objCanSendTo(o, cid);
        }));
    }


    function getLatestObjects(n, withObjects, withError) {
        db.obj.ensureIndex({modifiedAt: 1}, function(err, eres) {
            if (err) {
                withError('ENSURE INDEX modifiedAt ' + err);
                return;
            }

            //TODO scope >= PUBLIC
            db.obj.find().limit(n).sort({modifiedAt: -1}, function(err, objs) {
                withObjects(objs);
            });
        });
    }
    $N.getLatestObjects = getLatestObjects;
    
    function getExpiredObjects(withObjects) {
        if (!db) return;
        
        db.obj.ensureIndex({modifiedAt: 1}, function(err, eres) {
            if (err) {
                withError('ENSURE INDEX modifiedAt ' + err);
                return;
            }

            var now = Date.now();

            db.obj.find({expiresAt: {$lte: now}}, function(err, objs) {
                if (!err)
                    withObjects(objs);
            });
        });

    }



    // process.on('uncaughtException', function (err) {
    // console.error('An uncaught error occurred!');
    // console.error(err.stack);
    // });
    process.on('uncaughtException', function(err) {
        console.error(err.stack);
    });

    function removeExpired() {
        getExpiredObjects(function(objs) {
            if (objs.length == 0)
                return;
            var ids = _.map(objs, function(o) {
                return o.id;
            });
            deleteObjects(ids);
        });
    }

    function loadPlugins() {
        
        _.each($N.server.plugins, function(po, file) {
            if (po.enable != false)
                startPlugin(file, po);            
        });
    }

    $N.permissions = options.permissions || {};
    $N.enablePlugins = options.plugins || {};
    $N.nlog = nlog;

    removeExpired();

    require('./general.js').plugin($N).start();
    
    loadState(function() {
        //first load existing users
        getObjectsByTag('User', function(to) {    
            $N.add(to);    
        }, function() {
            //then add trust
            getObjectsByTag('Trust', function(to) {
                $N.add(to);    
            }, function() {

                loadPlugins();
                
                if ($N.server.start)
                    $N.server.start($N);

                setInterval(removeExpired, $N.server.memoryUpdateIntervalMS);

            });
            
        });        

    });
    
 
    return $N;

};


