/** Search and NLP (natural language processing) support */

var englishInvalidKeywords = /^and|or|to|the|if|with|which|an$/;
function isValidKeyword(x) {
    if (x.length < 2) return false;
	return !englishInvalidKeywords.test(x);
}

function getKeywords(s) {
    return s.toLowerCase().replace(',',' ').replace('\.',' ')
            .replace('\:',' ')
            .replace('\/',' ').split(' ');
}

function updateTagSuggestions(t, mt, onAdd, getEditedFocus) {
    t = getKeywords(t);
    
    var keywords = _.filter(t, isValidKeyword);
    
    mt.html('');
    
    var matched = { };
    _.each(keywords, function(keyword) {
        var types = self.tags;
        
        function keywordMatchesTag(k, t) {
            var name = types[t].name;
            var desc = types[t].description;
            if (desc) {
                name = name + ' ' + desc;
            }
            var kk = getKeywords(name);
            
            return _.contains(kk, k);                            
        }
        
        for (var t in types) {
            if (keywordMatchesTag(keyword, t)) {
                matched[t] = true;
            }
        }
        
    });
    
    for (var m in matched) {
        (function() {
            var e = getEditedFocus();
            if (objHasTag(e, m))
                return;
                
            var mx = self.getTag(m);
            var mn = mx.name;
            
            //var bb = $('<button>' + mn + '?</button>');
			var ti = getTagIcon(m);
			if (ti)
				mn = '<img src="' + ti + '"/>"' + mn;

            var bb = $('<a href="#">' + mn + '?</a>');
            bb.click(function() {
                onAdd( { id: mx.uri } );
            });
            mt.append('+');
            mt.append(bb);                        
            mt.append('&nbsp;');
        })();
    }
}

