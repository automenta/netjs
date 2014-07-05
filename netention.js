/*  Starts Netention Web Server  */
var options = (process.argv.length > 2) ? process.argv[2] : './options.js';

var Netention = require('./server/web.js');
var $N= Netention(require(options).options);

