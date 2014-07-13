function newHTTPJSONConnection(name, url) {
	return {

		id: function() { 'http_json:' + url },

		name: function() { return name; },

		start: function() {
		},

		update: function() {
			$.getJSON(url, function(objects) {
				$N.notice(objects);
			});
		},

		stop: function() {
		},

		newSummaryDiv: function() {
			var n = newDiv();

			return n;
		}

	};
}
