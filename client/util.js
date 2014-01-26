
if (typeof window != 'undefined')  {
    exports = { };  //functions used by both client and server
}
else {
    _ = require('underscore');    
}

function _n(x, places) {    
    if (!places) places = 2;
    if (x == undefined) return '0';
    if (!x.toFixed)
        return x;
    return x.toFixed(places);  
}  //formats numbers to string w/ 2 decimal places
exports._n = _n;
    



/** adds the objectInterface to an object */
function objectify(x) {
	//TODO build convenient & friendly object API here
	//TODO is more optimal to use .prototype. methods than _.extend ?

	var objectInterface = {

		setName: function(n) {
			objName(x, n);
			return x;
		},

		//.name is already used, so use n()
		n: function(n) { 
			if (!n) return x.name;
			objName(x, n);
			return x;				
		},

		addDescription: function(d) {
			objAddDescription(x, d);
			return x;
		},

		touch: function() {
			objTouch(x);
			return x;
		},

		add: function(k, v) {
			return objAddValue(x, k, v);
		},

		/*x.objSpacePoint = function(latitude, longitude) {
			return objSpacePointLatLng
		}*/

		//CLIENT-ONLY
		own: function() {
			if (self)
				x.author = self.id();
			return x;
		},

		addTag : function(t) {
			return objAddTag(x, t);
		},

		addTags : function( tagArray ) {
			for (var i = 0; i < tagArray.length; i++)
				x.addTag(tagArray[i]);
			return x;
		},

		hasTag : function(t) {
			return objHasTag(x, t);
		},

		tags : function() {
			return objTags(x);
		},

		earthPoint: function(lat, lon) {
			if (lat == undefined) {
				return objSpacePointLatLng(x);
			}
			return this.add('spacepoint', { 'lat': lat, 'lon': lon });
		},

		firstValue: function(id, defaultValue) {
			return objFirstValue(x, id, defaultValue);
		},

		getValues: function(id) {
			return objValues(x, id);
		}

	};

	return _.extend(x, objectInterface);
}
exports.objectify = objectify;

function objNew(id, name, initialTags) {
	if (!name)
		name = id;
    if (!id)
        id = uuid();
        
    var x = {
        'id': id,
        'createdAt': Date.now()
        //scope: 'public'
    };
    
    if (name)
        x.name = name;
        
	objectify(x);

	if (initialTags) {
		if (!Array.isArray(initialTags))
			initialTags = [ initialTags ];
		x.addTags( initialTags );
	}

    return x;
}
exports.objNew = objNew;

function timerange(start, end) {
	return { id: 'timerange', value: {  start: Date.parse(start), end: Date.parse(end) } };
}
exports.timerange = timerange;

function objAddTag(x, t, strength) {
    var v = { id: t };
    if (strength!=undefined)
        v.strength = strength;
    return objAddValue(x, v, undefined);    
}
exports.objAddTag = objAddTag;

/*
    objAddValue(x, { id: i, value: v } )
    objAddValue(x, i, v)
*/
function objAddValue(x, a, b, strength) {
    var v;
    if (b == undefined)
        v = a;
    else {
        v = { id: a, value: b };
        if (strength!=undefined)
            v.strength = strength;
    }
    
    if (!x.value)
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
    
    if (!newName) {
        return x.name || '';    
    }
    else {
        x.name = newName;
        return x;
    }
}
exports.objName = objName;

var primitiveRegEx = /^boolean|text|textarea|integer|real|url|object|spacepoint|timepoint|timerange|sketch$/;
function isPrimitive(t) {
	return primitiveRegEx.test(t);
}
exports.isPrimitive = isPrimitive;

function objAddDescription(x, desc) {
    return objAddValue(x, { id: 'textarea', value: desc } );    
}
exports.objAddDescription = objAddDescription;

