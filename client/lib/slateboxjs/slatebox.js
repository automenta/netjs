(function () {
    var Slatebox = function (_options) {
        var _sb = this;
        var slate = null;

        if (!(_sb instanceof Slatebox))
            return new Slatebox(_options);

        if (_sb.slate === undefined) {
            alert("You have not included a reference to Slatebox.slate.js!");
        }

        _sb.slates = new Array();
        _sb._options = _options;

        window.Slatebox.instance = _sb;
    };

    Slatebox.trim = function (str) {
        var str1 = str.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = str1.length;
        while (ws.test(str1.charAt(-i)));
        return str1.slice(0, i + 1);
    };

    Slatebox.windowSize = function () {
        var w = 0;
        var h = 0;

        //IE
        if (!window.innerWidth) {
            //strict mode
            if (!(document.documentElement.clientWidth == 0)) {
                w = document.documentElement.clientWidth;
                h = document.documentElement.clientHeight;
            }
            //quirks mode
            else {
                w = document.body.clientWidth;
                h = document.body.clientHeight;
            }
        }
        //w3c
        else {
            w = window.innerWidth;
            h = window.innerHeight;
        }
        return { width: w, height: h };
    };

    Slatebox.clone = function (obj) {
        return JSON.parse(JSON.stringify(obj));

        /*
        if (obj == null || typeof (obj) != 'object')
        return obj;

        var temp = obj.constructor(); // changed

        for (var key in obj)
        temp[key] = Slatebox.clone(obj[key]);

        return temp;
        */
    };

    Slatebox.isEqualTo = function (obj1, obj2) {
        for (p in obj2) {
            if (typeof (obj1[p]) == 'undefined') { return false; }
        }
        for (p in obj2) {
            if (obj2[p]) {
                switch (typeof (obj2[p])) {
                    case 'object':
                        if (!obj2[p].equals(obj1[p])) { return false }; break;
                    case 'function':
                        if (typeof (obj1[p]) == 'undefined' || (p != 'equals' && obj2[p].toString() != obj1[p].toString())) { return false; }; break;
                    default:
                        if (obj2[p] != obj1[p]) { return false; }
                }
            } else {
                if (obj1[p]) {
                    return false;
                }
            }
        }
        for (p in obj1) {
            if (typeof (obj2[p]) == 'undefined') { return false; }
        }
        return true;
    }

    // stripped from jQuery, thanks John Resig 
    Slatebox.each = function (obj, fn) {
        if (!obj) { return; }

        var name, i = 0, length = obj.length;

        // object
        if (length === undefined) {
            for (name in obj) {
                if (fn.call(obj[name], name, obj[name]) === false) { break; }
            }

            // array
        } else {
            for (var value = obj[0];
			    i < length && fn.call(value, i, value) !== false; value = obj[++i]) {
            }
        }

        return obj;
    };

    Slatebox.isElement = function (o) {
        return (
            typeof HTMLElement === "object" ? o instanceof HTMLElement : //DOM2
            typeof o === "object" && o.nodeType === 1 && typeof o.nodeName === "string"
        );
    };

    Slatebox.isFunction = function (x) {
        return Object.prototype.toString.call(x) === "[object Function]";
    };

    Slatebox.isArray = function (o) {
        return Object.prototype.toString.call(o) === "[object Array]";
    };

    // convenience
    Slatebox.el = function (id) {
        return document.getElementById(id);
    };

    // used extensively. a very simple implementation. 
    Slatebox.extend = function (to, from, skipFuncs) {
        if (typeof from != 'object') { return to; }

        if (to && from) {
            Slatebox.each(from, function (name, value) {
                if (!skipFuncs || typeof value != 'function') {
                    to[name] = value;
                }
            });
        }

        return to;
    };

    // var arr = select("elem.className"); 
    Slatebox.select = function (query) {
        var index = query.indexOf(".");
        if (index != -1) {
            var tag = query.slice(0, index) || "*";
            var klass = query.slice(index + 1, query.length);
            var els = [];
            Slatebox.each(document.getElementsByTagName(tag), function () {
                if (this.className && this.className.indexOf(klass) != -1) {
                    els.push(this);
                }
            });
            return els;
        }
    };

    Slatebox.getKey = function (e) {
        var keyCode = 0;
        try { keyCode = e.keyCode; } catch (Err) { keyCode = e.which; }
        return keyCode;
    };

    // fix event inconsistencies across browsers
    Slatebox.stopEvent = function (e) {
        e = e || window.event;

        if (e.preventDefault) {
            e.stopPropagation();
            e.preventDefault();

        } else {
            e.returnValue = false;
            e.cancelBubble = true;
        }
        return false;
    };

    Slatebox.toShortDateString = function (jsonDate) {
        var _date = jsonDate;
        try {
            var d = new Date(parseInt(jsonDate.substr(6)));
            _date = (d.getMonth() + 1) + "/" + d.getDate() + "/" + d.getFullYear();
        } catch (Err) { }

        return _date;
    };

    Slatebox.addEvent = function (obj, type, fn) {
        if (obj.attachEvent) {
            obj['e' + type + fn] = fn;
            obj[type + fn] = function () { obj['e' + type + fn](window.event); }
            obj.attachEvent('on' + type, obj[type + fn]);
        } else
            obj.addEventListener(type, fn, false);
    }
    Slatebox.removeEvent = function (obj, type, fn) {
        if (obj.detachEvent) {
            obj.detachEvent('on' + type, obj[type + fn]);
            obj[type + fn] = null;
        } else
            obj.removeEventListener(type, fn, false);
    }

    // push an event listener into existing array of listeners
    Slatebox.bind = function (to, evt, fn) {
        to[evt] = to[evt] || [];
        to[evt].push(fn);
    };

    Slatebox.imageExists = function (u, cb, id) {
        var _id = "temp_" + Slatebox.guid();
        var _img = document.body.appendChild(document.createElement("img"));
        _img.style.position = "absolute";
        _img.style.top = "-10000px";
        _img.style.left = "-10000px";
        _img.setAttribute("src", u);
        _img.setAttribute("id", _id);

        Slatebox.addEvent(_img, "load", function (e) {
            var d = Slatebox.getDimensions(_img);
            document.body.removeChild(_img);
            cb.apply(this, [true, d.width, d.height, id]);
        });

        Slatebox.addEvent(_img, "error", function (e) {
            document.body.removeChild(_img);
            cb.apply(this, [false, 0, 0, id]);
        });
    };

    Slatebox.urlExists = function (url) {
        var http = new XMLHttpRequest();
        http.open('GET', url, false);
        http.send();
        return http.status == 200;
    };

    Slatebox.ajax = function (u, f, d, v, x, h) {
        x = this.ActiveXObject;
        //the guid is essential to break the cache because ie8< seems to want to cache this. argh.
        u = [u, u.indexOf("?") === -1 ? "?" : "&", "guid=" + Slatebox.guid()].join("");
        x = new (x ? x : XMLHttpRequest)('Microsoft.XMLHTTP');
        var vx = d ? (v ? v : 'POST') : (v ? v : 'GET');
        x.open(vx, u, 1);
        x.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        if (h) Slatebox.each(h, function () { x.setRequestHeader(this.n, this.v); });
        x.onreadystatechange = function () {
            x.readyState > 3 && f ? f(x.responseText, x) : 0
        };
        x.send(d);
    };

    var S4 = function () { return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1); }
    Slatebox.guid = function () { return (S4() + S4() + S4()); }
    Slatebox.number = function () { return Math.floor(Math.random() * 9999) + 999; }

    var head = document.getElementsByTagName('head')[0], global = this;
    Slatebox.getJSON = function (url, callback) {
        id = S4() + S4();
        var script = document.createElement('script'), token = '__jsonp' + id;

        // callback should be a global function
        global[token] = callback;

        // url should have "?" parameter which is to be replaced with a global callback name
        script.src = url.replace(/\?(&|$)/, '__jsonp' + id + '$1');

        // clean up on load: remove script tag, null script variable and delete global callback function
        script.onload = function () {
            delete script;
            script = null;
            delete global[token];
        };
        head.appendChild(script);
    };

    Slatebox.positionedOffset = function (obj) {
        var curleft = 0;
        var curtop = 0;
        if (obj.offsetParent) {
            do {
                curleft += obj.offsetLeft;
                curtop += obj.offsetTop;
            } while (obj = obj.offsetParent);
        }
        return { left: curleft, top: curtop };
    };

    Slatebox.getDimensions = function (ele) {
        var width = 0, height = 0;
        if (typeof ele.clip !== "undefined") {
            width = ele.clip.width;
            height = ele.clip.height;
        } else {
            if (ele.style.pixelWidth) {
                width = ele.style.pixelWidth;
                height = ele.style.pixelHeight;
            } else {
                width = ele.offsetWidth;
                height = ele.offsetHeight;
            }
        }
        return { width: width, height: height };
    };

    Slatebox.isNumeric = function (n) {
        return !isNaN(parseFloat(n)) && isFinite(n);
    };

    Slatebox.isIE = function () {
        var version = 999; // we assume a sane browser
        if (navigator.appVersion.indexOf("MSIE") !== -1 && navigator.appVersion.indexOf("chromeframe") === -1)
            version = parseFloat(navigator.appVersion.split("MSIE")[1]);
        return version;
    };

    Slatebox.isIpad = function () {
        return navigator.userAgent.match(/iPad/i) !== null;
    };

    Slatebox.mousePos = function (e) {
        if (document.all) {
            mouseX = window.event.clientX; //document.body.scrollLeft; //(e.clientX || 0) +
            mouseY = window.event.clientY; //document.body.scrollTop;
        } else if (e.targetTouches) {
            if (e.targetTouches.length) {
                var t = e.targetTouches[0]; // touches.item(0);
                mouseX = t.clientX;
                mouseY = t.clientY;
                var _allTouches = [];
                for (var tx in e.targetTouches) {
                    _allTouches.push({ x: e.targetTouches[tx].clientX, y: e.targetTouches[tx].clientY });
                }
            }
            //}
        } else {
            mouseX = e.pageX;
            mouseY = e.pageY;
        }
        return { x: mouseX, y: mouseY, allTouches: _allTouches };
    };

    //    Slatebox.toJSON = function (obj) {
    //        var tmp = this.split("");
    //        for (var i = 0; i < tmp.length; i++) {
    //            var c = tmp[i];
    //            (c >= ' ') ?
    //			            (c == '\\') ? (tmp[i] = '\\\\') :
    //			            (c == '"') ? (tmp[i] = '\\"') : 0 :
    //		            (tmp[i] =
    //			            (c == '\n') ? '\\n' :
    //			            (c == '\r') ? '\\r' :
    //			            (c == '\t') ? '\\t' :
    //			            (c == '\b') ? '\\b' :
    //			            (c == '\f') ? '\\f' :
    //			            (c = c.charCodeAt(), ('\\u00' + ((c > 15) ? 1 : 0) + (c % 16)))
    //		            )
    //        }
    //        return '"' + tmp.join("") + '"';
    //    };

    Slatebox.ensureEle = function (el) {
        return (typeof el === 'string' ? document.getElementById(el) : el);
    };

    Slatebox.onOff = function (baseUrl, ele, callback) {
        var imgID = Slatebox.guid().replace('-', '').substring(0, 8);
        var _element = Slatebox.ensureEle(ele);
        _element.innerHTML = "<div style='cursor:pointer;overflow:hidden;width:53px;height:20px;'><img id='" + imgID + "' style='margin-top:0px;' src='" + baseUrl + "/public/images/checkbox-switch-stateful.png' alt='toggle'/>";
        Slatebox.el(imgID).onclick = function (e) {
            callback.apply(this, [imgID]);
        };
        return imgID;
    };

    Slatebox.isOn = function (ele) {
        var _ele = Slatebox.ensureEle(ele);
        if (_ele.style.marginTop === "0px") return false;
        return true;
    };

    Slatebox.toggleOnOff = function (ele) {
        var _ele = Slatebox.ensureEle(ele);
        if (_ele.style.marginTop === "0px") _ele.style.marginTop = "-22px";
        else _ele.style.marginTop = "0px";
    };

    Slatebox.div = function (p, x, y, w, h) {
        var _id = "temp_" + Slatebox.guid();
        var _div = p.appendChild(document.createElement("div"));
        _div.style.position = 'absolute';
        _div.style.top = y + "px";
        _div.style.left = x + "px";
        _div.style.width = w + "px";
        _div.style.height = h + "px";
        _div.style.border = "1px solid red";
        _div.style.backgroundColor = "#f8f8f8";
        _div.setAttribute("id", _id);
        return _id;
    };


    Slatebox.fn = Slatebox.prototype = {
        initNode: function () {
            var _node = this;
            $s.each($s.fn.node.fn, function () {
                if (Slatebox.isFunction(this)) {
                    if (arguments[0].substring(0, 1) === '_') {
                        this.apply(_node);
                        //delete Slatebox.fn.node.fn[arguments[0]];
                    }
                }
            });
        }
    };

    //helper methods
    if (!Array.prototype.filter) {
        Array.prototype.filter = function (fun /*, thisp */) {
            "use strict";

            if (this === void 0 || this === null)
                throw new TypeError();

            var t = Object(this);
            var len = t.length >>> 0;
            if (typeof fun !== "function")
                throw new TypeError();

            var res = [];
            var thisp = arguments[1];
            for (var i = 0; i < len; i++) {
                if (i in t) {
                    var val = t[i]; // in case fun mutates this
                    if (fun.call(thisp, val, i, t))
                        res.push(val);
                }
            }

            return res;
        };
    }

    window.Slatebox = Slatebox;
})();