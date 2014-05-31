function startNode(port, seeds, pipeToStdout) {
    require('../core.js').start({
        name: 'a' + port,
        plugins: {
            "p2p/netention.js": {                
                debug: true,
                port: port,
                address: '127.0.0.1/255.255.255.0', // Tell it your subnet and it'll figure out the right IP for you
                seeds: seeds // th e address of a seed (a known node)                        
            }
        },
        start: function($N) {
            $N.p2p(function(node) {
                
                
                function pulse() {
                    $N.plugins("onChannel", ["main", {a:'author', m:('@' + Date.now()) } ] );
                }
                
                setInterval(pulse, 2000);
                pulse();
                
                
            });
        }
    });
}
    

startNode(10001, [{port: 10000, address:'127.0.0.1'}], true);

/*setTimeout(function() {
    startNode(10002, [{port: 10001, address:'127.0.0.1'}], false);
}, 1000);*/
           