/* 
Github Webhook Handler

1. registers POST handler @ /githubhook
2. callback functions for received objects
        ex: commit, run git pull

USE application/x-www-form-urlencoded in Github webhooks settings.
*/
var _ = require('lodash');

exports.plugin = function($N) {
    return {
        name: 'GitHub Input',
        description: 'Reacts to GitHub webhook events',
        options: {},
        version: '1.0',
        author: 'http://github.com',
        start: function(options) {
            
            //https://developer.github.com/webhooks/
            //https://github.com/coreh/hookshot/blob/master/lib/index.js
            
            $N.httpserver.post('/githubhook', function(req, res, next) {

                var g = req.body;

                res.send(202, 'Accepted\n');

                var p = JSON.parse(g.payload);

                var reponame = p.repository.owner.name + '/' + p.repository.name;
                
                var n = new $N.nobject('github:' + p.ref + ':' + p.after)
                                .setAuthor("GitHub:" + reponame)
                                .setName("Git Event")
                                .addDescription(JSON.stringify(p));

                $N.pub(n);
                        
            });
            
            //Test with:
            //curl -X POST http://localhost:8080/githubhook -d '{"paylot": "abc"}' -H "Content-Type: application/x-www-form-urlencoded"

        }
    }
};