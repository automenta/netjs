addView({
	id: 'browse',
	name: 'Browse',
	icon: 'icon/view.browse.svg',
	start: function(v) {
		v.addClass('ViewPage');

		var browse;

		function update() {
			if (browse) {
				browse = null;
				v.html('');
			}

			browse = $('<table cellpadding="0" cellspacing="0" border="0" class="display" style="width:100%"></table>');
			browse.addClass('ViewPage');
			browse.appendTo(v);

			var rr = getRelevant('Recent', 'Public', 'Any', $N, 10000, null);


			var data = rr[0].map(function(o) {
				var O = $N.instance[o];
				return [O, O.name || '?', objWhen(O), $N.label(O.author) || O.name];
			});

			var table = browse.dataTable({
				'data': data,
				'columns': [
					{ 'title': 'NObject', class: '' },
					{ 'title': 'Name' },
					{ 'title': 'When' },
					{ 'title': 'Author' }
				],
				'deferRender': true,

				//http://www.datatables.net/extensions/scroller/examples
				/*
				"scrollY": "200px",
				"dom": "frtiS",
				'scrollCollapse': true,
				*/
				'searching': true,
				'lengthChange': true,
				'paging': true,
				'ordering': true,
				'order': [2, 'desc'],
				'columnDefs': [
				   {
						'targets': [0],
						'visible': false,
						'searchable': false
					}
					/*{
						// The `data` parameter refers to the data for the cell (defined by the
						// `data` option, which defaults to the column being worked with, in
						// this case `data: 0`.
						"render": function (data, type, row) {
							return '';
						},
						"targets": 1
					},*/


				],
				'createdRow': function(row, data, index ) {
					/*if ( data[5].replace(/[\$,]/g, '') * 1 > 4000 ) {
						$('td', row).eq(5).addClass('highlight');
					}*/
					$('td', row).eq(0).html(
						newObjectView(data[0], {
							scale: 0.5,
							depthRemaining: 0,
							startMinimized: false,
							showAuthorName: false,
							transparent: true
						})
					);
					$('td', row).eq(1).html($.timeago(new Date(data[2])));
				}
			});

		}

		v.onChange = update;
		update();

		return v;
	},
	stop: function(v) {}
});


_revealLoaded = false;

