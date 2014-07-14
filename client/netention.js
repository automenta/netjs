"use strict";
/*!
 * netention.js v1.2 - client-side functionality
 * Attentionated by @automenta and @rezn8d
 */

var $N = null;

var ID_UNKNOWN = 0;
var ID_ANONYMOUS = 1;
var ID_AUTHENTICATED = 2;


function setClientID(cid, otherSelves) {
    if (cid) {
        $N.set('clientID', cid);
    }
    $N.set('otherSelves', _.unique(otherSelves));

    /*notify({
     title: 'Connected',
     text: that.myself().name + ' (' + that.get('clientID').substring(0,4) + ')'
     });*/


}

function identity() {
    var a = getCookie('account');
    if (a === 'anonymous') {
        return ID_ANONYMOUS;
    }
    if (a !== 'undefined') {
        return ID_AUTHENTICATED;
    }
    return ID_UNKNOWN;
}


function netention(f) {

    var $NClient = Backbone.Model.extend({
        reset: function() {
            this.channels = { };
            this.clearTransients();
            this.set('clientID', 'undefined');
			this.messages = [];
			this.connections = { };
        },
        clearTransients: function() {
            this.set('layer', {
                include: [],
                exclude: []
            });
            this.set('focus', new nobject());

			if (configuration.connection == 'websocket') {
				var mainChannel = $N.addChannel('main');
				mainChannel.createdAt = 1382087985419;
			}

		},
        //deprecated
        tag: function(t) {
            return this.class[t];
        },
        isProperty: function(p) {
            return this.property[p] !== undefined;
        },
        ////DEPRECATED
        objects: function() {
            return this.instance;
        },
        //deprecated
        getObject: function(id) {
            return this.instance[id];
        },
        //deprecated
        object: function(id) {
            return this.instance[id];
        },
        //deprecated
        getTag: function(t) {
            return this.class[t];
        },
        //deprecated
        getProperty: function(p) {
            return this.property[p];
        },

        deleteSelf: function(clientID) {
            var os = this.get('otherSelves');
            if (os.length < 2) {
                notify({
                    title: 'Can not delete self: ' + clientID.substring(6) + '...',
                    text: 'Must have one extra self to become after deleting',
                    type: 'Error'
                });
                return;
            }
            if (_.contains(os, clientID)) {
                os = _.without(os, clientID);
                this.set('otherSelves', os);

                $N.deleteObject($N.instance[$N.id()]);
            }

        },
        getIncidentTags: function(userid, oneOfTags) {
            return objIncidentTags(this.instance, oneOfTags, userid);
        },

        layer: function() {
            return this.get('layer');
        },
        id: function() {
            return this.get('clientID');
        },
        myself: function() {
            var id = this.id();
            if (id) {
                var o = this.getObject(id);
                if (o)
                    return new nobject(o);
            }
            return undefined;
        },
        become: function(target) {
            if (!target)
                return;

			//console.log('Becoming', target);

            var previousID = $N.id();

            var targetID = target;
            if (typeof (target) !== 'string') {
                this.add(target);
                targetID = target.id;
            }

            if (configuration.connection == 'static') {
                var os = $N.get('otherSelves');
                os.push(targetID);

                $N.set('clientID', targetID);
                $N.set('otherSelves', _.unique(os));
				

				$N.sessionStart();
            } else {
                this.socket.emit('become', typeof target === 'string' ? target : objCompact(target), function(nextID) {
                    if (nextID) {

                        $N.set('clientID', nextID);
                        setCookie('clientID', nextID);

                        var os = $N.get('otherSelves');
                        os.push(nextID);
                        $N.set('otherSelves', _.unique(os));

                        $N.clear();

                        $N.clearTransients();

						$N.indexOntology();

                        $N.getUserObjects(function() {
							$('#NotificationArea').html('Loading my objects...');
                            $N.getAuthorObjects(nextID, function() {
								$('#NotificationArea').html('Loading new public objects...');
                                $N.getLatestObjects(1000, function() {
                                    $N.sessionStart();
                                }, true);
                            });
                        });

                    } else {
                        notify({
                            title: 'Unable to switch profile',
                            text: (typeof (target) === 'string' ? target : target.id),
                            type: 'Error'
                        });

                    }
                });
            }
        },

        connect: function(targetID, whenConnected) {
			console.log('Websocket start');

            var originalTargetID = targetID;
            var suppliedObject = null;
            if (targetID) {
                if (typeof (targetID) !== 'string') {
                    suppliedObject = targetID;
                    targetID = suppliedObject.id;
                }
            }

            if (!targetID) {
                targetID = this.get('clientID');
                var os = this.get('otherSelves');
                if (os) {
                    if (os.length > 0) {
                        if (!_.contains(os, 'Self_' + targetID)) {
                            //targetID = os[os.length - 1];
                            targetID = os[0];
                        }
                    }
                }
            } else {
                $N.set('clientID', targetID);
            }

            function reconnect() {
                socket.emit('connectID', targetID, function(_cid, _key, _selves) {
                    setClientID(_cid, _selves);
                    setCookie('clientID', _cid);

                    //socket.emit('subscribe', 'User');

                    function doWhenConnected() {
                        if (whenConnected) {
                            whenConnected();
                            whenConnected = null;
                        }
                    }

                    doWhenConnected();

                });
            }

            var socket = this.socket;
            if (!socket) {
                /*this.socket = socket = io.connect('/', {
                 });*/
                this.socket = socket = io.connect('/', {
                    'transports': ['websocket', /*'flashsocket',*/ 'htmlfile', 'xhr-multipart', 'xhr-polling', 'jsonp-polling'],
                    'reconnect': false,
                    'reconnection': false,
                    /*'reconnectionDelay': 750,
                     'reconnectionDelayMax': 25,*/
                    'try multiple transports': true
                });


                socket.on('connect', function() {
                    socket.on('disconnect', function() {
                        /*notify({
                         title: 'Disconnected.'
                         });*/

                        var p = newPopup('Disconnected', true, true).addClass('ReconnectDialog');
                        var disconnectButton = $('<button><h1>&duarr;<br/>Reconnect</h1></button>').appendTo(p).click(function() {
                            location.reload();
                        });
                        console.log('disconnected');
                    });

                    /*socket.on('reconnecting', function() {
                     notify({
                     title: 'Reconnecting..'
                     });
                     });*/
                    /*
                     socket.on('reconnect', function() {
                     notify({
                     title: 'Reconnected.'
                     });
                     init();
                     });*/

                    /*socket.on('error', function(){
                     socket.socket.reconnect();
                     });*/

                    socket.on('notice', function(n) {
						try {
							$N.notice(n);
						}
						catch (e) {
							console.error(e);
						}
                    });

                    socket.on('addTags', function(t, p) {
                        $N.addProperties(p);
                        $N.addTags(t);
                    });

                    socket.on('roster', function(r) {
                        $N.set('roster', r);
                    });
					socket.on('p2p', function(r) {
                        $N.set('p2p', r);
                    });

                    socket.on('channelMessage', function(channel, message) {
                        if (!$N.channels[channel])
                            $N.channels[channel] = [];
                        $N.channels[channel].push(message);
                        $N.trigger('channel:' + channel, message);
                    });


                    reconnect();

                });
            }
            return socket;
        },
        setWebRTC: function(id, enabled) {
			if (this.socket)
            	this.socket.emit('webRTC', id, enabled);
        },
        updateRoster: function() {
			if (configuration.connection !== 'static') {
				$.getJSON('/users/connected/json', function(r) {
					$N.set('roster', r);
					$N.trigger('change:roster');
				});
			}
        },

		addConnection: function(c) {
			$N.connections[c.id()] = c;
			var menuitem = $('<li><a href="#">' + c.name() + '</a></li>');
			$('#ConnectionList').after(menuitem);
			c.update();
		},

        indexOntology: function() {
            var that = this;
            that.addAll(that.ontologyProperties);
            that.addAll(that.ontologyClasses);

			later(function() {
				for (var i = 0; i < that.ontologyClasses.length; i++) {
					var c = that.ontologyClasses[i];
					if (!c) return;

					that.ontoIndex.add({
						id: c.id,
						name: c.name,
						description: c.description
					});

					if (c.icon)
						defaultIcons[c.id] = c.icon;
				}
			});

            //that.trigger('change:tags');

        },
        loadOntology: function(url, f) {
            var that = this;

            $.getJSON(url, function(o) {
                that.ontologyProperties = objExpandAll(o.property);
                that.ontologyClasses = objExpandAll(o.class);

                f();
            });

        },
        searchOntology: function(query, ontocache) {
            query = query.toLowerCase();

			var terms = this.ontoIndex.pipeline.run(lunr.tokenizer(query));
            var results = {};

			//HACK for 3-letter ontology words
			if (query.indexOf('can') != -1)
				results['Can'] = 1;

            for (var i = 0; i < terms.length; i++) {
                var T = terms[i];
                var r = ontocache[T];

                if (!r)
                    r = this.ontoIndex.search(T);

                ontocache[T] = r;

                for (var j = 0; j < r.length; j++) {
                    var R = r[j];
                    var id = R.ref;
                    var score = R.score;
                    if (!results[id])
                        results[id] = score;
                    else
                        results[id] += score;
                }
            }

            results = _.map(_.keys(results), function(r) {
                return [r, results[r]];
            });
            results = results.sort(function(a, b) {
                return b[1] - a[1];
            });
            return results;
        },

        /*geolocate : function(ex) {
         objSetFirstValue(this.myself(), 'spacepoint', {lat: ex[0], lon: ex[1], planet: 'Earth'} );

         var that = this;
         this.pub(this.myself(), function(err) {
         notify({
         title: 'Unable to share location.',
         text: err,
         type: 'Error'
         });

         }, function() {
         notify({
         title: 'Geolocated.',
         text: that.myself().geolocation
         });
         that.saveLocal();

         });
         },*/

        deleteObject: function(x, localOnly) {
            var id;
            if (typeof x === 'string')
                id = x;
            else
                id = x.id;

            var that = this;

            if (x.author === undefined)
                localOnly = true;

            //var X = _.clone($N.object[id]);

            if (configuration.connection !== 'static') {
                if ((!this.socket) && (!localOnly)) {
                    notify({
                        title: 'Unable to delete: Not connected, must login.'
                    });
                    return false;
                }
            } else
                localOnly = true;

            function removeLocal() {
                if (!$N.object[id])
                    return false;

                //console.log(X.id, 'deleting replies:', X.reply);
                /*
                _.keys(X.reply).forEach(function(r) {
                    //console.log('deleting reply:', X.reply[r], r, X.reply[r].author !== $N.id());
                    $N.deleteObject(r, X.reply[r].author !== $N.id());
                });
                */

                that.remove(id);

                return true;
            }

            if (!localOnly) {
                this.socket.emit('delete', id, function(err) {
                    if (!err) {
                        that.trigger('change:deleted');
                        that.trigger('change:attention');

                        notify({
                            title: 'Deleted',
                            text: id,
                            addclass: 'stack-bottomleft',
                            stack: stack_bottomleft
                        });

                        removeLocal();
                    } else {
                        //console.dir(err);
                        notify({
                            title: 'Unable to delete: ' + err,
                            text: id
                        });
                    }
                });
            } else {
                if (removeLocal()) {
                    if (x.author) {
                        notify({
                            title: 'Deleted',
                            text: id,
                            addclass: 'stack-bottomleft',
                            stack: stack_bottomleft
                        });
                        $N.trigger('change:attention');
                    }
                }
            }
            return true;

        },

        /*getPlugins: function(withPlugins) {
            var that = this;
            this.socket.emit('getPlugins', function(p) {
                that.unset('plugins');
                that.set('plugins', p);
                if (withPlugins)
                    withPlugins(p);
            });
        },
        setPlugin: function(pid, enabled, callback) {
            this.socket.emit('setPlugin', pid, enabled, callback);
        },*/

        /*getGoals: function(from, to, mineOnly ) {
         var that = this;

         if (from == null) {
         return _.where(_.map(this.objectsWithTag('Goal'), function(id) { return that.getObject(id); } ), { delay: 0 });
         }

         return _.filter(_.map(this.objectsWithTag('Goal'), function(id) { return that.getObject(id); } ), function(x) {
         if (x.delay == 0) return false;
         var w = x.when || 0;
         return ((w >= from) && (w < to));
         } );
         },*/

        //called after connection establishd
        sessionStart: function() {
			initSessionUI();

        },

        getObjects: function(query, onObject, onFinished) {
            var that = this;
            //TODO possible security hole, make sure query isnt destructive
            this.socket.emit('getObjects', query, function(objs) {
                for (var k in objs) {
                    var x = objs[k];
                    that.notice(x);
                    if (onObject !== null)
                        onObject(x);
                }
                onFinished();
            });
        },
        /*listenAll: function (b) {
         if (b) {
         this.subscribe('*', function (f) {
         this.notice(f);
         });
         } else {
         this.unsubscribe('*');
         }
         },*/
        setFocus: function(f) {
            //TODO avoid sending duplicate focuses
            /*
             var oldFocus = this.get('focus');
             if (oldFocus)
             if (f.when == oldFocus.when)
             if (f.where == oldFocus.where)
             if (f.author == oldFocus.author) {
             console.log(f.value, oldFocus.value);
             if (_.isEqual(f.value, oldFocus.value))
             return;
             }
             */

            if (!f.id)
                f.id = uuid();
            if (!f.focus)
                f.focus = 'change';
            if (!f.createdAt)
                f.createdAt = Date.now();
            if (!f.author)
                f.author = this.id();

            if (f.when === null)
                delete f.when;
            if (f.where === null)
                delete f.where;
            /*if (f.tags)
             if (f.tags.length == 0)
             delete f.tags;*/

            this.set('focus', f);

            if (this.socket) {
                this.pub(f, function(err) {
                    console.log('setFocus err: ', err);
                }, function() {
                    //notify({title: 'Focus noticed.'});
                });
            }
            $N.trigger('change:focus');

        },
        focus: function() {
            return this.get('focus');
        },
        notice: function(x, suppressChange, noSave) {

            if (!Array.isArray(x)) {
                return $N.notice([x], suppressChange, noSave);
            }

            var that = this;

            function n(y) {
                if (!y) {
					console.error('notice() null object');
                    return false;
				}

				if (!y.id)
                	y = objExpand(y);

				if (!y.id) {
					//console.error('notice() invalid object', y);
					return false;
				}

                if (y.removed) {
                    that.deleteObject(y, true);
                    return true;
                }

                //skip existing with an older modificatin/creation time
                var existing = $N.object[y.id];
                if (existing) {
                    var lastModified = y.modifiedAt || y.createdAt || null;

                    if (lastModified !== null) {
                        var existingLastModified = existing.modifiedAt || existing.createdAt || null;
                        if (existingLastModified !== null) {

                            if ($N.id() === y.author) {
                                if (lastModified <= existingLastModified)
                                    return false;
                            }
                            else {
                                if (lastModified < existingLastModified)
                                    return false;
                            }

                        }
                    }
                }

                $N.add(y, undefined, noSave);

                function objTagObjectToTag(x) {
                    var p = {};
                    _.each(objValues(x, 'tagValueType'), function(v) {
                        var vv = v.split(':');
                        p[vv[0]] = {
                            name: vv[0],
                            type: vv[1]
                        };
                    });

                    return {
                        uri: x.name,
                        name: x.name,
                        description: objDescription(x),
                        properties: p
                    };
                }

                if (objHasTag(y, 'Tag')) {
                    that.add([objTagObjectToTag(y)]);
                }

				//add missing tags to ontology and index
				//TODO guess type if it's property
				if (y.value) {
					for (var i = 0; i < y.value.length; i++) {
						var c = y.value[i].id;
						if (isPrimitive(c)) continue;
						if ((!$N.class[c]) && (!$N.property[c]) && (!$N.instance[c])) {
							that.addAll([{
								id: c, name: c, extend: null
							}]);

							that.ontoIndex.add({
								id: c,
								name: c
							});
						}

					}
				}

				if (y.scope == ObjScope.GlobalAdvertise) {
					if (y.author !== $N.id()) {
						later(function() {
							$N.receive(y);
						});
					}
				}

                return true;
            }


            var anythingChanged = false;
            var anythingChangedFromOthers = false;
            for (var i = 0; i < x.length; i++) {
                if (!x[i].focus) {
                    if (n(x[i])) {
                        anythingChanged = true;
                        if (x[i].author !== $N.id())
                            anythingChangedFromOthers = true;
                    }
                }
            }
            if ((anythingChanged) && (!suppressChange)) {
                if (anythingChangedFromOthers)
					if (window.updateViewLock) //TEMPORARY, use an emit to decouple this
                    	updateViewLock(viewUpdatesBuffered + 1);



                this.trigger('change:attention');
            }
        },
        subscribe: function(channel, f) {
            if (this.socket) {
                this.socket.emit('subscribe', channel);
                this.socket.on('receive-' + channel, f);
            }
        },
        unsubscribe: function(channel) {
            if (this.socket) {
                this.socket.emit('unsubscribe', channel);
            }
        },
        pub: function(object, onErr, onSuccess, suppressChange) {

            if (configuration.connection == 'static') {
                $N.notice(object);
                if (onSuccess)
                    onSuccess();
            } else {
                if (this.socket) {
                    this.socket.emit('pub', objCompact(object), function(err, objProcessed) {
                        if (err) {
							if (onErr)
                            	onErr(object);

							notify({
								title: 'Error saving:',
								text: err,
								type: 'error'
							});
						}
						else {
							if (objProcessed === null) {
								//null means that the object was untransformed by the server,
								//so server avoided sending it back
								objProcessed = object;
							}

							$N.notice(objProcessed, suppressChange);

							if (!suppressChange) {
								if (!object.focus)
									$N.add(objProcessed);
								//$N.trigger('change:attention');
							}
							if (onSuccess)
								onSuccess(objProcessed);
						}
                    });
                } else {
                    if (onErr)
                        onErr('Not connected.');
                    else
                        console.log('Not connected.');
                }
            }
        },
        //THIS NEEDS UPDATED
        getClientInterests: function(f) {
            this.socket.emit('getClientInterests', f);
        },
        getTagCount: function(onlySelf, predicate) {

            var tagCount = {};
            var myID = this.id();

            if (!onlySelf) {
                //fast count
                _.each(this.tagged, function(v, k) {
                    if ($N.property[k]) return;
                    if (v)
                        tagCount[k] = _.keys(v).length;
                });
            }
            else {
                _.each(this.instance, function(oi, ai) {
                    if (predicate)
                        if (!predicate(oi))
                            return;

                    if (onlySelf)
                        if (oi.author !== myID)
                            return;

                    //TODO use the simple counting method as above;
                    //separate the weighted counting into another function or by an optional parameter

                    var ts = objTagStrength(oi);
                    for (var i in ts) {
                        if (!tagCount[i])
                            tagCount[i] = 0;
                        tagCount[i] = tagCount[i] + ts[i]; //TODO add the normalized tag strength
                    }
                });
            }
            return tagCount;
        },
        getServerAttention: function(withResults) {
            $.getJSON('/attention', function(attention) {
                withResults(attention);
            });
        },
        /*save: function(key, value) {
            $N.set(key, value);
            localStorage[key] = JSON.stringify(value);
        },*/

        loadAll: function(callback) {

			try {
				_.extend($N.attributes, JSON.parse(localStorage.$N || '{}'));
			}
			catch (e) { $N.attr = { }; }

			$N.db.getAll(function(err, objects) {
				if (err) {
					console.error('loadAll: ' , err);
					return;
				}
				console.log('Loaded ', objects.length, 'objects from local browser');
				$N.notice(objects, false, true);

				if (callback)
					callback();
			});

        },

        saveAll: function() {
			localStorage.$N = JSON.stringify($N.attributes);
        },

        //TODO rename to 'load initial objects' or something
        getLatestObjects: function(num, onFinished) {
            if (configuration.connection == 'static') {
                return onFinished();
            }

            $.getJSON('/object/latest/' + num + '/json', function(objs) {
                $N.notice(objs);
                onFinished();
            });
        },
        getUserObjects: function(onFinished) {
            if (configuration.connection == 'static') {
					onFinished();
            }
			else {
				$.getJSON('/object/tag/User/json', function(objs) {
					$N.notice(objs);
					onFinished();
				});
			}
        },
        getAuthorObjects: function(userID, onFinished) {
            if (configuration.connection == 'static') {
                onFinished();
            }
			else {
				$.getJSON('/object/author/' + userID + '/json', function(j) {
					$N.notice(j);
					onFinished();
				});
			}
        },
        startURLRouter: function() {
            if (!this.backboneStarted) {

                this.backboneStarted = true;
				Backbone.history.start();

                $N.on('change:attention', updateView);
                $N.on('change:currentView', updateView);
                $N.on('change:tags', updateView);
                $N.on('change:focus', updateView);

            }
        },
        getChannel: function(channel, callback) {
            if ($N.channels[channel]) {
                callback($N.channels[channel]);
            }
        },

		addChannel: function(channel) {
			var o = new $N.nobject('!' + channel);
			o.add('chat', { channel: channel });
			o.name = channel;
			o.author = '!' + channel;
			//o.hidden = true;
			$N.notice(o);
			return o;
		},

        channelSend: function(channel, m) {
            $N.socket.emit('channelSend', channel, m);
        },

		receive: function(message) {
			var messageIDs = _.pluck($N.messages, 'id');
			var existingIndex = messageIDs.indexOf(message.id);
			if (existingIndex != -1) {
				$N.messages.splice(existingIndex, 1);
			}

			$N.messages.push(message);
			$N.trigger('change:messages');
			$('#NotificationList i').addClass('blink');
		},
		
		newUser: function(name) {
			var u = uuid();
			var uo = u;
			var o = new nobject(uo, name);
			o.author = uo;
			o.scope = ObjScope.Global;
			o.addTag('Human');
			o.addTag('User');
			return o;			
		}
    });

	var odb = DB('objects' /*{ adapter: 'memory' }*/);
    $N = new Ontology(odb, true, _.extend(new $NClient(), exports));



    $N.ontoIndex = lunr(function() {
        this.field('name', {
            boost: 4
        });
        this.field('description');
        this.field('properties');
        this.ref('id');
    });


    $N.toString = function() {
        return JSON.stringify(this);
    };

    $N.reset();

    //var account = getCookie('account');
    var cid = getCookie('clientID');
    var otherSelves = decodeURIComponent(getCookie('otherSelves')).split(',');
    setClientID(cid, otherSelves);

    if (configuration.connection == 'websocket') {
        $N.connect(null, function() {
            f('/ontology.json', $N);
        });
    } else {
        window.addEventListener('beforeunload', function(e) {
            $N.saveAll();
            /*var confirmationMessage = "Saved everything";

             (e || window.event).returnValue = confirmationMessage;     //Gecko + IE
             return confirmationMessage;                                //Webkit, Safari, Chrome etc.
             */
        });

        f('ontology.json', $N);
    }


}

