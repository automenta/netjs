var memory = require('./memory.js');
var util = require('../client/util.js');
var feature = require('./feature.js');
//var cortexit = require('./cortexit.js');
var expressm = require('express');
var express = expressm();
var connect = require('connect');
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



function plugin(netention, kv) {
    var v = kv;
    var p = require('../plugin/' + v).plugin;
    var filename = v;
    v = v.split('.js')[0];
    v = v.split('/netention')[0];

    if (p) {
        if (p.name) {

            var enabled = false;

			if (!netention.server)
				netention.server = { plugins: { } };

            if (!netention.server.plugins[kv]) {
                netention.server.plugins[kv] = {
                    valid: true,
                    enabled: false
                };
            }

            netention.server.plugins[kv].name = p.name;
            netention.server.plugins[kv].description = p.description;
            netention.server.plugins[kv].filename = filename;


            //TODO add required plugins parameter to add others besides 'general'
            if ((netention.server.plugins[kv].enabled) || (v == 'general')) {
                p.start(netention, util);
                enabled = true;
            }

            if (enabled) {
                netention.nlog('Started plugin: ' + p.name);
            }
            else {
                //netention.nlog('Disabling plugin: ' + p.name);
            }

            return;
        }
    }
    netention.server.plugins[v] = {};
    netention.server.plugins[v].name = v;
    netention.server.plugins[v].valid = false;
    netention.server.plugins[v].filename = filename;


    //TODO remove unused Server.plugins entries

    //console.log('Loaded invalid plugin: ' + v);
}
exports.plugin = plugin;

/**
 * init - callback function that is invoked after the server is created but before it runs
 */
