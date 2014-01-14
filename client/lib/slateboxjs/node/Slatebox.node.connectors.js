(function ($s, $n) {
    $n.fn._connectors = function () {
        var _self = this;
        var buttons;
        var pinnedRowCount = 3;
        var _lastUnpinned = { options: { xPos: null, width: null, yPos: null} };

        _self.remove = function () {
            _.invoke(buttons, 'remove');
        };
        _self.removeSettingsButton = function () { buttons.setting.remove(); }
        _self.show = function (x, y, _m, onSettingsClicked) {
            var btnRadius = 15;
            var r = _self._.slate.paper;

            //menu offset, resetting back
            y = y + 80;

            px = x;
            py = y;

            var _nx = x + _self._.options.width;
            var _ny = y + (_self._.options.height / 2);

            var _cx = x + (_self._.options.width / 2);
            var _cy = y + _self._.options.height;

            var oo = 15, so = .75, btnAttr = { fill: "#fff", stroke: "#000" };

            buttons = {
                setting: r.setting().transform(["t", x + _self._.options.width / 2 - 17, ",", y - 22].join()).attr(btnAttr)
                , unPinned: r.arrow().transform(["t", _nx - 16, ",", _ny - 16, "s", so, so].join()).attr(btnAttr)
                , pinned: r.arrow().transform(["t", _cx - 13, ",", _cy - 9, "s", so, so, "r", "90"].join()).attr(btnAttr)
            };

            $s.each(['mousedown'], function () {
                buttons.setting[this](function (e) {
                    _self._.slate.unglow();
                    onSettingsClicked.apply(this);
                    this.remove();
                    _self._.slate.multiselection && _self._.slate.multiselection.end();
                    _self._.context && _self._.context.hide();
                    _self._.editor && _self._.editor.end();
                    _self._.images && _self._.images.end();
                    _self._.links && _self._.links.end();
                });

                buttons.unPinned[this](function (e) {
                    _self._.slate.unglow();
                    _self._.connectors.addUnpinnedNode();
                    this.loop();
                    _self._.context && _self._.context.hide();
                });

                buttons.pinned[this](function (e) {
                    _self._.slate.unglow();
                    _self._.connectors.addPinnedNode();
                    this.loop();
                    _self._.context && _self._.context.hide();
                });
            });

            $s.each(buttons, function () {
                _m.push(this);
                this.mouseover(function (e) {
                    _self._.slate.glow(this);
                });
                this.mouseout(function (e) {
                    _self._.slate.unglow();
                });
            });

            var rs = _self._.resize.show(_nx, _cy);
            _m.push(rs);

            return _self;
        };

        _self.reset = function () {
            _lastUnpinned = { options: { xPos: null, width: null, yPos: null} };
        };

        function broadcast(_snap) {
            var pkg = { type: 'onNodeAdded', data: _self._.slate.exportDifference(_snap) };
            _self._.slate.signalr && _self._.slate.signalr.send(pkg);
        };

        _self.addUnpinnedNode = function (skipCenter) {
            //add new node to the right of this one.
            var _snap = _self._.slate.snapshot();

            var _options = $s.clone(_self._.options);
            delete _options.id;
            delete _options.link;
            _options.xPos = (_lastUnpinned.xPos || _self._.options.xPos) + (_self._.options.width || _lastUnpinned.width) + 10;
            _options.text = "";
            _options.width = _self._.options.width;
            _options.height = _self._.options.height;
            var newNode = $s.instance.node(_options);
            _self._.slate.nodes.add(newNode);
            _lastUnpinned = newNode.options;

            broadcast(_snap);
            _self._.slate.birdseye && _self._.slate.birdseye.refresh(false);
            _self._.slate.unMarkAll();

            //fire the editor
            if (skipCenter === undefined) {
                newNode.position('center', function () {
                    newNode.editor && newNode.editor.start();
                });
            }

            return newNode;
        };

        _self.addPinnedNode = function (skipCenter) {
            var _snap = _self._.slate.snapshot();

            var _options = $s.clone(_self._.options);
            delete _options.id;
            delete _options.link;

            //_options.xPos = -99;
            //_options.yPos = -99;
            _options.text = "";
            if (_self._.options.image === "") {
                _options.width = 50;
                _options.height = 50;
            }
            _options.isPinnedExact = true;
            _options.showParentArrow = false;
            _options.showChildArrow = false;

            //add the new node
            var newNode = $s.instance.node(_options);
            _self._.slate.nodes.add(newNode);

            //add relationship
            _self._.relationships.addChild(newNode);
            _self._.pinChildNodes();

            //broadcast the entire difference (new node + new relationship)
            broadcast(_snap);
            _self._.slate.birdseye && _self._.slate.birdseye.refresh(false);

            _self._.slate.unMarkAll();

            if (skipCenter === undefined) {
                newNode.position('center', function () {
                    newNode.editor && newNode.editor.start();
                });
            }

            return newNode;
        };
        return _self;
    }
})(Slatebox, Slatebox.fn.node);