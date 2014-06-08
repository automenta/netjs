var _ = require('lodash');


var peers = [];

function update() {	
 	process.stdout.write('\033c');
	peers.forEach(function(p) {
		//console.log(p);		
		//console.log();
	});	
	//log.forEach(console.log);
}
function log(x) {
	console.log(x);
}

//setInterval(update, 1000);

function startNode(port, seeds, debug, strobe) {
    require('../server/core.js').start({
		id: 'p2pdebug',
        name: 'a' + port,
        plugins: {
            "p2p/netention.js": {                
                debug: debug,
                port: port,
                address: '24.131.65.218', 
                seeds: seeds,
				network: "netention",
				addressMap: {
					"192.168.0.102": "24.131.65.218",
					"127.0.0.1": 	 "24.131.65.218"
				},
			}
        },
        start: function($N) {
			var node = $N.node;
			node.on('start', function() {
				
                peers.push(node);
				
				node.know('*', function (peer, v) {
					console.log(this.peer_name + " knows " + peer + " set " + this.event + "=" + JSON.stringify(v));
					//console.log(node.livePeers());
    			});
				
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
                        $N.emit('main/set', 'beat', Date.now() );
                    }
                    setInterval(pulse, 5000);
                    pulse();
                }

                
            });
        }
    });
}
    

startNode(9999, ['54.84.209.171:9001',':10000'], true, true);

/*
setTimeout(function() {
    startNode(10002, ['127.0.0.1:10001'], true, true);
}, 5000);*/
           
