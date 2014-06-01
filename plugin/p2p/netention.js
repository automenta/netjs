/* P2P Netention network */

exports.plugin = function ($N) {
    //https://github.com/marcelklehr/smokesignal

    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',


        start: function (options) {
            var sayTTL = 1000 * 60 * 2; //2min
            
            var Gossiper = require('grapevine').Gossiper;
            // Create a seed peer.
            var node = new Gossiper(options.port, options.seeds);
            node.start();

            $N.p2p = function (whenConnected, whenDisconnected) {
                node.on('started', whenConnected);
            };
            node.on('update', function (peer, k, v) {
                var peerID = node.peerValue(peer, "id");
                var peerName = node.peerValue(peer, "name") || peerID;
                if (options.debug)
                    console.log(peerName + ": " + k + "=" + JSON.stringify(v)); // peer 127.0.0.1:9999 set somekey to somevalue
                
                if (k[0] === 's') {
                    var msgNum = parseInt(k.substring(1));
                    if (msgNum!==NaN) {
                        $N.channelAdd('main', v, true, false);
                    }
                }
            });

            //console.log(g.peer_name + ' peers: ' + g.livePeers().length + '/' + g.deadPeers().length);
            $N.on('main/set', function (key, v) {
                if (v === null)
                    node.setLocalState(key, null, Date.now());
                else
                    node.setLocalState(key, v);
            });
            
            var said = 0;
            $N.on('main/say', function (v, skipBroadcast) {
                if (!skipBroadcast) {
                    node.setLocalState('s' + said, v, Date.now() + sayTTL);
                    said++;
                }
            });
            
            node.setLocalState("id", $N.server.id);
            node.setLocalState("name", $N.server.name);
            
        },

        __start: function (options) {
            var pnode = require('pnode');

            options.id = $N.server.id;

            var node = pnode.peer({
                id: options.id,
                debug: false
                //learn:true
            });

            node.expose({
                event: function (e) {
                    $N.emit("main/in", e);
                }
            });
            node.bindOn('tcp://0.0.0.0:' + options.port, function () {
                console.log('pnode started on port ' + options.port);
            });

            if (options.seeds)
                options.seeds.forEach(function (s) {
                    node.bindTo('tcp://' + s.address + ':' + s.port);
                });

            $N.p2p = function (whenConnected, whenDisconnected) {
                //if (!that.connected)
                //doWhenConnected.push(whenConnected);
                //else
                whenConnected(node);
            };

            node.on("peer", function (peer) {
                if (options.debug)
                    console.log(options.id + " peer connected: " + peer.id);
            });

            var store = node.store({
                id: 'main',
                subscribe: true,
                publish: true,
                publishInterval: 100, //"nextTick"
                debug: false,
                filter: null
            });

            /*var LRU = require("lru-cache");
            store.obj = LRU({ max: 8
                          //, length: function (n) { return n * 2 }
                          , dispose: function (key, n) { n.close() }
                          , maxAge: 1000  * 60 * 60 });*/


            store.on('*', function (u, v, w) {
                if (u === 'set') {}
                if (u === 'add') {}
                if (u === 'remove') {}
                if (u === 'update') {}

                if (options.debug) {
                    console.log(options.id + ' store ' + u + ': ', v, w, ', length: ' + _.keys(store.object()).length);
                    console.log(store.object());
                    //console.log(store.obj);
                }
            });

            /*store.set('foo', 24);
            store.set(['ping','pong'], 0);
            store.set('bazz', { zip: { zap: "!" } });
            store.set(["x",0,"y"], { a:"b" });
            store.set(["x",1], { c:"d" });*/

            /*setTimeout(function() {
              console.log('peer has:',store.object());
            }, 1000); */

            $N.on('main/out', function (p) {
                node.publish(p);

                node.all(function (remotes) {
                    remotes.forEach(function (remote) {
                        console.log(options.id, 'sending to remote', remote._pnode.id);
                        remote.event(p);
                    });
                });
            });

            $N.on('main/set', function (k, v) {
                var key = options.id + '/' + k;
                if (v === null)
                    store.del(key);
                else
                    store.set(key, v);
            });
        },

        _start: function (options) {

            //var AppendOnly = require("append-only");
            //var Bucket = require('scuttlebucket')

            var ExpiryModel = require("expiry-model");
            //var Model = require('scuttlebutt/model');

            var maxAge = 1000 * 60 * 60 * 2;
            var maxItems = 64;

            var mainChannel = new ExpiryModel({
                maxAge: maxAge,
                max: maxItems
            });


            var p2p = require('./index');
            options.address = options.address; // p2p.localIp(options.address);
            options.id = $N.server.id;

            var node = p2p.createNode(options);
            this.node = node;


            var that = this;
            that.connected = false;
            var doWhenConnected = [];
            node.on('connect', function () {
                // Hey, now we have at least one peer!

                if (options.debug)
                    console.log('connected');

                if (!that.connected) {
                    that.connected = true;
                    doWhenConnected.forEach(function (d) {
                        d(node);
                    });
                    doWhenConnected = [];
                }
            });



            $N.p2p = function (whenConnected, whenDisconnected) {
                if (!that.connected)
                    doWhenConnected.push(whenConnected);
                else
                    whenConnected(node);
            };

            node.on('disconnect', function () {
                //console.log('disconnected');
                that.connected = false;
                if (options.debug) {
                    console.log('disconnect');
                }
            });

            node.peers.on('add', function (p) {
                if (options.debug) {
                    console.log('add peer', p.id);
                }
            });
            node.peers.on('remove', function (p) {
                if (options.debug) {
                    console.log('remove peer', p.id);
                }
            });

            //process.stdin.pipe(node.broadcast).pipe(process.stdout)  // Broadcast is a stream

            node.start();

            // listen on network events...
            console.log('P2P: Started on ' + node.options.address + ':' + options.port + ', id=' + node.id)

            var b = node.broadcast;

            if (options.debug) {
                //b.pipe(process.stdout);
            }


            $N.on('main/out', function (p) {
                mainChannel.set(node.id, p);
            });

            $N.on('main/set', function (k, v) {
                mainChannel.set(node.id + '/' + k, v);
            });

            mainChannel.on('update', function (k, v) {
                if (k.indexOf('/') === -1) {
                    $N.emit("main/in", v, k);
                }

                $N.emit('main/get', mainChannel.toJSON(), k, v);
            });

            var ls = mainChannel.createStream();
            ls.pipe(node.broadcast).pipe(ls);

        },


        stop: function () {
            //console.log('stopping');
            this.node.stop();
        }
    };
};