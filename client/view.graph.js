var GRAPH_MAX_NODES = 75;
var layoutFPS = 30;
var graphUpdatePeriod = 1000 / layoutFPS; //in ms

var $s, theSlate;


function renderSlateGraph(s, o, v, withGraph) {
    
    var ee = uuid();
	var r = newDiv('"slateContainer"');
	r.attr('style', 'width:100%; height:100%;');	
	v.append(r);

	var controlpanel = newDiv();
	controlpanel.addClass('graphControlPanel');
	r.append(controlpanel);

	var l = newDiv('slate');
	r.append(l);
    
	function updateGraph() {
		later(function() {
		    initCZ(function() {
		    		
				$s = new Slatebox();
				theSlate = $s.slate({
					id: 'firstSlateExample' //slate with the same ids can collaborate together.
					, container: 'slate'
					, viewPort: { width: 50000, height: 50000, allowDrag: true, left: 5000, top: 5000 }
					, showZoom: true
					, showBirdsEye: false
					, showStatus: false
					, showMultiSelect: false
					, onSlateChanged: function (subscriberCount) {
						//upd();
					}
					, collaboration: {
						allow: false
					}
				}).canvas.init({ imageFolder: "/lib/slateboxjs/cursors/" });

				graphCZ(r, function(root) {	
		            var width = 1400;
		            var height = 1300;
					var layout = { };
		            
		            var sys = arbor.ParticleSystem(1500, 762, 0.5);                
		            sys.screenPadding(20);
		            sys.screenSize(width, height);
		            sys.parameters({"fps":layoutFPS, "repulsion":4400,"friction":0.2,"stiffness":25,"gravity":false});
		            
					sys.stop();
		            
		            var nodeShapes = { }, nodeNodes = { };
		            var edgeShapes = { };
		            
		            
					layout.addNode = function (nodeID, shape) {
						nodeNodes[nodeID] = sys.addNode(nodeID);
						nodeShapes[nodeID] = shape;

					};
					layout.addEdge = function(from, to, edge) {
						sys.addEdge(from, to, edge);
					};

		            
		            var offsetX = width;
		            var offsetY = height/2.0;
		            var iterations = 0;
					var updater = null;

					var organize = $('<button>Organize</button>');

					var updateLayout = function() {
		                
						iterations--;

						//console.log('layout iterations remain', iterations);

		                if ((!l.is(':visible')) || (iterations == 0)) { 
		                    //STOP
		                    clearInterval(updater);
		                    sys.stop();
							organize.removeAttr('disabled');
							//console.log('layout stop');
		                    return;
		                }

		                sys.eachNode(function(x, pi) {
		                   var s = nodeShapes[x.name];                       
		                   if (s) {
								s.setPosition({
									x: pi.x + 5000,
									y: pi.y + 5000
								});
		                   }
		                });
		            };


				 	{
						organize.click(function() {
							organize.attr('disabled', 'true');
							iterations = 10;
							//console.log('layout start');
				            sys.start();
				            updater = setInterval(updateLayout, graphUpdatePeriod);
						});
						controlpanel.append(organize);
					}

					return layout;
		 
		            
				}, withGraph);		
						
			});
		    
		});
	}
	updateGraph();


}



