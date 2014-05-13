/* 
Github Webhook Handler

1. registers POST handler @ /githubhook
2. callback functions for received objects
        ex: commit, run git pull

*/
var _ = require('underscore');

exports.plugin = function($N) {
    return {
        name: 'GitHub Input',
        description: 'Handles GitHub webhook events',
        options: {},
        version: '1.0',
        author: 'http://github.com',
        start: function(options) {
            
            //https://developer.github.com/webhooks/
            $N.httpserver.post('/githubhook', function(req, res) {
                var g = req.body;
                
                $N.pub(new $N.nobject().setName("GitHub")
                                .addDescription(JSON.stringify(g,null,4)));
                
                res.writeHead( 200, {
                        'Content-type': 'text/html'
                });
                res.end();
            });

        }
    }
};