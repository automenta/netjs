var mm = require('./mindmodel.js');
//var mm = require('../server/object.js');

var c = { };

function mergeObject(o) {
	var id = o.id;

	if (c[id]== undefined) {
		c[id] = o;

	}
	else {
		if (o.statement!=undefined) {
			for (k in o.statement) {
				c[id].statement.push(o.statement[k]);
			}
		}	
	}

}

/*
var path = process.argv[2];
if (path) {
	console.log('Loading ' + path);
}
else {
	console.log('Usage: mindmodel.gephi.js [input_file.ssv]');
	return;
}

mm.readCSV(path, function(o) {
	mergeObject(o);	
}, function() {
	for (k in c) {
		var o = c[k];
		for (si in o.statement) {
			var s = o.statement[si];
			console.log(o.id + ',' + s[0] + ',' + s[1]);
		}
	}
});


*/