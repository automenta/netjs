var irc = require('irc');
var _= require('underscore');


exports.plugin = function($N) { return {
        name: 'IRC',    
		description: 'Awareness of IRC Channels',
		options: { },
        version: '1.0',
        author: 'http://$N.org',
        
		start: function() {

            
            $N.addTags([
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
			var username = $N.server.name.replace('/ /g', '_').substring(0, maxusernamelength);

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
			that.prevMsg = '';
			this.irc.addListener("message", function(from, to, text, message) {
				var prevMsg = that.prevMsg;

				try {
					var m = JSON.parse(text);
					if (m.id) {
						//TODO make this into a .pub(id, func, false /* avoid overwrite */)
						$N.getObjectSnapshot(m.id, function(err, d) {
							var newer = false; //if d.length == 1, newer = (m.lastModified > d.created)
							if ((err) || (newer)) {
								m.fromIRC = true;
								$N.pub(m);
								that.prevMsg = m.id;
							}
							else {
								//remove only objects from outside when told so, TODO use more thorough tracking of authors to allow only an author to delete one's own'
								if (m.removed)
									//if (d[0].fromIRC) 
										$N.deleteObject(m.id, null, "externalRemovalIRC");
							}
						});
					}
				}
				catch (e) {
					var name = to + ', ' + from + ': ' + text;
					var m = $N.objNew($N.MD5(name + prevMsg ) );
					m.setName(name);
					m.fromIRC = true; //avoid rebroadcast

					$N.getObjectSnapshot(m.id, function(err, d) {
						var newer = false; //if d.length == 1, newer = (m.lastModified > d.created)
						if ((err)  || (d.length == 0) || (newer)) {
							$N.pub(m);
							that.prevMsg = m.id;
						}
					});
				}


				//	if (to === channel)
				if (text.indexOf(username)==0) {
					var firstSpace = text.indexOf(' ');
					text = text.substring(firstSpace, text.length);
					var reply = bot.reply(from, text);
					//that.irc.say(to, reply + ' [netention]');

					//save response as a reply
					var n = $N.objNew();
					m.fromIRC = true; //avoid rebroadcast
					m.ircChannels = [ from ];
					n.setName(reply);
					n.replyTo = [ m.id ];
					$N.pub(n);

				}
			});

     	},

        onPub: function(x) {
            /*if (_.contains(x.tag, 'irc.Channel')) {
                this.update();
            }*/

			var messageSendDelayMS = 1500;

			var that = this;


			if (x.fromIRC)
				return;
			if (x.removed)
				if (x.content == 'externalRemovalIRC')
					return;

			var toChannels = that.channels;
			if (x.ircChannels)
				toChannels = x.ircChannels;

			_.throttle(function() { 
				if (that.irc) {
					var xjson = JSON.stringify(x);

					_.each(toChannels, function(to) {						
						console.log('irc.say', to, xjson);
						
						try {
							that.irc.say(to, xjson);
						}
						catch (e) { }
					});
				}
			}, messageSendDelayMS)();
        },

		stop: function() { 
		}

}; };
