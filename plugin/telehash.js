/**
 * @author seh
 * 
 * https://github.com/diaspora/diaspora/wiki/Federation-Protocol-Overview
 * https://github.com/quartzjer/node-telehash
 */

var DEFAULT_TELEHASH_PORT = 10901;

exports.plugin = {
    name: 'Telehash',
    description: 'P2P Messaging Network',
    options: {},
    version: '1.0',
    author: 'http://telehash.org',
    start: function(netention, util) {

        /*
         TelehashNode:
         IP
         Public Key
         inFilter - null means anything passes thru, otherwise it's a boolean tag expression
         outFilter - null means everything broadcasts out, otherwise a tag expression
         lastReceived [ro]
         connected? [ro]
         */
        netention.addTags([
            {
                uri: 'TelehashNode', name: 'Telehash Node',
                properties: {
                    'telehashname': {name: 'Hashname', type: 'text', min: 1, max: 1, readonly: true},
                    'telehashAddress': {name: 'IP:port', type: 'text', min: 1, max: 1, default: ('0.0.0.0:' + DEFAULT_TELEHASH_PORT)},
                    'telehashPublicKey': {name: 'Public key', type: 'textarea', min: 1, max: 1},
                    'connected': {name: 'Connected', type: 'boolean'},
                    'lastReceived': {name: 'Last received', type: 'timepoint'},
//                    'thSeedsURL': { name: 'seeds.json URL', type: 'url' }                    
                }
            }
        ]);

        var tele = require("telehash");

        var nicks = {};
        function messageInit(err, arg, chan, cb) {
            if (err)
                return log("message handshake err", err);
            chan.nick = (arg.js.nick) ? arg.js.nick : chan.hashname.substr(0, 6);
            nicks[chan.nick] = chan;
            console.log("m[" + chan.nick + "] connected");
            chan.callback = function(err, arg, chan, cbMessage) {
                if (arg && arg.js.message)
                    console.log("m[" + chan.nick + "]:", arg.js.message);
                if (err) {
                    console.log("m[" + chan.nick + "] disconnected", err);
                    delete nicks[chan.nick];
                }
                cbMessage();
            };
            cb();
        }

        var that = this;

        that.node = null;
        that.connect = function connect(x) {
            var hashname = util.objFirstValue(x, 'telehashname');
            var addr = util.objFirstValue(x, 'telehashAddress');
            var publicKey = util.objFirstValue(x, 'telehashPublicKey');


            if (hashname && addr && publicKey) {
                var ip = addr.split(':')[0];
                var p = parseInt(addr.split(':')[1]);

                console.log('Telehash connect: ', ip, p);

                that.node.addSeed({ip: ip, port: p, pubkey: publicKey});


                /*(function ping() {
                 node.stream(hashname, "object").send('client');
                 }
                 
                 setInterval(ping, 5000);*/
            }
        }

        tele.genkey(function(err, seedKey) {
            seedKey.nick = netention.server.name;

            that.node = tele.hashname(seedKey, {port: DEFAULT_TELEHASH_PORT});

            var hashnames = {};

            var selfNode = util.objNew('TelehashNode_Local', 'Telehash');
            util.objAddTag(selfNode, 'TelehashNode');
            util.objAddValue(selfNode, 'telehashname', that.node.hashname);
            util.objAddValue(selfNode, 'telehashAddress', netention.server.host + ':' + DEFAULT_TELEHASH_PORT);
            util.objAddValue(selfNode, 'telehashPublicKey', seedKey.public);
            netention.pub(selfNode);

            that.node.listen("message", function(err, arg, chan, cb) {
                //console.log('message', chan, cb);
                messageInit(false, arg, chan, cb);
                chan.send({js: {nick: seedKey.nick}});
            });
            that.node.listen("group", function(err, arg, chan, cb) {
                /*if(!arg.js.group) return log("missing group error from",chan.hashname);
                 groups.get(arg.js.group).add(chan);
                 groupInit(arg, chan);
                 chan.send({js:{nick:id.nick}});
                 cb();*/
            });
            that.node.listen("members", function(err, arg, chan, cb) {
                console.log('members', arg.js.group);
                // send members in chunks
                /*cb();
                 var group = groups.get(arg.js.group);
                 var mlist = Object.keys(group.members);
                 mlist.push(me.hashname); // always include yourself
                 while(mlist.length > 0)
                 {
                 var chunk = mlist.slice(0, 10);
                 mlist = mlist.slice(10);
                 chan.send({js:{members:chunk}});
                 if(mlist.length == 0) chan.end();
                 }*/
            });
            that.node.online(function(err) {
                console.log('Telehash node online @ ' + that.node.hashname + ' ' + seedKey.nick);

                netention.getObjectsByTag('TelehashNode', function(x) {
                    if (x.id == 'TelehashNode_Local')
                        return;
                    connect(x);
                });
                //console.log("client online status", err?err:true, client.hashname);

                //client.stream(seed.hashname, "object"/*, function(err, stream, js) {
                //}*/).send('hi');

                //TODO handle multiple seed URLs
                var seedURL = 'https://raw.github.com/telehash/thjs/master/seeds.json';
                if (seedURL) {
                    var request = require("request");
                    console.log('telehash seed url loading: ', seedURL);
                    request({
                        uri: seedURL,
                        method: "GET",
                        timeout: 10000,
                        followRedirect: true,
                        maxRedirects: 10
                    }, function(error, response, body) {
                        var seeds = JSON.parse(body);
                        for (var i = 0; i < seeds.length; i++) {
                            var s = seeds[i];
                            that.node.addSeed(s);
                        }
                    });
                }

            });
            /*that.node.listen("object", function(err, stream, js) {
                console.log('telehash received object: ', js);
                });*/


        });

    },
    notice: function(x) {
        if (util.objHasTag(x, 'TelehashNode')) {
            //connect(x);
            this.connect(x);
        }
    },
    stop: function(netention) {
        /*if (this.loop) {
         clearInterval(this.loop);
         this.loop = null;
         } */
    }
};
