//http://earthquake.usgs.gov/earthquakes/feed/v1.0/atom.php
//http://earthquake.usgs.gov/earthquakes/catalogs/

//Past 7 Days - M 5+ earthquakes 
//http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml

//http://www.emsc-csem.org/#2
//http://quakes.globalincidentmap.com/

exports.plugin = function($N) {
    var _ = require('underscore');
    var web = require('./web.in.js');
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
            var updateIntervalMS = options.updateIntervalMS || 15 * 60 * 1000 /*15 min */;

            //possible values: 'hour', 'day', 'week', 'month'
            var historySize = options.historySize || 'week';

            web.addWebTags($N);

            $N.addAll([
                {
                    id: 'Earthquake', name: 'Earthquake', extend: ['Nature', 'Danger'],
                    value: {
                        'eqMagnitude': {name: 'Magnitude', extend: 'real'},
                        'eqDepth': {name: 'Depth (m)', extend: 'real'}
                    }
                }
            ]);

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
                web.RSSFeed($N, feedURL, function(eq, a) {

                    if (expireAfter) {
                        var now = Date.now();
                        eq.expiresAt = eq.createdAt + expireAfter;
                        if (eq.expiresAt <= now)
                            return;
                    }
                    if ((filter) && (a.geolocation)) {
                        var included = true;
                        filter.forEach(function(f) {
                            if (!included)
                                return;
                            var distMeters = geo.getDistance(
                                {latitude: f.lat, longitude: f.lon},
                                {latitude: a.geolocation[0], longitude: a.geolocation[1]}
                            );
                            included = (f.radius * 1000 >= distMeters);
                            //console.log(eq.name, 'dist', distMeters, included);
                        });
                        if (!included)
                            return;
                    }


                    eq.name = eq.name + ' Earthquake';
                    eq.author = 'Earth';

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
                            $N.objSetFirstValue(eq, "spacepoint", { lat: a.geolocation[0], lon: a.geolocation[1], alt: -depth } );
                        }
                    }

                    eq.removeTag('html'); //remove description

                    eq.removeTag('RSSItem');
                    eq.removeTag('rssItemURL');
                   
                    $N.pub(eq);
                });
            }

            if (updateIntervalMS > 0) {
                var that = this;
                //that.update = update;
                that.interval = setInterval(update, updateIntervalMS);
                update();
            }


        },
        stop: function(netention) {
        }

    };
};