$(document).ready(function() {

    netention(function(schemaURL, $N) {
        $('#NotificationArea').html('System loaded.');

        $N.loadOntology(schemaURL, function() {
            $('#NotificationArea').html('Ontology ready. Loading objects...');

            $N.getUserObjects(function() {

                //SETUP ROUTER
                var Workspace = Backbone.Router.extend({
                    routes: {
                        'new': 'new',
                        'me': 'me', // #help
                        'help': 'help', // #help
                        'query/:query': 'query', // #search/kiwis
                        'object/:id': 'showObject',
                        'object/:id/focus': 'focus',
                        'tag/:tag': 'tag',
                        'tag/:tag/new': 'tagNew',
                        //"new/with/tags/:t":     "newWithTags",
                        'example': 'completeExample',
                        'user/:userid': 'user',
                        ':view': 'view',
						':view/tag/:tag': 'viewTag',
                        'read/*url': 'read'
                                //"search/:query/:page":  "query"   // #search/kiwis/p7
                    },
                    me: function() {
                        commitFocus($N.myself());
                    },
                    completeExample: function() {
                        commitFocus(exampleObject);
                    },
                    showObject: function(id) {
                        var x = $N.object[id];
                        if (x) {
                            newPopupObjectView(x);
                        }
                        else {
                            notify({
                             	title: 'Unknown object',
                             	text: id
                             });
                        }
                    },
                    view: function(view) {
                        $N.set('currentView', view);
                    },
                    viewTag: function(view, tag) {
                        $N.set('currentView', view);

						var tf = new $N.nobject();
						tf.addTag(tag);
						$N.setFocus(tf);

						//show sidebar
						if (!$('#FocusEditWrap').is(':visible'))
							$('#FocusEditToggleButton').click();
                    },
                    user: function(userid) {
                        $N.set('currentView', {view: 'user', userid: userid});
                    },
                    tagNew: function(tag) {
						var n = new $N.nobject();
						n.addTag(tag);
						newPopupObjectEdit(n);
                    },
                    read: function(url) {
                        later(function() {
                            viewRead(url);
                        });
                    }

                });




				initUI();


				var ii = identity();

				if (ii === ID_AUTHENTICATED) {
					$('#NotificationArea').html('Authorized.');
				}
				else if (ii === ID_ANONYMOUS) {
					$('#NotificationArea').html('Anonymous.');
				}
				else {
					$('#NotificationArea').html('Read-only public access.');
					/*$('.loginlink').click(function() {
					 $('#LoadingSplash').show();
					 nn.hide();
					 });*/
				}

				$('#View').show();
				$('#LoadingSplash2').hide();





				var w = new Workspace();
				$N.router = w;

				/*
				if (($N.myself()===undefined) && (identity()!=ID_UNKNOWN)) {
					openSelectProfileModal("Start a New Profile");
				}*/



				if (configuration.connection == 'static') {
					$('.websocket').hide();

					$N.loadAll(function() {
						if ($N.myself() === undefined) {
							if (!configuration.enableAnonymous) {
								openSelectProfileModal('Start a New Profile');
							}
							else {
								//start a default anonymous user
								var x = $N.newUser('Anonymous');
								$N.become(x);
							}							
						} else {
							$N.indexOntology();

							$N.sessionStart();
						}
					});
				}
				else if (configuration.connection == 'websocket') {
					$('.websocket').show();

					$('#NotificationArea').html('Connecting...');

					if ((configuration.autoLoginDefaultProfile) || (configuration.connection == 'static')) {
						var otherSelves = _.filter($N.get('otherSelves'), function(f) {
							return $N.getObject(f);
						});
						if (otherSelves.length >= 1) {
							$N.become(otherSelves[0]);
							return;
						}
					}

					if (isAnonymous()) {
						//show profile chooser
						openSelectProfileModal('Anonymous Profiles');
					}
					else if ($N.myself() === undefined) {
						if (configuration.requireIdentity)
							openSelectProfileModal('Start a New Profile');
						else {
							$N.sessionStart();
						}
					}


				}


				//initKeyboard();



				//USEFUL FOR DEBUGGING EVENTS:
				/*
				 $N.on('change:attention', function() { console.log('change:attention'); });
				 $N.on('change:currentView', function() { console.log('change:currentView'); });
				 $N.on('change:tags', function() { console.log('change:tags'); });
				 $N.on('change:focus', function() { console.log('change:focus', $N.focus() ); });
				 */


            });
        });


    });


});


