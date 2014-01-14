var express = require('express')
var app = express();
app.use(express.bodyParser());

var exec = require('child_process').exec;

app.post('/postcommit', function(req, res){
	if(req.body.payload != null) {
		console.log('post commit hook triggered');
		exec('cd $NODE_VIRTUAL_ENV/src/presentations/ && git pull', 
			  function(error, stdout, stderr){
			  	console.log('stdout: ' + stdout);
    			console.log('stderr: ' + stderr);
    			if (error !== null) {
      				console.log('exec error: ' + error);
    			}
			  })
	} else {
		console.log("Someone sent a post commit hook but it's missing info");
		console.log(req.body);
	}

	res.send('OK');
})

app.listen(4000)
console.log('Listening on port 4000');