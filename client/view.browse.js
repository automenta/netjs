var BROWSE_ITEMS_MAX_DISPLAYED = 75;

function getRelevant(sort, scope, semantic, s, o, maxItems) { 

    var now = Date.now();
    var location = objSpacePointLatLng(s.myself());
    
    var relevance = { };
    var focus = s.focus();
	var focusWhen = objWhen(focus);

	if (focus) semantic = 'Relevant';
    
    var ii = _.keys($N.layer().include);
    var ee = _.keys($N.layer().exclude);
    
    for (var k in s.objects()) {
        
        var x = s.getObject(k);
        
        if (x.replyTo)
            continue;
        
        //TAG filter
        var allowed = true;
        var tags = objTags(x);
        {
            if (ii.length > 0) {
                allowed = false;
                for (var i = 0; i < ii.length; i++) {
                    var inc = ii[i];
                    if (_.contains(tags, inc)) {
                        allowed = true;
                        break;
                    }                    
                }
            }
            if (ee.length > 0) {
                for (var i = 0; i < ee.length; i++) {
                    var exc = ee[i];
                    if (_.contains(tags, exc)) {
                        allowed = false;
                        break;
                    }                    
                }            
            }
        }    
        
        if (!allowed)
            continue;
        
        //scope prefilter
        if (scope == 'Mine') {
            if (x.author != s.id())
                continue;
        }
        else if (scope == 'Others') {
            if (x.author == s.id())
                continue;                            
        }
        
        //sort
        var r = 1.0;                        
        if (sort == 'Recent') {
            var w = x.modifiedAt || x.createdAt || null;
            if (w == null) continue;
            var ageSeconds = Math.abs(now - w) / 1000.0;
            //r = Math.exp(-ageSeconds/10000.0);
            r = 1.0 / (1.0 + ageSeconds / 60.0);
        }
        else if (sort == 'Near') {
            
            if (!location) {
                continue;
            }
            
            var llx = objSpacePointLatLng(x);
            if (!llx) {
                continue;
            }
            
            var distance = geoDist(location, llx); //kilometers
            //r = Math.exp(-distance/10000.0);
            r = 1.0 / (1.0 + distance);
        }
		//DEPRECATED
        else if (sort == 'Spacetime') {
            var llx = objSpacePointLatLng(x);
            if ((!location) || (!llx) || (!x.when)) {
                continue;
            }   
            var timeDistance = Math.abs(now - x.when) / 1000.0; //seconds
            var spaceDistance = geoDist(location, llx) * 1000.0; //meters
            //r = Math.exp(-(timeDistance + spaceDistance)/10000.0);            
            r = 1.0 / (1.0 + ((timeDistance/60.0) + spaceDistance));
        }
        
        if (semantic == 'Relevant') { 
            if (focus) {
				if (focus.name) {
					var fn = focus.name.toLowerCase();

					var xn = (x.name||'');
					if (xn.toLowerCase) xn = xn.toLowerCase();

					if (xn.indexOf(fn)==-1)
						r = 0;
				}

				if (r > 0) {
					var ft = objTags(focus);
					if (ft.length > 0) {
					    var m = objTagRelevance(focus, x);
					    r *= m;
					}
				}
				if (r > 0) {
					if (focusWhen) {
						var f = focusWhen.from;
						var t = focusWhen.to;
						var wx = objWhen(x);
						if (typeof wx === 'number') {
							if (wx < f) r = 0;
							if (wx > t) r = 0;
							//console.log(wx, focusWhen);							
						}
					}
				}
            }
            else
                r = 0;
        }
        
        if (r > 0) {                                    
            relevance[k] = r;
        }
    }
    
    var relevant = _.keys(relevance);
    relevant.sort(function(a, b) {
	    return relevance[b] - relevance[a];
	});
    
    if (relevant.length > maxItems) {
        o.prepend('<span>Too many: 1..' + maxItems + ' of ' + relevant.length + '</span>');
    }
    else {
        
    }
    return [ _.first(relevant, maxItems), relevance ];
}

