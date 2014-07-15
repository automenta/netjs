
/*jslint ass: true, bitwise: true, browser: true, closure: true, continue: true, couch: true, debug: true, devel: true, eqeq: true, evil: true, forin: true, indent: 4, maxerr: 50, maxlen: 250, newcap: true, node: true, nomen: true, passfail: true, plusplus: true, regexp: true, rhino: true, sloppy: true, stupid: true, sub: true, todo: true, unparam: true, vars: true, white: true */
var server = false;
try {
	process.title;	server = true;
}
catch(e) { }

if ((!server) && (typeof window != 'undefined')) {
    exports = {}; //functions used by both client and server
	server = false;
} else {
    _ = require('lodash');
    graphlib = require("graphlib");
	server = true;
}




var ObjScope = {
    //level -1: store in local browser temporarily
    Local: 1, //store in local browser permanently
    ServerSelf: 2, //level 2: store on server but only for me (encrypted?)
    ServerSelfAndCertainOthers: 3, //store on server but only for me and certain people
    ServerFollowOrFollowed: 4, //store on server but share with who i follow or follows me
    ServerFollow: 5, //store on server but share with who i follow
    ServerAll: 6, //store on server for all server users
    Global: 7, //store on server for public access (inter-server)
    GlobalAdvertise: 8 //store on server for public advertisement (push)
};
exports.ObjScope = ObjScope;



function _n(x, places) {
    if (!places)
        places = 2;
    if (x === undefined)
        return '0';
    if (!x.toFixed)
        return x;
    return x.toFixed(places);
} //formats numbers to string w/ 2 decimal places
exports._n = _n;


function _s(s, maxLength, unicode) {
    if (s.length > maxLength) {
        return s.substring(0, maxLength - 2) + (unicode ? '&#8230;' : '..');
    }
    return s;
}
exports._s = _s;

/**
 * nobject( { ...pre-created data .. } )
 * or
 * nobject( id, name, initialTags )
 *
 * @param {type} x object array or id string
 * @param {type} name
 * @param {type} initialTags
 * @returns {undefined}
 */
function nobject(x, name, initialTags) {
    var id;
    if (x) {
        if (typeof x === "string") {
            id = x;
        }
        else {
            _.extend(this, x);
            return;
        }
    }

    this.id = id || uuid();
    this.name = name || '';
    this.createdAt = Date.now();

    if (initialTags) {
        if (!Array.isArray(initialTags))
            initialTags = [initialTags];
        this.addTags(initialTags);
    }

}
exports.nobject = nobject;

//DEPRECATED, use: new nobject()
function objNew(id, name, initialTags) {
    return new nobject(id, name, initialTags);
}
exports.objNew = objNew;


nobject.prototype.setName = function(n) {
    objName(this, n);
    return this;
};
nobject.prototype.setAuthor = function(n) {
    this.author = n;
    return this;
};

//.name is already used, so use n()
nobject.prototype.getName = function(n) {
    if (!n)
        return x.name;
    objName(x, n);
    return x;
};
nobject.prototype.getDescription = function() {
    return objDescription(this);
};
nobject.prototype.addDescription = function(d) {
    objAddDescription(this, d);
    return this;
};
nobject.prototype.setDescription = function(d) {
	objRemoveDescription(this);
    objAddDescription(this, d);
    return this;
};
nobject.prototype.touch = function() {
    objTouch(this);
    return this;
};
nobject.prototype.addValue = nobject.prototype.add = function(tagID, value, strength) {
    return objAddValue(this, tagID, value, strength);
};
/*x.objSpacePoint = function(latitude, longitude) {
 return objSpacePointLatLng
 }*/

//CLIENT-ONLY
nobject.prototype.own = function() {
    if ($N)
        this.author = $N.id();
    return this;
};

nobject.prototype.addTag = function(t, strength) {
    return objAddTag(this, t, strength);
};
nobject.prototype.removeTag = function(t) {
    return objRemoveTag(this, t);
};
nobject.prototype.addTags = function(tagArray) {
    for (var i = 0; i < tagArray.length; i++)
        this.addTag(tagArray[i]);
    return this;
};
nobject.prototype.hasTag = function(t) {
    return objHasTag(this, t);
};
nobject.prototype.tags = function() {
    return objTags(this);
};

/* altitiude in meters */
nobject.prototype.earthPoint = function(lat, lon, alt) {
    if (lat === undefined) {
        return objSpacePointLatLng(this);
    }
    var sp = {
        'lat': lat,
        'lon': lon
    };
    if (alt)
        sp.alt = alt;
    return this.add('spacepoint', sp);
};
nobject.prototype.firstValue = function(id, defaultValue) {
    return objFirstValue(this, id, defaultValue);
};
nobject.prototype.getValues = function(id) {
    return objValues(this, id);
};
nobject.prototype.toString = function() {
    return JSON.stringify(this);
};




function timerange(start, end) {
    return {
        id: 'timerange',
        value: {
            start: Date.parse(start),
            end: Date.parse(end)
        }
    };
}
exports.timerange = timerange;

function objAddTag(x, t, strength) {
    var v = {
        id: t
    };
    if (strength !== undefined)
        v.strength = strength;
    return objAddValue(x, v, undefined);
}
exports.objAddTag = objAddTag;

//remove all instances of a tag
function objRemoveTag(x, t) {
    var noneRemain;
    do {
        noneRemain = true;

        if (!x.value)
            break;
        for (var i = 0; i < x.value.length; i++) {

            if (x.value[i].id === t) {
                x = objRemoveValue(x, i);
                noneRemain = false;
                continue;
            }
        }
    } while (!noneRemain);
    return x;
}
exports.objRemoveTag = objRemoveTag;

/*
 objAddValue(x, { id: i, value: v } )
 objAddValue(x, i, v)
 */
function objAddValue(x, a, b, strength) {
    var v;
    if (b === undefined)
        v = a;
    else {
        v = {
            id: a,
            value: b
        };
        if (strength !== undefined)
            v.strength = strength;
    }

    if (x.value === undefined)
        x.value = [];

    x.value.push(v);

    return x;
}
exports.objAddValue = objAddValue;

function objTouch(x) {
    x.modifiedAt = Date.now();
}
exports.objTouch = objTouch;

function objRemoveValue(x, i) {
    if (x.value) {
        if (i < x.value.length) {
            x.value.splice(i, 1);
            return x;
        }
    }
    return x;
}
exports.objRemoveValue = objRemoveValue;

function objName(x, newName) {
    /*  if newName is undefined, gets the name
     otherwise, sets the name to newName */

    if (newName === undefined) {
        return x.name || '';
    } else {
        x.name = newName;
        return x;
    }
}
exports.objName = objName;

var primitiveRegEx = /^(boolean|text|html|integer|real|url|object|spacepoint|timepoint|timerange|sketch|markdown|image|tagcloud|chat)$/;

function isPrimitive(t) {
    return primitiveRegEx.test(t);
}
exports.isPrimitive = isPrimitive;

function objAddDescription(x, desc) {
    return objAddValue(x, {
        id: 'html',
        value: desc
    });
}
exports.objAddDescription = objAddDescription;

function objRemoveDescription(x) {
	if (x.value)
		for (var i = 0; i < x.value.length; i++) {
			if (x.value[i].id === 'html')
				return objRemoveDescription(objRemoveValue(x, i));
		}
}
exports.objRemoveDescription = objRemoveDescription;

function objSetWhen(x, time) {
    x.when = time;
    objAddValue(x, 'timepoint', time);
    return x;
}
exports.objSetWhen = objSetWhen;

function objWhen(x) {
    return x.when /*|| objFirstValue(x, 'timepoint', null) || objFirstValue(x, 'timerange', null)*/ || x.modifiedAt || x.createdAt || undefined;
}
exports.objWhen = objWhen;

function objTime(x) {
    return x.when || x.modifiedAt || x.createdAt || undefined;
}
exports.objTime = objTime;


function objDescription(x, maxlen) {
    /* concatenates all 'description' tag values */
    var c = '';
    if (x.value) {
        for (var i = 0; i < x.value.length; i++) {
            var ii = x.value[i];
            if ((ii.id === 'html') && (ii.value)) {
                c = c + ii.value + ' ';
            }
        }
    }

	c = c.trim();
	if (maxlen) {
		if (c.length > maxlen-1)
			c = c.substring(0, maxlen-1) + '&hellip;';
	}

    return c.trim();
}
exports.objDescription = objDescription;