function objRemoveDescription(x) {
    for (var i = 0; i < x.value.length; i++) {
        if (x.value[i].id == 'textarea')
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
	if (x === null) return null;
    return objFirstValue(x, 'timepoint', null) || objFirstValue(x, 'timerange', null) || x.when || x.modifiedAt || x.createdAt; 
}
exports.objWhen = objWhen;

function objDescription(x) {
    /* concatenates all 'description' tag values */
    var c = '';
    if (x.value) {
        for (var i = 0; i < x.value.length; i++) {
            var ii = x.value[i];
            if (ii.id == 'textarea') {
                c = c + ii.value + ' ';
            }
        }
    }
    return c.trim();
}
exports.objDescription = objDescription;

function objIncidentTags(olist, oneOfTags, userid) {
    var t = { };
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
                t[kk] = t[kk].concat( o.id );
            }
        }

    }
    return t;

}
exports.objIncidentTags= objIncidentTags;
                


function objTags(x, includePrimitives) {
  // objTags(x) -> array of tags involved (except those with strength==0)
  if (!x.value) return [];
  
  //HACK to handlle when values are null, which they shouldnt bve
  var newValues = [];
  for (var i = 0; i < x.value.length; i++) {
      var vv = x.value[i];
      if (vv) 
        if (vv.id) {
			if (vv.strength == 0)
				continue;

	        newValues.push(vv);
		}
  }
  if (includePrimitives)
	return _.pluck(newValues, 'id');
  else {
	return _.uniq( _.pluck(newValues, 'id').filter( function(t) { return !isPrimitive(t) } ) );
  }
}
exports.objTags = objTags;

function objProperties(x) {
  if (!x.value) return [];
  return _.uniq( _.pluck(x.value, 'id').filter( function(t) { 
      return (window.self.getProperty(t)!=null);
  } ) );
}
exports.objProperties = objProperties;


