(function ($s, $n, $si) {
    $n.fn._context = function () {
        var _self = this, _contextMenu, _priorAllowDrag = true, _height = 150;

        //wire up event
        var _wire = window.setInterval(function () {
            if (_self._) {
                _self.init();
                window.clearInterval(_wire);
            }
        }, 500);

        _self.init = function () {
            if (_self._.text.node && _self._.options.allowContext) {
                _self._.text.node.oncontextmenu = _self._.vect.node.oncontextmenu = function (e) {
                    _priorAllowDrag = _self._.options.allowDrag;
                    _self._.options.allowDrag = false;
                    _self.hide();
                    buildContext(e);
                    setTimeout(function (e) {
                        _self._.options.allowDrag = _priorAllowDrag;
                    }, 2);
                    return $s.stopEvent(e);
                };
            }
        };

        function buildContext(e) {
            _contextMenu = document.createElement('div');
            _contextMenu.setAttribute("id", "contextMenu_" + _self._.options.id);
            _contextMenu.setAttribute("class", "sb_cm");
            document.body.appendChild(_contextMenu);
            setContext(e);
        };

        function menuItems() {
            var _tmp = "<div style='padding:5px;' class='sb_contextMenuItem' rel='{func}'>{text}</div>";
            var _inside = _tmp.replace(/{func}/g, "tofront").replace(/{text}/g, "to front");
            _inside += _tmp.replace(/{func}/g, "toback").replace(/{text}/g, "to back");
            if (_priorAllowDrag) {
                _inside += _tmp.replace(/{func}/g, "lock").replace(/{text}/g, "lock");
            } else {
                _inside += _tmp.replace(/{func}/g, "unlock").replace(/{text}/g, "unlock");
            }

            if (_self._.relationships.reattachable()) {
                _inside += _tmp.replace(/{func}/g, "pin").replace(/{text}/g, "pin to parent");
                _height = 183;
            }

            _inside += _tmp.replace(/{func}/g, "close").replace(/{text}/g, "close");
            return _inside;
        };

        function setContext(e) {
            _contextMenu.innerHTML = menuItems();

            $s.each($s.select("div.contextMenuItem"), function (e) {
                this.onclick = function (e) {
                    var act = this.getAttribute("rel"), _reorder = false;
                    var pkg = { type: '', data: { id: _self._.options.id} };
                    switch (act) {
                        case "tofront":
                            _self._.toFront();
                            _reorder = true;
                            pkg.type = 'onNodeToFront';
                            break;
                        case "toback":
                            _self._.toBack();
                            _reorder = true;
                            pkg.type = 'onNodeToBack';
                            break;
                        case "lock":
                            _self._.disable();
                            pkg.type = 'onNodeLocked';
                            break;
                        case "unlock":
                            _self._.enable();
                            pkg.type = 'onNodeUnlocked';
                            break;
                        case "pin":
                            _self._.relationships.attach();
                            pkg.type = "onNodeAttached";
                            break;
                        case "close":
                            break;
                    }
                    if (_reorder) {
                        var zIndex = 0;
                        for (var node = _self._.slate.paper.bottom; node != null; node = node.next) {
                            if (node.type === "ellipse" || node.type === "rect") {
                                zIndex++;
                                var _id = node.data("id");

                                //not all rects have an id (the menu box is a rect, but it has no options.id because it is not a node
                                //so you cannot always show this...
                                if (_id) {
                                    var reorderedNode = _.detect(_self._.slate.nodes.allNodes, function (n) { return n.options.id === _id; });
                                    reorderedNode.sortorder = zIndex;
                                }
                            }
                        }
                        _self._.slate.nodes.allNodes.sort(function (a, b) { return a.sortorder < b.sortorder ? -1 : 1 });
                    }
                    if (pkg.type !== "") broadcast(pkg);
                    _self.hide();
                };
            });

            var mp = $s.mousePos(e);

            var _x = mp.x; // _self._.options.xPos - _self._.slate.options.viewPort.left + _self._.options.width / 3;
            var _y = mp.y; // _self._.options.yPos - _self._.slate.options.viewPort.top;
            _contextMenu.style.left = _x + "px";
            _contextMenu.style.top = _y + "px";
            _contextMenu.style.height = _height + "px";
        };

        function broadcast(pkg) {
            //broadcast
            if (_self._.slate.signalr) _self._.slate.signalr.send(pkg);
            if (_self._.slate.birdseye) _self._.slate.birdseye.nodeChanged(pkg);
        };

        _self.hide = function () {
            _self._.slate.removeContextMenus();
            _contextMenu = null;
        }

        _self.isVisible = function () {
            return (_contextMenu !== null);
        };

        return _self;
    };
    $si.fn.removeContextMenus = function () {
        var _cm = $s.select("div.sb_cm")
        $s.each(_cm, function () {
            document.body.removeChild(this);
        });
    };

})(Slatebox, Slatebox.fn.node, Slatebox.fn.slate);