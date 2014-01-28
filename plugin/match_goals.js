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
var kmeans = require('kmeans'); //https://github.com/olalonde/kmeans.js

var updatePeriodMS = 3000;

exports.plugin = function($N) { return {
    name: 'Goal Matching',	
	description: 'Clusters goals according to their spatiotemporal location & tags',
    //name: 'Spacetime Tag Matching',	
	//description: 'Clusters objects according to their spatial location, temporal location, and tags.',

	options: { },
    version: '1.0',
    author: 'http://netention.org',
    
	start: function() {            
		var that = this;

		function _updateCentroids() {

			function getPlans(withPlan) {
				var allGoals = [];
				var now = Date.now();
				$N.getObjectsByTag('Goal', function(t) {
					if (!t.when)
						return;
					var tt = t.when;
					if (tt < now)
						return;
					if (!t.author)
						return;

					/*
					var lat = null;
					var lon = null;
					var geo = util.objSpacePoint(t);
					if (geo) {
						lat = geo.lat;
						lon = geo.lon;
					}
					var tags = util.objTags(t);
					*/

					allGoals.push(t);
				}, function() {
					withPlan(allGoals);
				});        
			}

            getPlans(function(p) {
				that.goalID = p.map(function(x) { return x.id; });

                if (p.length < 2)
                    return;


                var centroids = Math.floor(Math.pow(p.length, 0.55)); //a sub-exponential curve, steeper than log(x) and sqrt(x)
                var c = getSpaceTimeTagCentroids($N, p, centroids, true, true, ['Goal', 'GoalCentroid']);

                for (var i = 0; i < c.length; i++) {
                    var cc = c[i];

                    $N.objAddTag(cc, 'Goal');                            
                    $N.objAddTag(cc, 'GoalCentroid');					

                    $N.objAddDescription(cc, JSON.stringify(cc.tags,null,4) + ' ' + JSON.stringify(cc.implicates,null,4) );

                    $N.pub(cc);
                }
            });
		}

		function _deleteCentroids() {

		    //remove old centroids
		    var objs = [];

		    $N.getObjectsByTag('GoalCentroid', function(o) {      
		        objs.push(o);
		    }, function() {
				if (objs.length == 0) {
					_updateCentroids();
				}
				else {

				    //TODO create deleteObjects function that does this
				    function d() {
				        var n = objs.pop();

				        if (n) {
				            //console.log('  deleting: ', objs.length);
				            $N.deleteObject(n.id, d);
				        }     
				        else {
							_updateCentroids();				            
				        }
				    }
				    d();
				}
		    });
		    
		}
		
		this.updateCentroids = _.throttle(_deleteCentroids, updatePeriodMS);

		this.updateCentroids();
    },
            
    onPub: function(x) {
		if ( x.hasTag('Goal') && !x.hasTag('GoalCentroid') ) {
			this.updateCentroids();
		}
    },

	onDelete: function(x) { 		
		if (!this.goalID) return;
		if (_.contains(this.goalID, x.id)) {
			this.updateCentroids();
		}
	},

	stop: function() {
	}
}; }


function hoursFromNow(n) { return Date.now() + 60.0 * 60.0 * 1000.0 * n;     }


function getUniqueTags(objs, IgnoreTags) {
    var tags = [];
    for (var i = 0; i < objs.length; i++) {
		var T = objs[i];
		var ot = 
        tags = tags.concat( T.tags(T) );
    }
    tags = _.unique(tags);

	if (IgnoreTags)
		tags = _.difference(tags, IgnoreTags);

    return tags;
}


