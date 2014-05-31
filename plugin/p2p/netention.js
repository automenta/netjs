/* P2P Netention network */

exports.plugin = function($N) {
    //https://github.com/marcelklehr/smokesignal
    
    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {
            
            //var AppendOnly = require("append-only");
            //var Bucket = require('scuttlebucket')
            
            var ExpiryModel = require("expiry-model");
            //var Model = require('scuttlebutt/model');

            var maxAge = 1000 * 60 * 60 * 2;
            var maxItems = 64;

            var mainChannel = new ExpiryModel({maxAge:maxAge, max:maxItems});            
            
            
            var p2p = require('./index');
            options.address = options.address; // p2p.localIp(options.address);
            options.id = $N.server.id;            
            
            var node = p2p.createNode(options);
            this.node = node;            


            var that = this;
            that.connected = false;
            var doWhenConnected = [];
            node.on('connect', function() {
                // Hey, now we have at least one peer!
                
                if (options.debug)
                    console.log('connected');
                
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
                }
            });
            
            node.peers.on('add', function(p) { 
                if (options.debug) {
                    console.log('add peer', p.id);
                }
            });
            node.peers.on('remove', function(p) { 
                if (options.debug) {
                    console.log('remove peer', p.id); 
                }
            });
            
            //process.stdin.pipe(node.broadcast).pipe(process.stdout)  // Broadcast is a stream

            node.start();

            // listen on network events...
            console.log('P2P: Started on ' + node.options.address + ':' + options.port + ', id=' + node.id)
           
            var b = node.broadcast;
            
            if (options.debug)  {
                //b.pipe(process.stdout);
            }
 
            
            $N.on('main/out', function(p) {
                mainChannel.set(node.id, p);
            });
            
            $N.on('main/set', function(k, v) {
                mainChannel.set(node.id+'/'+k, v);                
            });
                        
            mainChannel.on('update', function(k, v) {
                if (k.indexOf('/')===-1) {
                   $N.emit("main/in", v, k);
                }

                $N.emit('main/get', mainChannel.toJSON(), k, v);
            });                       
            
            var ls = mainChannel.createStream();
            ls.pipe(node.broadcast).pipe(ls);
            
        },
        
        
        stop: function() {
            //console.log('stopping');
            this.node.stop();
        }
    };
};


