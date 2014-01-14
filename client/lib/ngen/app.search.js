window.app = window.app || {};

(function(ns){
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var search = function() {
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
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.query = '';
        that.found = [];
        
        that.clear = function() {
            var len = this.found.length;
            for (var i = 0; i < len; i++) {
                this.found[i].found = false;
            }
            this.query = '';
            this.found = [];
            ns.world.reportActivity();
        };
        
        that.find = function(query) {
            this.clear();
            this.query = query;
            
            if (query != '') {
                var nodes = ns.world.entities.nodes;
                var len = nodes.length;

                for (var i = 0; i < len; i++) {
                    var node = nodes[i];

                    if (node.label.indexOf(query) != -1 && node.visible) {
                        this.found.push(node);
                        node.found = true;
                    }
                }
            }
            
            ns.runtime.zoom(this.found);
            //console.dir(this.found);
            ns.world.reportActivity();
        };
        
        that.init = function() {
            var finder = $('.find')[0];
            if (!finder) return;
            var input = $(finder).find('input[type=text]')[0];
            if (!input) return;
            
            var that = this;
            
            $(input).bind('keyup', function(){
                that.find(this.value);
            });
        };
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    singleton
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.search = search();
        
})(window.app);