function getObservations($N, t, tags, includeSpace, includeTime) {
    var obs = [];
    for (var i = 0; i < t.length; i++) {
        var tt = t[i];        
		var l = [];

		if (includeSpace) {
			var sp = $N.objSpacePointLatLng(tt);
			if (!sp) continue; //ignore this obj
			l.push(sp[0]);
			l.push(sp[1]);
		}
		else {
			l.push(0);
			l.push(0);
		}

		if (includeTime) {
			var w = tt.when;
			if (w == undefined) continue;	//ignore this obj
			l.push(w);
		}
		else {
			l.push(0);
		}

		var ta = $N.objTagStrength(tt);
		
        var totalContained = 0;
        for (var k = 0; k < tags.length; k++) {
			var K = tags[k];
            if (ta[K])
                totalContained+=ta[K];
        }
        for (var k = 0; k < tags.length; k++) {
	        if (totalContained > 0) {
				var v = ta[tags[k]];
                l.push( (v!=undefined) ? ( v / totalContained) : 0.0) 
            }
			else
				l.push(0);
        }
        obs.push(l);
    }

    return obs;
}

function normalize(points, index) {
    var min, max;
    
    min = max = points[0][index];
    for (var i = 1; i < points.length; i++) {
        var pp = points[i][index];
        if (pp < min) min = pp;
        if (pp > max) max = pp;
    }
    
    for (var i = 0; i < points.length; i++) {
        var pp = points[i][index];
        if (min != max) {
            pp = (pp-min) / (max-min);
        }
        else {
            pp = 0.5;
        }
        points[i][index] = pp;
    }    
    return [parseFloat(min), parseFloat(max)];
}

function denormalize(value, minmax) {
    if (minmax[1] === minmax[0]) {
        return minmax[0];
    }
    
    if (value < 0) value = 0;
    
    var v = (minmax[1] > minmax[0]) ? (value * (minmax[1]-minmax[0]) + minmax[0]) :
            (value * (minmax[0]-minmax[1]) + minmax[1]);
    
    return v;
}

function getSpaceTimeTagCentroids($N, objects, centroids, includeSpace, includeTime, IgnoreTags) {    

	//console.log('Objects: ', objects);

    var tags = getUniqueTags(objects, IgnoreTags);
	//console.log('Unique tags: ', tags);

    var obs = getObservations($N, objects, tags, includeSpace, includeTime);
	//console.log('Observations: ', obs);
	
	if (obs.length == 0) return; //nothing to work with

	var dimensions = obs[0].length;

	var normLat, normLon, normTime;

	if (includeSpace) {
		normLat = normalize(obs, 0);
		normLon = normalize(obs, 1);
	}
	if (includeTime) {
		normTime = normalize(obs, 2);
	}

	//console.log('Normalized Obs: ', obs);
	//console.log('Normalized Limits: ', normLat, normLon, normTime);

    //TODO normalize lat/lon

    var km = kmeans.create(obs, centroids);

    var result = km.process();
	//console.log('Iterations:', km.iterationCount());

    var m = result.means;
    var cc = result.clusters;
	var mi = [ ]; //implicated objects

	//console.log('Centroid Means:', m);
	//console.log('Centroid Clusters:', cc);

	for (var i = 0; i < m.length; i++) {
		var c = cc[i];
		var implicated = [];
		for (var j = 0; j < cc[i].length; j++) {
			implicated.push( obs.indexOf(cc[i][j]) );
		}
		mi.push( implicated );
	}

	//console.log('Centroid implicates:', mi);

    
    var results = [];
	var j = 0;
    for (var i = 0; i < m.length; i++) {
		if (mi[i].length == 0)  continue;

        var mm = m[i];

		var res = $N.objNew();

		if (includeSpace) {
			$N.objAddGeoLocation(res, denormalize(mm[0],normLat), denormalize(mm[1],normLon));
		}
		if (includeTime) {
			res.when = denormalize(mm[2], normTime);
		}

		var restags = { };
        for (var k = 3; k < mm.length; k++) {
            var t = tags[k-3];
            if (mm[k] > 0)
                restags[t] = mm[k];            
        }

		res.setName('Possible Goal ' + (j++));

		res.tags = restags;

		res.implicates = mi[i].map(function(n) {
			return objects[n].id;
		});

	    results.push(res);
    }

	//console.log('Results:', results);
    
    return results;
}


