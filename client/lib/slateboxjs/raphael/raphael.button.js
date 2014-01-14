; (function ($s) {
    Raphael.st.button = function (_options) {
        var options = {
            mousedown: null
            ,mouseover: null
            ,node: {}
        };
        $s.extend(options, _options);

        var _self = this, _glows = [];

        _self.emd = function(e) {
            _.invoke(_glows, 'remove');
            options.mousedown.apply(this, [e, options.node]);
        };
        _self.emo = function(e) {
            options.mouseover.apply(this, [e, options.node]);
        };

        _self.forEach(function (el) {
            el.node.style.cursor = 'pointer';
            if (options.mousedown !== null) {
                el.mousedown(_self.emd);
            }

            if (options.mouseover !== null) {
                el.mouseover(_self.emo);
            }
        });
       
        _self.gl = function (e) {
            _glows.push(this.glow());
        };
        _self.eg = function (e) {
            _.invoke(_glows, 'remove');
        };
        _self.kg = function (t) {
            _.invoke(_glows, 'remove');
            _glows.push(t.glow());
        };

        var _vect = this[0];
        _self.tmover = function(e) {
            _self.kg(_vect);
        };
        _self.tmout = function(e) {
            _.invoke(_glows, 'remove');
        };

        _self[0].mouseover(_self.gl);
        _self[0].mouseout(_self.eg);
        
        _self[1].mouseover(_self.tmover);
        _self[1].mouseout(_self.tmout);

        return _self;
    }
})(Slatebox);

(function ($s) {
    Raphael.st.unbutton = function () {
        var _self = this;

        _self.forEach(function (el) {
            el.unmousedown(_self.emd);
            el.unmouseover(_self.emo);
        });

        _self[0].unmouseover(_self.gl);
        _self[0].unmouseout(_self.eg);
        
        _self[1].unmouseover(_self.tmover);
        _self[1].unmouseout(_self.tmout);

        return _self;
    }
})(Slatebox);