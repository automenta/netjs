var request = require('request');
var _ = require('underscore');

exports.plugin = function($N) {
    return {
        name: 'Weather',
        description: 'Weather forecasts',
        options: {},
        version: '1.0',
        author: 'http://openweathermap.org',
        start: function(options) {

            $N.addAll([
                {
                    id: 'Weather', name: 'Weather', extend: ['Physical','Nature'],
                    value: {
                        'rainVolumePerHour': {name: 'Rain (mm per hour)', description: 'Volume mm per hour', extend: 'real', max: 1, readonly: true },
                        'snowVolumePerHour': {name: 'Snow (mm per hour)', description: 'Volume mm per hour', extend: 'real', max: 1, readonly: true },
                        'cloudCover': {name: 'Cloud Cover (%)', extend: 'real', max: 1, readonly: true },
                    }
                }
            ]);

			var locations = options.locations;

			_.each(locations, function(location) {
		        request.get(
					{
		                ////http://api.openweathermap.org/data/2.5/forecast?q=London,us&mode=json
			            url: 'http://api.openweathermap.org/data/2.5/forecast',
						qs: {
							q: location,
							mode: 'json',
							units: 'metric'
						}
					},
					function(error, response, body) {
						if (error) {
							console.error('weather.js', error);
							return;
						}

						var data = JSON.parse(body);

						var where = [ data.city.coord.lat, data.city.coord.lon ];

						//http://bugs.openweathermap.org/projects/api/wiki/Weather_Data
						_.each(data.list, function(d) {
							var title = d.weather[0].main + ': ' + d.weather[0].description;
							var when = parseInt(d.dt+'000');
							var temp = d.main.temp;
							var cloudiness = d.clouds.all;
							var rainMM = d.rain ? d.rain['3h'] : 0;
							//TODO snow

							var o = $N.objNew();
							o.id = 'weather.' + encodeURIComponent(location) + '.' + when;	
							o.when = when;
                                                        o.author = 'Weather:' + location;
							o.duration = 1000*(60*60*3 - 60); //3 hours-1 min
							o.expiresAt = when + 1000*60*60*6; //6hours
							o.name = title;
							o.earthPoint(where[0], where[1]);

							o.addTag('Weather');

							if (rainMM > 0) {
								o.add('rainVolumePerHour', (rainMM/3.0) );
							}
							if (cloudiness > 0) {
								o.add('cloudCover', cloudiness);
							}
							o.add('physicalTemperature', { "number": temp, "unit": "celsius"});
                            
							$N.pub(o);
						});

					}
		        );
			});
        }
    }
};



/*
Weather
	http://www.openweathermap.org/
		http://www.openweathermap.org/api
	http://wunderground.com
	http://www.accuweather.com/
	http://simuawips.com/
	http://www.tropicwx.com/

https://code.google.com/p/rattle/wiki/WhyWeUseAWeatherDataset

	Transportation,

	Rain, wind and snow can be quite disruptive. Flooding can effect rail and road, while snow can stop airports operating, and close down roads and railways. People also tend to travel less in rain, etc

	Energy Supply

	Change in weather patterns can effect energy production, especially in the newer environmental supply systems like wind and solar. The demand for energy also increases at the more extreme ranges of heat and cold. Strong winds can bring down trees which bring down power lines.

	Food Production

	Many crops are sensitive to temperate ranges and are rain dependant. A server storm like a hail storm, can destroy field crops, while also causing flooding. Did you know that Hail Storms cause over 1 billion US$ in crop damage per year.

	Health & Medical

	Rain washes down our streets, and removes toxins from our environment into treatment plants. Rain also provides us with drinking water. While rain after a dry spell, can make roads more slippery.

	Weddings & Parties, photography, receptions, venues, tourism, sports & leisure

	Sporting events, heat stroke, safety of players, slippyness of playing surfaces, damage to stadiums, betting on horse races.

	Communication

	Storms in the upper atmosphere can cause disruption to satellite communications. Storms can also knock our some tv and radio towers, especially with high winds and lightning strikes.

	Building & construction

	Rain disrupts building sites, and can make them unsafe. Wind can tear down scaffolding. Poor light restricts building process. Wild weather can damage houses. Wind can spread pollution.

	Retail sales

	People don’t go out to shop. Seasons clothes. Can cause depression. Can create panic buying.

	Criminal activity.

	Destroys crime scenes, looting after major storms, reduces light / visibility when cloudy, can aid in committing murder.


from: http://www.youtube.com/user/Suspicious0bservers?feature=watch

WORLD WEATHER:
    NDBC Buoys: http://www.ndbc.noaa.gov/
    Tropical Storms: http://www.wunderground.com/tropical/
    HurricaneZone Satellite Images: http://www.hurricanezone.net/westpaci...
    Weather Channel: http://www.weather.com/
    NOAA Environmental Visualization Laboratory: http://www.nnvl.noaa.gov/Default.php
    Pressure Maps: http://www.woweather.com/cgi-bin/expe...
    Satellite Maps: http://www.woweather.com/cgi-app/sate...
    Forecast Maps: http://www.woweather.com/weather/maps...
    EL DORADO WORLD WEATHER MAP: http://www.eldoradocountyweather.com/...
    TORCON: http://www.weather.com/news/tornado-t... [Tornado Forecast for the day]
    HURRICANE TRACKER: http://www.weather.com/weather/hurric...

US WEATHER:
    Precipitation Totals: http://www.cocorahs.org/ViewData/List...
    GOES Satellites: http://rsd.gsfc.nasa.gov/goes/
    THE WINDMAP: http://hint.fm/wind/
    Severe Weather Threats: http://www.weather.com/news/weather-s...
    Canada Weather Office Satellite Composites: http://www.weatheroffice.gc.ca/satell...
    Temperature Delta: http://www.intellicast.com/National/T...
    Records/Extremes: http://www.ncdc.noaa.gov/extremes/rec...


MISC Links:
    JAPAN Radiation Map: http://jciv.iidj.net/map/
    RADIATION Network: http://radiationnetwork.com/
    LISS: http://earthquake.usgs.gov/monitoring...
    QUAKES LIST FULL: http://www.emsc-csem.org/Earthquake/s...
    RSOE: http://hisz.rsoe.hu/alertmap/index2.php [That cool alert map I use]
    Moon: http://www.fourmilab.ch/earthview/pac...
*/
