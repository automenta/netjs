function newTrendsView(v) {
    var aa = $N.objects();
    var serverTagCount = { };
    var localTagCount = $N.getTagCount();
    var selfTagCount = $N.getTagCount(true);


    var yy = newDiv();
    yy.addClass('Trends_FocusArea');

    var tagCountArea = newDiv();
    tagCountArea.addClass('Trends_TagCountArea');
    tagCountArea.append('Known objects: ' + _.size(aa));
    tagCountArea.append('<br/>');

    v.append(yy);
    v.append(tagCountArea);

    var labels = [];
    var values = [];

    function displayTags() {
        var tags = _.union(_.keys(serverTagCount), _.keys(localTagCount), _.keys(selfTagCount));

        for (var k = 0; k < tags.length; k++) {
            var ti = tags[k];

            var name = ti;
            var t = $N.tag(ti);

            if (t != undefined)
                name = t.name;
            else
                name = ti;

            var d = $('<div/>');
            //var url = '#/tag/' + ti;
            var url = '#';
            //var fs = 3.0 + Math.log(1+tagCount[k])*0.2;
            //var ab = $('<a href="' + url + '" style="font-size:' + (100.0 * fs) +'%">' + name + '</a>');

            var ab;

            if (t != undefined)
                ab = newTagButton(t);
            else
                ab = $('<a href="' + url + '">' + name + '</a>');

            ab.click(function() {
                $N.set('currentView', 'list');
                Backbone.history.navigate(url, true);
            });

            var vv = $('<p/>');

            d.append(ab);
            d.addClass('trendTagLabel');
            vv.append(d);

            /*
            var f = $('<div>' + _n(selfTagCount[ti]) + '</div>' );
            f.addClass('trendTagCount');
            vv.append(f);

            var e = $('<div>' + _n(localTagCount[ti]) + '</div>' );
            e.addClass('trendTagCount');
            vv.append(e);

            var g = $('<div>' + _n(serverTagCount[ti]) + '</div>' );
            g.addClass('trendTagCount');
            vv.append(g);*/

            var total = (selfTagCount[ti] || 0) + (localTagCount[ti] || 0) + (serverTagCount[ti] || 0);
            d.attr('style', 'font-size:' + 100.0 * (1.0 + Math.log(total + 1)) * 0.5 + '%');

            tagCountArea.append(vv);

    	}

    }


    var updateFocusInterval = 5 * 1000;
    var focusHistory = 60 * 10; //10 mins
    var displayIntervals = 8;

    function newFocusHistory(focuses) {
	var now = Date.now();
	var whenCreated = function(f) { return f.whenCreated; };
	var oldest = (_.min(focuses, whenCreated)).whenCreated;
	var newest = (_.max(focuses, whenCreated)).whenCreated;

	var focusBins = (newest == oldest) ?
		{ 0: focuses } :
		_.groupBy(focuses, function(f) {
			var t = f.whenCreated;
			var prop = (t - oldest) / (newest - oldest);
			var bin = Math.min(
				Math.floor(prop * displayIntervals),
				displayIntervals - 1
			);
			return bin;
		});

	var d = newDiv();
	for (var i = displayIntervals - 1; i >= 0; i--) {
		var fs = focusBins[i];
		if (!fs) fs = []; //continue;

		var e = newDiv();
		e.addClass('Trends_TimeSegmentBox');
		if (displayIntervals - 1 == i) {
			e.append('<b>Now:</b><br/>');
		}

		function getTagCloud(x) {
			var t = { };
			for (var i = 0; i < x.length; i++) {
				var v = x[i].value;
				if (!v) continue;
				for (var k = 0; k < v.length; k++) {
					var strength = 1.0;	//TODO get value item strength;
					var id = v[k].id;
					if (!t[id]) t[id] = 0;
					t[id] += strength;
				}
			}
			return t;
		}

		var tagCloud = getTagCloud(fs);
		e.append(JSON.stringify(tagCloud, null, 4));
		e.appendTo(d);
	}

	return d;
    }

 	if (configuration.connection != 'local') {
		$N.getServerAttention(function(r) {
		    serverTagCount = r;
		    displayTags();
		});
	   function updateFocus() {
		    $.getJSON('/focus/' + focusHistory, function(result) {
		        yy.html(newFocusHistory(result));
		    });
		}
		setTimeout(updateFocus, updateFocusInterval);
		updateFocus();
	}
	else
		displayTags();

}