function objIncidentTags(olist, oneOfTags, userid) {
    var t = {};
    for (var i in olist) {
        var o = olist[i];

        if (userid) {
            if (o.author !== userid) {
                continue;
            }
        }

        var tags = objTags(o);

        for (var k = 0; k < oneOfTags.length; k++) {
            var kk = oneOfTags[k];
            if (_.contains(tags, kk)) {
                if (!t[kk])
                    t[kk] = [];
                t[kk] = t[kk].concat(o.id);
            }
        }

    }
    return t;

}
exports.objIncidentTags = objIncidentTags;



function objTags(x, includePrimitives) {
    // objTags(x) -> array of tags involved (except those with strength==0)
    if (!x.value)
        return [];
	
    var newValues = {};
    for (var i = 0; i < x.value.length; i++) {
        var vv = x.value[i];
        var t = vv.id;
        if (t) {
            if (vv.strength === 0)
                continue;

            if (!includePrimitives)
                if (isPrimitive(t))
                    continue;

            newValues[t] = true;						
        }
    }

    return _.keys(newValues);
}
exports.objTags = objTags;

function objProperties(x) {
    if (!x.value)
        return [];
    return _.uniq(_.pluck(x.value, 'id').filter(function(t) {
        return ($N.getProperty(t) !== null);
    }));
}
exports.objProperties = objProperties;


function objTagStrength(x, normalize, noProperties) {
    // objTags(x) -> array of tags involved
    var t = {};
    if (!x.value)
        return t;

    if (normalize === undefined)
        normalize = true;

    for (var i = 0; i < x.value.length; i++) {
        var vv = x.value[i];
        var ii = vv.id;
        if (isPrimitive(ii))
            continue;

		var s = vv.strength || 1.0;
        
		if (noProperties) {
            if ($N.property[ii])
                continue;
        }

		
        if (!t[ii])
            t[ii] = s;
        else
            t[ii] = Math.max(s, t[ii]);
		
    }


    if (normalize) {
        var total = 0.0;
        for (var k in t) {
            total += t[k];
        }

        if (total > 0) {
            for (var k in t) {
                t[k] /= total;
            }
        }
    }

    return t;
}
exports.objTagStrength = objTagStrength;

function objTagStrengthRelevance(xx, yy) {
    var xxc = 0, yyc = 0;
    for (var i in xx)
        xxc++;
    if (xxc === 0) return 0;
    for (var i in yy)
        yyc++;
    if (yyc === 0) return 0;



    var den = Math.max(xxc, yyc);

    var r = 0;
    var negatives = _.min(yy) < 0;
    var positives = _.max(yy) > 0;

    for (var c in xx) {

        //if (yyk.indexOf(c)!==-1) {
        if (yy[c] !== undefined) {

            //only yy is tested for having negative values
            if (negatives) {
                if ((yy[c] < 0) && (xx[c] > 0))
                    return 0;
                if (!positives)
                    r += 1;
            }
            if (positives) {
                r += xx[c] * yy[c];
            }
        }
        else {
            if (negatives) {
                if (!positives)
                    r += 1;
            }
        }
    }
    return r / den;
}
exports.objTagStrengthRelevance = objTagStrengthRelevance;

function objTagRelevance(x, y, noProperties) {
    /* dot product of the normalized tag vectors */

    var xx = objTagStrength(x, false, noProperties);
    var yy = objTagStrength(y, false, noProperties);

    return objTagStrengthRelevance(xx, yy);
}
exports.objTagRelevance = objTagRelevance;

/*

 objRadius(x) -> gets the radius of the first location tag

 objWhen(x) -> returns time associated with the object, using values in the priority:
 timeRange (avg time of start and stop)
 timePoint
 modifiedAt
 createdAt

 objTagIDs(x) -> array of tags involved, only the tag ID's as strings
 objTagStrengths(x, normalized) -> table of the strengths of tags involved. if a tag doesnt specify a strength, assume 1.  the values will be normalized against others at the end so they dont need to add up to 1
 objStrongestTag(x) -> the strongest tag, or if equal to another, the first listed

 objTriples(x) -> the RDF triples associated with an object

 objDistanceSpace(x, y) -> meters between two objects, assuming both have locations. otherwise null
 objDistanceTime(x, y) -> time difference between two objects, assuming both have times, otherwise null
 objDistanceSpaceTime(x, y, speed) - speed in meters/sec

 */

function objSpacePoint(x) {
    var s = objFirstValue(x, 'spacepoint', null);
    if (s !== null)
        return s;

    //TODO iterate through all values for a primitive with type spacepoint?
    return null;
}
exports.objSpacePoint = objSpacePoint;

function objGeographic(x) {
    //TODO check for planet
    var sp = objSpacePoint(x);
    return sp !== null;
}
exports.objGeographic = objGeographic;

function objSpacePointLatLng(x) {
    var osp = objSpacePoint(x);
    if (osp) {
        return [osp.lat, osp.lon];
    }
    return null;
}
exports.objSpacePointLatLng = objSpacePointLatLng;

function objAddGeoLocation(x, lat, lon) {
    return objAddValue(x, 'spacepoint', {
        'lat': lat,
        'lon': lon,
        planet: 'Earth'
    });
}
exports.objAddGeoLocation = objAddGeoLocation;


function objHasTag(x, t) {
    if (!x.value)
        return false;

    var tIsArray = Array.isArray(t);

    //if t is an array, return true if any one of t's elements is a tag
    for (var i = 0; i < x.value.length; i++) {
        var vv = x.value[i];
        if (!vv)
            continue;

        var vid = vv.id;
        if (!vid)
            continue;

        if (vv.strength!==undefined)
            if (vv.strength <= 0)
                continue;
        if (isPrimitive(vid))
            continue;

        if (tIsArray) {
            if (t.indexOf(vid) !== -1)
                return true;
        } else {
            if (vid === t)
                return true;
        }
    }
    return false;

}
exports.objHasTag = objHasTag;


function objFirstValue(object, id, defaultValue) {
    if (!object)
        return defaultValue;

    if (object.value) {
        if (Array.isArray(id)) {
            //TODO build a hash and lookup in that
            for (var i = 0; i < object.value.length; i++) {
                var v = object.value[i];
                if (id.indexOf(v.id) !== -1)
                    return v.value;
            }
        }
        else {
            for (var i = 0; i < object.value.length; i++) {
                var v = object.value[i];
                if (v.id === id)
                    return v.value;
            }
        }
    }
    return defaultValue;
}
exports.objFirstValue = objFirstValue;



function objSetFirstValue(object, id, newValue) {
    var existingValue = objFirstValue(object, id, null);
    if (existingValue === null) {
        objAddValue(object, id, newValue);
    } else {
        if (object.value) {
            for (var i = 0; i < object.value.length; i++) {
                var vk = object.value[i];
                if (vk.id === id) {
                    vk.value = newValue;
                    break;
                }
            }
        }
    }
}
exports.objSetFirstValue = objSetFirstValue;


function objValues(object, id) {
    var v = [];
    if (object.value) {
        for (var i = 0; i < object.value.length; i++) {
            var vk = object.value[i];
            if (vk.id === id)
                v.push(vk.value);
        }
    }
    return v;
}
exports.objValues = objValues;



function uuid() {
    //Mongo _id = 12 bytes (BSON) = Math.pow(2, 12*8) = 7.922816251426434e+28 permutations
    //UUID = 128 bit = Math.pow(2, 128) = 3.402823669209385e+38 permutations

    //RFC 2396 - Allowed characters in a URI - http://www.ietf.org/rfc/rfc2396.txt
    //		removing all that would confuse jquery
    //var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz-_.!~*\'()";
    //var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz-_";

    //TODO recalculate this
    //70 possible chars
    //	21 chars = 5.58545864083284e+38 ( > UUID) permutations
    //		if we allow author+objectID >= 21 then we can guarantee approximate sparseness as UUID spec
    //			so we should choose 11 character Nobject UUID length

    //TODO recalculate, removed the '-' which affects some query selectors if - is first
    var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz_";

    var string_length = 11;
    var randomstring = '';
    for (var i = 0; i < string_length; i++) {
        var rnum = Math.floor(Math.random() * chars.length);
        randomstring += chars[rnum];
    }
    return randomstring;
}
exports.uuid = uuid;


function isSelfObject(u) {
    return (u.id === u.author) && (u.id !== undefined);
}
exports.isSelfObject = isSelfObject;

/*
 function addProperty(x, p, value) {
 if (!value)
 value = "";

 x.values.push( { uri: p, 'value': value } );
 return x;
 }
 exports.addProperty = addProperty;
 */


function acceptsAnotherProperty(x, p) {
    //TODO determine this by Property arity constraints
    return true;
}
exports.acceptsAnotherProperty = acceptsAnotherProperty;

