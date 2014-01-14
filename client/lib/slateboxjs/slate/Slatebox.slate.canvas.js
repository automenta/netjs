(function ($s, $slate) {
    $slate.fn._canvas = function () {
        if (Raphael === undefined) {
            alert("You must load Raphael in order to use the Slatebox.slate.canvas.js plugin!");
        }

        var _self = this, _paper, _internal, _status, imageFolder, _dken = null;

        var cp = function (e) {
            var m = $s.mousePos(e);

            difX = Canvas.objInitPos.left + (m.x - Canvas.objInitialMousePos.x);
            difY = Canvas.objInitPos.top + (m.y - Canvas.objInitialMousePos.y);

            _width = _self._.options.containerStyle.width;
            _height = _self._.options.containerStyle.height;
            _vpWidth = _self._.options.viewPort.width;
            _vpHeight = _self._.options.viewPort.height;

            if (difX > 0) difX = 0; else if (Math.abs(difX) + _width > _vpWidth) difX = _width - vpWidth;
            if (difY > 0) difY = 0; else if (Math.abs(difY) + _height > _vpHeight) difY = _height - _vpHeight;

            return { x: difX, y: difY };
        };

        var Canvas = {
            objInitPos: {},
            objInitialMousePos: { x: 0, y: 0 },
            kinetic: null,
            isDragging: false,
            initDrag: function (e) {

                _self._.options.events && _self._.options.events.onCanvasClicked && _self._.options.events.onCanvasClicked();

                if (_self._.options.viewPort.allowDrag) {
                    _self._.multiselection && _self._.multiselection.end();
                    this.isDragging = true;
                    var m = $s.mousePos(e);
                    Canvas.objInitPos = $s.positionedOffset(_internal);
                    var offsets = $s.positionedOffset(_self._.options.container);
                    Canvas.objInitialMousePos = { x: m.x + offsets.left, y: m.y + offsets.top };

                    var xy = cp(e);

                    _status.innerHTML = Math.abs(xy.x) + ', ' + Math.abs(xy.y);

                    if (_self._.options.showStatus) {
                        _status.style.display = 'block';
                        _self._.multiselection && _self._.multiselection.hide();
                    }

                    _internal.style.cursor = 'url(' + imageFolder + 'closedhand.cur), default';

                    if (m.allTouches) {
                        _self._.options.lastTouches = m.allTouches;
                    }

                    if ($s.isFunction(_self._.removeContextMenus)) _self._.removeContextMenus();
                    $s.stopEvent(e);
                } else {
                    if ($s.isFunction(_self._.onSelectionStart)) {
                        _self._.onSelectionStart.apply(this, [e]);
                    } else {
                        $s.stopEvent(e);
                    }
                }
            },
            setCursor: function (containerInstance) {
                if (this.isDragging)
                    _internal.style.cursor = 'url(' + imageFolder + 'closedhand.cur), default';
                else
                    _internal.style.cursor = 'url(' + imageFolder + 'openhand.cur), default';
            },
            onDrag: function (e) {
                if (this.isDragging && _self._.options.viewPort.allowDrag) {
                    var xy = cp(e);
                    if (xy.allTouches && xy.allTouches.length > 1) {
                        _self._.options.lastTouches = xy.allTouches;
                    }

                    _status.innerHTML = Math.abs(xy.x) + ', ' + Math.abs(xy.y);
                    _internal.style.left = xy.x + "px";
                    _internal.style.top = xy.y + "px";
                }
            },
            endDrag: function (e) {
                if (this.isDragging && _self._.options.viewPort.allowDrag) {
                    this.isDragging = false;
                    //var m = $s.mousePos(e);

                    _internal.style.cursor = 'url(' + imageFolder + 'openhand.cur), default';
                    _status.style.display = 'none';
                    _self._.multiselection && _self._.multiselection.show();

                    var xy = cp(e);
                    _self.endDrag(xy);

                    /*
                    if (!isNaN(Canvas.objInitPos.left)) {
                    difX = Canvas.objInitPos.left + (Canvas.objInitialMousePos.x);
                    difY = Canvas.objInitPos.top + (Canvas.objInitialMousePos.y);

                    _width = _self._.options.containerStyle.width;
                    _height = _self._.options.containerStyle.height;

                    vpWidth = _self._.options.viewPort.width; //* _self._.options.viewPort.zoom) / _self._.options.viewPort.width;
                    vpHeight = _self._.options.viewPort.height // * _self._.options.viewPort.zoom) / _self._.options.viewPort.height;

                    if (difX >= 0) difX = 0; else if (Math.abs(difX) + _width > vpWidth) difX = _width - vpWidth;
                    if (difY >= 0) difY = 0; else if (Math.abs(difY) + _height > vpHeight) difY = _height - vpHeight;
                    Canvas.objInitPos = {};

                    _self._.options.viewPort.left = Math.abs(difX); // Math.abs((difX * _self._.options.viewPort.zoom) / _self._.options.viewPort.width);
                    _self._.options.viewPort.top = Math.abs(difY); // Math.abs((difY * _self._.options.viewPort.zoom) / _self._.options.viewPort.height);
                    //Canvas.saveAndBroadcast(difX, difY);
                    }
                    */
                }
            }
        };

        _self.endDrag = function (coords) {
            _self._.options.viewPort.left = Math.abs(coords.x); // Math.abs((difX * _self._.options.viewPort.zoom) / _self._.options.viewPort.width);
            _self._.options.viewPort.top = Math.abs(coords.y); // Math.abs((difY * _self._.options.viewPort.zoom) / _self._.options.viewPort.height);

            _internal.style.left = coords.x + "px";
            _internal.style.top = coords.y + "px";

            _self._.birdseye && _self._.birdseye.refresh(true);

            if (_self._.options.collaboration.allow) _self.broadcast();
        }


        _self.broadcast = function () {
            _self._.signalr && _self._.signalr.send({ type: "onCanvasMove", data: { left: _self._.options.viewPort.left, top: _self._.options.viewPort.top} });
        };

        _self.zoom = function (_opts) {

            var opts = {
                dur: 500
                , callbacks: { after: null, during: null }
                , easing: 'easeFromTo'
                , zoomPercent: 100
            };

            $s.extend(opts, _opts);

            _self._.nodes.closeAllConnectors();
            var dc = $s.isFunction(opts.callbacks.during);

            var _startZoom = _self._.options.viewPort.zoom.w;
            var _targetZoom = _self._.options.viewPort.originalWidth * (100 / parseInt(opts.zoomPercent));
            var _zoomDif = Math.abs(_targetZoom - _startZoom);

            opts.dur = opts.dur || 500;

            //_internal.style.transform = perspective(config.perspective / targetScale) + scale(_zoomDif);
            //_internal.style.transitionDuration = opts.dur + "ms";
            //_internal.style.transitionDelay = "0ms";

            emile(_internal, "padding:1px", {
                duration: opts.dur
                , before: function () {
                    _self._.options.viewPort.allowDrag = false;
                }
                , after: function () {
                    _self._.options.viewPort.allowDrag = true;
                    _self._.zoomSlider.set(_targetZoom);
                    _self._.birdseye && _self._.birdseye.refresh(true);
                    opts.callbacks.after && opts.callbacks.after.apply(_self, [_targetZoom]);
                }
                , during: function (pc) {
                    var _val = _targetZoom > _startZoom ? (_startZoom + (_zoomDif * pc)) : (_startZoom - (_zoomDif * pc));
                    _self._.zoom(0, 0, _val, _val, false);
                    _self._.canvas.resize(_val);

                    dc && opts.callbacks.during.apply(this, [pc]);
                }
                , easing: _self.easing[opts.easing]
            });
        };

        _self.scaleToFitNodes = function (_opts) {
            var opts = {
                nodes: []
                , dur: 500
                , cb: null
                , offset: 0
                , minWidth: 600
                , minHeight: 300
            };
            $s.extend(opts, _opts);

            var orient = _self._.getOrientation(opts.nodes);
            var d = $s.getDimensions(_self._.options.container);

            if (d.width > opts.minWidth && d.height > opts.minHeight) {

                var _curMinWin = Math.min(d.width, d.height);

                //get current zoom percent
                var _cp = (_self._.options.viewPort.zoom.w / _self._.options.viewPort.originalWidth) * 100;

                //var _minOrient = Math.max(orient.width, orient.height);
                //var _minWin = Math.max(d.width, d.height);

                var _wp = 100 + (100 - (_cp * orient.width / d.width));
                var _hp = 100 + (100 - (_cp * orient.height / d.height));

                var _tp = Math.abs(Math.min(_wp, _hp)) - opts.offset;

                //zoom canvas
                _self.zoom({
                    dur: 500
                    , callbacks: {
                        after: function () {
                            opts.cb && opts.cb();
                        }
                    }
                    , easing: 'easeFromTo'
                    , zoomPercent: _tp
                });
            }
        };

        //useful for centering the canvas on a collection of nodes
        _self.centerOnNodes = function (_opts) {
            var opts = {
                nodes: []
                , dur: 500
                , cb: null
            };
            $s.extend(opts, _opts);
            var orient = _self._.getOrientation(opts.nodes);
            var d = $s.getDimensions(_self._.options.container);
            var cw = d.width, ch = d.height, nw = orient.width, nh = orient.height, pad = 10;

            //console.log("orient width: " + nw + " , height: " + nh + " | width: " + cw + " , height: " + ch);

            //get upper left coords
            var _x = orient.left - (cw / 2 - nw / 2);
            var _y = orient.top - (ch / 2 - nh / 2);

            _self.move({ x: _x, y: _y, isAbsolute: true, duration: opts.dur, easing: 'swingFromTo', callbacks: { after: function () { opts.cb && opts.cb(); } } });
        };

        //useful for centering the canvas by comparing the viewport's previous width/height to its current width/height        
        _self.center = function (_opts) {
            var opts = {
                previousWindowSize: {}
                , dur: 500
                , cb: null
            };
            $s.extend(opts, _opts);
            var ws = $s.windowSize();
            _self.move({
                x: ((ws.width - opts.previousWindowSize.w) / 2) * -1
                , y: ((ws.height - opts.previousWindowSize.h) / 2) * -1
                , duration: opts.dur
                , isAbsolute: false
                , easing: 'swingFromTo'
                , callbacks: {
                    after: function () {
                        opts.cb && opts.cb();
                    }
                }
            });
            return ws;
        };

        _self.move = function (_opts) {
            var opts = {
                x: 0
                , y: 0
                , dur: 500
                , callbacks: { after: null, during: null }
                , isAbsolute: true
                , easing: 'easeFromTo'
            };

            $s.extend(opts, _opts);

            _self._.nodes.closeAllConnectors();
            var x = opts.x;
            var y = opts.y;
            var dc = $s.isFunction(opts.callbacks.during);
            if (opts.isAbsolute === false) {
                x = _self._.options.viewPort.left + x;
                y = _self._.options.viewPort.top + y;
            }

            if (opts.dur > 0) {
                emile(_internal, "left:" + (x * -1) + "px;top:" + y * -1 + "px", {
                    duration: opts.dur
                    , before: function () {
                        _self._.options.viewPort.allowDrag = false;
                    }
                    , after: function () {
                        _self._.options.viewPort.allowDrag = true;
                        _self._.options.viewPort.left = Math.abs(parseInt(_internal.style.left.replace("px", "")));
                        _self._.options.viewPort.top = Math.abs(parseInt(_internal.style.top.replace("px", "")));
                        _self._.birdseye && _self._.birdseye.refresh(true);
                        opts.callbacks.after && opts.callbacks.after.apply(_self);
                    }
                    , during: function (pc) {
                        dc && opts.callbacks.during.apply(this, [pc]);
                    }
                    , easing: _self.easing[opts.easing]
                });

            } else {
                //x = Math.abs(_self._.options.viewPort.left) + Math.abs(x) * -1;
                //y = Math.abs(_self._.options.viewPort.top) + Math.abs(y) * -1;
                _internal.style.left = (x * -1) + "px";
                _internal.style.top = (y * -1) + "px";
                _self._.options.viewPort.left = Math.abs(x);
                _self._.options.viewPort.top = Math.abs(y);
            }
        };

        _self.resize = function (val) {

            val = parseInt(val);

            var R = (_self._.options.viewPort.width / val);
            var dimen = $s.getDimensions(_self._.options.container);

            _internal.style.width = "50000px";
            _internal.style.height = "50000px";

            var _top = ((_self._.options.viewPort.top * -1) * R);
            var _left = ((_self._.options.viewPort.left * -1) * R);

            var _centerY = (((dimen.height / 2 * R) - (dimen.height / 2)) * -1);
            var _centerX = (((dimen.width / 2 * R) - (dimen.width / 2)) * -1);

            _top = (_top + _centerY);
            _left = (_left + _centerX);

            _internal.style.top = _top + "px";
            _internal.style.left = _left + "px";

            _self._.options.viewPort.zoom = { w: val, h: val, l: parseInt(_left * -1), t: parseInt(_top * -1), r: _self._.options.viewPort.originalWidth / val };
            //console.log(val);
            //if (_self._.options.viewPort.lockZoom === false) z.r = R;
        };

        _self.clear = function () {
            _self._.options.container.innerHTML = "";
            return _self._;
        };

        var _eve = {
            init: ['onmousedown', 'ontouchstart']
            , drag: ['onmousemove', 'ontouchmove']
            , up: ['onmouseup', 'ontouchend', 'onmouseout']
            , gest: ['ongesturestart', 'ongesturechange', 'ongestureend']
        };

        _self.wire = function () {
            for (var ee in _eve.init) { _internal[_eve.init[parseInt(ee)]] = Canvas.initDrag; }
            for (var ee in _eve.drag) { _internal[_eve.drag[parseInt(ee)]] = Canvas.onDrag; }
            for (var ee in _eve.up) { _internal[_eve.up[parseInt(ee)]] = Canvas.endDrag; }

            var origVal, zoomX, zoomY;
            _internal.ongesturestart = function (e) {
                e.preventDefault();
                _self._.options.viewPort.allowDrag = false;
                if (_self._.options.lastTouches) {
                    var lt = _self._.options.lastTouches;
                    zoomX = lt[0].x;
                    zoomY = lt[0].y;
                    if (lt.length > 1) {
                        zoomX = (Math.max(lt[0].x, lt[1].x || 0) - Math.min(lt[0].x, lt[1].x || lt[0].x)) / 2; // + Math.min(lt[0].x, lt[1].x || lt[0].x);
                        zoomY = (Math.max(lt[0].y, lt[1].y || 0) - Math.min(lt[0].y, lt[1].y || lt[0].y)) / 2; // + Math.min(lt[0].y, lt[1].y || lt[0].y);
                    }
                    origVal = _self._.options.viewPort.zoom.w;
                    //_self._.paper.rect(xMiddle + _self._.options.viewPort.left, yMiddle + _self._.options.viewPort.top, 10, 10);
                }
            }
            _internal.ongesturechange = function (e) {
                var val = origVal / e.scale;

                _self._.zoom(0, 0, val, val, false);
                _self._.canvas.resize(val); //, zoomX, zoomY

                $s.select('li.rmitem')[0].innerHTML = _self._.options.lastTouches[0].x + " , " + _self._.options.lastTouches[1].x
            }
            _internal.ongestureend = function (e) {
                _self._.options.viewPort.allowDrag = true;
                //try expanding the canvas -- i think this is consistently firing, but the _internal is out of scope after a bit...

                //$s.select('li.rmitem')[0].innerHTML = z.w + " , " + z.h + " , " + z.l + " , " + z.t;
                var z = _self._.options.viewPort.zoom;
                var vp = _self._.options.viewPort;
                vp.width = z.w;
                vp.height = z.h;
                vp.left = z.l;
                vp.top = z.t;
            }


        };

        _self.unwire = function () {
            for (var ee in _eve.init) {
                _internal[_eve.init[parseInt(ee)]] = null;
            }
            for (var ee in _eve.drag) { _internal[_eve.drag[parseInt(ee)]] = null; }
            for (var ee in _eve.up) { _internal[_eve.up[parseInt(ee)]] = null; }
            for (var ee in _eve.gest) { _internal[_eve.gest[parseInt(ee)]] = null; }
        };

        _self.init = function (_options) {
            var options = { imageFolder: '/public/images/' };
            $s.extend(options, _options);
            var c = _self._.options.container;
            _self._.options.imageFolder = options.imageFolder;
            imageFolder = options.imageFolder;
            if (typeof (c) === "string") c = $s.el(c);
            if (c === undefined || c === null) {
                throw new Error("You must provide a container to initiate the canvas!");
            }

            /*
            var _cw = _self._.options.containerStyle.width + "px";
            var _ch = _self._.options.containerStyle.height + "px";
            if (_self._.options.containerStyle.width === 'auto') {
            _ws = $s.windowSize();
            _self._.options.containerStyle.width = _ws.width;
            _self._.options.containerStyle.height = _ws.height;
            _cw = _ws.width + "px";
            _ch = _ws.height + "px"
            }

            c.style.width = _cw;
            c.style.height = _ch;
            */

            //wipe it clean
            c.innerHTML = "";
            if (_paper) _paper.clear();

            if (_internal) c.removeChild(_internal);

            //internal
            _internal = document.createElement('div');
            _internal.setAttribute("class", "slateboxInternal");
            c.appendChild(_internal);

            //status
            var d = $s.getDimensions(c);
            _status = document.createElement("div");
            _status.style.position = "absolute";
            _status.style.height = " 20px";
            _status.style.left = '0px';
            _status.style.color = "#000";
            _status.style.fontSize = "10pt";
            _status.style.fontFamily = "trebuchet ms";
            _status.style.top = "0px";
            _status.style.display = "none";
            _status.style.padding = "5px";
            _status.style.filter = "alpha(opacity=80)";
            _status.style.opacity = '.80';
            _status.style.backgroundColor = "#ffff99"
            _status.style.fontWeight = "bold";
            c.appendChild(_status);

            //style container
            var cs = _self._.options.containerStyle;
            //c.style.border = cs.border;
            //c.style.backgroundImage = cs.backgroundImage;
            //c.style.backgroundRepeat = cs.backgroundImageIsTiled; bad for ie
            //c.style.backgroundColor = cs.backgroundColor;
            c.style.position = "relative";
            c.style.overflow = "hidden";

            //style internal
            var _w = _self._.options.viewPort.width;
            var _h = _self._.options.viewPort.height;
            var _l = _self._.options.viewPort.left;
            var _t = _self._.options.viewPort.top;
            _internal.style.width = _w + "px";
            _internal.style.height = _h + "px";
            _internal.style.left = (_l * -1) + "px";
            _internal.style.top = (_t * -1) + "px";
            _internal.style.position = 'absolute';
            _self.borderTop = _self.borderTop + 2 || 2;
            _internal.style.borderTop = _self.borderTop + "px";
            _internal.style.cursor = 'url(' + imageFolder + 'openhand.cur), default'

            if (_self._.options.viewPort.allowDrag) {
                _self.wire();
            }

            _paper = Raphael(_internal, _w, _h);

            _self._.options.viewPort.originalHeight = _h;
            _self._.options.viewPort.originalWidth = _w;

            //set up initial zoom params
            _self.resize(_w);

            _self._.paper = _paper;
            return _self._;
        };

        _self.rawSVG = function () {
            return _internal.innerHTML;
        };

        _self.darken = function (percent) {
            if (_dken === null) {
                _dken = document.createElement("div");
                var ws = $s.windowSize();
                _dken.style.backgroundColor = '#ccc';
                _dken.style.position = 'absolute';
                _dken.style.left = '0px';
                _dken.style.top = '0px';
                _dken.style.width = ws.width + "px";
                _dken.style.height = ws.height + "px";
                _dken.style.zIndex = 999;
                _dken.style.filter = "alpha(opacity=" + percent + ")";
                _dken.style.opacity = (percent / 100);
                document.body.appendChild(_dken);
            }
            return _dken;
        };

        $s.addEvent(window, "resize", function () {
            if (_dken !== null) {
                var ws = $s.windowSize();
                _dken.style.width = ws.width + "px";
                _dken.style.height = ws.height + "px";
            }
        });

        _self.lighten = function () {
            _dken && document.body.removeChild(_dken);
            _dken = null;
        };

        _self.get = function () {
            return _internal;
        };

        _self.draggable = function () { return _internal; }

        _self.easing = {
            elastic: function (pos) { return -1 * Math.pow(4, -8 * pos) * Math.sin((pos * 6 - 1) * (2 * Math.PI) / 2) + 1 },
            swingFromTo: function (pos) { var s = 1.70158; return ((pos /= 0.5) < 1) ? 0.5 * (pos * pos * (((s *= (1.525)) + 1) * pos - s)) : 0.5 * ((pos -= 2) * pos * (((s *= (1.525)) + 1) * pos + s) + 2) },
            swingFrom: function (pos) { var s = 1.70158; return pos * pos * ((s + 1) * pos - s) },
            swingTo: function (pos) { var s = 1.70158; return (pos -= 1) * pos * ((s + 1) * pos + s) + 1 },
            bounce: function (pos) { if (pos < (1 / 2.75)) { return (7.5625 * pos * pos) } else { if (pos < (2 / 2.75)) { return (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75) } else { if (pos < (2.5 / 2.75)) { return (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375) } else { return (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375) } } } },
            bouncePast: function (pos) { if (pos < (1 / 2.75)) { return (7.5625 * pos * pos) } else { if (pos < (2 / 2.75)) { return 2 - (7.5625 * (pos -= (1.5 / 2.75)) * pos + 0.75) } else { if (pos < (2.5 / 2.75)) { return 2 - (7.5625 * (pos -= (2.25 / 2.75)) * pos + 0.9375) } else { return 2 - (7.5625 * (pos -= (2.625 / 2.75)) * pos + 0.984375) } } } },
            easeFromTo: function (pos) { if ((pos /= 0.5) < 1) { return 0.5 * Math.pow(pos, 4) } return -0.5 * ((pos -= 2) * Math.pow(pos, 3) - 2) },
            easeFrom: function (pos) { return Math.pow(pos, 4) },
            easeTo: function (pos) { return Math.pow(pos, 0.25) },
            none: function (pos) { return (-Math.cos(pos * Math.PI) / 2) + 0.5; }
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate);
