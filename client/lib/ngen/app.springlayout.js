window.app = window.app || {};

(function(ns){
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    springlayout function
    based on http://snipplr.com/view/1950/graph-javascript-framework-version-001/
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var springlayout = function() {
        var that;
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = {};
        that.creator = [].concat(arguments.caller, that.creator);
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _iterations = 600;
        var attraction = 1.5;
        var repulsion = 2.0;
        
        var _maxRepulsiveForceDistance = 0.6;
        var speed = 0.01;
        var _maxVertexMovement = 0.01;
        
        var prepareNodes = function(nodes, edges) {
            var len = nodes.length;
            for (var x = 0; x < len; x++) {
                var node = nodes[x];
                
                node.__x = 0;
                node.__y = 0;
                node.__forceX = 0;
                node.__forceY = 0;
            }
        };
        
        var layoutRepulsive = function(node1, node2) {
            var dx = node2.__x - node1.__x;
            var dy = node2.__y - node1.__y;
            var d2 = dx * dx + dy * dy;
            
            if( d2 < 0.01) {
                dx = 0.1 * Math.random() + 0.1;
                dy = 0.1 * Math.random() + 0.1;
                var d2 = dx * dx + dy * dy;
            }
            
            var d = Math.sqrt(d2);
            if (d < _maxRepulsiveForceDistance) {
                var repulsiveForce = repulsion * repulsion / d;
                node2.__forceX += repulsiveForce * dx / d;
                node2.__forceY += repulsiveForce * dy / d;
                node1.__forceX -= repulsiveForce * dx / d;
                node1.__forceY -= repulsiveForce * dy / d;
            }
        };
        
        var layoutAttractive = function(edge) {
            var node1 = edge.source;
            var node2 = edge.target;

            var dx = node2.__x - node1.__x;
            var dy = node2.__y - node1.__y;
            var d2 = dx * dx + dy * dy;
            if (d2 < 0.01) {
                    dx = 0.1 * Math.random() + 0.1;
                    dy = 0.1 * Math.random() + 0.1;
                    var d2 = dx * dx + dy * dy;
            }
            
            var d = Math.sqrt(d2);
            if (d > _maxRepulsiveForceDistance) {
                d = _maxRepulsiveForceDistance;
                d2 = d * d;
            }
            
            var attractiveForce = (d2 - repulsion * repulsion) / repulsion;
            
            if (edge.weight == undefined || edge.weight < 1) edge.weight = 1;
            attractiveForce *= attraction * Math.log(edge.weight) * 0.5 + 1;

            node2.__forceX -= attractiveForce * dx / d;
            node2.__forceY -= attractiveForce * dy / d;
            node1.__forceX += attractiveForce * dx / d;
            node1.__forceY += attractiveForce * dy / d;
        };
        
        var layoutIteration = function(nodes, edges) {
                    	
            // forces on nodes due to node-node repulsions
            var len = nodes.length;
            for (var i = 0; i < len; i++) {
                var node1 = nodes[i];
                for (var j = i + 1; j < len; j++) {
                    var node2 = nodes[j];                    
                    layoutRepulsive(node1, node2);
                }
            }
            
            // Forces on nodes due to edge attractions
            var len = edges.length;
            for (var i = 0; i < len; i++) {
                var edge = edges[i];
                layoutAttractive(edge);
            }
            
            // Move by the given force
            var len = nodes.length;
            for (var i = 0; i < len; i++) {
                var node = nodes[i];
                
                var fixedX = false, fixedY = false;
                
                if (node.originalEntity!=undefined) {
                	if (node.originalEntity.fixedX!=undefined) {
                		node.__x = node.originalEntity.fixedX;
                		fixedX = true;
                	}
                	if (node.originalEntity.fixed!=undefined) {
		                node.__x = node.originalEntity.fixed[0];
		                node.__y = node.originalEntity.fixed[1];               
                		fixedX = true;
                		fixedY = true;
                	}                
                }
                if ((!fixedX) || (!fixedY)) {
	                var xmove = speed * node.__forceX;
	                var ymove = speed * node.__forceY;
	                
	                var max = _maxVertexMovement;
	                if (xmove > max) xmove = max;
	                if (xmove < -max) xmove = -max;
	                if (ymove > max) ymove = max;
	                if (ymove < -max) ymove = -max;
	                
	                if (!fixedX)
	                	node.__x += xmove;
	                if (!fixedY)
	                	node.__y += ymove;
	                
	                node.__forceX = 0;
	                node.__forceY = 0;
                }
            }
        };
        
        var layoutCalcBounds = function(nodes) {
            /*var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
            
            var len = nodes.length;
            for (var i = 0; i < len; i++) {
                var node = nodes[i];
                var x = node.__x;
                var y = node.__y;

                if(x > maxx) maxx = x;
                if(x < minx) minx = x;
                if(y > maxy) maxy = y;
                if(y < miny) miny = y;
            }
            
            return {
                minX : minx,
                maxX : maxx,
                minY : miny,
                maxY : maxy
            };*/
            return {
                minX : -1,
                maxX : 1,
                minY : -1,
                maxY : 1
            };

        };
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.calculate = function(nodes, edges, iterations) {
            
            var n = [];
            var len = nodes.length;
            for (var i = 0; i < len; i++) {
                var node = nodes[i];
                if (node.visible) {
                    var mod = Object.create(node);
                    mod.originalEntity = node;
                    n.push(mod);
                }
            };
            nodes = n;
            
            var e = [];
            var len = edges.length;
            for (var i = 0; i < len; i++) {
                var edge = edges[i];
                if (edge.source && edge.source.visible && edge.target && edge.target.visible) {
                    var mod = Object.create(edge);
                    mod.originalEntity = edge;
                    e.push(mod);
                }
            };
            edges = e;
            
            iterations = iterations || _iterations;
            prepareNodes(nodes, edges);
            
            for (var i = 0; i < iterations; i++) {
                layoutIteration(nodes, edges);
            }
            
            var len = nodes.length;
            for (var x = 0; x < len; x++) {
                var node = nodes[x];
                delete node.__forceX;
                delete node.__forceY;
            }
            
            var layout = layoutCalcBounds(nodes);
            
            return {
                layout : layout,
                nodes : nodes,
                edges : edges
            };
        };
        
        that.translate = function(calc, width, height, radius) {
            var minx = calc.layout.minX;
            var miny = calc.layout.minY;
            var maxx = calc.layout.maxX;
            var maxy = calc.layout.maxY;
            
            var factorX = (width - 2 * radius) / (maxx - minx);
            var factorY = (height - 2 * radius) / (maxy - miny);
            
            var len = calc.nodes.length;
            for (var i = 0; i < len; i++) {
                var node = calc.nodes[i];
                node.__x = (node.__x - minx) * factorX + radius;
                node.__y = (node.__y - miny) * factorY + radius;
            }
            
            calc.layout = layoutCalcBounds(calc.nodes);
        };
        
        return that;
    };
    
    ns.springlayout = springlayout();
        
})(window.app);
