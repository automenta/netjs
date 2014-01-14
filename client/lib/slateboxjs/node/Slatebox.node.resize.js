(function ($s, $n) {
    $n.fn._resize = function () {
        var _self = this, resize;

        _self.show = function (x, y) {
            var r = _self._.slate.paper;
            resize = r.resize(_self._.slate.options.imageFolder + "2_lines.png").transform(["t", x - 5, ",", y - 5].join()).attr({ fill: "#fff", "stroke": "#000" });

            resize.mouseover(function (e) {
                resize.attr({ cursor: 'nw-resize' });
            });

            resize.drag(move, start, up);

            return resize;
        };

        _self.hide = function (r) {
            resize && resize.remove();
        };

        var _minWidth = 10, _minHeight = 10, _dragAllowed = false, _origWidth, _origHeight;
        var start = function () {
            _self._.slate.multiselection && _self._.slate.multiselection.end();
            this.ox = this.attr("x");
            this.oy = this.attr("y");

            _self._.setStartDrag();
            _self._.connectors.remove();

            _dragAllowed = _self._.slate.options.viewPort.allowDrag;
            _self._.slate.disable();

            if (_self._.options.text !== " ") {
                var mm = _self._.text.getBBox();
                _minWidth = mm.width + 10;
                _minHeight = mm.height + 10;
            }

            _origWidth = _self._.options.width;
            _origHeight = _self._.options.height;
        },
        move = function (dx, dy) {

            var _zr = _self._.slate.options.viewPort.zoom.r;
            dx = dx + ((dx / _zr) - dx);
            dy = dy + ((dy / _zr) - dy);

            var _transWidth = _origWidth + dx;
            var _transHeight = _origHeight + dy;

            if (_transWidth > _minWidth)
                this.attr({ x: this.ox + dx });

            if (_transHeight > _minHeight)
                this.attr({ y: this.oy + dy });

            if (_self._.events && $s.isFunction(_self._.events.onResizing)) {
                _self._.events.onResizing.apply(this, [_transWidth, _transHeight]);
            }

            _self.set(_transWidth, _transHeight);
        },
        up = function () {
            _self._.slate.enable();
            resize.remove();
            _self._.setEndDrag();
            //_self._.relationships.wireHoverEvents();

            if (_self._.events && $s.isFunction(_self._.events.onResized)) {
                _self._.events.onResized.apply(this, [_self.send]);
            } else {
                _self.send();
            }
        };

        _self.send = function () {
            //broadcast change to birdseye and collaborators
            var pkg = { type: 'onNodeResized', data: { id: _self._.options.id, height: _self._.options.height, width: _self._.options.width} };
            _self._.slate.birdseye && _self._.slate.birdseye.nodeChanged(pkg);
            _self._.slate.signalr && _self._.slate.signalr.send(pkg);
        };

        _self.set = function (width, height, dur, easing, callback) {
            var natt = {}, tatt = {}, latt = {}, bb = _self._.vect.getBBox();
            if (!dur) dur = 0;
            if (width > _minWidth) {
                var watt = _self._.vect.type == "rect" ? { width: width} : { rx: width / 2 };
                if (dur === 0)
                    _self._.vect.attr(watt);
                else
                    natt = watt;

                var tx = bb.x + (width / 2), lx = bb.x - 5;

                if (_self._.options.vectorPath === "ellipse") {
                    tx = _self._.vect.attr("cx");
                    lx = _self._.vect.attr("cx") + (width / 2);
                }

                if (dur === 0) {
                    _self._.text.attr({ x: tx });
                    //console.log("setting link x: " + lx);
                    //_self._.link.attr({ x: lx });
                } else {
                    tatt = { x: tx };
                    latt = { x: lx };
                }

                _self._.options.width = width;
            }

            if (height > _minHeight) {
                var hatt = _self._.vect.type == "rect" ? { height: height} : { ry: height / 2 };
                if (dur === 0)
                    _self._.vect.attr(hatt);
                else
                    natt = $s.extend(natt, hatt);

                var ty = bb.y + (height / 2);
                if (_self._.options.vectorPath === "ellipse") {
                    ty = _self._.vect.attr("cy");
                }

                if (dur === 0) {
                    _self._.text.attr({ y: ty });
                    //_self._.link.attr({ y: ty });
                    //console.log("setting link y: " + ty);
                } else {
                    $s.extend(tatt, { y: ty });
                    $s.extend(latt, { y: ty });
                }

                _self._.options.height = height;
            }

            if (dur > 0) {
                _self._.text.animate(tatt, dur);
                _self._.link.hide();

                var onAnimate = function () {
                    if (_self._.slate) _self._.refresh();
                };

                eve.on("raphael.anim.frame.*", onAnimate);
                _self._.vect.animate(natt, dur, easing, function () {
                    var lc = _self._.linkCoords();
                    _self._.link.transform(["t", lc.x, ",", lc.y, "s", ".8", ",", ".8", "r", "180"].join());
                    if (_self._.options.link.show) _self._.link.show();
                    _self._.refresh();
                    eve.unbind("raphael.anim.frame.*", onAnimate);
                    callback && callback.apply(this, [_self._]);
                });

            } else {
                var lc = _self._.linkCoords();
                _self._.link.transform(["t", lc.x, ",", lc.y, "s", ".8", ",", ".8", "r", "180"].join());
                _self._.refresh();
            }
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.node);