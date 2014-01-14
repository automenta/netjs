var _ = require('underscore');
var kmeans = require('kmeans');

var IgnoreTags = [ 'Goal' ];

function hoursFromNow(n) { return Date.now() + 60.0 * 60.0 * 1000.0 * n;     }

function getSpaceTimeTagCentroids(points, centroids) {    

    function getUniqueTags(t) {
        var tags = [];
        for (var i = 0; i < t.length; i++) {
            var tt = t[i];
            tags = tags.concat(tt[3]);        
        }
        tags = _.unique(tags);
		tags = _.difference(tags, IgnoreTags);
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

    function normalize(points, index, scale) {
        var min, max;
        if (!scale)
            scale = 1.0;
        
        min = max = points[0][index];
        for (var i = 1; i < points.length; i++) {
            var pp = points[i][index];
            if (pp < min) min = pp;
            if (pp > max) max = pp;
        }
        
        for (var i = 0; i < points.length; i++) {
            var pp = points[i][index];
            if (min != max) {
                pp = (pp-min) / (max-min) * scale;
            }
            else {
                pp = 0.5;
            }
            points[i][index] = pp;
        }    
        return [points, parseFloat(min), parseFloat(max), scale];
    }

    var tags = getUniqueTags(points);
    var obs = getObservations(points, tags);
    
    
    var w = 8 * (1 + (tags.length));
    var timeNorm = normalize(obs, 2, w);    
    obs = timeNorm[0];
    var latNorm = normalize(obs, 0, w);
    obs = latNorm[0];
    var lonNorm = normalize(obs, 1, w);
    obs = lonNorm[0];
    
    
    //TODO normalize lat/lon

    var km = kmeans.create(obs, centroids);
    var maxIterations = 128;
    km.process = function() {
        // iterate until generated means converged
        var ii = 0;
        while(this._iterate()) {
            //console.log(this._lastIteration());
            //console.log('Iteration ' + this.iterationCount() + ' means');
            //console.log(this._lastIteration().means);
            //console.log('Iteration ' + this.iterationCount() + ' variances');
            //console.log(this._lastIteration().variances);
            if ((ii++) == maxIterations)
                break;            
        }
        return this._lastIteration();
    };
    var result = km.process();
    
    
    var m = result.means;
    var cc = result.clusters;
    
    function denormalize(value, minmax) {
        if (minmax[2] === minmax[1]) {
            return minmax[1];
        }
        
        var scale = minmax[3];
        if (value < 0) value = 0;
        if (value > scale) value = scale;
        
        value/=scale;
        var v = (minmax[2] > minmax[1]) ? (value * (minmax[2]-minmax[1]) + minmax[1]) :
                (value * (minmax[1]-minmax[2]) + minmax[2]);
        
        
        return v;
    }
    
    var results = [];
    for (var i = 0; i < m.length; i++) {
        var mm = m[i];
        var res = { 
            location: [denormalize(mm[0],latNorm), denormalize(mm[1],lonNorm)], 
			time: denormalize(mm[2], timeNorm)
        };
        if (mm.length > 3) {
            for (var k = 3; k < mm.length; k++) {
                var t = tags[k-3];
                if (mm[k] > 0)
                    res[t] = mm[k];            
            }
        }
        results.push(res);
    }
    
    return results;
}
exports.getSpaceTimeTagCentroids= getSpaceTimeTagCentroids;
