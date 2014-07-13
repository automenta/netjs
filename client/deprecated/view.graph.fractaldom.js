function renderGraph(s, o, v) {
	var d = fractaldom();
	d.appendTo(v);
	d.init();

	d.destroy = function() {
		d.removeNodes();
	};
	d.update = function() {
	};


	var w1 = d.newNode("a", {title:'Hi', position: [100,100]} );
	w1.append('Fractals are everywhere<br/>');
	w1.append('Fractal patterns have been modeled extensively, albeit within a range of scales rather than infinitely, owing to the practical limits of physical time and space. Models may simulate theoretical fractals or natural phenomena with fractal features. The outputs of the modelling process may be highly artistic renderings, outputs for investigation, or benchmarks for fractal analysis. Some specific applications of fractals to technology are listed elsewhere. Images and other outputs of modelling are normally referred to as being "fractals" even if they do not have strictly fractal characteristics, such as when it is possible to zoom into a region of the fractal image that does not exhibit any fractal properties. Also, these may include calculation or display artifacts which are not characteristics of true fractals.')

	var w2 = d.newNode('b', { title: 'Instructions', position: [800,300] } );
	w2.append('<b>Drag on the left-side box in the title bar to adjust zoom.</b><br/><br/>');
	w2.append('<b>Drag on the background to move the canvas.</b><br/><br/>');
	w2.append('<b>Resize a window to a small square to activate its icon mode.</b><br/><br/>');

	d.newEdge('a', 'b', { label: 'Abcdefg' });

	var g = d.newNode('goal', { title: 'Goal', position: [400, 400] });
	newGoalList(g, self.myself().id);

	d.newEdge('goal', 'b', { label: 'Zxcffdf' });

	var h = d.newNode('tags', { title: 'Tags', position: [600, 600] });
	var prefix = 'gttt';
	newTagTree({
		target: h,
        newTagDiv: function(id, content) {
            var ti = getTagIcon(id);
			if (!ti) ti = defaultIcons['unknown'];

            content = '<img style="height: 1em" src="' + ti + '"/>&nbsp;' + content;

            return {
                label: ('<button id="' + prefix + id + '" class="TagChoice")>' + content + '</button>')
            };
        },
		onCreated: function() {
			h.find('.TagChoice').each(function(x) {
				var t = $(this);
				t.click(function() {
				   onTagAdded(t.attr('id').substring(prefix.length));
				});
			});
		}
	});

	var k = d.newNode('add', { title: 'Thought', position: [200,200] });
	k.append(newObjectEdit(objNew(), true));

	return d;

}

