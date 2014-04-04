/*
 Netention Web Server
 
 Know                                  L=========D=========T
 Load_testing                        --|------------------
 Access_control                      ---------|-----------
 MongoDB                             ---------|-----------
 WebSocket                           ----------|----------
 Representational_state_transfer     ------------|--------
 Hypertext_Transfer_Protocol         ------------|--------
 Node.js                             -------------|-------
 JSON                                --------------|------
 JavaScript                          ----------------|----
 */
var memory = require('./memory.js');
var util = require('../client/util.js');
var feature = require('./feature.js');
var expressm = require('express');
var express = expressm();
var connect = require('connect');
var cookie = require('cookie');
var http = require('http')
        , url = require('url')
        , fs = require('fs')
        , sys = require('util')
        , socketio = require('socket.io')
        , nodestatic = require('node-static')
        , server;
var mongo = require("mongojs");
var request = require('request');
var _ = require('underscore');
//var cortexit = require('./cortexit.js');



/** 
 init - callback function that is invoked after the server is created but before it runs 
 */
exports.start = function(options, init) {

    var $N = _.clone(util);
    $N.server = options;

    var focusHistory = [];
    var focusHistoryMaxAge = 24 * 60 * 60; //in seconds


    var tags = {};
    var properties = {};

    var attention = memory.Attention(0.95);

    var logMemory = util.createRingBuffer(256);
    $N.server.interestTime = {};	//accumualted time per interest, indexed by tag URI
    $N.server.clientState = {};	//current state of all clients, indexed by their clientID DEPRECATED

    function getDatabaseURL() {
        //"mydb"; // "username:password@example.com/mydb"
        return $N.server.databaseURL || process.env['MongoURL'];
    }
    var collections = ["obj"];


    function plugin(kv) {
        var v = kv;

        var p = require('../plugin/' + v).plugin;
        if (typeof (p) == "function")
            p = p($N);
        else if (p != undefined) {
            console.error(v + ' plugin format needs upgraded');
        }

        var filename = v;
        v = v.split('.js')[0];
        v = v.split('/netention')[0];

        if (p) {
            if (p.name) {

                var enabled = false;

                if (!$N.server)
                    $N.server = {plugins: {}};

                if (!$N.server.plugins[kv]) {
                    $N.server.plugins[kv] = {
                        valid: true,
                        enabled: false
                    };
                }

                $N.server.plugins[kv].name = p.name;
                $N.server.plugins[kv].description = p.description;
                $N.server.plugins[kv].filename = filename;
                $N.server.plugins[kv].plugin = p;


                //TODO add required plugins parameter to add others besides 'general'
                if (($N.server.plugins[kv].enabled) || (v == 'general')) {
                    $N.nlog('Started plugin: ' + p.name);
                    p.start();
                    enabled = true;
                }

                return;
            }
        }
        $N.server.plugins[v] = {};
        $N.server.plugins[v].name = v;
        $N.server.plugins[v].valid = false;
        $N.server.plugins[v].filename = filename;


        //TODO remove unused $N.server.plugins entries

        //console.log('Loaded invalid plugin: ' + v);
    }
    $N.plugin = plugin;

    function plugins(operation, parameter) {
        var plugins = $N.server.plugins;
        for (var p in plugins) {
            if (plugins[p].enabled) {
                var pp = plugins[p].plugin;
                if (!pp)
                    continue;
                if (pp[operation]) {
                    pp[operation](parameter);
                }
            }
        }
    }
    $N.plugins = plugins;


    function loadState(f) {
        var db = mongo.connect(getDatabaseURL(), collections);

        db.obj.find({tag: {$in: ['ServerState']}}).limit(1).sort({when: -1}, function(err, objs) {
            db.close();

            if (err || !objs)
                nlog("No state found");
            else
                objs.forEach(function(x) {
                    var now = Date.now();
                    nlog('Resuming from ' + (now - x.when) / 1000.0 + ' seconds downtime');
                    $N.server.interestTime = x.interestTime;
                    $N.server.clientState = x.clientState;
                    $N.server.users = x.users || {};
                    $N.server.currentClientID = x.currentClientID || {};
                    //nlog('Users: ' +  _.keys($N.server.users).length + ' ' + _.keys($N.server.currentClientID).length);

                    if (x.plugins) {
                        for (var pl in x.plugins) {
                            if (!$N.server.plugins[pl])
                                $N.server.plugins[pl] = {};
                            if (x.plugins[pl].enabled)
                                $N.server.plugins[pl].enabled = x.plugins[pl].enabled;
                        }
                    }

                    /* logMemory = util.createRingBuffer(256);
                     logMemory.buffer = x.logMemoryBuffer;
                     logMemory.pointer = x.logMemoryPointer;*/


                });

            if (f)
                f();

        });


    }

    function deleteObject(objectID, whenFinished, contentAddedToDeletedObject) {
        attention.remove(objectID);

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

        var db = mongo.connect(getDatabaseURL(), collections);
        db.obj.remove({id: objectID}, function(err, docs) {
            db.close();

            if (err) {
                nlog('error deleting ' + objectID + ':' + err);
                if (whenFinished)
                    whenFinished(err);
            }
            else {
                //broadcast removal of objectID
                pub(objectRemoved(objectID));

                //remove replies                
                var db2 = mongo.connect(getDatabaseURL(), collections);
                db2.obj.remove({replyTo: objectID}, function(err, docs) {
                    db2.close();

                    //nlog('deleted ' + objectID);

                    if (!err) {
                        if (whenFinished)
                            whenFinished();
                    }
                    else {
                        nlog('deleteObject [replies]: ' + err);
                        if (whenFinished)
                            whenFinished(err);
                    }
                });
            }
        });
    }
    $N.deleteObject = deleteObject;

    function deleteObjects(objs, whenFinished) {
        if (objs.length == 0) {
            whenFinished();
            return;
        }
        var that = this;
        function d() {
            var n = objs.pop();

            if (n) {
                that.deleteObject(n.id, d);
            }
            else {
                whenFinished();
            }
        }
        d();
    }
    ;
    $N.deleteObjects = deleteObjects;

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

        var _tag = util.objTags(o);	//provides an index for faster DB querying ($in)
        if (_tag.length > 0)
            o._tag = _tag;

        //nlog('notice: ' + JSON.stringify(o, null, 4));

        if (o.modifiedAt === undefined)
            o.modifiedAt = o.createdAt;

        attention.notice(o, 0.1);

        var db = mongo.connect(getDatabaseURL(), collections);
        db.obj.update({id: o.id}, o, {upsert: true}, function(err) {
            db.close();
            if (err) {
                nlog('notice: ' + err);
                return;
            }

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

    function addTags(at, defaultTag) {
        for (var i = 0; i < at.length; i++) {
            if (defaultTag)
                at[i].tag = defaultTag;

            tags[at[i].uri] = at[i];
        }

        //TODO broadcast change in tags?
    }
    $N.addTags = addTags;

    function subtags(t) {
        return util.subtags(tags, t);
    }
    $N.subtags = subtags;

    //TODO rename: unMongoize
    function removeMongoID(x) {
        if (Array.isArray(x)) {
            for (var i = 0; i < x.length; i++) {
                delete x[i]._id;
                delete x[i]._tag;
                util.objectify(x[i]);
            }
        }
        else {
            removeMongoID([x]);
        }
    }

    function getObjectByID(uri, whenFinished) {
        if (tags[uri] != undefined) {
            //it's a tag
            whenFinished(tags[uri]);
        }
        else {
            var db = mongo.connect(getDatabaseURL(), collections);
            db.obj.ensureIndex({id: "hashed"}, function(err, res) {
                if (err) {
                    console.error('ENSURE INDEX id', err);
                    db.close();
                }

                db.obj.find({'id': uri}, function(err, docs) {
                    db.close();
                    if (err) {
                        nlog('getObjectSnapshot: ' + err);
                        whenFinished(err, null);
                    }
                    else if (docs.length == 1) {
                        removeMongoID(docs);
                        whenFinished(null, docs[0]);
                    }
                    else {
                        //none found
                        whenFinished(true, null);
                    }
                });
            });

        }
    }
    $N.getObjectByID = getObjectByID;
    $N.getObjectSnapshot = getObjectByID; //DEPRECATED

    function getObjectsByAuthor(a, withObjects) {
        var db = mongo.connect(getDatabaseURL(), collections);

        db.obj.ensureIndex({author: "hashed"}, function(err, res) {
            if (err) {
                console.error('ENSURE INDEX author', err);
                db.close();
                return;
            }

            db.obj.find({author: a}, function(err, docs) {
                if (err) {
                    nlog('getObjectsByAuthor: ' + err);
                    withObjects([]);
                }
                else {
                    removeMongoID(docs);
                    withObjects(docs);
                }
                db.close();
            });
        });
    }
    $N.getObjectsByAuthor = getObjectsByAuthor;


    function getObjectsByTag(t, withObject, whenFinished) {
        //t can be a single string, or an array of strings

        if (!Array.isArray(t))
            t = [t];

        var db = mongo.connect(getDatabaseURL(), collections);

        db.obj.ensureIndex({_tag: 1}, function(err, res) {
            if (err) {
                console.error('ENSURE INDEX _tag', err);
                db.close();
            }

            db.obj.find({_tag: {$in: t}}, function(err, docs) {
                if (err) {
                    nlog('getObjectsByTag: ' + err);
                }
                else {
                    docs.forEach(function(d) {
                        removeMongoID(d);
                        withObject(d);
                    });
                    if (whenFinished)
                        whenFinished();
                }
                db.close();
            });

        });

    }
    $N.getObjectsByTag = getObjectsByTag;


    /*
     function getObjectsByTags(tags, withObjects) {
     var db = mongo.connect(getDatabaseURL(), collections);
     db.obj.find({ tag: { $in: tags } }, function(err, docs) {
     
     db.close();
     
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

    function getReport(lat, lon, whenStart, whenStop, withReport) {
        var db = mongo.connect(getDatabaseURL(), collections);

        var histogram = {};
        var numBins = 38;
        var numAnalyzed = 0;

        function getHistogramBin(t) {
            return ((t - whenStart) / (whenStop - whenStart)) * numBins;
        }

        db.obj.find(function(err, docs) {

            if (err) {
                nlog('getReport: ' + err);
            }
            else {
                docs.forEach(function(d) {
                    var t = d.modifiedAt || d.createdAt;

                    if ((t <= whenStop) && (t >= whenStart)) {
                        var a = feature.objAnalysis(d);
                        var bin = parseInt(getHistogramBin(t));
                        for (var k in a) {
                            if (histogram[k] == undefined)
                                histogram[k] = [];
                            if (histogram[k][bin] == undefined)
                                histogram[k][bin] = 0;
                            histogram[k][bin] += a[k];
                        }
                        numAnalyzed++;
                    }
                });
                var x = {
                    id: '@somebody',
                    tStart: whenStart,
                    tStop: whenStop,
                    tSteps: numBins,
                    'numAnalyzed': numAnalyzed,
                    features: histogram,
                    conclusions: [
                        'Person laughs before cursing 60%',
                        'Person is simultaneously questioning and happy 85%',
                    ],
                    suggestions: [
                        'Person should buy <a href="http://www.amazon.com/gp/product/B001OORMVQ/ref=s9_simh_gw_p147_d1_i4?pf_rd_m=ATVPDKIKX0DER&pf_rd_s=center-2&pf_rd_r=1D1EGERGCVBCF3PMGYS7&pf_rd_t=101&pf_rd_p=1389517282&pf_rd_i=507846">SATA Adapter</a>',
                        'Person should talk to @otherperson'
                    ]
                };
                withReport(x);
            }
            db.close();
        });

    }

    function getOperatorTags() {
        return _.filter(_.keys(tags), function(t) {
            return tags[t].operator;
        });
    }
    $N.getOperatorTags = getOperatorTags;

    function refactorObjectTag(fromTag, toTag) {
        var objects = [];
        getObjectsByTag(fromTag, function(x) {
            objects.push(x);
        }, function() {
            _.each(objects, function(o) {
                console.log('Refactor from:', o);
                util.objRemoveTag(o, fromTag);
                util.objAddTag(o, toTag);
                console.log('  Refactor to:', o);
                $N.notice(o);
            });
        })
    }
    $N.refactorObjectTag = refactorObjectTag;

    function getTagCounts(whenFinished) {

        var db = mongo.connect(getDatabaseURL(), collections);
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

            db.close();

            whenFinished(totals);
        });
    }


    function saveState(onSaved, onError) {
        var t = Date.now()

        /*
         logMemoryBuffer = logMemory.buffer;
         logMemoryPointer = logMemory.pointer;*/

        delete $N.server._id;
        $N.server.tag = ['ServerState'];
        $N.server.when = t;


        var db = mongo.connect(getDatabaseURL(), collections);

        db.obj.save($N.server, function(err, saved) {
            db.close();

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



    loadState(function() {
        loadPlugins();
    });

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
        logMemory.push(msg);
    }

    function sendRDF(res, g) {
        res.writeHead(200, {'content-type': 'text/json'});
        //N-Triples
        res.end(g.toNT());
    }

    function sendText(res, t) {
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end(t);
    }

    function sendJSON(res, x, pretty) {
        res.writeHead(200, {'content-type': 'text/json'});
        var p;
        if (!pretty)
            p = JSON.stringify(x);
        else
            p = JSON.stringify(x, null, 4);
        res.end(p);
    }

    http.globalAgent.maxSockets = 256;

    var cookieParser = require('cookie-parser')('netention0');

    //PASSPORT -------------------------------------------------------------- 
    var passport = require('passport')
            , OpenIDStrategy = require('passport-openid').Strategy
            , GoogleStrategy = require('passport-google').Strategy;


    express.use(cookieParser);
    express.use(require('body-parser')());
    //express.use(expressm.methodOverride());
    express.use(require('parted')());
    express.use(require('express-session')({secret: 'secret', key: 'express.sid', cookie: {secure: true}}));
    express.use(passport.initialize());
    express.use(passport.session());
    


    var httpServer = http.createServer(express);

    httpServer.listen($N.server.port);

    nlog('Web server on port ' + $N.server.port);

    var io = socketio.listen(httpServer);

    if (io.enable) {
        io.enable('browser client minification');  // send minified client
        io.enable('browser client etag');          // apply etag caching logic based on version number
        io.enable('browser client gzip');          // gzip the file
    }
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [// enable all transports (optional if you want flashsocket)
        'websocket'
                , 'flashsocket'
                , 'htmlfile'
                , 'xhr-polling'
                , 'jsonp-polling'
    ]);
    io.set("polling duration", 5);

    /*var sessionStore = require('express-session').MemoryStore();
     var SessionSockets = require('session.socket.io')
     , sessionSockets = new SessionSockets(io, sessionStore, cookieParser);*/

    io.set('authorization', function(handshakeData, accept) {

        if (handshakeData.headers.cookie) {

            handshakeData.cookie = cookie.parse(handshakeData.headers.cookie);

            if (handshakeData.cookie['express.sid'])
                handshakeData.sessionID = connect.utils.parseSignedCookie(handshakeData.cookie['express.sid'], 'secret');

            /*if (handshakeData.cookie['express.sid'] == handshakeData.sessionID) {
             return accept('Cookie is invalid.', false);
             }*/

        } else {
            return accept('No cookie transmitted.', false);
        }

        accept(null, true);
    });



    //https://github.com/gevorg/http-authenticate
    var serverPassword = $N.server.password;
    if ((serverPassword) && (serverPassword.length > 0)) {
        var auth = require('http-auth');
        var basicAuth = auth.basic({
            realm: $N.server.name
        }, function(username, password, callback) { // Custom authentication method.
            callback(password === serverPassword);
        }
        );
        express.use(auth.connect(basicAuth));
    }

    var users = {};

    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        done(null, {'id': id});
    });

    passport.use(new OpenIDStrategy({
        returnURL: 'http://' + $N.server.host + '/auth/openid/return',
        realm: 'http://' + $N.server.host + '/'
    },
    function(identifier, done) {
        //console.log(identifier);
        //console.log(done);
        done(null, {id: identifier});
        // User.findOrCreate({ openId: identifier }, function(err, user) {
        // done(err, user);
        // });
    }
    ));

    passport.use(new GoogleStrategy({
        returnURL: 'http://' + $N.server.host + '/auth/google/return',
        realm: 'http://' + $N.server.host + '/'
    },
    function(identifier, profile, done) {
        //console.log(identifier);
        //console.log(done);
        //console.log('google', profile);
        done(null, {id: identifier, email: profile.emails[0].value});
        // User.findOrCreate({ openId: identifier }, function(err, user) {
        // done(err, user);
        // });
    }
    ));



    var getCookies = function(request) {
        var cookies = {};

        if (request.headers.cookie) {
            request.headers && request.headers.cookie.split(';').forEach(function(cookie) {
                var parts = cookie.match(/(.*?)=(.*)$/)
                cookies[ parts[1].trim() ] = (parts[2] || '').trim();
            });
        }
        return cookies;
    };

    express.get('/', function(req, res) {
        //console.log('auth cookie', res.cookie('authenticated'));

        var cookies = getCookies(req);

        var anonymous = false;
        if (req.headers.cookie)
            if (cookies['authenticated'] === 'anonymous')
                anonymous = true;

        var key = getSessionKey(req);

        //Authenticated but no clientID specified
        var cid = getCurrentClientID(key);
        var possibleClients = getClientSelves(key);
        if (possibleClients)
            cid = possibleClients[possibleClients.length - 1];
        else
            possibleClients = [];

        if (!anonymous) {
            res.cookie('authenticated', key != undefined);
        }
        else {
            res.cookie('authenticated', 'anonymous');
        }
        res.cookie('clientID', getCurrentClientID(key));

        res.cookie('otherSelves', possibleClients.join(','));

        res.sendfile('./client/index.html');
    });

    express.get('/anonymous', function(req, res) {
        if (options.permissions.enableAnonymous) {
            res.cookie('authenticated', 'anonymous');
            res.cookie('clientID', '');
            req.session.cookie.expires = false;

            res.redirect("/");
        }
        else
            res.send('Anonymous disabled');

    });
    express.get('/client_configuration.js', function(req, res) {
        var configFile = 'netention.client.js';

        fs.readFile(configFile, 'utf8', function(err, data) {
            if (err) {
                console.error('Missing configuration: ' + configFile);
                return;
            }

            var cc = JSON.stringify(options.client);
            var js = 'var configuration = ' + cc + ';\n';
            js += 'configuration.enableAnonymous=' + options.permissions.enableAnonymous + ';\n';
            js += 'configuration.siteName=\'' + $N.server.name + '\';\n';
            js += 'configuration.siteDescription=\'' + $N.server.description + '\';\n';
            js += data;
            res.send(js);
        });
    });

    // Accept the OpenID identifier and redirect the user to their OpenID
    // provider for authentication.  When complete, the provider will redirect
    // the user back to the application at:
    //     /auth/openid/return
    express.post('/auth/openid', passport.authenticate('openid'));
    // The OpenID provider has redirected the user back to the application.
    // Finish the authentication process by verifying the assertion.  If valid,
    // the user will be logged in.  Otherwise, authentication has failed.
    express.get('/auth/openid/return',
            passport.authenticate('openid', {_successRedirect: '/#', failureRedirect: '/'}),
            function(req, res) {
                res.cookie('userid', req.user.id);
                res.redirect('/#');
            }
    );

    express.get('/auth/google', passport.authenticate('google'));
    express.get('/auth/google/return',
            passport.authenticate('google', {_successRedirect: '/#', failureRedirect: '/'}),
            function(req, res) {
                res.cookie('userid', req.user.id);
                res.redirect('/#');
            }
    );
    // -------------------------------------------------------------- PASSPORT 


    express.all('*', function(req, res, next) {
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
        res.header('Access-Control-Allow-Headers', 'Content-Type');
        next();
    });


    var oneDay = 86400000;
    var oneWeek = 606876923;
    var oneYear = 31557600000;


    var staticContentConfig = {
        //PRODUCTION: oneYear
        maxAge: 0
    };

    //Gzip compression
    if ($N.server.httpCompress)
        express.use(connect.compress());

    //express.use(expressm.staticCache());
    express.use("/plugin", expressm.static('./plugin', staticContentConfig));
    express.use("/doc", expressm.static('./doc', staticContentConfig));
    //express.use("/kml", expressm.static('./client/kml' , staticContentConfig ));
    express.use("/", expressm.static('./client', staticContentConfig));

    express.post('/add/image/gif', function(req, res) {
        var format = req.body.format;
        var imageBase64 = req.body.image;

        imageBase64 = imageBase64.substring('data:image/gif;base64,'.length);

        var buf = new Buffer(imageBase64, 'base64');

        var targetFile = './upload/' + util.uuid() + '.gif';
        var stream = fs.createWriteStream(targetFile);
        stream.once('open', function(fd) {
            stream.write(buf);
            stream.end();
            res.end(targetFile);
        });
    });

    express.post('/upload', function(req, res) {
        //TODO validate permission to upload
        if ((!req.files) || (!req.files.uploadfile) || (!req.files.uploadfile.path)) { 
            res.send('');
            return; 
        }        
        
        var temp_path = req.files.uploadfile.path;
        var save_path = './upload/' + util.uuid() + '_' + req.files.uploadfile.name;

        fs.rename(temp_path, save_path, function(error) {
            if (error) {
                res.send('');
                return;
            }             

            fs.unlink(temp_path, function() {
                if (error)
                    res.send('');
                else
                    res.send(save_path);
            });

        });
    });


    function getSessionKey(req) {
        if (!req)
            return undefined;

        if (typeof req === "string")
            return req;

        var cookies = getCookies(req);
        return cookies['userid'];
    }

    function getCurrentClientID(req) {
        var key = getSessionKey(req);
        if (!key) {
            return 'anonymous';
        }
        else {
            var cid;
            if ($N.server.currentClientID == undefined) {
                $N.server.currentClientID = {};
                $N.server.users = {};
            }

            cid = $N.server.currentClientID[key];

            if (!cid) {
                cid = util.uuid();
                $N.server.users[key] = [cid];
                $N.server.currentClientID[key] = cid;
                saveState();
            }
            return cid;
        }
    }

    function addClientSelf(req, uid) {
        var key = getSessionKey(req);
        if ((!key) || (key == '')) {
            key = 'anonymous';
        }
        if (!$N.server.users)
            $N.server.users = {};

        var ss = $N.server.users[key];
        if (!ss) {
            $N.server.users[key] = [uid];
        }
        else {
            $N.server.users[key].push(uid);
            $N.server.users[key] = _.unique($N.server.users[key]);
        }

        //HACK clean users?

        saveState();

    }
    function getClientSelves(req) {
        if (!$N.server.users)
            $N.server.users = {};

        if (!$N.server.users['anonymous']) {
            $N.server.users['anonymous'] = [];
        }

        var key = getSessionKey(req) || 'anonymous';
        return $N.server.users[key];
    }


    express.get('/log', function(req, res) {
        sendJSON(res, logMemory.buffer);
    });

    function compactObjects(list) {
        return list.map(function(o) {
            return util.objCompact(o);
        });
    }

    /*
     express.get('/object/users/json', function(req, res) {
     var userObjects = [];
     getObjectsByTag('User', function(u) {
     userObjects.push(u);
     }, function() {
     sendJSON(res, compactObjects(userObjects));
     });
     });
     express.get('/users/json', function(req, res) {
     res.redirect('/object/tag/User/json');        
     });*/
    express.get('/object/tag/:tag/json', function(req, res) {
        var tag = req.params.tag;
        if (tag.indexOf(',')) {
            tag = tag.split(',');
        }
        var objects = [];
        getObjectsByTag(tag, function(o) {
            objects.push(o);
        }, function() {
            sendJSON(res, compactObjects(objects));
        });
    });

    express.get('/object/author/:author/json', function(req, res) {
        var author = req.params.author;
        var objects = [];
        getObjectsByAuthor(author, function(objects) {
            sendJSON(res, compactObjects(objects));
        });
    });

    express.get('/object/:uri', function(req, res) {
        var uri = req.params.uri;
        res.redirect('/object.html?id=' + uri);
    });
    express.get('/object/:uri/json', function(req, res) {
        var uri = req.params.uri;
        getObjectSnapshot(uri, function(err, x) {
            if (x)
                sendJSON(res, util.objCompact(x));
            else
                sendJSON(res, ['Unknown', uri]);
        });
    });

    express.get('/object/latest/:num/json', function(req, res) {
        var n = parseInt(req.params.num);
        var db = mongo.connect(getDatabaseURL(), collections);
        db.obj.ensureIndex({modifiedAt: 1}, function(err, eres) {

            if (err) {
                console.error('ENSURE INDEX modifiedAt', err);
                db.close();
                return;
            }

            db.obj.find({tag: {$not: {$in: ['ServerState']}}}).limit(n).sort({modifiedAt: -1}, function(err, objs) {
                removeMongoID(objs);

                sendJSON(res, compactObjects(objs));
                db.close();
            });
        });
    });


    /*express.get('/users/plan', function(req, res) {
     getPlans(function(p) {
     sendJSON(res, p); 
     });
     });*/

    /*express.get('/users/plan/cluster', function(req, res) {
     getPlan(function(p) {
     var kmeans = require('./kmeans.js');           
     sendJSON(res, kmeans.getCentroids(p, 3));
     });
     });*/


    express.get('/users/tag/rdf', function(req, res) {
        var rdfstore = require('rdfstore');
        rdfstore.create(function(store) {
            /*var exampleQuery = 
             'PREFIX n: <http://netention.org/>\
             PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
             PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
             PREFIX : <' + Server.host + '/>\
             INSERT DATA {\
             :alice\
             rdf:type        n:Person ;\
             n:name       "Alice" ;\
             n:mbox       <mailto:alice@work> ;\
             n:knows      :bob ;\
             .\
             :bob\
             rdf:type        n:Person ;\
             n:name       "Bob" ; \
             n:knows      :alice ;\
             n:mbox       <mailto:bob@home> ;\
             .\
             }';
             */
            var objects = [];

            var st = getOperatorTags();
            getObjectsByTag(st, function(o) {
                objects.push(o);
            }, function() {
                //PREFIX : <' + Server.host + '/>\
                var query = '';
                /*'PREFIX n: <http://netention.org/>\
                 PREFIX d: <http://dbpedia.org/resource/>\
                 PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                 INSERT DATA {\n';*/

                var skills = 0; //TODO rename this 'tags'
                var authors = {};
                for (var i = 0; i < objects.length; i++) {
                    var oo = objects[i];
                    var t = util.objTags(oo);

                    var skillLevel, object;
                    for (var w = 0; w < st.length; w++) {
                        if (_.contains(t, st[w])) {
                            skillLevel = st[w];
                            t = _.without(t, st[w]);
                            object = t[0];
                            break;
                        }
                    }
                    if ((skillLevel) && (object)) {
                        skills++;
                        query += '<http://netention.org/' + oo.author + '> <http://netention.org/' + skillLevel + '> <http://dbpedia.org/resource/' + object + '> .\n';
                    }
                    if (authors[oo.author])
                        continue;

                    var authorName = attention.object(oo.author);
                    if (authorName) {
                        authorName = authorName.name; // + (' ' + (authorName.email ? ('<' + authorName.email + '>') : '')); 
                    }
                    else {
                        authorName = "Anonymous";
                    }
                    authors[oo.author] = authorName;
                }
                for (var aid in authors) {
                    var aname = authors[aid];
                    query += '<http://netention.org/' + aid + '> <foaf:name> "' + aname + '".\n';
                }

                sendText(res, query);

            });

        });

    });

    express.post('/read/text', function(req, res) {
        var text = req.body.text;

        //https://www.mashape.com/alchemyapi/alchemyapi-1
        //http://www.alchemyapi.com/api/concept/textc.html
        var alchemyKey = $N.server.permissions['alchemyapi_key'];
        if (alchemyKey) {
            request.post(
                    //'http://access.alchemyapi.com/calls/text/TextGetRankedConcepts',
                    'http://access.alchemyapi.com/calls/text/TextGetRankedKeywords',
                    {
                        form: {
                            apikey: alchemyKey,
                            text: text,
                            maxRetrieve: 128,
                            outputMode: 'json'
                        }
                    },
            function(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var result = JSON.parse(body);
                    //sendJSON(res, result.concepts);
                    sendJSON(res, result.keywords);
                }
                else {
                    sendJSON(res, error);
                }
            }
            );
        }
        else {
            sendJSON(res, "AlchemyAPI not available");
        }

    });

    express.get('/input/geojson/*', function(req, res) {
        var url = req.params[0] || '';

        http.get(url, function(res) {
            //var kml = jsdom(fs.readFileSync(url, 'utf8'));
            var page = '';
            res.on("data", function(chunk) {
                page += chunk;
            });
            res.on('end', function() {
                var tj = require('togeojson'),
                        // node doesn't have xml parsing or a dom. use jsdom
                        jsdom = require('jsdom').jsdom;

                var kml = jsdom(page);
                var converted = tj.kml(kml)['features'];

                var n = 0;
                _.each(converted, function(o) {
                    if (o.type == 'Feature') {
                        /* { type: 'Feature',
                         geometry:
                         { type: 'Point',
                         coordinates: [ -145.1312560955501, 62.3909807260417, 0 ] },
                         properties: { name: 'Power Plants' } } */
                        var id = url + '#' + (n++);
                        var name = '';
                        var coords = null;

                        if (o['geometry']) {
                            if (o['geometry']['coordinates'])
                                coords = o['geometry']['coordinates'];
                        }
                        if (o['properties'])
                            name = o['properties']['name'] || '';

                        var x = util.objNew(id, name);
                        x = util.objAddTag(x, 'Item');
                        x = util.objAddGeoLocation(x, coords[1], coords[0]);
                        pub(x);
                    }
                });

                //var converted_with_styles = tj.kml(page, { styles: true });
                //console.log(converted_with_styles);
            });

        });
    });

    express.get('/ontology/json', function(req, res) {
        sendJSON(res, {'tags': tags, 'properties': properties});
    });

    express.get('/state', function(req, res) {
        sendJSON(res, _.omit($N.server, ['users', 'currentClientID']));
    });
    express.get('/attention', function(req, res) {
        getTagCounts(function(x) {
            sendJSON(res, x, false);
        });
    });
    express.get('/focus/:historyLengthSeconds', function(req, res) {
        var historyLength = req.params.historyLengthSeconds;
        var now = Date.now();
        var oldestAllowedDate = now - historyLength * 1000/*ms*/;

        //remove elements in focusHistory that are older than history_length        
        var result = _.filter(focusHistory, function(f) {
            return f.whenCreated > oldestAllowedDate;
        });

        sendJSON(res, result, false);
    });
    express.get('/save', function(req, res) {
        sendJSON(res, 'Saving');
        saveState(
                function() {
                    nlog('State Saved');
                },
                function(err) {
                    nlog('State Save unccessful: ' + err)
                }
        );
    });
    express.get('/team/interestTime', function(req, res) {
        updateInterestTime();
        sendJSON(res, $N.server.interestTime);
    });
    express.post('/notice', function(request, response) {

        //console.log(request.body.user.name);
        //console.log(request.body.user.email);

    });
    express.get('/logout', function(req, res) {
        res.clearCookie('authenticated');
        res.clearCookie('clientID');
        res.clearCookie('otherSelves');
        res.clearCookie('userid');
        req.logout();
        res.redirect('/');
    });

    express.get('/report', function(req, res) {
        getReport(
                parseFloat(req.query['lat']),
                parseFloat(req.query['lon']),
                parseFloat(req.query['whenStart']),
                parseFloat(req.query['whenStop']),
                function(r) {
                    sendJSON(res, r);
                }
        );
    });


    function returnWikiPage(url, rres, redirector) {
        http.get(url, function(res) {

            if (res.statusCode > 300 && res.statusCode < 400 && res.headers.location) {
                // The location for some (most) redirects will only contain the path,  not the hostname;
                // detect this and add the host to the path.
                var u = res.headers.location;
                var pu = u.indexOf('/wiki/');
                if (pu != -1) {
                    redirector = u.substring(pu + 6);
                    returnWikiPage(u, rres, redirector);
                    return;
                }
            }
            rres.writeHead(200, {'Content-Type': 'text/html'})

            var page = '';
            res.on("data", function(chunk) {
                page += chunk;
            });
            res.on('end', function() {
                var cheerio = require('cheerio');
                var $ = cheerio.load(page);
                $('script').remove();

                {
                    //get the actual wikipage from the page-_____ class added to <body>
                    var bodyclasses = $('body').attr('class').split(' ');
                    for (var i = 0; i < bodyclasses.length; i++) {
                        var bc = bodyclasses[i];
                        if (bc.indexOf('page-') == 0) {
                            redirector = bc.substring(5);
                        }
                    }
                }

                if (redirector)
                    $('#content').append('<div style="display:none" class="WIKIPAGEREDIRECTOR">' + redirector + '</div>');
                rres.write($('#content').html() || $.html());
                rres.end();
            });
        })
                /*.on('error', function(e) {
                 rres.send("Got error: " + e.message);
                 })*/;
    }

    express.get('/wiki/search/:query', function(req, rres) {
        var q = req.params.query;
        returnWikiPage('http://en.wikipedia.org/w/index.php?search=' + q, rres);
    });

    express.get('/wiki/:tag/html', function(req, rres) {
        var t = req.params.tag;
        returnWikiPage("http://en.wikipedia.org/wiki/" + t, rres);
    });
    express.get('/wiki/:tag1/:tag2/html', function(req, rres) {
        var t = req.params.tag1 + '/' + req.params.tag2;
        returnWikiPage("http://en.wikipedia.org/wiki/" + t, rres);
    });




    var channelListeners = {};

    function broadcast(socket, message, whenFinished) {
        notice(message, whenFinished, socket);

        var targets = {};

        /*var ot = util.objTags(message);
        for (var t = 0; t < ot.length; t++) {
            var chan = ot[t];

            var cc;
            if (io.sockets.clients)
                cc = io.sockets.clients(chan);
            else
                cc = io.sockets.sockets;
            
            for (var cck in cc) {
                var i = cc[cck].id;
                if (socket)
                    if (i != socket.id)
                        targets[i] = '';
            }
        }*/

        cmessage = util.objCompact(message);

        for (var t in targets) {
            io.sockets.socket(t).emit('notice', cmessage);
        }
        io.sockets.in('*').emit('notice', cmessage);


        message = util.objectify(util.objExpand(message));

        if (!message.removed)
            plugins("onPub", message);
        else
            plugins("onDelete", message);

    }
    $N.broadcast = broadcast;

    function pub(message, whenFinished) {
        broadcast(null, message, whenFinished);
    }
    $N.pub = pub;


    //    sessionSockets.on('connection', function(err, socket, session) {
    io.sockets.on('connection', function(socket) {
        
        var request;
        if (socket.handshake)
            request = socket.handshake;
        else
            request = socket.conn.request;
        
        var session = getSessionKey(request);
                
        {
            //https://github.com/LearnBoost/socket.io/wiki/Rooms
            socket.on('subscribe', function(channel, sendAll) {
                sub(socket, channel, sendAll);
            });
            socket.on('unsubscribe', function(channel) {
                unsub(socket, channel);
            });

            socket.on('pub', function(message, err, success) {
                if ($N.server.permissions['authenticate_to_create_objects'] != false) {
                    if (!session) {
                        if (err)
                            err('Not authenticated');
                    }
                }

                //var currentUser = getCurrentClientID(session);
                //TODO SECURITY make sure that client actually owns the object. this requires looking up existing object and comparing its author field

                if ((message.focus) && (message.author)) {
                    var m = util.objExpand(message);
                    focusHistory.push(m);

                    plugins('onFocus', m);

                    //remove elements in focusHistory that are older than focusHistoryMaxAge (seconds)
                    var now = Date.now();
                    focusHistory = _.filter(focusHistory, function(f) {
                        return f.whenCreated > (now - focusHistoryMaxAge * 1000);
                    });

                }
                else
                    broadcast(socket, message);

                if (success)
                    success();
            });

            socket.on('getPlugins', function(f) {
                f($N.server.plugins);
            });

            /*socket.on('setPlugin', function(pid, enabled, callback) {
             if ($N.server.permissions['anyone_to_enable_or_disable_plugin'] == false) {
             callback('Plugin enabling and disabling not allowed');
             return;
             }
             if ($N.server.permissions['authenticate_to_configure_plugins'] != false) {
             if (!isAuthenticated(session)) {
             callback('Unable to configure plugins (not logged in)');
             return;
             }
             }
             
             var pm = $N.server.plugins[pid];
             if (pm) {
             if (!(pm.valid == false)) {
             var currentState = pm.enabled;
             if (currentState != enabled) {
             if (enabled) {
             pm.enabled = true;
             if (pm.start)
             pm.start();
             nlog('Plugin ' + pid + ' enabled');
             }
             else {
             pm.enabled = false;
             if (pm.stop)
             pm.stop();
             nlog('Plugin ' + pid + ' disabled');
             }
             saveState(function() {
             //nlog('saved state');                            
             }, function(err) {
             nlog('error saving state on plugin activation');
             nlog(err);
             });
             callback();
             return;
             }
             }
             }
             callback('Unable to set activity of plugin ' + pid + ' to ' + enabled);
             
             });*/

            socket.on('become', function(target, onResult) {
                var targetObjectID = target;
                var targetObject = target;
                if (typeof (target) === "string") {
                    targetObjectID = target;
                    targetObject = null;
                }
                else {
                    targetObjectID = target.id;
                }

                function pubAndSucceed(x) {
                    pub(x, function() {
                        addClientSelf(request, targetObjectID);
                        saveState();
                        if (onResult)
                            onResult(targetObjectID);
                    });
                }

                var keyRequired = ($N.server.permissions['authenticate_to_create_profiles'] != false);
                if (!targetObject) {
                    var selves = getClientSelves(session);
                    if (_.contains(selves, target)) {
                        if (onResult)
                            onResult(targetObjectID);
                    }
                    else {
                        if (keyRequired) {
                            if (onResult)
                                onResult(null); //not the author
                        }
                        else {
                            pubAndSucceed(targetObject);
                        }
                    }

                }
                else {

                    if ((keyRequired && session) || (!keyRequired)) {
                        pubAndSucceed(targetObject);
                    }
                    else {
                        if (onResult)
                            onResult();
                    }
                }

            });

            socket.on('connectID', function(cid, callback) {
                var key = null, email = null;

                var key = getSessionKey(request);
                if (!cid) {
                    //Authenticated but no clientID specified
                    cid = getCurrentClientID(key);
                    if (!cid) {
                        var possibleClients = getClientSelves(key);
                        if (possibleClients)
                            cid = possibleClients[possibleClients.length - 1];
                    }
                }
                else {
                    //Authenticated and clientID specified, check that the user actually owns that clientID
                    var possibleClients = getClientSelves(key);
                    if (possibleClients) {
                        if (_.contains(possibleClients, cid)) {
                        }
                        else {
                            cid = possibleClients[possibleClients.length - 1];
                        }
                    }
                }

                var selves = getClientSelves(key);
                nlog('connect: ' + cid + ', ' + key + ', ' + selves);

                var tagsAndTemplates = [];
                getObjectsByTag(['Tag', 'Template'], function(o) {
                    tagsAndTemplates.push(o);
                }, function() {
                    if (tagsAndTemplates.length > 0)
                        socket.emit('notice', tagsAndTemplates);                    
                });

                /*getObjectsByTag('User', function(to) {
                 socket.emit('notice', to);
                 });*/

                /*getObjectsByAuthor(cid, function(uo) {
                    socket.emit('notice', uo);
                });*/

                callback(cid, key, selves);

            });

            socket.on('updateSelf', function(s, getObjects) {
                socket.get('clientID', function(err, c) {
                    if (c == null) {
                        socket.emit('reconnect');
                    }
                    else {
                        socket.clientID = c;

                        notice(s);

                        //broadcast client's self
                        socket.broadcast.emit('notice', s);

                        s.created = Date.now();
                        updateInterests(c, s, socket, getObjects);
                    }
                });
            });

            /*
             socket.on('getSentencized', function(urlOrText, withResult) {
             cortexit.getSentencized(urlOrText, withResult);
             });
             */

            socket.on('getObjects', function(query, withObjects) {
                var db = mongo.connect(getDatabaseURL(), collections);
                db.obj.find(function(err, docs) {
                    removeMongoID(docs);
                    withObjects(docs);
                    db.close();
                });
            });

            socket.on('delete', function(objectID, whenFinished) {
                /*if ($N.server.permissions['authenticate_to_delete_objects'] != false) {
                 if (!isAuthenticated(session)) {
                 whenFinished('Unable to delete (not logged in)');
                 return;
                 }
                 }*/

                if (!util.isSelfObject(objectID)) {
                    deleteObject(objectID, whenFinished);
                    whenFinished(null);
                }
                else {
                    var os = getClientSelves(session);
                    if (_.contains(os, objectID)) {
                        deleteObject(objectID, whenFinished);
                        whenFinished(null);
                    }
                    else {
                        whenFinished('Unable to delete user profile');
                    }
                }
            });

        }


    });



    function updateInterestTime() {
        //reprocess all clientState's to current time
        for (c in $N.server.clientState) {
            var cl = $N.server.clientState[c];
            updateInterests(c, cl);
        }
    }

    function sub(socket, channel, sendExisting) {
        //nlog(socket.clientID + ' subscribed ' + channel );
        
        socket.join(channel);

        if (sendExisting) {
            var objects = [];
            getObjectsByTag(channel, function(o) {
                objects.push(o);
            }, function() {
                if (objects.length > 0)
                    socket.emit('notice', objects);                
            });
        }
    }
    
    function unsub(socket, channel) {
        nlog(socket.clientID + ' unsubscribed ' + channel);
        socket.leave(channel);
    }

    function interestAdded(socket, interest) {
        sub(socket, interest, true);
    }
    function interestRemoved(socket, interest) {
        unsub(socket, interest);
    }

    function updateInterests(clientID, state, socket, resubscribe) {
        var prevState = $N.server.clientState[clientID];
        var now = Date.now();

        if (!prevState) {
            prevState = {interests: {}, when: new Date().getTime()};
        }

        var addends = {};

        for (var k in state.interests) {
            var v = state.interests[k];

            if (prevState.interests == undefined)
                prevState.interests = {};

            var pv = prevState.interests[k];

            if (resubscribe) {
                if (socket)
                    interestAdded(socket, k);
            }
            if (pv == undefined) {
                pv = 0;
                if (socket)
                    if (!resubscribe)
                        interestAdded(socket, k);
            }

            else {
                var averageInterest = (v + pv) / 2.0;
                if ($N.server.interestTime[k] == undefined)
                    $N.server.interestTime[k] = 0;
                addends[k] = (now - prevState.when) / 1000.0 * averageInterest;
            }
        }
        for (var k in prevState.interests) {
            var v = state.interests[k];
            var pv = prevState.interests[k];
            if (v == undefined) {
                v = 0;
                var averageInterest = (v + pv) / 2.0;
                if ($N.server.interestTime[k] == undefined)
                    $N.server.interestTime[k] = 0;
                addends[k] = (now - prevState.when) / 1000.0 * averageInterest;

                if (socket)
                    interestRemoved(socket, k);
            }

        }
        var addendSum = 0;
        for (k in addends) {
            addendSum += addends[k];
        }
        for (k in addends) {
            var a = addends[k];
            if ($N.server.interestTime[k] == undefined)
                $N.server.interestTime[k] = 0;
            $N.server.interestTime[k] += a / addendSum;
        }


        state.when = now;
        $N.server.clientState[clientID] = state;

    }

    // process.on('uncaughtException', function (err) {
    // console.error('An uncaught error occurred!');
    // console.error(err.stack);
    // });
    process.on('uncaughtException', function(err) {
        console.error(err.stack);
    });

    getObjectsByTag('User', function(to) {
        notice(to);
    });


    $N.client = options.client || {};
    $N.permissions = options.permissions || {};
    $N.enablePlugins = options.plugins || [];

    //setInterval(attention.update, Server.memoryUpdatePeriodMS);

    require('./general.js').plugin($N).start();


    $N.nlog = nlog;
    $N.plugin = function(pluginfile, forceEnable) {
        plugin(pluginfile, forceEnable);
    };
    $N.saveState = saveState;

    function loadPlugins() {
        if ($N.enablePlugins) {
            _.each($N.enablePlugins, function(x) {
                if (!$N.server.plugins[x])
                    $N.server.plugins[x] = {};

                $N.server.plugins[x].enabled = true;
            });
        }

        fs.readdirSync("./plugin").forEach(function(ifile) {
            var file = ifile + '';
            if (file === 'README')
                return;

            if (file.indexOf('.js') == -1) {//avoid directories
                file = file + '/netention.js';
            }

            plugin(file);
        });
    }

    nlog('Ready');

    if (init)
        init($N);

    if ($N.server.start)
        $N.server.start($N);

    return $N;

};

