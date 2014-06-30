exports.plugin = function($N) {
    return {
        name: 'Console Event Log',
        description: '',
        version: '1.0',
        author: 'http://netention.org',
        
        start: function(options) {
            console.log('start', $N.server.name);

			
			$N.on('*', function() {
				console.log(this.event, arguments);
			});
			$N.on('*:*', function() {
				console.log(this.event, arguments);
			});
        },

        stop: function() {
            console.log('stop');
        }
    };
};



