var a = require('../core.js').start({
    name: 'a',
    plugins: {
        "p2p.js": {                
            port: 10001,
            address: '127.0.0.1/255.255.255.0', // Tell it your subnet and it'll figure out the right IP for you
            seeds: [{port: 10002, address:'127.0.0.1'}] // th e address of a seed (a known node)                        
        }
    }
});

var b = require('../core.js').start({
    name: 'b',
    plugins: {
        "p2p.js": {                
            port: 10002,
            address: '127.0.0.1/255.255.255.0', // Tell it your subnet and it'll figure out the right IP for you
            seeds: [{port: 10001, address:'127.0.0.1'}] // th e address of a seed (a known node)                        
        }
    }
});


setTimeout(function() {
    console.log('done');
}, 10000);