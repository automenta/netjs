/*  Note: Plugin filenames must not contain any '.' characters */
exports.plugin = {
		name: 'Null Plugin',	
		description: 'An empty plugin to use as a template for creating new plugins',
		options: { },
        version: '1.0',
        author: 'http://netention.org',
		start: function(netention, util) { },
		stop: function(netention) { }
};