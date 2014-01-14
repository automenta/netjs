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
			var username = 'undefined_';

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
				var m = util.objNew();
				m.setName(to + ', ' + from + ': ' + text);
				netention.pub(m);

				//	if (to === channel)
				if (text.indexOf(username)==0) {
					var firstSpace = text.indexOf(' ');
					text = text.substring(firstSpace, text.length);
					var reply = bot.reply(from, text);
					that.irc.say(to, reply + ' [netention]');

					//save response as a reply
					var n = util.objNew();
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
        },

	stop: function(netention) { 
	}

};
