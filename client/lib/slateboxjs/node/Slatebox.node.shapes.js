; (function ($s, $n) {
    $n.fn._shapes = function () {
        var _self = this, hover = "", changer;

        _self.show = function (x, y, _m) {
            x = x + 10;
            var _r = _self._.slate.paper;
            var _s = { fill: "#fff", stroke: "#000", "stroke-width": 1 };
            var shapes = [
                _r.rect(x + 16, y + 43, 30, 30).attr(_s)
                , _r.rect(x + 56, y + 43, 30, 30, 5).attr(_s)
                , _r.ellipse(x + 110, y + 58, 16, 16).attr(_s)
            ];

            $s.each(shapes, function () {
                this.mouseover(function (e) {
                    _self._.slate.glow(this);
                });
                this.mouseout(function (e) {
                    _self._.slate.unglow();
                });
                this.mousedown(function (e) {
                    if (this.type !== _self._.options.vectorPath) {
                        var pkg = { type: 'onNodeShapeChanged', data: { id: _self._.options.id, shape: this.type, rx: this.attr("rx") } };
                        _self.set(pkg.data);
                        _self._.slate.signalr && _self._.slate.signalr.send(pkg);
                        _self._.slate.birdseye && _self._.slate.birdseye.nodeChanged(pkg);
                    }
                });
                _m.push(this);
            });
        };

        _self.set = function(pkg) {
            _self._.vect.remove();
            var _r = _self._.slate.paper;
            var vectOpt = { fill: _self._.options.backgroundColor, "stroke-width": _self._.options.borderWidth, "stroke": "#000" };
            if (_self._.options.image && _self._.options.image !== "") vectOpt.fill = "url(" + _self._.options.image + ")";

            var _x = _self._.options.xPos, _y = _self._.options.yPos, 
                _width = _self._.options.width, _height = _self._.options.height;
            switch (pkg.shape) {
                case "ellipse":
                    if (_self._.options.vectorPath !== "ellipse") {
                        _self._.options.vectorPath = "ellipse";
                        _self._.vect = _r.ellipse(_x + _width / 2, _y + _height / 2, (_width / 2), (_height / 2)).attr(vectOpt);
                        _self._.options.xPos += _width / 2;
                        _self._.options.yPos += _height / 2;
                    }
                    break;
                case "rect":
                    if (_self._.options.vectorPath === "ellipse") {
                        _self._.options.xPos -= _width / 2;
                        _self._.options.yPos -= _height / 2;
                        _x = _self._.options.xPos;
                        _y = _self._.options.yPos;
                    }
                    _self._.options.vectorPath = pkg.rx > 0 ? "roundedrectangle" : "rectangle";
                    _self._.vect = _r.rect(_x, _y, _width, _height, pkg.rx > 0 ? 10 : 0).attr(vectOpt);
                    break;
            }
            _self._.text.toFront();
            _self._.link.toFront();
            _self._.relationships.wireHoverEvents();
            _self._.relationships.wireDragEvents();

            //needed for tofront and toback ops of the context menu
            _self._.vect.data({id: _self._.options.id});
            _self._.context.init();
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.node);
