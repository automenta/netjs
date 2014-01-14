(function ($s, $n) {
    $n.fn._relationships = function () {
        var _self = this;
        _self.parents = [];
        _self.children = [];
        _self.associations = [];

        function broadcast(pkg) {
            _self._.slate.signalr && _self._.slate.signalr.send(pkg);
        };

        function refreshBe() {
            //refresh the birds eye
            var _json = null;
            if (_self._.slate.birdseye)
                _json = _self._.slate.birdseye.refresh(false);
            return _json;
        };

        _self.addParent = function (_node, parentPkg, isTemp) {
            var cx = _self._.slate.paper;
            var _connection = cx.connection({
                id: $s.guid()
                , parent: _node
                , child: _self._
                , lineColor: _self._.options.lineColor
                , lineWidth: _self._.options.lineWidth
                , lineOpacity: _self._.options.lineOpacity
                , blnStraight: parentPkg.isStraightLine || false
                , showParentArrow: parentPkg.showParentArrow || false
                , showChildArrow: parentPkg.showChildArrow || false
            });
            _connection.line.toBack();
            _self.parents.push(_connection);

            _node.relationships.children.push(_connection);

            if (isTemp === undefined || isTemp === false)
                wireLineEvents(_connection);
            //refreshBe();
            return _connection;
        };

        _self.addChild = function (_node, childPkg) {
            var cx = _self._.slate.paper;
            childPkg = childPkg || {};
            var _connection = cx.connection({
                id: $s.guid()
                , parent: _self._
                , child: _node
                , lineColor: _self._.options.lineColor
                , lineWidth: _self._.options.lineWidth
                , lineOpacity: _self._.options.lineOpacity
                , blnStraight: childPkg.isStraightLine || false
                , showParentArrow: childPkg.showParentArrow || false
                , showChildArrow: childPkg.showChildArrow || false
            });
            _connection.line.toBack();
            _self.children.push(_connection);
            _node.relationships.parents.push(_connection);

            wireLineEvents(_connection);
            //refreshBe();

            return _connection;
        };

        _self.addAssociation = function (_node, assocPkg) {
            var cx = _self._.slate.paper;
            assocPkg = assocPkg || {};
            var _connection = cx.connection({
                id: $s.guid()
                , parent: _self._
                , child: _node
                , lineColor: assocPkg.lineColor || _self._.options.lineColor
                , lineWidth: assocPkg.lineWidth || _self._.options.lineWidth
                , lineOpacity: assocPkg.lineOpacity || _self._.options.lineOpacity
                , blnStraight: assocPkg.isStraightLine || false
                , showParentArrow: assocPkg.showParentArrow || false
                , showChildArrow: assocPkg.showChildArrow || false
            });
            _connection.line.toBack();
            _self.associations.push(_connection);
            _node.relationships.associations.push(_connection);

			if (assocPkg.editable)
		    	wireLineEvents(_connection);

            //refreshBe();

            return _connection;
        };

        function wireLineEvents(c) {
            if (_self._.options.allowMenu) {
                var sp = 200, highlight = "#ff0";
                c.line.node.style.cursor = "pointer";
                c.line.mouseover(function () {
                    if (_self._.slate.options.enabled) {
                        _self._.slate.glow(this);
                        c.showChildArrow && (_self._.slate.glow(c.childArrow));
                        c.showParentArrow && (_self._.slate.glow(c.parentArrow));
                    }
                });
                c.line.mouseout(function () {
                    _self._.slate.unglow();
                });

                c.line.mousedown(function (e) {
                    if (_self._.slate.options.enabled) {
                        _self._.slate.unglow();

                        var pkg = { type: "removeRelationship", data: { parent: c.parent.options.id, child: c.child.options.id} };
                        _self._.slate.nodes.removeRelationship(pkg.data);
                        _self._.slate.birdseye && _self._.slate.birdseye.relationshipsChanged(pkg);
                        broadcast(pkg);

                        _self.initiateTempNode(e, c.parent);
                    }
                });
            }
        };

        _self.initiateTempNode = function (e, _parent, isNew) {
            var mp = $s.mousePos(e);
            var _slate = _parent.slate;

            var off = $s.positionedOffset(_slate.options.container);

            var _zr = _self._.slate.options.viewPort.zoom.r;
            var xp = (_slate.options.viewPort.left + mp.x - off.left);
            var yp = (_slate.options.viewPort.top + mp.y - off.top);

            var _tempNode = $s.instance.node({
                id: _self._.slate.tempNodeId
                , xPos: xp + ((xp / _zr) - xp)
                , yPos: yp + ((yp / _zr) - yp)
                , lineColor: "#990000"
                , backgroundColor: "#ffffff"
                , vectorPath: 'ellipse'
                , width: 30
                , height: 30
            });

            _slate.nodes.add(_tempNode, true);
            var _tempRelationship = _tempNode.relationships.addParent(_parent, {}, true);

            _tempRelationship.hoveredOver = null;
            _tempRelationship.lastHoveredOver = null;

            //initiates the drag
            _tempNode.vect.initDrag(e); //, off.x, off.y);
            _slate.options.viewPort.allowDrag = false;

            _tempNode.vect.mousemove(function (e) {
                _self._.slate.paper.connection(_tempRelationship);

                //is there a current hit?
                if (_tempRelationship.hoveredOver === null) { //(e.clientX + e.clientY) % 2 === 0 && 
                    _tempRelationship.hoveredOver = hitTest($s.mousePos(e));
                    if (_tempRelationship.hoveredOver !== null) {
                        //yes, currently over a node -- scale it
                        _tempRelationship.hoveredOver.vect.animate({ "stroke-width": 5 }, 500, function () {
                            _tempRelationship.hoveredOver.vect.animate({ "stroke-width": _self._.options.borderWidth }, 500, function () {
                                _tempRelationship.hoveredOver = null;
                            });
                        });

                        //_tempRelationship.hoveredOver.vect.animate({ scale: '1.25, 1.25' }, 200);
                        //remember this node
                        //_tempRelationship.lastHoveredOver = _tempRelationship.hoveredOver;
                    } else {
                        //no current hit...is there a previous hit to reset?
                        //if (_tempRelationship.lastHoveredOver !== null) {
                        //    _tempRelationship.lastHoveredOver.vect.attr({ fill: _self._.options.backgroundColor });
                        //_tempRelationship.lastHoveredOver.vect.animate({ scale: '1,1' }, 200);
                        //    _tempRelationship.lastHoveredOver = null;
                        //}
                    }
                }
            });
            _tempNode.vect.mouseup(function (e) {
                _parent.relationships.removeChild(_tempNode);
                //_tempNode.relationships.removeParent(_parent);
                _tempNode.slate.nodes.remove(_tempNode);

                var overNode = hitTest($s.mousePos(e));
                if (overNode !== null) {
                    //overNode.vect.transform("s1,1,");
                    _parent.relationships.addAssociation(overNode);
                    var _pkg = { type: "addRelationship", data: { type: 'association', parent: _parent.options.id, child: overNode.options.id} };
                    _self._.slate.birdseye && _self._.slate.birdseye.relationshipsChanged(_pkg);
                    broadcast(_pkg);
                }

                if (_self._.slate.options.enabled)
                    _parent.slate.options.viewPort.allowDrag = true;
            });
        };

        _self.removeAll = function () {
            $s.each(_self.children, function () {
                this.child.relationships.removeParent(_self._); //.parent);
                _self._.slate.paper.removeConnection(this);
            });
            $s.each(_self.parents, function () {
                this.parent.relationships.removeChild(_self._); //this.parent);
                _self._.slate.paper.removeConnection(this);
            });
            $s.each(_self.associations, function () {
                this.child.relationships.removeAssociation(_self._); //.parent);
                _self._.slate.paper.removeConnection(this);
            });
            _self.parents = [];
            _self.children = [];
            _self.associations = [];
        };

        _self.removeParent = function (_node) {
            _self.parents = remove(_self.parents, 'parent', _node);
            //_node.relationships.children = remove(_node.relationships.children, 'child', _node);
            return _self;
        };

        _self.removeChild = function (_node) {
            //_node.relationships.parents = remove(_node.relationships.parents, 'parent', _node); //was parent
            _self.children = remove(_self.children, 'child', _node);
            return _self;
        };

        _self.removeAssociation = function (_node) {
            //_node.relationships.associations = remove(_node.relationships.associations, 'parent', _node); //was parent
            _self.associations = remove(_self.associations, 'child', _node);
            _self.associations = remove(_self.associations, 'parent', _node);
            return _self;
        };

        function hitTest(mp) {
            var overNode = null;
            var off = $s.positionedOffset(_self._.slate.options.container);
            $s.each(_self._.slate.nodes.allNodes, function () {
                if (this.options.id !== _self._.slate.tempNodeId && this.options.id !== _self._.options.id) {
                    var _bb = this.vect.getBBox();

                    var _zr = _self._.slate.options.viewPort.zoom.r;
                    var xp = (_self._.slate.options.viewPort.left + mp.x - off.left);
                    var yp = (_self._.slate.options.viewPort.top + mp.y - off.top);

                    var c = {
                        x: xp + ((xp / _zr) - xp)
                        , y: yp + ((yp / _zr) - yp)
                    };

                    if (c.x > _bb.x && c.x < _bb.x + _bb.width && c.y > _bb.y && c.y < _bb.y + _bb.height) {
                        overNode = this;
                        return;
                    }
                }
            });
            return overNode;
        };

        function remove(a, type, obj) {
            var _na = new Array();
            $s.each(a, function () {
                if (this[type].options.id === obj.options.id) {
                    _self._.slate.paper.removeConnection(this);
                } else {
                    _na.push(this);
                }
            });
            return _na;
        };

        var dragger = function (x, y) {
            if (_self._.events && $s.isFunction(_self._.events.onClick)) {
                _self._.events.onClick.apply(this, [function () {
                    _initDrag(this);
                } ]);
            } else {
                _initDrag(this);
            }
        };

        function _initDrag(_vect) {
            _self._.slate.multiselection && _self._.slate.multiselection.end();
            if (_self._.slate.options.linking) {
                _self._.slate.options.linking.onNode.apply(_vect, [_self._]);
            } else {
                if (_self._.options.allowDrag) {
                    _vect.ox = _vect.type == "rect" ? _vect.attr("x") : _vect.attr("cx");
                    _vect.oy = _vect.type == "rect" ? _vect.attr("y") : _vect.attr("cy");

                    _self._.setStartDrag();
                }
            }
        };

        var move = function (dx, dy) {
            if (_self._.options.allowDrag) {
                if (_self._.options.isPinnedExact) {
                    _self.detatch();
                    var detPkg = { type: 'onNodeDetatched', data: { id: _self._.options.id} };
                    _self._.slate.signalr && _self._.slate.signalr.send(detPkg);
                    _self._.slate.birdseye && _self._.slate.birdseye.nodeDetatched(detPkg);
                }

                var _zr = _self._.slate.options.viewPort.zoom.r;
                dx = dx + ((dx / _zr) - dx);
                dy = dy + ((dy / _zr) - dy);

                //var att = _self._.options.vectorPath === "ellipse" ? { cx: _self._.vect.ox + dx, cy: _self._.vect.oy + dy} : { x: _self._.vect.ox + dx, y: _self._.vect.oy + dy };
                _self._.setPosition({ x: _self._.vect.ox + dx, y: _self._.vect.oy + dy });
            }
        };

        var up = function (e) {
            //this.animate({ "fill-opacity": 1, "fill": _self._.options.backgroundColor }, 500);
            _self._.setEndDrag();

            _self._.slate.birdseye && _self._.slate.birdseye.refresh(true);

            if (_self._.slate.options.events && $s.isFunction(_self._.slate.options.events.onNodeDragged))
                _self._.slate.options.events.onNodeDragged.apply(this);

            if (_self._.context && !_self._.context.isVisible() && _self._.options.allowDrag) {
                _self._.slate.signalr && _self._.slate.signalr.send({
                    type: "onNodeMove"
                    , data: {
                        id: _self._.options.id
                        , x: _self._.options.xPos
                        , y: _self._.options.yPos
                    }
                });
            }
        };

        _self.reattachable = function () {
            return _(_self._.relationships.parents).chain().pluck('child').pluck('options').pluck('id')
                .any(function (id) { return id === _self._.options.id; }).value();
        };

        _self.attach = function () {
            _self._.options.isPinnedExact = true;
            $s.each(_self._.relationships.parents, function () {
                if (this.child.options.id === _self._.options.id) {
                    this.blnStraight = false;
                    this.showChildArrow = false;
                    _self._.options.reattachable = false;
                    _self._.connectors && _self._.connectors.remove();
                    _self._.resize && _self._.resize.hide();
                    this.parent.pinChildNodes();
                    return;
                }
            });
        };

        _self.detatch = function (blnSkipPin) {
            _self._.options.isPinnedExact = false;
            _self._.options.lineOpacity = 1;

            //find the id of the relationships guid and set this one to direct
            $s.each(_self._.relationships.parents, function () {
                if (this.child.options.id === _self._.options.id) {
                    this.blnStraight = true;
                    this.showChildArrow = true;
                    this.lineOpacity = 1;
                    _self._.options.reattachable = true;
                    if (blnSkipPin === undefined)
                        this.parent.pinChildNodes();
                    return;
                }
            });
        };

        _self.refresh = function () {
            var slate = _self._.slate.paper;
            for (var i = _self.children.length; i--; ) {
                slate.connection(_self.children[i]);
            }
            for (var i = _self.parents.length; i--; ) {
                slate.connection(_self.parents[i]);
            }
            for (var i = _self.associations.length; i--; ) {
                slate.connection(_self.associations[i]);
            }
            slate.safari();
        };

        var _over = function (e) {
            _self._.slate.options.viewPort.allowDrag = false;

            _self._.slate.keyboard && _self._.slate.keyboard.start(_self._);

            //close all open menus
            _self._.slate.nodes.closeAllMenus(_self._.options.id);
            if (_self._.menu && $s.isFunction(_self._.menu.show) && _self._.options.allowMenu && !_self._.menu.isOpen()) {
                _self._.menu.show();
            }
            $s.stopEvent(e);
        };

        var _out = function (e) {
            if (_self._.slate.options.enabled)
                _self._.slate.options.viewPort.allowDrag = true;
            _self._.slate.unglow();
            _self._.slate.keyboard && _self._.slate.keyboard.end();
            $s.stopEvent(e);
        };

        var _dbl = function (e) {
            if (_self._.slate.options.enabled) {
                _self._.position('center', function () {
                    _self._.editor && _self._.editor.start();
                });
            }
            $s.stopEvent(e);
        };

        var v = [];
        _self.wireHoverEvents = function () {
            v = [];
            v.push({ o: _self._.vect, over: _over, out: _out, dbl: _dbl });
            v.push({ o: _self._.text, over: _over, out: _out, dbl: _dbl });
            if (_self._.options.id !== _self._.slate.tempNodeId) {
                $s.each(v, function () {
                    this.o.mouseover(this.over);
                    this.o.mouseout(this.out);
                    this.o.dblclick(this.dbl);
                });
            }
        };

        _self.unwireHoverEvents = function () {
            $s.each(v, function () {
                $s.each(v, function () {
                    this.o.events && this.o.unmouseover(this.over); //_.indexOf(_.pluck(this.o.events, 'name'), "mouseover") > -1
                    this.o.events && this.o.unmouseout(this.out);
                    this.o.events && this.o.undblclick(this.dbl);
                });
            });
        };

        _self.wireDragEvents = function () {
            _self._.vect.drag(move, dragger, up);
            /*_self._.text.mousedown(function (e) {
				if (_self._vect)
		            _self._.vect.initDrag(e);
            });*/
        };

        return _self;
    };
})(Slatebox, Slatebox.fn.node);
