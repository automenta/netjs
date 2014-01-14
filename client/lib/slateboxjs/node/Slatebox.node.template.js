(function ($s, $n) {
    $n.fn._template = new function() {
        var _self = this;

        _self.hello = function () { alert(parent.options.name); }

        return _self;
    }
})(Slatebox, Slatebox.fn.node);