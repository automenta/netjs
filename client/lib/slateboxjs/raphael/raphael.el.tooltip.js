Raphael.el.tooltip = function (obj, w, h) {
    if (w === undefined) w = 80;
    if (h === undefined) h = 20;
    var _tt = this.paper.set();
    var pos = this.getBBox();

    if (obj.type === 'text') {
        //text tooltip
        _tt.push(this.paper.rect(pos.x, pos.y + (h * -1) - 10, w, h, 5).attr({ "fill": "#fff" }));
        _tt.push(this.paper.text(pos.x + 5, pos.y - 20, "").attr({ "stroke-width": 1, "text-anchor": "start", "stroke": "#fff", "font-size": 13, "fill": "#fff" }));
    } else {
        //image tooltip
        var xpad = (w * -1) - 5;
        _tt.push(this.paper.rect(pos.x + xpad, pos.y + (h / 2 * -1), w, h, 15).attr({ "stroke-width": 2, "stroke": "#fff" }));
        _tt.push(this.paper.rect(pos.x + xpad, pos.y + (h / 2 - 45), w, 47, 15)).attr({ "stroke-width": 2, fill: "90-#333-#000" });
        _tt.push(this.paper.text(pos.x + xpad + (w / 2), pos.y + (h / 2 - 20), "").attr({ "text-anchor": "middle", "stroke": "#fff", "font-weight": "normal", "font-family": "Verdana", "font-size": 11 }));
    }

    var s = this;
    if (!s.removed) {
        s.tt = _tt;
        if (obj.type === "text") {
            s.tt[0].animate({ "stroke": "#000", "fill": "#333" }, 200, function () {
                s.tt[1].attr({ text: obj.msg });
            });
        } else {
            s.tt[0].animate({ "stroke": "#000", "fill": "#333" }, 200, function () {
                //s.tt[1].attr({  });
                s.tt[2].attr({ text: obj.msg });
            });
        }
    }
    
    return s.tt;
};

Raphael.el.untooltip = function () {
    this.tt.remove();
    return this;
};