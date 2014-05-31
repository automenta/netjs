/* P2P Netention network */

exports.plugin = function($N) {
    //https://github.com/marcelklehr/smokesignal
    
    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {
            
            var Model = require('scuttlebutt/model')
            var ExpiryModel = require("expiry-model");
            //var AppendOnly = require("append-only");
            var p2p = require('./index');
            var Bucket = require('scuttlebucket')

            options.address = p2p.localIp(options.address);
            options.id = $N.server.name;
            
            var node = p2p.createNode(options);
            this.node = node;
            
            // listen on network events...
            console.log('P2P: Started on ' + node.options.address + ':' + options.port + ', id=' + node.id)

            var that = this;
            that.connected = false;
            var doWhenConnected = [];
            node.on('connect', function() {
                // Hey, now we have at least one peer!
              
                if (!that.connected) {
                    that.connected = true;
                    doWhenConnected.forEach(function(d) {
                        d(node);
                    });
                    doWhenConnected = [];
                }
            });
            
            $N.p2p = function(whenConnected, whenDisconnected) {
                if (!that.connected)
                    doWhenConnected.push(whenConnected);
                else
                    whenConnected(node);
            };

            node.on('disconnect', function() {
                //console.log('disconnected');
                that.connected = false;
                if (options.debug) {
                    console.log('disconnect'); 
                    console.log(_.keys(that.channelsLocal.get("main").toJSON()).length, 
                                _.keys(that.channelsRemote.get("main").toJSON()).length );
                }
            });
            
            node.on('new peer', function(p) { 
                if (options.debug) {
                    console.log('New peer', p.id); 
                    console.log(_.keys(that.channelsLocal.get("main").toJSON()).length, 
                                _.keys(that.channelsRemote.get("main").toJSON()).length );
                }
            });
            
            //process.stdin.pipe(node.broadcast).pipe(process.stdout)  // Broadcast is a stream

            node.start();
                        
            this.channelsLocal = new Bucket();
            this.channelsRemote = new Bucket();            
            this.addChannel = function(channel) {
                var maxAge = 1000 * 60 * 60 * 2;
                var maxItems = 64;
                
                var l = new ExpiryModel({maxAge:maxAge, max:maxItems});
                var r = new ExpiryModel({maxAge:maxAge, max:maxItems});
                
                this.channelsLocal.add(channel, l);
                this.channelsRemote.add(channel, r);
                
                r.on("update", function (key, value) {
                    $N.channelAdd(channel, value);
                    //console.log("incoming: ", key, value, _.keys(r.toJSON()).length, '->', _.keys(l.toJSON()).length );
                });  
                /*r.on("sync", function() {
                    console.log(channel, 'sync');
                });*/
            };
            this.addChannel("main");
           
            var b = node.broadcast;

            b.pipe(this.channelsRemote.createStream({ readable: true, sendClock: true}))
             .pipe(this.channelsLocal.createStream({ writable: false, sendClock: true}))
             .pipe(b);
            
            
            /*
                If have are using scuttlebutt in production, you must register on 'error' listener in case someone sends invalid data to it.

                ** Any stream that gets parsed should have an error listener! **

                net.createServer(function (stream) {
                  var ms = m.createStream()
                  stream.pipe(ms).pipe(stream)
                  ms.on('error', function () {
                    stream.destroy()
                  })
                  stream.on('error', function () {
                    ms.destroy()
                  })
                }).listen(9999)            
            */
            
            /*if (options.debug) {
                b.pipe(process.stdout);
            }*/
        },
        
        onChannel: function(param) {
            var channel = param[0];
            var object = param[1];
            
            var m = this.channelsLocal.get(channel);

            if (!m) return; //TODO add channel?
                
            if (!m.messageID)
                m.messageID = 0;

            m.set(this.node.id + '.' + m.messageID, object);
            m.messageID++;
            
        },
        
        stop: function() {
            //console.log('stopping');
            this.node.stop();
        }
    };
};
