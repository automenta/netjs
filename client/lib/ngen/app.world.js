window.app = window.app || {};

(function(ns){
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var view = function(spec) {
        var that, spec = spec || {};
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = {};
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.x = spec.x || 0;
        that.y = spec.y || 0;
        that.zoom = spec.zoom || 1;
        that.rotation = spec.rotation || 0;
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var layer = function(spec) {
        var that, spec = spec || {};
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = {};
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.entities = spec.entities || [];
        that.frozen = spec.frozen || false;
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var world = function() {
        var that;
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = ns.eventful();
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.window = {width : null, height: null};
        that.views = {};
        that.layers = [];
        
        that.entities = {
            all : [],
            nodes : [],
            edges : [],
            tools : [],
            misc : []
        };
        
        that.lastActivity = new Date();
        
        that.reportActivity = function() {
            this.lastActivity = new Date();
        };
        
        that.getViewCoord = function(x, y, view) {
            var x = x;
            var y = y;
            
            // fix rotation
            var coord = app.math.rotate(x, y, view.rotation);
            x = coord.x;
            y = coord.y;
            
            // fix zoom
            x = x / view.zoom;
            y = y / view.zoom;
            
            // fix x and y
            x = x - view.x;
            y = y - view.y;
            
            return {
                x : x,
                y : y
            };
        };
        
        that.getWindowCoord = function(x, y, view) {
            var x = x;
            var y = y;
            
            // fix x and y
            x = x + view.x;
            y = y + view.y;
            
            // fix rotation
            var coord = app.math.rotate(x, y, Math.PI * 2 - view.rotation);
            x = coord.x;
            y = coord.y;
            
            // fix zoom
            x = x * view.zoom;
            y = y * view.zoom;
            
            return {
                x : x,
                y : y
            };
        };
        
        that.registerEntity = function(entity, view, layer) {
            entity.view = view;
            if (layer) layer.entities.push(entity);
            
            if (entity.isEdge) {
                this.entities.edges.push(entity);
            } else if (entity.isNode) {
                this.entities.nodes.push(entity);
            } else if (entity.isTools) {
                this.entities.tools.push(entity);
            } else {
                this.entities.misc.push(entity);
            }
            this.entities.all.push(entity);
        };
        
        that.clearEntityRegistry = function() {
            for (var name in this.entities) {
                this.entities[name] = [];
            }
        };
        
        that.getEntitiesByView = function(view) {
            var entities = this.entities.all;
            var len = entities.length;
            var found = [];
            
            for (var i = len - 1; i >= 0; i--) {
                var e = entities[i];
                
                if (e.view == view) {
                    found.push(e);
                }
            }
            return found;
        };
        
        that.getEntityByWindowCoord = function(x, y, z, view, multiple) {
            var entities = this.entities.all;
            var len = entities.length;
            var found = [];
            
            for (var i = len - 1; i >= 0; i--) {
                var e = entities[i];
                
                if (e.real && !e.hidden &&
                    (!z || e.z <= z) && 
                    (!view || e.view == view)) {
                    
                    var coord = this.getViewCoord(x, y, e.view);
                    
                    if (e.existsAt(coord.x, coord.y)) {
                        if (multiple) found.push(e); else return e;
                    }
                }
            }
            
            if (multiple) return found; else return null;
        };
        
        that.getEntitiesByWindowCoord = function(x, y, z, view) {
            this.getEntityByWindowCoord(x, y, z, view, true);
        };
        
        that.setWindowSize = function(w, h) {
            var ow = this.window.width;
            var oh = this.window.height;
            
            this.window.width = w;
            this.window.height = h;
            
            if (ow != w || oh != h) this.triggerEvent('windowresize');
        };
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    ns.runtime singleton
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.world = world();
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    public constructors
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.view = view;
    ns.layer = layer;
        
})(window.app);