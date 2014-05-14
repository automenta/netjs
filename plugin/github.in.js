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
            //https://github.com/coreh/hookshot/blob/master/lib/index.js
            $N.httpserver.post('/githubhook', function(req, res, next) {

                try {
                    var g = JSON.parse(req.body); //JSON.parse(req.body.payload);                

                    $N.pub(new $N.nobject().setName("GitHub")
                                    .addDescription(JSON.stringify(g,null,4)));
                }
                catch (e) {
                    console.error('github:', e);
                }
                            
                res.send(202, 'Accepted\n');         
            });
            
            //Test with:
            //curl -X POST http://localhost:8080/githubhook -d '{"paylot": "abc"}' -H "Content-Type: application/x-www-form-urlencoded"

        }
    }
};