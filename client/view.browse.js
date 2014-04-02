var BROWSE_ITEMS_MAX_DISPLAYED = 75;

function newTagCloud(target, onChanged) {
    var tagcloud = newDiv();
    target.append(tagcloud);


    function updateTagCloud() {
        var tagcount = $N.getTagCount();

        tagcloud.html('');

        for (var k in tagcount) {
            var ti = tagcount[k];

            var t = $N.tag(k);

            var name;
            if (t != undefined)
                name = t.name;
            else
                name = k;

            var d = $('<div/>');

            var ab;

            function toggleTag(x, elem) {
                return function() {
                    if (browseTagFilters[x]) {
                        delete browseTagFilters[x];
                        elem.css('opacity', 0.5);
                    }
                    else {
                        browseTagFilters[x] = true;
                        elem.css('opacity', 1.0);
                    }
                    onChanged();
                }
            }

            if (t != undefined)
                ab = newTagButton(t, toggleTag(k, d));
            else {
                (function() {
                    ab = $('<a href="#">' + name + '</a>');
                    var tt = toggleTag(k, d);
                    ab.click(function() {
                        tt();
                        return false;
                    });
                })();
            }


            d.append(ab);

            d.css('font-size', 100.0 * (1.0 + Math.log(ti + 1)) * 0.5 + '%');
            d.css('float', 'left');

            if (!browseTagFilters[k]) {
                d.css('opacity', 0.5);
            }

            tagcloud.append(d);

        }

    }

    updateTagCloud();

    return {
        update: updateTagCloud
    };
}

function renderItems(v, maxItems, perItems) {
    var sort = $N.get('list-sort') || 'Recent';
    var scope = $N.get('list-scope') || 'Public';
    var semantic = $N.get('list-semantic') || 'Any';

    var rr = getRelevant(sort, scope, semantic, self, maxItems);
    var relevant = rr[0];
    var relevance = rr[1];

    var xxrr = [];
    for (var x = 0; x < relevant.length; x++) {
        var xx = $N.getObject(relevant[x]);
        var rr = relevance[relevant[x]];
        xxrr.push([xx, rr]);
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


function renderBrowse(v, cssClass, afterCreated) {
    renderItems(v, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
        var elements = [];
        for (var i = 0; i < xxrr.length; i++) {
            var x = xxrr[i][0];
            var o = newObjectSummary(x, {
                onRemoved: function() {        },
                scale: xxrr[i][1],
                depthRemaining: 1,
            });
            if (cssClass)
                o.addClass(cssClass);
            elements.push(o);
        }
        v.append(elements);

        if (afterCreated)
            afterCreated(v);

        $('body').timeago('refresh');
    });
}

function freetileView() {
    $('#View').freetile({
        callback: function() {
            $('#View').css('height', 'auto');
        }
    });
}

function renderBrowseList(v) {
    renderBrowse(v, 'objectListItem', function(v) {
    });
}
function renderBrowseGrid(v) {
    renderBrowse(v, 'objectGridItem', function(v) {
        freetileView();
    });
}


function renderBrowseSlides(vv, slideControls) {

    var u = $('<div class="reveal"></div>');
    var v = $('<div class="slides"></div>');
    v.appendTo(u);
    vv.append(u);

    later(function() {

        renderItems(v, BROWSE_ITEMS_MAX_DISPLAYED, function(s, v, xxrr) {
            var elements = [];
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];

                var o = newObjectSummary(x, {
                    onRemoved: function() {
                    },
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
                {src: '/lib/reveal.js/lib/js/classList.js', condition: function() {
                        return !document.body.classList;
                    }},
                // Interpret Markdown in <section> elements
                {src: '/lib/reveal.js/plugin/markdown/marked.js', condition: function() {
                        return !!document.querySelector('[data-markdown]');
                    }},
                {src: '/lib/reveal.js/plugin/markdown/markdown.js', condition: function() {
                        return !!document.querySelector('[data-markdown]');
                    }},
                // Syntax highlight for <code> elements
                //{ src: '/lib/reveal.js/plugin/highlight/highlight.js', async: true, callback: function() { hljs.initHighlightingOnLoad(); } },

                // Zoom in and out with Alt+click
                {src: '/lib/reveal.js/plugin/zoom-js/zoom.js', async: true, condition: function() {
                        return !!document.body.classList;
                    }},
                // Speaker notes
                //{ src: '/lib/reveal.js/plugin/notes/notes.js', async: true, condition: function() { return !!document.body.classList; } },

                // Remote control your reveal.js presentation using a touch device
                {src: '/lib/reveal.js/plugin/remotes/remotes.js', async: true, condition: function() {
                        return !!document.body.classList;
                    }},
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


function newListView(v) {

    var listRenderer = renderBrowseGrid;

    var submenu = $('.toggle-submenu');
    var modeSelect = $('<select/>').appendTo(submenu);
    modeSelect.append('<option value="grid">Grid</option>');
    modeSelect.append('<option value="list">List</option>');
    modeSelect.append('<option value="slides">Slides</option>');
    modeSelect.change(function() {
        var v = $(this).val();
        if (v == 'list')
            listRenderer = renderBrowseList;
        else if (v == 'grid')
            listRenderer = renderBrowseGrid;
        else if (v == 'slides')
            listRenderer = renderBrowseSlides;
        update();
    });


    function updateFont(s) {
        var vp = parseInt((0.15 + (s / 16.0)) * 100)
        v.css('font-size', vp + '%');
    }

    var slideControls = newDiv();
    var textsizeSlider = $('<input type="range" name="points" min="1" value="16" max="32">');
    textsizeSlider.change(function(x) {
        updateFont($(this).val());
        if (listRenderer === renderBrowseGrid) {
            freetileView();
        }
    });
    slideControls.append(textsizeSlider);

    textsizeSlider.change();
    submenu.append(slideControls);

    //var actionMenu = $('');
    //submenu.append(actionMenu);

    function update() {
        v.html('');

        listRenderer(v, slideControls);

        refreshActionContext();
    }
    update();
}