/*
 function addTagWithRequiredProperties(self, x, t, value) {
 var y = addTag(x, t, value);

 var tt = $N.getTag(t);
 for (var i in tt.properties) {
 var pp = tt.properties[i];
 if (pp.min) {
 if (pp.min > 0) {
 if (!getProperty(x, i)) {
 var dv = '';

 if (pp.default)
 dv = pp.default;

 y = addProperty(y, i, dv);
 }
 }
 }
 }

 return y;
 }
 */


//deprecated
function objUserRelations(trusts) {
    var userRelations = {};
    //...
    var userids = [];

    function index(uid) {
        if (userRelations[uid])
            return;

        userRelations[uid] = {
            'trusts': {},
            'trustedBy': {}
        };

        userids.push(uid);
    }

    for (var i = 0; i < trusts.length; i++) {
        var uid = trusts[i].author;
        index(uid);
        for (var j = 0; j < trusts[i].value.length; j++) {
            var v = trusts[i].value[j];
            if ((v.id === 'trusts') || (v.id === 'rippleTrusts')) {
                var target = v.value;
                if (target) {
                    index(target);
                    userRelations[uid]['trusts'][target] = 1;
                    userRelations[target]['trustedBy'][uid] = 1;
                }
            }
        }
    }

    return userRelations;
}
exports.objUserRelations = objUserRelations;


/** true if its first value is a reference to the Class tag */
function objIsClass(x) {
    if (x.extend !== undefined) {

        if (x.extend === null)
            return true;

        if ((typeof x.extend) === "string") {
            return (!isPrimitive(x.extend));
        }

        if (Array.isArray(x.extend))
            return true;
    }
    return false;
}
exports.objIsClass = objIsClass;

/** true if its value consists of only one primitive tag (with no datavalue) */
function objIsProperty(x) {
    if (x.extend)
        if (isPrimitive(x.extend))
            return true;
    return false;
}
exports.objIsProperty = objIsProperty;


function objEqual(x, y) {
	if (x.id == y.id)
		if (x.name == y.name)
			if (x.author == y.author)
				if (x.modifiedAt == y.modifiedAt)
					if (x.createdAt == y.createdAt)
						if (_.isEqual(x.value, y.value))
							if (x.subject == y.subject)
								if (x.when == y.when)
									//TODO compare other object fields
									return true;
	return false;
}
exports.objEqual = objEqual;


/*Array.prototype.pushArray = function(arr) {
 this.push.apply(this, arr);
 };*/