addView({
	id: 'slides',
	name: 'Slides',
	icon: 'icon/view.trends.svg',
	start: function(vv) {
		//hack to prevent reveal from clobbering mainmenu
		vv.css('top', $('#MainMenu').height());
		vv.css('margin-top', 0);

		if (!_revealLoaded) {
			loadCSS('lib/reveal.js/css/reveal.min.css');
			loadCSS('lib/reveal.js/css/theme/simple.css');
			$LAB
				.script('lib/reveal.js/lib/js/head.min.js')
				.script('lib/reveal.js/js/reveal.min.js')
				.wait(d);

			/*<!-- REVEAL.js -->
			<script src="lib/reveal.js/lib/js/head.min.js"></script>
			<script src="lib/reveal.js/js/reveal.min.js"></script>*/
		} else
			d();

		var that = this;


		function d() {
			_revealLoaded = true;
			var u = $('<div class="reveal"></div>');
			var v = $('<div class="slides"></div>');
			v.appendTo(u);
			vv.append(u);

			//var mainCol = $('<section>').appendTo(v);

			renderItems(v, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
				var elements = [];
				for (var i = 0; i < xxrr.length; i++) {
					var x = xxrr[i][0];

					var o = newObjectView(x, {
						onRemoved: function() {},
						depthRemaining: 4,
						transparent: true
					});

					//<section>Single Horizontal Slide</section><section><section>Vertical Slide 1</section><section>Vertical Slide 2</section></section>
					$('<section/>').append(o).appendTo(v);
				}

			});

			later(function() {


				Reveal.initialize({
					dependencies: [
						/*
						// Cross-browser shim that fully implements classList - https://github.com/eligrey/classList.js/
						{
							src: '/lib/reveal.js/lib/js/classList.js',
							condition: function () {
								return !document.body.classList;
							}
						},
						*/
						/*// Interpret Markdown in <section> elements
						{
							src: '/lib/reveal.js/plugin/markdown/marked.js',
							condition: function () {
								return !!document.querySelector('[data-markdown]');
							}
						},
						{
							src: '/lib/reveal.js/plugin/markdown/markdown.js',
							condition: function () {
								return !!document.querySelector('[data-markdown]');
							}
						},*/
						// Syntax highlight for <code> elements
						//{ src: '/lib/reveal.js/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },

						// Zoom in and out with Alt+click
						{
							src: '/lib/reveal.js/plugin/zoom-js/zoom.js',
							async: true,
							condition: function() {
								return !!document.body.classList;
							}
						}
						// Speaker notes
						//{ src: '/lib/reveal.js/plugin/notes/notes.js', async: true, condition: function() { return !!document.body.classList; } },

						// Remote control your reveal.js presentation using a touch device
						/*{
							src: '/lib/reveal.js/plugin/remotes/remotes.js',
							async: true,
							condition: function () {
								return !!document.body.classList;
							}
						},*/
						// MathJax
						//{ src: '/lib/reveal.js/plugin/math/math.js', async: true }
					],
					// Display controls in the bottom right corner
					controls: true,
					// Display a presentation progress bar
					progress: true,
					// Push each slide change to the browser history
					history: false,
					// Enable keyboard shortcuts for navigation
					keyboard: true,
					// Enable touch events for navigation
					touch: true,
					// Enable the slide overview mode
					overview: true,
					// Vertical centering of slides
					center: true,
					// Loop the presentation
					loop: false,
					// Change the presentation direction to be RTL
					rtl: false,
					// Number of milliseconds between automatically proceeding to the
					// next slide, disabled when set to 0, this value can be overwritten
					// by using a data-autoslide attribute on your slides
					autoSlide: 0,
					// Enable slide navigation via mouse wheel
					mouseWheel: true,
					// Transition style
					transition: 'linear', // default/cube/page/concave/zoom/linear/fade/none

					// Transition speed
					transitionSpeed: 'slow', // default/fast/slow

					// Transition style for full page backgrounds
					backgroundTransition: 'default', // default/linear/none,

					embedded: true,


					// The "normal" size of the presentation, aspect ratio will be preserved
					// when the presentation is scaled to fit different resolutions. Can be
					// specified using percentage units.
					width: screen.availWidth,
					height: screen.availHeight,

					// Factor of the display size that should remain empty around the content
					margin: 0.05,

					// Bounds for smallest/largest possible scale to apply to content
					minScale: 0.2,
					maxScale: 1.0

				});


				/*
				 <div class="reveal">

				 <div class="slides">

				 <section>
				 <h2>Barebones Presentation</h2>
				 <p>This example contains the bare minimum includes and markup required to run a reveal.js presentation.</p>
				 </section>

				 <section>
				 <h2>No Theme</h2>
				 <p>There's no theme included, so it will fall back on browser defaults.</p>
				 </section>

				 </div>

				 </div>

				 <script src="../lib/js/head.min.js"></script>
				 <script src="../js/reveal.min.js"></script>

				 <script>

				 Reveal.initialize();

				 </script>
				 */
			});

		}




	},
	stop: function() {
		Reveal.removeEventListeners();
	}
});


var BROWSE_ITEMS_MAX_DISPLAYED = 75;


function renderItems(v, maxItems, perItems, preFilter) {
	var sort = $N.get('list-sort') || 'Recent';
	var scope = $N.get('list-scope') || 'Public';
	var semantic = $N.get('list-semantic') || 'Any';

	var rr = getRelevant(sort, scope, semantic, $N, maxItems, preFilter);
	var relevant = rr[0];
	var relevance = rr[1];

	var xxrr = [];
	for (var x = 0; x < relevant.length; x++) {
		xxrr.push([$N.getObject(relevant[x]), relevance[relevant[x]]]);
	}

	perItems($N, v, xxrr);

	relevant.length = relevance.length = xxrr.length = 0;

	/*var semanticFilter = $('<select><option>Any</option><option>Relevant</option></select>');
     semanticFilter.change(function() {
     var v = $(this).val();
     s.set('list-semantic', v);
     updateView();
     });
     semanticFilter.val(semantic);
     o.append(semanticFilter);

     var sortSelect = $('<select><option>Recent</option><option>Near</option><option>Spacetime</option></select>'); //<option>By Author</option>
     sortSelect.change(function() {
     var v = $(this).val();
     s.set('list-sort', v);
     updateView();
     });
     sortSelect.val(sort);
     o.append(sortSelect);*/

	/*
     var proxFilter = $('<select><option>Anywhere</option><option>Near 1km</option><option>Near 5km</option></select>');
     proxFilter.change(function() {
     requestUserSupport('Proximity Filter');
     });
     o.append(proxFilter);

     var timeFilter = $('<select><option>Anytime</option><option>Recent 1m</option><option>Recent 5m</option><option>Recent 30m</option><option>Recent 1h</option><option>Recent 24h</option></select>');
     timeFilter.change(function() {
     requestUserSupport('Time Filter');
     });
     o.append(timeFilter);
     */
	/*
     var authorFilter = $('<select><option>Public</option><option>Mine</option><option>Others</option></select>');
     authorFilter.change(function() {
     var v = $(this).val();
     s.set('list-scope', v);
     updateView();
     });
     authorFilter.val(scope);
     o.append(authorFilter);
     */

}


