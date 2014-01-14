// Notify.js 0.5.0
// (c) 2012 Tim Heckel
// Notify.js may be freely distributed under the MIT license.

(function ($s, $e) {
    var n = function () {
        var _self = this;

        if (!(_self instanceof Notify))
            return new Notify();

        var uid = $s.guid();
        var options = {
            msg: ''
            , hgt: 50
            , duration: 300
            , className: 'warningBar'
            , delayClose: 0
            , spinner: null //{innerDiameter: 16, outerDiameter: 8, ticks: 6, ticksWidth: 5, color: #fff}
            , hideClose: false
            , onOpen: null
            , msgBar: "messageBar" + uid
            , popFromBottom: false
        };

        _self.message = function (_options) {
            $s.extend(options, _options);

            //hide other bars if visible
            $s.each($s.select("div.notify"), function () {
                this.style.visibility = 'hidden';
            });

            if ($s.el(options.msgBar) && $s.el(options.msgBar).style.visibility === "visible") {
                var _height = $s.getDimensions($s.el(options.msgBar)).height;
                $e($s.el(options.msgBar), "top:" + _height * -1 + "px", {
                    duration: options.duration
                    , after: function () {
                        if ($s.el(options.msgBar) !== null) {
                            document.body.removeChild($s.el(options.msgBar));
                        }
                        buildBar();
                    }
                });
            } else {
                buildBar();
            }

            function buildBar() {
                var _inside = "<div style='min-width:950px;'><div id='msgSpinner_" + uid + "' style='padding:2px;float:left;width:30px;'></div><div style='text-align:left;padding: 10px;float:left;width:84%;' id='notifyBarMessage_" + uid + "'>" + options.msg + "</div><div style='float:right;margin-top:6px;padding-right:2px;width:4%;'><a href='javascript:' class='lnkCloseMessage' id='lnkCloseMessage_" + uid + "'>X</a></div></div>";
                var _notify = document.createElement("div");
                _notify.setAttribute("class", options.className + " notify");
                _notify.setAttribute("rel", options.popFromBottom); //for resizing window
                _notify.style.position = "absolute";
                _notify.style.height = options.hgt + "px";

                var _cssToAnimate = "top:0px";
                if (options.popFromBottom) {
                    var ws = $s.windowSize();
                    _notify.style.top = (ws.height + options.hgt) + "px";
                    _cssToAnimate = "top:" + (ws.height - options.hgt) + "px";
                } else {
                    _notify.style.top = (options.hgt * -1) + "px";
                }

                //_notify.style.display = "none";
                _notify.setAttribute("id", options.msgBar);
                _notify.innerHTML = _inside;
                document.body.appendChild(_notify);

                $e($s.el(options.msgBar), _cssToAnimate, {
                    duration: options.duration
                    , after: function () {
                        if (options.spinner) {
                            options.spinner = new spinner($s.el("msgSpinner_" + uid), options.spinner.innerDiameter, options.spinner.outerDiameter, options.spinner.ticks, options.spinner.ticksWidth, options.spinner.color);
                        }

                        if (!options.hideClose) {
                            $s.el('lnkCloseMessage_' + uid).onclick = function (e) {
                                e.preventDefault();
                                _self.closeMessage();
                            };
                        } else {
                            $s.el("lnkCloseMessage_" + uid).style.display = "none";
                        }

                        if (options.delayClose && options.delayClose > 0) {
                            setTimeout(function () {
                                if ($s.isFunction(options.spinner)) {
                                    options.spinner();
                                }
                                setTimeout(function () {
                                    _self.closeMessage();
                                }, options.duration);
                            }, options.delayClose);
                        }

                        if ($s.isFunction(options.onOpen)) {
                            options.onOpen.apply(this, [$s.el("notifyBarMessage_" + uid), _self]);
                        }
                    }
                });
            };
            return _self;
        }

        _self.changeMessage = function (msg) {
            $s.el("notifyBarMessage_" + uid).innerHTML = msg;
            return _self;
        };

        _self.visible = function () {
            return $s.el(options.msgBar) !== null;
        };

        _self.resize = function (h, d, cb) {
            if ($s.el(options.msgBar) !== null) {

                var _cssToAnimate = "top:" + (h * -1) + "px";
                if (options.popFromBottom)
                    _cssToAnimate = "top:" + ($s.windowSize().height - h) + "px";

                $e($s.el(options.msgBar), _cssToAnimate, {
                    duration: d
                    , after: function () {
                        if ($s.isFunction(cb)) {
                            cb.apply(this);
                        }
                    }
                });
            } else {
                if ($s.isFunction(cb)) {
                    cb.apply(this);
                }
            }
        };

        _self.closeMessage = function (cb) {
            if ($s.el(options.msgBar) !== null) {

                var _cssToAnimate = "top:" + (options.hgt * -1) + "px";
                if (options.popFromBottom)
                    _cssToAnimate = "top:" + ($s.windowSize().height + options.hgt) + "px";

                $e($s.el(options.msgBar), _cssToAnimate, {
                    duration: options.duration
                    , after: function () {
                        document.body.removeChild($s.el(options.msgBar));

                        //show other bars if hidden
                        $s.each($s.select("div.notify"), function () {
                            this.style.visibility = 'visible';
                        });

                        if ($s.isFunction(options.onClose)) {
                            options.onClose.apply(this);
                        }
                        if ($s.isFunction(cb)) {
                            cb.apply(this);
                        }
                    }
                });
            } else {
                if ($s.isFunction(cb)) {
                    cb.apply(this);
                }
            }
        };
    };
    $s.addEvent(window, "resize", function () {
        $s.each($s.select("div.notify"), function () {
            if (this.getAttribute("rel") === "true") {
                var ws = $s.windowSize();
                var d = $s.getDimensions(this);
                this.style.top = (ws.height - d.height) + "px";
            }
        });
    });
    window.Notify = n;
})(Slatebox, emile);