/** an interface for interacting with nobjects and ontology */
var Ontology = function(db, tagInclude, target) {
	"use strict";
	
    var that = target ? target : this;

	that.db = db;
	
	var graphEdge = ['value', 'not', 'distrust', 'trust'];

	var qsetPending = [];
	function queueSet(x, callback) {
		if (!x.id) {
			if (callback)
				return callback('Missing ID');
		}

		
		if (typeof (x.add) == "function") {
			//get a non-object copy
			x = _.clone(x);
		}
		

		x._id = x.id;


		if (callback)
			x._callback = callback;

		var tagList = that.getTags(x);	//provides an index for faster DB querying ($in)
		if (tagList.length > 0)
			x.tagList = tagList;

		if (qsetPending.length > 0) {
			qsetPending.push(x);
			return;
		}

		upsert(x);



		function next() {
			if (qsetPending.length === 0) {
				return false;
			}

			if (that.db.setAll) {
				var remaining = qsetPending;
				qsetPending = [];
				upsertAll(remaining);
			}
			else {
				var x = qsetPending.pop();
				upsert(x);
			}

			return true;
		}



		function upsertAll(a) {

			var callbacks = _.compact(_.pluck(a, '_callback'));

			function n(err, result) {
				next(err, result);
				for (var i = 0; i < callbacks.length; i++)
					callbacks[i](err, result);
			}
			
			that.db.setAll(a, n);
		}

		function upsert(x) {
			var nextCallback = x._callback||function(){};
			delete x._callback;

			function n(err, result) {
				next(err, result);
				nextCallback(err, result);
			}

			that.db.set(x.id, x, n, function(existing, value) {


				if (objEqual(existing, value)) {
					//console.log('avoided insert');
					return null;
				}

				return value;
			});
		}

	}

    //resets to empty state
    //TODO unify with the clearInstances function to not duplicate code
    that.clear = function() {

        that.object = {};        //indexed by id (URI)

        that.graphDistanceTag = ['Trust'];

        that.dgraph = new graphlib.Digraph();
        that.ugraph = new graphlib.Graph();

        that.ugraph._nodes = that.dgraph._nodes = that.object; //both graphs use the same set of nodes

        that.dgraphInOut = {};

        that.tagged = {};  //index of object tags
        that.reply = {}; //index of objects with a replyTo

        that.instance = {};
        that.property = {};
        that.class = {};
        that.classRoot = {};   //root classes

        that._graphDistance = { };

        function invalidateGraphDistance(v) {
            if (!that.graphDistanceTag)
                return;
            var valueTag = v;
            if (typeof valueTag === "string")
                if (that.graphDistanceTag.indexOf(valueTag)!==-1) {
                    delete that._graphDistance[valueTag]; //invalidate
                }
        }
        that.dgraph.addEdge = function(e, a, b, v) {
            invalidateGraphDistance(v);

            try {
                graphlib.Digraph.prototype.addEdge.apply(that.dgraph, arguments);
            }
            catch (err) {
                if (that.object[a]===undefined) {
                    console.error('missing source, buffering until', a);
                }
                if (that.object[b]===undefined) {
                    console.error('missing target, buffering until', b);
                }
                console.error('unable to add edge:',err,e,a,b,v);
            }
        };
        that.dgraph.delEdge = function(e) {
            if (that.dgraph.hasEdge(e))
                invalidateGraphDistance(that.dgraph.edge(e));
            try {
                graphlib.Digraph.prototype.delEdge.apply(that.dgraph, arguments);
            }
            catch (err) {
                console.error('unable to remove edge:',err);
            }
        };

        that.primitive = {
            'default': {},
            'instance': {},
            'property': {},
            'class': {},
            'integer': {},
            'real': {},
            'text': {},
            'html': {},
            'object': {},
            'spacepoint': {}
            //...
        };
    };

    /*
    that.clearInstances = function(exceptInstancesTagged) {
        var saved = null;
        if (exceptInstancesTagged) {
            saved = that.tagged[exceptInstancesTagged];
        }
        that.tagged = {};
        that.reply = {};
        that.object = _.extend(_.extend({}, that.class), that.property); //replace object with only classes and properties
        that.dgraphInOut = {};
        that._graphDistance = { };

        that.ugraph._nodes = that.dgraph._nodes = that.object; //both graphs use the same set of nodes

        that.instance = {};

        if (saved) {
            _.values(saved).forEach(function(s) {
                add(s);
            });
        }
    };
    */

    that.clear();

    that.addAll = function(a) {
        for (var i = 0; i < a.length; i++) {
            that.add(a[i]);
        }
    };

    that.add = function(x, whenFinished, noSave) {
        //updates all cached fields, indexes
        //can be called repeatedly to update existing object with that ID
        if (!x)
            return;

        if (x.removed) {
            return that.remove(x);
        }

        that.object[x.id] = x;

        if (objIsClass(x)) {
            var existing = that.class[x.id];
            var existingValues;
            if (!existing) {
                that.class[x.id] = x;
                x._class = true;
                delete that.property[x.id];
                delete x._property;
                delete that.instance[x.id];
                delete x._instance;
                x.property = {};
                x.class = {};
                x.subclass = {};
            }
            else {
                existingValues = existing.value;
                _.extend(existing, x);
                x = existing;
            }

            if (x.value) {
                if (!Array.isArray(x.value)) {
                    //convert from object form to array
                    var vv = [];
                    for (var k in x.value) {
                        var v = x.value[k];
                        if (v.id === undefined)
                            v.id = k;
                        if (that.property[v.id] === undefined) {
                            that.add(v);
                        }
                        vv.push(k);
                    }
                    x.value = vv;
                }


                if (existingValues)
                    x.value = _.union(x.value, existingValues);

                var vv = [];
                for (var i = 0; i < x.value.length; i++) {
                    var v = x.value[i];
                    if (v.id)
                        v = x.value[i] = v.id;

                    var existingProperty = that.property[v];

                    if (existingProperty)
                        x.property[v] = existingProperty;
                    else
                        console.error('Class', x.id, 'missing property', v);
                    vv.push(v);
                }
                x.value = vv; //store a compact literal array of strings
            }

            if (typeof x.extend === "string")
                x.extend = [x.extend];

            if ((x.extend === null) || (x.extend.length === 0)) {
                that.classRoot[x.id] = x;
            }
            else {
                delete that.classRoot[x.id];

                for (var i = 0; i < x.extend.length; i++) {
                    var v = x.extend[i];
                    var c = that.class[v];
                    if (!c) {
                        //create an empty class
                        c = {
                            id: v,
                            extend: null
                        };
                        that.add(c);
                    }
                    x.class[v] = c;
                    c.subclass[x.id] = x;
                }
            }

            that.serializedClasses = null;
            that.serializedJSON = null;

            //indexInstance(x, false); //index classes?
        }
        else if (objIsProperty(x)) {
            that.property[x.id] = x;
            x._property = true;
            delete that.class[x.id];
            delete x._class;
            delete that.instance[x.id];
            delete x._instance;
            that.serializedPropreties = null;
			that.serializedJSON = null;

            //indexInstance(x, false); //index properties?
        }
        else {

            if (that.indexingInstance(x)) {

                var existing = false;
                if (that.instance[x.id]) {
                    //existing, unindex first		
                    unindexInstance(x, true);
                    existing = true;
                }
				

                that.instance[x.id] = x;
                delete that.class[x.id];
                delete x._class;
                delete that.property[x.id];
                delete x._property;

                indexInstance(x, existing, true);
            }

			//add to DB
			
			if (!noSave) {
				queueSet(x, whenFinished);
				return;
			}
			
        }
		if (whenFinished)
			whenFinished(null, x);


        return that;
    };

    that.authors = function() {
        return _.unique(_.pluck(_.values(that.instance),'author'));
    };
    that.label = function(idOrObject, defaultValue) {
      var i;
      if (typeof idOrObject === "string") {
          i = that.instance[idOrObject];
      }
      else {
          i = idOrObject;
      }
      if (i && i.name) {
          var n = i.name.trim();
          if (n.length > 0)
            return i.name;
      }

      if (defaultValue)
        return defaultValue;

      return idOrObject;
    };

    that.indexingInstance = function (x) {
        return (tagInclude === true) || (objHasTag(x, tagInclude));
    };

    function indexInstance(x, keepGraphNode, isInstance) {
        if (isInstance) {

            var tags = that.getTags(x);
            for (var i = 0; i < tags.length; i++) {
                var t = tags[i];
                if (!that.tagged[t])
                    that.tagged[t] = {};
                that.tagged[t][x.id] = x;
            }

            x.reply = {};

            //replies to this object: search known objects with replyTo
            for (var k in that.reply) {
                var v = that.reply[k];
                if (v.replyTo.indexOf(x.id) !== -1)
                    x.reply[k] = v;
            }

            //this object's replies to other object
            if (x.replyTo) {
                that.reply[x.id] = x;
                for (var i = 0; i < x.replyTo.length; i++) {
                    var t = x.replyTo[i];
                    var T = that.instance[t];
                    if (T) {
                        T.reply[x.id] = x;
                    }
                    else {
                        //console.error(x, 'orphan reply object to', t);
                    }
                }
            }
        }

        //'subject' handling, creates .inout edges for each object tag from the object's subject to the values of those object properties
        if (x.subject) {
            //if (x.subject && that.instance[x.subject] && (that.instance[x.subject].author === x.author)) {
            if (x.subject === x.author) {
                if (x.inout === undefined)
                    x.inout = { };

                if (x.inout[x.subject]===undefined)
                    x.inout[x.subject] = { };

                if (x.value) {
                     for (var j = 0; j < x.value.length; j++) {
                         var vi = x.value[j];
                         var vid = vi.id;
 
						 if (graphEdge.indexOf(vid)!==-1) {
                             var target = vi.value; 
                             x.inout[x.subject][target] = vid;
                         }
                     }                
 				}
            }
            else {
               console.log('Error validating object making subject claim', x);
            }
        }

        //TODO index author, replyTo

        if (!keepGraphNode) {
            that.dgraph._inEdges[x.id] = {};
            that.dgraph._outEdges[x.id] = {};
            that.ugraph._incidentEdges[x.id] = {};
            //that.dgraph.addNode(x.id, x);
            //that.ugraph.addNode(x.id, x);
        }

        {
            var inouts = x.inout || {};

            if (that.dgraphInOut[x.id])
                _.each(that.dgraphInOut[x.id], function(v, k) {
                    var source = v[0];
                    var target = v[1];
                    if (inouts[source])
                        if (inouts[source][target])
                            return;
                    that.dgraph.delEdge(k);
                });

            delete that.dgraphInOut[x.id];

            _.each(inouts, function(sources, source) {
                _.each(sources, function(v, target) {
                    var edgeID = '*' + x.id + '*' + source + '*' + target;

                    if (that.dgraph.hasEdge(edgeID)) {
                        that.dgraph.edge(edgeID, v);
                    }
                    else {
                        if (!that.dgraph.hasNode(source)) {
                            that.add({id: source}); //placeholder object
                            that.dgraph._outEdges[source] = { };
                        }
                        if (!that.dgraph.hasNode(target)) {
                            that.add({id: target}); //placeholder object
                            that.dgraph._inEdges[target] = { };
                        }

                        that.dgraph.addEdge(edgeID, source, target, v);

                    }
                    if (that.dgraphInOut[x.id] === undefined)
                        that.dgraphInOut[x.id] = {};

                    that.dgraphInOut[x.id][edgeID] = [source, target];

                });
            });
        }
        {
            var outs = x.out || {};
            if (that.dgraph.hasNode(x.id)) {
                var existingOutEdges = that.dgraph.outEdges(x.id);

                //remove non-existing edges
                for (var i = 0; i < existingOutEdges.length; i++) {
                    var E = existingOutEdges[i];
                    if (E[0] === '~')
                        continue; //out edge, skip
                    if (E[0] === '*')
                        continue; //declared by another node, skip
                    var source = that.dgraph.source(E);
                    var target = that.dgraph.target(E);
                    if (source === x.id)
                        if (outs[target] === undefined)
                            that.dgraph.delEdge(E);
                }
            }

            //add existing edges
            _.each(outs, function(v, k) {
                var edgeID = '|' + x.id + '|' + k;
                if (that.dgraph.hasEdge(edgeID)) {
                    that.dgraph.edge(edgeID, v);
                }
                else {
                    if (!that.dgraph.hasNode(k)) {
                        that.add({id: k}); //placeholder object
                    }
                    that.dgraph.addEdge(edgeID, x.id, k, v);
                }
            });
        }

        {
            var ins = x.in || {};
            if (that.dgraph.hasNode(x.id)) {

                var existingInEdges = that.dgraph.inEdges(x.id);

                //remove non-existing edges
                for (var i = 0; i < existingInEdges.length; i++) {
                    var E = existingInEdges[i];
                    if (E[0] === '|')
                        continue; //out edge, skip
                    if (E[0] === '*')
                        continue; //declared by another node, skip
                    var source = that.dgraph.source(E);
                    var target = that.dgraph.target(E);
                    if (target === x.id)
                        if (ins[source] === undefined) {
                            that.dgraph.delEdge(E);
                        }
                }
            }

            //add existing edges
            _.each(ins, function(v, k) {
                var edgeID = '~' + k + '~' + x.id;
                if (that.dgraph.hasEdge(edgeID)) {
                    that.dgraph.edge(edgeID, v);
                }
                else {
                    if (!that.dgraph.hasNode(k)) {
                        that.add({id: k}); //placeholder object
                    }
                    that.dgraph.addEdge(edgeID, k, x.id, v);
                }
            });
        }

        {
            var withs = x.with || {};
            if (that.ugraph.hasNode(x.id)) {

                var existingEdges = that.ugraph.incidentEdges(x.id);

                //remove non-existing edges
                for (var i = 0; i < existingEdges.length; i++) {
                    var E = existingEdges[i];
                    var nodes = that.ugraph.incidentNodes(E);
                    var otherNode = (nodes[0] === x.id) ? nodes[1] : nodes[0];
                    var value = that.ugraph.edge(E);
                    if (withs[otherNode] === undefined) {
                        delete value[x.id];
                        if (_.keys(value).length === 0)
                            that.ugraph.delEdge(E);
                        else
                            that.ugraph.edge(E, value);
                    }
                }
            }

            //add existing edges
            _.each(withs, function(v, k) {
                var aid = k;
                var bid = x.id;
                //sort so that the first component is always less than the second
                var edgeID = (aid < bid) ? (aid + '`' + bid) : (bid + '`' + aid);

                if (that.ugraph.hasEdge(edgeID)) {
                    var value = that.ugraph.edge(edgeID);
                    value[x.id] = v;
                    that.ugraph.edge(edgeID, value);
                }
                else {
                    if (!that.ugraph.hasNode(k)) {
                        that.add({id: k}); //placeholder object
                    }
                    var V = {};
                    V[x.id] = v;
                    that.ugraph.addEdge(edgeID, x.id, k, V);
                }
            });
        }

    }

    function unindexInstance(x, keepGraphNode) {

		if (!keepGraphNode) {

            try {
                var dedges = that.dgraph.incidentEdges(x.id);
                for (var i = 0; i < dedges.length; i++)
                    that.dgraph.delEdge(dedges[i]);
            }
            catch (e) {
                console.error('unable to remove incident directed edges of:', x.id);
                console.log(e, e.stack);
            }

            try {
                var uedges = that.ugraph.incidentEdges(x.id);
                for (var i = 0; i < uedges.length; i++)
                    that.ugraph.delEdge(uedges[i]);
            }
            catch (e) {
                console.error('unable to remove incident undirected edges of:', x.id);
                console.log(e, e.stack);
            }


            delete that.dgraph._inEdges[x.id];
            delete that.dgraph._outEdges[x.id];
            delete that.ugraph._incidentEdges[x.id];
            //that.dgraph.delNode(x.id);
            //that.ugraph.delNode(x.id);

            if (x.inout) {
                _.each(that.dgraphInOut[x.id], function(v, k) {
                    that.dgraph.delEdge(k);
                });
                delete that.dgraphInOut[x.id];
            }
        }

        {
            if (x.replyTo) {
                for (var i = 0; i < x.replyTo.length; i++) {
                    var t = x.replyTo[i];
                    var T = that.instance[t];
                    if (T) {
                        delete T.reply[x.id];
                    }
                }
            }
            delete x.reply;
            delete that.reply[x.id];

            var tags = that.getTags(x);
            for (var i = 0; i < tags.length; i++) {
                var t = tags[i];
                if (that.tagged[t])
                    delete that.tagged[t][x.id];
            }


        }

    }
    that.getReplyRoots = function(r) {
        //trace up the reply chain until an object with no replyTo
        var t = {};

        var R = that.instance[r];
        if (!R)
            return [];

        var rr = R.replyTo;
        if (!rr)
            return [r];
        if (!Array.isArray(rr))
            rr = [rr];

        rr.forEach(function(s) {
            var sr = that.getReplyRoots(s);
            sr.forEach(function(srr) {
                t[srr] = true;
            });
        });

        return _.keys(t);
    };

    that.getReplies = function(x) {
        return x.reply || [];
    };

    that.getAllReplies = function(objects) {
        var r = {};

        function addReplies(ii) {

            ii.forEach(function(i) {
                if (typeof i === "string")
                    i = that.instance[i];

                if (!i)
                    return;

                if (r[i.id])
                    return;

                r[i.id] = r;

                if (i.reply)
                    addReplies(_.keys(i.reply));
            });
        }

        addReplies(objects);
        return _.values(r);
    };

	that.getTagStrength = function(x, normalize) {
		var tags = objTagStrength(x, normalize, false);
		
		//Infer additional tags
		
		//1. from object values
		if (x.value) {
			for (var i = 0; i < x.value.length; i++) {
				var vv = x.value[i];
				if (vv.value) {
					var V = vv.value;
					if (typeof V === 'string') {
						if ((that.class[V]) || (that.instance[V])) {
							tags[V] = 1.0;
						}
					}
				}
			}
		}
		
		//2. include subject
		if (x.subject) {
			tags[x.subject] = 1.0;;
		}
		
		return tags;
	};

	//getTags: return a list of an objects tags, according to as much as can be inferred from this ontology	
	that.getTags = function(x) {
		return _.keys(that.getTagStrength(x));
	};
	
	
    //deprecated
    that.getSubTags = function(s) {
        if (typeof s === "string")
            s = this.class[s];
        return s.subclass;
    };

	
	that.getAllByTag = function(t, includeSubTags, callback) {
        if ((typeof t === "object") && !Array.isArray(t))
            t = [t.id];

		if (!Array.isArray(t))
            t = [t];

        if (includeSubTags) {
            t = _.union(t, that.getSubTags(t));
        }

		that.db.getAllByTag(t, callback);
	};

    /**
     * DEPRECATED
     * t = a class ID,or an array of class ID's - returns a list of object id's
     * */
    that.getTagged = that.objectsWithTag = function(t, fullObject, includeSubTags) {



		//TODO use tag index
        //TODO support subtags recursively
        if ((typeof t === "object") && !Array.isArray(t))
            t = [t.id];
        if (!Array.isArray(t))
            t = [t];

        var r = {};

        if (includeSubTags) {
            t = _.union(t, that.getSubTags(t));
        }

        t.forEach(function(ti) {
            _.extend(r, _.object(_.keys(that.tagged[ti]), true));
        });

        r = _.keys(r);
        if (fullObject)
            return r.map(function(s) {
                return $N.instance[s];
            });
        else
            return r;
    };

    that.remove = function(x) {
        if (typeof x === "object") {
            x = x.id;
        }
        var existingObject = that.object[x];
        if (!existingObject)
            return false;

        if (that.indexingInstance(existingObject))
            unindexInstance(existingObject);

        if (that.class[x]) {
            delete that.class[x];
            that.serializedClasses = null;
        }
        if (that.property[x]) {
            delete that.property[x];
            that.serializedPropreties = null;
        }
        delete that.instance[x];

        delete that.object[x];

        return that;
    };

    that.getOntologySummary = function() {
        return {
            numObjects: _.keys(that.object).length,
            numClasses: _.keys(that.class).length,
            numClassRoots: _.keys(that.classRoot).length,
            numProperties: _.keys(that.property).length,
            numInstances: _.keys(that.instances).length,
        };
    };

    that.serializedPropreties = null; //cache
    that.propertySerialized = function() {
        if (that.serializedPropreties === null)
            that.serializedPropreties = JSON.stringify(_.map(that.property, function(p) {
                return objCompact(p);
            }));
        return that.serializedPropreties;
    };

    that.serializedClasses = null; //cache
    that.classSerialized = function() {
        if (that.serializedClasses === null)
            that.serializedClasses = JSON.stringify(_.map(that.class, function(c) {
                var d = objCompact(c);
                delete d.class;
                delete d.subclass;
                delete d.property;
                return d;
            }));
        return that.serializedClasses;
    };
    that.serializedJSON = null; //cache
    that.ontologyJSON = function() {
		if (that.serializedJSON === null) {
			var cl = that.classSerialized();
			var pr = that.propertySerialized();
			that.serializedJSON = "{\"class\":" + cl + ",\"property\":"+pr+"}";
		}
		return that.serializedJSON;
	};

    //graphlib.alg.floydWarshall
    //ex: JSON.stringify( $N.getGraphDistances("Trust"), null, 4 )
    //warning: always use the same node filter because the cache will not automatically invalidate if you change it
    that.getGraphDistances = function(edgeFilter, nodeFilter) {
        if (typeof edgeFilter === "string") {
            var existing = that._graphDistance[edgeFilter];
            if (existing)
                return existing;
        }

        var g = that.dgraph;

        var results = {};

        var nodes = nodeFilter ?
                _.pluck(_.filter(_.values(that.instance), nodeFilter), 'id') :
                _.keys(that.instance);

        var weightFunc = weightFunc || function() {
            return 1;
        };
        var incidentFunc =  function(u) {
                                if (typeof edgeFilter === "string") {
                                    return _.filter(g.outEdges(u), function(e) {
                                        var E = that.dgraph.edge(e);
                                        return (E === edgeFilter);
                                    });
                                }
                                else if (edgeFilter)
                                    return _.filter(g.outEdges(u), edgeFilter);
                                else
                                    return g.outEdges(u);
                            };


        nodes.forEach(function(u) {
            results[u] = {};
            results[u][u] = {distance: 0};
            nodes.forEach(function(v) {
                if (u !== v) {
                    results[u][v] = {distance: Number.POSITIVE_INFINITY};
                }
            });
            incidentFunc(u).forEach(function(e) {
                var incidentNodes = g.incidentNodes(e),
                        v = incidentNodes[0] !== u ? incidentNodes[0] : incidentNodes[1],
                        d = weightFunc(e);
                if (results[u][v])
                    if (d < results[u][v].distance) {
                        results[u][v] = {distance: d, predecessor: u};
                    }
            });
        });

        nodes.forEach(function(k) {
            var rowK = results[k];
            nodes.forEach(function(i) {
                var rowI = results[i];
                nodes.forEach(function(j) {
                    var ik = rowI[k];
                    var kj = rowK[j];
                    var ij = rowI[j];
                    var altDistance = ik.distance + kj.distance;
                    if (altDistance < ij.distance) {
                        ij.distance = altDistance;
                        ij.predecessor = kj.predecessor;
                    }
                });
            });
        });

        nodes.forEach(function(k) {
            var rowK = results[k];
            nodes.forEach(function(i) {
                if (results[k][i].distance===Infinity)
                    delete results[k][i];
                if (k === i)
                    delete results[k][i];
            });
            if (_.keys(results[k]).length === 0)
                delete results[k];
        });

        if (typeof edgeFilter === "string") {
            if (that.graphDistanceTag && that.graphDistanceTag.indexOf(edgeFilter)!==-1)
                that._graphDistance[edgeFilter] = results;
        }

        return results;
    };

    that.getGraphDistance = function(edgeFilter, nodeFilter, fromNode, toNode) {
        if (fromNode === toNode)
            return 0;

        var d = that.getGraphDistances(edgeFilter, nodeFilter);
        if (d[fromNode])
            if (d[fromNode][toNode])
                return d[fromNode][toNode].distance;

        return Infinity;
    };

    that.userNodeFilter = function(n) { return n.author === n.id; };

    that.getTrust = function(a, b) {
        var d = that.getGraphDistance("trust", that.userNodeFilter, a, b);
        if (d === Infinity) return 0;
        else if (d === 0) return Infinity;
        else return 1.0/d;
    };

    //.searchOntology(query)
    //.getGraph(propertyList,options)
    //extracts a graph via the object values of certain types; useful for computing trust and other networks

    return that;
};
exports.Ontology = Ontology;
















