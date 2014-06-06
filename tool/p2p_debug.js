var _ = require('lodash');


var peers = [];
var log = [];

function update() {	
 	process.stdout.write('\033c');
	peers.forEach(function(p) {
		if (p.debug)
			p.debug();
		else
			console.log(p);
		
		console.log();
	});	
	//log.forEach(console.log);
}
function log(x) {
	console.log(x);
}


setInterval(update, 1000);

function startNode(port, seeds, debug, strobe) {
    require('../server/core.js').start({
		id: 'p2pdebug',
        name: 'a' + port,
        plugins: {
            "p2p/netention.js": {                
                debug: debug,
                port: port,
                address: '192.168.0.102', // Tell it your subnet and it'll figure out the right IP for you
                seeds: seeds // th e address of a seed (a known node)                        
			}
        },
        start: function($N) {
            $N.p2p(function(node) {
				
                peers.push(node);
				
                if (debug) {
                    $N.on('main/in', function(p) {
                        log(node.id, 'in', p);
                    });
                    $N.on('main/get', function(data, k, v) {
                        log(node.id, 'get', _.keys(data).length, k, v);
                    });
                }
                if (strobe) {
                    function pulse() {
                        $N.emit('main/set', 'beat', { m:('@' + Date.now()) });
                    }
                    setInterval(pulse, 15000);
                    pulse();
                }
                node.on('contact:add', function(c) {
					peers.push(c);
					//node.debug();
				});
                
            });
        }
    });
}
    

startNode(9999, ['54.84.209.171:9001','192.168.0.102:10000'], false, true);

/*
setTimeout(function() {
    startNode(10002, ['127.0.0.1:10001'], true, true);
}, 5000);*/
           