///COMMON UI ------------------------------------


window.later = setImmediate;


//faster than $('<div/>');
function newDiv(id) {
    var e = newEle('div');
    if (id)
        e.attr('id', id);
    return e;
}

function newEle(e, dom) {
    var d = document.createElement(e);
    if (dom)
        return d;
    return $(d);
}

//t is either a tag ID, or an object with zero or more tags
function getTagIcon(t) {
    if (!t)
        return defaultIcons.unknown;

    if (t.id) {
        //try all the tags, return the first
        if (t.value) {
            for (var x = 0; x < t.value.length; x++) {
                if (isPrimitive(t.value[x].id))
                    continue;
                var r = getTagIcon(t.value[x].id);
                if (r)
                    return r;
            }
        }
        return defaultIcons.unknown;
    } else {
        return defaultIcons[t] || defaultIcons.unknown;
    }
}


function getAvatarURL(s, style) {
    if (!style)
        style = 'retro';
    /*
     Gravatar Styles
     404: do not load any image if none is associated with the email hash, instead return an HTTP 404 (File Not Found) response
     mm: (mystery-man) a simple, cartoon-style silhouetted outline of a person (does not vary by email hash)
     identicon: a geometric pattern based on an email hash
     monsterid: a generated 'monster' with different colors, faces, etc
     wavatar: generated faces with differing features and backgrounds
     retro: awesome generated, 8-bit arcade-style pixelated faces
     blank: a transparent PNG image (border added to HTML below for demonstration purposes)
     */
	if (typeof s === 'string') {
		var i = $N.instance[s];
		if (i)
			s = i;
	}

    if (s) {
        var e = objFirstValue(s, 'email');
        var emailHash = e ? MD5(e) : (s.id ? MD5(s.id) : MD5(s.toString()));
        return 'http://www.gravatar.com/avatar/' + emailHash + '?d=' + style;
    }
    return configuration.defaultAvatarIcon;
}


