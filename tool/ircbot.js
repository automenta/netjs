//https://node-irc.readthedocs.org/en/latest/API.html#client
//http://davidwalsh.name/nodejs-irc
var irc = require('irc');

//https://github.com/kirsle/rivescript-js


var _= require('underscore');

//000000000000000000000000000000000000000000000000000000000000

var channel = '#netention';
var username = 'netention_bot';

var client = new irc.Client('irc.freenode.net', username, {
		channels: [channel],
});

console.log('Connected to IRC.');

var RiveScript = require("../plugin/rivescript/rivescript/bin/RiveScript.js");
var bot = new RiveScript({ debug: false });
bot.loadDirectory("./plugin/rivescript/rivescript/eg/brain", function() { 

	bot.sortReplies();
	bot.ready = true;

}, error_handler);
console.log('Brain loaded.');

// Listen for any message, say to him/her in the room
client.addListener("message", function(from, to, text, message) {
//	if (to === channel)
	if (text.indexOf(username)==0) {
		var firstSpace = text.indexOf(' ');
		text = text.substring(firstSpace, text.length);
	    var reply = bot.reply(from, text);
		console.log(text, reply);
		client.say(channel, reply);
	}
});

function error_handler (loadcount, err) {
	console.log("Error loading batch #" + loadcount + ": " + err + "\n");
}
