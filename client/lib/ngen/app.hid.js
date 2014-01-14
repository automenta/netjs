window.app = window.app || {};
(function(ns){

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    abstractHID constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var hid = function(spec, our) {
        var that, spec = spec || {}, our = our || {};
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = ns.eventful(null, our);
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        shared
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        our.elements = null;
        our.realEvents = spec.realEvents || [];
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var super_addEventListener = that.addEventListener;
        that.addEventListener = function(name, callback) {
            
            // in case we have a real event for it, we bind it
            if (ns.hasValue(our.realEvents, name)) {
                $(our.elements).bind(name, callback);
            }
            
            super_addEventListener.apply(this, [name, callback]); // always add a virtual listener so we can trigger it
        };
        
        var super_removeEventListener = that.removeEventListener;
        that.removeEventListener = function(name, callback) {
            
            // in case we have a real event for it, we unbind it
            if (ns.hasValue(this.realEvents, name)) {
                $(our.elements).unbind(name, callback);
            }
            
           super_removeEventListener.apply(this, [name, callback]);
        };
        
        that.init = function(spec) {
            our.elements = spec.elements || [document.body];
        };
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    mouse
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var mouse = function(spec) {
        var that, spec = spec || {};
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = hid(
            {
                realEvents : ['mousemove', 'mousedown', 'mouseup'],
                elements : spec.elements
            }
            );
        
        return that;
    };
    
    ns.hid = {};
    ns.hid.mouse = mouse();
    
})(window.app);