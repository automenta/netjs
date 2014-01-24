var xml2object = require('xml2object');
var request = require('request');

exports.plugin = function($N) { return {

    name: 'OpenStreetMaps',	
	description: 'Provides geolocated data from OpenStreetMaps',
	options: { },
    version: '1.0',
    author: 'http://OpenStreetMaps.org',
    
	start: function() { 
        
       $N.addTags([
            {
                uri: 'OSM.Interest', name: 'Interest in a Location (OSM)', 
				description: 'Interest in a geolocation, which triggers a data load from OpenStreetMaps',
                properties: {
					'OSM.InterestActive': { name: 'Enabled', type: 'boolean', default: 'true', min: 1 /* url */ }
                    //'OSM.location': { name: 'Location', type: 'spacepoint' /* url */ }
					//range (length/width of scan area)
                }
            },
            {
                uri: 'OSM.Node', name: 'OpenStreetMaps Place', 
				description: 'OpenStreetMaps map node',
                properties: {
                    //'OSM.amenity': { name: 'Amenity', type: 'text', min: 1 }
                }
            },
        ], [ 'Internet' ]);

		//http://wiki.openstreetmap.org/wiki/Key:amenity
		$N.addTags([
			{ uri: 'OSM.parking', name: 'Parking Location', tag: [ 'OSM.Node', 'Transport' ] },
			{ uri: 'OSM.fuel', name: 'Fuel', tag: [ 'OSM.Node', 'Transport', 'Infrastructure' ] },
			{ uri: 'OSM.car_wash', name: 'Car Wash', tag: [ 'OSM.Node', 'Transport' ] },
			{ uri: 'OSM.parking_entrance', name: 'Parking Entrance', tag: [ 'OSM.Node', 'Transport' ] },
			{ uri: 'OSM.bicycle_parking', name: 'Bicycle Parking Location', tag: [ 'OSM.Node', 'Transport' ] },

			{ uri: 'OSM.place_of_worship', name: 'Place of Worship', tag: [ 'OSM.Node' ] },
			{ uri: 'OSM.school', name: 'School', tag: [ 'OSM.Node' ] },


			{ uri: 'OSM.hospital', name: 'Hospital', tag: [ 'OSM.Node', 'Health' ] },
			{ uri: 'OSM.dentist', name: 'Dentist', tag: [ 'OSM.Node', 'Health' ] },
			{ uri: 'OSM.pharmacy', name: 'Pharmacy', tag: [ 'OSM.Node', 'Health' ] },
			{ uri: 'OSM.doctors', name: 'Doctors', tag: [ 'OSM.Node', 'Health' ] },

			{ uri: 'OSM.grave_yard', name: 'Grave Yard', tag: [ 'OSM.Node' ]},

			{ uri: 'OSM.cafe', name: 'Cafe', tag: [ 'OSM.Node', 'Food' ] },
			{ uri: 'OSM.fast_food', name: 'Fast Food', tag: [ 'OSM.Node', 'Food' ] },
			{ uri: 'OSM.vending_machine', name: 'Vending Machine', tag: [ 'OSM.Node', 'Food' ] },
			{ uri: 'OSM.restaurant', name: 'Restaurant', tag: [ 'OSM.Node', 'Food' ] },

			{ uri: 'OSM.atm', name: 'ATM Machine', tag: [ 'OSM.Node' ] },
			{ uri: 'OSM.police', name: 'Police', tag: [ 'OSM.Node', 'Infrastructure' ] },
			{ uri: 'OSM.bank', name: 'Bank', tag: [ 'OSM.Node' ] },
			{ uri: 'OSM.post_box', name: 'Post Box', tag: [ 'OSM.Node', 'Infrastructure' ] },
			{ uri: 'OSM.pub', name: 'Pub', tag: [ 'OSM.Node', 'Food' ] },
			{ uri: 'OSM.bar', name: 'Bar', tag: [ 'OSM.Node', 'Food' ] },


/*OSM.public_building
OSM.fire_station
OSM.social_centre
OSM.shelter
OSM.post_office
OSM.bench
OSM.fountain

OSM.university
OSM.library
OSM.kindergarten

OSM.Wedding Location
OSM.theatre
OSM.swimming_pool
OSM.cinema
OSM.ice_cream
OSM.studio*/

		]);
		
        
		this.update = _.throttle(function(x) {
			if (!$N.objFirstValue(x, 'OSM.InterestActive')) {
				return;
			}

			var where = x.earthPoint();

			var radius = 0.03;
			var halfRadius = radius/2.0;
			if (where) {
				getOpenStreetMaps([where[1]-halfRadius, where[0]-halfRadius, where[1]+halfRadius, where[0]+halfRadius], 
					function(id, name, amenity, lat, lon, data) {

						var n = $N.objNew('osm_' + id, name || 'Location').earthPoint(lat, lon);
						n.addDescription(JSON.stringify(data));
						if (amenity) {
							n.addTag('OSM.' + amenity);
						}
						$N.pub(n);
					}
				);
			}

		}, 1000);
        
		//reload existing interests
		var that = this;
        $N.getObjectsByTag('OSM.Interest', function(x) {
			that.update(x);
        });   

		//test Location
		//var testLocation = $N.objNew("OSMTestLocation", "OSM Test Location", ['OSM.Interest'] ).earthPoint(-79.89498,40.425);
		//$N.pub( testLocation );
    },
            
    onPub: function(x) {
        if (x.hasTag('OSM.Interest')) {
            this.update(x);
        }
    },
    
	stop: function() {

	}


}; };

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

function getOpenStreetMaps(bounds, eachNode) {
	var url = 'http://jxapi.openstreetmap.org/xapi/api/0.6/node[amenity=*][bbox='+ 
		bounds[0] +',' + bounds[1] + ',' + bounds[2] + ',' + bounds[3] + ']';

	var parser = new xml2object([ 'node' ], request.get(url));

	parser.on('object', function(name, obj) {
	    if (name == 'node') {
	    	
	    	if (obj.tag) {
	    		var name = '';
	    		var amenity = '';
	    		var lat = parseFloat(obj.lat);
	    		var lon = parseFloat(obj.lon);			    	

				var data = { };				
				for (var i = 0; i < obj.tag.length; i++) {
					var t = obj.tag[i];
					if (t.k == 'amenity')
						amenity = t.v;
					else if (t.k == 'name')
						name = t.v;
					else {
						data[t.k] = t.v;
					}
				}
				
				if ((name!='') || (amenity!='')) {
					if (eachNode) {
						eachNode(obj.id, name, amenity, lat, lon, data);
					}
				}
	    	}
	    }
	});
	parser.on('end', function() {
	    //console.log('Finished parsing xml!');
	});
	
	parser.start();
	
}
