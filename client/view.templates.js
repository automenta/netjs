function renderTemplatesView(v) {
	var d = newDiv().appendTo(v);

	d.append(JSON.stringify( $N.objectsWithTag('Template') ) );

	return d;
}
