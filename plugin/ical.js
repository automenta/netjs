/*Universal calendar format used by several email and calendar programs, including Microsoft Outlook, Google Calendar, and Apple iCal; enables users to publish and share calendar information on the Web and over email; often used for sending meeting requests to other users, who can import the events into their own calendars.
 
 iCalendar files are saved in a plain text format. They contain information such as the title, summary, start time, and end time for the calendar event. The iCalendar format also supports event updates and cancellations.*/

var web = require('./web.in.js');

exports.plugin = function($N) {
    var ical = require('ical');
    
    return {
        name: 'iCal/ICS Calendar Import',
        description: '',
        options: {},
        version: '1.0',
        author: 'http://netention.org',

        start: function(options) {
            
            web.addWebTags($N);
            
            function event2Object(e) {
                if (!e.summary)
                    return null;
                
                var n = new $N.nobject(e.uid);
                n.setName(e.summary);
                
                n.addTag('Event');
                
                if (e.description)
                    n.addDescription(e.description);
                
                if (e.geo)
                    n.earthPoint(e.geo.lat, e.geo.lon);
                
                if (e.location)                    
                    n.addDescription(e.location);
                
                if (e.url) {
                    n.addTag('WebURL');
                    n.add('urlAddress', e.url);
                }
            
                if (e.start) {
                    var start = e.start.getTime();
                    n.when = start;
                    if (e.end) {
                        var end = e.end.getTime();
                        n.duration = end - n.when;
                    }
                }
                
                return n;
            }
            
            ical.fromURL('http://lanyrd.com/topics/nodejs/nodejs.ics', {}, function(err, data) {
                for (var k in data) {
                    if (data.hasOwnProperty(k)) {
                        var ev = data[k];
                        
                        var n = event2Object(ev);
                        if (n)
                            $N.pub(n);

                        /*console.log("Conference",
                         ev.summary,
                         'is in',
                         ev.location,
                         'on the', ev.start.getDate(), 'of', months[ev.start.getMonth()]);*/
                    }
                }
            });
            
            
        },        
        /*onPub: function(x) {
        },*/
        /*onDelete: function(x) {
        },*/
        stop: function() {
        }
    };
};
