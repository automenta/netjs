var Scuttle = require('scuttlebutt'); //https://github.com/dominictarr/scuttlebutt

var Bucket = require('scuttlebucket');
var Text   = require('r-edit');

var Model = require('scuttlebutt/model');        
var Chat   = require('scuttlebutt/model');

function debugScuttle(m, sendClock) {
    var o = {writable: false};
    if (sendClock)
        o.sendClock = true;
    
    var debug = m.createStream(o);
    debug.pipe(process.stdout);
}

var numNodes = 4;
var startDelay = 100;
var maxIndices = 16;
var writeIntervalMS = 100;
var reportIntervalMS = 1000;

function startNode(port) {
    require('../core.js').start({
        name: 'a' + port,
        plugins: {
            "p2p.js": {                
                port: port,
                address: '127.0.0.1/255.255.255.0', // Tell it your subnet and it'll figure out the right IP for you
                seeds: [{port: (port-1), address:'127.0.0.1'}] // th e address of a seed (a known node)                        
            }
        },
        start: function($N) {

            var incoming = new Model();
            var outgoing = new Model();
            outgoing.set('a', 1);
            outgoing.set('b', 1);
            outgoing.set('a', 2);
            outgoing.set('c', 'text');
            outgoing.set('c', 'textchanged');

            /*if (port === 10000)
                debugScuttle(incoming, false);*/
            
            setInterval(function() {
                var i = parseInt(Math.random()*maxIndices);
                var v = Math.random();
                outgoing.set('i' + i, v);
            }, writeIntervalMS);
            
            setInterval(function() {
                console.log(port, outgoing.keys().length, incoming.keys().length );
            }, reportIntervalMS);
            
            $N.p2p(function(node) {
                console.log('node',port,'start');
                
                var b = node.broadcast;
                b.pipe(outgoing.createStream({writable: false, sendClock: true})).pipe(b);
                b.pipe(incoming.createStream({readable: false, sendClock: true})).pipe(b);
            });
        }
    });
}
    

for (var i = 0; i < numNodes; i++) {
    var f = function(p) {
        return function() {
            startNode(p);
        }
    };
    setTimeout(f(i+10000), i * startDelay);
}


    
//function startB() {
//    var b = require('../core.js').start({
//        name: 'b',
//        plugins: {
//            "p2p.js": {                
//                port: 10002,
//                address: '127.0.0.1/255.255.255.0', // Tell it your subnet and it'll figure out the right IP for you
//                seeds: [{port: 10001, address:'127.0.0.1'}] // th e address of a seed (a known node)                        
//            }
//        },
//        start: function($N) {
//            var sb = require('scuttlebutt');
//            var Model = require('scuttlebutt/model');
//
//            /*var m = new Model();
//            var t = new Text();
//            var bucket = new Bucket().add('model', m).add('text', t);
//            bucket.add('text', t);*/
//
//            var incoming = new Model();
//            var outgoing = new Model();
//            outgoing.set('d', 1);
//            outgoing.set('e', 1);
//            outgoing.set('f', 2);
//            outgoing.set('g', 'text');
//            outgoing.set('g', 'textchanged');
//
//            //debugScuttle(bucket);
//
//            function print() {
//                console.log(Date.now(), ': ', incoming.toJSON());
//            }
//            print();
//            
//            $N.p2p(function(node) {
//                var b = node.broadcast;
//                
//                b.pipe(outgoing.createStream({writable: false, sendClock: true})).pipe(b);
//                b.pipe(incoming.createStream({readable: false, sendClock: true})).pipe(b);
//
//                setInterval(print, 1000);
//                
//                setInterval(function() {
//                    m.set('d', 3);
//                    t.push('word3');
//                }, 5000);
//            });
//        }
//    });
//}

