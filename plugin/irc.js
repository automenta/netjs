var _ = require('underscore');


exports.plugin = function($N) {
    return {
        name: 'IRC',
        description: 'Awareness of IRC Channels',
        options: {},
        version: '1.0',
        author: 'http://$N.org',
        start: function(options) {
            function tolower(s) { return s.toLowerCase(); }
            options.readChannels = _.map(options.readChannels, tolower);
            options.writeChannels = _.map(options.writeChannels, tolower);
            
            this.options = options;
            
            
            var irc = require('irc');

            $N.addTags([
                {
                    uri: 'IRCChannel', name: 'IRC Channel',
                    properties: {
                        //http://www.w3.org/Addressing/draft-mirashi-url-irc-01.txt
                        // irc:[ //[ <host>[:<port>] ]/[<target>] [,needpass] ]
                        'channelURL': {name: 'URL', type: 'text' /* url */, min: 1, default: 'irc://server/#channel'},
                    }
                },
                {
                    uri: 'SendToIRC', name: 'Send to IRC',
                    properties: {
                        //http://www.w3.org/Addressing/draft-mirashi-url-irc-01.txt
                        // irc:[ //[ <host>[:<port>] ]/[<target>] [,needpass] ]
                        'SendToWhichIRCChannel': {name: 'Channel', type: 'object', min: 1},
                    }
                }

            ], ['Internet']);

            var ch = _.union(options.readChannels, options.writeChannels);

            var maxusernamelength = 9;
            
            var username = options.nick || $N.server.name.replace('/ /g', '_').substring(0, maxusernamelength);

            this.channels = ch;
            this.irc = new irc.Client(options.server, username, {
                channels: ch
            });


            /*var RiveScript = require("rivescript");
            var bot = new RiveScript({debug: false});
            bot.loadDirectory("./plugin/rivescript/brain", function() {
                bot.sortReplies();
                bot.ready = true;
            }, function error_handler(loadcount, err) {
                console.log("Error loading batch #" + loadcount + ": " + err + "\n");
            });*/

            // Listen for any message, say to him/her in the room
            var that = this;
            that.prevMsg = '';
            var messageObject = { };
            var bufferedMessages = 0;
            this.irc.addListener("message", function(from, to, text, message) {
                var t = to.toLowerCase();
                if (!_.contains(options.readChannels, t))
                    return;
                
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
                    if (!messageObject[t]) {
                        var name = to + ', ' + from + ': ' + text;
                        var m = $N.objNew();
                        messageObject[t] = m;
                        m.setName(to);
                        m.fromIRC = true; //avoid rebroadcast                        
                    }
                    else {
                        messageObject[t].modifiedAt = Date.now();
                    }
                    
                    messageObject[t].addDescription(from + ': ' + text + '<br/>');
					messageObject[t].touch();
                    $N.pub(messageObject[t]);

                    bufferedMessages++;
                    
                    if (bufferedMessages >= options.maxMessagesPerObject) {
                        bufferedMessages = 0;
                        delete messageObject[t];
                    }
                }


                /*if (text.indexOf(username) == 0) {
                    var firstSpace = text.indexOf(' ');
                    text = text.substring(firstSpace, text.length);
                    var reply = bot.reply(from, text);
                    //that.irc.say(to, reply + ' [netention]');

                    //save response as a reply
                    var n = $N.objNew();
                    //m.fromIRC = true; //avoid rebroadcast
                    n.ircChannels = [from];
                    n.setName(reply);
                    n.replyTo = [m.id];
                    $N.pub(n);
                }*/
            });

            var messageSendDelayMS = 1500;
            that.send = _.throttle(function(to, xjson) {
                that.irc.say(to, xjson);
            }, messageSendDelayMS);

        },
        onPub: function(x) {
            /*if (_.contains(x.tag, 'irc.Channel')) {
             this.update();
             }*/            
            x = $N.objCompact(x);

            var that = this;


            if (x.fromIRC)
                return;
            if (x.removed)
                if (x.content === 'externalRemovalIRC')
                    return;

            var toChannels = that.options.writeChannels;
            if (x.ircChannels)
                toChannels = x.ircChannels;

            if (that.irc) {
                var xjson = JSON.stringify(x);

                _.each(toChannels, function(to) {
                    try {
                        that.send(to, xjson);
                    }
                    catch (e) {
                    }
                });
            }
        },
        stop: function() {
        }

    };
};
