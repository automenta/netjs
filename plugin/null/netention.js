/*  Note: Plugin filenames must not contain any '.' characters */
exports.plugin = function($N) {
    return {
        name: 'Null Plugin',
        description: 'An empty plugin to use as a template for creating new plugins',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {
        },
        onConnect: function(who) {
        },
        prePub: function(x) {
            return x;
        },
        onPub: function(x) {
        },
        onDelete: function(x) {
        },
        stop: function() {
        }
    };
};
