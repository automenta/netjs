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
var util = require('../util/util.js');
var EventEmitter = require('eventemitter2').EventEmitter2;
var expressm = require('express');
var cookie = require('cookie');
var http = require('http');
var url = require('url');
var fs = require('fs');
var sys = require('util');
var request = require('request');
var _ = require('lodash');
var jsonpack = require('jsonpack');
var jsonstream = require('JSONStream');
var Q = require('q');
//var pson= require('pson');


module.exports = function(options) {

	if (!options) options = { };

    sys.inherits(util.Ontology, EventEmitter);
	EventEmitter.call(util, { wildcard: true, delimiter: ':' });

	var dbOpts = {	};

	if (!options.db) {
		options.db = { type: 'levelup', backend: 'memdown' };
	}



	if (options.backend == 'memdown') {
		if (options.web)
			console.warn('Using in-memory \'LevelUp/MemDown\' database; activity will not be saved');
	}

	var DB = require('../util/db.' + options.db.type + '.js');

	var odb = DB("objects", options.db);
	var sysdb = DB("sys", options.db);

    var $N = new util.Ontology(odb, ['User', 'Trust', 'Value']);
    $N = _.extend($N, util);

	odb.start($N);

    if (!options.id)
        options.id = util.uuid();
    
    var connectedUsers = {};	//current state of all clients, indexed by their clientID 

    var focusHistory = [];
    var focusHistoryMaxAge = 24 * 60 * 60 * 1000; //in ms
    //var attention = memory.Attention(0.95);
    //var logMemory = util.createRingBuffer(256);
    options.interestTime = {};	//accumulated time per interest, indexed by tag URI

    $N.server = options; //deprecated



    function startPlugin(kv, pluginOptions) {
        var v = kv;

        var p = require('../plugin/' + v).plugin;
        if (typeof (p) == "function")
            p = p($N);
        else if (!p) {
            console.error(v + ' plugin format needs upgraded');
            return;
        }

		if (!options.plugins) options.plugins = {};

        options.plugins[v] = {enabled: true, plugin: p};

        $N.nlog('Started plugin: ' + p.name);
        p.start(pluginOptions);

    }

    function loadPlugins() {

        var pluginOption = {};

        _.each(options.plugins, function(po, file) {
            if (po.enable !== false)
                startPlugin(file, po);
        });
    }


    var saveState = $N.saveState = function(onSaved, onError) {
		var state = {
			state: 'state',
			interestTime: options.interestTime,
			clientState: options.clientState,
			users: options.users,
			modifiedAt: Date.now(),
		};
		sysdb.set('state', state, function(err, saved) {
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
	};

	function loadState(callback) {
		sysdb.get('state', function(err, state) {
            if (err || !state) {
                //nlog("No previous system state found");
				$N.emit('initialize');
				if (!options.users)
					options.users = { };
            }
            else {
                var now = Date.now();
                var x = state;
                //nlog('Resuming from ' + (now - x.when) / 1000.0 + ' seconds since last system update'); 
                options.interestTime = x.interestTime;
                options.clientState = x.clientState;
                options.users = x.users || {};
            }

            if (callback)
                callback();
		});
	}



    var deleteObject = $N.deleteObject = function(
		objectID, whenFinished, contentAddedToDeletedObject, byClientID) {

        if (byClientID) {
			
            getObjectByID(objectID, function(err, o) {
				o = o[0];
								
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
		//TODO conslidate with $N.remove() like $N.add() already does
			
		odb.remove(objectID, function(err, docs) {

            if (err) {
                nlog('error deleting ' + objectID + ':' + err);
                if (whenFinished)
                    whenFinished(err);
            }
            else {
                //broadcast removal of objectID
                pub(objectRemoved(objectID));
				
				if (whenFinished)
					whenFinished(null, objectID);

				//TODO implement remove replies
				/*
				odb.remove({$or: [{replyTo: objectID}, {author: objectID}]}, function(err, docs) {

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
				*/
            }
        });
    };


    var deleteObjects = $N.deleteObjects = function(objs, whenFinished) {
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

                deleteObject(n, d);
            }
            else {
                if (whenFinished)
                    whenFinished();
            }
        }
        d();
    };


    var deleteObjectsWithTag = $N.deleteObjectsWithTag = function(tag, callback) {
        var existing = [];

        getObjectsByTag(tag, function(o) {
            existing.push(o);
        }, function() {
            deleteObjects(existing, callback);
        });
    };

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
		//assumes o is already expanded
		
		if (!o.id) {
			console.error('notice() invalid object', o);
			return;
		}
		
        if (o._id)
            delete o._id;
		
        //attention.notice(o, 0.1);
		$N.add(_.cloneDeep(o), whenFinished);
    }
    $N.notice = notice;


    function addProperties(ap) {
        for (var i = 0; i < ap.length; i++) {
            properties[ap[i].uri] = ap[i];
        }

        //TODO broadcast change in properties?
    }
    $N.addProperties = addProperties;




    //unpacks an array of objects, returning a new array of the unpacked objects, optionally as nobjects
    function unpack(x, notNobject) {
        return x.map(function(y) {
            delete y._id;
            delete y.tagList;
            if (notNobject)
                return y;
            return new $N.nobject(y);
        });
    }

    function getObjectByID(uri, whenFinished) {
		odb.get(uri, function(err, doc) {
			if (err) {
				nlog('getObjectByID: ' + err);
				whenFinished(err, null);
			}
			else {
				if (doc)
					whenFinished(null, unpack([doc]));
				else
					whenFinished(null, null);
			}
		});
    }
    $N.getObjectByID = getObjectByID;

    function getObjectsByAuthor(a, withObjects) {
		odb.getAllByFieldValue('author', a, function(err, docs) {
			if (err) {
				nlog('getObjectsByAuthor: ' + err);
				withObjects([]);
			}
			else {
				withObjects(unpack(docs));
			}
		});
    }
    $N.getObjectsByAuthor = getObjectsByAuthor;


    function getObjectsByTag(t, withObject, whenFinished) {
        //t can be a single string, or an array of strings
		odb.getAllByTag(t, function(err, docs) {
			if (err) {
				//nlog('getObjectsByTag: ' + err);
				whenFinished();
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
    }
    $N.getObjectsByTag = getObjectsByTag;

	$N.get = $N.db.get;


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
        });
    }
    $N.refactorObjectTag = refactorObjectTag;

    function getTagCounts(whenFinished) {

        odb.getAll(function(err, docs) {
            if (err) {
                nlog('getTagCounts: ' + err);
            }
            else {
                var totals = {};

                docs.forEach(function(d) {
                    var ts = util.objTagStrength(d);
                    for (var dt in ts) {
                        if (totals[dt] === undefined)
                            totals[dt] = 0;
                        totals[dt] += ts[dt];
                    }
                });
            }

            whenFinished(totals);
        });
    }


    function stop() {
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

    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);


    function nlog(x) {
        var xs = x;
        if (typeof (x) != "string")
            xs = JSON.stringify(x, null, 4);

        var msg = new Date() + ': ' + xs;

        console.log(x);
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

    function sendJSONStream(res, x) {
        res.set('Content-type', 'text/json; charset=UTF-8');
        res.set('Transfer-Encoding', 'chunked');
        
        var js = jsonstream.stringify();
        js.pipe(res);
        js.end(x);
        //res.end();
    }
    
    function sendJSON(res, x, pretty, format) {
        try {
            res.set('Content-type', 'text/json');
        }
        catch (e) { }
        var p;
        if (!pretty) {
            if (format === 'jsonpack') {
                p = jsonpack.pack(x);
            }
            else {
                res.json(x);
                return;
            }
        }
        else {
            console.error('pretty JSON printing not necessary');
            p = JSON.stringify(x, null, 4);
        }
        res.end(p);
    }

	function parseCookies(c) {
        var cookies = { };
        c.split(';').forEach(function(cookie) {
            var parts = cookie.match(/(.*?)=(.*)$/);
            if (parts)
                if (parts.length === 3)
                    cookies[ parts[1].trim() ] = (parts[2] || '').trim();
        });        
        return cookies;
    }

    var getCookies = function(request) {                
        if (request && request.headers && request.headers.cookie)
            return parseCookies(request.headers.cookie);
        return { };
    };

	function getAdminUsers() {		
		return options.adminUsers;
	}
	
	function getUserLevel(uid) {
		var a = getAdminUsers();
		if (!a) {
			return 0;
		}
		else if (a.indexOf(uid)!=-1) {
			return 0;
		}
		return 1;
	}

    function getSessionKey(req) {       
        if (typeof req === "string")
            return req;
        
        if (!req)
            return undefined;
        if (req.session) {
            var sessionID = req.session._ctx.cookies['express:sess'];            
			if (req.session.name) {
            	var key = req.session.name;
				return key;
			}
        }

        return undefined;
    }

    function getCurrentClientID(req) {
        if (!req)
            return null;
        
        
        var cookies = getCookies(req);

        if (/*(options.currentClientID === undefined) ||*/ (options.users === undefined)) {
            //options.currentClientID = {};
            options.users = {};
        }

        var key = getSessionKey(req);
        if (!key) return null;

        var cid = cookies.clientID;

        if ((cid) && (options.users[key])) {
            if (options.users[key].indexOf(cid) === -1) {
                //they are trying to spoof the clientID, deny access because key is invalid
                //or they have the wrong clientID in their cookie
                cid = null;
            }
        }

        //default to the first, if exists
        if (!cid) {
            if (options.users[key]) {
                cid = options.users[key][0];
            }
        }

        //otherwise create an initial user for that key

		//TODO do this on login
        if (!cid) {
            cid = util.uuid();
            options.users[key] = [cid];
            saveState();
        }

        
        return cid;
    }

    function addClientSelf(req, uid) {
        var key = getSessionKey(req) || 'anonymous';
        
        if (!options.users)
            options.users = {};

        var ss = options.users[key];
        if (!ss) {
            options.users[key] = [uid];
        }
        else {
            options.users[key].push(uid);
            options.users[key] = _.unique(options.users[key]);
        }

        //HACK clean users?

        saveState();

    }
    function getClientSelves(req) {
        var key = getSessionKey(req);
        if (!key) return [];

        if (!options.users)
            options.users = {};
       
        if (!options.users[key]) {
            options.users[key] = [];
        }
        
        return options.users[key];
    }


    function compactObjects(list) {
        return list.map(util.objCompact);
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
                            return (1.0 / dist) >= options.trustThreshold;
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
    $N.objCanSendTo = objCanSendTo;

    function objAccessFilter(objs, req, withObjects) {
        var cid = getCurrentClientID(req);
        
        //console.log('objAccessFilter', cid, getClientSelves(req), getSessionKey(req));

        withObjects(_.filter(objs, function(o) {
            return objCanSendTo(o, cid);
        }));
    }

    var getLatestObjects = $N.getLatestObjects = function(n, withObjects, withError) {
		odb.getNewest(n, function(err, docs) {
			if (err)
				withError(err);
			else
				withObjects(docs);
		});
    };

    var getLatestObjectsStream = $N.getLatestObjectsStream = function(n, withObject, whenFinished, withError) {
        odb.streamNewest(n, function(err, obj) {
			if (err) { if (withError) withError(err); return; }
			if (!obj) { if (whenFinished) whenFinished(); return; }
			if (withObject)
				withObject(obj);
        });
    };

	var filters = $N.filters = { };

    var pub = $N.pub = function(object, whenFinished, socket) {
		//object assumed to already be expanded

		var pubfilters = $N.filters['pub'];
		if (pubfilters) {
			pubfilters.reduce(Q.when, Q(object)).then(broadcast);
		}
		else {
        	broadcast(object);
		}

		function broadcast(o) {

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
				if ((socket) && (socket.broadcast))
					socket.broadcast.emit('notice', co); //send to everyone except originating socket
				else
					io.sockets.in('*').emit('notice', co); //send to everyone
			}
			else {
				for (var i = 0; i < allsockets.length; i++) {
					var sid = allsockets[i].clientID;
					if (objCanSendTo(o, sid)) {
						sendToSocket(i);
					}
				}
			}

			o = new $N.nobject(o);
			
			if (!o.removed)
				$N.emit('object:pub', o);
			else
				$N.emit('object:delete', o);

		}
    };

	var addFilter = $N.addFilter = function(id, promiseFilter) {
		if (filters[id]===undefined) filters[id] = [];
		filters[id].push(promiseFilter);
		return promiseFilter;
	};

	var addFilterSync = $N.addFilterSync = function(id, func) {

		function syncFilter(f) {
			return function (input) {
				return Q.Promise(function (resolve, reject, notify) {
					resolve(f(input));
				});
			};
		}

		return addFilter(id, syncFilter(func));
	};


	//TODO removeFilter

    function pubAll(objects, objectIntervalMS /*, whenFinished*/) {
        if (objectIntervalMS) {
            var published = 0;
            objects.forEach(function(o) {
                _.delay(function(O) {
                    _.defer(function(OO) {
                        $N.pub(OO);
                    }, O);
                }, (published++) * objectIntervalMS, o);
            });
        }
        else {
            objects.forEach(function(o) {
                $N.pub(o);
            });
        }
    }
    $N.pubAll = pubAll;


	if (options.web) {
		var express = expressm();
		$N.httpserver = express;

		http.globalAgent.maxSockets = 512;


		var bodyParser = require('body-parser');
		var cookieParser = require('cookie-parser');
		var cookieSession = require('cookie-session');
		express.use(bodyParser.json());
		express.use(bodyParser.urlencoded());
		express.use(cookieParser());
		express.use(cookieSession({
		  secret: 'not so secret'
		}));

		if (options.web.connection !== 'static') {
			var security = require('./security.js');
			security.db = {
				collection: 'users',
				url: '_'
				/*
				url: "mongodb://" + options.databaseHost + '/',
				name: options.database,
				*/
			};

			if (options.db.type == 'levelup')
				security.db.adapter = require('./lockit-levelup-adapter.js')(security, options.db);
			else if (options.db.type == 'pouch')
				security.db.adapter = require('./lockit-pouchdb-adapter.js')(security, options.db);


			security.emailSettings = options.email;

			security.appname = options.name;
			security.url = "http://" + options.web.host + ((options.web.port!=80) ? ":" + options.web.port : '');
			security.emailFrom = "info@" + options.web.host;

			express.set('view engine', 'jade');
			express.set('views', './server/views');

			var Lockit = require('lockit');
			//var lockitUtils = require('lockit-utils');
			var lockit = new Lockit(security);
			express.use(lockit.router);

		
			express.use(require('parted')()); //needed for file uploads
			express.disable('x-powered-by');


			express.use(require('corser').create());
		}




		var compression = null;

		//Gzip compression
		if (options.web.httpCompress) {
			compression = require('compression')({
			  threshhold: 512
			});
		}
		else {
			compression = function(req, res, next){ next(); };
		}

		//express.use(require('connect-dyncache')());


		var httpServer = http.createServer(express);


		if (options.web.connection==='websocket') {

			nlog('Websocket server: http://' + options.web.host + ':' + options.web.port);

			var io = require('socket.io')(httpServer, {
			});

			var socketIOclientSource = fs.readFileSync(require.resolve('socket.io/node_modules/socket.io-client/socket.io.js'), 'utf-8');
			var socketIOclientGenerated = new Date();

			//override serve to provide etag caching
			express.get('/socket.io.cache.js', function(req, res){
				//res.autoEtag();
				res.setHeader('Content-Type', 'application/javascript');
				res.statusCode = 200;
				res.end(socketIOclientSource);
			});


			if (io.enable) {
				io.enable('browser client minification');  // send minified client
				//io.enable('browser client etag');          // apply etag caching logic based on version number
				io.enable('browser client gzip');          // gzip the file
			}

			io.set('log level', options.log);                    // reduce logging
			io.set('transports', [// enable all transports (optional if you want flashsocket)
				'websocket',
		//        , 'flashsocket'
				'htmlfile',
				'xhr-polling',
				'jsonp-polling'
			]);
			//io.set("polling duration", 5);
		}		

		var serverPassword = options.web.password;
		if ((serverPassword) && (serverPassword.length > 0)) {
			//https://github.com/gevorg/http-authenticate
			
			var auth = require('http-auth');
			var basicAuth = auth.basic({
				realm: options.name
			}, function(username, password, callback) { // Custom authentication method.
				callback(password === serverPassword);
			}
			);
			express.use(auth.connect(basicAuth));
		}

		express.get('/whoami', function(req, res) {
		  sendJSON(res, req.session);
		});

		/*lockit.on('login', function(user, res, target) {
		});*/
		/*
		lockit.on('logout', function(user, res) {
		});
		*/

		
		var ejs = require('ejs');
		var indexTemplateSrc = fs.readFileSync('client/index.html', 'utf8');
		var indexTemplate = ejs.compile(indexTemplateSrc,{});		

		express.get('/', function(req, res) {
			
			if (options.web.connection!=='static') {
				var account = getSessionKey(req);

				var possibleClients = getClientSelves(account);

				res.cookie('account', account);
				res.cookie('clientID', getCurrentClientID(account));
				res.cookie('otherSelves', possibleClients.join(','));
			}
			
			//res.sendfile('./client/index.html');
			res.end(indexTemplate({
				title: options.name,
				description: options.description,
				allowSearchEngineIndexing: false
			}));
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
				js += 'configuration.siteName=\'' + options.name + '\';\n';
				js += 'configuration.siteDescription=\'' + options.description + '\';\n';
				js += 'configuration.requireIdentity=' + (options.permissions.connect < 3) + ';\n';
				js += 'configuration.connection=\'' + (options.web.connection) + '\';\n';
				js += 'configuration.webrtc=' + (options.web.webrtc) + ';\n';
				
				js += data;
				res.send(js);
			});
		});


		var oneDay = 86400000;
		var oneWeek = 606876923;
		var oneYear = 31557600000;
		var staticContentConfig = {
			//PRODUCTION: oneYear
			maxAge: 0
		};



		//express.use(expressm.staticCache());
		express.use("/plugin", expressm.static('./plugin', staticContentConfig));
		express.use("/doc", expressm.static('./doc', staticContentConfig));

		express.use("/", expressm.static('./client', staticContentConfig));
		express.use("/util", expressm.static('./util', staticContentConfig));

		
		if (options.web) {
			express.get('/ontology.json', function(req, res) {
				//var format = req.params.format;

				//res.autoEtag();
				try { res.set('Content-type', 'text/json'); } catch (e) { }
				res.end($N.ontologyJSON());

				//if (format === 'json') {
					//sendJSON(res, {'class': cl, 'property': pr }, null, format);

				//}
				/*else if (format == 'jsonpack')
					sendJSON(res, {'class': cl, 'property': pr }, null, format);
				else
					sendJSON(res, 'unknown format: ' + format);*/
			});
		}
		
		if (options.web.connection==='websocket') {


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

			/*
			express.get('/log', function(req, res) {
				sendJSON(res, logMemory.buffer);
			});*/

			express.get('/users/connected/json', function(req, res) {
				sendJSON(res, getRoster());
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

			express.get('/object/tag/:tag/json', compression, function(req, res) {
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
			//TODO unify this with previous function
			express.get('/object/tag/:tag/json_expanded', compression, function(req, res) {
				var tag = req.params.tag;
				if (tag.indexOf(',')) {
					tag = tag.split(',');
				}
				var objects = [];
				getObjectsByTag(tag, function(o) {
					objects.push(o);
				}, function() {
					objAccessFilter(objects, req, function(sharedObjects) {
						sendJSON(res, sharedObjects);
					});
				});
			});



			express.get('/object/author/:author/json', compression, function(req, res) {
				var author = req.params.author;
				var objects = [];
				getObjectsByAuthor(author, function(objects) {
					objAccessFilter(objects, req, function(sharedObjects) {
						sendJSON(res, compactObjects(sharedObjects));
					});
				});
			});

			express.get('/object/:uri/json', compression, function(req, res) {
				var uri = req.params.uri;
				getObjectByID(uri, function(err, x) {
					if (x) {
						objAccessFilter(x, req, function(objs) {
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

			express.get('/object/latest/:num/:format', compression, function(req, res) {
				var n = parseInt(req.params.num);
				var format = req.params.format;

				var MAX_LATEST_OBJECTS = 8192;
				if (n > MAX_LATEST_OBJECTS)
					n = MAX_LATEST_OBJECTS;

				if (format === 'json') {
					var cid = getCurrentClientID(req);

					res.set('Content-type', 'text/json; charset=UTF-8');
					res.set('Transfer-Encoding', 'chunked');

					var js = jsonstream.stringify('[',',',']');
					js.pipe(res);
					getLatestObjectsStream(n, function(o) {
						if (objCanSendTo(o, cid)) {
							js.write(util.objCompact(o));
						}
					}, function() {
						js.end();
					});
				}
				//TODO unify with above block
				else if (format === 'json_expanded') {
					var cid = getCurrentClientID(req);

					res.set('Content-type', 'text/json; charset=UTF-8');
					res.set('Transfer-Encoding', 'chunked');

					var js = jsonstream.stringify('[',',',']');
					js.pipe(res);
					getLatestObjectsStream(n, function(o) {
						if (objCanSendTo(o, cid)) {
							js.write(o);
						}
					}, function() {
						js.end();
					});
				}
				else if (format === 'jsonpack') {
					getLatestObjects(n,
							function(objs) {
								objAccessFilter(objs, req, function(sharedObjects) {
									sendJSON(res, compactObjects(sharedObjects), null, format);
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



			express.get('/object/latest/rss', compression, function(req, res) {
				var NUM_OBJECTS = 64;

				var feedOptions = {
					title: options.name,
					description: options.description,
					feed_url: options.web.host + '/object/latest/rss',
					site_url: options.web.host,
					image_url: options.client.loginLogo,
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
						var compacted = compactObjects(sharedObjects);

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
								url: options.web.host + '/object/' + o.id + '/json',
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

		//    express.get('/users/tag/rdf', function(req, res) {
		//        var rdfstore = require('rdfstore');
		//        rdfstore.create(function(store) {
		//            /*var exampleQuery =
		//             'PREFIX n: <http://netention.org/>\
		//             PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
		//             PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
		//             PREFIX : <' + Server.host + '/>\
		//             INSERT DATA {\
		//             :alice\
		//             rdf:type        n:Person ;\
		//             n:name       "Alice" ;\
		//             n:mbox       <mailto:alice@work> ;\
		//             n:knows      :bob ;\
		//             .\
		//             :bob\
		//             rdf:type        n:Person ;\
		//             n:name       "Bob" ; \
		//             n:knows      :alice ;\
		//             n:mbox       <mailto:bob@home> ;\
		//             .\
		//             }';
		//             */
		//            var objects = [];
		//
		//            var st = getOperatorTags();
		//            getObjectsByTag(st, function(o) {
		//                objects.push(o);
		//            }, function() {
		//                //PREFIX : <' + Server.host + '/>\
		//                var query = '';
		//                /*'PREFIX n: <http://netention.org/>\
		//                 PREFIX d: <http://dbpedia.org/resource/>\
		//                 PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\
		//                 PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>\
		//                 INSERT DATA {\n';*/
		//
		//                var skills = 0; //TODO rename this 'tags'
		//                var authors = {};
		//                for (var i = 0; i < objects.length; i++) {
		//                    var oo = objects[i];
		//                    var t = util.objTags(oo);
		//
		//                    var skillLevel, object;
		//                    for (var w = 0; w < st.length; w++) {
		//                        if (_.contains(t, st[w])) {
		//                            skillLevel = st[w];
		//                            t = _.without(t, st[w]);
		//                            object = t[0];
		//                            break;
		//                        }
		//                    }
		//                    if ((skillLevel) && (object)) {
		//                        skills++;
		//                        query += '<http://netention.org/' + oo.author + '> <http://netention.org/' + skillLevel + '> <http://dbpedia.org/resource/' + object + '> .\n';
		//                    }
		//                    if (authors[oo.author])
		//                        continue;
		//
		//                    var authorName = attention.object(oo.author);
		//                    if (authorName) {
		//                        authorName = authorName.name; // + (' ' + (authorName.email ? ('<' + authorName.email + '>') : ''));
		//                    }
		//                    else {
		//                        authorName = "Anonymous";
		//                    }
		//                    authors[oo.author] = authorName;
		//                }
		//                for (var aid in authors) {
		//                    var aname = authors[aid];
		//                    query += '<http://netention.org/' + aid + '> <foaf:name> "' + aname + '".\n';
		//                }
		//
		//                sendText(res, query);
		//
		//            });
		//
		//        });
		//
		//    });

			express.post('/read/text', function(req, res) {
				var text = req.body.text;

				//https://www.mashape.com/alchemyapi/alchemyapi-1
				//http://www.alchemyapi.com/api/concept/textc.html
				var alchemyKey = options.permissions['alchemyapi_key'];
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


		//    express.get('/input/geojson/*', function(req, res) {
		//        var url = req.params[0] || '';
		//
		//        http.get(url, function(res) {
		//            //var kml = jsdom(fs.readFileSync(url, 'utf8'));
		//            var page = '';
		//            res.on("data", function(chunk) {
		//                page += chunk;
		//            });
		//            res.on('end', function() {
		//                var tj = require('togeojson'),
		//                        // node doesn't have xml parsing or a dom. use jsdom
		//                        jsdom = require('jsdom').jsdom;
		//
		//                var kml = jsdom(page);
		//                var converted = tj.kml(kml)['features'];
		//
		//                var n = 0;
		//                _.each(converted, function(o) {
		//                    if (o.type == 'Feature') {
		//                        /* { type: 'Feature',
		//                         geometry:
		//                         { type: 'Point',
		//                         coordinates: [ -145.1312560955501, 62.3909807260417, 0 ] },
		//                         properties: { name: 'Power Plants' } } */
		//                        var id = url + '#' + (n++);
		//                        var name = '';
		//                        var coords = null;
		//
		//                        if (o['geometry']) {
		//                            if (o['geometry']['coordinates'])
		//                                coords = o['geometry']['coordinates'];
		//                        }
		//                        if (o['properties'])
		//                            name = o['properties']['name'] || '';
		//
		//                        var x = util.objNew(id, name);
		//                        x = util.objAddTag(x, 'Item');
		//                        x = util.objAddGeoLocation(x, coords[1], coords[0]);
		//                        pub(x);
		//                    }
		//                });
		//
		//                //var converted_with_styles = tj.kml(page, { styles: true });
		//                //console.log(converted_with_styles);
		//            });
		//
		//        });
		//    });



			express.get('/state', function(req, res) {
				sendJSON(res, _.omit(options, ['plugins', 'users', 'currentClientID', 'permissions']));
			});

			express.get('/attention', function(req, res) {
				getTagCounts(function(x) {
					sendJSON(res, x, false);
				});
			});

			express.get('/focus/:historyLengthSeconds', compression, function(req, res) {
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
					function()    {     sendJSON(res, 'Saved');        },
					function(err) {     sendJSON(res, 'Not saved');    }
				);
			});

			express.get('/team/interestTime', function(req, res) {
				updateInterestTime();
				sendJSON(res, options.interestTime);
			});

			if (options.permissions.enableAnonymous) {
				//returns username and password for an anonymous account corresponding to the connector's IP address.
				//if the account does not exist, it is created in the user database.
				//TODO optional auto-expiration

				console.log('Anonymous access enabled');

				express.get('/user/anonymous/new', function(req, res) {

					var ip = req.connection.remoteAddress;
					var u = 'anon.' + ip;

					//check if account exists; if so, send existing credentials
					lockit.adapter.find('name', u, function(err, user) {
						if (err) {
							console.log('create anonymous user: error', err);
							return;
						}
						if (!user) {
							//console.log('anonymous user does not exist');
							var randomPassword = util.uuid();

							lockit.adapter.save(u,'anon@'+ip, randomPassword, function(err, user) {
								if (err) {
									console.error('Saving anonymous user: ', err);
									return;
								}

								//console.log('anonymous user created. err=', err, 'user=', user);

								/*"emailVerificationTimestamp" : ISODate("2014-05-29T07:52:09.983Z"), "emailVerified" : true,
								{ "name" : "anonymous", "email" : "anonymous@anonymous.null", "signupToken" : "d3a6aec4-ad70-4770-9841-8556193333be", "signupTimestamp" : ISODate("2014-05-29T17:48:36.992Z"), "signupTokenExpires" : ISODate("2014-05-30T17:48:36.993Z"), "failedLoginAttempts" : 0, "salt" : "7bb4796276950668a603118e3ea943e1", "derived_key" : "ef49f775532f12a55a47daea158ef9fcfe2076c0", "_id" : ObjectId("538772f446eba3ca0e2c460c") }*/

								user.emailVerified = true;
								user.anonPassword = randomPassword;
								delete user.signupToken;
								delete user.signupTokenExpires;
								lockit.adapter.update(user, function() {
									options.anonymousUserExists = true;
									saveState();
									sendJSON(res, { username: u, password: randomPassword });
								});
							});
						}
						else {
							//console.log('anonymous user exists', user);
							sendJSON(res, { username: u, password: user.anonPassword });
						}

					});

				});
			}


			/*express.post('/notice', function(request, response) {

				//console.log(request.body.user.name);
				//console.log(request.body.user.email);

			});*/

		/*
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
		*/


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
					rres.writeHead(200, {'Content-Type': 'text/html'});

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
								if (bc.indexOf('page-') === 0) {
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

			express.get('/wiki/search/:query', compression, function(req, rres) {
				var q = req.params.query;
				returnWikiPage('http://en.wikipedia.org/w/index.php?search=' + q, rres);
			});

			express.get('/wiki/:tag/html', compression, function(req, rres) {
				var t = req.params.tag;
				returnWikiPage("http://en.wikipedia.org/wiki/" + t, rres);
			});
			express.get('/wiki/:tag1/:tag2/html', compression, function(req, rres) {
				var t = req.params.tag1 + '/' + req.params.tag2;
				returnWikiPage("http://en.wikipedia.org/wiki/" + t, rres);
			});

			function getRoster() {
				var u = {};
				_.keys(connectedUsers).forEach(function(uid) {
					if (connectedUsers[uid].webRTC)
						u[uid] = connectedUsers[uid].webRTC;
					else
						u[uid] = 1;
				});
				return u;
			}

			var rosterBroadcastIntervalMS = 1000;
			var broadcastRoster = _.throttle(function() {
				var r = getRoster();
				io.sockets.in('*').emit('roster', r);


				if ($N.node) {
					io.sockets.in('*').emit('p2p', $N.node.peers);
				}

				$N.emit('main:set', 'roster', r);
			}, rosterBroadcastIntervalMS);
			$N.broadcastRoster = broadcastRoster;

			function updateUserConnection(oldID, nextID, socket) {
				//oldID = leaving user
				//nextID = joining user

				if (oldID) {
					if (connectedUsers[oldID]) {
						delete connectedUsers[oldID].sockets[socket.id];
					}
					if (_.keys(connectedUsers[oldID].sockets) === 0)
						delete connectedUsers[oldID];
				}
				if (nextID) {
					if (!connectedUsers[nextID])
						connectedUsers[nextID] = {sockets: {}};

					connectedUsers[nextID].sockets[socket.id] = socket;

					socket.clientID = nextID;
				}

				broadcastRoster();
			}
			function setUserWebRTC(userID, webrtcID, enabled) {
				var u = connectedUsers[userID];
				if (!u) return;

				if (enabled) {
					if (!u.webRTC)
						u.webRTC = [];
					u.webRTC.push(webrtcID);
					u.webRTC = _.unique(u.webRTC);
				}
				else {
					if (u.webRTC) {
						u.webRTC = _.without(u.webRTC, webrtcID);
						if (u.webRTC.length === 0)
							delete u.webRTC;
					}
				}
				broadcastRoster();
			}


			io.set('authorization', function(handshakeData, callback) {
				var cookies = getCookies(handshakeData);

				var session = cookies['express:sess'];
				var account = cookies['account'];
				//TODO validate that session is consistent with the account

				callback(null, true);
				//use handshakeData to authorize this connection
				//Node.js style "cb". ie: if auth is not successful, then cb('Not Successful');
				//else cb(null, true); //2nd param "true" matters, i guess!!
			});

			io.sockets.on('connection', function(socket) {

				var request;
				if (socket.handshake)
					request = socket.handshake;
				else
					request = socket.conn.request;

				var account = parseCookies(request.headers.cookie).account;
				//TODO validate that the session ID matches the name as authorized


				{
					//https://github.com/LearnBoost/socket.io/wiki/Rooms
					socket.on('subscribe', function(channel, sendAll) {
						sub(socket, channel, sendAll);
					});
					socket.on('unsubscribe', function(channel) {
						unsub(socket, channel);
					});

					socket.on('pub', function(obj, callback) {
						
						var obj = $N.objExpand(obj);
						var originalObject = _.cloneDeep(obj);

						if (options.permissions['authenticate_to_create_objects'] !== false) {
							if (!account) {
								if (callback) {
									callback('Not authenticated', null);
								}
							}
						}

						//TODO SECURITY make sure that client actually owns the object. this requires looking up existing object and comparing its author field

						if (obj.focus) {
							focusHistory.push(obj);

							$N.emit('focus', obj);

							//remove elements in focusHistory that are older than focusHistoryMaxAge (seconds)
							var now = Date.now();
							focusHistory = _.filter(focusHistory, function(f) {
								return f.whenCreated > (now - focusHistoryMaxAge);
							});

							if (callback)
								callback(null, null);

						}
						else {
							function cb(err, result) {
								if (err) {
									console.error('pub: ', err);
								}
								else {

									//if result==message, don't respond with it. set it to null and the client will interpret this as untransformed
									if (util.objEqual(result, originalObject)) {
										result = null;
									}
								}

								callback(err, result);
							}

							pub(obj, cb, socket);
						}

					});

					/*socket.on('getPlugins', function(f) {
					 f(_.keys(options.plugins));
					 });*/

					/*socket.on('setPlugin', function(pid, enabled, callback) {
					 if (options.permissions['anyone_to_enable_or_disable_plugin'] == false) {
					 callback('Plugin enabling and disabling not allowed');
					 return;
					 }
					 if (options.permissions['authenticate_to_configure_plugins'] != false) {
					 if (!isAuthenticated(account)) {
					 callback('Unable to configure plugins (not logged in)');
					 return;
					 }
					 }

					 var pm = options.plugins[pid];
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
							target = $N.objExpand(target);
							targetObjectID = target.id;
							targetObject = target;
						}

						onResult = function(nextID) {
							var oldID = socket.clientID;

							if (oldID !== nextID) {
								updateUserConnection(oldID, nextID, socket);
								var userLevel = getUserLevel(nextID);
								$N.emit("user:connect", {id: nextID, prevID: oldID, level: userLevel});
							}

							_onResult(nextID);
						};

						function pubAndSucceed(x) {
							pub(x, function() {
								addClientSelf(account, targetObjectID);
								saveState();
								if (onResult)
									onResult(targetObjectID);
							});
						}

						var keyRequired = (options.permissions['authenticate_to_create_profiles'] !== false);
						if (!targetObject) {
							var selves = getClientSelves(account);
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
							if ((keyRequired && account) || (!keyRequired)) {
								pubAndSucceed(targetObject);
							}
							else {
								if (onResult)
									onResult();
							}
						}

					});

					socket.on('connectID', function(cid, callback) {

						if (!cid) {
							//Authenticated but no clientID specified
							cid = getCurrentClientID(account);
							if (!cid) {
								var possibleClients = getClientSelves(account);
								if (possibleClients)
									cid = possibleClients[possibleClients.length - 1];
							}
						}
						else {
							//Authenticated and clientID specified, check that the user actually owns that clientID
							var possibleClients = getClientSelves(account);
							if (possibleClients) {
								if (_.contains(possibleClients, cid)) {
								}
								else {
									cid = possibleClients[possibleClients.length - 1];
								}
							}
						}

						var selves = getClientSelves(account);

						updateUserConnection(null, cid, socket);
						$N.emit("user:connect", {id: cid, level: getUserLevel(cid) });

						var tagsAndTemplates = [];
						getObjectsByTag(['Tag', 'Template'], function(o) {
							tagsAndTemplates.push($N.objCompact(o));
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

						callback(cid, account, selves);

					});

					socket.on('disconnect', function() {
						$N.emit('client:disconnect', socket.clientID);
						updateUserConnection(socket.clientID, null, socket);
					});

					socket.on('webRTC', function(id, enabled) {
						setUserWebRTC(socket.clientID, id, enabled);
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

					/*
					socket.on('getObjects', function(query, withObjects) {
						//TODO safely handle query

						odb.obj.find(function(err, docs) {
							objAccessFilter(request, docs, function(dd) {
								withObjects(dd);
							});
						});
					});*/

					socket.on('delete', function(objectID, whenFinished) {
						/*if (options.permissions['authenticate_to_delete_objects'] != false) {
						 if (!isAuthenticated(account)) {
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
							var os = getClientSelves(account);
							if (_.contains(os, objectID)) {
								deleteObject(objectID, whenFinished, null, socket.clientID);
							}
							else {
								if (whenFinished)
									whenFinished('Unable to delete user profile');
							}
						}
					});
					
					socket.on('channelSend', function(channel, message) {
						channelAdd(channel, message, true, true);
					});

				}


			});

			function channelAdd(channel, message, toWebSockets, toP2P) {
				//TODO use socket channels to send only to subscribers
				if (toWebSockets)
					io.sockets.in('*').emit('channelMessage', channel, message);

				//TODO allows plugins to choose specific channels to subscribe
				//if (toPlugins)
				//    plugins("onChannel", [channel, message]);
				if (toP2P)
					if (channel === 'main') {
						$N.emit('main:say', message);
					}
			}
			$N.channelAdd = channelAdd;

			function updateInterestTime() {
				//reprocess all clientState's to current time
				for (var c in options.clientState) {
					var cl = options.clientState[c];
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
				var prevState = options.clientState[clientID];
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
						if (options.interestTime[k] == undefined)
							options.interestTime[k] = 0;
						addends[k] = (now - prevState.when) / 1000.0 * averageInterest;
					}
				}
				for (var k in prevState.interests) {
					var v = state.interests[k];
					var pv = prevState.interests[k];
					if (v == undefined) {
						v = 0;
						var averageInterest = (v + pv) / 2.0;
						if (options.interestTime[k] == undefined)
							options.interestTime[k] = 0;
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
					if (options.interestTime[k] == undefined)
						options.interestTime[k] = 0;
					options.interestTime[k] += a / addendSum;
				}


				state.when = now;
				options.clientState[clientID] = state;

			}
		}

		$N.once('ready', function() {
			httpServer.listen(options.web.port);
			nlog('Web server: http://' + options.web.host + ':' + options.web.port);
		});

	}
	
	if (options.web && options.web.webrtc) {
		$N.once('ready', function() {
			var path = '/peer';

			//https://github.com/floatdrop/peerjs-server/tree/express#combining-with-existing-express-app
			//https://github.com/peers/peerjs-server
			var PeerServer = require('peer').PeerServer;

			//var server = new PeerServer({port: w.port, path: '/n'});
			var server = PeerServer({ server: httpServer, path: path });
			express.use(server);

			server.on('disconnect', function(id) { 
				//remove from userConnections
				_.each(connectedUsers, function(v, k) {
					if (v.webRTC)
						v.webRTC = _.without(v.webRTC, id);					
				});
				
				//TODO emit an event instead of calling this function
				if ($N.broadcastRoster)
					$N.broadcastRoster();
			});
			nlog('WebRTC server: http://' + options.web.host + ':' + options.web.port + '' + path);
		});
	}

	
    process.on('uncaughtException', function(err) {
        console.error(err);
		console.error(err.stack);
    });


    $N.client = options.client || {};
    $N.permissions = options.permissions || {};
    $N.enablePlugins = options.plugins || {};
    $N.nlog = nlog;

    odb.update();
	sysdb.update();

	require('./default.js').plugin($N).start();


	var ready = false;

	$N.ready = function(f) {
		if (!ready)
			$N.once('ready', f);
		else {
			f();
		}
	}

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

				if (!getAdminUsers()) {
					$N.emit("security:info", "No admin users specified; All users granted admin priveleges");
				}				

                ready = true;
				$N.emit('ready');


				
                if (options.start)
                    options.start($N);

                setInterval(odb.update, options.memoryUpdateIntervalMS);

            });
            
        });

    });
 
    return $N;

};
