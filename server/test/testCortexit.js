/**
 * @author seh
 */
var cortexit = require('../cortexit.js');

cortexit.getSentencized('http://slashdot.org', function(s) {
	console.dir(s);
});