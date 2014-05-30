/* http://wikimapia.org/api/ */

// $N.permissions.wikimapia_key

//http://api.wikimapia.org/?key=example&function=place.getbyarea&coordsby=bbox&bbox=-79.89498%2C40.425%2C-79.86511%2C40.44538&format=json&pack=&language=en&data_blocks=main%2Cphotos%2Ccomments%2Clocation%2C&page=1&count=100&category=&categories_or=&categories_and=

var request = require('request');
var _ = require('lodash');

exports.plugin = function($N) { return {

    name: 'Wikimapia',	
	description: 'Provides geolocated data from Wikimapia',
	options: { },
    version: '1.0',
    author: 'http://wikimapia.org',
    
	start: function() { 
        
       $N.addTags([
            {
                uri: 'Wikimapia.Interest', name: 'Interest in a Location (WikiMapia)', 
				description: 'Interest in a geolocation, which triggers a data load from Wikimapia',
                properties: {
					'Wikimapia.InterestActive': { name: 'Enabled', type: 'boolean', default: 'true', min: 1, max: 1 }
					//range (length/width of scan area)
                }
            },
            {
                uri: 'Wikimapia.Node', name: 'Wikimapia Place', 
				description: 'Wikimapia map node',
                properties: {
                    //'OSM.amenity': { name: 'Amenity', type: 'text', min: 1 }
                }
            },
        ], [ 'Internet' ]);

		var apikey = $N.permissions.wikimapia_key;
		if (!apikey) {
			console.error('Wikimapia plugin requires wikimapia_key.  Add to permissions block in options file');
			return;
		}

        
		this.update = _.throttle(function(x) {

			if (!$N.objFirstValue(x, 'Wikimapia.InterestActive')) {
				return;
			}

			var where = x.earthPoint();

			var radius = 0.03;
			var halfRadius = radius/2.0;
			if (where) {
				
				getWikimapia(apikey, [where[0]-halfRadius, where[1]-halfRadius, where[0]+halfRadius, where[1]+halfRadius], 
					function(id, name, desc, lat, lon, tags) {
						var n = $N.objNew('wikimapia_' + id, name || 'Location').earthPoint(lat, lon);
						n.addDescription(desc);
						n.addTags(_.map(tags, function(t) { return 'Wikimapia.' + t; } ) );						
						$N.pub(n);
					}
				);
				
			}

		}, 1000);
        
		//reload existing interests
		var that = this;
        $N.getObjectsByTag('Wikimapia.Interest', function(x) {
			that.update(x);
        });   

		//test Location
		//var testLocation = $N.objNew("WikimapiaTestLocation", "Wikimapia Test Location", ['Wikimapia.Interest'] ).earthPoint(-79.89498,40.425).add('Wikimapia.InterestActive', 'true');
		//$N.pub( testLocation );
    },
            
    onPub: function(x) {
        if (x.hasTag('Wikimapia.Interest')) {
            this.update(x);
        }
    },
    
	stop: function() {

	}


}; };


function getWikimapia(apikey, bounds, eachNode) {

	var url = 'http://api.wikimapia.org/?key=' + apikey
		+ '&function=place.getbyarea&coordsby=bbox&bbox='
		+ bounds[0] +',' + bounds[1] + ',' + bounds[2] + ',' + bounds[3]
		+ '&format=json&pack=&language=en&data_blocks=main%2Cphotos%2Ccomments%2Clocation%2C&page=1&count=100&category=&categories_or=&categories_and=';

	request(url, function (error, response, body) {
		if (!error && response.statusCode == 200) {
			var places = JSON.parse(body).places;
			if (places) {
				for (var i = 0; i < places.length; i++) {
					var p = places[i];

					var id = p.id;
					var name = p.title;
					var tags = _.map(p.tags, function(T) { return T.title; });
					var lat = p.location.lat;
					var lon = p.location.lon;
					var desc = p.description;
					if (p.urlhtml)
						desc = desc + '<br/>' + p.urlhtml;

					eachNode(id, name, desc, lat, lon, tags);
				}
			}
		}
		else {
			console.error('getWikimapia', error);
		}
	});
	
}
