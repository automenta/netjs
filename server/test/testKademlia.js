var dht = require('kademlia')

var host = '192.168.0.102';

function initPeer(portNumber, targetPort, onConnect) {
	var node = new dht.KNode({ address: host, port: portNumber });
	console.log(node.self);
	if (targetPort) {
		node.connect(host, targetPort, function(err) {
			if (err) {
				console.err('CONNECT: ' + err);
				return;
			}
			else {
			   	console.log("Successfully connected to", targetPort);
			}
			onConnect(node);		
		});
	}
}

initPeer(12004);

console.log('-----------');

setInterval(function() {
	initPeer(12005, 12004, function(knode) {
		console.log(knode.self);

		/*
		knode.set('foo', 'bar');

		knode.get('foo', function(err, data) {
			console.log("Retrieved", data, "from DHT");
			console.log(data == 'bar');
		});*/
	});
}, 1000);