function renderItems(o, v, maxItems, perItems) {
    var sort = $N.get('list-sort') || 'Recent';
    var scope = $N.get('list-scope') || 'Public';
    var semantic = $N.get('list-semantic') || 'Any';
    
    var rr = getRelevant(sort, scope, semantic, self, o, maxItems);
    var relevant = rr[0];
    var relevance = rr[1];

    var xxrr = [];
	var objects = $N.objects();
    for (var x = 0; x < relevant.length; x++) {
        var xx = objects[relevant[x]];                        
        var rr =  relevance[relevant[x]];
        xxrr.push([xx,rr]);
    }
    perItems(self, v, xxrr);
    
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

function renderBrowseList(o, v, cssClass) {
    renderItems(o, v, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
        var elements = [];
        for (var i = 0; i < xxrr.length; i++) {
            var x = xxrr[i][0];
			var o = newObjectSummary(x, {
				onRemoved: function() { },
				scale: xxrr[i][1],
				depthRemaining: 1,
			});
			if (cssClass)
				o.addClass(cssClass);
            elements.push(o);
        }
        v.append(elements);
	    $('body').timeago('refresh');
    });   
}

function renderBrowseGrid(o, v) {
	renderBrowseList(o, v, 'objectGridItem');
    //http://masonry.desandro.com/docs/intro.html
    /*$(function() {
        vv.imagesLoaded(function(){
            vv.masonry({
                // options
                itemSelector: '.objectView',
                columnWidth: 350
            });//.masonry('reload');
        });
    });*/
}


function renderBrowseSlides(o, vv, slideControls) {

	var u = $('<div class="reveal"></div>');
	var v = $('<div class="slides"></div>');
	v.appendTo(u);
	vv.append(u);

	later(function() {

	  renderItems(o, v, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
				var elements = [];
				for (var i = 0; i < xxrr.length; i++) {
				    var x = xxrr[i][0];

				    var o = newObjectSummary(x, {
						onRemoved: function() { },
						scale: xxrr[i][1],
						depthRemaining: 1,
					});

					//<section>Single Horizontal Slide</section><section><section>Vertical Slide 1</section><section>Vertical Slide 2</section></section>
					var w = $('<section/>');
					w.append(o);
					v.append(w);
				}

			});

		Reveal.initialize({
			 dependencies: [
					// Cross-browser shim that fully implements classList - https://github.com/eligrey/classList.js/
					{ src: '/lib/reveal.js/lib/js/classList.js', condition: function() { return !document.body.classList; } },

					// Interpret Markdown in <section> elements
					{ src: '/lib/reveal.js/plugin/markdown/marked.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },
					{ src: '/lib/reveal.js/plugin/markdown/markdown.js', condition: function() { return !!document.querySelector( '[data-markdown]' ); } },

					// Syntax highlight for <code> elements
					//{ src: '/lib/reveal.js/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },

					// Zoom in and out with Alt+click
					{ src: '/lib/reveal.js/plugin/zoom-js/zoom.js', async: true, condition: function() { return !!document.body.classList; } },

					// Speaker notes
					//{ src: '/lib/reveal.js/plugin/notes/notes.js', async: true, condition: function() { return !!document.body.classList; } },

					// Remote control your reveal.js presentation using a touch device
					{ src: '/lib/reveal.js/plugin/remotes/remotes.js', async: true, condition: function() { return !!document.body.classList; } },

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
			transition: 'default', // default/cube/page/concave/zoom/linear/fade/none

			// Transition speed
			transitionSpeed: 'slow', // default/fast/slow

			// Transition style for full page backgrounds
			backgroundTransition: 'default', // default/linear/none,

			embedded: true

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


function renderList(s, o, v) {
	var listRenderer = renderBrowseList;

	var submenu = $('#toggle-submenu');
	var slidesButton = $('<button style="width: 100%" title="Slides">Slides</button>');
	slidesButton.click(function() {
		listRenderer = renderBrowseSlides;
		update();
	});
	var listButton = $('<button style="width: 100%" title="List">List</button>');
	listButton.click(function() {
		listRenderer = renderBrowseList;
		update();
	});
	var gridButton = $('<button style="width: 100%" title="Grid">Grid</button>');
	gridButton.click(function() {
		listRenderer = renderBrowseGrid;
		update();
	});

	submenu.append(slidesButton);
	submenu.append(listButton);
	submenu.append(gridButton);

	
	function updateFont(s) {
		var vp = parseInt((0.15 + (s/16.0)) * 100)		
		v.css('font-size', vp + '%');
	}

	var slideControls = newDiv();
	var textsizeSlider = $('<input type="range" name="points" min="1" value="16" max="32">');
	textsizeSlider.change(function(x) {
		updateFont($(this).val());
	});
	slideControls.append(textsizeSlider);

	textsizeSlider.change();

	submenu.append(slideControls);

	//var actionMenu = $('');
	//submenu.append(actionMenu);

	function update() {
		v.html('');
		listRenderer(o, v, slideControls);
		refreshActionContext();
	}
	update();
}