function newAttentionMap(memoryMomentum, maxObjects, adjacency, spreadRate) {
    var that = {
        values: {},
        totals: {},
        save: function(sorted) { //provides a sorted, normalized snapshot
            var k = [];
            for (var i in that.values) {
                k.push([i, that.values[i], that.totals[i]]);
            }

            if (sorted) {
                k = k.sort(function(a, b) {
                    return b[1] - a[1];
                });
            }

            return k;
        },
        remove: function(objectID) {
            delete that.values[objectID];
            delete that.totals[objectID];
        },
        //set

        //multiply

        add: function(i, deltaAttention) {

            if (!that.values[i]) {
                that.values[i] = 0;
                that.totals[i] = 0;
            }

            that.values[i] += deltaAttention;
        },
        update: function() {


            //FORGET: decrease and remove lowest
            for (var k in that.values) {
                that.totals[k] += that.values[k];
                that.values[k] *= memoryMomentum;
                /*
                 if (that.values[k] < minAttention) {
                 that.remove(k);
                 }*/
            }

            if ((spreadRate) && (adjacency)) {
                //for every node
                for (var k in that.values) {
                    var vv = that.values[k];

                    var incident = adjacency.incidence(k);

                    //for every incident node

                    var nodesToIncrease = [];
                    for (var i = 0; i < incident.length; i++) {
                        var ii = incident[i];
                        var iv = that.values[ii];

                        if (ii == k)
                            continue;

                        if (iv < vv)
                            nodesToIncrease.push(ii);
                    }

                    if (nodesToIncrease.length > 0) {
                        var totalSpreadAmount = vv * spreadRate;
                        that.add(k, -totalSpreadAmount);

                        var spreadAmount = totalSpreadAmount / parseFloat(nodesToIncrease.length);

                        //  if the value is less than the original node,
                        //  add a fraction of the spread rate
                        for (var i = 0; i < nodesToIncrease.length; i++) {
                            that.add(nodesToIncrease[i], spreadAmount);
                        }
                    }

                }
            }
        }
    };


    return that;
}
var newAttentionMap = newAttentionMap;


