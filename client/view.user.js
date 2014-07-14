//becoming DEPRECATED
function newUserView(v, userid) {
	var d = newDiv().appendTo(v);

	if (userid) {
		var user = $N.getObject(userid);
		if (!user) {
			d.append('User ' + userid + ' not found.');
			return;
		}
		user = new nobject(user);

		var operatorTags = getOperatorTags();


		var tags = getKnowledgeCodeTags(userid);
		var x = '';


		x += '<h1>' + user.name + '</h1>';

		delete tags['name'];

		var location = tags['@'];
		if (location) {
			x += '<div class="Location">' + _n(location[0], 3) + ',' + _n(location[1], 3) + '</div>';
			delete tags['@'];
		}


		var desc = objDescription(user);
		if (desc) {
			x += '<h3>' + desc + '</h3>';
		}

		x += '<hr/>';


		for (var j = 0; j < operatorTags.length; j++) {
		   	var i = operatorTags[j];
			if (!tags[i]) continue;

		    var il = i;
		    var stt = $N.getTag(i);
		    if (stt)
		        il = stt.name;

		    var color = 'black';

		    //x += '<b style="color: ' + color + '">' + il + '</b>: ';
			x += '<div class="tagSection ' + i + '_section">';

			var icon = getTagIcon(i);
			var iconString = '';
			if (icon)
				iconString = '<img src="' + icon + '" style="height: 1em"/>';

			x += '<h2 class="' + i + '_heading">' + iconString + il + '</h2><ul>';

			if (tags[i])
				for (var y = 0; y < tags[i].length; y++) {
				    var tt = tags[i][y][0];
					var name = tags[i][y][0];
					var strength = tags[i][y][1];
					var tagID = tags[i][y][3];
					var fs = parseInt((strength * 100) + 50);
				    x += '<li><a href="' + getENWikiURL(tagID) + '" style="font-size: ' + fs + '%">' + name + '</a></li>';
				}

			x += '</ul></div>';
		}

		d.append(x);

		var textCode = getUserTextCode(tags, user);
		if (textCode.length > 0) {
			d.append('<h2>Tag Summary (Text)</h2><pre>' + textCode + '</pre><br/>');
		}

		var jsonCode = getUserJSONCode(userid);

		function simplifyJSON(j) {
			//http://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
			return j.replace(/\"([^(\")"]+)\":/g, '$1:');  //This will remove all the quotes to make more compact
		}

		d.append('<h2>Tag Code (JSON)</h2><pre class="UserTagCode">' + simplifyJSON(JSON.stringify(jsonCode, null, 4)) + '</pre><br/>');

		var jsonCodeCompact = simplifyJSON(JSON.stringify(jsonCode));
		d.append('<h2>Tag Code (JSON Compact)</h2>' + jsonCodeCompact + '<br/>');

		/*var jsonCodeJSONH = JSONH.stringify(jsonCode);
		d.append('<h2>Tag Code (JSONH)</h2>' + jsonCodeJSONH + '<br/>');*/

		/*var url = document.location.origin + '/code/' + encodeURIComponent(jsonCodeCompact);
		d.append('<br/><a href="' + url + '">URL</a>')*/

		/*
		var jid = duid();
		d.append('<h2>QR Code</h2>');
		d.append(newDiv(jid));
		new QRCode(document.getElementById(jid), { text: jsonCodeCompact,
			width : 512,
			height : 512,
			typeNumber : 40,
			colorDark : "#000000",
			colorLight : "#ffffff",
			correctLevel : 1
		});
		*/

		if (configuration.connection === 'websocket') {
			var jsonProfileLink = $('<a href="/object/author/' + userid + '/json">Download Profile (JSON)</a>');
			d.append('<hr/>', jsonProfileLink, '<br/>');
		}

		/*{
			var email = "email address"
			var subject = "subject"
			var body = encodeURIComponent(jsonCodeCompact);

			d.append('<form name="form" action=\"mailto:' + email + '\?subject='+ subject +'\&body='+ body + '\" method=\"post\" enctype=\"text/plain\"><input type="submit"/></form>');
		}*/

	}

	else {
		d.append('index of users');
	}

	return d;
}

