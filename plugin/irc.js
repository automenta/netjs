var irc = require('irc');
var _= require('underscore');
var util = require('../client/util.js');


exports.plugin = {
        name: 'IRC',    
		description: 'Awareness of IRC Channels',
		options: { },
        version: '1.0',
        author: 'http://netention.org',
        
		start: function(netention) {

            
            netention.addTags([
                {
                    uri: 'IRCChannel', name: 'IRC Channel', 
                    properties: {
						//http://www.w3.org/Addressing/draft-mirashi-url-irc-01.txt
						// irc:[ //[ <host>[:<port>] ]/[<target>] [,needpass] ]
                        'channelURL': { name: 'URL', type: 'text' /* url */, min: 1, default: 'irc://server/#channel' },
                    }
                },
                {
                    uri: 'SendToIRC', name: 'Send to IRC', 
                    properties: {
						//http://www.w3.org/Addressing/draft-mirashi-url-irc-01.txt
						// irc:[ //[ <host>[:<port>] ]/[<target>] [,needpass] ]
                        'SendToWhichIRCChannel': { name: 'Channel', type: 'object', min: 1 },
                    }
                }

            ], [ 'Internet' ]);

			var ch = [ '#netention' ];

			var maxusernamelength = 9;
			var username = netention.server.name.replace('/ /g', '_').substring(0, maxusernamelength);

			this.channels = ch;
			this.irc = new irc.Client('irc.freenode.net', username, {
					channels: ch,
			});


			var RiveScript = require("../plugin/rivescript/rivescript/bin/RiveScript.js");
			var bot = new RiveScript({ debug: false });
			bot.loadDirectory("./plugin/rivescript/rivescript/eg/brain", function() { 
				bot.sortReplies();
				bot.ready = true;
			}, function error_handler (loadcount, err) {
				console.log("Error loading batch #" + loadcount + ": " + err + "\n");
			});

			// Listen for any message, say to him/her in the room
			var that = this;
			this.irc.addListener("message", function(from, to, text, message) {
				try {
					var m = JSON.parse(message);
					
					//TODO make this into a .pub(id, func, false /* avoid overwrite */)
					netention.getObjectSnapshot(message.id, function(err, d) {
						if ((err)  || (d.length == 0)) {
							netention.pub(m);
						}
					});
				}
				catch (e) {
					var name = to + ', ' + from + ': ' + text;
					var m = util.objNew(util.MD5(name));
					m.setName(name);
					m.fromIRC = true; //avoid rebroadcast

					netention.getObjectSnapshot(m.id, function(err, d) {
						console.log(m.id, err, d);
						if ((err)  || (d.length == 0)) {
							netention.pub(m);
						}
					});
				}


				//	if (to === channel)
				if (text.indexOf(username)==0) {
					var firstSpace = text.indexOf(' ');
					text = text.substring(firstSpace, text.length);
					var reply = bot.reply(from, text);
					that.irc.say(to, reply + ' [netention]');

					//save response as a reply
					var n = util.objNew();
					m.fromIRC = true; //avoid rebroadcast
					n.setName(reply);
					n.replyTo = [ m.id ];
					netention.pub(n);

				}
			});

     	},

        notice: function(x) {
            /*if (_.contains(x.tag, 'irc.Channel')) {
                this.update();
            }*/

			var messageDelayMS = 750;

			var that = this;


			if (x.fromIRC)
				return;

			_.throttle(function() { 
				if (that.irc) {
					var xjson = JSON.stringify(x);

					_.each(that.channels, function(to) {						
						console.log('irc.say', to, xjson);
						
						try {
							that.irc.say(to, xjson);
						}
						catch (e) { }
					});
				}
			}, messageDelayMS)();
        },

		stop: function(netention) { 
		}

};
