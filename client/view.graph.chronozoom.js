var graphUpdatePeriod = 150; //in ms
var layoutFPS = 20;

function renderGraph(s, o, v, withGraph) {
    
    var ee = uuid();
    var r = $('<div style="width: 100%; height: 98%; overflow: hidden; background-color: transparent; border: none;);"/>').attr('id', ee);
    r.appendTo(v);
    
    var l2 = $('<div id="layer2"></div>');
    r.append(l2);
    var l1 = $('<div id="layer1"></div>');
    r.append(l1);
    
    later(function() {
        initCZ(function() {
        	
    		//var path = '/demo/enformable/enformable-fukushima-timeline.json';
    		//$.getJSON(path, function(data) {
    		graphCZ(r, function(root) {	
                var width = 1000;
                var height = 1000;
                
                var sys = arbor.ParticleSystem(1500, 762, 0.5);                
                sys.screenPadding(20);
                sys.screenSize(width, height);
                sys.parameters({"fps":layoutFPS, "repulsion":3600,"friction":0.5,"stiffness":25,"gravity":false});
                
                
                sys.start();
                
                var nodeShapes = { };
                var edgeShapes = { };
                
                var that = { };
                
                function addNode(id, name, iconURL) {
                    if (!name)
                        name = id;
                        
                    var x = Math.random() * 400.0 - 200.0;  
                    var y = Math.random() * 400.0 - 200.0; 
                    
                    var shape = addRectangle(root, "layer1", id, x, y, 50, 30.9, { strokeStyle: 'white', lineWidth: 2, fillStyle: 'rgba(210,210,210,0.85)' });
                    
                    shape.reactsOnMouse = true;
                    shape.onmouseclick = function (e) {
                        newPopupObjectView(id);
                    };
                    shape.onmouseleave = function (e) {
                        this.settings.strokeStyle = 'white';
                        this.settings.lineWidth = 1;
                        this.vc.invalidate();
                        //isMovedOut = true;
                    };
                    shape.onmouseenter = function (e) {
                        this.settings.strokeStyle = 'green';
                        this.settings.lineWidth = 1;
                        this.vc.invalidate();
                        //isClicked = true;
                    };

                    
                    /*
                    shape.onmouseenter = function (e) { 
                        console.log('enter ' + id);
                    };*/
                        
                    //var circle = addCircle(shape, "layer2", id  + 'c', 0, 0, 23, { strokeStyle: 'white', lineWidth: 2, fillStyle: 'rgb(20,240,40)' }, true);
    
                    var fontSize = 6;
                    var text = addText(shape, "layer1", id + '_t', 0, 0, y, fontSize, _.string.truncate(name, 16), { fillStyle: 'black', fontName: 'Arial' }, undefined, true);
                    
                    text.offX = -25;
                    
                /*var rect = addRectangle(root, "layer1", "r", -100, -50, 200, 100, { strokeStyle: 'rgb(240,240,240)', lineWidth: 2, fillStyle: 'rgb(140,140,140)' });
                rect.reactsOnMouse = true;
                rect.onmouseclick = function(e) {
                    console.log('clicked rect');
                };
                setInterval(function() {
                    rect.height = (Math.random() + 0.5) * 10.0;
                    rect.vc.invalidate();
                }, 50);*/
                
                //var circle = addCircle(rect, "layer1", "c", 0, 0, 49, { strokeStyle: 'white', lineWidth: 2, fillStyle: 'rgb(20,40,240)' });
                    if (iconURL)
                        addImage(shape, "layer1", id + "_i", -25, -25, 50, 50, iconURL, function () { vc.virtualCanvas("invalidate"); });
                        
                //text = addText(image, "layer2", "t", -20, -20, 0, 8, "Hello World", { fillStyle: 'green', fontName: 'Calibri' });
    
                    nodeShapes[id] = shape;
                    sys.addNode(id);
                }
                that.addNode = addNode;
                
                function addEdge(edgeID, a, b) {
                    if (edgeShapes[edgeID])
                        return;
                        
                    var x = Math.random() * 400.0 - 200.0;  
                    var y = Math.random() * 400.0 - 200.0; 
                    var edgeWidth = 0.3;
                    
                    var line = addRectangle(root, "layer2", edgeID, x, y, edgeWidth, 15, { fillStyle: 'rgba(180,180,180,0.8)', angle: 0});
                    line.from = a;
                    line.to = b;
                    
                    edgeShapes[edgeID] = line;
                    sys.addEdge(a, b, { id: edgeID });
                    
                }
                that.addEdge = addEdge;
                
                function moveShape(s, x, y, angle) {
                    s.x = x;
                    
                    if (s.baseline)
                        s.baseline = y;
                    
                    s.y = y;
                                     
                    if (angle) {
                        s.settings.angle = angle;    
                    }
                    
                    for (var c = 0; c < s.children.length; c++) {
                        var sc = s.children[c];
                        var ox = sc.offX || 0;
                        var oy = sc.offY || 0;
                        moveShape(sc, x+ox, y+oy, angle);
                    }
                }
                
                var offsetX = width;
                var offsetY = height/2.0;
                
                var updater = setInterval(function() {
                    
                    if (!$('#' + ee).is(':visible')) { 
                        //STOP
                        clearInterval(updater);
                        sys.stop();
                        return;
                    }
                        
                    sys.eachNode(function(x, pi) {
                       var s = nodeShapes[x.name];                       
                       if (s) {
                           moveShape(s, pi.x-offsetX, pi.y-offsetY);
                       }
                    });
                    
                    sys.eachEdge(function(edge, p1, p2) {
                        var e = edgeShapes[edge.data.id];
                        if (e) {
                            var cx = 0.5 * (p1.x + p2.x) - offsetX;
                            var cy = 0.5 * (p1.y + p2.y) - offsetY;
                            
                            var dy = p2.y - p1.y;                            
                            var dx = p2.x - p1.x;
                            
                            var angle = Math.atan2( dy, dx );
                            
                            var dist = Math.sqrt( dy*dy + dx*dx );
                            
                            e.width = dist;
                            
                            moveShape(e, cx, cy, angle);
                        }
                    });
                    root.vc.invalidate();
                }, graphUpdatePeriod);
     
                that.visibleRegion = new VisibleRegion2d(-width/2.0, 0, 122.0 / 356.0);
                
                return that;
                
    		}, withGraph);								
    	});
        
    });

}



