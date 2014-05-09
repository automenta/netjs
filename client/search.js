/** Search and NLP (natural language processing) support */

var englishInvalidKeywords = /^and|or|to|the|if|it|with|which|an|how|why|what|where|when|that|can|will|object$/;
function isValidKeyword(x) {
    if (x.length < 2)
        return false;
    return !englishInvalidKeywords.test(x);
}

function getKeywords(s) {
    return s.toLowerCase().replace(',', ' ').replace('\.', ' ')
            .replace('\:', ' ')
            .replace('\/', ' ').split(' ');
}

function updateTagSuggestions(t, mt, onAdd, getEditedFocus, ontocache) {
    var matched = $N.searchOntology(t, ontocache);

    mt.empty();

    _.each(matched, function(mm) {
        (function() {
            var m = mm[0];
            var score = mm[1];

            var e = getEditedFocus();
            if (objHasTag(e, m))
                return;

            var mx = $N.getTag(m);
            if (!mx)
                return;

            var mn = mx.name;

            //var bb = $('<button>' + mn + '?</button>');
            var ti = getTagIcon(m);
            if (ti)
                mn = '<img src="' + ti + '"/>' + mn;

            var bb = $('<a href="#">+' + mn + '?</a>');
            bb.click(function() {
                onAdd({id: mx.uri});
            });

            var opacity = 0.5 + (score / 2.0);
            bb.css('opacity', opacity);

            mt.append(bb);
        })();
    });
}

function updateTagSuggestionsOLD(t, mt, onAdd, getEditedFocus) {
    t = getKeywords(t);

    var keywords = _.filter(t, isValidKeyword);

    mt.empty();

    var matched = {};
    _.each(keywords, function(keyword) {
        var types = $N.tags;

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
            if (types[t].reserved)
                continue;
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

            var mx = $N.getTag(m);
            var mn = mx.name;

            //var bb = $('<button>' + mn + '?</button>');
            var ti = getTagIcon(m);
            if (ti)
                mn = '<img src="' + ti + '"/>"' + mn;

            var bb = $('<a href="#">' + mn + '?</a>');
            bb.click(function() {
                onAdd({id: mx.uri});
            });
            mt.append('+');
            mt.append(bb);
            mt.append('&nbsp;');
        })();
    }
}


function getRelevant(sort, scope, semantic, s, maxItems) {

    var now = Date.now();
    var location = objSpacePointLatLng($N.myself());

    var relevance = {};
    var focus = $N.focus();
    var focusWhen = objWhen(focus);

    var ft;
    if (focus) {
        semantic = 'Relevant';
        ft = objTags(focus);

        //exclude tile layers from filter
        ft = _.filter(ft, function(t) {
            var T = $N.getTag(t);
            if (T) {
                if (T.tileLayer)
                    return false;
                if (T.wmsLayer)
                    return false;
                if (T.geoJSON)
                    return false;
                if (T.dbpediaLayer)
                    return false;
            }
            return true;
        });

        if (focus.userRelation) {
            if ($N.userRelations == null) {
                $N.userRelations = objUserRelations($N.objectsWithTag('Trust', true));
            }
        }

    }

    var ii = _.keys($N.layer().include);
    var ee = _.union(_.keys($N.layer().exclude), ['Template']);

    for (var k in $N.objects()) {

        var x = $N.getObject(k);

        if (x.replyTo)
            continue;
        if (x.hidden)
            continue;

        //TAG filter
        var allowed = true;
        var tags = objTags(x);
        {
            if (ii.length > 0) {
                allowed = false;
                for (var i = 0; i < ii.length; i++) {
                    var inc = ii[i];
                    if (_.contains(tags, inc)) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (ee.length > 0) {
                for (var i = 0; i < ee.length; i++) {
                    var exc = ee[i];
                    if (_.contains(tags, exc)) {
                        allowed = false;
                        break;
                    }
                }
            }
        }

        if (!allowed)
            continue;

        //scope prefilter
        if (scope == 'Mine') {
            if (x.author != s.id())
                continue;
        }
        else if (scope == 'Others') {
            if (x.author == s.id())
                continue;
        }

        if (focus) {
            if (focus.who)
                if (x.author != focus.who)
                    continue;

            if (focus.userRelation) {
                if (x.author) {
                    if (focus.userRelation.itrust) {
                        //do I trust the author of the object?
                        if ($N.userRelations[$N.id()]['trusts'][x.author] == undefined)
                            continue;
                    }
                    if (focus.userRelation.trustme) {
                        //do I trust the author of the object?
                        if ($N.userRelations[$N.id()]['trustedBy'][x.author] == undefined)
                            continue;
                    }
                }
				else {
					continue;
				}
            }
        }

        //sort
        var r = 1.0;
        if (sort == 'Recent') {
            var w = objTime(x);
            ;
            if (w == null)
                continue;
            var ageSeconds = Math.abs(now - w) / 1000.0;
            //r = Math.exp(-ageSeconds/10000.0);
            r = 1.0 / (1.0 + ageSeconds / 60.0);
        }
        else if (sort == 'Near') {

            if (!location) {
                continue;
            }

            var llx = objSpacePointLatLng(x);
            if (!llx) {
                continue;
            }

            var distance = geoDist(location, llx); //kilometers
            //r = Math.exp(-distance/10000.0);
            r = 1.0 / (1.0 + distance);
        }
        //DEPRECATED
        else if (sort == 'Spacetime') {
            var llx = objSpacePointLatLng(x);
            if ((!location) || (!llx) || (!x.when)) {
                continue;
            }
            var timeDistance = Math.abs(now - x.when) / 1000.0; //seconds
            var spaceDistance = geoDist(location, llx) * 1000.0; //meters
            //r = Math.exp(-(timeDistance + spaceDistance)/10000.0);            
            r = 1.0 / (1.0 + ((timeDistance / 60.0) + spaceDistance));
        }

        if (semantic == 'Relevant') {
            if (focus) {
                if (focus.name) {
                    var fn = focus.name.toLowerCase();

                    var xn = (x.name || '');
                    if (xn.toLowerCase)
                        xn = xn.toLowerCase();

                    if (xn.indexOf(fn) == -1)
                        r = 0;
                }

                if (r > 0) {
                    if (ft.length > 0) {
                        var m = objTagRelevance(focus, x);
                        r *= m;
                    }
                }
                if (r > 0) {
                    if (focusWhen) {
                        var f = focusWhen.from;
                        var t = focusWhen.to;
                        var wx = objWhen(x);
                        if (typeof wx === 'number') {
                            if (wx < f)
                                r = 0;
                            if (wx > t)
                                r = 0;
                            //console.log(wx, focusWhen);							
                        }
                    }
                }
            }
            else
                r = 0;
        }

        if (r > 0) {
            relevance[k] = r;
        }
    }

    var relevant = _.keys(relevance);
    relevant.sort(function(a, b) {
        return relevance[b] - relevance[a];
    });

    /*
     if (relevant.length > maxItems) {
     o.prepend('<span>Too many: 1..' + maxItems + ' of ' + relevant.length + '</span>');
     }
     else {
     
     }
     */

    return [_.first(relevant, maxItems), relevance];
}


