function newUserView(v, userid) {
	var d = newDiv().appendTo(v);

	if (userid) {
		var user = $N.getObject(userid);
		if (!user) {
			d.append('User ' + userid + ' not found.');
			return;
		}

		var operatorTags = getOperatorTags();

		function getKnowledgeCodeTags(userid) {
		
			var tags = $N.getIncidentTags(userid, operatorTags);
				    
			for (var k in tags) {
				var l = tags[k];
				tags[k] = _.map(tags[k], function(o) {
					var O = $N.getObject(o);
					var strength = objTagStrength(O, false);
					return [O.name, strength[k], o];
				});
				tags[k] = tags[k].sort(function(a, b) {
					return b[1] - a[1];
				});

				/*for (var i = 0; i < l.length; i++) {
				    l[i] = l[i].substring(l[i].indexOf('-')+1, l[i].length);
				}*/
			}
		
			var user = $N.object(userid);
			tags['@'] = objSpacePointLatLng(user);
			tags['name'] = user.name;

			return tags;
		}

		var tags = getKnowledgeCodeTags(userid);
		var x = '';


		x += '<h1>' + user.name + '</h1>';

		delete tags['name'];

		var location = tags['@'];
		if (location) {
			x += '<div class="Location">' + _n(location[0],3) + ',' + _n(location[1],3) + '</div>';
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
					var fs = parseInt((strength * 100) + 50);
				    x += '<li><a href="' + getENWikiURL(tt) + '" style="font-size: ' + fs + '%">' + name + '</a></li>';
				}

			x += '</ul></div>';
		}

		d.append(x);

		var textCode = getUserTextCode(tags);
		if (textCode.length > 0) {
			d.append('<h2>Tag Code (text)</h2><pre>' +  + '</pre><br/>');
			
		}

		var jsonProfileLink = $('<a href="/object/author/' + userid + '/json">Download Profile (JSON)</a>' );
		d.append('<hr/>', jsonProfileLink, '<br/>');

	}
	else {
		d.append('index of users');
	}
	
	return d;
}

function isKnowledgeTag(t) {
	return ['Do','DoTeach','DoLearn','LearnDo','TeachDo', 'Teach', 'Learn'].indexOf(t)!=-1;
}

function getUserTextCode(tags) {
	var s = '';
	var operatorTags = getOperatorTags();
	var processed = {};


	//Knowledge Tags
	var header = 'KNOW                                  L=========D=========T\n';
	var chartColumn = header.indexOf('L');
	for (var j = 0; j < operatorTags.length; j++) {
	   	var i = operatorTags[j];
		if (isKnowledgeTag(i)) {
			if (!tags[i]) continue;			
			for (var y = 0; y < tags[i].length; y++) {
				var oid = tags[i][y][2];
				var O = $N.getObject(oid);

				if (processed[oid]) continue;
				processed[oid] = true;

				var line = '  ' + tags[i][y][0];
				var spacePadding = chartColumn - line.length;
				for (var n = 0; n < spacePadding; n++)
					line += ' ';
				var knowLevel = knowTagsToRange(O);
				var chartIndex = Math.round(knowLevel * 10);
				for (var n = -10; n <= 10; n++) {
					if (n == chartIndex) line += '|'
					else line += '-';
				}
				
				s += line + '\n';
			}
		}
	}
	if (s.length > 0) s = header + s;
	return s;
}

function knowTagsToRange(x) {
	var s = objTagStrength(x, false);

	//if (s['DoLearn'])...

	var DO = s['Do'] || 0;
	var LEARN = s['Learn'] || 0;
	var TEACH = s['Teach'] || 0;

	//console.log(LEARN, DO, TEACH);

	if (LEARN && TEACH) {
		console.log(x + ' has conflicting Learn and Teach strengths');
		TEACH = null;
		LEARN = null;
	}
	if (LEARN) {
		var total = LEARN + DO;						
		LEARN/=total;
		DO/=total;
		
		return -1 * LEARN;
	}
	else if (TEACH) {
		var total = TEACH + DO;						
		TEACH/=total;
		DO/=total;
		
		return 1 * TEACH;
	}
	else {
		return 0;
	}					
}

