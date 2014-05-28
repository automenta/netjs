/* P2P Netention network */

exports.plugin = function($N) {
    //https://github.com/marcelklehr/smokesignal
    var p2p = require('smokesignal');

    return {
        name: 'P2P Network',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        start: function(options) {
        }
    };
};
