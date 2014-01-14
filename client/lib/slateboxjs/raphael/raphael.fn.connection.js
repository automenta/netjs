Raphael.fn.connection = function (_options) {
    var options = {
        sb: Slatebox
        , parent: null
        , child: null
        , lineColor: "#fff"
        , lineOpacity: 1
        , lineWidth: 10
        , blnStraight: false
        , showParentArrow: false
        , showChildArrow: false
    };
    options.sb.extend(options, _options);

    function calcPath() {
        var bb1 = options.parent.vect.getBBox();
        var bb2 = options.child.vect.getBBox();

        var _px = (!isNaN(parseFloat(bb1.x)) && isFinite(bb1.x)) && bb1.x;
        var _pcx = (!isNaN(parseFloat(bb1.cx)) && isFinite(bb1.cx)) && bb1.cx;
        var _py = (!isNaN(parseFloat(bb1.y)) && isFinite(bb1.y)) && bb1.y;
        var _pcy = (!isNaN(parseFloat(bb1.cy)) && isFinite(bb1.cy)) && bb1.cy;

        var _cx = (!isNaN(parseFloat(bb2.x)) && isFinite(bb2.x)) && bb2.x;
        var _ccx = (!isNaN(parseFloat(bb2.cx)) && isFinite(bb2.cx)) && bb2.cx;
        var _cy = (!isNaN(parseFloat(bb2.y)) && isFinite(bb2.y)) && bb2.y;
        var _ccy = (!isNaN(parseFloat(bb2.cy)) && isFinite(bb2.cy)) && bb2.cy;

        var p = [{ x: (_px || _pcx) + bb1.width / 2, y: (_py || _pcy) - 1 },
        { x: _px + bb1.width / 2, y: _py + bb1.height + 1 },
        { x: _px - 1, y: _py + bb1.height / 2 },
        { x: _px + bb1.width + 1, y: _py + bb1.height / 2 },
        { x: _cx + bb2.width / 2, y: _cy - 1 },
        { x: _cx + bb2.width / 2, y: _cy + bb2.height + 1 },
        { x: _cx - 1, y: _cy + bb2.height / 2 },
        { x: _cx + bb2.width + 1, y: _cy + bb2.height / 2}],
        d = {}, dis = [];
        for (var i = 0; i < 4; i++) {
            for (var j = 4; j < 8; j++) {
                var dx = Math.abs(p[i].x - p[j].x),
                dy = Math.abs(p[i].y - p[j].y);
                if ((i == j - 4) || (((i != 3 && j != 6) || p[i].x < p[j].x) && ((i != 2 && j != 7) || p[i].x > p[j].x) && ((i != 0 && j != 5) || p[i].y > p[j].y) && ((i != 1 && j != 4) || p[i].y < p[j].y))) {
                    dis.push(dx + dy);
                    d[dis[dis.length - 1]] = [i, j];
                }
            }
        }
        if (dis.length == 0) {
            var res = [0, 4];
        } else {
            res = d[Math.min.apply(Math, dis)];
        }
        var x1 = p[res[0]].x,
        y1 = p[res[0]].y,
        x4 = p[res[1]].x,
        y4 = p[res[1]].y;
        dx = Math.max(Math.abs(x1 - x4) / 2, 10);
        dy = Math.max(Math.abs(y1 - y4) / 2, 10);
        var x2 = [x1, x1, x1 - dx, x1 + dx][res[0]].toFixed(3),
        y2 = [y1 - dy, y1 + dy, y1, y1][res[0]].toFixed(3),
        x3 = [0, 0, 0, 0, x4, x4, x4 - dx, x4 + dx][res[1]].toFixed(3),
        y3 = [0, 0, 0, 0, y1 + dy, y1 - dy, y4, y4][res[1]].toFixed(3);

        var size = 15;
        if (options.lineWidth > 10)
            size = 20;
        var shr = 2.4;
        var x1m = x1.toFixed(3), x4m = x4.toFixed(3), y1m = y1.toFixed(3), y4m = y4.toFixed(3);

        var path = ["M", x1m, y1.toFixed(3), "C", x2, y2, x3, y3, x4m, y4m].join(",");
        if (options.blnStraight) {
            x4m = (_cx + bb2.width / 2);
            y4m = (_cy + bb2.height / 2);
            path = ["M", x1m, y1.toFixed(3), "L", x4m, y4m].join(",");
        }

        if (options.showParentArrow) {
            var arrowAngle1 = Math.atan2(x3 - x4m, y4m - y3);
            if (options.blnStraight) {
                arrowAngle1 = Math.atan2(x1m - x4m, y4m - y1m);
            }
            arrowAngle1 = (arrowAngle1 / (2 * Math.PI)) * 360;
        }

        if (options.showChildArrow) {
            var arrowAngle2 = Math.atan2(x4m - x3, y3 - y4m);
            if (options.blnStraight) {
                arrowAngle2 = Math.atan2(x4m - x1m, y1m - y4m);
            }
            arrowAngle2 = (arrowAngle2 / (2 * Math.PI)) * 360;
        }

        var arrowPath1 = "M" + x4 + " " + y4 + " L" + (x4 - size) + " " + (y4 - size / shr) + " L" + (x4 - size) + " " + (y4 + size / shr) + " L" + x4 + " " + y4;
        var arrowPath2 = "M" + x1 + " " + y1 + " L" + (x1 - size) + " " + (y1 - size / shr) + " L" + (x1 - size) + " " + (y1 + size / shr) + " L" + x1 + " " + y1;

        return {
            path: path
            , parent: { arrowPath: arrowPath1, arrowAngle: arrowAngle1, centerX: x4, centerY: y4 }
            , child: { arrowPath: arrowPath2, arrowAngle: arrowAngle2, centerX: x1, centerY: y1 }
        };
    }

    this.removeConnection = function (options) {
        options.line.remove();
        if (options.showParentArrow) {
            options.parentArrow.remove();
        }
        if (options.showChildArrow) {
            options.childArrow.remove();
        }
    };

    var details = calcPath();
    if (options.line === undefined) {
        options.sb.extend(options, {
            line: this.path(details.path).attr({ stroke: options.lineColor, fill: "none", "stroke-width": options.lineWidth, "fill-opacity": options.lineOpacity, opacity: options.lineOpacity }) //.toBack() //, "arrow-end": "classic"
            , parentArrow: this.path(details.parent.arrowPath).attr({ fill: options.lineColor, "fill-opacity": options.lineOpacity, stroke: "none", opacity: options.lineOpacity }).transform("r" + (90 + details.parent.arrowAngle) + "," + details.parent.centerX + "," + details.parent.centerY) //.toBack()
            , childArrow: this.path(details.child.arrowPath).attr({ fill: options.lineColor, "fill-opacity": options.lineOpacity, stroke: "none", opacity: options.lineOpacity }).transform("r" + (90 + details.child.arrowAngle) + "," + details.child.centerX + "," + details.child.centerY) //.toBack()
        });

        if (!options.showParentArrow) options.parentArrow.hide();
        if (!options.showChildArrow) options.childArrow.hide();

    } else {
        options.line.attr({ path: details.path, stroke: options.lineColor, "stroke-width": options.lineWidth, "fill-opacity": options.lineOpacity, opacity: options.lineOpacity }); //.toBack(); //, "arrow-end": "classic"
        if (options.showParentArrow) {
            options.parentArrow.show();
            options.parentArrow.attr({ path: details.parent.arrowPath, fill: options.lineColor, "stroke-width": options.lineWidth, "fill-opacity": options.lineOpacity, opacity: options.lineOpacity }).transform("r" + (90 + details.parent.arrowAngle) + "," + details.parent.centerX + "," + details.parent.centerY); //.toBack();
        } else if (options.parentArrow) {
            options.parentArrow.hide();
        }

        if (options.showChildArrow) {
            options.childArrow.show();
            options.childArrow.attr({ path: details.child.arrowPath, fill: options.lineColor, "stroke-width": options.lineWidth, "fill-opacity": options.lineOpacity, opacity: options.lineOpacity }).transform("r" + (90 + details.child.arrowAngle) + "," + details.child.centerX + "," + details.child.centerY); //.toBack();
        } else if (options.childArrow) {
            options.childArrow.hide();
        }
    }
    return options;
};