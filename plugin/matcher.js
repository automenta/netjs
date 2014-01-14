var util = require('../client/util.js');
var _ = require('underscore');


//return 0..1.0 depending on similarity of two object's tag arrays.
//  this is analogous to a vector "dot product" of the tags
function getTagSimilarity(a, b) {
    var at = a.tag;
    var bt = b.tag;

    if ((at.length == 0) || (bt.length == 0))
        return 0;
    
    var maxTotal = Math.max(at.length, bt.length);
    
    var score = 0;
    var common = _.intersection(at, bt);
    for (var i = 0; i < common.length; i++) {
        var c = common[i];
        score++;
    }
    
    score /= maxTotal;
    
    return {
        'score': score,
        'common': common
    };    
}

function getPropertySimilarity(a, b, commonTags) {
    var av = a.values;
    var bv = b.values;
    if ((!av) || (!bv))
        return 0;

    if ((av.length == 0) || (bv.length == 0))
        return 0;
        
    var maxProperties = Math.max(av.length, bv.length);
        
    function vm(v) { return v.uri; }
    var avk = _.map(av, vm);
    var bvk = _.map(bv, vm);
    
    var commonProperties = _.intersection(avk, bvk);
    
    //TODO do predicate expression matching
    
    var score = commonProperties.length / maxProperties;
    
    return {
        'score': score,
        'common': commonProperties
    };
}

exports.plugin = {
        name: 'Semantic Property Matcher (Basic)',    
    	description: 'Generates matches (as replies) to similar objects',
		options: { },
        version: '1.0',
        author: 'http://netention.org',
        
		start: function(netention) {             
            this.netention = netention;
            this.author = 'SemanticPropertyMatcher1';            
            
            netention.addTags([
                {
                    uri: 'Similar', name: 'Similar',                     
                    properties: {       }
                }
            ]);
            
        },
        
        matches : function(a, b) {
            if (a.uri == b.uri) 
                return;
                
            var s = getTagSimilarity(a, b);
            if (s.score > 0) {
                var p = getPropertySimilarity(a, b, s.common);
                var auth = this.author;
                
                //ignore matches that have no properties in common
                //TODO make this a parameter
                if (!p)
                    return;
                    
                var explanation = 'Common tags: ' + (s.common) + ' ' + (s.score*100.0) + '%';
                if (p) {
                    explanation += ' | Common properties: ' + (p.common) + ' ' + p.score + '| ';
                }
                
                var tags = [ 'Similar' ];
                var tagStrengths = [ 1.0 ];
                
                if (a.author) {
                    var ab = {
                        uri: util.uuid(),
                        tag: tags, tagStrength: tagStrengths,
                        //author: auth,
                        when: Date.now(),
                        name: ('Similar: <a href="/#/object/' + b.uri + '">' + b.name + '</a>'),
                        text: explanation,
                        replyTo: a.uri
                    };
                    this.netention.pub(ab);
                }
                if (b.author) {
                    var ba = {
                        uri: util.uuid(),
                        tag: tags, tagStrength: tagStrengths,
                        //author: auth,
                        when: Date.now(),
                        name: ('Similar: <a href="/#/object/' + a.uri + '">' + a.name + '</a>'),
                        text: explanation,
                        replyTo: b.uri
                    };
                    this.netention.pub(ba);
                }
                
            }
        },
                
        notice: function(x) {
                        
            if (!x.author)
                return;
            
            if (x.author == this.author)
                return;
            
            var that = this;
            if (x.tag) {
                //TODO add 'defined(author)=true' to query somehow to optimize result size
                this.netention.getObjectsByTags(x.tag, function(objs) {
                    for (var i = 0; i < objs.length; i++) {
                        that.matches(x, objs[i]);
                    }
                });
            }
            
        },
        
		stop: function(netention) {
		}
};