function renderGraph(s, o, v) {

    renderSlateGraph(s, o, v, function(g) {
        renderItems(o, v, GRAPH_MAX_NODES, function(s, v, xxrr) {
            var tags = { };
            
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];

                g.addNode(x.id, { label: x.name || "" } );
                
                var rtags = objTags(x);

                if (!rtags) 
                    continue;

				if (x.author)
					rtags.push('Self-' + x.author);

				//add Tags (intensional inheritance)
                for (var j = 0; j < rtags.length; j++) {
                    var tj = rtags[j];
                    var exists = tags[tj];
                    if (!exists) {
                        var ttj = s.tag(tj) || s.object(tj) || null; // || { name: '<' + tj + '>' };
						if (!ttj)
							continue;

						var tagIcon = null;
						if (ttj)
							tagIcon = getTagIcon(tj);

						//see slatebox.node.js for options
                        g.addNode(tj, { 
							label: ttj.name||"",
							width: 150,
							height: 70,
							shape: 'ellipse',
							color: '#ddd',
							image: tagIcon ? (/*"url("*/  tagIcon /*+ ")"*/) : null,
							fontSize: 20,
							fontStyle: 'bold'
						});

                        tags[tj] = true;
                    }

					/*
						EDGE OPTIONS

				        , lineColor: option.lineColor || _self._.options.lineColor
				        , lineWidth: option.lineWidth || _self._.options.lineWidth
				        , lineOpacity: option.lineOpacity || _self._.options.lineOpacity
				        , blnStraight: option.isStraightLine || false
				        , showParentArrow: option.showParentArrow || false
				        , showChildArrow: option.showChildArrow || false
						option.editable //whether the edge can be modified
					*/
                    g.addEdge(x.id+'_' + j, x.id, tj, {
						isStraightLine: true,
						//lineColor: 'red',
					});
                }
            }
            
        });        
    });
}

function _label(t, maxlen) {
	if (t.length > maxlen)
		return t.substring(0, maxlen) + '..';
	return t;
}

function graphCZ(canvasElement, init, withGraph) {
	var layout = init(canvasElement);


    var log = [], startTime = Math.round(new Date().getTime() / 1000);

    /*function upd() {
        Slatebox.el("txtSlateJson").value = theSlate.exportJSON();
        Slatebox.el("txtSlateLastUpdated").innerHTML = "last updated <b>" + new Date().toString();
    };*/

    //this.paper.clear();
    theSlate.nodes.allNodes = [];


	//console.log(theSlate.zoomSlider);

	var zoomValue = 15000;
	var zoomDelta = 2500;
	var maxZoom = 200000;	//taken from Slatebox.slate.zoomSlider.js
	var minZoom = 6000; 

	function MouseWheelHandler(e) {

		// cross-browser wheel delta
		var e = window.event || e;
		var delta = Math.max(-1, Math.min(1, (e.wheelDelta || -e.detail)));
		if (delta < 0) {
			zoomValue += zoomDelta;
		}
		else {
			zoomValue -= zoomDelta;
		}
		if (zoomValue > maxZoom) zoomValue = maxZoom;
		if (zoomValue < minZoom) zoomValue = minZoom;
		theSlate.zoomSlider.set(zoomValue);

		return false;
	}

	var s = document.getElementById("slate");
	if (s.addEventListener) {
		s.addEventListener("mousewheel", MouseWheelHandler, false);
		s.addEventListener("DOMMouseScroll",MouseWheelHandler,false);
	}
	else s.attachEvent("onmousewheel", MouseWheelHandler);


	var _nodes =  [];
	var _edges = [];
	var nodeIndex = { };

    /*var _nodes = [
        $s.node({ id: 'first_node', text: 'drag', xPos: 5090, yPos: 5120, height: 40, width: 80, vectorPath: 'roundedrectangle', backgroundColor: '90-#ADD8C7-#59a989', lineColor: "green", lineWidth: 2, allowDrag: true, allowMenu: true, allowContext: true })
        , $s.node({ id: 'second_node', text: 'me', xPos: 5290, yPos: 5080, height: 40, width: 100, vectorPath: 'ellipse', backgroundColor: '90-#6A8FBD-#54709a', lineColor: "green", lineWidth: 4, allowDrag: true, allowMenu: true, allowContext: true })
        , $s.node({ id: 'third_node', text: 'around', xPos: 5260, yPos: 5305, height: 40, width: 80, vectorPath: 'rectangle', backgroundColor: '90-#756270-#6bb2ab', lineColor: "blue", lineWidth: 5, allowDrag: true, allowMenu: true, allowContext: true })
    ];*/

	var g = {
		addNode : function(id, n) {
			var x = 5000+Math.random() * 2000;
			var y = 5000+Math.random() * 2000;
			var nn = $s.node({ 
					id: id, 
					text: _label(n.label, 24), 
					xPos: x, yPos: y, 
					height: n.height||40, 
					width: n.width||80, 
					image: n.image || null,
					vectorPath: n.shape||'rectangle', 
					backgroundColor: n.color||'white', //'90-#ADD8C7-#59a989', 
					fontSize: n.fontSize,
					fontStyle: n.fontStyle,
					lineColor: "black", 
					lineWidth: 3, 
					allowDrag: true, 
					allowMenu: true, 
					allowContext: false });

			_nodes.push(nn);
			nodeIndex[id] = nn;
			layout.addNode(id, nn);
		},
		addEdge : function(e, from, to, options) {
			_edges.push( [ from, to, e, options] );
			layout.addEdge(from, to, { id: e } );
		}
	};

	if (withGraph)
		withGraph(g);

    theSlate.nodes.addRange(_nodes);
	for (var i = 0; i < _edges.length; i++) {
		var ee = _edges[i];
		var f = ee[0];
		var t = ee[1];
		var e = ee[2];
		var options = ee[3] || { };

		if (f==t)
			continue;

		if (!nodeIndex[t]) {
			//console.log('Missing node: ', t);
			continue;
		}
	

		if (nodeIndex[f]) {
			nodeIndex[f].relationships.addAssociation(nodeIndex[t], options);
		}
		else {
			//console.log('Edge missing node: ', f);
		}
	}

    theSlate.init();

}