function renderGraphFocus(s, o, v) {
    renderGraph(s, o, v, function(g) {
        renderItems(s, o, v, 75, function(s, v, xxrr) {
            var tags = { };
            
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];
                g.addNode(x.id, x.name);
                
                var rtags = objTags(x);
                if (!rtags)
                    continue;
                for (var j = 0; j < rtags.length; j++) {
                    var tj = rtags[j];
                    var exists = tags[tj];
                    if (!exists) {
                        var ttj = s.tag(tj);
                        if (ttj) {           
                            g.addNode(tj, s.tag(tj).name, getTagIcon(tj));
                            tags[tj] = true;
                        }
                    }
                    g.addEdge(x.id+'_' + j, x.id, tj);
                }
            }
            
        });        
    });
}

var maxPermitedVerticalRange = { top: -10000000, bottom: 10000000 };


var _chronozoomloaded = false;

function initCZ(f) {
    if (_chronozoomloaded) {
        f();
    }
    else {
        _chronozoomloaded = true;

        var scripts = [ 
                       "/lib/chronozoom/scripts/rx.js",
                       "/lib/chronozoom/scripts/rx.jQuery.js",
                       "/lib/chronozoom/scripts/common.js",
                       "/lib/chronozoom/scripts/cz.settings.js",
                       "/lib/chronozoom/scripts/vccontent.js",
                       "/lib/chronozoom/scripts/viewport.js",
                       "/lib/chronozoom/scripts/virtualCanvas.js",
                       "/lib/chronozoom/scripts/mouseWheelPlugin.js",
                       "/lib/chronozoom/scripts/gestures.js",
                       "/lib/chronozoom/scripts/viewportAnimation.js",
                       "/lib/chronozoom/scripts/viewportController.js",

                       '/lib/arbor/arbor.js'
        ];
        
        loadCSS('/lib/chronozoom/css/cz.css');
        

        LazyLoad.js(scripts, f);

    }
	
}

var vc;
function graphCZ(canvasElement, init, withGraph) {
    /*
    pos = $("#pos");
    pos.css("position", "absolute");
    pos.css("top", (($(window).height() - pos.outerHeight()) / 2) + $(window).scrollTop() + "px");
    pos.css("left", (($(window).width() - pos.outerWidth()) / 2) + $(window).scrollLeft() + "px");
    */

    //vc = $("#" + canvasElement);
    vc = canvasElement;
    vc.virtualCanvas();

    var root = vc.virtualCanvas("getLayerContent");
    root.beginEdit();

    var graph = init(root);
    
    root.endEdit(true);

    var controller = new ViewportController(
                    function (visible) {
                        vc.virtualCanvas("setVisible", visible, controller.activeAnimation);
                    },
                    function () {
                        return vc.virtualCanvas("getViewport");
                    },
                    getGesturesStream(vc));

    vc.virtualCanvas("setVisible", graph.visibleRegion);
    /*if (graph.viewPort)
        vc.virtualCanvas("setViewport", graph.viewPort);    */
    

    updateLayout();
    
    if (withGraph)
        withGraph(graph);
    
}

$(window).bind('resize', function () {
    updateLayout();
});

function updateLayout() {
    //vc.css('height', (window.innerHeight - 250) + "px");
    if (vc)
        vc.virtualCanvas("updateViewport");
}
