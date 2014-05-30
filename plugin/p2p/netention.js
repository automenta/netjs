/* P2P Netention network */

exports.plugin = function($N) {
    //https://github.com/marcelklehr/smokesignal

    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {

            var p2p = require('./index');
            options.address = p2p.localIp(options.address);
            
            var node = p2p.createNode(options);
            this.node = node;
            
            // listen on network events...
            console.log('IP', node.options.address, 'ID', node.id)

            node.on('connect', function() {
              // Hey, now we have at least one peer!
              
              //node.broadcast.write('a');
              
            });
            
            $N.p2p = function(whenConnected) {
                node.on('connect', function() {
                    whenConnected(node);
                });
            };

            node.on('disconnect', function() {
              console.log('disconnected');
              console.log('  ', new Error().stack);
            })
            
            //node.on('new peer', function(p) { console.log('new peer', p.id); } );

            // Broadcast is a stream
            //process.stdin.pipe(node.broadcast).pipe(process.stdout)

            node.start()

        },
        
        stop: function() {
            //console.log('stopping');
            this.node.stop();
        }
    };
};
