(function ($s, $n) {
    $n.fn._colorpicker = function (_options) {
        var options = {
            colors: [
                { hex: "000000", to: "575757"} //black //six to a row
                , { hex: "FFFFFF", to: "d9d9d9"} //white
                , { hex: "FF0000", to: "a31616"} //red
                , { hex: "C3FF68", to: "afff68"} //green
                , { hex: "0B486B", to: "3B88B5"} //blue
                , { hex: "FBB829", to: "cd900e"} //orange
                , { hex: "BFF202", to: "D1F940"} //yellow
                , { hex: "FF0066", to: "aa1d55"} ///pink
                , { hex: "800F25", to: "3d0812"} //dark red
                , { hex: "A40802", to: "d70b03"} //red
                , { hex: "FF5EAA", to: "cf5d93"} //strong pink
                , { hex: "740062", to: "D962C6"} //purple
                , { hex: "FF4242", to: "A61515"} //red
                , { hex: "D15C57", to: "9D5C58"} //pinkish
                , { hex: "FCFBE3", to: "c9c56f"} //light yellow-white
                , { hex: "FF9900", to: "c98826"} //orange
                , { hex: "369001", to: "9CEE6C"} //green
                , { hex: "9E906E", to: "675324"} //brown
                , { hex: "F3D915", to: "F9EA7C"} //yellow 2
                , { hex: "031634", to: "2D579A"} // dark blue
                , { hex: "556270", to: "7b92ab"} //gray-blue
                , { hex: "1693A5", to: "23aad6"} //turquoise
                , { hex: "ADD8C7", to: "59a989"} //light turquoise
                , { hex: "261C21", to: "EB9605" }
            ]
            , useColorLovers: false
        };
        $s.extend(options, _options);
        if (options.colors !== null) {
            $s.availColors = options.colors;
        }
        var _self = this;

        function getColors(callback) {
            if ($s.availColors === undefined) {
                var apiUrl = "http://www.colourlovers.com/api/colors/top&jsonCallback=?"; //&context=" + this.imageContext;
                $s.getJSON(apiUrl,
                    function (data) {
                        $s.availColors = data;
                        if ($s.isFunction(callback))
                            callback.apply(this, [$s.availColors]);
                    }
                );
            } else {
                if ($s.isFunction(callback))
                    callback.apply(this, [$s.availColors]);
            }
        };

        _self.prepColors = function () {
            getColors();
        };

        _self.show = function (x, y, _m) {

            var wx = _m[4].attr("width");

            var _rowOff = wx - 125;

            var _x = x + _rowOff;
            var _y = y + 5;

            getColors(function (data) {
                var tot = -1, rowCount = 6, rp = _self._.slate.paper, w = 15, h = 15, p = 4;

                $s.each(data, function () {
                    tot++;
                    if (tot % rowCount === 0 && tot !== 0) {
                        _y += h + p;
                        _x = _self._.options.xPos + _rowOff;
                        if (_self._.options.vectorPath === 'ellipse') {
                            _x = _x - _self._.options.width / 2;
                        }
                    }
                    var _hex = this.hex;
                    var _to = this.to;
                    var _swatch = rp.rect(_x, _y, w, h, 3).attr({ stroke: '#000', fill: ["90-#", _hex, "-#", _to].join('') });

                    _swatch.mouseover(function (e) {
                        _self._.slate.glow(this);
                        //this.animate({ transform: "s1.5, 1.5" }, 200);
                    });

                    _swatch.mouseout(function (e) {
                        _self._.slate.unglow();
                        //this.animate({ transform: "s1,1" }, 200);
                    });

                    _swatch.mousedown(function (e) {
                        this.loop();
                        var _backColor = this.attr("fill");
                        var _testColor = "#" + _backColor.split(/90-#/g)[1].split(/-#/g)[0];
                        var _textColor = Raphael.rgb2hsb(_testColor).b < .4 ? "#fff" : "#000";

                        if (_self._.options.image !== "") _self._.options.image = "";

                        var _pkg = { type: "onNodeColorChanged", data: { id: _self._.options.id, color: _backColor} };
                        broadcast(_pkg);
                        _self._.slate.birdseye && _self._.slate.birdseye.nodeChanged(_pkg);
                    });

                    _m.push(_swatch);
                    _x += w + p;
                    if (tot > 19) return;
                });
            });
        };

        function broadcast(_pkg) {
            _self.set(_pkg.data);
            _self._.slate.signalr && _self._.slate.signalr.send(_pkg);
        };

        _self.set = function (cast) {
            _self._.options.backgroundColor = cast.color;
            _self._.vect.attr({ fill: cast.color });
            //$s.each(_self._.relationships.children, function () {
            //    this.lineColor = cast.color;
            //});
            _self._.relationships.refresh();
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.node);