exports.start = function(options, init) {

    var Server = options;

    var focusHistory = [ ];
    var focusHistoryMaxAge = 24*60*60; //in seconds
    
    var that = {};

    var tags = {};
    var properties = {};

    var attention = memory.Attention(0.95);

    var logMemory = util.createRingBuffer(256);
    Server.interestTime = {};	//accumualted time per interest, indexed by tag URI
    Server.clientState = {};	//current state of all clients, indexed by their clientID DEPRECATED

    function getDatabaseURL() {
        //"mydb"; // "username:password@example.com/mydb"
        return Server.databaseURL || process.env['MongoURL'];
    }
    var collections = ["obj"];

    
    function _updateCentroids() {
        //remove old centroids
        var objs = [];
        getObjectsByTag('PlanCentroid', function(o) {      
            objs.push(o);
        }, function() {
            //TODO create deleteObjects function that does this
            function d() {
                var n = objs.pop();
                if (n) {
                    //console.log('  deleting: ', objs.length);
                    deleteObject(n.id, d);
                }     
                //whenFinished()
                else {
                    getPlans(function(p) {            

                        if (p.length < 2)
                            return;

                        var kmeans = require('./kmeans.js');
                        var centroids = Math.floor(Math.pow(p.length, 0.55)); //a sub-exponential curve, steeper than log(x) and sqrt(x)
                        var c = kmeans.getSpaceTimeTagCentroids(p, centroids);


                        for (var i = 0; i < c.length; i++) {
                            var cc = c[i];

                            var x = util.objNew();
                            x.name = 'Possible Meeting #' + (i+1);
							x.when = cc.time;
                            util.objAddTag(x, 'Goal');                            
							util.objAddGeoLocation(x, parseFloat(cc.location[0]), parseFloat(cc.location[1]));
                            //util.objSetWhen(x, new Date(cc.time)); 
                            util.objAddTag(x, 'Imaginary');
                            util.objAddTag(x, 'PlanCentroid');					

                            delete cc.location;
                            delete cc.time;
                            util.objAddDescription(x, JSON.stringify(cc, null, 4));

                            pub(x);
                        }
                    });
                    
                }
            }
            d();
        });
        
    }
    var updateCentroids = _.throttle(_updateCentroids, 2000);
    
    function onSelfChange(s) {
        updateCentroids();
    }
    

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
                    Server.interestTime = x.interestTime;
                    Server.clientState = x.clientState;
                    Server.users = x.users || { };
                    Server.currentClientID = x.currentClientID || { };

                    if (x.plugins) {
                        for (var pl in x.plugins) {
                            if (!Server.plugins[pl])
                                Server.plugins[pl] = {};
                            if (x.plugins[pl].enabled)
                                Server.plugins[pl].enabled = x.plugins[pl].enabled;
                        }
                    }

                    /* logMemory = util.createRingBuffer(256);
                     logMemory.buffer = x.logMemoryBuffer;
                     logMemory.pointer = x.logMemoryPointer;*/

                    //nlog("State loaded");
                    //nlog(Server);

                });

            if (f)
                f();

        });


    }

    function deleteObject(objectID, whenFinished) {
        attention.remove(objectID);

        function objectRemoved(uri) {
            return {
                'id': uri,
                'removed': true
            };
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
                    
                    nlog('deleted ' + objectID);

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
    that.deleteObject = deleteObject;

    function noticeAll(l) {
        var i = 0;

        function remaining() {
            if (i < l.length) {
                notice(l[i++], remaining);
            }
        }
        remaining();
    }
    that.noticeAll = noticeAll;

    function notice(o, whenFinished, socket) {       

        if (o._id)
            delete o._id;

        o = util.objExpand(o);

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

            if (o.id) {
                if (o.id.indexOf) {
                    if (o.id.indexOf('Self-')==0) {
                        onSelfChange(o);
                    }
                }
            }
            
            if (whenFinished)
                whenFinished();
        });

    }
    that.notice = notice;


    function addProperties(ap) {
        for (var i = 0; i < ap.length; i++) {
            properties[ap[i].uri] = ap[i];
        }

        //TODO broadcast change in properties?
    }
    that.addProperties = addProperties;

    function addTags(at, defaultTag) {
        for (var i = 0; i < at.length; i++) {
            if (defaultTag)
                at[i].tag = defaultTag;

            tags[at[i].uri] = at[i];
        }

        //TODO broadcast change in tags?
    }
    that.addTags = addTags;

    function removeMongoID(x) {
        if (Array.isArray(x)) {
            for (var i = 0; i < x.length; i++)
                delete x[i]._id;
        }
        else
            delete x._id;
    }
    
    function getObjectSnapshot(uri, whenFinished) {
        if (tags[uri] != undefined) {
            //it's a tag
            whenFinished(tags[uri]);
        }
        else {
            var db = mongo.connect(getDatabaseURL(), collections);
            db.obj.find({'id': uri}, function(err, docs) {
                db.close();
                if (err) {
                    nlog('getObjectSnapshot: ' + err);
                    whenFinished(err);
                }
                else {
                    whenFinished(docs);
                }
            });
        }

    }

    function getObjectsByAuthor(a, withObjects) {
        var db = mongo.connect(getDatabaseURL(), collections);
        db.obj.find({author: a}, function(err, docs) {
            if (err) {
                nlog('getObjectsByAuthor: ' + err);
            }
            else {
                removeMongoID(docs);
                withObjects(docs);
            }
            db.close();
        });
    }
    that.getObjectsByAuthor = getObjectsByAuthor;

    //TODO optimize this to use a tag cache property
    function getObjectsByTag(t, withObject, whenFinished) {
        //t can be a single string, or an array of strings
        
        var db = mongo.connect(getDatabaseURL(), collections);

		/*
		var finished = false;
        var oldClose = db.close;
        db.close = function() {
			if (finished)
	            if (whenFinished)
    	            whenFinished();
			if (oldClose)
		        oldClose();
        }*/
                
        //db.obj.find({ tag: { $in: [ t ] } }, function(err, docs) {
        db.obj.find(function(err, docs) {

            if (err) {
                nlog('getObjectsByTag: ' + err);
            }
            else {
                docs.forEach(function(d) {
                    if (util.objHasTag(d, t)) {
                        removeMongoID(d);
                        withObject(d);
                    }
                });
				finished = true;
				if (whenFinished)
					whenFinished();
            }
            db.close();
        });
    }
    that.getObjectsByTag = getObjectsByTag;



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

        delete Server._id;
        Server.tag = ['ServerState'];
        Server.when = t;


        var db = mongo.connect(getDatabaseURL(), collections);

        db.obj.save(Server, function(err, saved) {
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
        if (typeof(x) != "string")
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

    var httpServer = http.createServer(express);

    httpServer.listen(Server.port);

    nlog('Web server on port ' + Server.port);

    var io = socketio.listen(httpServer);

    io.enable('browser client minification');  // send minified client
    io.enable('browser client etag');          // apply etag caching logic based on version number
    io.enable('browser client gzip');          // gzip the file
    io.set('log level', 1);                    // reduce logging
    io.set('transports', [// enable all transports (optional if you want flashsocket)
        'websocket'
                , 'flashsocket'
                , 'htmlfile'
                , 'xhr-polling'
                , 'jsonp-polling'
    ]);
    io.set("polling duration", 5);

    var cookieParser = expressm.cookieParser('netention0')
            , sessionStore = new connect.middleware.session.MemoryStore();
    var SessionSockets = require('session.socket.io')
            , sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

    //PASSPORT -------------------------------------------------------------- 
    var passport = require('passport')
            , OpenIDStrategy = require('passport-openid').Strategy
            , GoogleStrategy = require('passport-google').Strategy;

    /*
    var users = { };
    
    passport.serializeUser(function(user, done) {
        done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
        var i = users[id];
        if (!i) {
            i = {
                'id': id
            };
            users[id] = i;
        }
        done(null, i);
    });
    */

    express.configure(function() {
        express.use(cookieParser);
        express.use(expressm.bodyParser());
        express.use(expressm.session({store: sessionStore}));
        express.use(passport.initialize());
        express.use(passport.session());
        express.use(express.router);
    });
    
    var users = { };
    

    passport.serializeUser(function(user, done) {
      done(null, user.id);
    });

    passport.deserializeUser(function(id, done) {
      done(null, { 'id': id });
    });

    passport.use(new OpenIDStrategy({
            returnURL: 'http://' + Server.host + '/auth/openid/return',
            realm: 'http://' + Server.host + '/'
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
            returnURL: 'http://' + Server.host + '/auth/google/return',
            realm: 'http://' + Server.host + '/'
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
        
    express.get('/anonymous', function(req,res) {
		if (options.permissions.enableAnonymous) {			
		    res.cookie('authenticated', 'anonymous');
		    res.cookie('clientID', '');
		    req.session.cookie.expires = false;
		    //res.redirect('/');  
	        res.sendfile('./client/index.html');
		}
		else
			res.send('Anonymous disabled');
        
    });
    express.get('/client_configuration.js', function(req, res) {        
		var configFile = 'netention.client.js';

		fs.readFile(configFile, 'utf8', function (err,data) {
		  	if (err) {
				console.error('Missing configuration: ' + configFile);
				return;
			}
			var cc = JSON.stringify( options.client );
			var js = 'var configuration = ' + cc + ';\n';
			js += 'configuration.enableAnonymous=' + options.permissions.enableAnonymous + ';\n';
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
            passport.authenticate('openid', {successRedirect: '/#/reconnect',
        failureRedirect: '/'}));

    express.get('/auth/google', passport.authenticate('google'));
    express.get('/auth/google/return',
            passport.authenticate('google', {successRedirect: '/#/reconnect',
        failureRedirect: '/'}));
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
    express.use(connect.compress());
    //express.use(expressm.staticCache());
    express.use("/plugin", expressm.static('./plugin' , staticContentConfig ));
    express.use("/doc", expressm.static('./doc' , staticContentConfig ));
    //express.use("/kml", expressm.static('./client/kml' , staticContentConfig ));
    express.use("/", expressm.static('./client' , staticContentConfig));        

    express.post('/upload', function(req, res) {
        //TODO validate permission to upload

        var temp_path = req.files.uploadfile.path;
        var save_path = './upload/' + util.uuid() + '_' + req.files.uploadfile.name;

        fs.rename(temp_path, save_path, function(error) {
            if (error)
                throw error;

            fs.unlink(temp_path, function() {
                if (error)
                    throw error;
                //res.send("File uploaded to: <a href='" + save_path + "'>here</a>.");
                res.send(save_path);
            });

        });
    });
    
    function getSessionKey(session) {
        var key;
        if (session)
            if (session.passport)
                if (session.passport.user) {
                    key = session.passport.user;
               }
       if (key) {
           return key;
       }
       return 'null';         //anonymous?
    }
    
    function getCurrentClientID(session) {
        var key = getSessionKey(session);
        var cid;
        if (key) {
            if (Server.currentClientID) {
                cid = Server.currentClientID[key];
            }
            else {
                Server.currentClientID = { };
                Server.users = { };
                cid = null
            }
            
            if (!cid) {
                cid = util.uuid();
                Server.users[key] = [ cid ];
                Server.currentClientID[key] = cid;
                saveState();
            }
        }
        else {
            return '';
        }
    }
    function addClientSelf(session, uid) {
        var key = getSessionKey(session);
        if (!key) {
            key = 'anonymous';
        }
        if (!Server.users)
            Server.users = { };
        
        var ss = Server.users[key];
        if (!ss) {
            Server.users[key] = [uid];
        }
        else {
            Server.users[key].push(uid);            
        }
        
        //HACK clean users?
        
        saveState();       
        
    }
    function getClientSelves(session) {
        if (!Server.users)
            return Server.users = { };
        
        if (!session) {
            if (!Server.users['anonymous']) {
                Server.users['anonymous'] = [ ];
            }
            return Server.users['anonymous'];
        }
        
        var key = getSessionKey(session);        
        if (key) {
            var selves = Server.users[key];
            return selves;
        }
        else {
            return [];
        }
    }
   /*function getClientID(session) {
        var cid = '';
        var key;
        if (session)
            if (session.passport)
                if (session.passport.user) {
                    key = session.passport.user;
               }
       if (key)
           cid = util.MD5(key);
       return cid;
    } */               
    

    express.get('/', function(req, res) {
        //console.log('auth cookie', res.cookie('authenticated'));
        
        var anonymous = false;
        if (req.headers.cookie)
            if (res.cookie('authenticated') === 'anonymous')
                anonymous = true;
        
        if (!anonymous)
            res.cookie('authenticated', isAuthenticated(req.session));
        
        res.cookie('clientID', getCurrentClientID(req.session));
        res.sendfile('./client/index.html');
    });
    
    /*
     express.get('/http/:url', function (req, res) {
     if (Server.permissions['authenticate_to_proxy_http']!=false) {
     if (!isAuthenticated(req.session)) {
     res.send('Authentication required');
     }
     }
     
     var uri = decodeURIComponent(req.params.url);
     request(uri, function (error, response, body) {
     res.setHeader('Content-type', 'text/plain');
     if (!error)  {
     res.send(response.body);
     }
     else {
     res.send(error);
     }
     });    
     });
     */

    express.get('/log', function(req, res) {
        sendJSON(res, logMemory.buffer);
    });
    express.get('/object/latest/:num/json', function(req, res) {
        var n = parseInt(req.params.num);
        var db = mongo.connect(getDatabaseURL(), collections);
        db.obj.find().limit(n).sort({modifiedAt: -1}, function(err, objs) {
            removeMongoID(objs);
            
            function compactObjects(list) {
                return _.map(list,  function(o) { return util.objCompact(o); } );
            }
            
            sendJSON(res, compactObjects(objs));
            db.close();
        });
    });
    
    function getPlans(withPlan) {
        var allPlan = [];
        var now = Date.now();
        getObjectsByTag('Goal', function(t) {
            var tt = t.when;
			if (!t.when)
				return;
			if (tt < now)
				return;
            var lat = null;
            var lon = null;
            var geo = util.objSpacePoint(t);
            if (geo) {
                lat = geo.lat;
                lon = geo.lon;
            }
			var tags = util.objTags(t);
            allPlan.push([util._n(lat, 4), util._n(lon, 4), tt, tags, t]);
        }, function() {
            withPlan(allPlan);
        });        
    }
    
    express.get('/users/plan', function(req, res) {
        getPlans(function(p) {
           sendJSON(res, p); 
        });
    });
    /*express.get('/users/plan/cluster', function(req, res) {
        getPlan(function(p) {
           var kmeans = require('./kmeans.js');           
           sendJSON(res, kmeans.getCentroids(p, 3));
        });
    });*/
    express.get('/users/json', function(req, res) {
       res.redirect('/tag/User/json');        
    });
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

            var tagMap = {
                'BeginnerStudent': '#AFE500',
                'IntermediateStudent': '#E9EA08',
                'CollaboratingStudent': '#EFBB11',
                'CollaboratingTeacher': '#F48E1A',
                'IntermediateTeacher': '#F96324',
                'ExpertTeacher': '#FF3B2E',
                'Not' : '', 'Can' : '', 'Need' : ''                
            };
            var st = _.keys(tagMap);

            getObjectsByTag(st, function(o) {
                objects.push(o);
            }, function() {
                       //PREFIX : <' + Server.host + '/>\
                var query = '';
                       /*'PREFIX n: <http://netention.org/>\
                        PREFIX d: <http://dbpedia.org/resource/>\
                        PREFIX zertify: <http://zertify.org/>\
                        PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
                        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
                        INSERT DATA {\n';*/

                var skills = 0; //TODO rename this 'tags'
                var authors = { };
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
                        query += '<http://netention.org/' + oo.author + '> <http://zertify.com/' + skillLevel + '> <http://dbpedia.org/resource/' + object + '> .\n'; 
                    }
                    if (authors[oo.author])
                        continue;
                    
                    var authorName = attention.object('Self-'+oo.author);
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
    express.get('/tag/:tag/json', function(req, res) {
        var tag = req.params.tag;
        if (tag.indexOf(',')) {
            tag = tag.split(',');
        }
        var objects = [];
        getObjectsByTag(tag, function(o) {
            objects.push(o);
        }, function() {
            sendJSON(res, objects);
        });
    });
    express.get('/object/:uri', function(req, res) {
        var uri = req.params.uri;
        res.redirect('/object.html?id=' + uri);
    });
    express.get('/object/:uri/json', function(req, res) {
        var uri = req.params.uri;
        getObjectSnapshot(uri, function(x) {
            sendJSON(res, x);
        });
    });
    express.get('/input/geojson/*', function(req, res) {
		var url = req.params[0] || '';

        http.get(url, function(res) {
			//var kml = jsdom(fs.readFileSync(url, 'utf8'));
            var page = '';
            res.on("data", function(chunk) { page += chunk;  });
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
        sendJSON(res, { 'tags': tags, 'properties': properties } );
    });

    express.get('/state', function(req, res) {
        sendJSON(res, _.omit(Server, ['users','currentClientID']));
    });
    express.get('/attention', function(req, res) {
        getTagCounts(function(x) {
            sendJSON(res, x, false);
        });
    });
    express.get('/focus/:historyLengthSeconds', function(req, res) {        
        var historyLength = req.params.historyLengthSeconds;
        var now = Date.now();
        var oldestAllowedDate = now - historyLength*1000/*ms*/;
        
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
        sendJSON(res, Server.interestTime);
    });
    express.post('/notice', function(request, response) {

        //console.log(request.body.user.name);
        //console.log(request.body.user.email);

    });
    express.get('/logout', function(req, res) {
        res.cookie('authenticated', '');
        res.cookie('clientID', 'undefined');
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
                if (pu!=-1) {
                    redirector = u.substring(pu + 6);
                    returnWikiPage(u, rres, redirector);
                    return;
                }
            }
            rres.writeHead(200, {'Content-Type': 'text/html' })

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

        var ot = util.objTags(message);
        for (var t = 0; t < ot.length; t++) {
            var chan = ot[t];

            var cc = io.sockets.clients(chan);
            for (var cck in cc) {
                var i = cc[cck].id;
                if (socket)
                    if (i != socket.id)
                        targets[i] = '';
            }
        }
        
        message = util.objCompact(message);


        for (var t in targets) {
            io.sockets.socket(t).emit('notice', message);
        }
        io.sockets.in('*').emit('notice', message);

		var plugins = that.plugins;
        for (var p in plugins) {
            var pp = plugins[p];
            if (Server.plugins[p].enabled) {
                if (pp.notice) {
                    pp.notice(message);
                }
            }
        }
    }
    that.broadcast = broadcast;

    function pub(message, whenFinished) {
        broadcast(null, message, whenFinished);
    }
    that.pub = pub;

    function isAuthenticated(ses) {           
        if (ses)
            if (ses.passport)
                if (ses.passport.user) {
                    return true;
                }
        return false;

    }

    sessionSockets.on('connection', function(err, socket, session) {

        //https://github.com/LearnBoost/socket.io/wiki/Rooms
        socket.on('subscribe', function(channel, sendAll) {
            sub(socket, channel, sendAll);
        });
        socket.on('unsubscribe', function(channel) {
            unsub(socket, channel);
        });

        socket.on('pub', function(message, err, success) {
            if ((message.focus) && (message.author)) {
                var m = util.objExpand(message);
                focusHistory.push(m);

                console.log('Focus', m.author, m.value);
                
                //remove elements in focusHistory that are older than focusHistoryMaxAge (seconds)
                var now = Date.now();
                focusHistory = _.filter(focusHistory, function(f) {
                    return f.whenCreated > (now - focusHistoryMaxAge*1000); 
                });
        
            }
            
            
            if (Server.permissions['authenticate_to_create_objects'] != false) {
                if (!isAuthenticated(session)) {
                    if (err)
                        err('Not authenticated');
                }
            }
            broadcast(socket, message);
            if (success)
                success();
        });

        socket.on('getPlugins', function(f) {
            f(Server.plugins);
        });

        socket.on('setPlugin', function(pid, enabled, callback) {
			if (Server.permissions['anyone_to_enable_or_disable_plugin'] == false) {
                callback('Plugin enabling and disabling not allowed');
                return;
			}
            if (Server.permissions['authenticate_to_configure_plugins'] != false) {
                if (!isAuthenticated(session)) {
                    callback('Unable to configure plugins (not logged in)');
                    return;
                }
            }

            var pm = Server.plugins[pid];
            if (pm) {
                if (!(pm.valid == false)) {
                    var currentState = pm.enabled;
                    if (currentState != enabled) {
                        if (enabled) {
                            pm.enabled = true;
							if (pm.start)
	                            pm.start(that, util);
                            nlog('Plugin ' + pid + ' enabled');
                        }
                        else {
                            pm.enabled = false;
							if (pm.stop)
	                            pm.stop(that);
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

        });

        socket.on('become', function(target, onResult) {
            var targetObjectID = target;
            var targetObject = target;
            if (typeof(target)==="string") {
                targetObjectID = 'Self-' + target; 
                targetObject = null;
            }                      
            else {
                targetObjectID = target.id;
            }
            
            function pubAndSucceed(x) {
                pub(x, function() {
                    addClientSelf(session, targetObjectID);
                    saveState();
                    if (onResult)
                        onResult(targetObjectID);           
                });                
            }
            
            var sessionKey = getSessionKey(session);
            var keyRequired = (Server.permissions['authenticate_to_create_profiles']!=false);
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

                if ((keyRequired && sessionKey) || (!keyRequired)) {
                    pubAndSucceed(targetObject);
                }
                else {
                    if (onResult)
                        onResult();
                }
            }

        });
        
        socket.on('connect', function(cid, callback) {
            var key = null, email = null;
            if (session) {
                if (session.passport) {
                    if (session.passport.user) {
                        key = session.passport.user.id;
                        email = session.passport.user.email;
                    }
                }
            }
            {
                if (!cid) {
                    //Authenticated but no clientID specified
                    cid = getCurrentClientID(session);
                    if (!cid) {
                        var possibleClients = getClientSelves(session);
                        if (possibleClients)
                            cid = possibleClients[possibleClients.length-1];
                    }
                }    
                else {
                    //Authenticated and clientID specified, check that the user actually owns that clientID
                    var possibleClients = getClientSelves(session);
					if (possibleClients) {
		                if (_.contains(possibleClients, cid)) {
		                }
		                else {
		                    cid = possibleClients[possibleClients.length-1];
		                }
					}
                }                
            }            

            nlog('connect: ' + cid + ', ' + key);
                        
            socket.set('clientID', cid);
            socket.emit('setClientID', cid, key, getClientSelves(session) );
            socket.emit('setServer', Server.name, Server.description);
            
            getObjectsByTag('Tag', function(to) {
                socket.emit('notice', to);
            });
            getObjectsByTag('User', function(to) {
                socket.emit('notice', to);
            });
            getObjectsByAuthor(cid, function(uo) {
                socket.emit('notice', uo);
            });

			if (callback) callback();
            
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
            if (Server.permissions['authenticate_to_delete_objects'] != false) {
                if (!isAuthenticated(session)) {
                    whenFinished('Unable to delete (not logged in)');
                    return;
                }
            }

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

    });



    function updateInterestTime() {
        //reprocess all clientState's to current time
        for (c in Server.clientState) {
            var cl = Server.clientState[c];
            updateInterests(c, cl);
        }
    }

    function sub(socket, channel, sendExisting) {
        //nlog(socket.clientID + ' subscribed ' + channel );
        socket.join(channel);

        if (sendExisting) {
            getObjectsByTag(channel, function(objects) {
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
        var prevState = Server.clientState[clientID];
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
                if (Server.interestTime[k] == undefined)
                    Server.interestTime[k] = 0;
                addends[k] = (now - prevState.when) / 1000.0 * averageInterest;
            }
        }
        for (var k in prevState.interests) {
            var v = state.interests[k];
            var pv = prevState.interests[k];
            if (v == undefined) {
                v = 0;
                var averageInterest = (v + pv) / 2.0;
                if (Server.interestTime[k] == undefined)
                    Server.interestTime[k] = 0;
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
            if (Server.interestTime[k] == undefined)
                Server.interestTime[k] = 0;
            Server.interestTime[k] += a / addendSum;
        }


        state.when = now;
        Server.clientState[clientID] = state;

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


    //setInterval(attention.update, Server.memoryUpdatePeriodMS);

    require('./general.js').plugin.start(that, util);


    that.permissions = options.permissions || { };
	that.enablePlugins = options.plugins || [];

	that.server = Server;
	that.nlog = nlog;
	that.plugin = function(pluginfile, forceEnable) {
		plugin(that, pluginfile, forceEnable);
	};
	that.saveState = saveState;

    function loadPlugins() {
		if (that.enablePlugins)	{
			_.each(that.enablePlugins, function(x) {
				if (!that.server.plugins[x])
					that.server.plugins[x] = { };

				that.server.plugins[x].enabled = true;
			});
		}

        fs.readdirSync("./plugin").forEach(function(ifile) {
			var file = ifile + '';
            if (file === 'README')
                return;

            if (file.indexOf('.js') == -1) {//avoid directories
                file = file + '/netention.js';
            }

            plugin(that, file);
        });
    }


    nlog('Ready');

	if (init)
	    init(that);

    return that;

};

