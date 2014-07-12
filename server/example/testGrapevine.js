var Gossiper = require('grapevine').Gossiper;
// Create a seed peer.
var seed = new Gossiper(9000, []);
seed.start();

// Create 20 new peers and point them at the seed (usually this would happen in 20 separate processes)
// To prevent having a single point of failure you would probably have multiple seeds
for(var i = 9001; i <= 9020;i++) {
	(function(j) {
	  //For IPv6 peers use the format [ad:dre::ss]:port. e.g. [::1]:9000
	  var g = new Gossiper(j, ['127.0.0.1:9000']);
	  g.start();

	  g.on('update', function(peer, k, v) {
		console.log(g.peer_name + " saw peer " + peer + " set " + k + " to " + v); // peer 127.0.0.1:9999 set somekey to somevalue
	  });

		setTimeout(function() {
			console.log(g.peer_name + ' peers: ' + g.livePeers().length + '/' + g.deadPeers().length);
		}, 2500);
		setTimeout(function() {
			console.log(g.peer_name + ' peers: ' + g.livePeers().length + '/' + g.deadPeers().length);
		}, 7500);

	})(i);
}

// Add another peer which updates it's state after 15 seconds
var updater = new Gossiper(9999, ['127.0.0.1:9000']);
updater.start();
setTimeout(function() {
  updater.setLocalState('somekey', 'somevalue');

  // with ttl
  updater.setLocalState('somekey', 'somevalue', Date.now() + 5000); // 10 seconds from now this key will start to expire in the gossip net
}, 5000);
