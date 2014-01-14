//http://earthquake.usgs.gov/earthquakes/catalogs/

//Past 7 Days - M 5+ earthquakes 
//http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml

//http://www.emsc-csem.org/#2
//http://quakes.globalincidentmap.com/

var rss = require('./rss.js');

exports.plugin = {
    	name: 'USGS Earthquakes',	
		description: 'United States Geographical Survey Earthquakes Data (> Magnitude 5, last 7 days)',
		options: { },
        version: '1.0',
        author: 'http://netention.org',
        //depends on: 'climate'
        
	start: function(netention, util) { 
            
            netention.addTags([
                {
                    uri: 'Earthquake', name: 'Earthquake',                     
                    properties: {       
        				 'eqMagnitude': { name: 'Magnitude', type: 'real' },		            
    					 'eqDepth': { name: 'Depth (m)', type: 'real' }
                    }
                }
            ]);
            

			//OLD URL: 'http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml'
            rss.RSSFeed('http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.atom', function(eq, a) {

                eq.name = eq.name + ' Earthquake';
                
                util.objAddTag(eq, 'Earthquake');
                util.objAddValue(eq, 'eqMagnitude', parseFloat( eq.name.substring(1, eq.name.indexOf(','))) );
                
				
				if (a['atom:summary']) {
					var s = a['atom:summary']['#'];
					var pr = '<dt>Depth</dt><dd>';
					var ipr = s.indexOf(pr);
					if (ipr!=-1) {
						var npr = ipr + pr.length;
						var nps = s.indexOf(' km ');
						var sdepth = s.substring(npr, nps);
						depth = parseFloat(sdepth) * 1000;
				        util.objAddValue(eq, 'eqDepth', depth );
					}
				}

				/*
				if (a['dc:subject']) {
					if (a['dc:subject'].length >= 2) {
				        var depth = a['dc:subject'][2]['#'];
				        depth = parseFloat(depth.substring(0, depth.indexOf(' ')).trim())*1000.0;
				        util.objAddValue(eq, 'eqDepth', depth );
		            }
				}*/
                netention.notice(eq);

                return eq;
	        });
            
        },
        
	stop: function(netention) {
	}
};
