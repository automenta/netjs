window.app = window.app || {};

(function(ns){

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    renderer constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var renderer = function() {
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
        var _layerElements = [];
        var _layerContexts = [];
        var _layerRendered = [];

        var drawEntity = function(entity, ctx) {
            ctx.save();
            ctx.translate(entity.x, entity.y);
            entity.draw(ctx, this);
            ctx.restore();
        };

        var drawBoundingBox = function(entity, ctx) {

            ctx.save();

            ctx.translate(entity.x - (entity.width / 2), entity.y - (entity.height / 2));
            ctx.lineWidth = 1;
            ctx.strokeStyle = 'rgb(0, 0, 255)';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(entity.width, 0);
            ctx.lineTo(entity.width, entity.height);
            ctx.lineTo(0, entity.height);
            ctx.closePath();
            ctx.stroke();

            ctx.restore();
        };

        var drawEdges = function(entity, ctx) {

            ctx.save();

            ctx.translate(entity.x, entity.y);
            ctx.lineWidth = 5;
            ctx.moveTo(0, 0);

            for (var i = 0; i < 360; i++) {
                var r = ngn.math.degreeToRadian(i);
                var coord = entity.getEdge(r);

                ctx.beginPath();
                var ci = Math.round(i * (255 / 360), 0);
                ctx.strokeStyle = 'rgb(' + (255 - ci) + ', 0, ' + ci + ')';

                ctx.moveTo(coord.x, coord.y);

                ctx.lineTo(coord.x, coord.y + 1);
                ctx.lineTo(coord.x + 1, coord.y + 1);
                ctx.lineTo(coord.x, coord.y + 1);
                ctx.lineTo(coord.x, coord.y);

                ctx.stroke();

                i += that.drawEdgesSkip;
            }

            ctx.restore();
        };

        var draw = function() {
            var llen = this.world.layers.length;
            for (var li = 0; li < llen; li++) {
                var layer = this.world.layers[li];
                if (_layerRendered[li] && layer.frozen) continue;

                var ctx = _layerContexts[li];
                var entities = layer.entities;

                // clear before we draw
                ctx.clearRect(0, 0, this.width, this.height); // not really needed when there is a background?

                // draw!
                var len = entities.length;
                for (var i = 0; i < len; i++) {
                    var e = entities[i];
                    var v = e.view;
                    var lastv = null;

                    if (v && e.visible) {

                        if (v != lastv) {
                            ctx.save();

                            ctx.scale(v.zoom, v.zoom);
                            ctx.rotate(v.rotation);
                            ctx.translate(v.x, v.y);
                        }

                        //console.dir(this);
                        drawEntity.apply(this, [e, ctx]);

                        if (e.real) {
                            if (e.drawBoundingBoxes) drawBoundingBox.apply(this, [e, ctx]);
                            if (e.drawEdges) drawEdges.apply(this, [e, ctx]);
                        }

                        if (v != lastv) {
                            ctx.restore();
                            lastv = v;
                        }

                    }
                }

                _layerRendered[li] = true;
            }
        };

        var zsortEntities = function() {
            var len = this.world.layers.length;
            for (var i = 0; i < len; i++) {
                var layer = this.world.layers[i];
                layer.entities.sort(function(a, b){
                    if (a.z === b.z) return 0;
                    return a.z > b.z ? 1 : -1;
                });
            }
        };

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.drawBoundingBoxes = false;
        that.drawEdges = false;
        that.drawEdgesSkip = 0;

        that.width = null;
        that.height = null;

        that.updating = false;
        that.lastDraw = new Date();

        that.world = null;

        that.getLayerElement = function(i) {
            return _layerElements[i];
        };

        that.getLayerElements = function() {
            return _layerElements;
        };

        that.setSize = function(w, h) {
            this.width = w;
            this.height = h;

            var len = _layerContexts.length;
            for (var i = 0; i < len; i++) {
                var ctx = _layerContexts[i];
                ctx.canvas.width = w;
                ctx.canvas.height = h;
            }
        };

        that.draw = function() {
            draw.apply(this);
            this.lastDraw = new Date();
        };

        that.update = function() {
            if (!this.world) return;

            if (!this.updating) {
                this.updating = true;

                zsortEntities.apply(this);
                this.draw();

                this.updating = false;
            }
        };

        that.init = function(spec) {
            if (_layerElements.length > 0) {
                var len = _layerElements.length;
                for (var i = 0; i < len; i++) {
                    var el = _layerElements[i];
                    el.parentNode.removeChild(el);
                }
                _layerElements = _layerRendered = _layerContexts = [];
            }

            if (this.world) {
                var len = this.world.layers.length;
                for (var i = 0; i < len; i++) {
                    var canvas = document.createElement('canvas');
                    canvas.style.position = 'absolute';
                    canvas.style.left = '0';
                    canvas.style.top = '0';
                    canvas.style.zIndex = i;
                    document.body.appendChild(canvas);
                    _layerElements.push(canvas);
                    _layerContexts.push(canvas.getContext('2d'));
                }
            }
            //_ctx = spec.ctx;
            //this.setSize(_ctx.canvas.width, _ctx.canvas.height);
        };

        that.speedtest = function() {
            var d1 = new Date();
            this.update();
            var d2 = new Date();
            console.info('renderer took ' + (d2 -d1) + 'ms for a frame');
        };

        return that;
    };


    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    public
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.renderer = renderer();

})(window.app);