function newPopup(title, p, isModal, existingDiv) {
    if (configuration.device == configuration.MOBILE) {
        p = isModal = true;
    }

    var d = existingDiv ? existingDiv : newDiv();

    d.attr('title', title);

    $('body').append(d);
    if (p === true) {
        var clientHeight = $(document).height();
        var clientWidth = $(document).width();
        var margin = 24;
        var leftMargin = 64;
        if (configuration.device == configuration.MOBILE) {
            margin = leftMargin = 0;
            clientWidth -= 4;
        }

        p = {
            width: clientWidth - leftMargin - margin,
            height: clientHeight - margin * 4,
            //position: [leftMargin, margin]
            position: {my: 'center', at: 'center', of: window}
        };
    }


    p = _.extend({
        close: function() {
            d.remove();
        },
		closeOnEscape: true,
		minHeight: 110,
		//these require jqueryui-events which are currently not included for efficiency reason
        show: 'fade',
        hide: 'fade' //'drop'
    }, p || {});

    if (isModal)
        p.modal = true;

    if (configuration.device == configuration.MOBILE) {
        p.resizable = false;
        p.draggable = false;
        //p.buttons = [ { text: "OK", click: function() { $( this ).dialog( "close" ); } } ];
    }

    if (configuration.device == configuration.MOBILE) {
        p.focus = function() {
            var backbuttonhandler = function(e) {
                if (d && d.is(':visible')) {
                    $(window).off('popstate', arguments.callee);
                    later(function() {
                        d.dialog('close');
                    });
                    return false;
                }
            };
            later(function() {
                $(window).on('popstate', backbuttonhandler);
            });
        };
    }

    d.dialog(p);

    if (configuration.device == configuration.MOBILE) {
        d.parent().css('padding', 2);
        d.parent().css('border', 0);
    }

	//Bootstrap Adaptation
	d.parent().addClass('modal-dialog modal-content');
	d.prev().addClass('modal-title modal-header navbar navbar-default');
	var titleSpan = d.prev().find('span').first();
	titleSpan.css('height', '1.5em');
	titleSpan.html('<a class="navbar-brand" style="padding: 0">' + titleSpan.text() + '</a>');


	var closeButton = d.prev().find('button').first();
	closeButton.attr('class', 'close');
	closeButton.html('<i class="fa fa-times"></i>');


    return d;
}

function isAnonymous() {
    return (getCookie('authenticated') === 'anonymous');
}

function getCookie(name) {
    var nameEQ = name + '=';
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) === ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function setCookie(key, value) {
    document.cookie = key + '=' + value;
}

/*
function replicate(host) {
	PouchDB.replicate("objects", host)
	  .on('change', function (info) {
  	    console.log('change', info);
	  }).on('complete', function (info) {
		console.log('complete', info);
	  }).on('uptodate', function (info) {
		console.log('uptodate', info);
	  }).on('error', function (err) {
		console.log('err', err);
	  });

	//$N.db.replicate.from(host)
}
function dbreset() {
	PouchDB.destroy('objects');
}
*/
