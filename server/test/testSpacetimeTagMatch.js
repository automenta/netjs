var _ = require('underscore');
var kmeans = require('kmeans');


function hoursFromNow(n) {
    return Date.now() + 60.0 * 60.0 * 1000.0 * n;
}

function getUniqueTags(t) {
    var tags = [];
    for (var i = 0; i < t.length; i++) {
        var tt = t[i];
        tags = tags.concat(tt[3]);        
    }
    tags = _.unique(tags);
    return tags;
}

function getObservations(t, tags) {
    var obs = [];
    for (var i = 0; i < t.length; i++) {
        var tt = t[i];        
        var l = [ tt[0], tt[1], tt[2] ];
        var totalContained = 0;
        for (var k = 0; k < tags.length; k++) {
            if (_.contains(tt[3], tags[k]))
                totalContained++;
        }
        if (totalContained > 0) {
            for (var k = 0; k < tags.length; k++) {
                l.push(_.contains(tt[3], tags[k]) ? (1.0/totalContained) : 0.0) 
            }
        }
        obs.push(l);
    }
    return obs;
}

function normalize(points, index) {
    var min, max;
    min = max = points[0][index];
    for (var i = 0; i < points.length; i++) {
        var pp = points[i][index];
        if (pp < min) min = pp;
        if (pp > max) max = pp;
    }
    for (var i = 0; i < points.length; i++) {
        var pp = points[i][index];
        pp = (pp-min) / (max-min);
        points[i][index] = pp;
    }    
    return [points, min, max];
}

var centroids = 2;

var points = [];
points.push( [ 0, 0, hoursFromNow(0), ['a', 'b'] ] ); 
points.push( [ 0.25, 0, hoursFromNow(0.2), ['a', 'b'] ] ); 
points.push( [ 0.5, 0, hoursFromNow(1), [ 'b'] ] ); 
points.push( [ 0.5, 0.25, hoursFromNow(5.0), [ 'd'] ] ); 
points.push( [ 1.0, 0.5, hoursFromNow(2), ['c'] ] ); 
points.push( [ 1.1, 0.6, hoursFromNow(2.2), ['c'] ] ); 
points.push( [ 0.9, 0.55, hoursFromNow(1.9), ['c'] ] ); 

var tags = getUniqueTags(points);
var obs = getObservations(points, tags);
var timeNorm = normalize(obs, 2);

obs = timeNorm[0];
console.log(obs);

var km = kmeans.create(obs, centroids);

var result = km.process();


console.log('RESULTS');
var m = result.means;
for (var i = 0; i < m.length; i++) {
    var mm = m[i];
    var res = { 
        location: [mm[0], mm[1]], time: new Date((mm[2]*(timeNorm[2]-timeNorm[1]) + timeNorm[1]))
    };
    if (mm.length > 3) {
        for (var k = 3; k < mm.length; k++) {
            var t = tags[k-3];
            if (mm[k] > 0)
                res[t] = mm[k];            
        }
    }
    console.log(res);
}
//console.log(result.clusters);
//console.log(result.variances);
