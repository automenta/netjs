var util = require('../client/util.js');
var _ = require('underscore');

var natural = require('natural');
var TfIdf = natural.TfIdf;
//var tokenizer = new natural.TreebankWordTokenizer();
var tokenizer = new natural.WordTokenizer();
var stopwordsArray = require('stopwords').english;
var stopwords = { };
for (var i = 0; i < stopwordsArray.length; i++)
	stopwords[stopwordsArray[i]] = true;

/*
https://github.com/NaturalNode/natural
https://github.com/ushahidi/Chambua (Stanford CoreNLP, Java)

OpenCalais

https://github.com/ushahidi/Reverberations
https://github.com/ushahidi/swiftmeme
..

*/

exports.plugin = function($N) {
    return {
        name: 'Natural Language Processing',
        description: 'Annotates published objects with NLP metadata for advanced analysis',
        version: '1.0',
        author: 'http://netention.org',
        
        start: function(options) {

        },
        prePub: function(x) {
			var lastModified = x.modifiedAt || x.createdAt;

			if (x._wordFrequencyAt)
				if (x._wordFrequencyAt == lastModified)
					return x;

			var fulltext = util.objText(x);

			if (fulltext.length == 0) return x;

			var STOPWORD_FACTOR = 0.1;

			/*var terms = _.map( tokenizer.tokenize(fulltext), function (w) {
				return natural.LancasterStemmer.stem(w);
			});*/
			var terms = tokenizer.tokenize(fulltext);

			var tfidf = new TfIdf();

			tfidf.addDocument(terms);

			var termWeight = tfidf.documents[0];
			delete termWeight['__key'];
		
			var total = 0;
			_.each(termWeight, function(v, k) {
				if (stopwords[k]) {
					v = STOPWORD_FACTOR * Math.log(v);
					termWeight[k] = v;
				}
				total += v;
			});
			_.each(termWeight, function(v, k) {
				if (total > 0)
					termWeight[k] = parseFloat(parseFloat(v / total).toFixed(4));
			});	

			//console.log(x.id, 'full text', fulltext, termWeight);
			x._wordFrequency = termWeight;
			x._wordFrequencyAt = lastModified;

			return x;
        },
        stop: function() {
        }
    };
};


