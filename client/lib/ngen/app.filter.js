window.app = window.app || {};

(function(ns){
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var filter = function() {
        var that;
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = {};
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _template = '<div id="tools">\
		    <div class="find">\
		        <label>Find node by name: </label><input type="text" class="text"/>\
		    </div>\
		    <div class="filter">\
		        <label>Max nodes: </label><div class="max-slider"></div>\
		    </div>\
		</div>';
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.filtered = [];
        
        that.max = function(max) {
            var len = this.filtered.length;
            for (var i = 0; i < len; i++) {
                var node = this.filtered[i];
                node.visible = true;
            }
            
            this.filtered = [];
            
            var nodes = ns.world.entities.nodes;
            var len = nodes.length;
            
            var visible = [];
            
            for (var i = 0; i < len; i++) {
                var node = nodes[i];
                if (i > max) {
                    node.visible = false;
                    this.filtered.push(node);
                } else {
                    visible.push(node);
                }
            }
            
            ns.runtime.zoom(visible, 20);
        };
        
        that.init = function() {
            $('body').append(_template);
            var filter = $('.filter')[0];
            if (!filter) return;
            
            var maxSlider = $(filter).find('.max-slider')[0];
            if (!maxSlider) return;
            
            var max = ns.world.entities.nodes.length;
            $(maxSlider).slider({min : 0, max : max, value : max});
            
            var that = this;
            
            $(maxSlider).bind('slide', function(event, ui){
                var value = ui.value;
                that.max(value);
                //console.info(value);
            });
        };
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    singleton
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.filter = filter();
        
})(window.app);