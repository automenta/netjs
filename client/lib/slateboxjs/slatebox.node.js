(function ($s) {
    $s.fn.node = function (_options) {
        if (!(this instanceof $s.fn.node))
            return new $s.fn.node(_options);

        var _node = this, _marker;
        _node.options = {
            id: $s.guid()
            , name: ''
			, text: '' //text in the node
            , isPinned: false
            , isPinnedExact: false
            , pinnedRowCount: 5
			, image: '' //the image to show with the node
			, imageTiled: false
			, xPos: 0 //the initial x position relative to the node container
			, yPos: 0 //the initial y position relative to the node container
			, height: 10 //the height of the node
			, width: 10 //the width of the node
            , borderWidth: 2 //border width of the node
			, lineColor: '#000000' //line color
			, lineWidth: 3 //line width
            , lineOpacity: 1
			, allowDrag: true
            , allowMenu: true
            , allowContext: true
			, backgroundColor: '#f8f8f8'
			, foregroundColor: '#000'
			, fontSize: 13
			, fontFamily: 'Arial'
			, fontStyle: 'normal'
			, vectorPath: ''
			, rotationAngle: 0
            , link: { show: false, type: '', data: '', thumbnail: { width: 175, height: 175} }
        };

        $s.extend(_node.options, _options);

        if (_node.options.name === "") _node.options.name = _node.options.id;

        _node.constants = {
            statusPanelAtRest: 33
			, statusPanelExpanded: 200
        };

        _node.del = function () {
            var _reposParents = [], _unlinkId = _node.options.id;
            if (_node.options.isPinnedExact) {
                _reposParents = _node.relationships.parents;
            }

            _node.slate.nodes.closeAllMenus();
            _node.relationships.removeAll();

            _node.slate.options.viewPort.allowDrag = true;

            //unlink any links
            $s.each(_node.slate.nodes.allNodes, function () {
                if (this.options.link && this.options.link.show && this.options.link.data === _unlinkId) {
                    $s.extend(this.options.link, { show: false, type: '', data: '' });
                    this.link.hide();
                }
            });

            _node.slate.unMarkAll();
            _node.slate.nodes.remove(_node);

            //reposition parent's children if this was one of the deleted children...
            $s.each(_reposParents, function () {
                this.parent.pinChildNodes(true);
            });
        };

        function url(opt) {
            return _node.options.ajax.rootUrl + _node.options.ajax.urlFlavor + opt
        };

        _node.setStartDrag = function () {
            _node.slate.options.viewPort.allowDrag = false;
            _node.slate.stopEditing();
            _node.connectors && _node.connectors.reset();
            _node.context && _node.context.hide();
            if (_node.menu && _node.menu.isOpen()) {
                _node.menu.wasOpen = true;
            }
        };

        _node.setEndDrag = function () {
            if (_node.slate && _node.slate.options.enabled) //could be null in case of the tempNode
                _node.slate.options.viewPort.allowDrag = true;

            if (_node.menu && $s.isFunction(_node.menu.show) && _node.options.allowMenu)
                _node.menu.show();
        };

        _node.serialize = function () {
            var jsonNode = {};
            $s.extend(jsonNode, {
                options: _node.options
            });
            jsonNode.relationships = { parents: [], associations: [] }; //, children: []
            $s.each(_node.relationships.parents, function () {
                jsonNode.relationships.parents.push(bindRel(this));
            });
            $s.each(_node.relationships.associations, function () {
                jsonNode.relationships.associations.push(bindRel(this));
            });

            return jsonNode;
        };

        function bindRel(obj) {
            return {
                childId: obj.child.options.id
                , parentId: obj.parent.options.id
                , isStraightLine: obj.blnStraight
                , lineColor: obj.lineColor
                , lineOpacity: obj.lineOpacity
                , lineWidth: obj.lineWidth
                , showParentArrow: obj.showParentArrow || false
                , showChildArrow: obj.showChildArrow || false
            };
        };

        _node.addRelationships = function (json, cb) {
            //add parents
            var _lines = [];
            if (json.relationships) {
                if ($s.isArray(json.relationships.parents)) {
                    $s.each(json.relationships.parents, function () {
                        var _pr = this, _pn = null;
                        $s.each(_node.slate.nodes.allNodes, function () {
                            if (this['options']['id'] === _pr.parentId) {
                                _pn = this;
                                return;
                            }
                        });
                        if (_pn) {
                            var _conn = _node.relationships.addParent(_pn, _pr, false);
                            _lines.push(_conn.line);
                            _pn.pinChildNodes();
                            return;
                        }
                    });
                }

                //add associations
                if ($s.isArray(json.relationships.associations)) {
                    $s.each(json.relationships.associations, function () {
                        var _pr = this, _pn = null;
                        $s.each(_node.slate.nodes.allNodes, function () {
                            if (this.options.id === _pr.parentId && _node.options.id !== this.options.id) {
                                _pn = this;
                                return;
                            }
                        });
                        if (_pn) {
                            var _conn = _node.relationships.addAssociation(_pn, _pr);
                            _lines.push(_conn.line);
                            return;
                        }
                    });
                }
            }
            if ($s.isFunction(cb)) {
                cb.apply(this, [_lines]);
            }
        };

        //you can have a node with no parents or children, yet with relational lines attached
        //because another node has it as its child...returns an array of raphael connection objects
        //was using now not -- should this be kept?
        _node.allAttachedRelationships = function () {
            var relationships = [];
            $s.each(_node.slate.nodes.allNodes, function () {
                $s.each(this.relationships.children, function () {
                    if (this.parent.options.id === _node.options.id) {
                        relationships.push(this);
                    }
                    if (this.child.options.id === _node.options.id) {
                        relationships.push(this);
                    }
                });
                $s.each(this.relationships.parents, function () {
                    if (this.parent.options.id === _node.options.id) {
                        relationships.push(this);
                    }
                    if (this.child.options.id === _node.options.id) {
                        relationships.push(this);
                    }
                });
                $s.each(this.relationships.associations, function () {
                    if (this.parent.options.id === _node.options.id) {
                        relationships.push(this);
                    }
                    if (this.child.options.id === _node.options.id) {
                        relationships.push(this);
                    }
                });
            });
            return relationships;
        };

        _node.toFront = function () {
            $s.each(_node.relationships.children, function () {
                this.line.toFront();
                if (this.child.options.isPinnedExact) {
                    this.child.vect.toFront();
                    this.child.text.toFront();
                    this.child.link.toFront();
                }
            });
            _.invoke(_.pluck(_node.relationships.parents, "line"), "toFront");
            _.invoke(_.pluck(_node.relationships.associations, "line"), "toFront");

            _node.vect.toFront();
            _node.text.toFront();
            _node.link.toFront();
        };

        _node.toBack = function () {
            _node.link.toBack();
            _node.text.toBack();
            _node.vect.toBack();
            $s.each(_node.relationships.children, function () {
                this.line.toBack();
                if (this.child.options.isPinnedExact) {
                    this.child.link.toBack();
                    this.child.text.toBack();
                    this.child.vect.toBack();
                }
            });
            _.invoke(_.pluck(_node.relationships.parents, "line"), "toBack");
            _.invoke(_.pluck(_node.relationships.associations, "line"), "toBack");
        };

        _node.hide = function () {
            _node.vect.hide();
            _node.text.hide();
            _node.options.link.show && _node.link.hide();
        };

        _node.show = function () {
            _node.vect.show();
            _node.text.show();
            _node.options.link.show && _node.link.show();
        };

        function posAtt(p) {
            //var att = {}; //, p = { x: _node.options.xPos, y: _node.options.yPos };
            switch (_node.options.vectorPath) {
                case "ellipse":
                    return { cx: p.x, cy: p.y };
                case "rectangle":
                case "roundedrectangle":
                    return { x: p.x, y: p.y };
                default:
                    var _animPath = Raphael.transformPath(_node.options.vectorPath, "T" + p.x + "," + p.y);
                    return { path: _animPath };
            }
        };

        _node.setPosition = function (p, blnKeepMenusOpen) {
            _node.vect.attr(posAtt(p)); //posAtt()
            _node.relationships.refresh();

            _node.options.xPos = p.x;
            _node.options.yPos = p.y;

            var lc = _node.linkCoords();
            _node.text.attr(_node.textCoords());
            _node.link.transform(["t", lc.x, ",", lc.y, "s", ".8", ",", ".8", "r", "180"].join());

            //close all open menus
            if (blnKeepMenusOpen !== true)
                _node.slate.nodes.closeAllMenus();

            _node.pinChildNodes();
        };

        _node.refresh = function () {
            //_node.connectors.reposition();
            _node.relationships.refresh();
            _node.pinChildNodes(true);

            if (_node.options.isPinnedExact) {
                //_(_node.relationships.parents).chain().pluck('parent').pluck('relationships').invoke('refresh').value(); //.invoke(_node.relationships.parents, 'this.parent.relationships.refresh');
                //_(_node.relationships.parents).chain().pluck('parent').invoke('pinChildNodes', true).value();
                
                $s.each(_node.relationships.parents, function () {
                    this.parent.relationships.refresh();
                    this.parent.pinChildNodes(true);
                });
                
            }
        };

        _node.move = function (pkg) {
            //for text animation
            var p = pkg.data || pkg;
            var d = p.dur || 500;
            var e = p.easing || ">";
            var lx = p.x - 5;
            var tx = p.x + (_node.options.width / 2);
            var ty = p.y + (_node.options.height / 2);

            if (_node.vect.type !== "rect") {
                tx = p.x;
                ty = p.y;
            }

            //always hide by default
            _node.link.hide();
            _node.menu.hide();

            var onAnimate = function () {
                var dx = _node.options.vectorPath === "ellipse" ? _node.vect.attr("cx") : _node.vect.attr("x");
                var dy = _node.options.vectorPath === "ellipse" ? _node.vect.attr("cy") : _node.vect.attr("y");

                _node.options.yPos = dy;
                _node.options.xPos = dx;

                _node.refresh();
                //_node.pinChildNodes();
                //_node.relationships.refresh();
            };

            eve.on("raphael.anim.frame.*", onAnimate);
            _node.text.animate({ x: tx, y: ty }, d, e);
            _node.link.animate({ x: lx, y: ty }, d, e);
            var att = {};
            switch (_node.options.vectorPath) {
                case "ellipse":
                    att = { cx: p.x, cy: p.y };
                    break;
                case "rectangle":
                case "roundedrectangle":
                    att = { x: p.x, y: p.y };
                    break;
                default:
                    var _animPath = Raphael.transformPath(_node.options.vectorPath, "T" + p.x + "," + p.y);
                    att = { path: _animPath };
                    break;
            }
            _node.vect.animate(att, d, e, function () {
                _node.options.yPos = p.y;
                _node.options.xPos = p.x;
                _node.refresh();
                //_node.pinChildNodes();
                eve.unbind("raphael.anim.frame.*", onAnimate);

                //link
                var lc = _node.linkCoords();
                _node.link.transform(["t", lc.x, ",", lc.y, "s", ".8", ",", ".8", "r", "180"].join());
                if (_node.options.link && _node.options.link.show) _node.link.show();
                _node.slate.birdseye && _node.slate.birdseye.refresh(true);

                //cb
                pkg.cb && pkg.cb();
            });
        };

        _node.zoom = function (zoomPercent, duration, cb) {
            /*
            var _startZoom = _node.slate.options.viewPort.zoom.w;
            var _targetZoom = _node.slate.options.viewPort.originalWidth * (100 / parseInt(zoomPercent));
            var _zoomDif = Math.abs(_targetZoom - _startZoom);
            */

            //UNTIL PAN AND ZOOM WORKS CORRECTLY, THIS WILL
            //ALWAYS BE A AIMPLE PROXY TO ZOOMING THE SLATE
            _node.slate.canvas.zoom({
                dur: duration
                , zoomPercent: zoomPercent
                , callbacks: {
                    during: function (percentComplete, easing) {
                        //additional calcs
                    }
                    , after: function (zoomVal) {
                        cb && cb.apply(this, [{ id: _node.options.id, operation: 'zoom', zoomLevel: zoomVal}]);
                    }
                }
            });

            /*
            _node.slate.canvas.zoom({
            dur: duration
            , callbacks: {
            during: function (percentComplete, easing) {
            var _val = _targetZoom > _startZoom ? (_startZoom + (_zoomDif * percentComplete)) : (_startZoom - (_zoomDif * percentComplete));
            _node.slate.zoom(0, 0, _val, _val, false);
            _node.slate.canvas.resize(_val);
            }
            , after: function () {
            _node.slate.zoomSlider.set(_targetZoom);
            cb && cb.apply();
            }
            }
            });
            */
        }

        _node.position = function (location, cb, easing, dur) {

            easing = easing || 'swingFromTo';
            dur = dur || 1000;

            var _vpt = _node.vect.getBBox(), zr = _node.slate.options.viewPort.zoom.r;

            var d = $s.getDimensions(_node.slate.options.container);
            var cw = d.width, ch = d.height, nw = _node.options.width * zr, nh = _node.options.height * zr, pad = 10;

            //get upper left coords
            var _x = (_vpt.x * zr);
            var _y = (_vpt.y * zr);

            switch (location) {
                case "lowerright":
                    _x = _x - (cw - nw) - pad;
                    _y = _y - (ch - nh) - pad;
                    break;
                case "lowerleft":
                    _x = _x - pad;
                    _y = _y - (ch - nh) - pad;
                    break;
                case "upperright":
                    _x = _x - (cw - nw) - pad;
                    _y = _y - pad;
                    break;
                case "upperleft":
                    _x = _x - pad;
                    _y = _y - pad;
                    break;
                default: //center
                    _x = _x - (cw / 2 - nw / 2);
                    _y = _y - (ch / 2 - nh / 2);
                    break;
            }

            if (_x === _node.slate.options.viewPort.left && _y === _node.slate.options.viewPort.top) {
                cb.apply();
            } else {
                _node.slate.canvas.move({
                    x: _x
                    , y: _y
                    , dur: dur
                    , callbacks: {
                        after: function () {
                            cb.apply(this, [{ id: _node.options.id, operation: 'position', location: location, easing: easing}]);
                        }
                    }
                    , isAbsolute: true
                    , easing: easing
                });
            }
        };

        _node.mark = function () {

            var _vpt = _node.vect.getBBox()
                , _x = _vpt.x
                , _y = _vpt.y;

            if (!_marker) {
                //if (_node.options.vectorPath === "ellipse") {
                //    _x = _x - (_node.options.width / 2);
                //    _y = _y - (_node.options.height / 2);
                //}
                _marker = _node.slate.paper.rect(_x - 10, _y - 10, _node.options.width + 20, _node.options.height + 20, 10).attr({ "stroke-width": _node.options.borderWidth, "stroke": "red", fill: "#ccc", "fill-opacity": .8 }).toBack();
            }
            else
                _marker.attr({ x: (_x - 10), y: (_y - 10), width: (_node.options.width + 20), height: (_node.options.height + 20) });
        };

        _node.unmark = function () {
            _marker && _marker.remove();
            _marker = null;
        };

        var lm;
        _node.unbutton = function () {
            lm && lm.unbutton();
        };

        _node.button = function (options) {
            lm = _node.slate.paper.set();
            lm.push(_node.vect);
            lm.push(_node.text);
            $s.extend(options, { node: _node });
            lm.button(options);
        };

        //var _prevAllowDrag, _prevAllowMenu;
        _node.disable = function () {
            //_prevAllowDrag = _node.options.allowDrag;
            //_prevAllowMenu = _node.options.allowMenu;
            _node.options.allowMenu = false;
            _node.options.allowDrag = false;
            _node.relationships.unwireHoverEvents();
        };

        _node.enable = function () {
            _node.options.allowMenu = true; // _prevAllowMenu || true;
            _node.options.allowDrag = true; // _prevAllowDrag || true;
            _node.relationships.wireHoverEvents();
        };

        _node.offset = function () {
            var _x = _node.options.xPos - _node.slate.options.viewPort.left;
            var _y = _node.options.yPos - _node.slate.options.viewPort.top;
            if (_node.options.vectorPath === "ellipse") {
                _x = _x - (_node.options.width / 2);
                _y = _y - (_node.options.height / 2);
            }

            //var z = _node.slate.options.viewPort.zoom.r;
            //var _x = ((off.x - d.width) * z) / 2;
            //var _y = ((off.y - d.height) * z) / 2;

            return { x: _x, y: _y };
        };

        _node.pinChildNodes = function () {
            var pinRow = 3, totPinned = 0, mxHeight = 0, ypad = 20, xpad = 20;
            var _y = _node.options.yPos + (_node.options.vectorPath === "ellipse" ? _node.options.height / 2 : _node.options.height) + ypad;
            var widthx = [];
            var xys = [];
            var xyst = [];

            $s.each(_node.relationships.children, function () {

                if (this.child.options.isPinnedExact) {
                    totPinned++;

                    mxHeight = Math.max(mxHeight, this.child.options.height);
                    widthx.push(this.child.options.width + xpad);

                    var tot = 0;
                    $s.each(widthx, function () {
                        tot += this;
                    });
                    var edge = tot / 2;

                    //to ensure ellipses are centered...
                    var offs = this.child.options.vectorPath === "ellipse" ? 0 : _node.options.width / 2;

                    var baseX = _node.options.xPos + offs - edge + xpad / 2;
                    xyst = [];
                    for (wx = 0; wx < widthx.length; wx++) {
                        xyst.push({ y: _y, x: baseX });
                        baseX += widthx[wx];
                    }

                    if (totPinned % _node.options.pinnedRowCount === 0) {
                        _y += mxHeight + ypad;
                        $s.each(xyst, function () {
                            xys.push(this);
                        });
                        widthx = [];
                        xyst = [];
                    }
                } else if (this.child.options.isPinned) {
                    //var att = this.child.vect.type == "rect" ? { x: this.child.vect.ox + dx, y: this.child.vect.oy + dy} : { cx: this.child.vect.ox + dx, cy: this.child.vect.oy + dy };
                    //_self.moveNode(this.child.vect, att);
                }
            });

            //cleanup
            $s.each(xyst, function () {
                xys.push(this);
            });

            var pi = -1;
            $s.each(_node.relationships.children, function () {
                if (this.child.options.isPinnedExact) {
                    pi++;
                    var _x = this.child.options.vectorPath === "ellipse" ? xys[pi].x + (this.child.options.width / 2) : xys[pi].x;
                    var _y = this.child.options.vectorPath === "ellipse" ? xys[pi].y + (this.child.options.height / 2) : xys[pi].y;
                    this.child.setPosition({ x: _x, y: _y }, true);
                }
            });

            if (xys.length === 0)
                return { x: 0, y: 0 }

            return { x: xys[xys.length - 1].x, y: xys[xys.length - 1].y };
        };

        _node.textCoords = function () {
            var tx = _node.options.xPos + (_node.options.width / 2);
            var ty = _node.options.yPos + (_node.options.height / 2);

            if (_node.vect.type !== "rect") {
                tx = _node.options.xPos;
                ty = _node.options.yPos;
            }
            return { x: tx, y: ty };
        };

        _node.linkCoords = function () {
            var x = _node.options.xPos - 20;
            var y = _node.options.yPos + (_node.options.height / 2) - 22;

            if (_node.vect.type !== "rect") {
                y = _node.options.yPos - 22;
                x = (_node.options.xPos - _node.options.width / 2) - 20;
            }
            return { x: x, y: y };
        };

        _node.animCoords = function () {
            var att = _self._.options.vectorPath === "ellipse" ? { cx: _self._.vect.ox + dx, cy: _self._.vect.oy + dy} : { x: _self._.vect.ox + dx, y: _self._.vect.oy + dy };

        };

        _node.init = function () {
            if (_node.options.id > -1) {
                $s.ajax(url(_node.options.ajax.nodeCreated)
					, function (respText, resp) {
					    _node.options.holdData = eval('(' + respText + ')');
					    bindSlates(_node.options.holdData);
					}, JSON.stringify(_node.options));
            }
        };

        _node.rotate = function (_opts) {
            var opts = {
                angle: 0
                , cb: null
                , dur: 0
            };
            $s.extend(opts, _opts);
            var ta = ["r", opts.angle].join('');

            if (opts.dur === 0) {
                _node.vect.transform(ta);
                _node.text.transform(ta);
                if (_node.options.link.show) _node.link.transform(ta);
                opts.cb && opts.cb();
            } else {
                var lm = _node.slate.paper.set();
                lm.push(_node.vect);
                lm.push(_node.text);
                if (_node.options.link.show) lm.push(_node.link);
                lm.animate({ transform: ta }, opts.dur, ">", function () {
                    opts.cb && opts.cb();
                });
            }
        };

        /*
        $.each($s.fn.node.fn, function () {
        if ($s.isFunction(this)) {
        if (arguments[0].substring(0, 1) === '_') {
        this.apply(_node);
        delete $s.fn.node.fn[arguments[0]];
        }
        }
        });
        */

        $s.each($s.fn.node.fn, function () {
            if (Slatebox.isFunction(this)) {
                if (arguments[0].substring(0, 1) === '_') {
                    var p = arguments[0].replace("_", "");
                    _node[p] = {};
                    _node[p] = this.apply(_node[p]);
                    _node[p]._ = _node;
                    //delete _node["_" + p];
                }
            }
        });
        return _node;
    };
    $s.fn.node.fn = $s.fn.node.prototype = {};
})(Slatebox);
