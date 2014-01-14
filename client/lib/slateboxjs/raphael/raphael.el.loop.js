;(function($s) {
    Raphael.el.loop = function (_options) {
        var options = {
            pkg: [{"stroke-width": 3}, {"stroke-width": 1}]
            , duration: 200
            , repeat: false
        };
        $s.extend(options, _options);

        var _self = this;
        function loop() {
            _self.animate(options.pkg[0], options.duration, function() {
                _self.animate(options.pkg[1], options.duration, function() {
                    if (options.repeat) {
                        loop();
                    }
                });
            });
        };

        loop();

        return this;
    }
})(Slatebox);