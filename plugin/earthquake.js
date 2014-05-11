//http://earthquake.usgs.gov/earthquakes/feed/v1.0/atom.php
//http://earthquake.usgs.gov/earthquakes/catalogs/

//Past 7 Days - M 5+ earthquakes 
//http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml

//http://www.emsc-csem.org/#2
//http://quakes.globalincidentmap.com/

exports.plugin = function($N) {
    var _ = require('underscore');
    var rss = require('./rss.js');
    var geo = require('geolib');

    return {
        name: 'USGS Earthquakes',
        description: 'United States Geographical Survey Earthquakes Data (> Magnitude 5, last 7 days)',
        options: {},
        version: '1.0',
        author: 'http://earthquake.usgs.gov',
        //depends on: 'climate'

        start: function(options) {
            
            var filter = options.filter || undefined;
            var minMagnitude = options.minMagnitude || 4.5;
            var expireAfter = options.expireAfter || undefined;
            var updateIntervalMS = options.updateIntervalMS || 15*60*1000 /*15 min */;
            
            //possible values: 'hour', 'day', 'week', 'month'
            var historySize = options.historySize || 'week';
            
            rss.addRSSTags($N);
            
            $N.addTags([
                {
                    uri: 'Earthquake', name: 'Earthquake',
                    properties: {
                        'eqMagnitude': {name: 'Magnitude', type: 'real'},
                        'eqDepth': {name: 'Depth (m)', type: 'real'}
                    }
                }
            ], ['Nature', 'Danger']);

            var mm;
            if (minMagnitude >= 4.5)
                mm = '4.5';
            else if (minMagnitude >= 2.5)
                mm = '2.5';
            else if (minMagnitude >= 1.0)
                mm = '1.0';
            else if ((minMagnitude >= 0) || (minMagnitude === 'all'))
                mm = 'all';
            else //if (minMagnitude === 'significant')
                mm = 'significant';
            
            
            var feedURL = 'http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/' + mm + '_' + historySize + '.atom';

            /*
            http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_day.atom
            http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_week.atom
            http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/1.0_week.atom
            http://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.atom
            */
            
            
            function update() {                
                //OLD URL: 'http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml'
                rss.RSSFeed($N, feedURL, function(eq, a) {
                    
                    if (expireAfter) {
                        var now = Date.now();
                        eq.expiresAt = eq.createdAt + expireAfter;
                        if (eq.expiresAt <= now)
                            return;
                    }
                    if ((filter) && (a.geolocation)) {
                        var included = true;
                        filter.forEach(function(f) {
                            if (!included) return;
                            var distMeters = geo.getDistance(
                                {latitude: f.lat, longitude: f.lon}, 
                                {latitude: a.geolocation[0], longitude: a.geolocation[1] }
                            );
                            included = (f.radius*1000 >= distMeters);
                            //console.log(eq.name, 'dist', distMeters, included);
                        });
                        if (!included)
                            return;
                    }
                    

                    eq.name = eq.name + ' Earthquake';
                    
                    var mag = parseFloat(eq.name.substring(1, eq.name.indexOf(' ', 2)));
					if (mag == undefined) {
						//??
						return;
					}

                    eq.addTag('Earthquake');
                    eq.add('eqMagnitude', mag);


                    if (a['atom:summary']) {
                        var s = a['atom:summary']['#'];
                        var pr = '<dt>Depth</dt><dd>';
                        var ipr = s.indexOf(pr);
                        if (ipr != -1) {
                            var npr = ipr + pr.length;
                            var nps = s.indexOf(' km ');
                            var sdepth = s.substring(npr, nps);
                            var depth = parseFloat(sdepth) * 1000;
                            eq.add('eqDepth', depth);
                        }
                    }
                    
                    eq.removeTag('textarea'); //remove description

					eq.removeTag('RSSItem');
					eq.removeTag('rssItemURL');

                    /*
                     if (a['dc:subject']) {
                     if (a['dc:subject'].length >= 2) {
                     var depth = a['dc:subject'][2]['#'];
                     depth = parseFloat(depth.substring(0, depth.indexOf(' ')).trim())*1000.0;
                     util.objAddValue(eq, 'eqDepth', depth );
                     }
                     }*/
                    $N.pub(eq);
                });
            }

            var that = this;
            //that.update = update;
            that.interval = setInterval(update, updateIntervalMS);
            update();

            /*
            function restart() {
                if (that.interval)
                    clearInterval(that.interval);

                $N.getObjectSnapshot('USGSEarthquake', function(err, e) {
                    if (e) {
                        var enabled = e.firstValue('Plugin.enable');
                        var updateEvery = e.firstValue('Plugin.updateEvery');

                        if (enabled) {
                            if (updateEvery > 0)
                                that.interval = setInterval(update, updateEvery * 1000);
                            update();
                        }
                    }
                });
            }
            this.restart = restart;
            */

            /*
            $N.getObjectSnapshot('USGSEarthquake', function(err, doc) {
                if (err) {
                    var options = $N.objNew('USGSEarthquake', 'USGS Earthquake Plugin').addTag('Plugin');
                    options.add('Plugin.enable', true);
                    options.add('Plugin.updateEvery', 1000);
                    $N.pub(options);
                }
                else {
                    restart();
                }
            });
            */

        },
        /*onPub: function(x) {
            if (x.id == 'USGSEarthquake') {
                this.restart();
            }
        },*/
        stop: function(netention) {
        }

    };
};
