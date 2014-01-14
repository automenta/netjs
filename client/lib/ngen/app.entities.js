window.app = window.app || {};

(function(ns){
    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    baseEntitiy constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    // XXX: how to deal with changes?
    // XXX: do entities get events (like collides)?
    // XXX: the game should be able to change properties, should invoke events?
    var base = function() {
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
        that.x = 0;
        that.y = 0;
        that.z = 0;
        that.r = 0; // rotation

        that.width = null; // bounds width, should be updated, always
        that.height = null; // bounds height, should be updated, always
        that.visible = false; // visible flag
        that.hidden = false;

        that.view = null;
        that.layer = null;

        that.setPosition = function(x, y, z, r, silent) {
            var poschanges = this.x != x || y != this.y || z != this.z;
            var zchanges = this.z != z;

            if (x) this.x = x;
            if (y) this.y = y;
            if (z) this.z = z;
            if (r) this.r = r;

            if (!silent) {
                if (poschanges) this.triggerEvent('positionchanged');
                if (zchanges) this.triggerEvent('zindexchanged');
            }
        };

        that.setBounds = function(width, height) {
            if (width) this.width = width;
            if (height) this.height = height;

            this.triggerEvent('boundschanged');
        };

        that.boundsExistsAt = function(x, y, z) {
            if (z !== undefined && this.z != z) return false;

            var w = this.width;
            var h = this.height;

            var left = this.x - (w / 2);
            var right = left + w;
            var top = this.y - (h / 2);
            var bottom = top + h;

            if (x < left) return false;
            if (x > right) return false;
            if (y < top) return false;
            if (y > bottom) return false;

            return true;
        };

        that.existsAt = function(x, y, z) {
            // check if the object lives at the exact coord
            return this.boundsExistsAt(x, y, z);
        };

        that.getEdge = function(radian) {
            // get the edge of the object from the center (x.y) given a certain radian
            return {
                x : 0,
                y : 0
            };
        };

        // XXX: how to deal with effects, filters, environmental colors, etc?
        // draw ourselves, should not change properties, just draw!
        that.draw = function(ctx, renderer) {
        };

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    realEntity constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var real = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = base();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.visible = true;
        that.real = true;

        that.boundsCollidesWith = function(entity) {
            return ns.math.rectCollides(this.width, this.height, this.x, this.y, this.z, this.r,
                entity.width, entity.height, entity.x, entity.y, this.z, entity.r);
        };

        that.collidesWith = function(entity) {
            // check both bounds, if no overlap, no collision
            return this.boundsCollidesWith(entity);
            // smartly check within the overlay if there is overlap
        };

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    maskEntity constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var mask = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = base();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.visible = true;
        that.real = false;
        that.hidden = true;

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var background = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = mask();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _imagedataWidth = null;
        var _imagedataHeight = null;
        var _imagedata = null;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.cache = $.browser.safari ? true : false;

        that.draw = function(ctx, renderer) {
            /*var img = document.getElementById('background');
            if (!img) return;*/

            //return;
            //console.info(this.cache);
            var w = ns.world.window.width;
            var h = ns.world.window.height;

            var tl = ns.world.getViewCoord(0, 0, this.view);
            var br = ns.world.getViewCoord(w, h, this.view);

            var ww = br.x - tl.x;
            var wh = br.y - tl.y;

            /*ctx.drawImage(img, tl.x, tl.y, ww, wh);
            return;*/

            if (!this.cache || _imagedataWidth != ww || _imagedataHeight != wh) {
                var grad = ctx.createRadialGradient(
                    tl.x + ww / 2, tl.y + wh / 2, wh / 8,
                    tl.x + ww / 2, tl.y + wh / 2, (wh / 8) * 6);

                grad.addColorStop(0, '#41576D');
                grad.addColorStop(1, '#25333F');

                ctx.fillStyle = grad;
                ctx.fillRect(tl.x, tl.y, ww, wh);

                if (this.cache) {
                    _imagedataWidth = ww;
                    _imagedataHeight = wh;
                    _imagedata = ctx.getImageData(tl.x, tl.y, ww, wh);
                }
            } else {
                ctx.putImageData(_imagedata, tl.x, tl.y);
            }
        };

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var edge = function(spec) {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = real();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _sourceListener = null;
        var _targetListener = null;

        var updatePosition = function() {
            if (!this.source || !this.target) {
                this.visible = false;
            }

            this.visible = true;

            var sx = this.source.x;
            var sy = this.source.y;
            var tx = this.target.x;
            var ty = this.target.y;

            if (sx > tx) {
                var x1 = tx;
                var x2 = sx;
            } else {
                var x1 = sx;
                var x2 = tx;
            }

            if (sy > ty) {
                var y1 = ty;
                var y2 = sy;
            } else {
                var y1 = sy;
                var y2 = ty;
            }

            var w = x2 - x1;
            var h = y2 - y1;

            this.setPosition(x1 + w / 2, y1 + h / 2);
            this.setBounds(w, h);
        };

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.isEdge = true;

        that.visible = true;
        that.hidden = true;

        that.source = spec.source;
        that.target = spec.target;
        that.type = spec.type || 1;
        that.weight = spec.weight || 1;
        that.opacity = 1;

        that.draw = function(ctx) {
            var source = this.source;
            var target = this.target;

            if (!source || !target || !source.visible || !target.visible) return;

            var spacing = app.math.getDistance(source.x, source.y, target.x, target.y);
            if (spacing < source.width) return;

            var relationColor = source.selected ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.5)';

            var angle = app.math.radianBetweenPoints(source.x, source.y, target.x, target.y);
            //console.info('angle between objects: ' + app.math.radianToDegree(angle));

            var sourceCoord = source.getEdge(angle);

            var targetAngle = app.math.getOpositeTriangleRadian(angle);
            //console.info('angle between objects (rev): ' + app.math.radianToDegree(targetAngle));

            var targetCoord = target.getEdge(targetAngle);

            var length = app.math.getDistance(
                source.x + sourceCoord.x, source.y + sourceCoord.y,
                target.x + targetCoord.x, target.y + targetCoord.y);

            var arrowWidth = 10;
            var arrowHeight = 15;
            ctx.lineWidth = (arrowWidth / 10) * this.weight;
            ctx.strokeStyle = ctx.fillStyle = relationColor;

            ctx.translate(-this.x + source.x + sourceCoord.x, -this.y + source.y + sourceCoord.y);

            ctx.rotate(angle);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(0, -length + arrowHeight);
            ctx.stroke();

            // draw arrow
            ctx.translate(0, -length + arrowHeight);

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(-arrowWidth / 2, 0);
            ctx.lineTo(0, -arrowHeight);
            ctx.lineTo(arrowWidth / 2, 0);
            ctx.lineTo(0, 0);
            ctx.fill();

            return;
        };

        that.setSource = function(source) {
            if (this.source && _sourceListener) {
                this.source.removeEventListener('positionchanged', _sourceListener);
            }

            this.source = source;
            if (!source) return;

            var that = this;
            _sourceListener = function() {
                updatePosition.apply(that);
            };
            source.addEventListener('positionchanged', _sourceListener);
        };

        that.setTarget = function(target) {
            if (this.target && _targetListener) {
                this.target.removeEventListener('positionchanged', _targetListener);
            }

            this.target = target;
            if (!target) return;

            var that = this;
            _targetListener = function() {
                updatePosition.apply(that);
            };
            target.addEventListener('positionchanged', _targetListener);
        };

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        initialization
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.z = 0.5;
        that.setSource(that.source);
        that.setTarget(that.target);

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    dragableEntity constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var dragable = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = real();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.isDragable = true;

        that.addEventListener('click', function(){
            if (!this.selected) {
                ns.runtime.requestEntitySelection(this);
            } else {
                ns.runtime.requestEntityDeselection(this);
            }
        });

        that.select = function() {
            if (!this.selected) {
                this.selected = true;
                this.triggerEvent('selected');
            }
        };

        that.deselect = function() {
            if (this.selected) {
                this.selected = false;
                this.triggerEvent('deselected');
            }
        };

        that.addEventListener('dragstart', function(e){
            this.setPosition(e.x, e.y);
        });

        that.addEventListener('drag', function(e){
            this.setPosition(e.x, e.y);
        });

        that.addEventListener('dragend', function(e){
            this.setPosition(e.x, e.y);
        });

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    connectableEntity
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var node = function(nospec, our) {
        var that, our = our || {};

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = dragable();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var _wasSelected = null;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        shared
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        our.labelElement = null;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.isNode = true;
        that.label = null;

        that.draw = function(ctx, renderer) {

            y = -((this.height / 2) + 3);
            x = (this.width / 4);

            if ($.browser.mozilla && !ctx.fillText) {
                ctx.save();
                ctx.fillStyle = this.selected ? '#FF006A' : 'rgba(255, 255, 255, 0.6)';
                ctx.mozTextStyle = '11px Verdana';
                ctx.translate(x, y);
                ctx.mozDrawText(this.label || '');
                ctx.restore();
            } else {
                ctx.fillStyle = this.selected ? '#FF006A' : 'rgba(255, 255, 255, 0.8)';
                ctx.font = '11px Verdana';
                ctx.fillText(this.label || '', x, y);
            }
        };

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var circle = function() {
        var that, our = {};

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = node(null, our);

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.opacity = 1;

        var super_draw = that.draw;
        that.draw = function(ctx) {
            //return;
            if (super_draw) super_draw.apply(this, arguments);

            var w = this.width;
            var h = this.height;
            if (h <= 0 || w <= 0) return;

            ctx.beginPath();
            ctx.fillStyle = this.selected ? 'rgba(63, 115, 157, 0.8)' : 'rgba(17, 31, 41, 0.5)';
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = this.found ? '#D5E625' : this.selected ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.5)';
            ctx.arc(0, 0, w / 2, 0, Math.PI * 2, true);
            ctx.fill();
            ctx.stroke();
        };

        that.getEdge = function(r) {
            return app.math.getCircleEdge(this.width / 2, r);
        };

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        constructing and late binding
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.setBounds(30, 30);

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    outsourceEntity
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var square = function() {
        var that, our = {};

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = node(null, our);

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.opacity = 1;

        var super_draw = that.draw;
        that.draw = function(ctx) {
            //return;
            if (super_draw) super_draw.apply(this, arguments);

            var w = this.width;
            var h = this.height;
            if (h <= 0 || w <= 0) return;

            ctx.beginPath();

            ctx.fillStyle = this.selected ? 'rgba(63, 115, 157, 0.8)' : 'rgba(17, 31, 41, 0.5)';
            ctx.strokeStyle = this.found ? '#D5E625' : this.selected ? 'rgb(255, 255, 255)' : 'rgba(255, 255, 255, 0.5)';

            ctx.translate(-(w / 2), -(h / 2));
            ctx.moveTo(0, 0);

            ctx.lineTo(w, 0);
            ctx.lineTo(w, h);
            ctx.lineTo(0, h);
            ctx.lineTo(0, 0);
            ctx.closePath();

            ctx.fill();
            ctx.stroke();
        };

        that.getEdge = function(angle) {

            var segment = Math.ceil(angle / (Math.PI / 2));

            var h = this.height / 2;
            var w = this.width / 2;

            if (segment == 0) return {x : 0, y : -h};

            angle = angle - ((segment -1) * Math.PI / 2);
            if (segment == 2 || segment == 4) angle = Math.PI / 2 - angle;

            var bpoint = (function(){
                var adj = w;
                var opp = h;
                var tan = opp / adj;
                return (Math.PI / 2) - Math.atan(tan);
            })();

            var x = (function(){
                if (angle >= bpoint) return w;
                var adj = h;
                var opp = Math.tan(angle) * adj;
                return opp;
            })();

            var y = (function(){
                if (angle <= bpoint) return h;
                var yangle = (Math.PI / 2) - angle;

                var adj = w;
                var opp = Math.tan(yangle) * adj;
                return opp;
            })();

            if (segment == 1) return {x : x, y : -y};
            if (segment == 2) return {x : x, y : y};
            if (segment == 3) return {x : -x, y : y};
            if (segment == 4) return {x : -x, y : -y};

            return {x : 0, y : 0};
        };

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        constructing and late binding
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.setBounds(30, 30);

        return that;
    };



    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var rotateControl = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = dragable();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.centerX = 0;
        that.centerY = 0;
        that.centerRadius = 0;
        that.angle = 0;

        that.draw = function(ctx) {

            var w = this.width;
            var h = this.height;
            if (h <= 0 || w <= 0) return;

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.arc(0, 0, w / 2, 0, Math.PI * 2, true);
            ctx.fill();
        };

        that.getEdge = function(r) {
            return app.math.getCircleEdge(this.width / 2, r);
        };

        var super_setPosition = that.setPosition;
        that.setPosition = function(x, y) {
            var x = x;
            var y = y;

            var angle = app.math.radianBetweenPoints(this.centerX, this.centerY, x, y);
            this.setAngle(angle);
        };

        that.setAngle = function(angle) {
            var angle = angle == 0 ? Math.PI * 2 : angle;
            this.angle = angle;
            var edge = app.math.getCircleEdge(this.centerRadius, angle);
            super_setPosition.apply(this, [this.centerX + edge.x, this.centerY + edge.y]);
        };

        that.addEventListener('dragstart', function(e){
            this.setPosition(e.x, e.y);
        });

        that.addEventListener('drag', function(e){
            this.setPosition(e.x, e.y);
        });

        that.addEventListener('dragend', function(e){
            this.setPosition(e.x, e.y);
        });

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var zoomControl = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = dragable();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.minX = 0;
        that.maxX = 0;

        that.zoomMin = -10;
        that.zoomMax = 10;

        that.draw = function(ctx) {

            var w = this.width;
            var h = this.height;
            if (h <= 0 || w <= 0) return;

            ctx.beginPath();
            ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.arc(0, 0, w / 2, 0, Math.PI * 2, true);
            ctx.fill();
        };

        that.getEdge = function(r) {
            return app.math.getCircleEdge(this.width / 2, r);
        };

        var super_setPosition = that.setPosition;
        that.setPosition = function(x, y) {
            //console.info('---------');
            var x = x;
            if (x < this.minX) x = this.minX;
            if (x > this.maxX) x = this.maxX;
            var y = this.y;

            var minFactor = this.zoomMin < 1 ? -(1 / this.zoomMin) : this.zoomMin;
            var maxFactor = this.zoomMax < 1 ? -(1 / this.zoomMax) : this.zoomMax;

            var left = (x - this.minX) / (this.maxX - this.minX);

            //console.info('minfactor: ' + minFactor);
            //console.info('left: ' + left);

            var range = (maxFactor - minFactor);
            //console.info('range: ' + range);

            var zoomFactor = left * range + minFactor;
            //console.info('zoomfactor: ' + zoomFactor);

            if (zoomFactor == 0) {
                var zoom = 1;
            } else if (zoomFactor > 0) {
                var zoom = zoomFactor + 1;
            } else if (zoomFactor < 0) {
                var zoom = -((minFactor -(zoomFactor)) / 10);
                if (zoom == 0) zoom = 0.1;
            }

            //console.info('zoom: ' + zoom);

            this.setZoom(zoom);
        };

        that.setZoom = function(zoom) {
            var zoom = zoom;
            if (zoom > this.zoomMax) zoom = this.zoomMax;
            if (zoom < this.zoomMin) zoom = this.zoomMin;

            this.zoom = zoom;

            var minFactor = this.zoomMin < 1 ? -(1 / this.zoomMin) : this.zoomMin;
            var maxFactor = this.zoomMax < 1 ? -(1 / this.zoomMax) : this.zoomMax;

            //console.info('minfactor: ' + minFactor);
            //console.info('maxfactor: ' + maxFactor);

            //console.info('zoom: ' + zoom);

            var zoomFactor = zoom;
            if (zoom == 1) {
                zoomFactor = 0;
            } else if (zoom > 1) {
                zoomFactor = zoom - 1;
            } else if (zoom < 1) {
                zoomFactor = minFactor - (zoom * minFactor);
            }

            //console.info('zoomfactor: ' + zoomFactor);

            var left = (zoomFactor - minFactor) / (maxFactor - minFactor);

            //console.info(left);

            var x = left * (this.maxX - this.minX);

            super_setPosition.apply(this, [this.minX + x, this.y]);
        };

        that.addEventListener('dragstart', function(e){
            this.setPosition(e.x, e.y);
        });

        that.addEventListener('drag', function(e){
            this.setPosition(e.x, e.y);
        });

        that.addEventListener('dragend', function(e){
            this.setPosition(e.x, e.y);
        });

        return that;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    var tools = function() {
        var that;

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = mask();

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        private
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        var updateControlPositioning = function() {
            var view = ns.world.views.tools;

            var w = ns.world.window.width;
            var h = ns.world.window.height;

            var tl = ns.world.getViewCoord(0, 0, view);
            var br = ns.world.getViewCoord(w, h, view);

            var rc = this.rotateControl;
            var zc = this.zoomControl;

            rc.centerX = br.x - 55;
            rc.centerY = br.y - 58;

            zc.minX = br.x - 260 - 6;
            zc.maxX = br.x - 120 + 6;

            zc.y = br.y - 20;

            zc.setZoom(zc.zoom);
            rc.setAngle(rc.angle);
        };

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.zoomControl = null;
        that.rotateControl = null;
        that.isTools = true;

        that.init = function(graphView) {
            var view = ns.world.views.tools;
            var layer = ns.world.layers[1];

            this.z = 10;

            var rc = rotateControl();
            this.rotateControl = rc;

            var zc = zoomControl();
            this.zoomControl = zc;

            var w = ns.world.window.width;
            var h = ns.world.window.height;

            var tl = ns.world.getViewCoord(0, 0, view);
            var br = ns.world.getViewCoord(w, h, view);

            rc.centerX = br.x - 55;
            rc.centerY = br.y - 58;
            rc.centerRadius = 40;

            rc.setAngle(ns.world.views.graph.rotation);
            rc.setBounds(12, 12);
            rc.z = 10.1;

            zc.minX = br.x - 260 - 6;
            zc.maxX = br.x - 120 + 6;

            zc.zoomMin = 0.1;
            zc.zoomMax = 10;

            zc.y = br.y - 20;
            zc.z = 10.1;
            zc.setBounds(12, 12);
            zc.setZoom(1);

            ns.world.registerEntity(this, view, layer);
            ns.world.registerEntity(rc, view, layer);
            ns.world.registerEntity(zc, view, layer);

            var that = this;

            rc.addEventListener('positionchanged', function(){
                that.updateViewportRotation();
            });

            zc.addEventListener('positionchanged', function(){
                that.updateViewportZoom();
            });

            ns.world.addEventListener('windowresize', function(){
                updateControlPositioning.apply(that);
            });
        };

        that.updateViewportZoom = function() {
            var view = ns.world.views.graph;
            var w = ns.world.window.width;
            var h = ns.world.window.height;

            var c1 = ns.world.getViewCoord(w / 2, h / 2, view);
            view.zoom = this.zoomControl.zoom;
            var c2 = ns.world.getViewCoord(w / 2, h / 2, view);

            var dx = c2.x - c1.x;
            var dy = c2.y - c1.y;

            view.x += dx;
            view.y += dy;

            ns.world.reportActivity();
        };

        that.updateViewportRotation = function() {
            var view = ns.world.views.graph;
            var w = ns.world.window.width;
            var h = ns.world.window.height;

            var c1 = ns.world.getViewCoord(w / 2, h / 2, view);
            view.rotation = this.rotateControl.angle;
            var c2 = ns.world.getViewCoord(w / 2, h / 2, view);

            var dx = c2.x - c1.x;
            var dy = c2.y - c1.y;

            view.x += dx;
            view.y += dy;

            ns.world.reportActivity();
        };

        that.draw = function(ctx, renderer) {
            ctx.save();

            var w = ns.world.window.width;
            var h = ns.world.window.height;

            var tl = ns.world.getViewCoord(0, 0, this.view);
            var br = ns.world.getViewCoord(w, h, this.view);

            // draw circle
            ctx.beginPath();
            ctx.arc(br.x - 55, br.y - 58, 40, 0, Math.PI * 2, true);
            ctx.lineWidth = 15;
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.48)';
            ctx.stroke();

            // draw slider
            ctx.beginPath();
            ctx.lineWidth = 15;
            ctx.lineCap = 'round';
            ctx.moveTo(br.x - 260, br.y - 20);
            ctx.lineTo(br.x - 120, br.y - 20);
            ctx.stroke();

            ctx.restore();
        };

        return that;
    };

    ns.entities = {
        base : base,
        mask : mask,
        real : real,
        background : background,
        tools : tools,
        dragable : dragable,
        node : node,
        circle : circle,
        square : square,
        edge : edge
    };

})(window.app);