var createRingBuffer = function(length) {

    var pointer = 0,
            buffer = [];

    var that = {
        get: function(key) {
            return buffer[key];
        },
        push: function(item) {
            buffer[pointer] = item;
            pointer = (length + pointer + 1) % length;
        }
    };

    that.pointer = pointer;
    that.buffer = buffer;

    return that;

};

exports.createRingBuffer = createRingBuffer;

function RecurringProcess(interval, runnable) {
    var that = {};
    that.start = function() {
        that.interval = setInterval(function() {
            runnable();
        }, interval);
        runnable(); //run first
    };
    that.stop = function() {
        clearInterval(that.interval);
    };
    return that;
}
exports.RecurringProcess = RecurringProcess;

function OutputBuffer(interval, write /* limit */) {
    var that = RecurringProcess(interval, function() {
        var o = that.buffer.pop();
        if (o) {
            write(o);
        }
    });
    that.buffer = [];
    that.write = write;
    that.push = function(o) {
        that.buffer.push(o);
    };
    /*that.pushAll = function(a) {
     for (i = 0; i < a.length; i++)
     push(a[i]);
     };*/

    return that;
}
exports.OutputBuffer = OutputBuffer;


function isNumberValueIndefinite(v) {
    return isNaN(parseInt(v));
}

var _IND = 'indefinite';
var _DEF = 'definite';

function objMode(x) {
    if (objHasTag(x, 'Imaginary'))
        return _IND;

    if (x.value) {
        for (var i = 0; i < x.value.length; i++) {
            var v = x.value[i];
            var vi = v.id;
            var t = propGetType(vi);

            if (t === null) {
            } else if ((t == 'integer') || (t == 'real')) {
                if (isNumberValueIndefinite(v.value))
                    return _IND;
            } else {
                console.log('objMade', 'Uncompared type', t);
            }
        }
    }

    return _DEF;
}
exports.objMode = objMode;

function objCompare(a, b) {

    var c = {
        aMode: objMode(a),
        bMode: objMode(b),
        tagDotProduct: objTagRelevance(a, b),
        /*commonTags: [ ],
         aSpecificTags: [ ],
         bSpecificTags: [ ],
         propertyComparisons: [ ],
         compositeMatch: 0*/
    };
    var at = objTags(a);
    var bt = objTags(b);

    c.commonTags = _.intersection(at, bt);
    c.aSpecificTags = _.difference(at, c.commonTags);
    c.bSpecificTags = _.difference(bt, c.commonTags);

    var ap = objProperties(a);
    var bp = objProperties(b);
    c.commonProperties = _.intersection(ap, bp);
    c.aSpecificProperties = _.difference(ap, c.commonProperties);
    c.bSpecificProperties = _.difference(bp, c.commonProperties);

    function matchDefiniteIndefinite(primitive, defValue, indefValue) {
        if ((primitive == 'integer') || (primitive == 'real')) {
            var dn = parseFloat(defValue);

            if (indefValue[0] == '<') {
                var n = parseFloat(indefValue.substring(1));
                return dn < n ? 1.0 : 0.0;
            } else if (indefValue[0] == '>') {
                if (indefValue.indexOf('<') != -1) {
                    //TODO this operator is weird, use a more natural one like: a..b (this will involve not using isNaN in other functions to determine if a number)
                    var mm = indefValue.substring(1).split('<');
                    return (dn >= mm[0]) && (dn <= mm[1]) ? 1.0 : 0.0;
                } else {
                    var n = parseFloat(indefValue.substring(1));
                    return dn > n ? 1.0 : 0.0;
                }
            }
            /*else if (indefValue.indexOf('..')!=-1) {
             var mm = indefValue.split('..');
             return (dn >= mm[0]) && (dn <= mm[1]) ? 1.0 : 0.0;
             }*/
            else if ((indefValue === '') || (isNaN(indefValue)))
                return 1.0;
            else
                return dn == parseFloat(indefValue) ? 1.0 : 0.0;
        }
        return 0;
    }

    function computeDefiniteIndefinite(r, d, i) {
        r.propertyMatch = {};

        var numProp = r.commonProperties.length;
        if (numProp > 0) {
            var totalMatch = 0;
            for (var x = 0; x < numProp; x++) {
                var rp = r.commonProperties[x];

                var bestMatch = 0;
                var dv = objValues(d, rp);
                var iv = objValues(i, rp);
                var prim = propGetType(rp);
                for (var xdv = 0; xdv < dv.length; xdv++) {
                    for (var xiv = 0; xiv < iv.length; xiv++) {
                        var match = matchDefiniteIndefinite(prim, dv[xdv], iv[xiv]);
                        if (match > bestMatch)
                            bestMatch = match;
                    }
                }

                r.propertyMatch[rp] = bestMatch;
                totalMatch += bestMatch;
            }
            r.compositeMatch = totalMatch / numProp;
        }
    }

    if ((c.aMode == _IND) && (c.bMode == _DEF)) {
        computeDefiniteIndefinite(c, b, a);
    }
    if ((c.bMode == _IND) && (c.aMode == _DEF)) {
        computeDefiniteIndefinite(c, a, b);
    }

    return c;
}
exports.objCompare = objCompare;