var codeLoading = false;
var codeLoaded = false;

function initCZ(f) {
    if (codeLoaded) {
        f();
    }
    else {
		if (codeLoading)
			return;

		codeLoading = true;

        var scripts = [ 

			"/lib/slateboxjs/slatebox.js",
			"/lib/slateboxjs/slatebox.slate.js",
			"/lib/slateboxjs/slatebox.node.js",

			"/lib/slateboxjs/raphael/raphael.el.tooltip.js",
			"/lib/slateboxjs/raphael/raphael.el.loop.js",
			"/lib/slateboxjs/raphael/raphael.el.style.js",
			"/lib/slateboxjs/raphael/raphael.button.js",
			"/lib/slateboxjs/raphael/raphael.fn.connection.js",
			"/lib/slateboxjs/raphael/raphael.fn.objects.js",

			"/lib/slateboxjs/node/Slatebox.node.editor.js",
			"/lib/slateboxjs/node/Slatebox.node.shapes.js",
			"/lib/slateboxjs/node/Slatebox.node.menu.js",
			"/lib/slateboxjs/node/Slatebox.node.toolbar.js",
			"/lib/slateboxjs/node/Slatebox.node.context.js",
			"/lib/slateboxjs/node/Slatebox.node.colorpicker.js",
			"/lib/slateboxjs/node/Slatebox.node.links.js",
			"/lib/slateboxjs/node/Slatebox.node.connectors.js",
			"/lib/slateboxjs/node/Slatebox.node.relationships.js",
			"/lib/slateboxjs/node/Slatebox.node.images.js",
			"/lib/slateboxjs/node/Slatebox.node.template.js",
			"/lib/slateboxjs/node/Slatebox.node.resize.js",

			"/lib/slateboxjs/spinner.js",
			"/lib/slateboxjs/emile/emile.js",
			"/lib/slateboxjs/notify.js",

			"/lib/slateboxjs/slate/Slatebox.slate.canvas.js",
			"/lib/slateboxjs/slate/Slatebox.slate.message.js",
			"/lib/slateboxjs/slate/Slatebox.slate.multiselection.js",
			"/lib/slateboxjs/slate/Slatebox.slate.nodes.js",

			"/lib/slateboxjs/slate/Slatebox.slate.zoomSlider.js",
			"/lib/slateboxjs/slate/Slatebox.slate.keyboard.js",
			"/lib/slateboxjs/slate/Slatebox.slate.birdseye.js",

             '/lib/arbor/arbor.js'
        ];
        
        loadCSS('/lib/slateboxjs/example.css');        

		function ff() {
	        codeLoaded = true;
			f();
		}

        LazyLoad.js(scripts, ff);


    }
	
}

/*
$(window).bind('resize', function () {
    updateLayout();
});

function updateLayout() {
}
*/
