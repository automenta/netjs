function newTemplatesView(v) {
	var d = newDiv().appendTo(v);

	var sidebar = newDiv().addClass('goalviewSidebar').appendTo(d);

	var templates = $N.objectsWithTag('Template');
	_.each(templates, function(t) {
		var T = $N.getObject(t);
		var b = $('<button>' + T.name + '</button>').attr('title', T.description).appendTo(sidebar);
		b.click(function() {
			var X = _.clone(T);
			X.id = uuid();
			objRemoveTag(X, 'Template');
			newPopupObjectEdit(X, true);
		});
	});

	return d;
}
