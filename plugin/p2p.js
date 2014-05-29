/* P2P Netention network */

exports.plugin = function($N) {
    //https://github.com/marcelklehr/smokesignal
    var p2p = require('smokesignal');

    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {

            options.address = p2p.localIp(options.address);
            
            var node = p2p.createNode(options);
            this.node = node;
            
            // listen on network events...

            node.on('connect', function() {
              // Hey, now we have at least one peer!

              // ...and broadcast stuff -- this is an ordinary duplex stream!
              node.broadcast.write('HEYO! I\'m here');
            })

            node.on('disconnect', function() {
              // Bah, all peers gone.
            })

            // Broadcast is a stream
            process.stdin.pipe(node.broadcast).pipe(process.stdout)

            // Start the darn thing
            node.start()

        },
        
        stop: function() {
            this.node.stop();
        }
    };
};
