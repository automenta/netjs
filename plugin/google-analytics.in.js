var _ = require('underscore');

exports.plugin = function($N) {
    return {
        name: 'Google Analytics',
        description: 'Periodically monitors Google Analytics profiles for traffic data',
        options: {},
        version: '1.0',
        author: 'http://google.com',
        start: function(options) {
            var ga = require('googleanalytics');

            console.log('google analytics', options);
            
            $N.addTags([
                {
                    uri: 'GoogleAnalytics', name: 'Google Analytics',
                    properties: {
                        'googleAnalyticsTraffic': {name: 'Traffic', type: 'timeseries', max: 1, readonly: true },
                        'sessionCountToday': {name: 'Sessions Today (thus far)', type: 'real', max: 1, readonly: true },
                        'sessionCountYesterday': {name: 'Sessions Yesterday', type: 'real', max: 1, readonly: true },
                    }
                }
            ], ['Internet']);

            //console.log('GA',options);

            var profiles = options.profiles;
            ;
            var startDate = Date.now() - (1000 * 60 * 60 * 24) * 14; /* days */
            var endDate = Date.now();

            var GA = new ga.GA({
                user: options.username,
                password: options.password
            });

            var dimensions = [
                'ga:date'
            ];

            var metrics = [
                'ga:pageviews',
                'ga:visits',
                'ga:visitors',
                        //  'ga:transactions',
                        //  'ga:transactionRevenue'
            ];

            function getDateFromNumber(n) {
                return new Date(n).toISOString().split('T')[0];
            }

            GA.login(function(err, token) {
                _.each(profiles, function(p) {

                    var options = {
                        'ids': 'ga:' + p.id,
                        'start-date': getDateFromNumber(startDate),
                        'end-date': getDateFromNumber(endDate),
                        'dimensions': dimensions.join(','),
                        'metrics': metrics.join(','),
                        'sort': 'ga:date'
                    };

                    GA.get(options, function(err, entries) {
                        if (err) {
                            console.error('google-analytics', err);
                            return;
                        }

                        var x = $N.objNew();

                        x.id = 'google-analytics:' + p.id;
                        x.name = p.name;

                        var traffic = {};
                        var latest;
                        var points = [];
                            
                        entries.forEach(function(entry) {

                            var dateraw = entry.dimensions[0]['ga:date'];
                            var date = new Date();
                            date.setHours(0);
                            date.setMinutes(0);
                            date.setSeconds(0);
                            date.setYear(parseInt(dateraw.substring(0, 4)));
                            date.setMonth(parseInt(dateraw.substring(4, 6)) - 1);
                            date.setDate(parseInt(dateraw.substring(6, 8)));
                            var d = date.getTime();
                            
                            traffic[d] = { };
                            metrics.forEach(function(metric) {
                                traffic[d][metric] = entry.metrics[0][metric];
                            });
                            points.push(d);

                        });
                        x.addTag('GoogleAnalytics');
                        x.add('googleAnalyticsTraffic', traffic);
                        x.add('sessionCountToday', traffic[points[points.length-1]]['ga:visits']);
                        x.add('sessionCountYesterday', traffic[points[points.length-2]]['ga:visits']);
                        $N.pub(x);
                    });

                });
            });

        }
    }
};


