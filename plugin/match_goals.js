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
var clusterfck = require('clusterfck'); //https://github.com/olalonde/kmeans.js
var geo = require('geolib');

var timeResolution = 1000*60*15; //5min

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

            function _updateCentroids() {

                var existingCentroids = [];

                $N.getObjectsByTag(that.centroidTag, function(o) {
                    existingCentroids.push(o);
                }, function() {

                    //remove old centroids, then create new ones
                    $N.deleteObjects(existingCentroids, function() {

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

                            var c = getSpaceTimeTagCentroids($N, p, true, true, that.matchingTags);

                            for (var i = 0; i < c.length; i++) {
                                var cc = c[i];

                                cc.setName('Possibility ' + i);

                                cc.addTag(that.centroidTag);
                                
                                _.each(cc.tags, function(v, k) {
                                   cc.addTag(k, v); 
                                });

                                      //JSON.stringify(cc.tags, null, 4) + ' ' + JSON.stringify(cc.implicates, null, 4)
                                var d = _.map(_.keys(cc.tags), function(k) { return k + '(' + (100.0 * cc.tags[k]).toFixed(2) + '%)' } ).join(', ');
                                //d += ' for ' + cc.replyTo.join(', ');
                                                                
                                cc.addDescription(d);
                                
                                delete cc.tags;

                                $N.pub(cc);
                            }
                        });
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


function hoursFromNow(n) {
    return Date.now() + 60.0 * 60.0 * 1000.0 * n;
}


function getUniqueTags(objs, IgnoreTags) {
    var tags = [];
    for (var i = 0; i < objs.length; i++) {
        var T = objs[i];
        var ot =
                tags = tags.concat(T.tags(T));
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

        var lat, lon;
        if (includeSpace) {
            var sp = $N.objSpacePointLatLng(tt);
            if (!sp)
                continue; //ignore this obj
            lat = sp[0];
            lon = sp[1];
        }
        else {
            lat = lon = 0;
        }

        var timepoints = [];
        
        if (includeTime) {
            var w = tt.when;
            if (w === undefined)
                continue;	//ignore this obj
            
            timepoints.push(w);
            
            var duration = tt.duration || timeResolution;
            
            if (duration) {
                for (var j = 0; j < duration; j+=timeResolution) {
                    timepoints.push(w + j);
                }
            }
        }
        else {
            timepoints.push(0);
        }

        timepoints.forEach(function(t) {
            var l = [];
            l.push(lat);
            l.push(lon);
            l.push(t);
            
            var ta = $N.objTagStrength(tt, false);

            //TODO remove totalContained denominator if not being used:
            var totalContained = 0;
            for (var k = 0; k < tags.length; k++) {
                var K = tags[k];
                if (ta[K])
                    totalContained += ta[K];
            }
            for (var k = 0; k < tags.length; k++) {
                if (totalContained > 0) {
                    var v = ta[tags[k]];
                    //l.push((v !== undefined) ? (v /*/ totalContained*/) : 0.0);
                    l.push((v !== undefined) ? (v/totalContained) : 0);
                }
                else
                    l.push(0);                
            }
            obs.push(l);
        });
    }

    return obs;
}

function normalize(points, index, scale) {
    var min, max;

    min = max = points[0][index];
    for (var i = 1; i < points.length; i++) {
        var pp = points[i][index];
        if (pp < min)
            min = pp;
        if (pp > max)
            max = pp;
    }

    for (var i = 0; i < points.length; i++) {
        var pp = points[i][index];
        if (min != max) {
            pp = (pp - min) / (max - min);
        }
        else {
            pp = 0.5;
        }
        points[i][index] = pp * scale;
    }
    return [parseFloat(min), parseFloat(max)];
}

function denormalize(value, minmax) {
    if (minmax[1] === minmax[0]) {
        return minmax[0];
    }

    if (value < 0)
        value = 0;

    var v = (minmax[1] > minmax[0]) ? (value * (minmax[1] - minmax[0]) + minmax[0]) :
            (value * (minmax[0] - minmax[1]) + minmax[1]);

    return v;
}

function getSpaceTimeTagCentroids($N, objects, includeSpace, includeTime, IgnoreTags) {

    //console.log('Objects: ', objects);

    var tags = getUniqueTags(objects, IgnoreTags);
    //console.log('Unique tags: ', tags);

    var obs = getObservations($N, objects, tags, includeSpace, includeTime);
    //console.log('Observations: ', obs);

    //console.log('observations: ', tags, includeSpace, includeTime, obs);
    
    if (obs.length === 0)
        return; //nothing to work with

    var centroids = parseInt(Math.pow(obs.length,0.5));
    

    var dimensions = obs[0].length;

    var normLat, normLon, normTime;

    //TODO move these to function parameters
    var spaceScale = 1.0;
    var timeScale = 1.0;

    if (includeSpace) {
        normLat = normLon = 1.0;        
        //normLat = normalize(obs, 0, spaceScale);
        //normLon = normalize(obs, 1, spaceScale);
    }
    if (includeTime) {
        normTime = 1.0;
        //normTime = normalize(obs, 2, timeScale);
    }

    //console.log('Normalized Obs: ', obs);
    //console.log('Normalized Limits: ', normLat, normLon, normTime);

    //TODO normalize lat/lon
    var distFunc = function(a, b) {
        var distMeters = geo.getDistance(
            {latitude: a[0], longitude: a[1]},
            {latitude: b[0], longitude: b[1]}
        );

        var distSeconds = Math.abs(a[2] - b[2])/1000.0;
        

        var distSemantic = 0;
        for (var i = 3; i < a.length; i++) {
             distSemantic += Math.abs(a[i] - b[i]);
             //distSemantic += Math.pow(a[i] - b[i], 2);
        }
        //distSemantic = Math.sqrt(distSemantic) * 2000.0;
        distSemantic = distSemantic * 2000.0;
        
        var d =Math.sqrt( distSeconds*distSeconds + 
               distMeters*distMeters + 
               distSemantic*distSemantic);
        //console.log(d, distSeconds, distMeters, distSemantic);
        return d;
    };
    
    var m = figue.kmeans(centroids, obs, distFunc);
    m = m.centroids;

/*    
    //console.log('obs', obs);
    
    var km = new clusterfck.Kmeans();
    //var cc = km.cluster(obs, centroids, distFunc);

    var cc = clusterfck.hcluster(obs);//, centroids, distFunc);
           
           
    console.log(cc);
    //console.log('points', obs);
    //console.log('centroids', km.centroids);
    //console.log('clusters', cc);
    
    var mi = []; //implicated objects

    //console.log('Centroid Means:', m);
    //console.log('Centroid Clusters:', cc);
*/

/*
    for (var i = 0; i < m.length; i++) {
        var c = cc[i];
        var implicated = [];
        for (var j = 0; j < cc[i].length; j++) {
            implicated.push(obs.indexOf(cc[i][j]));
        }
        mi.push(implicated);
    }*/
    

    //console.log('Centroid implicates:', mi);

    var results = [];
    var j = 0;
    for (var i = 0; i < m.length; i++) {
        /*if (mi[i].length == 0)
            continue;*/

        var mm = m[i];

        var res = new $N.nobject();

        if (includeSpace) {
            $N.objAddGeoLocation(res, mm[0], mm[1]);
        }
        if (includeTime) {
            res.when = parseInt(mm[2]);
        }

        var restags = {};
        var tagSum = 0;
        for (var k = 3; k < mm.length; k++) {
            var t = tags[k - 3];
            if (mm[k] > 0) {
                restags[t] = mm[k];
                tagSum += restags[t];                
            }
        }
        if (tagSum > 0)
            _.each(restags, function(v, k) {
                restags[k]/=tagSum;
            });

        res.tags = restags;

/*
        res.replyTo = mi[i].map(function(n) {
            return objects[n].id;
        });*/

        results.push(res);
        
    }

    //console.log('Results:', results);

    return results;
}
exports.getSpaceTimeTagCentroids = getSpaceTimeTagCentroids;




//-----------------------

/*!
 * Figue v1.0.1
 *
 * Copyright 2010, Jean-Yves Delort
 * Licensed under the MIT license.
 *
 */
//https://code.google.com/p/figue/source/browse/trunk/figue.js

var figue = function () {


    function euclidianDistance (vec1 , vec2) {
            var N = vec1.length ;
            var d = 0 ;
            for (var i = 0 ; i < N ; i++)
                    d += Math.pow (vec1[i] - vec2[i], 2)
            d = Math.sqrt (d) ;
            return d ;
    }

    function manhattanDistance (vec1 , vec2) {
            var N = vec1.length ;
            var d = 0 ;
            for (var i = 0 ; i < N ; i++)
                    d += Math.abs (vec1[i] - vec2[i])
            return d ;
    }

    function maxDistance (vec1 , vec2) {
            var N = vec1.length ;
            var d = 0 ;
            for (var i = 0 ; i < N ; i++)
                    d = Math.max (d , Math.abs (vec1[i] - vec2[i])) ;
            return d ;
    }

    function addVectors (vec1 , vec2) {
            var N = vec1.length ;
            var vec = new Array(N) ;
            for (var i = 0 ; i < N ; i++)
                    vec[i] = vec1[i] + vec2[i] ;
            return vec ;
    }       

    function multiplyVectorByValue (value , vec) {
            var N = vec.length ;
            var v = new Array(N) ;
            for (var i = 0 ; i < N ; i++)
                    v[i] = value * vec[i] ;
            return v ;
    }       

    function vectorDotProduct (vec1, vec2) {
            var N = vec1.length ;
            var s = 0 ;
            for (var i = 0 ; i < N ; i++)
                    s += vec1[i] * vec2[i] ;
            return s ;
    }


    function repeatChar(c, n) {
            var str = "";
            for (var i = 0 ; i < n ; i++)
                    str += c ;
            return str ;
    }

    function calculateCentroid (c1Size , c1Centroid , c2Size , c2Centroid) {
            var newCentroid = new Array(c1Centroid.length) ;
            var newSize = c1Size + c2Size ;
            for (var i = 0 ; i < c1Centroid.length ; i++) 
                    newCentroid[i] = (c1Size * c1Centroid[i] + c2Size * c2Centroid[i]) / newSize ;
            return newCentroid ;    
    }


    function centerString(str, width) {
            var diff = width - str.length ;
            if (diff < 0)
                    return ;

            var halfdiff = Math.floor(diff / 2) ;
            return repeatChar (" " , halfdiff) + str + repeatChar (" " , diff - halfdiff)  ;
    }

    function putString(str, width, index) {
            var diff = width - str.length ;
            if (diff < 0)
                    return ;

            return repeatChar (" " , index) + str + repeatChar (" " , width - (str.length+index)) ;
    }

    function prettyVector(vector) {
            var vals = new Array(vector.length) ;
            var precision = Math.pow(10, figue.PRINT_VECTOR_VALUE_PRECISION) ; 
            for (var i = 0 ; i < vector.length ; i++)
                    vals[i] = Math.round(vector[i]*precision)/precision ;
            return vals.join(",")
    }

    function prettyValue(value) {
            var precision = Math.pow(10, figue.PRINT_VECTOR_VALUE_PRECISION) ; 
            return String (Math.round(value*precision)/precision) ;
    }

    function generateDendogram(tree, sep, balanced, withLabel, withCentroid, withDistance) {
            var lines = new Array ;
            var centroidstr = prettyVector(tree.centroid) ;
            if (tree.isLeaf()) {
                    var labelstr = String(tree.label) ;
                    var len = 1;
                    if (withCentroid) 
                            len = Math.max(centroidstr.length , len) ;
                    if (withLabel)
                            len = Math.max(labelstr.length , len) ;

                    lines.push (centerString ("|" , len)) ;
                    if (withCentroid) 
                            lines.push (centerString (centroidstr , len)) ;
                    if (withLabel) 
                            lines.push (centerString (labelstr , len)) ;

            } else {
                    var distancestr = prettyValue(tree.dist) ;
                    var left_dendo = generateDendogram(tree.left ,sep, balanced,withLabel,withCentroid, withDistance) ;
                    var right_dendo = generateDendogram(tree.right, sep, balanced,withLabel,withCentroid,withDistance) ;
                    var left_bar_ix = left_dendo[0].indexOf("|") ;
                    var right_bar_ix = right_dendo[0].indexOf("|") ;

                    // calculate nb of chars of each line
                    var len = sep + right_dendo[0].length + left_dendo[0].length ;
                    if (withCentroid) 
                            len = Math.max(centroidstr.length , len) ;
                    if (withDistance) 
                            len = Math.max(distancestr.length , len) ;


                    // calculate position of new vertical bar
                    var bar_ix =  left_bar_ix + Math.floor(( left_dendo[0].length - (left_bar_ix) + sep + (1+right_bar_ix)) / 2) ;

                    // add line with the new vertical bar 
                    lines.push (putString ("|" , len , bar_ix)) ;
                    if (withCentroid) {
                            lines.push (putString (centroidstr , len , bar_ix - Math.floor (centroidstr.length / 2))) ; //centerString (centroidstr , len)) ;
                    }
                    if (withDistance) {
                            lines.push (putString (distancestr , len , bar_ix - Math.floor (distancestr.length / 2))) ; //centerString (centroidstr , len)) ;
                    }

                    // add horizontal line to connect the vertical bars of the lower level
                    var hlineLen = sep + (left_dendo[0].length -left_bar_ix) + right_bar_ix+1 ;
                    var hline = repeatChar ("_" , hlineLen) ;
                    lines.push (putString(hline, len, left_bar_ix)) ;

                    // IF: the user want the tree to be balanced: all the leaves have to be at the same level
                    // THEN: if the left and right subtrees have not the same depth, add extra vertical bars to the top of the smallest subtree
                    if (balanced &&  (left_dendo.length != right_dendo.length)) {
                            var shortest ;
                            var longest ;
                            if (left_dendo.length > right_dendo.length) {
                                    longest = left_dendo ;
                                    shortest = right_dendo ;
                            } else {
                                    longest = right_dendo ;
                                    shortest = left_dendo ;
                            }
                            // repeat the first line containing the vertical bar
                            header = shortest[0] ;
                            var toadd = longest.length - shortest.length ;
                            for (var i = 0 ; i < toadd ; i++) {
                                    shortest.splice (0,0,header) ;
                            }
                    }

                    // merge the left and right subtrees 
                    for (var i = 0 ; i < Math.max (left_dendo.length , right_dendo.length) ; i++) {
                            var left = "" ;
                            if (i < left_dendo.length)
                                    left = left_dendo[i] ;
                            else
                                    left = repeatChar (" " , left_dendo[0].length) ;

                            var right = "" ;
                            if (i < right_dendo.length)
                                    right = right_dendo[i] ;
                            else
                                    right = repeatChar (" " , right_dendo[0].length) ;
                            lines.push(left + repeatChar (" " , sep) + right) ;     
                            var l = left + repeatChar (" " , sep) + right ;
                    }
            }

            return lines ;
    }



    function agglomerate (labels, vectors, distance, linkage) {
            var N = vectors.length ;
            var dMin = new Array(N) ;
            var cSize = new Array(N) ;
            var matrixObj = new figue.Matrix(N,N);
            var distMatrix = matrixObj.mtx ;
            var clusters = new Array(N) ;

            var c1, c2, c1Cluster, c2Cluster, i, j, p, root , newCentroid ;

            if (distance == figue.EUCLIDIAN_DISTANCE)
                    distance = euclidianDistance ;
            else if (distance == figue.MANHATTAN_DISTANCE)
                    distance = manhattanDistance ;
            else if (distance == figue.MAX_DISTANCE)
                    distance = maxDistance ;

            // Initialize distance matrix and vector of closest clusters
            for (i = 0 ; i < N ; i++) {
                    dMin[i] = 0 ;
                    for (j = 0 ; j < N ; j++) {
                            if (i == j)
                                    distMatrix[i][j] = Infinity ;
                            else
                                    distMatrix[i][j] = distance(vectors[i] , vectors[j]) ;

                            if (distMatrix[i][dMin[i]] > distMatrix[i][j] )
                                    dMin[i] = j ;
                    }
            }

            // create leaves of the tree
            for (i = 0 ; i < N ; i++) {
                    clusters[i] = [] ;
                    clusters[i][0] = new Node (labels[i], null, null, 0, vectors[i]) ;
                    cSize[i] = 1 ;
            }

            // Main loop
            for (p = 0 ; p < N-1 ; p++) {
                    // find the closest pair of clusters
                    c1 = 0 ;
                    for (i = 0 ; i < N ; i++) {
                            if (distMatrix[i][dMin[i]] < distMatrix[c1][dMin[c1]])
                                    c1 = i ;
                    }
                    c2 = dMin[c1] ;

                    // create node to store cluster info 
                    c1Cluster = clusters[c1][0] ;
                    c2Cluster = clusters[c2][0] ;

                    newCentroid = calculateCentroid ( c1Cluster.size , c1Cluster.centroid , c2Cluster.size , c2Cluster.centroid ) ;
                    newCluster = new Node (-1, c1Cluster, c2Cluster , distMatrix[c1][c2] , newCentroid) ;
                    clusters[c1].splice(0,0, newCluster) ;
                    cSize[c1] += cSize[c2] ;

                    // overwrite row c1 with respect to the linkage type
                    for (j = 0 ; j < N ; j++) {
                            if (linkage == figue.SINGLE_LINKAGE) {
                                    if (distMatrix[c1][j] > distMatrix[c2][j])
                                            distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j] ;
                            } else if (linkage == figue.COMPLETE_LINKAGE) {
                                    if (distMatrix[c1][j] < distMatrix[c2][j])
                                            distMatrix[j][c1] = distMatrix[c1][j] = distMatrix[c2][j] ;
                            } else if (linkage == figue.AVERAGE_LINKAGE) {
                                    var avg = ( cSize[c1] * distMatrix[c1][j] + cSize[c2] * distMatrix[c2][j])  / (cSize[c1] + cSize[j]) 
                                    distMatrix[j][c1] = distMatrix[c1][j] = avg ;
                            }
                    }
                    distMatrix[c1][c1] = Infinity ;

                    // infinity ­out old row c2 and column c2
                    for (i = 0 ; i < N ; i++)
                            distMatrix[i][c2] = distMatrix[c2][i] = Infinity ;

                    // update dmin and replace ones that previous pointed to c2 to point to c1
                    for (j = 0; j < N ; j++) {
                            if (dMin[j] == c2)
                                    dMin[j] = c1;
                            if (distMatrix[c1][j] < distMatrix[c1][dMin[c1]]) 
                                    dMin[c1] = j;
                    }

                    // keep track of the last added cluster
                    root = newCluster ;
            }

            return root ;
    }



    function getRandomVectors(k, vectors) {
            /*  Returns a array of k distinct vectors randomly selected from a the input array of vectors
                    Returns null if k > n or if there are less than k distinct objects in vectors */

            var n = vectors.length ;
            if ( k > n ) 
                    return null ;

            var selected_vectors = new Array(k) ;
            var selected_indices = new Array(k) ;

            var tested_indices = new Object ;
            var tested = 0 ;
            var selected = 0 ;
            var i , vector, select ;
            while (selected < k) {
                    if (tested == n)
                            return null ;

                    var random_index = Math.floor(Math.random()*(n)) ;
                    if (random_index in tested_indices)
                            continue ;

                    tested_indices[random_index] = 1;
                    tested++ ;
                    vector = vectors[random_index] ;
                    select = true ;
                    for (i = 0 ; i < selected ; i++) {
                            if ( vector.compare (selected_vectors[i]) ) {
                                    select = false ;
                                    break ;
                            }
                    }
                    if (select) {
                            selected_vectors[selected] = vector ;
                            selected_indices[selected] = random_index ; 
                            selected++ ;
                    }
            }
            return {'vectors': selected_vectors, 'indices': selected_indices} ;
    }

    function kmeans (k, vectors, distFunc) {
            var n = vectors.length ;
            var assignments = new Array(n) ;
            var clusterSizes = new Array(k) ;
            var repeat = true ;
            var nb_iters = 0 ;
            var centroids = null ;

            var t = getRandomVectors(k, vectors) ;
            if (t == null)
                    return null ;
            else
                    centroids = t.vectors ;

            while (repeat) {

                    // assignment step
                    for (var j = 0 ; j < k ; j++)
                            clusterSizes[j] = 0 ;

                    for (var i = 0 ; i < n ; i++) {
                            var vector = vectors[i] ;
                            var mindist = Number.MAX_VALUE ;
                            var best ;
                            for (var j = 0 ; j < k ; j++) {
                                    dist = distFunc(centroids[j], vector);
                                    if (dist < mindist) {
                                            mindist = dist ;
                                            best = j ;
                                    }
                            }
                            clusterSizes[best]++ ;
                            assignments[i] = best ;
                    }

                    // update centroids step
                    var newCentroids = new Array(k) ;
                    for (var j = 0 ; j < k ; j++)
                            newCentroids[j] = null ;

                    for (var i = 0 ; i < n ; i++) {
                            cluster = assignments[i] ;
                            if (newCentroids[cluster] == null)
                                    newCentroids[cluster] = vectors[i] ;
                            else
                                    newCentroids[cluster] = addVectors (newCentroids[cluster] , vectors[i]) ;       
                    }

                    for (var j = 0 ; j < k ; j++) {
                            newCentroids[j] = multiplyVectorByValue (1/clusterSizes[j] , newCentroids[j]) ;
                    }       

                    // check convergence
                    repeat = false ;
                    for (var j = 0 ; j < k ; j++) {
                            if (! newCentroids[j].compare (centroids[j])) {
                                    repeat = true ; 
                                    break ; 
                            }
                    }
                    centroids = newCentroids ;
                    nb_iters++ ;

                    // check nb of iters
                    if (nb_iters > figue.KMEANS_MAX_ITERATIONS)
                            repeat = false ;

            }
            return { 'centroids': centroids , 'assignments': assignments} ;

    }

    function fcmeans (k, vectors, epsilon, fuzziness) {
            var membershipMatrix = new Matrix (vectors.length, k) ;
            var repeat = true ;
            var nb_iters = 0 ;

            var centroids = null ;

            var i,j,l, tmp, norm, max, diff ;
            while (repeat) {
                    // initialize or update centroids
                    if (centroids == null) {

                            tmp = getRandomVectors(k, vectors) ;
                            if (tmp == null)
                                    return null ;
                            else
                                    centroids = tmp.vectors ;

                    } else {
                            for (j = 0 ; j < k; j++) {
                                    centroids[j] = [] ;
                                    norm = 0 ;
                                    for (i = 0 ; i < membershipMatrix.rows ; i++) {
                                            norm += Math.pow(membershipMatrix.mtx[i][j], fuzziness) ;
                                            tmp = multiplyVectorByValue( Math.pow(membershipMatrix.mtx[i][j], fuzziness) , vectors[i]) ;

                                            if (i == 0)
                                                    centroids[j] = tmp ;
                                            else
                                                    centroids[j] = addVectors (centroids[j] , tmp) ;
                                    }
                                    if (norm > 0)
                                            centroids[j] = multiplyVectorByValue(1/norm, centroids[j]);


                            }

                    }
                    //alert(centroids);

                    // update the degree of membership of each vector
                    previousMembershipMatrix = membershipMatrix.copy() ;
                    for (i = 0 ; i < membershipMatrix.rows ; i++) {
                            for (j = 0 ; j < k ; j++) {
                                    membershipMatrix.mtx[i][j] = 0;
                                    for (l = 0 ; l < k ; l++) {
                                            if (euclidianDistance(vectors[i] , centroids[l]) == 0)
                                                    tmp = 0 ;
                                            else
                                                    tmp =  euclidianDistance(vectors[i] , centroids[j]) / euclidianDistance(vectors[i] , centroids[l]) ;
                                            tmp = Math.pow (tmp, 2/(fuzziness-1)) ;
                                            membershipMatrix.mtx[i][j] += tmp ;
                                    }
                                    if (membershipMatrix.mtx[i][j] > 0)
                                            membershipMatrix.mtx[i][j] = 1 / membershipMatrix.mtx[i][j] ;
                            }
                    }

                    //alert(membershipMatrix) ;

                    // check convergence
                    max = -1 ;
                    diff;
                    for (i = 0 ; i < membershipMatrix.rows ; i++)
                            for (j = 0 ; j < membershipMatrix.cols ; j++) {
                                    diff = Math.abs(membershipMatrix.mtx[i][j] - previousMembershipMatrix.mtx[i][j]) ;
                                    if (diff > max)
                                            max = diff ;
                            }

                    if (max < epsilon)
                            repeat = false ;

                    nb_iters++ ;

                    // check nb of iters
                    if (nb_iters > figue.FCMEANS_MAX_ITERATIONS)
                            repeat = false ;
            }
            return { 'centroids': centroids , 'membershipMatrix': membershipMatrix} ;

    }


    function Matrix (rows,cols) 
    {
            this.rows = rows ;
            this.cols = cols ;
            this.mtx = new Array(rows) ; 

            for (var i = 0 ; i < rows ; i++)
            {
                    var row = new Array(cols) ;
                    for (var j = 0 ; j < cols ; j++)
                            row[j] = 0;
                    this.mtx[i] = row ;
            }
    }

    function Node (label,left,right,dist, centroid) 
    {
            this.label = label ;
            this.left = left ;
            this.right = right ;
            this.dist = dist ;
            this.centroid = centroid ;
            if (left == null && right == null) {
                    this.size = 1 ;
                    this.depth = 0 ;
            } else {
                    this.size = left.size + right.size ;
                    this.depth = 1 + Math.max (left.depth , right.depth ) ;
            }
    }



    return { 
            SINGLE_LINKAGE: 0,
            COMPLETE_LINKAGE: 1,
            AVERAGE_LINKAGE:2 ,
            EUCLIDIAN_DISTANCE: 0,
            MANHATTAN_DISTANCE: 1,
            MAX_DISTANCE: 2,
            PRINT_VECTOR_VALUE_PRECISION: 2,
            KMEANS_MAX_ITERATIONS: 10,
            FCMEANS_MAX_ITERATIONS: 3,

            Matrix: Matrix,
            Node: Node,
            generateDendogram: generateDendogram,
            agglomerate: agglomerate,
            kmeans: kmeans,
            fcmeans: fcmeans
    };
    
}();


figue.Matrix.prototype.toString = function() 
{
        var lines = [] ;
        for (var i = 0 ; i < this.rows ; i++) 
                lines.push (this.mtx[i].join("\t")) ;
        return lines.join ("\n") ;
}


figue.Matrix.prototype.copy = function() 
{
        var duplicate = new figue.Matrix(this.rows, this.cols) ;
        for (var i = 0 ; i < this.rows ; i++)
                duplicate.mtx[i] = this.mtx[i].slice(0); 
        return duplicate ;
}

figue.Node.prototype.isLeaf = function() 
{
        if ((this.left == null) && (this.right == null))
                return true ;
        else
                return false ;
}

figue.Node.prototype.buildDendogram = function (sep, balanced,withLabel,withCentroid, withDistance)
{
        lines = figue.generateDendogram(this, sep, balanced,withLabel,withCentroid, withDistance) ;
        return lines.join ("\n") ;      
}


Array.prototype.compare = function(testArr) {
    if (this.length != testArr.length) return false;
    for (var i = 0; i < testArr.length; i++) {
        if (this[i].compare) { 
            if (!this[i].compare(testArr[i])) return false;
        }
        if (this[i] !== testArr[i]) return false;
    }
    return true;
};



//--------------------




//http://jormungand.net/projects/misc/em/
// K-Means & EM Clustering
// (c) 2010 chris@jormungand.net


// v2 and m22 are 2d vectors and matrices.
// We define some basic linear algebra operations here.

function v2_rand() { return [1-2*Math.random(), 1-2*Math.random()]; }
function v2_zero() { return [0,0]; }
function v2_add_v2(a,b) { return [a[0]+b[0],a[1]+b[1]]; }
function v2_addto_v2(a,b) { b[0] += a[0]; b[1] += a[1]; }
function v2_sub_v2(a,b) { return [a[0]-b[0],a[1]-b[1]]; }
function v2_dot_v2(a,b) { return a[0]*b[0]+a[1]*b[1]; }
function v2_len(a) { return Math.sqrt(a[0]*a[0]+a[1]*a[1]); }
function v2_dist_v2(a,b) {
  var dx = a[0]-b[0];
  var dy = a[1]-b[1];
  return Math.sqrt(dx*dx+dy*dy);
}

// 2x2 matrix stored in a 4-element array, column major.
// [ 0 2 ]
// [ 1 3 ]

function m22_ident() { return [1, 0, 0, 1]; }

function v2_mul_m22(v,m) { return [v[0]*m[0]+v[1]*m[2], v[0]*m[1]+v[1]*m[3]]; }

function m22_mul_m22(m,n) {
  return [m[0]*n[0]+m[1]*n[2],
          m[0]*n[1]+m[1]*n[3],
          m[2]*n[0]+m[3]*n[2],
          m[2]*n[1]+m[3]*n[3]];
}
function m22_transpose(m) { return [m[0], m[2], m[1], m[3]]; }

function m22_det(m) { return m[0]*m[3]-m[1]*m[2]; }

function m22_invert(m) {
  var d = m22_det(m);
  return [m[3]/d, -m[1]/d, -m[2]/d, m[0]/d];
}

// 2x2 Cholesky Decomposition.  A trick for drawing ellipses
function m22_chol(m) {
  var sra = Math.sqrt(m[0]);
  return [sra,0,m[1]/sra,Math.sqrt(m[3]-m[1]*m[1]/m[0])];
}

function draw_lineish(start, end, size, num) {
  


}

function random_squares(n,m) {
  var out = [];
  for(var ii = 0; ii < n; ++ii) {
    var x = 1.5*(Math.random()-0.5);
    var y = 1.5*(Math.random()-0.5);
    for(var jj = 0; jj < m; ++jj) {
      var dx = 0.5*(Math.random()-0.5)
      var dy = 0.5*(Math.random()-0.5)
      out.push([x+dx,y+dy]);
    }
  }
  return out;
}


var image = [ "..........",
              ".xxx......",
              ".x........",
              ".xxx......",
              ".x........",
              ".xxx......",
              "....xxxxx.",
              "....x.x.x.",
              "....x.x.x.",
              ".........."];

function draw_image(img) {
  var out = [];
  var xr = 2/image.length;
  var yr = 2/image[0].length;
  for(var ii = 0; ii < image.length; ++ii) {
    var y0 = 1-2*ii/image.length;
    for(var jj = 0; jj < image[ii].length; ++jj) {
      if (image[ii][jj] != '.') {
        var x0 = -1+2*jj/image[ii].length;
        for(var kk = 0; kk < 10; ++kk) {
          out.push([x0+xr*Math.random(), y0+yr*Math.random()]);
        }
      }
    }
  }
  return out;
}



// kmeans_update_means()
//   set each means[m] to be the avg of all data[x] such that labels[x] = m.
//   in other words, compute the average of all values with each label.
function kmeans_update_means(data,means,labels) {
  // pre: labels[dd] = 0 .. means.length-1
  // pre: data[dd] = [x,y]
  // post: means[dd] = [.., ..]
  var counts = [];
  for(var mm = 0; mm < means.length; ++mm) {
    means[mm] = [0,0];
    counts[mm] = 0;
  }
  for(var dd = 0; dd < data.length; ++dd) {
    var l = labels[dd];
    means[l][0] += data[dd][0];
    means[l][1] += data[dd][1];
    counts[l]++;
  }
  for(var mm = 0; mm < means.length; ++mm) {
    if(counts[mm] != 0) {
      means[mm][0] /= counts[mm];
      means[mm][1] /= counts[mm];
    } else {
      // assign it at random.
      var r = Math.floor(Math.random()*data.length);
      means[mm] = [data[r][0], data[r][1]];
    }
    // or it was empty.  shucks.
  }
}

// kmeans_update_labels()
//   set each labels[d] to m which minimizes dist(data[d], means[m])
//   in other words, assign each data point to its nearest mean.
//   returns whether any label was changed.
function kmeans_update_labels(data,means,labels) {
  var modified = false;
  for(var dd = 0; dd < data.length; ++dd) {
    var min_mm = 0;
    var min_dist = v2_dist_v2(data[dd], means[0]);
    for(var mm = 1; mm < means.length; ++mm) {
      var dist = v2_dist_v2(data[dd], means[mm]);
      if (dist < min_dist) {
        min_dist = dist;
        min_mm = mm;
      }
    }
    if(labels[dd] != min_mm) {
      modified = true;
    }
    labels[dd] = min_mm;
  }
  return modified;
}

function em_init(data, labelvecs, classes) {
  labelvecs.length = data.length;
  for(var dd = 0; dd < data.length; ++dd) {
    labelvecs[dd] = [];
    for(var cc = 0; cc < classes.length; ++cc) {
      labelvecs[dd][cc] = 1.0 / classes.length;
    }
  }
  var s = 0.2;
  for(var cc = 0; cc < classes.length; ++cc) {
    classes[cc] = [];
    classes[cc][0] = v2_rand();
    classes[cc][1] = [s, 0, 0, s];
  }
}

function em_prep(data, labelvecs, classes) {
  for(var dd = labelvecs.length; dd < data.length; ++dd) {
    labelvecs[dd] = [];
    for(var cc = 0; cc < classes.length; ++cc) {
      labelvecs[dd][cc] = 1.0 / classes.length;
    }
  }
  labelvecs.length = data.length;
  var s = 0.2;
  for(var cc = 0; cc < classes.length; ++cc) {
    if(classes[cc]) {
      continue;
    }
    classes[cc] = [];
    classes[cc][0] = v2_rand();
    classes[cc][1] = [s, 0, 0, s];
  }
}

function em_expect(data, labelvecs, classes) {
  // data: array of v2 points
  // labelvecs: probabilistic assignment of data to classes
  // classes: each is a [v2, m22]
  
  // This is described in:
  // http://en.wikipedia.org/wiki/Multivariate_normal_distribution
  // 
  // For every class..
  for(var cc = 0; cc < classes.length; ++cc) {
    // ..compute fixed parameters of probability density function..
    var inv_cov = m22_invert(classes[cc][1]);
    var d = Math.pow(m22_det(classes[cc][1]), -0.5);
    // ..and for every datum..
    for(var dd = 0; dd < data.length; ++dd) {
      var rel = v2_sub_v2(data[dd], classes[cc][0]);
      // ..compute its probability.
      var p = d*Math.exp(-0.5*v2_dot_v2(v2_mul_m22(rel, inv_cov), rel));
      labelvecs[dd][cc] = p;
    }
  }

  // Now normalize so each datum has probability 1.0.
  // Also label each one as its current most likely class.
  for(var dd = 0; dd < data.length; ++dd) {
    var sum = 0;
    var max = 0;
    var maxcc = 0;
    for(var cc = 0; cc < classes.length; ++cc) {
      sum += labelvecs[dd][cc];
      if (labelvecs[dd][cc] > max) {
        max = labelvecs[dd][cc];
        maxcc = cc;
      }
    }
    labels[dd] = maxcc;
    for(var cc = 0; cc < classes.length; ++cc) {
      labelvecs[dd][cc] /= sum;
    }
  }
}

function em_maximize(data, labelvecs, classes) {
  for(var cc = 0; cc < classes.length; ++cc) {
    var sum = [0,0];
    var num = 0;
    for(var dd = 0; dd < data.length; ++dd) {
      var p = labelvecs[dd][cc];
      sum[0] += p * data[dd][0];
      sum[1] += p * data[dd][1];
      num += p;
    }
    
    var mean = [sum[0]/num, sum[1]/num];
    var xx = 0, yy = 0, xy = 0;
    for(var dd = 0; dd < data.length; ++dd) {
      var p = labelvecs[dd][cc];
      var rel = v2_sub_v2(data[dd], mean);
      xx += rel[0]*rel[0] * p;
      xy += rel[0]*rel[1] * p;
      yy += rel[1]*rel[1] * p;

    }
    xx /= num;
    xy /= num;
    yy /= num;
    
    var cov = [xx, xy, xy, yy];
    
    classes[cc][0] = mean;
    classes[cc][1] = cov;
  }  
}

function em_draw_classes(classes) {
  var nn = 32;
  for(var cc = 0; cc < classes.length; ++cc) {
    var mean = classes[cc][0];
    var ch = m22_transpose(m22_chol(classes[cc][1]));
    ctx.strokeStyle = colors[1+cc];    
    for(var kk = 1; kk <= 2; ++kk) {
      ctx.beginPath();
      for(var ii = 0; ii <= nn; ++ii) {
        var th = ii/nn*2*Math.PI;
        var v = [kk*Math.cos(th), kk*Math.sin(th)];
        v = v2_add_v2(mean, v2_mul_m22(v,ch));
        if (ii == 0) {
          ctx.moveTo(v[0], v[1]);
        } else {
          ctx.lineTo(v[0], v[1]);
        }
      }
      ctx.stroke();
    }
  }
}

var ctx;
function get_context() {
  if(ctx) return;
  var canvas = document.getElementById("canvas");
  canvas.onselectstart = function () { return false; }
  ctx = canvas.getContext("2d");
  var size = 400;
  // convert size^2 pixel <canvas> to unit square coordinates:
  ctx.translate(size/2,size/2);
  ctx.scale(size/2,-size/2);
}

function draw_grid() {
  ctx.lineWidth = 0.005;
  for(var xx = -9; xx <= 9; ++xx) {
    ctx.strokeStyle = "rgb(192,192,192)";
    ctx.beginPath();
    ctx.moveTo(xx/10,-1); ctx.lineTo(xx/10,1);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-1,xx/10); ctx.lineTo(1,xx/10);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgb(64,64,64)";
  ctx.beginPath();
  ctx.moveTo(-1,0); ctx.lineTo(1,0);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0,-1); ctx.lineTo(0,1);
  ctx.stroke();
}

// 
function draw_data(data,labels) {
  // data: array of v2.
  // labels: optional array of integer color indices.
  for(var dd = 0; dd < data.length; ++dd) {
    if (labels && dd < labels.length) {
      ctx.fillStyle = colors[1+labels[dd]];
    } else {
      ctx.fillStyle = colors[0];
    }
    ctx.beginPath();
    ctx.arc(data[dd][0],data[dd][1],0.015,0,2*Math.PI,0);
    ctx.fill();
  }
}

function draw_means(means) {
  ctx.strokeStyle = 'rgb(80,80,80)';
  ctx.lineWidth = 0.01;
  for(var mm = 0; mm < means.length; ++mm) {
    ctx.fillStyle = colors[1+mm];
    ctx.beginPath();
    ctx.arc(means[mm][0],means[mm][1],0.03,0,2*Math.PI,0);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(means[mm][0],means[mm][1],0.03,0,2*Math.PI,0);
    ctx.stroke();
  }
}

var colors = [ 'rgb(128,128,128)',
               'rgb(197,107,35)',
               'rgb(131,16,29)',
               'rgb(0,96,75)',
               'rgb(0,147,180)',
               'rgb(160,0,160)',
               'rgb(0,0,192)',
               'rgb(120,120,80)',
               'rgb(255,255,0)',
               'rgb(64,64,64)'];

// Data to be clustered. Each element is [x,y] in (-1:1).
var data = [];
// Labels for each datum.  Integers < colors.length.
var labels = [];
var nclasses = 3;

// Stuff for k-means:
// Each element is an [x,y] mean for the corresponding class.
var means = [];

// Stuff for EM.
// Each element is a size-nclasses array of probs st. sum(..)=1.
var em_labelvecs = [];
// Each element is a [mean, covariance] pair.  (v2, m22).
var em_classes = [];


// 0: none, 1: kmeans, 2: em.
var mode = 0;

function cluster_init() {
  if (nclasses < 1) nclasses = 1;
  
  // Resize labels to data and assign invalid labels randomly.
  labels.length = data.length;
  for(var ll = 0; ll < labels.length; ++ll) {
    if (labels[ll] == null || labels[ll] < 0 || labels[ll] >= nclasses) {
      labels[ll] = Math.floor(Math.random(nclasses));
    }
  }

  means.length = nclasses;
  // Compute the mean of each existing class.
  kmeans_update_means(data, means, labels);
  
  em_classes.length = nclasses;
  // Calculate the gaussian of each existing class.
  
  em_prep(data, em_labelvecs, em_classes, labels);
  //em_init(data, em_labelvecs, em_classes, labels);
  
  //em_maximize(data, em_labelvecs, em_classes);
  
  draw(); 
}

//cluster_init();

var animate = 0;
function cluster_update() {
  if(mode == 1) {
    kmeans_update_means(data,means,labels);
    if(!kmeans_update_labels(data,means,labels)) {
      animate = 0;
    }
  } else if (mode == 2) {
    em_expect(data, em_labelvecs, em_classes);
    em_maximize(data, em_labelvecs, em_classes);
    for(var dd = 0; dd < data.length; ++dd) {
      var max_p = 0;
      var max_cc = 0;
      for(var cc = 0; cc < em_classes.length; ++cc) {
        if (em_labelvecs[dd][cc] > max_p) {
	        max_p = em_labelvecs[dd][cc];
	        max_cc = cc;
        }
      }
      labels[dd] = max_cc;
    }
  }
  draw();
  if (animate > 0) {
    --animate;
    window.setTimeout(cluster_update, 200);
  }
}
  
function draw() {
  get_context();
  ctx.clearRect(-1,-1,2,2);
  draw_grid();
  draw_data(data,labels);
  if (mode == 1) {
    draw_means(means);
  } else if(mode == 2){
    em_draw_classes(em_classes);
  }
}


function body_onload() {
  data = draw_image(image);
  nclasses = 2;
  mode = 2;
  animate = 100;
  cluster_init();
  for(var ii = 0; ii < 5; ++ii) {
    cluster_update();
  }
  
  

  draw();
}

function canvas_click() {
  var x0 = -1 + 2 * event.offsetX / 400;
  var y0 =  1 - 2 * event.offsetY / 400;
  var s = 0.1;
  var n = 16;
  while(n--) {
    var x = x0 + s*(1-2*Math.random());
    var y = y0 + s*(1-2*Math.random());
    if (x > 1) x = 1; if (x < -1) x = -1;
    if (y > 1) y = 1; if (y < -1) y = -1;
    data.push([x,y]);
  }
  cluster_init();
  draw();
}

function clearData(){
  data = [];
  labels = [];
  mode = 0;
  draw();
}

