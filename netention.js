/*
 * Netention Web Server (run script)
 */
var options = null;
if (process.argv.length > 1) {
	options = process.argv[2];
}

if (options == null) options = 'netention.options.js';

console.log('Loading server config: ' + options);

var fs = require('fs');
var o = JSON.parse(fs.readFileSync(options));

console.log(o);

require('./server/web.js').start(o);
