(function ($s, $slate) {
    $slate.fn._message = function () {
        var _self = this

        _self.show = function (msg, time) {
            var mb = _self._.messageBox;
            var d = $s.getDimensions(_self._.options.container);

            if (_self._.messageBox === undefined) {
                var r = _self._.paper;
                mb = _self._.messageBox = r.set();
                mb.push(r.rect(0, 0, d.width, 28, 7).attr({ fill: "#ffff99" }));
                mb.push(r.text(0, 0, "").standard());
            }

            mb.show();

            mb[1].attr({ text: msg });
            var _w = mb[1].getBBox().width;
            mb[0].attr({ width: _w + 12 });

            var _x = _self._.options.viewPort.left + ((d.width - mb[0].attr("width")) / 2);
            var _y = _self._.options.viewPort.top + 3;
            mb[0].attr({ x: _x, y: _y, "fill-opacity": 0 });
            mb[1].attr({ x: _x + (_w / 2) + 6, y: _y + 13, "fill-opacity": 0 });

            mb.animate({ "fill-opacity": 1 }, 500, function () {
                setTimeout(function () {
                    mb.animate({ "fill-opacity": 0 }, 500, function () {
                        mb.hide();
                    });
                }, time);
            });
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate);