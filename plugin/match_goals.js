/*
 Spacetime Tag Planning - cluster objects according to their spatiotemporal location & tags
 
 Example Input
 {
 name: X
 author: A
 tag: t1=1.0, t2=0.5
 where: [ 10, -10 ]
 when: 23834744
 }
 {
 name: Y
 author: B
 tag: t2=0.75, t3=0.5
 where: [ 20, -20 ]
 when: 33834744
 }
 
 0. tags represent (variable-strength) features added to an object explicitly, or automatically inferred by other means
 1. include parent tags to finite depth (=1)
 Wikipedia categories represent parent tags
 2. objects which may not have their own space location, but their author(s) do, can be located by their author's present location
 TODO remove Us-screen-created Goal's default location, so that it can always follow its user's location?
 3. generate clustering inputs
 [ 0: time ]
 [ 1, 2, [3]: space (lat, lon, [altitude]) ]
 n, n+1, ... n+M: { presence of tags}
 
 for example:
 time=23834744, lat=10, lon=-10, t1=1.0, t2=0.5, t3=0
 time=33834744, lat=20, lon=-20, t1=0, t2=0.75, t3=0.5
 
 4. map space, time, and/or tag dimensions via cost (distance) functions.  these may be linear, polynomial, non-linear, etc. but must be invertible
 5. cluster (ex: k-means) to generate centroids
 6. un-map the dimensions of centroids via inverse cost functions
 7. identify the implicated objects and their authors by the tags involved in resulting centroid, excluding resutls that are beyond specified distance thresholds (ex: too far, too late, or too different)
 8. generate/update notifications of centroids, updating lists & maps. include a list of implicated objects in generated description
 
 Example Result
 name: Match
 tag: [Tag vector]
 subject: [A,B,C]
 description:
 A's X (95% similar, 3.5km centroid distance).
 B's imagined Y (85% similar, 2.1km centroid distance).
 C's Z (20% similar, 0.5km centroid distance).
 
 */

var _ = require('underscore');
var cluster = require('../server/cluster.js');


exports.plugin = function($N) {

    return {
        name: 'Goal Matching',
        description: 'Clusters goals according to their spatiotemporal location & tags',
        //name: 'Spacetime Tag Matching',	
        //description: 'Clusters objects according to their spatial location, temporal location, and tags.',

        options: {},
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {
            var that = this;

            this.matchingTags = ['Goal'];
            this.centroidTag = 'GoalCentroid';
            var timeResolution = 1000 * 60 * 30; //30min
            //item limit
            //include keywords
            //include space
            //include time

            function _updateCentroids() {

                $N.deleteObjectsWithTag(that.centroidtag, function() {

                    var p = [];
                    var now = Date.now();
                    $N.getObjectsByTag(that.matchingTags, function(t) {

                        if (!t.when)
                            return;

                        var tt = t.when;

                        if (tt < now)
                            return;
                        if (!t.author)
                            return;

                        p.push(t);

                    }, function() {
                        that.matchedID = p.map(function(x) {
                            return x.id;
                        });

                        if (p.length < 2)
                            return;

                        var c = cluster.getSpaceTimeTagCentroids($N, p, true, true, that.matchingTags, timeResolution);

                        for (var i = 0; i < c.length; i++) {
                            var cc = c[i];

                            cc.setName('Possibility ' + i);

                            cc.addTag(that.centroidTag);

                            _.each(cc.tags, function(v, k) {
                                cc.addTag(k, v);
                            });

                            //JSON.stringify(cc.tags, null, 4) + ' ' + JSON.stringify(cc.implicates, null, 4)
                            var d = _.map(_.keys(cc.tags), function(k) {
                                return k + '(' + (100.0 * cc.tags[k]).toFixed(2) + '%)'
                            }).join(', ');
                            //d += ' for ' + cc.replyTo.join(', ');

                            cc.addDescription(d);

                            delete cc.tags;

                            $N.pub(cc);
                        }
                    });

                });

            }

            this.updateCentroids = _.throttle(_updateCentroids, options.updatePeriodMS);
            this.updateCentroids();
        },
        onPub: function(x) {
            if (x.hasTag(this.matchingTags) && !x.hasTag(this.centroidTag))
                this.updateCentroids();
        },
        onDelete: function(x) {
            if (!this.matchedID)
                return;
            if (_.contains(this.matchedID, x.id))
                this.updateCentroids();
        },
        stop: function() {
        }
    };
};

/*
 function hoursFromNow(n) {
 return Date.now() + 60.0 * 60.0 * 1000.0 * n;
 }*/



