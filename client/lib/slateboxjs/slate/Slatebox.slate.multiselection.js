(function ($s, $slate) {
    $slate.fn._multiselection = function () {
        var _self = this, selRect = null, ox, oy, _init, marker = null, selectedNodes = [], origPos = null, resizer = null, minSize = 100;

        _self.init = function () {
            var c = _self._.options.container;
            _init = document.createElement("div");
            _init.style.position = "absolute";
            _init.style.height = "18px";
            _init.style.left = '1px';
            _init.style.color = "#081272";
            _init.style.fontSize = "11pt";
            _init.style.fontFamily = "trebuchet ms";
            _init.style.top = "1px";
            _init.style.display = "block";
            _init.style.padding = "5px";
            _init.style.backgroundColor = "#f8f8f8";
            _init.style.cursor = "pointer";
            _init.innerHTML = "[multi-select]";
            c.appendChild(_init);

            $s.addEvent(_init, "click", function (e) {
                switch (_init.innerHTML) {
                    case "[multi-select]":
                        _self.start();
                        break;
                    case "selecting [click to stop]...":
                        _self.end();
                        break;
                }
            });
        };

        _self.hide = function () {
            if (_init) _init.style.display = "none";
        };

        _self.show = function () {
            if (_init) _init.style.display = "block";
        };

        _self.start = function () {
            _self._.disable(); // options.viewPort.allowDrag = false;
            _init.innerHTML = "selecting [click to stop]...";
            _self._.onSelectionStart = function (e) {
                var p = xy(e);
                selRect = _self._.paper.rect(p.x, p.y, 10, 10).attr({ "stroke-dasharray": "-" });
                $s.addEvent(_self._.canvas.get(), "mousemove", _move);
                $s.addEvent(_self._.canvas.get(), "mouseup", _select);
                ox = p.x;
                oy = p.y;
            };
        };

        _self.isSelecting = function () {
            return (marker !== null);
        };

        _self.del = function () {
            if (confirm('Are you sure you want to remove the selected nodes?')) {
                $s.each(selectedNodes, function () {
                    this.toolbar.del();
                });
                _self.end();
            }
        };

        _self.end = function () {
            if (marker !== null) {
                resizer.unmouseover(_resizeHover);
                //marker.undrag(markerEvents.move, markerEvents.init, markerEvents.up);
                //resizer.undrag(resizeEvents.move, resizeEvents.init, resizeEvents.up);
                marker.remove();
                resizer.remove();
                marker = null;
                _self._.keyboard && _self._.keyboard.end();
            }
            if (_init) _init.innerHTML = "[multi-select]";
        };

        _self.endSelection = function () {
            selRect && selRect.remove();
            _self._.enable();
            _self._.onSelectionStart = null;
            $s.removeEvent(_self._.canvas.get(), "mousemove", _move);
            $s.removeEvent(_self._.canvas.get(), "mouseup", _select);
        };

        var xy = function (e) {
            var mp = $s.mousePos(e);
            var off = $s.positionedOffset(_self._.options.container);
            var _x = mp.x + _self._.options.viewPort.left - off.left;
            var _y = mp.y + _self._.options.viewPort.top - off.top;
            var z = _self._.options.viewPort.zoom.r;
            return { x: _x / z, y: _y / z };
        };

        var _move = function (e) {
            p = xy(e);
            var height = p.y - oy;
            var width = p.x - ox;

            if (height > 0) {
                selRect.attr({ height: height });
            } else {
                selRect.attr({ y: p.y, height: (oy - p.y) });
            }
            if (width > 0) {
                selRect.attr({ width: width });
            } else {
                selRect.attr({ x: p.x, width: (ox - p.x) });
            }
        };

        var _select = function (e) {
            var sr = selRect.getBBox();
            var l = _self._.options.viewPort.left;
            var t = _self._.options.viewPort.top;
            var z = _self._.options.viewPort.zoom.r;
            selectedNodes = _.filter(_self._.nodes.allNodes, function (n) {
                return ((n.options.xPos + n.options.width > sr.x && n.options.xPos < sr.x + sr.width) && (n.options.yPos + n.options.height > sr.y && n.options.yPos < sr.y + sr.height))
            });

            if (selectedNodes.length > 1) {
                var orient = _self._.getOrientation(selectedNodes);
                var w = orient.width / z;
                var h = orient.height / z;
                if (w < minSize) w = minSize;
                if (h < minSize) h = minSize;

                marker = _self._.paper.rect(orient.left / z, orient.top / z, w, h).attr({ "stroke-dasharray": "-", "fill": "#f8f8f8" });
                marker.toBack();
                origPos = marker.getBBox();

                _self.endSelection();

                //resizer
                var _nx = origPos.x + origPos.width;
                var _ny = origPos.y + origPos.height;

                resizer = _self._.paper.resize(_self._.options.imageFolder + "2_lines.png").transform(["t", _nx - 5, ",", _ny - 5].join()).attr({ fill: "#fff", "stroke": "#000" });
                resizer.mouseover(_resizeHover);
                marker.drag(markerEvents.move, markerEvents.init, markerEvents.up);
                resizer.drag(resizeEvents.move, resizeEvents.init, resizeEvents.up);

                //hiding resizer for now
                //resizer.hide();

                //unmark all and remove connectors
                _self._.unMarkAll();

                $s.each(selectedNodes, function () {
                    this.connectors.remove();
                    this.resize.hide();
                });

                //activate keyboard shortcuts for this group...
                _self._.keyboard && _self._.keyboard.start();

            } else if (selectedNodes.length === 1) {
                selectedNodes[0].menu.show();
                selectedNodes[0].mark();
                _self.endSelection();
                _self.end();
            } else {
                _self.endSelection();
                _self.end();
            }
        };

        var _resizeHover = function (e) { resizer.attr({ cursor: 'nw-resize' }); };

        var markerEvents = {
            init: function (x, y) {
                _self._.options.viewPort.allowDrag = false;
                marker.ox = marker.attr("x");
                marker.oy = marker.attr("y");
                $s.each(selectedNodes, function () {
                    this.vect.ox = this.vect.type == "rect" ? this.vect.attr("x") : this.vect.attr("cx");
                    this.vect.oy = this.vect.type == "rect" ? this.vect.attr("y") : this.vect.attr("cy");
                });
            }
            , move: function (dx, dy) {
                var _zr = _self._.options.viewPort.zoom.r;
                dx = dx + ((dx / _zr) - dx);
                dy = dy + ((dy / _zr) - dy);

                var att = { x: marker.ox + dx, y: marker.oy + dy };
                marker.attr(att);

                $s.each(selectedNodes, function () {
                    this.setPosition({ x: this.vect.ox + dx, y: this.vect.oy + dy });
                });

                var _nx = origPos.x + origPos.width + dx - 5;
                var _ny = origPos.y + origPos.height + dy - 5;
                resizer.transform(["t", _nx, ",", _ny].join(""));
            }
            , up: function (e) {
                _self._.options.viewPort.allowDrag = true;
                _self._.birdseye && _self._.birdseye.refresh(true);

                var _sids = _(selectedNodes).chain().pluck('options').pluck('id').value();

                $s.each(selectedNodes, function () {

                    if (this.options.isPinnedExact) {
                        //if the parent is NOT in the group of selected nodes, then detatch it...
                        var _allParents = _(this.relationships.parents).chain().pluck('parent').pluck('options').pluck('id').value();
                        if (_.intersect(_sids, _allParents).length === 0) {
                            this.relationships.detatch(true);
                            var detPkg = { type: 'onNodeDetatched', data: { id: this.options.id} };
                            _self._.signalr && _self._.signalr.send(detPkg);
                            _self._.birdseye && _self._.birdseye.nodeDetatched(detPkg);
                            this.refresh();
                        }
                    }

                    broadcastMove(this);
                });

                origPos = marker.getBBox();
            }
        };

        function _resize() {
            var mbb = marker.getBBox();

            var xStatic = mbb.x + mbb.width / 2;
            var yStatic = mbb.y + mbb.height / 2;
            var yScale = mbb.height / origPos.height;
            var xScale = mbb.width / origPos.width;

            $s.each(selectedNodes, function () {
                var nx = xStatic + (xScale * (this.options.xPos - xStatic));
                var ny = yStatic + (yScale * (this.options.yPos - yStatic));

                this.setPosition({ x: nx, y: ny });

                var nw = xScale * this.options.width; // ((mbb.width * this.options.width) / origPos.width);
                var nh = yScale * this.options.height; // ((mbb.height * this.options.height) / origPos.height);
                this.resize.set(nw, nh, 0);
            });
        };

        function broadcastMove(node) {
            _self._.signalr && _self._.signalr.send({
                type: "onNodeMove"
                , data: {
                    id: node.options.id
                    , x: node.options.xPos
                    , y: node.options.yPos
                }
            });
        };

        var resizeEvents = {
            init: function () {
                _self._.disable();
                $s.each(selectedNodes, function () {
                    this.vect.ox = this.vect.type == "rect" ? this.vect.attr("x") : this.vect.attr("cx");
                    this.vect.oy = this.vect.type == "rect" ? this.vect.attr("y") : this.vect.attr("cy");
                });
            }
            , move: function (dx, dy) {

                var _zr = _self._.options.viewPort.zoom.r;
                dx = dx + ((dx / _zr) - dx);
                dy = dy + ((dy / _zr) - dy);

                var _width = origPos.width + (dx * 2);
                var _height = origPos.height + (dy * 2);

                var _nx = origPos.x + origPos.width + dx - 5;
                var _ny = origPos.y + origPos.height + dy - 5;
                var rw = true, rh = true;
                if (_width < minSize) { _width = minSize; rw = false; }
                if (_height < minSize) { _height = minSize; rh = false; }

                resizer.transform(["t", _nx, ",", _ny].join(""));

                var att = { width: _width, height: _height };
                rw && $s.extend(att, { x: origPos.x - dx });
                rh && $s.extend(att, { y: origPos.y - dy });

                marker.attr(att);
            }
            , up: function () {
                _self._.enable();
                _resize();

                $s.each(selectedNodes, function () {
                    this.resize.send();
                    broadcastMove(this);
                });

                _self._.birdseye && _self._.birdseye.refresh(true);

                origPos = marker.getBBox();
                var _nx = origPos.x + origPos.width;
                var _ny = origPos.y + origPos.height;
                resizer.transform(["t", _nx - 5, ",", _ny - 5].join(""));
            }
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate);