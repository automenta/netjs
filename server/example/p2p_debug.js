function startNode(port, seeds, debug, strobe) {
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
                if (strobe) {
                    var n = 0;
                    function pulse() {
                        //$N.emit('main/out', ["e",n,node.id]);
                        $N.emit('main/set', n, {x:('a' + port), m:('@' + Date.now())});
                        n++;
                    }
                    setInterval(pulse, 500);
                    pulse();
                }
                      
                
            });
        }
    });
}
    

startNode(10001, ['127.0.0.1:10000'], true);

/*
setTimeout(function() {
    startNode(10002, ['127.0.0.1:10001'], true, true);
}, 5000);*/
           