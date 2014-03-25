/*  Starts Netention Web Server  */
var options = (process.argv.length > 2) ? process.argv[2] : 'options.js';

require('./server/web.js').start(require('./' + options).options);
