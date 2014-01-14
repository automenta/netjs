
﻿(function ($s, $n) {
    $n.fn._editor = function () {
        var _self = this, _tempId = $s.guid().replace("-", ""), lineBreaks = [], _keypress, _submit, _cancel, cursor, ll, _ntfy;
        
        _self.editing = false;
        
        _self.start = function() {
            //console.dir(_self._.options.text);
            /*if ($s.nodeDoubleClicked)
                $s.nodeDoubleClicked($n);*/
        };
        
        _self.oldStart = function () {
            
            _self.editing = true;
            _self._.slate.keyboard && _self._.slate.keyboard.end();

            cursor = _self._.slate.paper.rect(-99, -99, 8, 1).attr({ fill: "#000" }).loop({
                pkg: [{ fill: "#fff" }, { fill: "#000"}]
                , duration: 500
                , repeat: true
            });
            //positionedoffset?
            _self._.slate.nodes.closeAllMenus();

            var origText = '', origSize;

            function sizes() {
                var _sel = "<select id='ddlTxtSize'>";
                for (ptx = 10; ptx < 201; ptx++) {
                    if (ptx % 2 === 0) {
                        _sel += "<option>" + ptx + "</option>";
                    }
                }
                _sel += "</select>";
                return _sel;
            };

            function buildColorPicker() {
                var ctmp = "<div style='float:left;padding:3px;margin-right:5px;background-color:#f8f8f8;border:1px solid #ccc;cursor:pointer;' class='changeTextColor' rel='{text}'><div style='width:30px;height:30px;background-color:{color};float:left;border:1px solid #333;'></div></div>";
                var _colors = ctmp.replace(/{color}/gi, '#000').replace(/{text}/gi, 'black');
                _colors += ctmp.replace(/{color}/gi, '#FFF').replace(/{text}/gi, 'white');
                return _colors;
            };

            function setColor(clr, txtBg) {
                _self.set(null, null, clr);
                var txt = $s.el("txtForNode")
                txt.style.backgroundColor = txtBg;
                txt.style.color = clr;
                txt.focus();
            };

            if ($s.select("div.embedBar").length > 0) {
                $s.each($s.select("div.embedBar"), function () {
                    document.body.removeChild(this);
                });
            };

            _ntfy = new Notify().message({
                hgt: 120
                , duration: 200
                , className: 'embedBar'
                , delayClose: 0
                , spinner: null
                , hideClose: false
                , popFromBottom: true
                , onClose: function () {
                    //_self.set(origText, origSize);
                    _self.end();
                }
                , onOpen: function (container, _ntfy) {
                    container.innerHTML = "<div style='width:900px;'>You are editing the node's text!<br/><div style='float:left;margin-right:8px;height:60px;'><textarea id='txtForNode' style='text-align:center;width:500px;height:70px;'></textarea></div><div style='float:left;margin-right:20px;'>Size " + sizes() + " pt&nbsp;&nbsp;<button id='btnSubmitText' style='width:80px;font-size:14pt;'>Update</button><div id='textColorPicker' style='margin-top:4px;'></div></div></div>";
                    origText = _self._.options.text;
                    origSize = _self._.options.fontSize;
                    $s.el("txtForNode").value = origText;
                    $s.el("txtForNode").select();

                    $s.el("btnSubmitText").onclick = function (e) {
                        _self.end();
                        submitChanges();
                    };
                    $s.el("ddlTxtSize").value = origSize;
                    $s.el("ddlTxtSize").onchange = function (e) {
                        var pt = this.options[this.selectedIndex].value;
                        _self.set(_self._.options.text, pt);
                    };

                    $s.el("textColorPicker").innerHTML = buildColorPicker();
                    $s.each($s.select("div.changeTextColor"), function () {
                        var btn = this;
                        btn.onclick = function (e) {
                            btn.style.border = "1px solid red";
                            switch (btn.getAttribute("rel")) {
                                case "black":
                                    setColor("#000", "#fff");
                                    break;
                                case "white":
                                    setColor("#fff", "#000");
                                    break;
                            }
                        };
                        btn.onmouseover = function (e) {
                            btn.style.border = "1px solid red";
                        };
                        btn.onmouseout = function (e) {
                            btn.style.border = "1px solid #ccc";
                        };
                    });

                    $s.el("txtForNode").onkeyup = function (e) {
                        var _v = this.value;
                        if (_v === "") _v = " ";
                        var _text = _self._.text;
                        _self._.options.text = _v;
                        var keyCode = $s.getKey(e || event);
                        _text.attr({ "text": (keyCode === 13 || keyCode === 32) ? _v + " " : _v });
                        var ts = _text.getBBox();
                        if (keyCode === 13 || keyCode === 32) { setTimeout(function () { _text.attr({ "text": _self._.options.text }); }, 0) };

                        //get the width of the last line of text
                        var _sp = _text.attr("text").split("\n");
                        ll = _self._.slate.paper.text(-99, -99, _sp[_sp.length - 1]).attr({ "font-size": _self._.options.fontSize + "pt" });
                        var _b = ll.getBBox();
                        ll.remove();

                        _self.resize();
                        _self.resize();
                        _self._.mark();

                        _self._.refresh();

                        var centerX = (_sp.length > 1 ? (ts.width / 2 + _b.width / 2) : ts.width);
                        cursor.attr({ x: ts.x + centerX, y: ts.y + ts.height, "font-size": _self._.options.fontSize + "pt" });
                    };
                }
            });

            _self._.mark();
        };

        _self.set = function (t, s, c) {
            t && (_self._.options.text = t);
            s && (_self._.options.fontSize = s);
            c && (_self._.options.foregroundColor = c);
            t && (_self._.text.attr({ "text": t }));
            s && (_self._.text.attr({ "font-size": + s + "pt" }));
            c && (_self._.text.attr({ fill: c }));
            _self.resize();
            _self.resize();
        };

        function submitChanges() {
            //broadcast
            var textPkg = { type: "onNodeTextChanged", data: { id: _self._.options.id, text: _self._.options.text, fontSize: _self._.options.fontSize, fontColor: _self._.options.foregroundColor} };
            if (_self._.slate.signalr) _self._.slate.signalr.send(textPkg);
            if (_self._.slate.birdseye) _self._.slate.birdseye.nodeChanged(textPkg);
        };

        _self.resize = function () {
            var _text = _self._.text;

            var _xPad = 20;
            var _yPad = 20;

            if (_self._.options.vectorPath === "ellipse") {
                _xPad = 30;
                _yPad = 30;
            }

            var _shim = false;
            if (_text.attr("text") === " ") { _text.attr("text", "."); _shim = true; }

            var ts = _text.getBBox();

            if (_shim) _text.attr("text", " ");

            var _rsWidth = ts.width + _xPad
                , _rsHeight = ts.height + _yPad
                , _rsX = ts.x - _xPad / 2
                , _rsY = ts.y - _yPad / 2
                , _rscX = ts.x + (_self._.options.width / 2) - _xPad / 2
                , _rscY = ts.y + (_self._.options.height / 2) - _yPad / 2;

            if (_rsWidth < _self._.options.width) {
                _rsWidth = _self._.options.width;
                _rsX = _self._.options.xPos;
                _rscX = _self._.options.xPos;
            }

            if (_rsHeight < _self._.options.height) {
                _rsHeight = _self._.options.height;
                _rsY = _self._.options.yPos;
                _rscY = _self._.options.yPos;
            }

            var att = _self._.vect.type == "rect" ? { x: _rsX, y: _rsY} : { cx: _rscX, cy: _rscY };
            var wdt = _self._.vect.type == "rect" ? { width: _rsWidth, height: _rsHeight} : { rx: _rsWidth / 2, ry: _rsHeight / 2 };
            $s.extend(att, wdt);

            _self._.vect.attr(att);
            _self._.options.xPos = _rsX;
            _self._.options.width = _rsWidth;
            _self._.options.yPos = _rsY;
            _self._.options.height = _rsHeight;

            _self._.link.attr(_self._.linkCoords());
        };

        _self.end = function () {
            _self.editing = false;
            _self._.unmark();
            if (_ntfy && _ntfy.visible()) submitChanges();
            _ntfy && _ntfy.closeMessage();

            if (cursor) {
                cursor.remove();
                cursor = null;
            }
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.node);
