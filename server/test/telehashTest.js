var tele = require("telehash");

//var fs = require("fs");

var TEST_PORT = 10902;

tele.genkey(function(err, seedKey){
	//CREATE SEED
  	//fs.writeFileSync("./seed.public", JSON.stringify( { public: seedKey.public }, null, 4));  
	console.log('Public Key:');
	console.log(seedKey.public);

	var seed = tele.hashname(seedKey, { port: TEST_PORT });
	console.log("seed online at", seed.ip+":"+seed.port, "with the hashname", seed.hashname);

	seed.listen("object", function(err, stream, js) {
		console.log('received object: ', js);
	});

	//CREATE CLIENT
	tele.genkey(function(err, clientKey){
		var client= tele.hashname(clientKey);

		client.addSeed({ip:"localhost",port:TEST_PORT,pubkey:seedKey.public});

		client.online(function(err) {
			console.log("client online status", err?err:true, client.hashname);

			function ping() {
				client.stream(seed.hashname, "object"/*, function(err, stream, js) {
				}*/).send('ping');
			}

			setInterval(ping, 5000);
		});

	});

});


