addView({
	id: 'wall',
	name: 'Home',
	icon: 'icon/atom.png',
	start: function(v) {		
		v.addClass('ViewPage Wall');
		
		var objPerCategory = 6;

		function objNewest(objArray, n) {
			objArray.sort(function(a, b) {
				return objTime(a) - objTime(b);
			});
			objArray.slice(0, n);
			return objArray;
		}

		var categories = ['Can', 'Need', 'Learn', 'Teach', 'Do'];

		var data = { tag: [] };
		categories.forEach(function(t) {
			data.tag.push({
				id: t,
				object: objNewest($N.getTagged(t), objPerCategory)
			});
		});

		React.renderComponent(
			CategoryPreviews(data),
			v[0]
		);
	},
	stop: function() {
	}
});
