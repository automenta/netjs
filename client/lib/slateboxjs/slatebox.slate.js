(function ($s) {
    $s.fn.slate = function (_options) {
        if (!(this instanceof $s.fn.slate))
            return new $s.fn.slate(_options);

        var _slate = this;
        _slate.options = {
            id: $s.guid()
            , container: ''
            , instance: ''
            , name: ''
            , description: ''
            , containerStyle: {
                width: "auto"
                , height: "auto"
            }
            , viewPort: {
                allowDrag: true
                , originalWidth: 50000
                , width: 50000
                , height: 50000
                , left: 5000
                , top: 5000
                , zoom: { w: 50000, h: 50000, r: 1 }
            }
            , events: {
                onNodeDragged: null
                , onCanvasClicked: null
            }
            , enabled: true
            , showBirdsEye: true
            , sizeOfBirdsEye: 200
            , showMultiSelect: true
            , showZoom: true
            , showStatus: true
            , collaboration: {
                allow: true
                , showPanel: true
                , panelContainer: null
                , useLongPolling: false
                , jsonp: false
                , localizedOnly: false
                , userName: ''
                , userProfile: ''
                , userIP: ''
                , sizeOfBirdsEye: 200
                , hubName: 'slateHub'
                , url: ''
                , callbacks: {
                    onCollaboration: null
                    , onCollaborationStarted: null
                    , onCollaborationWired: null
                    , onUnauthorized: null
                }
            }
            , isPublic: false
        };

        //ensure indiv sections aren't wiped out by custom additions/changes
        var _iv = _slate.options.viewPort;
        var _cs = _slate.options.containerStyle;
        var _ie = _slate.options.events;
        var _c = _slate.options.collaboration;
        //var _cc = _slate.options.collaboration.callbacks;

        $s.extend(_slate.options, _options);
        $s.extend(_slate.options.collaboration, $s.extend(_c, _options.collaboration || {}));
        //$s.extend(_slate.options.collaboration.callbacks, $s.extend(_cc, _options.collaboration.callbacks || {}));
        $s.extend(_slate.options.viewPort, $s.extend(_iv, _options.viewPort || {}));
        $s.extend(_slate.options.events, $s.extend(_ie, _options.events || {}));
        $s.extend(_slate.options.containerStyle, $s.extend(_cs, _options.containerStyle || {}));

        //ensure container is always an object
        if (!$s.isElement(_slate.options.container)) {
            _slate.options.container = $s.el(_slate.options.container);
        }

        var constants = {
            statusPanelAtRest: 33
            , statusPanelExpanded: 200
        };

        function url(opt) {
            return options.ajax.rootUrl + options.ajax.urlFlavor + opt
        };

        var glows = [];
        _slate.glow = function (obj) {
            glows.push(obj.glow());
            //setTimeout(function () { glows.length > 0 && _slate.unglow() }, 1000);
        };

        _slate.unglow = function () {
            $s.each(glows, function () {
                this.remove();
            });
            glows = [];
        };

        var tips = [];
        _slate.addtip = function (tip) {
            if (tip) tips.push(tip);
        };

        _slate.untooltip = function () {
            $s.each(tips, function () {
                this && this.remove();
            });
        };

        _slate.save = function () {
            alert(Slatebox.toJSON(_slate));
        };

        _slate.reset = function () {
            var _v = 50000;
            _slate.options.viewPort = {
                allowDrag: true
                , originalWidth: _v
                , width: _v
                , height: _v
                , left: 5000
                , top: 5000
                , zoom: { w: _v, h: _v, r: 1 }
            };
            _slate.zoom(0, 0, _v, _v, false);
            _slate.canvas.resize(_v);
            //_slate.canvas.move({ x: 5000, y: 5000, dur: 0, isAbsolute: true });
        };

        _slate.zoom = function (x, y, w, h, fit) {
            this.paper.setViewBox(x, y, w, h, fit);
        };

        _slate.present = function (pkg) {
            var _currentOperations = [], n = null;
            var next = function () {
                if (_currentOperations.length === 0) {
                    if (pkg.nodes.length > 0) {
                        var node = pkg.nodes.shift();
                        n = _.detect(_slate.nodes.allNodes, function (n) { return n.options.name == node.name; });
                        _currentOperations = node.operations;
                        pkg.nodeChanged && pkg.nodeChanged(node);
                    }
                }

                if (_currentOperations.length > 0) {
                    var op = _currentOperations.shift();
                    pkg.opChanged && pkg.opChanged(op);

                    perform(pkg, n, op, function (p) {
                        var _sync = pkg.sync !== undefined ? pkg.sync[p.operation] : false;
                        switch (p.operation) {
                            case "zoom":
                                _sync && _slate.signalr && _slate.signalr.send({ type: 'onZoom', data: { id: p.id, zoomLevel: p.zoomLevel} });
                                break;
                            case "position":
                                _sync && _slate.signalr && _slate.signalr.send({ type: "onNodePositioned", data: { id: p.id, location: p.location, easing: p.easing} });
                                break;
                        }
                        next();
                    });
                } else {
                    pkg.complete && pkg.complete();
                }
            };
            next();
        };

        function perform(pkg, node, op, cb) {
            var _det = op.split('@'), _param = _det[1];
            //console.log(_det[0]);
            switch (_det[0]) {
                case 'zoom':
                    var _dur = _det.length > 2 ? parseFloat(_det[2]) : pkg.defaultDuration;
                    node.zoom(_param, _dur, cb);
                    break;
                case 'position':
                    var _ease = _det.length > 2 ? _det[2] : pkg.defaultEasing, _dur = _det.length > 3 ? parseFloat(_det[3]) : pkg.defaultDuration;
                    node.position(_param, cb, _ease, _dur);
                    break;
            }
        };

        _slate.setSize = function (w, h) {
            this.paper.setSize(w, h);
        };

        _slate.loadJSON = function (_jsonSlate, blnPreserve) {
            var _enabled = this.options.enabled;
            if (blnPreserve === undefined) {
                this.paper.clear();
                _slate.nodes.allNodes = [];
            }

            var _loadedSlate = JSON.parse(_jsonSlate);
            var _collab = this.options.collaboration;
            $s.extend(this.options, _loadedSlate.options);
            this.id = _loadedSlate.id;
            this.options.collaboration = _collab;
            
            var _deferredRelationships = [];
            $s.each(_loadedSlate.nodes, function () {
                var _boundTo = $s.instance.node(this.options);
                _slate.nodes.add(_boundTo);
                _deferredRelationships.push({ bt: _boundTo, json: this });
            });

            $s.each(_deferredRelationships, function () {
                var _bounded = this;
                _bounded.bt.addRelationships(_bounded.json, function (lines) {
                    _.invoke(lines, 'toFront');
                    _bounded.bt.vect.toFront();
                    _bounded.bt.text.toFront();
                    _bounded.bt.link.toFront();
                });
            });

            //zoom
            var _v = Math.max(this.options.viewPort.zoom.w, this.options.viewPort.zoom.h);
            this.zoom(0, 0, _v, _v, false);
            this.canvas.resize(_v);

            //reset disable if previously was disabled
            if (!_enabled) {
                _slate.disable();
            }
        };

        //the granularity is at the level of the node...
        _slate.exportDifference = function (compare) {
            var _difOpts = $s.extend({}, _slate.options);
            var _pc = _difOpts.collaboration.panelContainer;
            var _cc = _difOpts.collaboration.callbacks;
            delete _difOpts.collaboration.panelContainer;
            delete _difOpts.collaboration.callbacks;
            delete _difOpts.container;
            delete _difOpts.events;
            var jsonSlate = { options: $s.clone(_difOpts), nodes: [] };

            $s.each(_slate.nodes.allNodes, function () {
                var _exists = false;
                var pn = this;
                $s.each(compare.nodes.allNodes, function () {
                    if (this.options.id === pn.options.id) {
                        _exists = true;
                        return;
                    }
                });
                if (!_exists) jsonSlate.nodes.push(pn.serialize());
            });

            _difOpts.collaboration.panelContainer = _pc;
            _difOpts.collaboration.callbacks = _cc;

            return JSON.stringify(jsonSlate);
        };

        _slate.exportJSON = function () {
            var _cont = _slate.options.container;
            var _pcont = _slate.options.collaboration.panelContainer || null;
            var _callbacks = _slate.options.collaboration.callbacks || null;
            var _opts = _slate.options;
            delete _opts.container;
            delete _opts.collaboration.panelContainer;

            var jsonSlate = { id: _opts.id, options: $s.clone(_opts), nodes: [] };
            _slate.options.container = _cont;
            _slate.options.collaboration.panelContainer = _pcont;
            _slate.options.collaboration.callbacks = _callbacks;

            delete jsonSlate.options.events;
            delete jsonSlate.options.ajax;
            delete jsonSlate.options.container;

            var ma = [];
            $s.each(_slate.nodes.allNodes, function () {
                jsonSlate.nodes.push(this.serialize());
            });

            return JSON.stringify(jsonSlate);
        };

        _slate.snapshot = function () {
            var _snap = JSON.parse(_slate.exportJSON());
            _snap.nodes.allNodes = _snap.nodes;
            return _snap;
        };

        _slate.getOrientation = function (_nodesToOrient) {
            var orient = 'landscape', sWidth = _slate.options.viewPort.width, sHeight = _slate.options.viewPort.height, vpLeft = 0, vpTop = 0;

            var bb = new Array();
            bb['left'] = 99999; bb['right'] = 0; bb['top'] = 99999; bb['bottom'] = 0;

            var an = _nodesToOrient || _slate.nodes.allNodes;
            if (an.length > 0) {
                for (_px = 0; _px < an.length; _px++) {
                    //var sb = allNodes[_px].b.split(' ');
                    var sbw = 10;
                    //if (!isNaN(sb[0].replace('px', ''))) sbw = parseInt(sb[0].replace('px', ''));
                    var _bb = an[_px].vect.getBBox();

                    //var x = _bb.x + ((_bb.x / _slate.options.viewPort.zoom.r) - _bb.x);
                    var _r = _slate.options.viewPort.zoom.r || 1;
                    var x = _bb.x * _r;
                    var y = _bb.y * _r;
                    var w = _bb.width * _r;
                    var h = _bb.height * _r;

                    /*
                    var x = _bb.x;
                    var y = _bb.y;
                    var w = _bb.width;
                    var h = _bb.height;
                    */

                    bb['left'] = Math.abs(Math.min(bb['left'], x - sbw));
                    bb['right'] = Math.abs(Math.max(bb['right'], x + w + sbw));
                    bb['top'] = Math.abs(Math.min(bb['top'], y - sbw));
                    bb['bottom'] = Math.abs(Math.max(bb['bottom'], y + h + sbw));
                }

                var sWidth = bb['right'] - bb['left'];
                var sHeight = bb['bottom'] - bb['top'];

                if (sHeight > sWidth) {
                    orient = 'portrait';
                }
            }
            return { orientation: orient, height: sHeight, width: sWidth, left: bb['left'], top: bb['top'] };
        };

        _slate.resize = function (_size, dur, pad) {
            var _p = (pad || 0);
            if (_p < 6) _p = 6;
            _size = _size - ((_p * 2) || 0);
            var orx = _slate.getOrientation();
            var wp = (orx.width / _size) * _slate.options.viewPort.width;
            var hp = (orx.height / _size) * _slate.options.viewPort.height;
            var sp = Math.max(wp, hp);

            var _r = Math.max(_slate.options.viewPort.width, _slate.options.viewPort.height) / sp;
            var l = orx.left * _r - _p;
            var t = orx.top * _r - _p;

            _slate.zoom(0, 0, sp, sp, true);
            _slate.options.viewPort.zoom = { w: sp, h: sp, l: parseInt(l * -1), t: parseInt(t * -1), r: _slate.options.viewPort.originalWidth / sp };
            _slate.canvas.move({ x: l, y: t, dur: dur, isAbsolute: true });
        };

        _slate.stopEditing = function () {
            $s.each(_slate.nodes.allNodes, function () {
                this.editor && this.editor.end();
                this.images && this.images.end();
                this.links && this.links.end();
            });
        };

        var _prevEnabled;
        _slate.disable = function (exemptSlate) {
            $s.each(_slate.nodes.allNodes, function () {
                this.disable();
            });
            _prevEnabled = _slate.options.enabled;
            if (exemptSlate === undefined) {
                _slate.options.enabled = false;
                _slate.options.viewPort.allowDrag = false;
            }
        };

        _slate.enable = function () {
            $s.each(_slate.nodes.allNodes, function () {
                this.enable();
            });
            _slate.options.enabled = _prevEnabled;
            _slate.options.viewPort.allowDrag = true;
        };

        _slate.unMarkAll = function () {
            $s.each(_slate.nodes.allNodes, function () {
                this.unmark();
            });
        };

        var _changed = false;
        _slate.hasChanged = function () {
            return _changed;
        };

        _slate.setChanged = function (chg) {
            _changed = chg;
        };

        _slate.init = function () {

            //show zoom slider
            if (_slate.options.showZoom) {
                _slate.zoomSlider.show();
                _slate.zoomSlider.setValue(_slate.options.viewPort.width);
            }

            //show birdseye
            if (_slate.options.showBirdsEye) {
                if (_slate.birdseye.enabled()) {
                    _slate.birdseye.reload(_slate.exportJSON());
                } else {
                    _slate.birdseye.show({
                        size: _slate.options.sizeOfBirdsEye || 200
                        , onHandleMove: function (left, top) {
                        }
                    });
                }
            }

            //init collaboration
            if (_slate.options.collaboration && _slate.options.collaboration.allow) {
                //init collaboration
                _slate.signalr.init({
                    un: _slate.options.collaboration.userName
                    , up: _slate.options.collaboration.userProfile
                    , ip: _slate.options.collaboration.userIP
                    , hubName: _slate.options.collaboration.hubName
                    , url: _slate.options.collaboration.url || ''
                    , callbacks: {
                        onCollaborationWired: _slate.options.collaboration.callbacks.onCollaborationWired
                        , onCollaborationStarted: _slate.options.collaboration.callbacks.onCollaborationStarted
                        , onUnauthorized: _slate.options.collaboration.callbacks.onUnauthorized
                        , onCollaboration: _slate.options.collaboration.callbacks.onCollaboration
                    }
                });
            }

            //init multi selection mode 
            if (_slate.options.showMultiSelect) {
                _slate.multiselection && _slate.multiselection.init();
            }

            //window.onerror = function (e) {
            //TODO: add error handling
            //};
        };

        //loads plugins
        $s.each($s.fn.slate.fn, function () {
            if ($s.isFunction(this)) {
                if (arguments[0].substring(0, 1) === '_') {
                    var p = arguments[0].replace("_", "");
                    _slate[p] = {};
                    _slate[p] = this.apply(_slate[p]);
                    _slate[p]._ = _slate; //_slate[p].parent = 
                    //delete _node["_" + p];
                }
            }
        });

        _slate.tempNodeId = $s.guid();

        if ($s.isFunction(_slate.options.onInitCompleted)) {
            _slate.options.onInitCompleted.apply(this);
        }

        return _slate;
    };
    $s.fn.slate.fn = $s.fn.slate.prototype = {};
})(Slatebox);
