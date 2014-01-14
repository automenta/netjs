window.app = window.app || {};

(function(ns){
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var details = function() {
        var that;
        var graph;
        
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
        var _next = null;
        var _prev = null;
        var _lockHistory = false;
        var _template = '<div id="details">\
		    <div class="controls">\
		        <span class="previous">Previous</span>\
		        <span class="next">Next</span>\
		    </div>\
		    <div class="row field-label">\
		        <label>Label:</label> <span>&#160;</span>\
		    </div>\
		    <div class="row field-id">\
		        <label>Identifier:</label> <span>&#160;</span>\
		    </div>\
		    <div class="row field-connectsTo">\
		        <label>Connects to:</label>\
		        <div>&#160;</div>\
		    </div>\
		</div>';
        
        var getModelNodeById = function(id) {
            var len = graph.length;
            for (var i = 0; i < len; i++) {
                var c = graph[i];
                if (c.id == id) return c;
            }
            return null;
        };
        
        var getEntityById = function(id) {
            var len = ns.world.entities.all.length;
            for (var i = 0; i < len; i++) {
                var e = app.world.entities.all[i];
                if (e.id == id) return e;
            }
            return null;
        };
        
        var updateControlState = function() {
            if (_prev) {
                if ((this.historyPos > 0)) {
                    if (!$(_prev).hasClass('active')) $(_prev).addClass('active');
                } else {
                    $(_prev).removeClass('active');
                }
            }
            
            if (_next) {
                if (this.historyPos < this.history.length - 1) {
                    if (!$(_next).hasClass('active')) $(_next).addClass('active');
                } else {
                    $(_next).removeClass('active');
                }
            }
        };
        
        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.history = [];
        that.historyPos = 0;
        
        that.addHistory = function(e) {
            if (_lockHistory) return;
            
            if (this.historyPos < this.history.length - 1) {
                this.history.splice(this.historyPos + 1, this.history.length - this.historyPos);
            }
            
            this.history.push(e);
            this.historyPos = this.history.length - 1;
            updateControlState.apply(this);
        };
        
        that.back = function() {
            var pos = this.historyPos - 1;
            if (pos >= 0) {
                var e = this.history[pos];
                this.historyPos = pos;
                _lockHistory = true;
                ns.runtime.requestEntitySelection(e);
                _lockHistory = false;
            }
            updateControlState.apply(this);
        };
        
        that.forward = function() {
            var max = this.history.length - 1;
            var pos = this.historyPos + 1;
            if (pos <= max) {
                var e = this.history[pos];
                this.historyPos = pos;
                _lockHistory = true;
                ns.runtime.requestEntitySelection(e);
                _lockHistory = false;
            }
            updateControlState.apply(this);
        };
        
        that.init = function(g) {
        	graph = g;
        	
            $('body').append(_template);
            var details = $('#details')[0];
            if (!details) return;
            
            _next = $(details).find('.controls .next');
            _prev = $(details).find('.controls .previous');
            
            var that = this;
            
            if (_next) {
                $(_next).click(function(){
                    if ($(this).hasClass('active')) {
                        that.forward();
                    }
                });
            }

            if (_prev) {
                $(_prev).click(function(){
                    if ($(this).hasClass('active')) {
                        that.back();
                    }
                });
            }
            
            ns.runtime.addEventListener('entityselected', function(){
                
                that.addHistory(ns.runtime.selectedEntity);
                
                var e = ns.runtime.selectedEntity;

                $(details).find('.row.field-label span').text(e.label);
                $(details).find('.row.field-id span').text(e.id);

                var mnode = getModelNodeById(e.id);

                if (mnode && mnode.outsources && mnode.outsources.length > 0) {
                    var cto = '<ul>';
                    var len = mnode.outsources.length;

                    for (var i = 0; i < len; i++) {
                        var ctoe = getEntityById(mnode.outsources[i].id);
                        cto += '<li>' + ctoe.label + ', weight: ' + mnode.outsources[i].weight + '</li>';
                    }
                    cto += '</ul>';

                } else {
                    var cto = '&#160;';
                }

                $(details).find('.row.field-connectsTo div').html(cto);
            });
            
            ns.runtime.addEventListener('entitydeselected', function(){
                $(details).fadeOut(function(){
                    
                    $(details).find('.row.field-label span').text(' ');
                    $(details).find('.row.field-id span').text(' ');
                    $(details).find('.row.field-connectsTo div').text(' ');
                    $(details).fadeIn();
                });
            });
            
        };
        
        return that;
    };
    
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    ns.runtime singleton
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.details = details();
        
})(window.app);