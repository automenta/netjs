function startNode(port, seeds, debug) {
    require('../core.js').start({
        name: 'a' + port,
        plugins: {
            "p2p/netention.js": {                
                debug: debug,
                port: port,
                address: '127.0.0.1', // Tell it your subnet and it'll figure out the right IP for you
                seeds: seeds // th e address of a seed (a known node)                        
            }
        },
        start: function($N) {
            $N.p2p(function(node) {
                
                
                
                if (debug) {
                    $N.on('main/in', function(p) {
                        console.log(node.id, 'in', p);
                    });
                    $N.on('main/get', function(data, k, v) {
                        console.log(node.id, 'get', _.keys(data).length, k, v);
                    });
                }
                else {
                    var n = 0;
                    function pulse() {
                        $N.emit('main/out', ["event",n]);
                        //$N.emit('main/set', n, 'a' + port /*, m:('@' + Date.now())*/);
                        n++;
                    }
                    setInterval(pulse, 500);
                    pulse();
                }
                      
                
            });
        }
    });
}
    

startNode(10000, [], false);
startNode(10001, [{port: 10000, address:'127.0.0.1'}], false);

setTimeout(function() {
    startNode(10002, [{port: 10000, address:'127.0.0.1'}], true);
}, 5000);
           