//load CSV exported from Mindmodel
//5 cols: source type, source name, statement, target type, target name

var csv = require('ya-csv');

var readCSV = function(path, out, finished) {
	var reader = csv.createCsvFileReader(path, {
	    'separator': '\t'
//	    'quote': '"',
//	    'escape': '"',       
//	    'comment': '',
	});

	reader.addListener('data', function(data) {
		out(getEntry(data));
	});

	if (finished) {
		reader.addListener('end', function() {
			finished();
		});
	}
}

var getEntry = function(data) {

	function spaceToUnderscore(x) {
		if (x == undefined)
			return "_";
		return x.replace(/ /g, '_');
	}

	data[0] = spaceToUnderscore(data[0]);
	data[1] = spaceToUnderscore(data[1]);
	data[2] = spaceToUnderscore(data[2]);
	data[3] = spaceToUnderscore(data[3]);
	data[4] = spaceToUnderscore(data[4]);

	var srcID = data[0] + '.' + data[1];
	var targetID = data[3] + '.' + data[4];

	var o = {
		uri: srcID,
		tag: data[0],
		statement: [
			[ data[2], targetID ]
		]
	};

	return o;
}

/*
var MMCSV = function(channel, path) {
	var s = sensor.Sensor('MMSCV_' + path, function() {

		readCSV(path, function(o) {		
			s.out.push([channel, o]);
		});

	}, function() { 	});

	return s;
}

exports.readCSV = readCSV;
exports.getEntry = getEntry;
exports.MMCSV = MMCSV;
*/
