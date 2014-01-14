/* 

http://hisz.rsoe.hu/alertmap/index2.php
http://hisz.rsoe.hu/alertmap

    <link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Realtime Disaster and Emergency Information in the World" href="http://feeds.feedburner.com/RsoeEdis-EmergencyAndDisasterInformation"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Airplane Accident and Incident Monitor (USA/FAA)" href="http://feeds.feedburner.com/rsoeEdis-FaaAirplaneAccidentAndIncidentInformation"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Epidemic and Biology Hazard Warning Message" href="http://feeds.feedburner.com/RsoeEdis-Ebhwm"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Global Tropical Storm Monitoring" href="http://feeds.feedburner.com/RsoeEdis-TropicalStormInformations"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - UV Index in the USA" href="http://feeds.feedburner.com/RsoeEdis-UvIndexInTheUsa"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Global Volcano Status" href="http://feeds.feedburner.com/RsoeEdis-VolcanoMonitoring"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Preliminary Earthquake Report" href="http://feeds2.feedburner.com/RsoeEdis-EarthquakeReportM25"/>
	<link rel="alternate" type="application/rss+xml" title="RSOE EDIS - Tsunami Information" href="http://feeds2.feedburner.com/RsoeEdis-TsunamiInformation"/>


 */
var http = require('http');
var _ = require('underscore');


var SkipEarthquakes = true;

exports.plugin = {
        name: 'Emergency and Disaster Information Service',	
		description: 'Still not completely functional, use with caution',
		options: { },
        version: '1.0',
        author: 'http://hisz.rsoe.hu',
        
		start: function(netention, util) { 
            http.get("http://hisz.rsoe.hu/alertmap/index2.php", function(res) {
                var pageData = "";
                res.setEncoding('utf8');
                res.on('data', function (chunk) {
                  pageData += chunk;
                });
            
                res.on('end', function(){
                  var linePrefix = "var point = new GLatLng(";
                  var lines = _.filter( pageData.split("\n"), function(l) { return l.trim().indexOf(linePrefix) == 0; } );
                  
                  var xx = [];
                  
                  for (var i = 0; i < lines.length; i++) {          
                      var l = lines[i].trim().substring(linePrefix.length);                      
                      
                      var coords = l.substring(0, l.indexOf(')')).split(', ');                      
                      coords = [ parseFloat(coords[0]), parseFloat(coords[1]) ];
                      
                      var text = l.substring(l.indexOf('point,\''), l.indexOf('>\',')+1);
                      
                      
                      var firstB = text.indexOf('<b>');
                      var nextB = text.indexOf('<\\/b>');
                      var name = text.substring(firstB+3, nextB);                      
                      
                      if (SkipEarthquakes)
                        if (name == 'Earthquake')
                            continue;
                            
                      //TODO get date
                      
                      var x = util.objNew(util.MD5('EDIS.' + name + coords[0] + coords[1]), name);
                      util.objAddTag(x, 'Report');
                      util.objAddGeoLocation(x, coords[0], coords[1]);
                      util.objAddDescription(x, text);                                            
                      
                      xx.push(x);

                  }
                  netention.noticeAll(xx);
                  
                });  
              
            }).on('error', function(e) {
              console.log("EDIS loading Error: " + e.message);
            });
            
        },
        
		stop: function(netention) {
		}
};


