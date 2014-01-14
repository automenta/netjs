//TWITTER.COM HAS REMOVED PUBLIC ACCESS TO THE TWITTER API
//Let's make Twitter obsolete

//http://blog.semmy.me/post/17390049513/streaming-twitter-with-ntwitter-and-node-js
//https://dev.twitter.com/docs/api/1/get/search
//http://search.twitter.com/search.json?geocode=37.781157,-122.398720,1mi
//  http://search.twitter.com/search.rss?q=%3Fgeocode%3A53.344104%252C-6.2674937%252C25km
//http://search.twitter.com/search.rss?q=awesome

var request = require('request');
var _= require('underscore');

exports.plugin = {
        name: 'Twitter Interface',    
        description: 'Twitter inputs',
        options: { },
        version: '1.0',
        author: 'http://netention.org',
        
		start: function(netention, util) { 
            
            netention.addTags(
                [
                    { uri: 'Twitter', name: 'Twitter' }
                ]
            );
      
            netention.addTags(
                [
                    { uri: 'Tweet', name: 'Tweet',                   
                        properties: {
                    				 'twitterAuthor': { name: 'Twitter Author', type: 'text', min: 1 }
                    	}
                    },
                    
                    //TODO language parameter
                    
                    { uri: 'InterestInTwitterUser', name: 'Interest in Twitter User',
                        description: "Interest in Twitter user tweets, friends, and other activity",
                        properties: {
                					 'twitterID': { name: 'Twitter ID', type: 'text', min: 1 }
                    	}
                    },
                    { uri: 'InterestInTwitterHashtag', name: 'Interest in Twitter Hashtag',
                        description: "Interest in tweets containing a specific Hashtags",
                        properties: {
                    				 'twitterHashtag': { name: 'Twitter Hashtag', type: 'text', min: 1 }
                    	}
                    },
                    { uri: 'InterestInTwitterLocation', name: 'Interest in Twitter Location',
                        description: "Interest in a tweets near a twitter location",
                        properties: {
                    				 'twitterLocation': { name: 'Twitter Location', type: 'spacepoint', min: 1, max: 1 },
                        			 'twitterLocationRadius': { name: 'Twitter Location Radius (km)', type: 'real', min: 1, max: 1 }
                    	}
                    }
                
                ], [ 'Twitter' ]
            );

            function parseTwitterJSONResults(url, requireGeo) {
                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var x = JSON.parse(body);
                        var tw = x.results;
                        
                        var xx = [];
                        for (var i = 0; i < tw.length; i++) {
                            var t = tw[i];
                            if ((requireGeo) && (t.geo==undefined))
                                continue;
                            var x = util.objNew('twitter_' + t.id, '@' + t.from_user + ': ' + t.text);
                            x.createdAt = Date.parse(t.created_at);
                            if ((t.geo!=undefined) || (t.geo!=null))
                                util.objAddGeoLocation(x, t.geo.coordinates[0], t.geo.coordinates[1]);
                            util.objAddTag(x, 'Tweet', 1.0);
                            util.objAddTag(x, 'Message', 0.5);
                            util.objAddValue(x, 'twitterAuthor', t.from_user);
                            //TODO add TwitterUser tag
                            
                            xx.push(x);
                        }
                        //TODO publishAll
                        netention.noticeAll(xx);
                    }
                    else {
                        console.log('twitter lookup: ' + error);
                    }
                });                
            }
            
             function parseTwitterTimelineJSONResults(url, username) {
                request(url, function (error, response, body) {
                    if (!error && response.statusCode == 200) {
                        var x = JSON.parse(body);
                        var tw = x;
                        var xx = [];
                        for (var i = 0; i < tw.length; i++) {
                            var t = tw[i];
                            var x = util.objNew('twitter_' + t.id, '@' + username + ': ' + t.text);
                            x.createdAt = Date.parse(t.created_at);
                            if ((t.geo!=undefined) || (t.geo!=null))
                                util.objAddGeoLocation(x, t.geo.coordinates[0], t.geo.coordinates[1]);
                            util.objAddTag(x, 'Tweet', 1.0);
                            util.objAddTag(x, 'Message', 0.5);
                            util.objAddValue(x, 'twitterAuthor', username);
                            //TODO add TwitterUser tag
                                                        
                            xx.push(x);                        
                        }
                        //TODO publishAll
                        netention.noticeAll(xx);
                    }
                    else {
                        console.log(url + ' :: twitter lookup: ' + error);
                    }
                });                
            }
            function update() {
                

                netention.getObjectsByTag('InterestInTwitterUser', function(tu) {
                    //console.log('Interest in Twitter user: ' + tu);
                    var users = util.objValues(tu, 'twitterID');
                    _.each(users, function(username) {
                        if (username[0]=='@')
                            username = username.substring(1);
                        //nsole.log('fetching twitter results for: ' + username);
                        //https://dev.twitter.com/docs/api/1/get/statuses/user_timeline
						//No longer public since change to v1.1
                        //parseTwitterTimelineJSONResults('http://api.twitter.com/1/statuses/user_timeline.json?include_entities=false&include_rts=true&count=200&screen_name=' + username, username );
                    });
                });
                netention.getObjectsByTag('InterestInTwitterHashtag', function(th) {
                    //console.log('Interest in Twitter user: ' + tu);
                    var ht = util.objFirstValue(th, 'twitterHashtag');
                    if (ht[0]!='#')
                        ht = '#' + ht;                        
                    parseTwitterJSONResults('http://search.twitter.com/search.json?rpp=100&q=' + encodeURIComponent(ht) );
                });
                netention.getObjectsByTag('InterestInTwitterLocation', function(tl) {
                    //console.log('Interest in Twitter Location: ' + tl);
                    var l = util.objFirstValue(tl, 'twitterLocation');
                    
                    //TODO verify it is planet Earth
                    parseTwitterJSONResults('http://search.twitter.com/search.json?rpp=100&geocode=' + l.lat + ',' + l.lon + ',2mi', true);
                });
                
                
            }
            
            setInterval(update, 1000 * 60 * 5 /* minutes  */);
            update();
        },
		stop: function(netention) { }
};
