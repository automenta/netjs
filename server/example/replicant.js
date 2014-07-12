var replicant = require('replicant');

var o = { a : 1, b: { c: { d: 1} } };
var uo = replicant(o).pipe(process.stdout);

var p = { x : 1 };
var up = replicant(p).pipe(process.stdout);

setInterval(function () {
    uo(function (obj) {
        //obj.a ++;
		//obj.b.push('a');
		obj.b.c.d++;
    });
}, 1000);
setInterval(function () {
    up(function (obj) {
        //obj.a ++;
		//obj.b.push('a');
		obj.x++;
    });
}, 1000);
