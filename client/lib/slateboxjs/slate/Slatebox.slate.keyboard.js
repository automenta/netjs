(function ($s, $slate) {
    $slate.fn._keyboard = function () {
        var _self = this, hoverNode = null;

        _self.start = function (_hoverNode) {
            hoverNode = _hoverNode;
            $s.addEvent(document, "keydown", _press);
        };

        var _press = function (e) {
            var _key = $s.getKey(e);
            if (hoverNode) {
                hoverNode.context && hoverNode.context.hide();
                switch (_key) {
                    case 39: //left
                        hoverNode.connectors.addUnpinnedNode(true);
                        break;
                    case 40: //down
                        hoverNode.connectors.addPinnedNode(true);
                        break;
                    case 46: //delete
                        hoverNode.toolbar.del();
                        break;
                }
                return $s.stopEvent(e);
            } else if (_self._.multiselection && _self._.multiselection.isSelecting()) {
                switch (_key) {
                    case 46: //delete
                        _self._.multiselection.del();
                        break;
                }
            }
        };

        _self.end = function () {
            hoverNode = null;
            if (!_self._.multiselection.isSelecting()) {
                $s.removeEvent(document, "keydown", _press);
            }
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.slate);