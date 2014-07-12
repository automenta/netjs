var dht = require('dht.js');

// Create DHT node (server)
var node = dht.node.create( 10000 /* optional UDP port there */);

// Connect to known node in network
/*
dht.transmissionbt.com
router.utorrent.com
router.bittorrent.com  : 6881
*/
node.connect({
  id: new Buffer(0), /* <-- optional */
  address: 'router.bittorrent.com',
  port: 6881
});

// Tell everyone that you have services to advertise
var hash = new Buffer([0,9,9,9,1,1,6,7,8,9,
                               0,1,3,5,8,9,6,7,8,9]);
node.advertise(hash, 10000 /* port */);

// Wait for someone to appear
node.on('peer:new', function (infohash, peer, isAdvertised) {
  // Ignore other services
  //if (!isAdvertised) return;

  //console.log('peer add:', peer.address, peer.port, isAdvertised);

  // Stop listening
  //node.close();

  // Returns node's state as a javascript object
  var state = node.save();
  console.log('peers: ', JSON.stringify(state.nodes));

  // Create node from existing state
  //var old = dht.node.create(state);

  // Just cleaning up
  //old.close();
});

node.on('peer:delete', function (infohash, peer) {
  //console.log('peer remove:', peer.address, peer.port);
});

node.on('error', function(e) {
	console.error(e);
});

node.on('timeout', function(e) {
	console.error('timeout');
});

node.on('listening', function() {
	console.log('listening');
 	var state = node.save();
	console.log('state: ', state);
});
