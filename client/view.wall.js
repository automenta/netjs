addView({
	id: 'wall',
	name: 'Home',
	icon: 'icon/atom.png',
	start: function(v) {		
		v.addClass('ViewPage Wall');
		
		$.getJSON('/template/category_previews.json').done(function(data) {
			console.log(data);
			React.renderComponent(
				CategoryPreviews(data),
				v[0]
			);
		});				
	},
	stop: function() {
	}
});
