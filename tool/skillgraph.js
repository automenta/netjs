/*
USAGE:
node skillgraph.js  < curiosume.rdf > curiosume.dot ; fdp curiosume.dot -Tpng > curiosume.png
node skillgraph.js  < curiosume.rdf > curiosume.dot ; neato curiosume.dot -Tpng > curiosume.png
*/

var readline = require('readline');
var _ = require('underscore');
var http = require('http');

var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false
});


var users = { };
var tags = [ ];

function getUser(u) {
	if (users[u]) return users[u];
	users[u] = { tags: {} };
	return users[u];
}

rl.on('line', function (l) {
	//..
	var ll = l.split('>');
	ll[0] = ll[0].substr(ll[0].lastIndexOf('/')+1);

	var u = ll[0];

	if (ll[2].indexOf('dbpedia.org/')!=-1) {
		ll[2] = ll[2].substr(ll[2].lastIndexOf('/')+1);
		tags.push(ll[2]);
	}

	if (ll[1].indexOf('zertify.com/')!=-1)  {
		ll[1] = ll[1].substr(ll[1].lastIndexOf('/')+1);
		getUser(u).tags[ll[2]] = ll[1];
	}
	else {
		ll[1] = ll[1].substr(2);
		if (ll[1] == 'foaf:name')
			getUser(u).name = ll[2].substr(2, ll[2].lastIndexOf('"')-2);
	}

});

rl.on('close', function() {
	tags = _.unique(tags);

	/*console.log(users);
	console.log(tags);*/

	/*
		digraph {
			a -> b[label="0.2",weight="0.2"];
			a -> c[label="0.4",weight="0.4"];
			c -> b[label="0.6",weight="0.6"];
			c -> e[label="0.6",weight="0.6"];
			e -> e[label="0.1",weight="0.1"];
			e -> b[label="0.7",weight="0.7"];
		}	
	*/

	function d(t) {
		//escape a tag
		return '_' + t.replace(/-/g, '__').replace(/\(/g, '_').replace(/\)/g, '').replace(/\,|\.|#| /g, '_');
	}

	console.log('graph {');

	//add user tags
	_.each(users, function(u, k) {
		var nodeName = '_' + k;
		var nodeLabel =  u.name || k

		console.log(nodeName + ' [label="' + nodeLabel + '", shape=box, color=black, fontsize=24]');

		_.each(u.tags, function(v, t) {
			var tagColorPresets = {
				'BeginnerStudent': 'red',
				'IntermediateStudent': 'orange',
				'CollaboratingStudent': 'yellow',
				'CollaboratingTeacher': 'green',
				'IntermediateTeacher': 'blue',
				'ExpertTeacher': 'purple',
//				'Can': 'fuchsia',
//				'Need': '#bbf',
//				'Not': 'gray'
			};

			var c = tagColorPresets[v] || 'black';
			console.log(nodeName + ' -- ' + d(t) + ' [color=' + c +'];');
		});
	});


	//update categories
	var count = 0;
	_.each(tags, function(t) {

		//http://en.wikipedia.org/w/index.php?action=raw&title=PAGENAME
		http.get("http://en.wikipedia.org/w/index.php?action=raw&title=" + t, function(response) {
			  var str = '';
			  response.on('data', function (chunk) { str += chunk; });
			  response.on('end', function () {
					var lines = str.split('\n');
					_.each(lines, function(l) {
						if (l.indexOf('[[Category:') == 0) {
							var c = l.substring(11, l.length-2);
							if (c.indexOf('|')!=-1)
								c = c.substring(0, c.indexOf('|'));
								
							console.log(d(t) + ' -- ' + d(c) + ' [color=gray];');
						}
					});
					count++;
					if (count == tags.length)
						console.log('}');
			  });			
		}).on('error', function(e) {
		  console.log("Got error: " + e.message);
		});
	});
	


});

