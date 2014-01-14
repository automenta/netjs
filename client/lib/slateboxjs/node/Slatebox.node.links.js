(function ($s, $n) {
    $n.fn._links = function () {
        var _self = this, _ntfy;

        var options = {
            thumbUrl: '/Thumbnail'
            , existenceUrl: '/UrlExists'
        };

        _self.start = function (_options) {
            _self._.slate.nodes.closeAllMenus();

            $s.extend(options, (_options || {}));

            _ntfy = new Notify().message({
                hgt: 185
                , duration: 200
                , className: 'embedBar'
                , delayClose: 0
                , spinner: null
                , hideClose: false
                , popFromBottom: true
                , onOpen: function (container, _ntfy) {
                    _self._.slate.unglow();
                    container.innerHTML = "<div style='width:900px;'>" +
                                            "<div id='linkForm'><div id='provideUrlPlaceholder' style='height:75px;width:900px;'>" +
                                                "<span style='font-size:20pt;' id='spnEmbedAction'>Provide an external link (will always open in a new window)</span><br/>" +
                                                "<span style='font-size:20pt;color:#ccc;' id='embedUrlPrefix'>http://</span>" +
                                                "<input type='text' id='txtUrl' style='width:450px;font-size:20pt;'/>" +
                                                "&nbsp;<button id='btnApply' style='font-size:20pt;'>go</button>&nbsp;<button id='btnRemove' style='font-size:20pt;visibility:hidden;'>remove</button>" +
                                            "</div>" +
                                            "<div id='messagePlaceholder' style='display:none;height:75px;font-size:20pt;width:900px;'></div>" +
                                            "<div style='margin-top:10px;padding:3px;width:800px;height:63px;font-size:14pt;'>WHERE do you want to link to?" +
                                                "<div style='border-top:1px dashed #ccc;padding:5px;font-size:12pt;'>" +
                                                    "<label for='radioLinkUrl' style='float:left;cursor:pointer;'>" +
                                                        "<input type='radio' id='radioLinkUrl' name='linkType' checked/>" +
                                                        "an EXTERNAL website" +
                                                    "</label>" +
                                                    "<label for='radioLinkSlate' style='float:left;margin-left:15px;cursor:pointer;'>" +
                                                        "<input type='radio' id='radioLinkSlate' name='linkType'/>" +
                                                        "a node on THIS slate" +
                                                    "</label>" +
                                                    "<label for='radioLinkExternalSlate' style='margin-left:15px;float:left;cursor:pointer;display:none;'>" +
                                                        "<input type='radio' id='radioLinkExternalSlate' name='linkType' disabled/>" +
                                                        "a DIFFERENT slate<br/>(coming soon)" +
                                                    "</label>" +
                                                "</div>" +
                                            "</div></div><div id='processForm' style='font-size:20pt;'></div>" +
                                        "</div>";

                    _self._.link.hide();
                    $s.el("txtUrl").focus();
                    _self._.mark();

                    if (_self._.options.link && _self._.options.link.show) {
                        $s.el("btnRemove").style.visibility = "visible";
                    }

                    $s.addEvent($s.el("btnRemove"), "click", function (e) {
                        _self.unset();
                        var pkg = { type: 'onNodeLinkRemoved', data: { id: _self._.options.id} };
                        if (_self._.slate.signalr) _self._.slate.signalr.send(pkg);
                        return $s.stopEvent(e);
                    });

                    $s.addEvent($s.el("txtUrl"), "keypress", function (e) {
                        if ($s.getKey(e) === 13) {
                            bindURL();
                        }
                    });

                    $s.addEvent($s.el("txtUrl"), "focus", function (e) {
                        this.select();
                    });

                    $s.addEvent($s.el("btnApply"), "click", function (e) {
                        bindURL();
                        return $s.stopEvent(e);
                    });

                    $s.addEvent($s.el("radioLinkUrl"), "click", function (e) {
                        removeInternalLinking();
                        $s.el("provideUrlPlaceholder").style.display = "block";
                        $s.el("messagePlaceholder").style.display = "none";
                    });

                    $s.addEvent($s.el("radioLinkSlate"), "click", function (e) {
                        _self._.slate.options.linking = {
                            onNode: function (node) {
                                _self.set('currentSlate', node.options.id, true);
                                var pkg = { type: 'onNodeLinkAdded', data: { id: _self._.options.id, linkType: 'currentSlate', linkData: node.options.id} };
                                if (_self._.slate.signalr) _self._.slate.signalr.send(pkg);

                                _ntfy && _ntfy.resize(50, 300, function () {
                                    _ntfy.changeMessage("You've set the link! Returning you to your original node in a moment...");
                                    setTimeout(function () {
                                        _self._.position('center', function () {
                                            //back
                                            _ntfy.changeMessage("The connection is all set!");
                                            setTimeout(function () { _ntfy && _ntfy.closeMessage(); }, 1500);
                                        }, 'swingFromTo', 1500);
                                    }, 2000);
                                });
                                removeInternalLinking();
                            }
                        };
                        $s.el("provideUrlPlaceholder").style.display = "none";
                        $s.el("messagePlaceholder").style.display = "block";
                        $s.el("messagePlaceholder").innerHTML = "Scroll the slate to the node you'd like to link to and click it.";
                    });

                    $s.addEvent($s.el("radioLinkExternalSlate"), "click", function (e) {
                        _self._.slate.options.linking = {
                            onSlate: function (slate) {

                            }
                        };
                        $s.el("provideUrlPlaceholder").style.display = "none";
                        $s.el("messagePlaceholder").style.display = "block";
                        $s.el("messagePlaceholder").innerHTML = "Select the slate that you'd like to link to using the menu above.";
                    });
                }
                , onClose: function () {
                    if (_self._.options.link.show) {
                        _self._.link.show();
                    }
                }
            });
        };

        function removeInternalLinking() {
            _self._.slate.options.linking = null;
        };

        function checkUrlExistence(u, cb) {
            var pkg = JSON.stringify({ Url: u });

            $s.el("btnApply").setAttribute("disabled", "disabled");
            $s.el("btnApply").innerHTML = "Checking...";

            $s.ajax(options.existenceUrl, function (respText, resp) {
                var _getUrl = JSON.parse(respText);
                $s.el("btnApply").removeAttribute("disabled", "disabled");
                $s.el("btnApply").innerHTML = "go";
                cb.apply(this, [_getUrl.exists]);
            }, pkg, 'POST');
        }

        function bindURL() {
            var u = $s.el("txtUrl").value.replace(/http:\/\//gi, '');
            checkUrlExistence(u, function (exists) {
                if (exists !== true) {
                    alert("Sorry but " + u + " doesn't look to be a valid URL. Please check it!");
                } else {
                    _self.set('externalUrl', u, true);
                    var pkg = { type: 'onNodeLinkAdded', data: { id: _self._.options.id, linkType: 'externalUrl', linkData: u} };
                    if (_self._.slate.signalr) _self._.slate.signalr.send(pkg);
                }
            });
        };

        _self.end = function () {
            _self._.unmark();
            _self._.slate.unglow();
            _ntfy && _ntfy.closeMessage();
        };

        _self.set = function (type, data, prepare) {
            if (!_self._.options.link) _self._.options.link = {};
            if (!_self._.options.link.thumbnail) _self._.options.link.thumbnail = { width: 175, height: 175 };

            switch (type) {
                case 'externalUrl':
                    $s.extend(_self._.options.link, { type: type, data: data, show: true });
                    if (prepare === true) {
                        $s.el("linkForm").style.display = 'none';
                        $s.el("processForm").style.display = 'block';
                        $s.el("processForm").innerHTML = "<div style='margin-top:-3px;float:left;'><span id='spanFetchThumb'></span></div><div style='margin-left:10px;float:left;margin-top:0px;font-size:14pt;'>Fetching URL Thumbnail (it only takes this long the first time)...</div>";

                        _ntfy && _ntfy.resize(50, 300, function () {
                            if ($s.el("spanFetchThumb") !== null)
                                var _spinner = new spinner("spanFetchThumb", 8, 16, 15, 1, "#fff");
                        });

                        var thumbpkg = JSON.stringify({ Url: _self._.options.link.data, Width: _self._.options.link.thumbnail.width, Height: _self._.options.link.thumbnail.height });
                        $s.ajax(options.thumbUrl, function (respText, resp) {
                            var _getUrl = JSON.parse(respText);
                            $s.imageExists(_getUrl.url, function (loaded, w, h) {
                                _self._.link.show();
                                _self.end();
                            });
                        }, thumbpkg, "POST");
                    } else {
                        _self._.link.show();
                    }
                    break;
                case 'currentSlate':
                    $s.extend(_self._.options.link, { type: type, data: data, show: true });
                    break;
                case 'externalSlate':
                    break;

            }

        };

        _self.unset = function () {
            $s.extend(_self._.options.link, { type: '', data: '', show: false });
            _self._.link.hide();
            _self.end();
        };

        _self.processEvent = function () {
            switch (_self._.options.link.type) {
                case "externalUrl":
                    var surl = _self._.options.link.data.length > 20 ? _self._.options.link.data.substring(0, 20) + "..." : _self._.options.link.data;
                    var _msg = surl;
                    _self._.link.tooltip({ type: 'image', msg: _msg }, _self._.options.link.thumbnail.width, _self._.options.link.thumbnail.height);
                    var thumbpkg = JSON.stringify({ Url: _self._.options.link.data, Width: _self._.options.link.thumbnail.width, Height: _self._.options.link.thumbnail.height });
                    $s.ajax(options.thumbUrl, function (respText, resp) {
                        var _getUrl = JSON.parse(respText);
                        if (_getUrl.url !== "") {
                            $s.imageExists(_getUrl.url, function (loaded, w, h) {
                                _self._.link.tt[0].attr({ "fill": "url(" + _getUrl.url + ")" });
                            });
                        }
                    }, thumbpkg, 'POST');
                    break;
                case "externalSlate":
                    break;
                case "currentSlate":
                    _self._.slate.addtip(_self._.link.tooltip({ type: 'text', msg: "Jump to another node" }, 140, 23));
                    break;
            }
        };

        _self.wireEvents = function () {
            _self._.link.mouseover(function (e) {
                _self._.slate.glow(_self._.link);
                _self.processEvent();
                $s.stopEvent(e);
            });

            _self._.link.mouseout(function (e) {
                _self._.slate.unglow();
                switch (_self._.options.link.type) {
                    case 'externalUrl':
                        _self._.link.untooltip();
                        break;
                    case "currentSlate":
                        _self._.slate.untooltip();
                        break;
                }
                $s.stopEvent(e);
            });

            _self._.link.click(function (e) {
                switch (_self._.options.link.type) {
                    case "externalUrl":
                        window.open(["http://", _self._.options.link.data].join(""), 'sb_external');
                        break;
                    case "externalSlate":
                        break;
                    case "currentSlate":
                        var n = _self._.slate.nodes.one(_self._.options.link.data),
                            _vpt = n.vect.getBBox(), zr = _self._.slate.options.viewPort.zoom.r;

                        n.position('center', function () {
                            n.mark();
                        }, 'swingFromTo', 2000);

                        break;
                }
                $s.stopEvent(e);
            });
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.node);