(function ($s, $slate) {
    $slate.fn._birdseye = function () {
        if (Raphael === undefined) {
            alert("You must load Raphael in order to use the Slatebox.slate.birdseye.js plugin!");
        }

        var _self = this, _be, _corner, _handle, orx, sp, options, _parentDimen, _parentOffset, _lastX, _lastY, _wpadding, _hpadding;

        _self.show = function (_options) {

            options = {
                size: 200
                , onHandleMove: null
            };

            $s.extend(options, _options);

            var c = _self._.options.container;
            _parentDimen = $s.getDimensions(c);
            _parentOffset = $s.positionedOffset(c);

            _be = document.createElement('div');
            _be.setAttribute("id", "slateBirdsEye_" + _self._.options.id);
            _be.style.position = "absolute";
            _be.style.height = options.size + "px";
            _be.style.width = options.size + "px";
            _be.style.border = "2px inset #333";
            _be.style.backgroundColor = "#fff";

            c.appendChild(_be);
            setBe();

            _corner = $s.instance.slate({
                container: $s.el("slateBirdsEye_" + _self._.options.id)
                , viewPort: { allowDrag: false }
                , collaboration: { allow: false }
                , showZoom: false
                , showBirdsEye: false
                , events: {
                    onNodeDragged: function () {
                        _self._.nodes.copyNodePositions(_corner.nodes.allNodes);
                    }
                }
            }).canvas.init();
            _self.refresh();

            $s.addEvent(window, "resize", function () {
                var c = _self._.options.container;
                _parentDimen = $s.getDimensions(c);
                _parentOffset = $s.positionedOffset(c);
                setBe();
            });

            if (!_self._.options.showBirdsEye) _self.disable();
        };

        _self.enabled = function () { return _corner !== undefined; };

        _self.enable = function () {
            if (!_corner) _self.show();
            $s.el("slateBirdsEye_" + _self._.options.id).style.display = "block";
        };

        _self.disable = function () {
            $s.el("slateBirdsEye_" + _self._.options.id).style.display = "none";
        };

        function setBe() {
            _be.style.left = (_parentDimen.width - options.size) + "px";
            _be.style.top = "-2px";
        };

        _self.relationshipsChanged = function (pkg) {
            if (_corner) {
                switch (pkg.type) {
                    case "removeRelationship":
                        _corner.nodes.removeRelationship(pkg.data);
                        //{ parent: c.parent.options.id, child: c.child.options.id };
                        break;
                    case "addRelationship":
                        //data: { id: _self._.options.id, relationships: rels} };
                        _corner.nodes.addRelationship(pkg.data);
                        break;
                }
            }
        };

        _self.nodeChanged = function (pkg) {
            if (_corner) {
                var _node;
                switch (pkg.type) {
                    case 'onNodeShapeChanged':
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.shapes.set(pkg.data);
                        break;
                    case "onNodeTextChanged":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.editor.set(pkg.data.text, pkg.data.fontSize, pkg.data.fontColor);
                        break;
                    case "onNodeColorChanged":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.colorpicker.set(pkg.data);
                        break;
                    case "onNodeImageChanged":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.images.set(pkg.data.img, pkg.data.w, pkg.data.h);
                        break;
                    case "onNodeResized":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.resize.set(pkg.data.width, pkg.data.height);
                        break;
                    case "onNodeToFront":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.vect.toFront();
                        break;
                    case "onNodeToBack":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.vect.toBack();
                        break;
                    case "onNodeLocked":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.options.allowDrag = false;
                    case "onNodeUnlocked":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.options.allowDrag = true;
                        break;
                    case "onNodeAttached":
                        _node = _corner.nodes.one(pkg.data.id);
                        _node.relationships.attach();
                        break;
                }
            }
        };

        _self.nodeDeleted = function (pkg) {
            if (_corner) {
                var _node = _corner.nodes.one(pkg.data.id);
                _node.del();
            }
        };

        _self.nodeDetatched = function (pkg) {
            if (_corner) {
                var _node = _corner.nodes.one(pkg.data.id);
                _node.relationships.detatch();
            }
        };

        _self.reload = function (json) {
            if (_handle) _handle.remove();
            _corner.loadJSON(json);
            _self.refresh(true);
        };

        _self.refresh = function (blnNoAdditions) {
            if (_corner) {
                if (_handle) _handle.remove();

                if (blnNoAdditions === true) {
                    _corner.canvas.move({ x: _self._.options.viewPort.left, y: _self._.options.viewPort.top, dur: 0, isAbsolute: true });
                    _corner.nodes.copyNodePositions(_self._.nodes.allNodes); //repositionNodes();
                } else {
                    _corner.loadJSON(_self._.exportDifference(_corner), true);
                }

                orx = _self._.getOrientation();

                if (_self._.options.viewPort.left < orx.left)
                    _wpadding = ((_self._.options.viewPort.left) - (orx.left));
                else
                    _wpadding = (_self._.options.viewPort.left - orx.left) + (_parentDimen.width - orx.width); // (_self._.options.viewPort.left + _parentDimen.width) - (orx.left + orx.width);

                _hpadding = ((_self._.options.viewPort.top) - (orx.top));

                var _pw = Math.max(Math.abs(_wpadding), (orx.width < _parentDimen.width ? (_parentDimen.width - orx.width) : 0));
                var _ph = Math.max(Math.abs(_hpadding), (orx.height < _parentDimen.height ? (_parentDimen.height - orx.height) : 0));

                var wp = ((orx.width + _pw) / options.size) * _self._.options.viewPort.width;
                var hp = ((orx.height + _ph) / options.size) * _self._.options.viewPort.height;

                sp = Math.max(wp, hp);

                var _r = Math.max(_self._.options.viewPort.width, _self._.options.viewPort.height) / sp;
                var l = (orx.left + (_wpadding < 0 ? _wpadding : 0)) * _r - 5;
                var t = (orx.top + (_hpadding < 0 ? _hpadding : 0)) * _r - 5;

                _corner.zoom(0, 0, sp, sp, true);
                _corner.options.viewPort.zoom.r = _corner.options.viewPort.originalWidth / sp;
                _corner.canvas.move({ x: l, y: t, dur: 0, isAbsolute: true });
                _corner.disable();

                var _ix = _self._.options.viewPort.left / _self._.options.viewPort.zoom.r; // +_wpadding; // orx.left; // -(orx.left - _self._.options.viewPort.left); //+_self._.options.viewPort.left; // orx.left + orx.width / 2;
                var _iy = _self._.options.viewPort.top / _self._.options.viewPort.zoom.r; // +_hpadding; // orx.top; // -(orx.top - _self._.options.viewPort.top); //+_self._.options.viewPort.top; // orx.top + orx.height / 2;

                var _w = _parentDimen.width / _self._.options.viewPort.zoom.r, _h = _parentDimen.height / _self._.options.viewPort.zoom.r;
                _handle = _corner.paper.rect(_ix, _iy, _w, _h).attr({ stroke: 'red', "stroke-width": 1, fill: "#f8f8f8", "fill-opacity": ".6" });
                wireHandle();
            }
        };

        var init = function () {
            _handle.ox = this.attr("x");
            _handle.oy = this.attr("y");
        };

        var move = function (x, y) {

            var _zr = _corner.options.viewPort.originalWidth / sp;
            x = x + ((x / _zr) - x);
            y = y + ((y / _zr) - y);

            var _mx = _handle.ox + x;
            var _my = _handle.oy + y;

            _handle.attr({ x: _mx, y: _my });

            var bb = _handle.getBBox();
            var _cx = bb.x * _self._.options.viewPort.zoom.r; // -_parentDimen.width / 2;
            var _cy = bb.y * _self._.options.viewPort.zoom.r; // -_parentDimen.height / 2;

            if ($s.isFunction(options.onHandleMove)) {
                options.onHandleMove.apply(this, [_cx, _cy]);
            };

            _self._.canvas.move({ x: _cx, y: _cy, dur: 0, isAbsolute: true });

            _lastX = bb.x;
            _lastY = bb.y;
            _lastOrx = orx;

            //_handle.transform(["t", x, y].join());
        };

        var up = function (e) {
            _self.refresh();
            _self._.canvas.broadcast();
        };

        function wireHandle() {
            _handle.drag(move, init, up);
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate);