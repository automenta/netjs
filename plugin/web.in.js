var feedparser = require('feedparser'); //https://github.com/danmactough/node-feedparser
var request = require('request');
var _ = require('underscore');
var cheerio = require('cheerio');

var addWebTags = function($N) {
    $N.addTags([
        {
            uri: 'RSSFeed',
            name: 'RSS Feed',
            properties: {
                'urlAddress': {
                    name: 'Address (URL)',
                    type: 'url',
                    min: 1,
                    default: 'http://'
                },
                'urlFetchPeriod': {
                    name: 'Update Interval (minutes)',
                    type: 'real' /* number */,
                    default: "10",
                    max: 1
                },
                'addArticleTag': {
                    name: 'Add Tag to Articles',
                    type: 'text'
                },
                'lastURLFetch': {
                    name: 'Last Update',
                    type: 'timepoint',
                    readonly: true
                }
                //indexLinks
                //newObjectForEachArticle
            }
        },
        {
            uri: 'RSSItem',
            name: 'RSS Item',
            properties: {
                'rssItemURL': {
                    name: 'RSS Item URL',
                    type: 'url'
                }
            }
        },
        {
            uri: 'WebURL',
            name: 'Web URL',
            properties: {
                'urlAddress': null,
                'urlFetchPeriod': null,
                'lastURLFetch': null
                        //filters
                        //scrapers
            }
        },
    ], ['Internet']);
};
exports.addWebTags = addWebTags;


exports.plugin = function($N) {


    return {
        name: 'Web Input',
        description: 'Periodically monitors web content (HTML, RSS, etc..) for new content and saves it',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {

            var minUrlFetchPeriod = options.minUrlFetchPeriod || 1; //minutes
            var updatePeriod = options.updatePeriod || 5; //minutes

            addWebTags($N);

            this.feeds = {};

            var that = this;

            function updateAll(f) {

                that.feeds = {};

                $N.getObjectsByTag(['RSSFeed', 'WebURL'], function(x) {
                    that.feeds[x.id] = x;
                }, function() {
                    if (f)
                        f();
                });

            }


            function updateFeed(f) {
                var needsFetch = false;

                if (!$N.objFirstValue(f, 'lastURLFetch')) {
                    needsFetch = true;
                } else {
                    var age = (Date.now() - $N.objFirstValue(f, 'lastURLFetch')) / 1000.0;

                    var fp = $N.objFirstValue(f, 'urlFetchPeriod'); //in minutes
                    fp = Math.max(fp, minUrlFetchPeriod);

                    if (fp * 60.0 < age) {
                        needsFetch = true;
                    } else {
                        //console.log(fp - age, 'seconds to go');
                    }

                }

                if (needsFetch) {

                    var furi = $N.objValues(f, 'urlAddress');

                    if (furi) {
                        if (f.hasTag('WebURL')) {
                            f.removeTag('html');
                        }

                        for (var ff = 0; ff < furi.length; ff++) {
                            if (f.hasTag('RSSFeed')) {
                                RSSFeed($N, furi[ff], function(a) {
                                    //TODO add extra tags from 'f'
                                    $N.pub(a);
                                    return a;
                                });
                            }
                            if (f.hasTag('WebURL')) {
                                fetchURL($N, f, furi[ff]);
                            }
                        }
                    } else {
                        //set error message as f property
                        //console.log(f.name, ' missing url');
                    }

                    $N.objSetFirstValue(f, 'lastURLFetch', Date.now());
                    $N.pub(f);
                }
            }
            this.updateFeed = updateFeed;

            var ux = function() {
                updateAll(function() {
                    for (var k in that.feeds) {
                        updateFeed(that.feeds[k]);
                    }
                });
            };

            this.loop = setInterval(ux, updatePeriod * 60 * 1000);
            ux();

        },
        onPub: function(x) {
            if (x.hasTag('web.RSSFeed') || x.hasTag('WebURL')) {
                this.updateFeed(x);
                this.feeds[x.id] = x;
            }
        },
        onDelete: function(x) {
            if (x.hasTag('web.RSSFeed') || x.hasTag('WebURL'))
                delete feeds[x.id];
        },
        stop: function() {
            if (this.loop) {
                clearInterval(this.loop);
                this.loop = null;
            }
        }
    };
};

function fetchURL($N, x, url) {
    request.get({
        url: url,
        jar: true
    }, function(error, response, body) {
        var content;
        if (error)
            content = '<b>Error:</b> ' + error;
        else {
            var $ = cheerio.load(body);
            $('script').remove();
            $('style').remove();
            content = $('body').html();
            if (!content || content.length == 0)
                content = body;
            content = content.trim();
        }

        x.add({id: 'html', value: content});

        $N.pub(x);
    });
}

var RSSFeed = function($N, url, perArticle, whenFinished /*, onlyItemsAfter*/) {

    if (!process)
        process = function(x) {
            return x;
        };


    function onArticle(a) {
        var maxlen = a['title'].length;
        if (a['description'] != undefined)
            maxlen = Math.max(maxlen, a['description'].length);

        var w;
        if (a['date'])
            w = new Date(a['date']).getTime();
        else
            w = Date.now();

        var x = $N.objNew($N.MD5(a['guid']), a['title']);
        x.createdAt = w;

        $N.objAddDescription(x, a['description']);

        if (a['georss:point']) {
            var pp = a['georss:point'];
            if (pp.length == 2) {
                $N.objAddGeoLocation(x, pp[0], pp[1]);
            }
            else {
                pp = pp['#'].split(' ');
                $N.objAddGeoLocation(x, pp[0], pp[1]);
            }
            a.geolocation = [pp[0], pp[1]];
        }
        if (a['geo:lat']) {
            var lat = parseFloat(a['geo:lat']['#']);
            var lon = parseFloat(a['geo:long']['#']);
            $N.objAddGeoLocation(x, lat, lon);
            a.geolocation = [lat, lon];
        }
        $N.objAddTag(x, 'RSSItem');
        $N.objAddValue(x, 'rssItemURL', a['link']);


        perArticle(x, a);

    }



    var fp = new feedparser();

    request(url).pipe(fp)
            .on('error', function(error) {
                // always handle errors
                console.log('RSS request error: ' + url + ' :' + error);
            }).on('meta', function(data) {
        // always handle errors
        //onArticle(data);
        //console.log(data, 'META');
    }).on('readable', function() {
        var stream = this,
                item;
        while (item = stream.read()) {
            //console.log('Got article: %s', item.title || item.description);
            onArticle(item);
        }
    }).on('end', function() {
        if (whenFinished) {
            whenFinished();
        }
    }).resume();

};

exports.RSSFeed = RSSFeed;