var compactObjectFields = [['removed', 'r'],
    ['id', 'i'],
    ['subject', 'S'],
    ['scope', 's'],
    ['value', 'v'],
    ['extend', 'e'],
    ['author', 'a'],
    ['name', 'n'],
    ['description', 'd'],
    ['replyTo', 'R'],
    ['expiresAt', 'x'],
    ['focus', 'f']];
function renameFields(o, f, swap) {
    var a = swap ? 1 : 0;
    var b = swap ? 0 : 1;
    for (var i = f.length - 1; i >= 0; i--) {
        var from = f[i][a], to = f[i][b];
        if (o[from] !== undefined) {
            o[to] = o[from];
            delete o[from];
        }
    }
}
function renameObjectFields(o, m) {
    renameFields(o, compactObjectFields, m);
}

/* returns a cloned version of the object, compacted */
function objCompact(o) {
	if (o.i!==undefined && o.id===undefined) {
		console.error(o, ' already compacted');
		console.log(new Error().stack);
	}

    if (o.modifiedAt)
        if (o.modifiedAt === o.createdAt)
            delete o.modifiedAt;

    //console.log(o.name);
    //console.log(  o);

    var y = _.clone(o);

    if (y.createdAt) {
        if (!y.modifiedAt) {
            y.t = y.createdAt;
        }
        else if (y.createdAt !== y.modifiedAt) {
            y.t = [y.createdAt, y.modifiedAt - y.createdAt];
        }
    }
    delete y.modifiedAt;
    delete y.createdAt;

    if ((Array.isArray(y.extend)) && (y.extend.length === 1))
        y.extend = y.extend[0];

    delete y.reply;
    if (y.replyTo && Array.isArray(y.replyTo) && y.replyTo.length === 0)
        delete y.replyTo;


    if (y.removed) {
        y.removed = y.id;
        delete y.id;
    }
    if (y.subject !== undefined)
        if (y.subject === y.author)
            y.subject = '';


    var k = _.keys(y);
    for (var i = 0; i < k.length; i++) {
        var K = k[i];
        if ((K[0] === '_') || (K == 'tagList')) {
            delete y[K];
            continue;
        }
        var V = y[K];
        if (typeof V === 'function') {
            delete y[K];
        }

    }

    if (o.value) {

        var newValues = [];

        for (var i = 0; i < o.value.length; i++) {
            var v = o.value[i];
            if (!v)
                return;

            //console.log(i + '//' + v);
            /*if (((v.value) && (v.value.lat)) || (Array.isArray(v))) {
             newValues.push(v);
             } else*/ {
                var ia = v.id;
                var va = v.value || null;
                var s = (v.strength!==undefined) ? v.strength : 1.0;

                if (va) {

                    if (v.id === 'spacepoint')
                        if (va.planet === 'Earth')
                            delete va.planet; //assume Earth

                    newValues.push([ia, s, va]);
                }
                else if ((!va) && (s !== 1.0))
                    newValues.push([ia, s]);
                else if (ia)
                    newValues.push(ia);
                else {
                    /*var vv = _.clone(v);
                     renameField(vv, 'id', 'i');
                     renameField(vv, 'value', 'v');
                     renameField(vv, 'strength', '$');*/
                    newValues.push(v);
                }
            }
        }


        y.value = newValues;
        if (y.value.length === 0) {
            delete y.value;
        }
    }
    renameObjectFields(y, false);

    return y;
}
exports.objCompact = objCompact;


function objExpandAll(a) {
    a.forEach(objExpand);
    return a;
}
exports.objExpandAll = objExpandAll;

/** expands an object in-place, and returns it */
function objExpand(o) {
	if (o.id!==undefined && o.i===undefined) {
		console.error(o, ' already expanded');
		console.log(new Error().stack);
	}

    renameObjectFields(o, true);

    if (o.removed) {
        if (typeof o.removed !== 'boolean') {
            o.id = o.removed;
            o.removed = true;
        }
    }

    if (o.t) {
        if (Array.isArray(o.t) && (o.t.length === 2)) {
            o.createdAt = o.t[0];
            o.modifiedAt = o.t[1] + o.createdAt;
        }
        else {
            o.createdAt = o.t;
        }
        delete o.t;
    }
    if (o.modifiedAt === undefined)
        delete o.modifiedAt;
    if (o.subject !== undefined) {
        if (o.subject === '') {
            o.subject = o.author;
        }
    }

    if (!o.value)
        return o;

    var newValues = [];
    //for (var i = 0; i < o.value.length; i++) {
    //    var v = o.value[i];
    for (var i = 0; i < o.value.length; i++) {
        var v = o.value[i];
        if (Array.isArray(v)) {
            var r = {
                id: v[0]
            };
            if (v.length > 1)
                r.strength = v[1];
            if (v.length > 2)
                r.value = v[2];
            newValues.push(r);
        } else if (typeof v === 'object') {
            /*renameField(v, 'i', 'id');
             renameField(v, 'v', 'value');
             renameField(v, '$', 'strength');*/
            newValues.push(v);
        } else if (typeof v === 'string') {
            newValues.push({
                id: v
            });
        } else {
            console.error('unrecognized tagvalue type', v);
        }
    }
    o.value = newValues;
    return o;
}
exports.objExpand = objExpand;

//returns full-text representation of an objectID
//TODO omit HTML tags
//TODO include HTML/Markdown fields
function objText(x) {
    return (objName(x) + ' ' + objDescription(x)).trim();
}
exports.objText = objText;

function wordSimilarity(a, b) {
    var num = 0,
            denA = 0,
            denB = 0;
    var count = 0;
    _.each(b, function(v, k) {
        denB += v;
    });
    _.each(a, function(v, k) {
        denA += v;
        if (b[k]) {
            num += (1.0 + a[k]) * (1.0 + b[k]);
            count++;
        }
    });
    if ((denA > 0) && (denB > 0)) {
        //return count * num / (Math.max(denA, denB));
        //console.log(a, b, num);
        return num;
    }
    return 0;
}

exports.wordSimilarity = wordSimilarity;

function goals(time, goalList) {
    /*var m = objNew();
     objName(m, 'Synchronous @ 1min');
     m = objAddTag(m, 'Goal');
     m = objAddValue(m, 'synchronous', { every: 60000, delay: 0 } );
     goalList.push(m);*/

    return _.map(goalList, function(g) {
        var x = _.clone(g);
        x.strength = 0.1; // Math.random();

        var s = objFirstValue(x, 'synchronous');
        if (s) {
            x.strength = ((time - s.delay) % s.every) / s.every;
        }

        return x;
    });
    //	return [ { name: 'Be patient', strength: 0.75 },  { name: 'Breathe', strength: 0.3 },  { name: 'Find Shelter', strength: 0.2 } ];
}
exports.goals = goals;



function subtags(tags, s) {
    //this is suboptimal (use an index), & doesn't yet do multilevel inference
    return _.select(_.keys(tags), function(tt) {
        var t = tags[tt];
        if (!t.tag)
            return false;
        else {
            return (_.contains(t.tag, s));
        }
    });
}
exports.subtags = subtags;

function hashpassword(p) {
    return MD5(p + '$4lT_');
}
exports.hashpassword = hashpassword;

