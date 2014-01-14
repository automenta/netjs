window.app = window.app || {};

(function(){

    Object.create = function(o) {
        function F() {};
        F.prototype = o;
        return new F();
    };

})();

(function(ns){

    ns.extend = function(object1, object2) {
        if (!object1) throw new Error('extend failed because source object was ' + object1);
        var target = ns.beget(object1);
        ns.mixin(target, object2);
        return target;
    };

    ns.mixin = function(object1, object2) {
        for (var name in object2) {
            object1[name] = object2[name];
        }
    };

    ns.isArray = function(o) {
        return Object.prototype.toString.call(o) === '[object Array]';
    };

    ns.each = function(o, f) {
        if (ns.isArray(o)) {
            var len = o.length;
            for (var x = 0; x < len; x++) {
                var r = f.apply(o[x], [x]);
                if (r === false) break; else if (r) continue;
            };
        } else {
            for (var n in o) {
                var r = f.apply(o[n], [n]);
                if (r === false) break; else if (r) continue;
            }
        }
    };

    ns.hasValue = function(o, value) {
        if (ns.isArray(o)) {
            var len = o.length;
            for (var x = 0; x < len; x++) {
                if (o[x] === value) return o[x];
            }
            return undefined;
        } else if (typeof(o) == 'string') {
            if (o === value) return true; else return undefined;
        } else {
            for (var name in o) {
                if (o[name] === value) return o[name];
            }
            return undefined;
        }
    };

    ns.getTimestamp = function() {
        var date = new Date();
        var stamp = date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + ':';
        return stamp;
    };

    /* -------------------------------------------------------
    //////////////////////////////////////////////////////////
    eventful constructor
    //////////////////////////////////////////////////////////
    ------------------------------------------------------- */
    ns.eventful = function(nospec, our) {
        var that, our = our || {};

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        instance
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that = {};

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        protected
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        our.handlers = {};

        /* -------------------------------------------------------
        //////////////////////////////////////////////////////////
        public
        //////////////////////////////////////////////////////////
        ------------------------------------------------------- */
        that.addEventListener = function(name, callback) {
            if (!our.handlers[name]) our.handlers[name] = [];
            our.handlers[name].push(callback);
        };

        that.removeEventListener = function(name, callback) {
            if (!our.handlers[name]) return;

            var handlers = our.handlers[name];
            var len = handlers.length;
            for (var x = 0; x < len; x++) {
                if (handlers[x] === callback) {
                    handlers.splice(x, 1);
                }
            }
        };

        that.triggerEvent = function(name, data) {
            if (!our.handlers[name]) return;

            var handlers = our.handlers[name];
            var len = handlers.length;
            for (var x = 0; x < len; x++) {
                if (typeof(handlers[x]) === 'function') {
                    handlers[x].apply(this, [data]);
                }
            }
        };

        return that;
    };

})(window.app);