function objTagStrength(x, normalize, noProperties) {
  // objTags(x) -> array of tags involved
  var t = { };  
  if (!x.value)
    return t;
    
  if (normalize == undefined)
        normalize = true;
    
  for (var i = 0; i < x.value.length; i++) {
    var vv = x.value[i];
    if (!vv) continue;
    var ii = vv.id;
    if (isPrimitive(ii))
        continue;
    if (noProperties) {
        if (window.self.getProperty(ii)!=null)
            continue;
    }
    var s = vv.strength || 1.0;
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

function objTagRelevance(x,y) {
    /* dot product of the normalized tag vectors */

    var xx = objTagStrength(x, false, true);
    var yy = objTagStrength(y, false, true);

	var xxk = _.keys(xx);
	var yyk = _.keys(yy);

	var r = 0;

	for (var i = 0; i < xxk.length; i++) {
		var c = xxk[i];
		var contained = _.contains( yyk, c );
		if (contained) {
			r += xx[c] * yy[c];
		}
	}

    return r;
    
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
    if (s!=null) return s;
    
    //TODO iterate through all values for a primitive with type spacepoint?
    return null;    
}
exports.objSpacePoint = objSpacePoint;

function objGeographic(x) {
    //TODO check for planet
    var sp = objSpacePoint(x);
    return sp!=null;        
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
    return objAddValue(x, 'spacepoint', {'lat': lat, 'lon': lon, planet: 'Earth'});
}
exports.objAddGeoLocation = objAddGeoLocation;


function objHasTag(x, t) {
	if (!x.value) return false;

	var tIsArray = Array.isArray(t);

	//if t is an array, return true if any one of t's elements is a tag 
	for (var i = 0; i < x.value.length; i++) {
	    var vv = x.value[i];
	    if (!vv) continue;

	    var vid = vv.id;
		if (typeof vv == "string")
			vid = vv;
		else if (Array.isArray(vv))
			vid = vv[0];			

		if (!vid) continue;
	
		if (vv.strength == 0)
			continue;
		if (isPrimitive(vid))
			continue;
	
		if (tIsArray) {
			if (_.contains(t, vid))
				return true;
		}
		else {
			if (vid == t)
				return true;
		}
	}
	return false;

}

function objHasTagOLD(x, t) {   
	//if t is an array, return true if any one of t's elements is a tag 
    if (Array.isArray(t)) {
        var ot = objTags(x);
        for (var i = 0; i < t.length; i++) 
            if (_.contains(ot, t[i]))
              return true;
        return false;
    }
    else
        return _.contains(objTags(x), t);
}
exports.objHasTag = objHasTag;


function objFirstValue(object, id, defaultValue) {
    if (!object) return defaultValue;
    
    if (object.value) {
        for (var k = 0; k < object.value.length; k++) {
        	if (object.value[k].id == id)
				return object.value[k].value;
		}
	}
	return defaultValue;
}
exports.objFirstValue = objFirstValue;

function objSetFirstValue(object, id, newValue) {
    var existingValue = objFirstValue(object, id, null);
    if (existingValue == null) {
        objAddValue(object, id, newValue);
    }
    else {
        if (object.value) {
            for (var k = 0; k < object.value.length; k++) {
                if (object.value[k].id == id)
    				object.value[k].value = newValue;
    		}
    	}
    }
}
exports.objSetFirstValue = objSetFirstValue;


function objValues(object, id) {
    var v = [];
    if (object.value) {
        for (var k = 0; k < object.value.length; k++) {
    		if (object.value[k].id == id)
				v.push( object.value[k].value );
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
	var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz-_";

	//TODO recalculate this
	//70 possible chars
	//	21 chars = 5.58545864083284e+38 ( > UUID) permutations
	//		if we allow author+objectID >= 21 then we can guarantee approximate sparseness as UUID spec
	//			so we should choose 11 character Nobject UUID length

	var string_length = 11;
	var randomstring = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		randomstring += chars.substring(rnum,rnum+1);
	}
	return randomstring;
}
exports.uuid = uuid;



/** sets the only instance of the property, or creates if doesn't exist */
/*function setTheProperty(object, propertyID, newValue) {
    for (var k = 0; k < object.values.length; k++) {
		if (object.values[k].uri == propertyID) {
			object.values[k].value = newValue;
            return object;
		}
	}
    object.values.push( {uri: propertyID, value: newValue } );
	return object;
}
exports.setTheProperty = setTheProperty;*/

function isSelfObject(u) {  
    if (!u) 
        return false;
    return (u.indexOf('Self-')==0);  
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
    
    var tt = self.getTag(t);
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



//Chris Coyier's MD5 Library
//http://css-tricks.com/snippets/javascript/javascript-md5/
var MD5 = function (string) {

function RotateLeft(lValue, iShiftBits) {
        return (lValue<<iShiftBits) | (lValue>>>(32-iShiftBits));
}

function AddUnsigned(lX,lY) {
        var lX4,lY4,lX8,lY8,lResult;
        lX8 = (lX & 0x80000000);
        lY8 = (lY & 0x80000000);
        lX4 = (lX & 0x40000000);
        lY4 = (lY & 0x40000000);
        lResult = (lX & 0x3FFFFFFF)+(lY & 0x3FFFFFFF);
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

function F(x,y,z) { return (x & y) | ((~x) & z); }
function G(x,y,z) { return (x & z) | (y & (~z)); }
function H(x,y,z) { return (x ^ y ^ z); }
function I(x,y,z) { return (y ^ (x | (~z))); }

function FF(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(F(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
};

function GG(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(G(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
};

function HH(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(H(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
};

function II(a,b,c,d,x,s,ac) {
        a = AddUnsigned(a, AddUnsigned(AddUnsigned(I(b, c, d), x), ac));
        return AddUnsigned(RotateLeft(a, s), b);
};

function ConvertToWordArray(string) {
        var lWordCount;
        var lMessageLength = string.length;
        var lNumberOfWords_temp1=lMessageLength + 8;
        var lNumberOfWords_temp2=(lNumberOfWords_temp1-(lNumberOfWords_temp1 % 64))/64;
        var lNumberOfWords = (lNumberOfWords_temp2+1)*16;
        var lWordArray=Array(lNumberOfWords-1);
        var lBytePosition = 0;
        var lByteCount = 0;
        while ( lByteCount < lMessageLength ) {
                lWordCount = (lByteCount-(lByteCount % 4))/4;
                lBytePosition = (lByteCount % 4)*8;
                lWordArray[lWordCount] = (lWordArray[lWordCount] | (string.charCodeAt(lByteCount)<<lBytePosition));
                lByteCount++;
        }
        lWordCount = (lByteCount-(lByteCount % 4))/4;
        lBytePosition = (lByteCount % 4)*8;
        lWordArray[lWordCount] = lWordArray[lWordCount] | (0x80<<lBytePosition);
        lWordArray[lNumberOfWords-2] = lMessageLength<<3;
        lWordArray[lNumberOfWords-1] = lMessageLength>>>29;
        return lWordArray;
};

function WordToHex(lValue) {
        var WordToHexValue="",WordToHexValue_temp="",lByte,lCount;
        for (lCount = 0;lCount<=3;lCount++) {
                lByte = (lValue>>>(lCount*8)) & 255;
                WordToHexValue_temp = "0" + lByte.toString(16);
                WordToHexValue = WordToHexValue + WordToHexValue_temp.substr(WordToHexValue_temp.length-2,2);
        }
        return WordToHexValue;
};

function Utf8Encode(string) {
        string = string.replace(/\r\n/g,"\n");
        var utftext = "";

        for (var n = 0; n < string.length; n++) {

                var c = string.charCodeAt(n);

                if (c < 128) {
                        utftext += String.fromCharCode(c);
                }
                else if((c > 127) && (c < 2048)) {
                        utftext += String.fromCharCode((c >> 6) | 192);
                        utftext += String.fromCharCode((c & 63) | 128);
                }
                else {
                        utftext += String.fromCharCode((c >> 12) | 224);
                        utftext += String.fromCharCode(((c >> 6) & 63) | 128);
                        utftext += String.fromCharCode((c & 63) | 128);
                }

        }

        return utftext;
};

var x=Array();
var k,AA,BB,CC,DD,a,b,c,d;
var S11=7, S12=12, S13=17, S14=22;
var S21=5, S22=9 , S23=14, S24=20;
var S31=4, S32=11, S33=16, S34=23;
var S41=6, S42=10, S43=15, S44=21;

string = Utf8Encode(string);

x = ConvertToWordArray(string);

a = 0x67452301; b = 0xEFCDAB89; c = 0x98BADCFE; d = 0x10325476;

for (k=0;k<x.length;k+=16) {
        AA=a; BB=b; CC=c; DD=d;
        a=FF(a,b,c,d,x[k+0], S11,0xD76AA478);
        d=FF(d,a,b,c,x[k+1], S12,0xE8C7B756);
        c=FF(c,d,a,b,x[k+2], S13,0x242070DB);
        b=FF(b,c,d,a,x[k+3], S14,0xC1BDCEEE);
        a=FF(a,b,c,d,x[k+4], S11,0xF57C0FAF);
        d=FF(d,a,b,c,x[k+5], S12,0x4787C62A);
        c=FF(c,d,a,b,x[k+6], S13,0xA8304613);
        b=FF(b,c,d,a,x[k+7], S14,0xFD469501);
        a=FF(a,b,c,d,x[k+8], S11,0x698098D8);
        d=FF(d,a,b,c,x[k+9], S12,0x8B44F7AF);
        c=FF(c,d,a,b,x[k+10],S13,0xFFFF5BB1);
        b=FF(b,c,d,a,x[k+11],S14,0x895CD7BE);
        a=FF(a,b,c,d,x[k+12],S11,0x6B901122);
        d=FF(d,a,b,c,x[k+13],S12,0xFD987193);
        c=FF(c,d,a,b,x[k+14],S13,0xA679438E);
        b=FF(b,c,d,a,x[k+15],S14,0x49B40821);
        a=GG(a,b,c,d,x[k+1], S21,0xF61E2562);
        d=GG(d,a,b,c,x[k+6], S22,0xC040B340);
        c=GG(c,d,a,b,x[k+11],S23,0x265E5A51);
        b=GG(b,c,d,a,x[k+0], S24,0xE9B6C7AA);
        a=GG(a,b,c,d,x[k+5], S21,0xD62F105D);
        d=GG(d,a,b,c,x[k+10],S22,0x2441453);
        c=GG(c,d,a,b,x[k+15],S23,0xD8A1E681);
        b=GG(b,c,d,a,x[k+4], S24,0xE7D3FBC8);
        a=GG(a,b,c,d,x[k+9], S21,0x21E1CDE6);
        d=GG(d,a,b,c,x[k+14],S22,0xC33707D6);
        c=GG(c,d,a,b,x[k+3], S23,0xF4D50D87);
        b=GG(b,c,d,a,x[k+8], S24,0x455A14ED);
        a=GG(a,b,c,d,x[k+13],S21,0xA9E3E905);
        d=GG(d,a,b,c,x[k+2], S22,0xFCEFA3F8);
        c=GG(c,d,a,b,x[k+7], S23,0x676F02D9);
        b=GG(b,c,d,a,x[k+12],S24,0x8D2A4C8A);
        a=HH(a,b,c,d,x[k+5], S31,0xFFFA3942);
        d=HH(d,a,b,c,x[k+8], S32,0x8771F681);
        c=HH(c,d,a,b,x[k+11],S33,0x6D9D6122);
        b=HH(b,c,d,a,x[k+14],S34,0xFDE5380C);
        a=HH(a,b,c,d,x[k+1], S31,0xA4BEEA44);
        d=HH(d,a,b,c,x[k+4], S32,0x4BDECFA9);
        c=HH(c,d,a,b,x[k+7], S33,0xF6BB4B60);
        b=HH(b,c,d,a,x[k+10],S34,0xBEBFBC70);
        a=HH(a,b,c,d,x[k+13],S31,0x289B7EC6);
        d=HH(d,a,b,c,x[k+0], S32,0xEAA127FA);
        c=HH(c,d,a,b,x[k+3], S33,0xD4EF3085);
        b=HH(b,c,d,a,x[k+6], S34,0x4881D05);
        a=HH(a,b,c,d,x[k+9], S31,0xD9D4D039);
        d=HH(d,a,b,c,x[k+12],S32,0xE6DB99E5);
        c=HH(c,d,a,b,x[k+15],S33,0x1FA27CF8);
        b=HH(b,c,d,a,x[k+2], S34,0xC4AC5665);
        a=II(a,b,c,d,x[k+0], S41,0xF4292244);
        d=II(d,a,b,c,x[k+7], S42,0x432AFF97);
        c=II(c,d,a,b,x[k+14],S43,0xAB9423A7);
        b=II(b,c,d,a,x[k+5], S44,0xFC93A039);
        a=II(a,b,c,d,x[k+12],S41,0x655B59C3);
        d=II(d,a,b,c,x[k+3], S42,0x8F0CCC92);
        c=II(c,d,a,b,x[k+10],S43,0xFFEFF47D);
        b=II(b,c,d,a,x[k+1], S44,0x85845DD1);
        a=II(a,b,c,d,x[k+8], S41,0x6FA87E4F);
        d=II(d,a,b,c,x[k+15],S42,0xFE2CE6E0);
        c=II(c,d,a,b,x[k+6], S43,0xA3014314);
        b=II(b,c,d,a,x[k+13],S44,0x4E0811A1);
        a=II(a,b,c,d,x[k+4], S41,0xF7537E82);
        d=II(d,a,b,c,x[k+11],S42,0xBD3AF235);
        c=II(c,d,a,b,x[k+2], S43,0x2AD7D2BB);
        b=II(b,c,d,a,x[k+9], S44,0xEB86D391);
        a=AddUnsigned(a,AA);
        b=AddUnsigned(b,BB);
        c=AddUnsigned(c,CC);
        d=AddUnsigned(d,DD);
             }

     var temp = WordToHex(a)+WordToHex(b)+WordToHex(c)+WordToHex(d);

     return temp.toLowerCase();
};

exports.MD5 = MD5;



function newAttentionMap(memoryMomentum, maxObjects, adjacency, spreadRate) {
    var that = {
    		values: { },
			totals: { },
            
            save : function(sorted) {  //provides a sorted, normalized snapshot
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
            
			add : function(i, deltaAttention) {
				
                if (!that.values[i]) {
                    that.values[i] = 0;
                    that.totals[i] = 0;
                }
                    
                that.values[i] += deltaAttention;
			},
            
			update : function() {
                

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


var createRingBuffer = function(length){

  var pointer = 0, buffer = [];
  
  var that = {
    get  : function(key){return buffer[key];},
    push : function(item){
      buffer[pointer] = item;
      pointer = (length + pointer +1) % length;
    }
  };
  
  that.pointer = pointer;
  that.buffer = buffer;
  
  return that;
  
};

exports.createRingBuffer = createRingBuffer;

function RecurringProcess(interval, runnable) {
	var that = {	};
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

function propGetType(t) {
    if (isPrimitive(t))
        return t;
    else {
        var p = window.self.getProperty(t);
        if (!p)
            return null;
        return p.type;
    }
}

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
            
            if (t == null) { }
            else if ((t == 'integer') || (t == 'real')) {
                if (isNumberValueIndefinite(v.value))
                    return _IND;
            }
            else {
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
            }
            else if (indefValue[0] == '>') {
                if (indefValue.indexOf('<')!=-1) {
                    //TODO this operator is weird, use a more natural one like: a..b (this will involve not using isNaN in other functions to determine if a number)
                    var mm = indefValue.substring(1).split('<');
                    return (dn >= mm[0]) && (dn <= mm[1]) ? 1.0 : 0.0;
                }
                else {
                    var n = parseFloat(indefValue.substring(1));
                    return dn > n ? 1.0 : 0.0;
                }
            }
            /*else if (indefValue.indexOf('..')!=-1) {
                var mm = indefValue.split('..');
                return (dn >= mm[0]) && (dn <= mm[1]) ? 1.0 : 0.0;
            }*/
            else if ((indefValue == '') || (isNaN(indefValue)))
                return 1.0;
            else
                return dn == parseFloat(indefValue) ? 1.0 : 0.0;
        }
        return 0;
    }
    
    function computeDefiniteIndefinite(r, d, i) {
        r.propertyMatch = { };
        
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


function objCompact( o ) {
    if (o.modifiedAt)
        if (o.modifiedAt == o.createdAt)
            delete o.modifiedAt;
    
    if (!o.value)
        return o;
    //console.log(o.name);
    //console.log(  o);

    var y = _.clone(o);

	//TODO ---- fix the rest of this

    var newValues = [];

    //console.log(o.value.length + ' values');
    for (var i = 0; i < o.value.length; i++) {
        var v = o.value[i];
        if (!v) continue;
        
        //console.log(i + '//' + v);
        if (((v.value) && (v.value.lat)) || (Array.isArray(v))) {
            newValues.push(v);
        }
        else {
            var ia = v.id;
            var va = v.value || null;
            var s = v.strength || null;
            if (s)
                newValues.push([ia, va, s]);
            else if (va)
                newValues.push([ia, va]);
            else if (ia)
                newValues.push( ia );
			else
				newValues.push( v );
        }
    }
    y.value = newValues;
    //console.log('newValue:: ' + newValues);
    //console.dir(y.value);
    //console.log('-----');
    return y;
}
exports.objCompact = objCompact;

function objExpand( o ) {
    if (!o.value)
        return o;

    var y = _.clone(o);
    var newValues = [];
    for (var i = 0; i < o.value.length; i++) {
        var v = o.value[i];
        if ( Array.isArray(v) ) {
            var r =  { id: v[0] };
            if (v[1])
                r.value = v[1];
            if (v.length > 2)
                r.strength = v[2];
            newValues.push( r );                
        }
        else if (typeof v === 'object') {
            newValues.push(v);
        }
        else if (typeof v === 'string') {
            newValues.push( { id: v } );
        }
        else {
            newValues.push(v);
        }
    }
    y.value = newValues;
    return y;
}
exports.objExpand = objExpand;


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

