Raphael.el.button = function () {
    return this.attr({ "fill": "90-#000-#eee" });
};

Raphael.el.redbutton = function () {
    return this.attr({ "fill": "90-#990000-#eee" });
};

Raphael.el.buttonText = function () {
    return this.standard().attr({ "fill": "#fff" });
};

Raphael.el.activeColor = "#fffc51";

Raphael.el.active = function (anim, cb) {
    var pkg = { "stroke-width": 2, "stroke": this.activeColor };
    if (anim) {
        if (cb === undefined) return this.animate(pkg, 200);
        else return this.animate(pkg, 100, cb);
    } else {
        return this.attr(pkg);
    }
};

Raphael.el.isDisabled = function () {
    if (this.type === "text") {
        return this.attr("fill") === "#eee";
    } else {
        return this.attr("fill") === "#ccc";
    }
};

Raphael.el.disabled = function (anim, cb) {
    var pkg = { "fill": "#ccc", "stroke": "eee" };
    var tpkg = { "fill": "#eee" };
    if (this.type === "text") {
        return this.attr(tpkg);
    } else {
        return this.attr(pkg);
    }
};

Raphael.el.enabled = function (anim, cb) {
    if (this.type === "text") {
        return this.buttonText();
    } else {
        return this.button();
    }
};

Raphael.el.inactive = function (anim, cb) {
    var pkg = { "stroke-width": 1, "stroke": "#000" };
    if (anim) {
        if (cb === undefined) return this.animate(pkg, 200);
        else return this.animate(pkg, 100, cb);
    } else {
        return this.attr(pkg);
    }
};

Raphael.el.standard = function () {
    return this.attr({ "font-family": "Trebuchet MS", "font-size": "13pt" });
};
