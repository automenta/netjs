"use strict";

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

            var bb = $('<a>+' + mn + '?</a>');
            bb.click(function() {
                onAdd({id: mx.id});
            });

            var opacity = 0.5 + (score / 2.0);
            bb.css('opacity', opacity);

            mt.append(bb);
        })();
    });
}

/*
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

            var bb = $('<a>' + mn + '?</a>');
            bb.click(function() {
                onAdd({id: mx.id});
            });
            mt.append('+');
            mt.append(bb);
            mt.append('&nbsp;');
        })();
    }
}
*/

function getRelevant(sort, scope, semantic, s, maxItems, preFilter) {

    var myid = $N.id();
    var now = Date.now();
    var focus = $N.focus();

    var when = null;
    var location = objSpacePointLatLng($N.myself());

    var relevance = {};

    var focusName = focus ? focus.name : undefined;
    if (focusName === true)
        focusName = undefined;

    var focusWho = focus ? focus.who : undefined;
    if (focusWho) {
        if (_.keys(focusWho).length === 0)
            focusWho = undefined;
    }

    var focusWhen = focus ? focus.when : undefined;
    if (focusWhen) {
        sort = 'Recent';
        when = focusWhen;
    }

    var focusWhere = focus ? objSpacePointLatLng(focus) : null;
    if (focusWhere) {
        location = focusWhere;
        sort = 'Near';
    }

    var ft;
    if (focus) {
        semantic = 'Relevant';
        ft = $N.getTags(focus);

        //exclude tile layers from filter
        ft = _.filter(ft, function(t) {
            var T = $N.class[t];
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


    }


    var ii = _.keys($N.layer().include);
    var ee = _.keys($N.layer().exclude);

    var SCOPE_MINE = (scope === 'Mine');
    var SCOPE_OTHERS = (scope === 'Others');
    var SEMANTIC_RELEVANT = (semantic === 'Relevant');
    var SORT_SPACETIME = (sort === 'Spacetime');
    var SORT_NEAR = (sort === 'Near');
    var SORT_RECENT = (sort === 'Recent');

    var focusTagStrength = $N.getTagStrength(focus, false);

    var instances = 0;
    for (var k in $N.instance) {
        var x = $N.instance[k];
        instances++;

        if (x.hidden)
            continue;

        if (x.replyTo)  //TODO make this condition optional
            continue;

        var xx = null;

        if (preFilter) {
            xx = $N.getTagStrength(x, false);
            if (!preFilter(x, xx))
                continue;
        }

        {
            var allowed = true;
            if (ii.length > 0) {
                allowed = false;
                for (var i = 0; i < ii.length; i++) {
                    var inc = ii[i];
                    if (tags[inc] !== undefined) {
                        allowed = true;
                        break;
                    }
                }
            }
            if (ee.length > 0) {
                for (var i = 0; i < ee.length; i++) {
                    var exc = ee[i];
                    if (tags[exc] !== undefined) {
                        allowed = false;
                        break;
                    }
                }
            }
            if (!allowed)
                continue;
        }


        //scope prefilter
        if (SCOPE_MINE) {
            if (x.author !== myid)
                continue;
        }
        else if (SCOPE_OTHERS) {
            if (x.author === myid)
                continue;
        }

        if (focus) {
            if (focusWho) {
                if (x.author === undefined) {
                    if (!focusWho.unknown)
                        continue;
                }
                else if (!focusWho[x.author])
                    continue;
            }

            if (focus.userRelation) {
                if (x.author) {
                    if (myid === x.author)
                        continue;

                    if (focus.userRelation.itrust) {
                        //do I trust the author of the object?
                        if ($N.getTrust(myid, x.author) <= 0)
                            continue;
                    }

                    if (focus.userRelation.trustme) {
                        //do I trust the author of the object?
                        if ($N.getTrust(x.author, myid) <= 0)
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
        if (SORT_RECENT) {
            var w = objTime(x);

            if (w === null)
                continue;

            var ageSeconds = Math.abs(now - w) / 1000.0;
            //r = Math.exp(-ageSeconds/10000.0);
            r = 1.0 / (1.0 + ageSeconds / 60.0);
        }
        else if (SORT_NEAR) {

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
        else if (SORT_SPACETIME) {
            var llx = objSpacePointLatLng(x);
            if ((!location) || (!llx) || (!x.when)) {
                continue;
            }
            var timeDistance = Math.abs(now - x.when) / 1000.0; //seconds
            var spaceDistance = geoDist(location, llx) * 1000.0; //meters
            //r = Math.exp(-(timeDistance + spaceDistance)/10000.0);
            r = 1.0 / (1.0 + ((timeDistance / 60.0) + spaceDistance));
        }

        if (SEMANTIC_RELEVANT) {
            if (focus) {
                if (focusName) {
                    var fn = focusName.toLowerCase();

                    var xn = (x.name || '');
                    if (xn.toLowerCase)
                        xn = xn.toLowerCase();

                    if (xn.indexOf(fn) === -1) {
                        continue;
                    }
                }

                if (r > 0) {
                    if (when) {
                        var f = when[0];
                        var t = when[1];
                        var wx = objWhen(x);
                        if (wx !== undefined) {
                            if (wx < f)
                                r = 0;
                            if (wx > t)
                                r = 0;
                        }
                        else
                            r = 0;
                    }
                }

                if (r > 0) {
                    if (ft.length > 0) {
                        if (xx === null)
                             xx = $N.getTagStrength(x, false);
                        r *= objTagStrengthRelevance(xx, focusTagStrength);
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

    var relevant = Object.keys(relevance);
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

    var relevantItems = _.first(relevant, maxItems);
     $('#FocusStatus').html('Focus: ' + relevantItems.length + ' / ' + instances);

    if (relevant.length > relevantItems.length)
        $('#FocusStatus').append('<i>&nbsp;+' + (relevant.length - relevantItems.length) + ' more</li>');

    return [relevantItems, relevance];
}


