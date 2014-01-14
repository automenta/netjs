//retrieves a google doc spreadsheet as CSV and converts it to timeglider JSON timeline format:

// input (columns):
// ex: https://docs.google.com/spreadsheet/ccc?key=0AgCqCoDPAuA2dC1WbHoyS1JJTDVwcW11RnNOYjdZQWc// ...
/*
	start_date
	start_time
	end_date
	end_time
	title
	description
	locations
	image_link
	link
	importance
	color
	class

	EXTRA COLUMNS:
		Related Activities
		Response
		On-Site Location

*/
var csv = require('ya-csv');
var _ = require('underscore');

var events = [];

var reader = csv.createCsvStreamReader(process.openStdin(), { columnsFromHeader: true });
reader.addListener('data', function(e) {
    // supposing there are so named columns in the source file
    //console.log(JSON.stringify(e, null, 4));

	//TODO parse start_date and start_time into a Unix time
	//TODO handle case when start_date present but start_time NOT present

	function d(date, time) {
		var ds = date.split('/');
		var y = ds[2];
		var m = ds[0];
		var d = ds[1];

		function p(x) {
			if (x.length == 1) return '0' + x;
			return x;
		}

		if (time.length == 7) time = '0' + time;	//pad prepending zero

		return y + '-' + p(m) + '-' + p(d) + ' ' + time;
	}


	if (e.start_date) {
		if (!e.start_time) {
			e.start_time = '00:00:00'; 
			e.end_time = '23:59:00';
//			e.end_time = e.start_time; //+24hrs?
		}

		e.startdate = d(e.start_date, e.start_time);

		if (!e.end_date)
			e.end_date = e.start_date;
		if (!e.end_time)
			e.end_time = e.start_time;

		e.enddate = d(e.end_date, e.end_time);

		//TODO parse shortcodes present in description that reference extra columns by their name
		if (e.description)
			e.description = e.description;


		events.push(e);
	}


});
reader.addListener('end', function() {

	//console.log(events.length + ' events loaded.');

	console.log( JSON.stringify([getTimeGliderJSON(events)], null, 4) );

	//console.log( JSON.stringify(getTimelineJSJSON(events)/*, null, 4*/) );

});


// output (timeglider json | vertical-timeline json | netention -> mongodb):
// 	json: http://enformable.com/timeline/fukushima2.json
//  http://timeglider.com/widget/index.php?p=json
/* {
    "id": "jshist",
    "title": "A little history of JavaScript",
    "focus_date": "2001-01-01 12:00:00",
    "initial_zoom": "43",
    "timezone": "-07:00",
    "events": [
    	{
		  "id": "jshist-01",
		  "title": "Mocha - Live Script",
		  "description": "JavaScript was originally developed by Brendan Eich of 
			          Netscape under the name Mocha. LiveScript was the official name for the
			          language when it first shipped in beta releases of Netscape Navigator 2.0
			          in September 1995",
		  "startdate": "1995-04-01 12:00:00",
		  "enddate": "1995-04-01 12:00:00",
		  "date_display": "month",
		  "link": "http://en.wikipedia.org/wiki/JavaScript",
		  "importance": 40,
		  "icon":"square_blue.png"
		},
*/

function getTimeGliderJSON(events) {
	var x = {
		id: '_',
		title: "_",
    	//focus_date: "2001-01-01 12:00:00",
	    //"initial_zoom": "43",
	    //"timezone": "-07:00",
		events: []
	};

	var y = x.events;

	x.legend = [];
	var legends = { };

	for (var i = 0; i < events.length; i++) {
		var n = _.clone(events[i]);
		/*n.startdate = n.start_date + ' ' + n.start_time;
		if (n.end_date)
			n.enddate = n.end_date + ' ' + n.end_time;*/
		n.id = 	'_' + i;
		legends[n.icon] = 1;
		y.push(n);
	}

	for (var l in legends) {
		if (l.length > 0)
			x.legend.push( { title: l, icon: l }  );
	}


	return x;
}

//https://github.com/VeriteCo/TimelineJS
function getTimelineJSJSON(events) {

	function u(dt) {
		var d = (dt.split(' ')[0]).split('/');
		var y = d[0];
		var m = d[1];
		var d = d[2];
		return y+','+m+','+d;
	}

	function t(e) {
		return {
			startDate: u(e.start_date),
			endDate: u(e.end_date),
			headline: e.title,
			text: e.description,
			tag: '',
			classname: e.class,
			asset: {
				//media: e.link,
				thumbnail: e.image_link,
				//caption: '',
				//credit: ''
			}		
		};
	}

	return { timeline : {
		headline: "Headline",
		type: 'default',
		text: 'Intro text',
		asset: {
            "media":"http://yourdomain_or_socialmedialink_goes_here.jpg",
            "credit":"Credit Name Goes Here",
            "caption":"Caption text goes here"
		},
		date: _.map(events, t)
		//era: []
	}};
}

