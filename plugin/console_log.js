var feedparser = require('feedparser');     //https://github.com/danmactough/node-feedparser

var request = require('request');
var _ = require('underscore');
var util = require('../client/util.js');

var minUrlFetchPeriod = 60*10;
var rssCyclePeriod = 5 * 1000;

exports.plugin = function($N) { return {
        name: 'Console Event Log',	
		description: '',
		options: { },
        version: '1.0',
        author: 'http://netention.org',
        
		start: function() {            
			console.log('start', $N.server.name);            
        },
                
        onPub: function(x) {
			console.log('pub', JSON.stringify(x));
        },

		onConnect: function(who) {
			console.log('connect', who);
		},
        
		onFocus: function(who, focus) {
			console.log('focus', who, focus);
		},

		onDelete: function(x) { 
			console.log('delete', x);
		},

		stop: function() {
			console.log('stop');
		}
}; }