function newSelfSummary(userid) {
	var x = objNew();
	var U = $N.getObject(userid);
	if (!U) return x;

	U = new nobject(U);

	x.name = U.name;
	if (U.id == $N.id()) {
		x.name = x.name + ' (Summary)';
	}
	else {
		x.name = x.name + ' (Summary by ' + $N.myself().name + ')';
	}

	x.author = $N.id();
	x.subject = U.id;

	var operatorTags = getOperatorTags();


	var tags = getKnowledgeCodeTags(userid);
	delete tags['name'];

	var textCode = getUserTextCode(tags, U);
	if (textCode.length > 0) {
		x.addDescription('<pre>\n' + textCode + '</pre>');
	}

	/*var jsonCode = getUserJSONCode(userid);

	function simplifyJSON(j) {
		//http://stackoverflow.com/questions/11233498/json-stringify-without-quotes-on-properties
		return j.replace(/\"([^(\")"]+)\":/g,"$1:");  //This will remove all the quotes to make more compact
	}


	var jsonCodeCompact = simplifyJSON(JSON.stringify(jsonCode));
	x.addDescription(jsonCodeCompact);*/

	return x;
}


function getKnowledgeCodeTags(userid) {

	var tags = $N.getIncidentTags(userid, operatorTags);

	for (var k in tags) {
		var l = tags[k];
		tags[k] = _.map(tags[k], function(o) {
			var O = $N.getObject(o);
			var strength = objTagStrength(O, false);
			var firstNonOperatorTag = null;
			var allTags = objTags(O, false);
			for (var m = 0; m < allTags.length; m++) {
				var s = allTags[m];
				if (operatorTags.indexOf(s) == -1) {
					firstNonOperatorTag = s;
					break;
				}
			}
			return [O.name, strength[k], o, firstNonOperatorTag];
		});
		tags[k] = tags[k].sort(function(a, b) {
			return b[1] - a[1];
		});

		/*for (var i = 0; i < l.length; i++) {
			l[i] = l[i].substring(l[i].indexOf('-')+1, l[i].length);
		}*/
	}

	var user = $N.instance[userid];
	tags['@'] = objSpacePointLatLng(U);
	tags['name'] = user.name;

	return tags;
}


function getUserJSONCode(user) {
	var objects = _.filter($N.objects(), function(v, k) {
		if (!objIsPublic(v)) return false;

		return (v.author == user);
	});
	objects = _.map(objects, function(o) {
		var n = objCompact(o);
		delete n.author;
		return n;
	});
	return objects;
}

function getUserJSONCodeOLD(tags, user) {
	var jc = { };

	jc['name'] = user.name;
	var location = user.earthPoint();
	if (location)
		jc['where'] = dloc(location);

	var operatorTags = getOperatorTags();
	var operatorObjects = [];
	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (!tags[i]) continue;
		for (var y = 0; y < tags[i].length; y++) {
			var oid = tags[i][y][2];
			operatorObjects.push(oid);
		}
	}

	jc['objects'] = [];

	operatorObjects = _.unique(operatorObjects);
	_.each(operatorObjects, function(o) {
		var O = $N.getObject(o);
		var Oc = objCompact(O);
		jc['objects'].push(Oc);
	});

	/*var operatorTags = getOperatorTags();
	var processed = {};
	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (isKnowledgeTag(i)) {
			if (!jc['Know']) jc['Know'] = { };

			if (!tags[i]) continue;
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);

				if (processed[oid]) continue;
				processed[oid] = true;
				jc['Know'][tags[i][y][3]] = knowTagsToRange(O);

			}
		}
		else {

			if (!tags[i]) continue;

			jc[i] = [];
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);
				jc[i].push(tags[i][y][3]);
			}
		}
	}*/


	return jc;
}




