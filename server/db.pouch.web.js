//Adapted from: https://github.com/pouchdb/pouchdb-server/blob/master/bin/pouchdb-server

exports.start = function (config) {
	var port = config.port;
	var corser = require('corser');
	var express = require('express'),
		app = express(),
		PouchDB = require('pouchdb');

	var corserRequestListener = corser.create({
		methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE'],
		supportsCredentials: true
	});
	app.use(function (req, res, next) {
		corserRequestListener(req, res, function () {
			if (req.method == 'OPTIONS') {
				// End CORS preflight request.
				res.writeHead(204);
				return res.end();
			}
			next();
		});
	});
	app.get('/img/couchdb-site.png', function (req, res) {
		res.redirect('/icon/netention-button.png');
	});
	app.get('/gui', function (req, res) {
		res.redirect('/_utils');
	});
	app.use('/', require('express-pouchdb')(PouchDB));

	app.listen(port);

	console.log('PouchDB web server on port ' + port + '; fauxton on /gui');
};
