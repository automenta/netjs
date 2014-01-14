(function ($s, $n) {
    $n.fn._images = function () {
        var _self = this, _ntfy, options, _searchType = 'image';
        _self.imagesearching = false;
        _self.start = function (_options) {
            _self.imagesearching = true;
            _self._.slate.nodes.closeAllMenus();

            options = {
                searchPatterns: true
                , searchImages: true
                , imageUrl: '/Images?query={query}&size={size}&rpp={rpp}&page={page}'
                , patternUrl: 'http://www.colourlovers.com/api/patterns?keywords={query}&orderCol=score&sortBy=DESC&numResults={rpp}&resultOffset={page}&jsonCallback=?'
                , size: 'Small'
                , isColor: true
                , paging: { rpp: 4, page: 0, total: 0 }
            };

            $s.extend(options, _options || {});

            var origImage;
            _ntfy = new Notify().message({
                hgt: 185
                , duration: 200
                , className: 'embedBar'
                , delayClose: 0
                , spinner: null
                , hideClose: false
                , popFromBottom: true
                , onOpen: function (container, _ntfy) {

                    container.innerHTML = "<div style='width:900px;'>" +
                                            "<div id='embedDivAction' style='float:left;width:260px;'>" +
                                                "<span style='font-size:20pt;' id='spnEmbedAction'>Search</span> (to embed in node)<br/>" +
                                                "<span style='display:none;font-size:20pt;color:#ccc;' id='embedUrlPrefix'>http://</span><input type='text' id='txtSearch' style='width:170px;font-size:20pt;'/>" +
                                                "&nbsp;<button id='btnImageSearch' style='font-size:20pt;'>go</button>" +
                                                "<div id='imgShowSize' style='padding-top:10px'>" +
                                                    "<span id='lblImageSize' style='font-size:12pt;'>Size</span> " +
                                                    "<select id='ddlImageSize'>" +
                                                        "<option>Icon</option>" +
                                                        "<option selected>Small</option>" +
                                                        "<option>Medium</option>" +
                                                        "<option>Large</option>" +
                                                        "<option>All</option>" +
                                                    "</select>" +
                                                    "<label for='chkAsUrl' style='cursor:pointer'><input type='checkbox' id='chkAsUrl' />Provide URL</label>" +
                                                "</div>" +
                                                "<div style='padding-top:10px;font-size:12pt;'><label for='radioImage' style='cursor:pointer;'>" +
                                                    "<input type='radio' id='radioImage' name='imageSearchType' checked/>" +
                                                    "images" +
                                                "</label>" +
                                                "<label for='radioPattern' style='cursor:pointer;display:none;'>" +
                                                    "<input type='radio' id='radioPattern' name='imageSearchType'/>" +
                                                    "patterns" +
                                                "</label>" +
                                                "&nbsp;[<a href='javascript:' id='lnkClearImage'>clear</a>]" +
                                                "</div>" +
                                            "</div>" +
                                            "<div style='float:left;width:30px;visibility:hidden;margin-right:-10px;margin-left:-10px;font-size:40pt;cursor:pointer;' id='lnkSearchBack' class='imgChanger'> < </div>" +
                                            "<div style='float:left;width:470px;' id='imgResults'></div>" +
                                            "<div style='float:left;width:30px;visibility:hidden;margin-right:-10px;margin-left:-10px;font-size:40pt;cursor:pointer;' id='lnkSearchForward' class='imgChanger'> > </div>" +
                                        "</div>";

                    origImage = _self._.options.image;
                    $s.el("ddlImageSize").value = options.size;

                    $s.el("txtSearch").focus();
                    _self._.mark();

                    $s.addEvent($s.el("txtSearch"), "keypress", function (e) {
                        if ($s.getKey(e) === 13) {
                            if ($s.el("chkAsUrl").checked) {
                                bindURL();
                            } else {
                                bindResults();
                                options.paging.page = 0;
                                options.paging.total = 0;
                            }
                        }
                    });

                    $s.addEvent($s.el("txtSearch"), "focus", function (e) {
                        this.select();
                    });

                    $s.addEvent($s.el("btnImageSearch"), "click", function (e) {
                        if ($s.el("chkAsUrl").checked) {
                            bindURL();
                        } else {
                            bindResults();
                            options.paging.page = 0;
                            options.paging.total = 0;
                        }
                        return $s.stopEvent(e);
                    });

                    $s.addEvent($s.el("lnkSearchForward"), "click", function (e) {
                        options.paging.page++;
                        bindResults();
                        return $s.stopEvent(e);
                    });

                    $s.addEvent($s.el("lnkSearchBack"), "click", function (e) {
                        options.paging.page--;
                        bindResults();
                        return $s.stopEvent(e);
                    });

                    $s.addEvent($s.el("lnkClearImage"), "click", function (e) {
                        _set('', 50, 50);
                    });

                    $s.addEvent($s.el("radioPattern"), "click", function (e) {
                        if ($s.el("chkAsUrl").checked) {
                            $s.el("chkAsUrl").checked = false;
                            shrinkBox(function () {
                                $s.el("imgShowSize").style.visibility = 'hidden';
                            });
                        } else {
                            $s.el("imgShowSize").style.visibility = 'hidden';
                        }
                    });

                    $s.addEvent($s.el("radioImage"), "click", function (e) {
                        $s.el("imgShowSize").style.visibility = 'visible';
                    });

                    $s.addEvent($s.el("chkAsUrl"), "click", function (e) {
                        if (this.checked) {
                            $s.el("ddlImageSize").style.visibility = 'hidden';
                            $s.el("lblImageSize").style.visibility = 'hidden';
                            $s.el("embedUrlPrefix").style.display = "inline";
                            $s.el("spnEmbedAction").innerHTML = "Provide URL";
                            $s.each($s.select("div.imgChanger"), function () {
                                this.style.display = 'none';
                            });
                            $s.el("imgResults").style.display = "none";
                            $s.el("embedDivAction").style.width = "850px";
                            emile($s.el("txtSearch"), "width:600px", {
                                duration: 500
                                , after: function () {
                                    $s.el("txtSearch").setAttribute("placeholder", "provide the url to your image");
                                }
                            });
                        } else {
                            shrinkBox();
                        }
                    });

                    $s.each($s.select("div.imgChanger"), function () {
                        $s.addEvent(this, "mouseover", function (e) {
                            this.style.color = '#fff';
                        });
                        $s.addEvent(this, "mouseout", function (e) {
                            this.style.color = '#000';
                        });
                    });
                }
            });
        };

        var isp = function () {
            return $s.el("radioPattern").checked;
        };

        function shrinkBox(cb) {
            emile($s.el("txtSearch"), "width:170px", {
                duration: 500
                , after: function () {
                    $s.el("ddlImageSize").style.visibility = 'visible';
                    $s.el("lblImageSize").style.visibility = 'visible';
                    $s.el("embedUrlPrefix").style.display = "none";
                    $s.el("spnEmbedAction").innerHTML = "Search";
                    $s.each($s.select("div.imgChanger"), function () {
                        this.style.display = 'block';
                    });
                    $s.el("imgResults").style.display = "block";
                    $s.el("embedDivAction").style.width = "260px";

                    $s.el("txtSearch").removeAttribute("placeholder");

                    if ($s.isFunction(cb)) cb.apply(this);
                }
            });
        };

        function bindURL() {
            var u = ["http://", $s.el("txtSearch").value.replace('http://', '')].join('');
            $s.imageExists(u, function (w, h) {
                _set(u, w, h);
            });

            setTimeout(function () {
                if (_self._.options.image !== u) {
                    alert("Sorry, that image could not be loaded.");
                }
            }, 2000);
        };

        function bindResults() {
            hideNav();
            var _size = "Size:" + $s.el("ddlImageSize").value;
            if ($s.el("ddlImageSize").value === "Icon") {
                _size = "Size:Width:64&Image.Filters=Style:Graphics&Image.Filters=Face:Other";
            } else if ($s.el("ddlImageSize").value === "All") {
                _size = "";
            }

            var _url = options.imageUrl
                        .replace(/{query}/gi, $s.el("txtSearch").value)
                        .replace(/{size}/gi, _size)
                        .replace(/{rpp}/gi, options.paging.rpp)
                        .replace(/{page}/gi, (options.paging.page * options.paging.rpp))

            if (isp()) {
                _url = options.patternUrl
                        .replace(/{query}/gi, $s.el("txtSearch").value)
                        .replace(/{rpp}/gi, options.paging.rpp)
                        .replace(/{page}/gi, options.paging.page);
            }

            var _template = "<div style='float:left;cursor:pointer;border:1px solid transparent;padding:5px;height:150px;overflow:hidden;' class='searchImage' rel='{url}|{width}|{height}'><div style='width:100px;height:125px;text-align:center;'><img src='{thumb}' title='{title}' alt='{title}' style='width:{imgWidth}px;height:{imgHeight}px;'/></div><div style='text-align:center;'>{width} x {height}</div></div>";
            var _results = '';

            var objs = [];
            if (isp()) {
                $s.getJSON(_url, function (context, data) {
                    objs = context;
                    if (!objs) objs = [];
                    options.paging.total = ((options.paging.page * options.paging.rpp) + context.length + 1);

                    $s.each(objs, function () {
                        var _title = this.title;
                        var _thumb = this.imageUrl;
                        var _url = this.imageUrl;
                        var _width = 75;
                        var _height = 75;

                        if ($s.el("ddlImageSize").value === "Icon") _imgSize = 64;
                        _results += _template.replace(/{url}/gi, _url).replace(/{thumb}/gi, _thumb).replace(/{imgSize}/gi, _imgSize).replace(/{title}/gi, _title).replace(/{width}/gi, _width).replace(/{height}/gi, _height);
                    });
                    setResults(objs, _results);
                });
            } else {
                $s.ajax(_url, function (respText, resp) {
                    var pkg = JSON.parse(respText);
                    objs = pkg.results;
                    if (pkg.__next !== "") { options.paging.total = (options.paging.page + 2) * options.paging.rpp; }
                    $s.each(objs, function () {
                        var _title = this.Title;
                        var _thumb = this.Thumbnail.MediaUrl;
                        var _url = this.MediaUrl;
                        var _width = parseInt(this.Width);
                        var _height = parseInt(this.Height);
                        _results += _template.replace(/{url}/gi, _url).replace(/{thumb}/gi, _thumb).replace(/{imgWidth}/gi, this.Thumbnail.Width).replace(/{imgHeight}/gi, this.Thumbnail.Height).replace(/{title}/gi, _title).replace(/{width}/gi, _width).replace(/{height}/gi, _height);
                    });
                    setResults(objs, _results);
                });
            }
        };

        function setResults(objs, _results) {
            if (objs.length === 0) {
                $s.el("imgResults").innerHTML = "<div style='font-size:20pt;color:#fff;margin-top:20px;'>There are no results!</div>";
            } else {
                $s.el("imgResults").innerHTML = _results;
                setNav();
                setImageSelect();
            }
        };

        function setImageSelect() {
            $s.each($s.select("div.searchImage"), function () {
                $s.addEvent(this, "click", function (e) {
                    var _sel = this.getAttribute("rel").split('|');
                    var img = _sel[0], w = parseInt(_sel[1]), h = parseInt(_sel[2]);
                    _set(img, w, h);
                });
                $s.addEvent(this, "mouseover", function (e) {
                    this.style.border = "1px solid #ccc";
                    this.style.backgroundColor = '#333';
                    this.style.color = '#fff'
                });
                $s.addEvent(this, "mouseout", function (e) {
                    this.style.border = "1px solid transparent";
                    this.style.backgroundColor = 'transparent';
                    this.style.color = '#000'
                });
            });
        };

        function _set(img, w, h) {
            _self.set(img, w, h);
            _self._.mark();

            var _pkg = { type: 'onNodeImageChanged', data: { id: _self._.options.id, img: _self._.options.image, w: _self._.options.width, h: _self._.options.height} };
            _self._.slate.birdseye && _self._.slate.birdseye.nodeChanged(_pkg);
            _self._.slate.signalr && _self._.slate.signalr.send(_pkg);
        };

        function hideNav() {
            $s.el("lnkSearchForward").style.visibility = 'hidden';
            $s.el("lnkSearchBack").style.visibility = 'hidden';
        };

        function setNav() {
            if (((options.paging.page + 1) * options.paging.rpp) < options.paging.total) {
                $s.el("lnkSearchForward").style.visibility = 'visible';
            }
            if (options.paging.page > 0) {
                $s.el("lnkSearchBack").style.visibility = 'visible';
            }
        };

        _self.end = function () {
            _self.imagesearching = false;
            _self._.unmark();
            _ntfy && _ntfy.closeMessage();
        };

        _self.set = function (img, w, h) {
            _self._.options.image = img;
            sz = { "fill": "url(" + _self._.options.image + ")", "stroke-width": _self._.options.borderWidth, "stroke": "#000" };

            if (_self._.options.width < w || !_self._.options.text) {
                _self._.options.width = w;
                var asz = _self._.vect.type == "rect" ? { width: w} : { rx: w / 2 };
                $s.extend(sz, asz);
            }

            if (_self._.options.height < h || !_self._.options.text) {
                _self._.options.height = h;
                var asz = _self._.vect.type == "rect" ? { height: h} : { ry: h / 2 };
                $s.extend(sz, asz);
            }

            _self._.vect.attr(sz);
            _self._.refresh();
            _self._.connectors && _self._.connectors.remove();
            _self._.resize && _self._.resize.hide();
        };

        return _self;
    }
})(Slatebox, Slatebox.fn.node);