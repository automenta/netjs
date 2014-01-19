var csv = require('ya-csv');

exports.plugin = {
        name: 'Nuclear Facilities',    
		description: 'Earth nuclear facilities (from IAEA)',
		options: { },
        version: '1.0',
        author: 'http://enformable.com',
        
		start: function(netention, util) { 
            
            netention.addTags([ {
                uri: 'NuclearFacility', name: 'Nuclear Facility',
                //tag: [ 'environment' /* 'Pollution' */ ],
                properties: {
            			 'reactorsActive': { name: 'Active Reactors', type: 'integer' },
                         'reactorsUnderConstruction': { name: 'Reactors Under Construction', type: 'integer' },
                         'reactorsShutDown': { name: 'Shut Down Reactors', type: 'integer' },
                }
            } ]);
            
            
            var reader = csv.createCsvFileReader('./plugin/iaea_nuclear/IAEANuclear.csv', {
                'separator': ',',
                'quote': '"',
                'escape': '"',       
                'comment': '',
            });

            var f = [];
            reader.addListener('data', function(data) {
                var x = data;
                
                var name = x[1];
                var location = x[2];
                
                if (!location)
                    return;
               
                var lat = parseFloat(location.split(',')[0]);
                var lon = parseFloat(location.split(',')[1]);
               
                var reactors = [ parseFloat(x[3]), 
                                parseFloat(x[4]), 
                                parseFloat(x[5]),
                                parseFloat(x[6]) ];
    
                var y = util.objNew(
                    'NuclearFacility_' + name.replace(/\s+/g, '_'), 
                    name + ' Nuclear Facility'
                );
                y.createdAt = 1316995200;
                util.objAddTag(y, 'NuclearFacility');
                util.objAddGeoLocation(y, lat, lon);
                if (reactors[1] > 0)
                    util.objAddValue(y, 'reactorsActive', reactors[1]);
                if (reactors[2] > 0)
                    util.objAddValue(y, 'reactorsUnderConstruction', reactors[2]);
                if (reactors[3] > 0)
                    util.objAddValue(y, 'reactorsShutDown', reactors[3]);
                
                
                f.push(y);
                
            });
            reader.addListener('end', function() {
                function existMore() {
                    if (f.length > 0)
                        netention.notice(f.pop(), existMore);
                }
                existMore();
            });

            
        },
		stop: function(netention) { }
};