(function ($s, $slate) {
    $slate.fn._zoomSlider = function () {
        var _self = this, slider;

        _self.setValue = function (val) {
            slider && slider.setValue(val);
        };

        _self.hide = function () {
            if ($s.el("slateSlider") !== null) {
                _self._.options.container.removeChild($s.el("slateSlider"));
            }
        };

        _self.show = function (_options) {

            _self.hide();

            var options = {
                height: 245
                , width: 70
                , offset: { left: 10, top: 10 }
                , slider: { height: 240, min: 6000, max: 200000, set: 5000 }
            };

            $s.extend(options, _options);

            var c = _self._.options.container;
            var scx = document.createElement('div');
            scx.setAttribute("id", "slateSlider");
            scx.style.position = "absolute";
            scx.style.height = options.height + "px";
            scx.style.width = options.width + "px";
            scx.style.left = options.offset.left + "px";
            scx.style.top = options.offset.top + "px";
            c.appendChild(scx);

            options.paper = Raphael("slateSlider", options.width, options.height);

            slider = options.paper.slider(options.slider.height, options.slider.min, options.slider.max, options.slider.set, function (val) { //length, start, end, initVal, onSlide, onDone

                if (Raphael.svg) {
                    _self._.zoom(0, 0, val, val, false);
                    _self._.canvas.resize(val);
                }

            }, function (val) {
                _self.set(val);
                _self._.signalr && _self._.signalr.send({ type: 'onZoom', data: { zoomLevel: val} });
            });
        };

        _self.set = function (val) {
            _self._.zoom(0, 0, val, val, false);
            _self._.canvas.resize(val);

            var z = _self._.options.viewPort.zoom;

            _self._.options.viewPort.width = z.w;
            _self._.options.viewPort.height = z.h;
            _self._.options.viewPort.left = z.l;
            _self._.options.viewPort.top = z.t;
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate);
