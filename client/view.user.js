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
					return [O.name, strength[k]];
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
				    var tt = tags[i][y];
					var name = tags[i][y][0];
					var strength = tags[i][y][1];
					var fs = parseInt((strength * 100) + 50);
				    x += '<li><a href="' + getENWikiURL(tt) + '" style="font-size: ' + fs + '%">' + name + '</a></li>';
				}

			x += '</ul></div>';
		}

		d.append(x);

		var jsoncode = $('<div/>').appendTo(d);
		$.getJSON('/object/author/' + userid + '/json', function(x) {
			jsoncode.html(JSON.stringify(x));
		});

	}
	else {
		d.append('index of users');
	}
	
	return d;
}