function renderBrowse(v, cssClass, afterCreated, filterEach) {
	renderItems(v, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
		var elements = [];
		for (var i = 0; i < xxrr.length; i++) {
			var x = xxrr[i][0];
			var o = newObjectView(x, {
				//onRemoved: function() {        },
				scale: xxrr[i][1],
				depthRemaining: 2,
				startMinimized: (xxrr.length > 1 ? true : false)
			});
			if (filterEach)
				o = filterEach(o);
			elements.push(o);

			if (cssClass)
				o.addClass(cssClass(xxrr.length));
		}

		v.append(elements);

		if (afterCreated)
			afterCreated(v, xxrr.length);

		elements = null;
	});
	v = null;
}

function renderBrowseList(v) {
	renderBrowse(v, function(numitems) {
		return 'objectListItem';
	});
	v = null;
}

function renderBrowseGrid3(v) {
	renderBrowse(v, function(numitems) {
			if (numitems > 2)
				return 'objectGridItem3 tiled';
			if (numitems > 1)
				return 'objectGridItem2 tiled';
			return 'objectListItem';
		}, reflowView,
		function(w) {
			return newDiv().append(w);
		});
	v = null;
}

function renderBrowseGrid2(v) {
	renderBrowse(v, function(numitems) {
			if (numitems > 1)
				return 'objectGridItem2 tiled';
			return 'objectListItem';
		}, reflowView,
		function(w) {
			return newDiv().append(w);
		});
	v = null;
}



function newListView(v) {

	var listRenderer;

	listRenderer = renderBrowseList;

	var submenu = $('#ViewMenu');
	var modeSelect = $('<select/>').appendTo(submenu);

	var gridOption = '<option value="grid3">Grid x3</option>';
	var grid2Option = '<option value="grid2">Grid x2</option>';
	var listOption = '<option value="list">List</option>';

	modeSelect.append(listOption, gridOption, grid2Option);

	modeSelect.append('<option value="slides">Slides</option>');
	modeSelect.change(function() {
		var v = $(this).val();
		if (v === 'list')
			listRenderer = renderBrowseList;
		else if (v === 'grid3')
			listRenderer = renderBrowseGrid3;
		else if (v === 'grid2')
			listRenderer = renderBrowseGrid2;
		else if (v === 'slides')
			listRenderer = renderBrowseSlides;
		update();
	});


	function updateFont(s) {
		var vp = parseInt((0.15 + (s / 16.0)) * 100);
		v.css('font-size', vp + '%');
	}

	var textsizeSlider = $('<input type="range" name="points" min="1" value="16" max="32">');
	textsizeSlider.change(function(x) {
		updateFont($(this).val());
		if ((listRenderer === renderBrowseGrid2) || (listRenderer === renderBrowseGrid3)) {
			reflowView();
		}
	});

	textsizeSlider.change();
	submenu.append(textsizeSlider);


	//var actionMenu = $('');
	//submenu.append(actionMenu);

	function update() {
		v.empty();

		listRenderer(v);

		refreshActionContext();
	}
	update();

	listRenderer.onChange = update;
	listRenderer.destroy = function() {
		listRenderer = null;
		v = null;
	};

	return listRenderer;
}
