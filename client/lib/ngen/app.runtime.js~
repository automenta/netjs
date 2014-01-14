window.app = window.app || {};

(function(ns){


    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    runtime constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var runtime = function(graph) {
        var that;
    	

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = ns.eventful();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _mouse = null;
        var _keyboard = null;

        var positionEntities = function() {
            var nodes = ns.world.entities.nodes;
            if (nodes.length == 0) return;

            var edges = ns.world.entities.edges;

            var view = nodes[0].view;

            // distribute them over the canvas
            var result = ns.springlayout.calculate(nodes, edges, 622);

            ns.springlayout.translate(result,
                ns.world.window.width / view.zoom,
                ns.world.window.height / view.zoom,
                nodes[0].width);

            app.each(result.nodes, function(){
                var node = this.originalEntity;
                var x = this.__x - view.x;
                var y = this.__y - view.y;

                var tx = x;
                var ty = y;
                var ticks = Math.floor(250 / 20); // assuming 30ms per tick

                var tdx = x - node.x;
                var ix = tdx / ticks;

                var tdy = y - node.y;
                var iy = tdy / ticks;

                ns.scheduler.addTask({
                    name : 'initialmove-' + node.id,
                    type : 'initialmove',
                    exec : function() {
                        var x = node.x;
                        var y = node.y;

                        if (this.ticks == ticks) return false;

                        x += ix;
                        y += iy;

                        node.setPosition(x, y);
                    }
                });
            });

            // we create a tail that checks if all are done, just to try out how it works...
            ns.scheduler.addTask({
                name : 'initialmove-tail',
                type : 'tails',
                skip : 10, // ease the cpu a bit and skip some ticks
                exec : function() {
                    var tasks = ns.scheduler.getTasksByType('initialmove');
                    if (tasks.length == 0) {
                        return false;
                    }
                }
            });
        };

        
        var graph = { };
        
        var buildEntitiesFromModel = function(zIndex) {
        	
            var nodes = ns.world.entities.nodes;
            var view = ns.world.views.graph;
            var layer = ns.world.layers[1];

            var findNodeById = function(id) {
                var found = null;
                app.each(nodes, function(){
                    if (this.id == id) {
                        found = this;
                        return false;
                    }
                });
                return found;
            };

            // create nodes
            app.each(graph, function(i){
                if (this.type == 1) {
                    var node = ns.entities.circle();
                } else {
                    var node = ns.entities.square();
                }

                node.__model = this;
                node.id = this.id;
                node.label = this.label || ('node ' + this.id);
                node.setPosition(ns.world.window.width / 2, ns.world.window.height / 2);
                node.fixed = this.fixed;
                node.fixedX = this.fixedX;
                
                ns.world.registerEntity(node, view, layer);
            });

            // set properties and create edges
            var z = zIndex || 1;
            var zstep = 1 / (nodes.length * 1.5);
            app.each(nodes, function(){

                if (this.__model.outsources) {

                    var self = this;
                    app.each(this.__model.outsources, function(){

                        var target = findNodeById(this.id);
                        if (!target) return true;

                        var edge = ns.entities.edge({source: self, target: target, weight : this.weight || 1});
                        ns.world.registerEntity(edge, view, layer);
                    });
                }

                this.__model = null;
                delete this.__model;

                this.z = z;
                z += zstep;
            });

            positionEntities.apply(this);
        };

        var setupEntities = function() {
            ns.world.clearEntityRegistry();

            ns.world.layers.push(ns.layer({frozen : true}));
            ns.world.layers.push(ns.layer());

            ns.world.views.background = ns.view();
            ns.world.views.tools = ns.view();
            ns.world.views.graph = ns.view();
            //ns.world.views.graph.zoom = 0;

            var bg = ns.entities.background();
            ns.world.registerEntity(bg, ns.world.views.background, ns.world.layers[0]);

            var tools = ns.entities.tools();
            tools.init();

            buildEntitiesFromModel.apply(this, [1]);

            app.details.init(graph);
            app.filter.init(graph);
            app.search.init(graph);
        };

        var setupHIDHandling = function() {
            _mouse = app.hid.mouse;
            _mouse.init({elements : ns.renderer.getLayerElements()});

            var dragging = false;
            var mousedown = false;
            var lastdragX = 0;
            var lastdragY = 0;

            var mousedownEntity = null;
            var mousemoveEntity = null;
            var mouseupEntity = null;

            var button = null;

            /*var cursor = ns.entities.company();
            cursor.setBounds(30, 30);
            cursor.real = false;
            ns.runtime.registerEntity(cursor);*/

            
            _mouse.addEventListener('mousemove', function(e){

                var ent = mousemoveEntity = ns.world.getEntityByWindowCoord(e.pageX, e.pageY);
                if (ent && !ent.isDragable) ent = mousemoveEntity = null;

                if (mousedown && !dragging) {
                    dragging = true;

                    if (mousedownEntity) {
                        mousedownEntity.triggerEvent('dragstart', ns.world.getViewCoord(e.pageX, e.pageY, mousedownEntity.view));
                        ns.world.reportActivity();

                        lastdragX = e.pageX;
                        lastdragY = e.pageY;

                    } else {

                        //console.info('regular drag start');
                        lastdragX = e.pageX;
                        lastdragY = e.pageY;
                    }


                } else if (mousedown && dragging) {

                    if (mousedownEntity) {
                        mousedownEntity.triggerEvent('drag', ns.world.getViewCoord(e.pageX, e.pageY, mousedownEntity.view));
                        ns.world.reportActivity();

                    } else {
                        //console.info('regular drag');

                        if (button == 1) {
                            var last = ns.world.getViewCoord(lastdragX, lastdragY, ns.world.views.graph);
                            var curr = ns.world.getViewCoord(e.pageX, e.pageY, ns.world.views.graph);

                            ns.world.views.graph.x += (curr.x - last.x);
                            ns.world.views.graph.y += (curr.y - last.y);
                            ns.world.reportActivity();
                        }
                    }

                    lastdragX = e.pageX;
                    lastdragY = e.pageY;

                } else if (!mousedown && !dragging) {
                    if (ent) {
                        ent.triggerEvent('mouseover', ns.world.getViewCoord(e.pageX, e.pageY, ent.view));
                        ns.world.reportActivity();
                    }
                }

                return false;
            }, true);

            _mouse.addEventListener('mousedown', function(e){
                //console.dir(e);
                mousedown = true;

                var ent = mousedownEntity = ns.world.getEntityByWindowCoord(e.pageX, e.pageY);
                //console.dir(ent);

                if (ent && !ent.isDragable) ent = mousedownEntity = null;

                button = e.which;
                //_renderer.update();
                if (button == 3) return false;
            }, true);

            _mouse.addEventListener('mouseup', function(e){
                mousedown = false;

                var ent = mouseupEntity = ns.world.getEntityByWindowCoord(e.pageX, e.pageY);
                if (ent && !ent.isDragable) ent = mouseupEntity = null;

                if (ent && !ent.isDragable) ent = mouseupEntity = null;

                if (ent && !dragging && mousedownEntity == mouseupEntity) {
                    ent.triggerEvent('click', ns.world.getViewCoord(e.pageX, e.pageY, ent.view));

                } else if (ent && dragging && mousedownEntity == mouseupEntity) {
                    ent.triggerEvent('dragend', ns.world.getViewCoord(e.pageX, e.pageY, ent.view));

                } else if (dragging) {
                    //console.info('regular dragend');
                }

                dragging = false;
                button = null;

                ns.world.reportActivity();
            }, true);
        };
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.renderer = null;
        that.selectedEntity = null;

        that.requestEntitySelection = function(entity) {
            if (this.selectedEntity) this.selectedEntity.deselect();
            this.selectedEntity = entity;
            entity.visible = true;
            entity.select();
            this.triggerEvent('entityselected', {entity: entity});

            var e = entity;
            var end = ns.world.getViewCoord(ns.world.window.width / 2, ns.world.window.height / 2, entity.view);
            var tx = end.x;
            var ty = end.y;

            var ticks = Math.floor(200 / 20); // assuming 30ms per tick

            var tdx = tx - entity.x;
            var ix = tdx / ticks;

            var tdy = ty - entity.y;
            var iy = tdy / ticks;

            ns.scheduler.addTask({
                name : 'selectedentitymove-' + e.id,
                type : 'selectedentitymove',
                exec : function() {
                    var x = e.view.x;
                    var y = e.view.y;

                    if (this.ticks == ticks) return false;

                    x += ix;
                    y += iy;

                    e.view.x = x;
                    e.view.y = y;

                    ns.world.reportActivity();
                }
            });
        };

        that.requestEntityDeselection = function(entity) {
            entity.deselect();
            if (entity == this.selectedEntity) {
                this.triggerEvent('entitydeselected', {entity: entity});
                this.selectedEntity = null;
            }
        };

        that.zoom = function(entities, speed) {
            var found = entities || ns.world.entities.nodes;
            var len = found.length;
            if (len == 0) {
                found = ns.world.entities.nodes;
                len = found.length;
            }

            var running = ns.scheduler.getTaskByName('zoom-view-mod');
            if (running) ns.scheduler.stopTask(running);

            var view = found[0].view;
            var origx = view.x;
            var origy = view.y;
            var origs = view.zoom;

            view.zoom = 1;

            var minx = Infinity, maxx = Infinity, miny = Infinity, maxy = Infinity;

            for (var i = 0; i < len; i++) {
                var node = found[i];
                var nc = ns.world.getWindowCoord(node.x, node.y, node.view);

                if (minx == Infinity || minx > nc.x) minx = nc.x;
                if (maxx == Infinity || maxx < nc.x) maxx = nc.x;
                if (miny == Infinity || miny > nc.y) miny = nc.y;
                if (maxy == Infinity || maxy < nc.y) maxy = nc.y;
            }

            //console.info('minx' + minx);
            //console.info('maxx' + maxx);

            var margin = found[0].width * 2;

            var viewc = ns.world.getViewCoord(minx - margin, miny - margin, view);
            var viewx = -viewc.x;
            var viewy = -viewc.y;

            var w = maxx - minx;
            if (w == 0) w = 2 * margin;
            var h = maxy - miny;
            if (h == 0) h = 2 * margin;

            var availx = ns.world.window.width - 2 * margin;
            var availy = ns.world.window.height - 2 * margin;
            var zoomx = availx / w;
            var zoomy = availy / h;
            var zoom = zoomx > zoomy ? zoomy : zoomx;

            view.zoom = origs;

            var dx = viewx - view.x;
            var dy = viewy - view.y;
            var ds = zoom - view.zoom;

            var duration = speed || 30;
            var stepx = dx / duration;
            var stepy = dy / duration;
            var steps = ds / duration;

            ns.scheduler.addTask({
                name : 'zoom-view-mod',
                type : 'zoom-view-mod',
                exec : function() {
                    view.x += stepx;
                    view.y += stepy;

                    var c1 = ns.world.getViewCoord(0, 0, view);
                    view.zoom += steps;

                    var tools = ns.world.entities.tools[0];
                    if (tools) {
                    	tools.zoomControl.setZoom(view.zoom);
                    }

                    
                    var c2 = ns.world.getViewCoord(0, 0, view);

                    var dx = c2.x - c1.x;
                    var dy = c2.y - c1.y;

                    view.x += dx;
                    view.y += dy;

                    if (this.ticks >= duration) return false;
                }
            });
        };

        that.init = function(element) {

            var that = this;
            var updateDim = function() {
                var w = $(window).width();
                var h = $(window).height();

                ns.renderer.setSize(w, h);
                ns.world.setWindowSize(w, h);

                var bg = ns.world.layers[0];
                if (bg) bg.frozen = false;

                ns.renderer.update();

                if (bg) bg.frozen = true;
            };

            /* on resize we do the updateDim twice, because the browser might
            be having scrollbars when making the window smaller */
            $(window).bind('resize', function(){updateDim();updateDim();});

            updateDim();
            setupEntities.apply(this);

            ns.renderer.world = ns.world;
            ns.renderer.init();

            setupHIDHandling.apply(this);
            updateDim();
            

        };
        
        var interval = null;
        
        that.stop = function() {
        	if (interval!=null)
        		clearInterval(interval);
        }

        that.start = function(g) {
        	
        	graph = g;
        	
        	
            if ($.browser.msie) {
                $(".no-msie").show();
                return;
            }

            this.init();

            var that = this;
            interval = window.setInterval(function(){
                var active = false;
                if (ns.scheduler.tasks.length > 0 ||
                    (ns.world.lastActivity - ns.renderer.lastDraw) > 0
                    ) active = true;

                ns.scheduler.tick();

                if (active) {
		    //positionEntities.apply(this);
                    ns.renderer.update();
                }

            }, 20);
            return this;

        };

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    ns.runtime singleton
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.runtime = runtime();

    //window.graph2d = graph2d;
    
})(window.app);
