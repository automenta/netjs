/*
 Netention Web Server
 
 Know                                L=========D=========T
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
var jsonpack = require('jsonpack');
//var cortexit = require('./cortexit.js');


/** 
 init - callback function that is invoked after the server is created but before it runs 
 */
exports.start = function(options, init) {

    var $N = _.clone(util);
    $N.server = options;
    $N.httpserver = express;

    var focusHistory = [];
    var focusHistoryMaxAge = 24 * 60 * 60 * 1000; //in ms

    var tags = {};
    var properties = {};
    var connectedUsers = {};	//current state of all clients, indexed by their clientID 

    var attention = memory.Attention(0.95);

    var logMemory = util.createRingBuffer(256);
    $N.server.interestTime = {};	//accumualted time per interest, indexed by tag URI

    //"mydb"; // "username:password@example.com/mydb"
    var dbURL = $N.server.databaseURL || process.env.MongoURL;     
    var db = mongo.connect(dbURL, ["obj", "sys"]);


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

    //deprecated
    function _plugin(kv, options) {
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


                //console.log(v, $N.server.plugins[kv]);

                //TODO add required plugins parameter to add others besides 'general'
                if (($N.server.plugins[kv].enabled) || (v == 'general')) {
                    $N.nlog('Started plugin: ' + p.name);
                    p.start(options);
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
    //$N.plugin = plugin;

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

        db.sys.find({id: "state"}, function(err, state) {

            if (err || !state || (state.length===0)) {
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

                /* logMemory = util.createRingBuffer(256);
                 logMemory.buffer = x.logMemoryBuffer;
                 logMemory.pointer = x.logMemoryPointer;*/
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

        if (_.contains(_tag, 'Trust')) //|| Value || ...
            userRelations = null;

        //nlog('notice: ' + JSON.stringify(o, null, 4));

        if (o.modifiedAt === undefined)
            o.modifiedAt = o.createdAt;

        attention.notice(o, 0.1);

        db.obj.update({id: o.id}, o, {upsert: true}, function(err) {
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
		at.forEach(function(t) {
			if (!t) return;

            if (defaultTag)
                t.tag = defaultTag;

			if (!Array.isArray(t.properties)) {
				var propertyArray = [];
				_.each(t.properties, function(prop, uri) {
					if (prop != null)
						propertyArray.push( _.extend(prop, { uri: uri } ));
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
    $N.addTags = addTags;

    function subtags(t) {
        return util.subtags(tags, t);
    }
    $N.subtags = subtags;

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
        if (tags[uri] != undefined) {
            //it's a tag
            whenFinished(tags[uri]);
        }
        else {
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
                }
            });
        });
    }
    $N.getObjectsByAuthor = getObjectsByAuthor;


    function getObjectsByTag(t, withObject, whenFinished) {
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
                    unpack(docs).forEach(function(d) {
                        withObject(d);
                    });
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

    function getReport(lat, lon, whenStart, whenStop, withReport) {

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

    function sendJSON(res, x, pretty, format) {
        res.writeHead(200, {'content-type': 'text/json'});
        var p;
        if (!pretty) {
			if (format == 'jsonpack') {
				p = jsonpack.pack(x);
			}
			else {
	            p = JSON.stringify(x);
			}
		}
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


    var bodyParser = require('body-parser');
    
    express.use(cookieParser);
    express.use(bodyParser({limit: '1mb'}));
    express.use(bodyParser.json());
    //express.use(expressm.methodOverride());
    express.use(require('parted')());
    express.use(require('express-session')({secret: 'secret', key: 'express.sid', cookie: {secure: true}}));
    express.use(passport.initialize());
    express.use(passport.session());


    var httpServer = http.createServer(express);


	//SHAREJS -----------------------------
	/*var sharejs = require('share').server;

	sharejs.attach(httpServer, { 
		db: {type: 'none'}
    	//browserChannel: { cors: "*"}
	});*/

	//----------------------------- SHAREJS

    httpServer.listen($N.server.port);


    nlog('Web server: http://' + $N.server.host + ':' + $N.server.port);

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
    //io.set("polling duration", 5);

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

    var LocalStrategy = require('passport-local').Strategy;
    passport.use(new LocalStrategy(
            function(username, password, done) {

                if (!$N.server.localPasswords) {
                    $N.server.localPasswords = {};
                }

                if ((username.length == 0) || (username.indexOf('@') == -1)) {
                    done(null, false, "Invalid username");
                    return;
                }

                username = username.toLowerCase();

                var pws = $N.server.localPasswords;
                if (pws[username]) {
                    if (pws[username] == password)
                        done(null, {id: username});
                    else
                        done(null, false, "Incorrect password");
                    return;
                }
                else {
                    //console.log('Creating local login: ', username);
                    pws[username] = password;
                    saveState();
                    done(null, {id: username});
                    return;
                }

            }
    ));

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

    if (options.permissions.facebook_key) {
        var fbkey = options.permissions.facebook_key.split(":");
        var appid = fbkey[0];
        var appsecret = fbkey[1];

        var FacebookStrategy = require('passport-facebook').Strategy;

        passport.use(new FacebookStrategy({
            clientID: appid,
            clientSecret: appsecret,
            callbackURL: "http://" + $N.server.host + "/auth/facebook/callback"
        },
        function(accessToken, refreshToken, profile, done) {
            done(null, {id: accessToken});
        }
        ));
    }


    var getCookies = function(request) {
        var cookies = {};
        if (request)
            if (request.headers)
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
        if (!possibleClients)
            possibleClients = [];
        //cid = possibleClients[possibleClients.length - 1];

        if (!anonymous) {
            res.cookie('authenticated', key != undefined);
        }
        else {
            res.cookie('authenticated', 'anonymous');
        }
        res.cookie('clientID', cid);

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


    express.get('/login',
            passport.authenticate('local', {_successRedirect: '/#',
                failureRedirect: '/',
                failureFlash: false}),
            function(req, res) {
                res.cookie('userid', req.user.id);
                res.redirect('/#');
            }
    );


    // Accept the OpenID identifier and redirect the user to their OpenID
    // provider for authentication.  When complete, the provider will redirect
    // the user back to the application at:
    //     /auth/openid/return
    express.get('/auth/openid', passport.authenticate('openid'));
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


    if (options.permissions.facebook_key) {
        // Redirect the user to Facebook for authentication.  When complete,
        // Facebook will redirect the user back to the application at
        //     /auth/facebook/callback
        express.get('/auth/facebook', passport.authenticate('facebook'));

        // Facebook will redirect the user to this URL after approval.  Finish the
        // authentication process by attempting to obtain an access token.  If
        // access was granted, the user will be logged in.  Otherwise,
        // authentication has failed.
        express.get('/auth/facebook/callback',
                passport.authenticate('facebook', {_successRedirect: '/',
                    failureRedirect: '/login'}),
                function(req, res) {
                    res.cookie('userid', req.user.id);
                    res.redirect('/#');
                }
        );
    }

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

    express.post('/uploadgif', function(req, res) {

        var format = req.body.format;
        var imageBase64 = req.body.image;


        if ((!imageBase64) && (!format)) {
            res.end('');
            return;
        }

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
        var userid = cookies['userid'];
        if (!userid)
            return null;
        return decodeURIComponent(userid);
    }

    function getCurrentClientID(req) {
        if (!req)
            return null;

        var cookies = getCookies(req);

        if (/*($N.server.currentClientID === undefined) ||*/ ($N.server.users === undefined)) {
            //$N.server.currentClientID = {};
            $N.server.users = {};
        }

        var key = getSessionKey(req);
        if (!key) {
            key = 'anonymous';
        }

        if (!cookies.authenticated)
            return null;

        var cid;
        if (cookies.authenticated) {
            cid = cookies.clientID;
            if ((cid) && ($N.server.users[key])) {
                if ($N.server.users[key].indexOf(cid) == -1) {
                    //they are trying to spoof the clientID, deny access because key is invalid
                    return null;
                }
            }
        }

        if (!cid) {
            if ($N.server.users[key]) {
                cid = $N.server.users[key][0];
            }
        }

        if (!cid) {
            cid = util.uuid();
            $N.server.users[key] = [cid];
            //$N.server.currentClientID[key] = cid;
            saveState();
        }

        return cid;
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

    var userRelations = null;

    function updateUserRelations(whenFinished) {
        if (userRelations) {
            whenFinished(userRelations);
            return;
        }

        var users = [];
        getObjectsByTag(['Trust'], function(o) {
            users.push(o);
        }, function() {
            userRelations = util.objUserRelations(users);

            whenFinished(userRelations);
        });
    }

    function objCanSendTo(o, cid) {
        var ObjScope = util.ObjScope;
        var scope = o.scope || options.client.defaultScope;
        if (scope == ObjScope.ServerSelf) {
            if (o.author)
                return (o.author == cid);
            return true;
        }
        else if (scope == ObjScope.ServerFollow) {
            if (o.author) {
                if (o.author == cid) //self
                    return true;

                if (userRelations[o.author]) {
                    var whoOsAuthorTrusts = userRelations[o.author]['trusts'];
                    return (whoOsAuthorTrusts[cid] !== undefined);
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

        updateUserRelations(function(rels) {
            withObjects(_.filter(objs, function(o) {
                return objCanSendTo(o, cid);
            }));
        });
    }


    function broadcast(socket, o, whenFinished) {
        if (!o.removed)
            o = plugins("prePub", o);

        notice(o, whenFinished, socket);

        co = util.objCompact(o);

        var allsockets = io.sockets.in('*').sockets;
 

        var scope = o.scope || options.client.defaultScope;
 
        function sendToSocket(i) {
            if (socket) {
                if (allsockets[i] !== socket)
                    allsockets[i].emit('notice', co);
            }
            else {
                allsockets[i].emit('notice', co);
            }
        }

        if (scope >= util.ObjScope.ServerAll) {
            if (socket)
                socket.broadcast.emit('notice', co); //send to everyone except originating socket
            else
                io.sockets.in('*').emit('notice', co); //send to everyone
        }
        else {
            updateUserRelations(function() {
                for (var i = 0; i < allsockets.length; i++) {
                    var sid = allsockets[i].clientID;
                    if (objCanSendTo(o, sid)) {
                        sendToSocket(i);
                    }
                }
            });
        }


        o = new $N.nobject($N.objExpand(o));

        if (!o.removed)
            plugins("onPub", o);
        else
            plugins("onDelete", o);

    }
    $N.broadcast = broadcast;

    express.get('/users/connected/json', function(req, res) {
        sendJSON(res, getUserConnections());
    });
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
            objAccessFilter(objects, req, function(sharedObjects) {
                sendJSON(res, compactObjects(sharedObjects));
            });
        });
    });

    express.get('/object/author/:author/json', function(req, res) {
        var author = req.params.author;
        var objects = [];
        getObjectsByAuthor(author, function(objects) {
            objAccessFilter(objects, req, function(sharedObjects) {
                sendJSON(res, compactObjects(sharedObjects));
            });
        });
    });

    express.get('/object/:uri/json', function(req, res) {
        var uri = req.params.uri;
        getObjectByID(uri, function(err, x) {
            if (x) {
                objAccessFilter([x], req, function(objs) {
                    if (objs.length == 1)
                        sendJSON(res, util.objCompact(objs[0]));
                    else
                        sendJSON(res, ['Unknown', uri]);
                });
            }
            else
                sendJSON(res, ['Unknown', uri]);
        });
    });

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
    function getExpiredObjects(withObjects) {
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

    express.get('/object/latest/:num/:format', function(req, res) {
        var n = parseInt(req.params.num);
        var format = req.params.format;

        if ((format === 'json') || (format === 'jsonpack')) {
            var MAX_LATEST_OBJECTS = 8192;
            if (n > MAX_LATEST_OBJECTS)
                n = MAX_LATEST_OBJECTS;

            getLatestObjects(n,
                function(objs) {
                    objAccessFilter(objs, req, function(sharedObjects) {
                        sendJSON(res, compactObjects(unpack(sharedObjects, true)), null, format);
                    });
                },
                function(error) {
                    console.error('object/latest/:num/json', error);
                }
            );
        }
        else
            sendJSON(res, 'unknown format: ' + format);
    });

    express.get('/object/latest/rss', function(req, res) {
        var NUM_OBJECTS = 64;

        var feedOptions = {
            title: $N.server.name,
            description: $N.server.description,
            feed_url: $N.server.host + '/object/latest/rss',
            site_url: $N.server.host,
            image_url: $N.server.client.loginLogo,
            generator: 'Netention',
            //docs: 'http://example.com/rss/docs.html',
            //author: '',
            //managingEditor: '',
            //webMaster: '',
            //copyright: '',
            language: 'en',
            //categories: ['Category 1','Category 2','Category 3'],
            pubDate: Date.now()
                    //ttl: '60'
        };

        getLatestObjects(NUM_OBJECTS, function(objs) {
            objAccessFilter(objs, req, function(sharedObjects) {
                var compacted = compactObjects(unpack(sharedObjects, true));

                var RSS = require('rss'); //https://github.com/dylang/node-rss
                var feed = new RSS(feedOptions);
                var escapehtml = require('escape-html');


                for (var i = 0; i < sharedObjects.length; i++) {
                    var o = sharedObjects[i];
                    //var oh = 
                    var oc = escapehtml(JSON.stringify(compacted[i]));

                    var content = util.objDescription(o) + '<hr/>' + oc;

                    var item = {
                        title: o.name,
                        description: content,
                        url: $N.server.host + '/object/' + o.id + '/json',
                        guid: 'netention://object/' + o.id,
                        categories: util.objTags(o, false),
                        author: o.author || 'none', // optional - defaults to feed author property
                        date: util.objWhen(o), // any format that js Date can parse.
                        //lat: 33.417974, //optional latitude field for GeoRSS
                        //long: -111.933231, //optional longitude field for GeoRSS
                        //enclosure: {url:'...', file:'path-to-file'} // optional enclosure
                    };
                    var where = util.objSpacePointLatLng(o);
                    if (where) {
                        item.lat = where[0];
                        item.long = where[1];
                    }
                    feed.item(item);
                }

                res.writeHead(200, {'content-type': 'application/rss+xml'});
                res.end(feed.xml());
            });
        },
                function(error) {
                    console.error('object/latest/rss', error);
                });
    });


    /*express.get('/object/:uri', function(req, res) {
     var uri = req.params.uri;
     res.redirect('/object.html?id=' + uri);
     });*/


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

    express.get('/ontology/:format', function(req, res) {
		var format = req.params.format;	
		if ((format === 'json') || (format == 'jsonpack'))
	        sendJSON(res, {'tags': tags, 'properties': properties}, null, format);
		else
			sendJSON(res, 'unknown format: ' + format);
    });

    express.get('/state', function(req, res) {
        sendJSON(res, _.omit($N.server, ['plugins', 'users', 'currentClientID', 'permissions']));
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
        saveState(
            function() {
                sendJSON(res, 'Saved');
            },
            function(err) {
                sendJSON(res, 'Not saved');
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

    function getUserConnections() {
        var u = { };
        _.keys(connectedUsers).forEach(function(uid) {
            u[uid] = 1;
        });
        return u;
    }
    
    var rosterBroadcastIntervalMS = 1000;
    var broadcastRoster = _.throttle(function() {
        var uc = getUserConnections();
        if (_.keys(uc).length > 0)
            io.sockets.in('*').emit('roster', uc);
    }, rosterBroadcastIntervalMS);
    
    function updateUserConnection(oldID, nextID, socket) {
        //oldID = leaving user
        //nextID = joining user
                
        if (oldID) {
            if (connectedUsers[oldID]) {
                delete connectedUsers[oldID].sockets[socket.id];                
            }
            if (_.keys(connectedUsers[oldID].sockets) == 0)
                delete connectedUsers[oldID];
        }
        if (nextID) {
            if (!connectedUsers[nextID])
                connectedUsers[nextID] = { sockets: {} };
            
            connectedUsers[nextID].sockets[socket.id] = socket;
            
            socket.clientID = nextID;
        }
                        
        broadcastRoster();
    }


    function pub(object, whenFinished) {
        broadcast(null, object, whenFinished);
    }
    $N.pub = pub;
    
    function pubAll(objects, objectIntervalMS /*, whenFinished*/) {
        if (objectIntervalMS) {
            var published = 0;
            objects.forEach(function(o) {
                _.delay(function(O) {
                    _.defer(function(OO) {
                        $N.pub(OO);
                    }, O);
                }, (published++)*objectIntervalMS, o);
            });        
        }
        else {
            objects.forEach(function(o) {
                $N.pub(o);
            });
        }
    }
    $N.pubAll = pubAll;


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
                    message = util.objExpand(message);
                    focusHistory.push(message);

                    plugins('onFocus', message);

                    //remove elements in focusHistory that are older than focusHistoryMaxAge (seconds)
                    var now = Date.now();
                    focusHistory = _.filter(focusHistory, function(f) {
                        return f.whenCreated > (now - focusHistoryMaxAge);
                    });

                }
                else
                    broadcast(socket, message);

                if (success)
                    success();
            });

            /*socket.on('getPlugins', function(f) {
                f(_.keys($N.server.plugins));
            });*/

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
            

            socket.on('become', function(target, _onResult) {
                var targetObjectID = target;
                var targetObject = target;
                if (typeof (target) === "string") {
                    targetObjectID = target;
                    targetObject = null;
                }
                else {
                    targetObjectID = target.id;
                    targetObject = target;
                }

                onResult = function(nextID) {
                    var oldID = socket.clientID;
                    
                    if (oldID != nextID) {
                        updateUserConnection(oldID, nextID, socket);
                        plugins("onConnect", {id: nextID, prevID: oldID});
                    }

                    _onResult(nextID);
                };

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
                        /*else {
                         pubAndSucceed(targetObject);
                         }*/
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
                
                updateUserConnection(null, cid, socket);
                plugins("onConnect", {id: cid});

                var tagsAndTemplates = [];
                getObjectsByTag(['Tag', 'Template'], function(o) {
                    tagsAndTemplates.push(o);
                }, function() {
                    if (tagsAndTemplates.length > 0)
                        socket.emit('notice', tagsAndTemplates);
                });

                sub(socket, '*');
                
                /*getObjectsByTag('User', function(to) {
                 socket.emit('notice', to);
                 });*/

                /*getObjectsByAuthor(cid, function(uo) {
                 socket.emit('notice', uo);
                 });*/

                socket.clientID = cid;

                callback(cid, key, selves);

            });
            
            socket.on('disconnect', function() {
                updateUserConnection(socket.clientID, null, socket);
            });
            
            /*socket.on('updateSelf', function(s, getObjects) {
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
             });*/

            /*
             socket.on('getSentencized', function(urlOrText, withResult) {
             cortexit.getSentencized(urlOrText, withResult);
             });
             */

            
            socket.on('getObjects', function(query, withObjects) {
                //TODO safely handle query
                
                db.obj.find(function(err, docs) {
                    objAccessFilter(request, docs, function(dd) {
                        withObjects(unpack(dd, true));
                    });
                });
            });

            socket.on('delete', function(objectID, whenFinished) {
                /*if ($N.server.permissions['authenticate_to_delete_objects'] != false) {
                 if (!isAuthenticated(session)) {
                 whenFinished('Unable to delete (not logged in)');
                 return;
                 }
                 }*/

                if (!socket.clientID) {
                    //not sure if this will ever happen, but better to be safe so that the clientID parameter to deleteObject will never be undefined or null
                    whenFinished('Unidentified');
                    return;
                }

                if (!util.isSelfObject(objectID)) {
                    deleteObject(objectID, whenFinished, null, socket.clientID);
                }
                else {
                    var os = getClientSelves(session);
                    if (_.contains(os, objectID)) {
                        deleteObject(objectID, whenFinished, null, socket.clientID);
                    }
                    else {
                        if (whenFinished)
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
    $N.enablePlugins = options.plugins || {};


    require('./general.js').plugin($N).start();


    $N.nlog = nlog;
    /*$N.plugin = function(pluginfile, forceEnable) {
     plugin(pluginfile, forceEnable);
     };*/

    function loadPlugins() {

        var pluginOption = {};

        fs.readdirSync("./plugin").forEach(function(ifile) {
            var file = ifile + '';
            if (file === 'README')
                return;

            if (file.indexOf('.js') == -1) {//avoid directories
                file = file + '/netention.js';
            }

            if (!$N.server.plugins[file])
                return;

            pluginOption[file] = $N.server.plugins[file];

            if (pluginOption[file]) {
                var po = pluginOption[file];
                if (po.enable != false)
                    startPlugin(file, pluginOption[file]);
            }
        });
    }

    if (init)
        init($N);

    if ($N.server.start)
        $N.server.start($N);


    function removeExpired() {
        getExpiredObjects(function(objs) {
            if (objs.length == 0) return;
            var ids = _.map(objs, function(o) { return o.id; } );
            deleteObjects(ids);
        });
    }    
    setInterval(removeExpired, $N.server.memoryUpdateIntervalMS);
    removeExpired();

    return $N;

};