//Chris Coyier's MD5 Library
//http://css-tricks.com/snippets/javascript/javascript-md5/
var MD5 = function(string) {

    function RotateLeft(lValue, iShiftBits) {
        return (lValue << iShiftBits) | (lValue >>> (32 - iShiftBits));
    }

    function AddUnsigned(lX, lY) {
        var lX4, lY4, lX8, lY8, lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF) + (lY & 0x3FFFFFFF);
        if (lX4 & lY4) {
            return (lResult ^ 0x80000000 ^ lX8 ^ lY8);
        }
        if (lX4 | lY4) {
            if (lResult & 0x40000000) {
                return (lResult ^ 0xC0000000 ^ lX8 ^ lY8);
            } else {
                return (lResult ^ 0x40000000 ^ lX8 ^ lY8);
            }
        } else {
            return (lResult ^ lX8 ^ lY8);
        }
    }

    function F(x, y, z) {
        return (x & y) | ((~x) & z);
    }

    function G(x, y, z) {
        return (x & z) | (y & (~z));
    }

    function H(x, y, z) {
        return (x ^ y ^ z);
    }

    function I(x, y, z) {
        return (y ^ (x | (~z)));
    }

    function FF(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }    

    function GG(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }

    function HH(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }
	
    function II(a, b, c, d, x, s, ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
    }

    function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1 = lMessageLength + 8;
        var lNumberOfWords_temp2 = (lNumberOfWords_temp1 - (lNumberOfWords_temp1 % 64)) / 64;
        var lNumberOfWords = (lNumberOfWords_temp2 + 1) * 16;
        var lWordArray = Array(lNumberOfWords - 1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while (lByteCount < lMessageLength) {
            lWordCount = (lByteCount - (lByteCount % 4)) / 4;
            lBytePosition = (lByteCount % 4) * 8;
            lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount) << lBytePosition));
            lByteCount++;
        }
        lWordCount = (lByteCount - (lByteCount % 4)) / 4;
        lBytePosition = (lByteCount % 4) * 8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80 << lBytePosition);
        lWordArray[lNumberOfWords - 2] = lMessageLength << 3;
        lWordArray[lNumberOfWords - 1] = lMessageLength >>> 29;
        return lWordArray;
    }

    function WordToHex(lValue) {
        var WordToHexValue = "",
                WordToHexValue_temp = "",
                lByte, lCount;
        for (lCount = 0; lCount <= 3; lCount++) {
            lByte = (lValue >>> (lCount * 8)) & 255;
            WordToHexValue_temp = "0" + lByte.toString(16);
            WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length - 2, 2);
        }
        return WordToHexValue;
    }

    function Utf8Encode(string) {
        string = string.replace(/\r\n/g, "\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

            var c = string.charCodeAt(n);

            if (c < 128) {
                utftext += String.fromCharCode(c);
            } else if ((c > 127) && (c < 2048)) {
                utftext += String.fromCharCode((c >> 6) | 192);
                utftext += String.fromCharCode((c & 63) | 128);
            } else {
                utftext += String.fromCharCode((c >> 12) | 224);
                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                utftext += String.fromCharCode((c & 63) | 128);
            }

        }

        return utftext;
    }

    var x = Array();
    var k, AA, BB, CC, DD, a, b, c, d;
    var S11 = 7,
            S12 = 12,
            S13 = 17,
            S14 = 22;
    var S21 = 5,
            S22 = 9,
            S23 = 14,
            S24 = 20;
    var S31 = 4,
            S32 = 11,
            S33 = 16,
            S34 = 23;
    var S41 = 6,
            S42 = 10,
            S43 = 15,
            S44 = 21;

    string = Utf8Encode(string);

    x = ConvertToWordArray(string);

    a = 0x67452301;
    b = 0xEFCDAB89;
    c = 0x98BADCFE;
    d = 0x10325476;

    for (k = 0; k < x.length; k += 16) {
        AA = a;
        BB = b;
        CC = c;
        DD = d;
        a = FF(a, b, c, d, x[k + 0], S11, 0xD76AA478);
        d = FF(d, a, b, c, x[k + 1], S12, 0xE8C7B756);
        c = FF(c, d, a, b, x[k + 2], S13, 0x242070DB);
        b = FF(b, c, d, a, x[k + 3], S14, 0xC1BDCEEE);
        a = FF(a, b, c, d, x[k + 4], S11, 0xF57C0FAF);
        d = FF(d, a, b, c, x[k + 5], S12, 0x4787C62A);
        c = FF(c, d, a, b, x[k + 6], S13, 0xA8304613);
        b = FF(b, c, d, a, x[k + 7], S14, 0xFD469501);
        a = FF(a, b, c, d, x[k + 8], S11, 0x698098D8);
        d = FF(d, a, b, c, x[k + 9], S12, 0x8B44F7AF);
        c = FF(c, d, a, b, x[k + 10], S13, 0xFFFF5BB1);
        b = FF(b, c, d, a, x[k + 11], S14, 0x895CD7BE);
        a = FF(a, b, c, d, x[k + 12], S11, 0x6B901122);
        d = FF(d, a, b, c, x[k + 13], S12, 0xFD987193);
        c = FF(c, d, a, b, x[k + 14], S13, 0xA679438E);
        b = FF(b, c, d, a, x[k + 15], S14, 0x49B40821);
        a = GG(a, b, c, d, x[k + 1], S21, 0xF61E2562);
        d = GG(d, a, b, c, x[k + 6], S22, 0xC040B340);
        c = GG(c, d, a, b, x[k + 11], S23, 0x265E5A51);
        b = GG(b, c, d, a, x[k + 0], S24, 0xE9B6C7AA);
        a = GG(a, b, c, d, x[k + 5], S21, 0xD62F105D);
        d = GG(d, a, b, c, x[k + 10], S22, 0x2441453);
        c = GG(c, d, a, b, x[k + 15], S23, 0xD8A1E681);
        b = GG(b, c, d, a, x[k + 4], S24, 0xE7D3FBC8);
        a = GG(a, b, c, d, x[k + 9], S21, 0x21E1CDE6);
        d = GG(d, a, b, c, x[k + 14], S22, 0xC33707D6);
        c = GG(c, d, a, b, x[k + 3], S23, 0xF4D50D87);
        b = GG(b, c, d, a, x[k + 8], S24, 0x455A14ED);
        a = GG(a, b, c, d, x[k + 13], S21, 0xA9E3E905);
        d = GG(d, a, b, c, x[k + 2], S22, 0xFCEFA3F8);
        c = GG(c, d, a, b, x[k + 7], S23, 0x676F02D9);
        b = GG(b, c, d, a, x[k + 12], S24, 0x8D2A4C8A);
        a = HH(a, b, c, d, x[k + 5], S31, 0xFFFA3942);
        d = HH(d, a, b, c, x[k + 8], S32, 0x8771F681);
        c = HH(c, d, a, b, x[k + 11], S33, 0x6D9D6122);
        b = HH(b, c, d, a, x[k + 14], S34, 0xFDE5380C);
        a = HH(a, b, c, d, x[k + 1], S31, 0xA4BEEA44);
        d = HH(d, a, b, c, x[k + 4], S32, 0x4BDECFA9);
        c = HH(c, d, a, b, x[k + 7], S33, 0xF6BB4B60);
        b = HH(b, c, d, a, x[k + 10], S34, 0xBEBFBC70);
        a = HH(a, b, c, d, x[k + 13], S31, 0x289B7EC6);
        d = HH(d, a, b, c, x[k + 0], S32, 0xEAA127FA);
        c = HH(c, d, a, b, x[k + 3], S33, 0xD4EF3085);
        b = HH(b, c, d, a, x[k + 6], S34, 0x4881D05);
        a = HH(a, b, c, d, x[k + 9], S31, 0xD9D4D039);
        d = HH(d, a, b, c, x[k + 12], S32, 0xE6DB99E5);
        c = HH(c, d, a, b, x[k + 15], S33, 0x1FA27CF8);
        b = HH(b, c, d, a, x[k + 2], S34, 0xC4AC5665);
        a = II(a, b, c, d, x[k + 0], S41, 0xF4292244);
        d = II(d, a, b, c, x[k + 7], S42, 0x432AFF97);
        c = II(c, d, a, b, x[k + 14], S43, 0xAB9423A7);
        b = II(b, c, d, a, x[k + 5], S44, 0xFC93A039);
        a = II(a, b, c, d, x[k + 12], S41, 0x655B59C3);
        d = II(d, a, b, c, x[k + 3], S42, 0x8F0CCC92);
        c = II(c, d, a, b, x[k + 10], S43, 0xFFEFF47D);
        b = II(b, c, d, a, x[k + 1], S44, 0x85845DD1);
        a = II(a, b, c, d, x[k + 8], S41, 0x6FA87E4F);
        d = II(d, a, b, c, x[k + 15], S42, 0xFE2CE6E0);
        c = II(c, d, a, b, x[k + 6], S43, 0xA3014314);
        b = II(b, c, d, a, x[k + 13], S44, 0x4E0811A1);
        a = II(a, b, c, d, x[k + 4], S41, 0xF7537E82);
        d = II(d, a, b, c, x[k + 11], S42, 0xBD3AF235);
        c = II(c, d, a, b, x[k + 2], S43, 0x2AD7D2BB);
        b = II(b, c, d, a, x[k + 9], S44, 0xEB86D391);
        a = AddUnsigned(a, AA);
        b = AddUnsigned(b, BB);
        c = AddUnsigned(c, CC);
        d = AddUnsigned(d, DD);
    }

    var temp = WordToHex(a) + WordToHex(b) + WordToHex(c) + WordToHex(d);

    return temp.toLowerCase();
};

exports.MD5 = MD5;

