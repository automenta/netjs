//http://harrywood.co.uk/maps/uixapi/xapi.html XAPI URL Builder

//wget http://jxapi.openstreetmap.org/xapi/api/0.6/node[bbox=-79.89498,40.425,-79.86511,40.44538]
/*
rabler.ru :
http://jxapi.osm.rambler.ru/xapi/api/0.6/map?bbox=-180,-90,180,90
MapQuest (out of date) :
http://open.mapquestapi.com/xapi/api/0.6/map?bbox=-180,-90,180,90
jxapi.openstreetmap.org :
http://jxapi.openstreetmap.org/xapi/api/0.6/map?bbox=-180,-90,180,90
Overpass API :
http://www.overpass-api.de/api/xapi?map?bbox=-180,-90,180,90
*/

var xml2object = require('xml2object');
var util = require('../client/util.js');

//function OpenStreetMaps(bounds) {
//
//	var s = sensor.Sensor('OpenStreetMaps' + JSON.stringify(bounds), function() {
//
//		var parser = new xml2object([ 'node' ], /*TODO get bounds from URL*/ '/tmp/node.xml');
//	
//		parser.on('object', function(name, obj) {
//		    //console.log('Found an object: %s', name);
//		    if (name == 'node') {
//		    	
//		    	if (obj.tag) {
//		    		var name = '';
//		    		var amenity = 'node';
//		    		var lat = parseFloat(obj.lat);
//		    		var lon = parseFloat(obj.lon);			    	
//					
//					for (var i = 0; i < obj.tag.length; i++) {
//						var t = obj.tag[i];
//						if (t.k == 'amenity')
//							amenity = t.v;
//						else if (t.k == 'name')
//							name = t.v;
//					}
//					
//					if (name!='') {
//						var uri = 'osm.node.' + obj.id;
//						s.out.push({
//							'uri': uri,
//							name: name,
//							type: 'osm.' + amenity,
//							geolocation: [lat, lon]
//						});
//					}
//		    	}
//		    }
//		});
//		parser.on('end', function() {
//		    //console.log('Finished parsing xml!');
//		});
//	
//		parser.start();
//	});
//	
//	return s;
//	
//}
//
//exports.OpenStreetMaps = OpenStreetMaps;