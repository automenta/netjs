var _ = require('underscore');
var natural = require('natural');
var cheerio = require('cheerio');
var stopwords = require('./nlp.js').stopwords;
    
exports.plugin = function($N) {

    return {
        name: 'Topic Modeling',
        description: 'Forms topics modeled on objects',
        options: {},
        version: '1.0',
        author: 'http://netention.org',
        
        start: function(options) {
            
            $N.addAll([
                {
                    id: 'TopicLDA', name: 'Topic', extend: ['Concept'],
                        icon: 'icon/rrze/categories/book.png'
                }
            ]);
            
            var tokenizer = new natural.WordTokenizer();

            function update() {
                
                $N.deleteObjectsWithTag('TopicLDA', function() {
                    $N.getLatestObjects(options.maxObjects, function(o) {

                        var lda = new jslda(options.numTopics);
                        var sw = _.keys(stopwords);

                        o.forEach(function(x) {
                            var tags = ($N.objTags(x)||[]).map(function(t) {
                                return '#' + t;
                            });

                            var desc = $N.objDescription(x);
                            if (desc!==undefined) {
                                $ = cheerio.load(desc);
                                desc = $.text();
                            }
                            else
                                desc = '';

                            var text = (x.name||'') + ' ' + desc;

                            var terms = tokenizer.tokenize(text.trim()).map(function(w) {
                                return w.toLowerCase();
                            });
                            terms = _.difference(terms, sw);

                            var tokens = _.union(tags,terms);

                            if (tokens.length > 0)
                                lda.addDocument(x.id, tokens);
                        });

                        //console.log(_.pluck(lda.documents, 'tokens'));

                        lda.run(options.iterations);

                        var graph = lda.getCorrelationGraph(options.minTopicCorrelation);
                        var member = lda.getDocumentMembership();
                        var tw = lda.getTopicWords(options.wordsPerTopic);
                        var topicNum = 0;
                        
                        tw.forEach(function(t) {
                            var x = new $N.nobject('TopicLDA_' + topicNum);

                            x.name =  _.pluck(t.slice(0,3),'word').join(' ');
                            //'Topic' + topicNum;
                            x.addTag('TopicLDA');

                            var totalCounts = 0;
                            t.forEach(function(tc) {
                               totalCounts+=tc.count; 
                            });
                            if (totalCounts > 0) {
                                t.forEach(function(tc) {
                                   tc.count/=totalCounts; 
                                   tc.count = parseFloat($N._n(tc.count,4));
                                });
                            }
                            var tt = { };
                            _.each(t, function(v, k) {
                                tt[v.word] = v.count; 
                            });
                            x.add('tagcloud', tt);

                            //correlations
                            x.with = { };
                            graph.links.forEach(function(l) {
                                if (l.source > l.target) return; //skip half of the matrix
                                if (l.source === topicNum) {
                                    x.with['TopicLDA_' + l.target] = l.value;
                               }
                            });
                            
                            if (options.memberThreshold!==undefined) {
                                var outs = { };
                                var added = 0;
                                _.each(member, function(v, k) {
                                    if (v[topicNum] > options.memberThreshold) {
                                        outs[k] = v[topicNum];
                                        added++;
                                    }
                                });
                                if (added > 0)
                                    x.out = outs;
                                
                            }
                            
                            $N.pub(x);
                            topicNum++;
                        });

                        //console.log(graph);


                    });
                });
            }
            
            setInterval(update, options.updatePeriodMinutes * 1000 * 60);
            update();
            

        },
        onPub: function(x) {
        },
        onDelete: function(x) {
        },
        stop: function() {
        }
    };
};


//https://raw.githubusercontent.com/mimno/jsLDA/master/jslda.html
var jslda = function(numTopics) {
    var zeros = function(n) {
      var x = new Array(n);
      for (var i = 0; i < n; i++) { x[i] = 0.0; }
      return x;
    };

    var documentTopicSmoothing = 0.1;
    var topicWordSmoothing = 0.01;

    var vocabularySize = 0;

    var vocabularyCounts = {};

    // Constants for calculating topic correlation. A doc with 5% or more tokens in a topic is "about" that topic.
    var correlationMinTokens = 1;
    var correlationMinProportion = 0.02;


    var stopwords = {};
    //  ["the", "and", "of", "for", "in", "a", "on", "is", "an", "this", "to", "by", "abstract", "paper", "based", "with", "or", "are", "from", "upon", "we", "us", "our", "can", "be", "using", "which", "that", "d", "n", "as", "it", "show", "these", "such", "s", "t", "i", "j", "have", "one", "new", "one", "has", "learning", "model", "data", "models", "two", "used", "results"].forEach( function(d) { stopwords[d] = 1; } );

    var docSortSmoothing = 10.0;
    var sumDocSortSmoothing = docSortSmoothing * numTopics;

    var completeSweeps = 0;

    var selectedTopic = -1;

    var wordTopicCounts = {};
    var topicWordCounts = [];
    var tokensPerTopic = [];
    tokensPerTopic.length = numTopics;
    for (var topic = 0; topic < numTopics; topic++) {
      tokensPerTopic[topic] = 0;
    }

    var topicWeights = [];
    topicWeights.length = numTopics;

    var documents = [];

    var linkDistance = 150;
    var correlationCutoff = 0.25;

    var truncate = function(s) { return s.length > 300 ? s.substring(0, 299) + "..." : s; }
    
    var addDocument = function( docID, rawTokens ) {

        if (rawTokens.length === 0) return;
        
      var tokens = [];
      var topicCounts = zeros(numTopics);

      rawTokens.forEach(function (word) {
//        if (word !== "" && ! stopwords[word] && word.length > 2) {
        if (word.length > 2) {
          var topic = Math.floor(Math.random() * numTopics);
          tokensPerTopic[topic]++;
          if (! wordTopicCounts[word]) {
            wordTopicCounts[word] = {};
            vocabularySize++;
            vocabularyCounts[word] = 0;
          }
          if (! wordTopicCounts[word][topic]) {
            wordTopicCounts[word][topic] = 0;
          }
          wordTopicCounts[word][topic] += 1;
          vocabularyCounts[word] += 1;
          topicCounts[topic] += 1;
          tokens.push({"word":word, "topic":topic });
        }
      });

      documents.push({ "id" : docID, "tokens" : tokens, "topicCounts" : topicCounts});
    };
    this.addDocument = addDocument;
    
    this.documents = documents;

    var sampleDiscrete = function(weights, sum) {
      var sample = sum * Math.random();
      var i = 0;
      sample -= weights[i];
      while (sample > 0.0) {
        i++;
        sample -= weights[i];
      }
      return i;
    };
    
    this.run = function(iterations) {
        for (var s = 0; s < iterations; s++) { sweep(); }
        sortTopicWords();
    };

    var sweep = function() {
      documents.forEach( function( currentDoc, i ) {
        var docTopicCounts = currentDoc.topicCounts;
        for (var position = 0; position < currentDoc.tokens.length; position++) {
          var token = currentDoc.tokens[position];
          tokensPerTopic[ token.topic ]--;
          var currentWordTopicCounts = wordTopicCounts[ token.word ];
          currentWordTopicCounts[ token.topic ]--;
          docTopicCounts[ token.topic ]--;

          var sum = 0;
          for (var topic = 0; topic < numTopics; topic++) {
            if (currentWordTopicCounts[ topic ]) {
              topicWeights[topic] =
                (documentTopicSmoothing + docTopicCounts[topic]) *
                (topicWordSmoothing + currentWordTopicCounts[ topic ]) /
                (vocabularySize * topicWordSmoothing + tokensPerTopic[topic]);
            }
            else {
              topicWeights[topic] =
                (documentTopicSmoothing + docTopicCounts[topic]) * topicWordSmoothing /
                (vocabularySize * topicWordSmoothing + tokensPerTopic[topic]);
            }
            sum += topicWeights[topic];
          }

          token.topic = sampleDiscrete(topicWeights, sum);
          tokensPerTopic[ token.topic ]++;
          if (! currentWordTopicCounts[ token.topic ]) {
            currentWordTopicCounts[ token.topic ] = 1;
          }
          else {
            currentWordTopicCounts[ token.topic ] += 1;
          }
          docTopicCounts[ token.topic ]++;
        }
      });

      completeSweeps += 1;
    };

    var byCountDescending = function (a,b) { return b.count - a.count; };
    var topNWords = function(wordCounts, n) { 
        return wordCounts.slice(0,n);//.map( function(d) { return d.word; }).join(" "); 
    };

    var sortTopicWords = function() {
      topicWordCounts = [];
      for (var topic = 0; topic < numTopics; topic++) {
        topicWordCounts[topic] = [];
      }

      for (var word in wordTopicCounts) {
        for (var topic in wordTopicCounts[word]) {
          topicWordCounts[topic].push({"word":word, "count":wordTopicCounts[word][topic]});
        }
      }

      for (var topic = 0; topic < numTopics; topic++) {
        topicWordCounts[topic].sort(byCountDescending);
      }  
    };

    var getTopicWords = function(words) {
      var topicTopWords = [];

      for (var topic = 0; topic < numTopics; topic++) {
        topicTopWords.push(topNWords(topicWordCounts[topic], words));
      }
      return topicTopWords;

    };
    this.getTopicWords = getTopicWords;


    /* This function will compute pairwise correlations between topics.
     * Unlike the correlated topic model (CTM) LDA doesn't have parameters
     * that represent topic correlations. But that doesn't mean that topics are
     * not correlated, it just means we have to estimate those values by 
     * measuring which topics appear in documents together.
     */
    var getTopicCorrelations = function() {

      // initialize the matrix
      var correlationMatrix = new Array(numTopics);
      for (var t1 = 0; t1 < numTopics; t1++) {
        correlationMatrix[t1] = zeros(numTopics);
      }

      var topicProbabilities = zeros(numTopics);

      // iterate once to get mean log topic proportions
      documents.forEach(function(d, i) {

        // We want to find the subset of topics that occur with non-trivial concentration in this document.
        // Only consider topics with at least the minimum number of tokens that are at least 5% of the doc.
        var documentTopics = new Array();
        var tokenCutoff = Math.max(correlationMinTokens, correlationMinProportion * d.tokens.length);

        for (var topic = 0; topic < numTopics; topic++) {
          if (d.topicCounts[topic] >= tokenCutoff) { 
            documentTopics.push(topic);
            topicProbabilities[topic]++; // Count the number of docs with this topic
          }
        }

        // Look at all pairs of topics that occur in the document.
        for (var i = 0; i < documentTopics.length - 1; i++) {
          for (var j = i + 1; j < documentTopics.length; j++) {
            correlationMatrix[ documentTopics[i] ][ documentTopics[j] ]++;
            correlationMatrix[ documentTopics[j] ][ documentTopics[i] ]++;
          }
        }
      });
      for (var t1 = 0; t1 < numTopics - 1; t1++) {
        for (var t2 = t1 + 1; t2 < numTopics; t2++) {
          correlationMatrix[t1][t2] = Math.log((documents.length * correlationMatrix[t1][t2]) /
                                               (topicProbabilities[t1] * topicProbabilities[t2]));
          correlationMatrix[t2][t1] = Math.log((documents.length * correlationMatrix[t2][t1]) /
                                               (topicProbabilities[t1] * topicProbabilities[t2]));
        }
      }

      return correlationMatrix;
    };

    var getCorrelationGraph = function(cutoff) {
        var correlationMatrix = getTopicCorrelations();
      var graph = {"nodes": [], "links": []};
      for (var topic = 0; topic < numTopics; topic++) {
        graph.nodes.push({"name": topic,"words": topNWords(topicWordCounts[topic], 3)});
      }
      for (var t1 = 0; t1 < numTopics; t1++) {
        for (var t2 = 0; t2 < numTopics; t2++) {
          if (t1 !== t2 && correlationMatrix[t1][t2] > cutoff) {
            graph.links.push({"source": t1, "target": t2, "value": correlationMatrix[t1][t2]});
          }
        }
      }
      return graph;
    };
    this.getCorrelationGraph = getCorrelationGraph;

    function normalizeVector(v) {
        var total = 0;
        for (var i = 0; i < v.length; i++) total += v[i];
        if (total > 0)
            return v.map(function(u) {
                return u/total;
            });
        return v;
    }
    
    this.getDocumentMembership = function() {
        var m = { };
        documents.forEach(function(d) {
            var v = normalizeVector(d.topicCounts);
            m[d.id] = v;
        });
        return m;
    };

    var mostFrequentWords = function() {
      // Convert the random-access map to a list of word:count pairs that
      //  we can then sort.
      var wordCounts = [];
      for (var word in vocabularyCounts) {
        wordCounts.push({"word":word, "count":vocabularyCounts[word]});
      }

      wordCounts.sort(byCountDescending);
      return wordCounts;
    };
    
};


/* Matilda.js
 * Webscale Statistical Inference
 * https://raw.githubusercontent.com/JDvorak/Matilda.js/master/src/Matilda.js
 */

var Matilda = {};

Matilda.Model = (function () {


   // / Helpers / /    / 
  var emptyMatrix = function(height, width) {
    var height = height,
        width = width || height, 
        newMatrix = []; 

    for (var t1 = 0; t1 < height; t1++) {
      newMatrix[t1] = [];
      for (var t2 = 0; t2 < width; t2++) {
        newMatrix[t1][t2] = 0.0;
      }
    }
    return newMatrix;
  }

  var matrixEach = function(matrix, callback, context) {
    var len = matrix.length;
    for (var t1 = 0; t1 < len; t1++) {
      for (var t2 = 0; t2 < len; t2++) {
        callback.call(context, t1, t2, matrix)
      }  
    }
  }

  var weightedRandom = function(weights, sum) {
    var sample = sum * Math.random(),
             i = 0;

    sample -= weights[i];

    while (sample > 0.0) {
      i++;
      sample -= weights[i];
    }
    return i;
  };

  // / The Main Event / /    / 
  function Model(params) {
    var topics            = [], 
        numberOfTopics    = 5,   
        topicWeights      = [],    
        documents         = [], 
        numberOfDocuments = 0, 
        wordCount         = 0,
        numberOfWords     = 0,
        beta              = 0,
        alpha             = 0,    
        words             = {};

    var recalculateAlpha = function() {
      beta = numberOfTopics/50.0;
    }
    
    var recalculateBeta = function() {
      alpha = numberOfWords/200.0;
    }

    var initializeTopics = function(){
      topics = [];
      topicWeights = [];
      for (var k = 0; k < numberOfTopics; k++) {
        topicWeights[k] = (1/numberOfTopics);
        topics[k] = {
                    id:       k,
                    withWord: {}, 
                    wordTotal: 0, 
                    };
      };

      for (w in words) {assignRandomly(words[w])};
    };

    var assignRandomly = function(word) {
      var random = Math.floor(Math.random() * numberOfTopics);
      word.isTopic = random;
      if (!topics[random].withWord[word.id]) topics[random].withWord[word.id] = 0;
      topics[random].withWord[word.id]++;
      topics[random].wordTotal++;
    };

    var nowCallback = function(callback, context, whatElse) {
      if (!callback) return;
      var dataObject = {topics: topics, 
                        vocab: words,
                        documents: documents
                       };

      callback.call(context, dataObject, whatElse);
    };




    // / Methods / /    / 
    this.setNumberOfTopics = function(K) {
      numberOfTopics = K;
      recalculateAlpha();
      initializeTopics();
      return this;
    }; 

    this.addDocument = function(doc, callback, context){
      if (doc instanceof Array) {
        if (doc[0] instanceof Array) {
          for (var subDoc = 0, len = doc.length; subDoc < len; subDoc++) {
            this.addDocument(doc[subDoc]);
          }
        } else {
          var token,
              newDoc = {
                        bagOfWords: [], 
                        wordCount: 0,
                        topicsCounts: []
                       };
          for (t in topics) {
            newDoc.topicsCounts[t] = 0;
          };

          for (w in doc) {
            token = doc[w];

            if (!words[token]) {
              words[token] = {
                              id: token,
                              isTopic: 0, 
                              total: 0
                             };

              for (t in topics) {
                topics[t].withWord[token] = 0;
              }

              numberOfWords++;
              recalculateBeta();
            };

            assignRandomly(words[token]);
            if (!newDoc.topicsCounts[words[token].isTopic]) newDoc.topicsCounts[words[token].isTopic] = 0;
            newDoc.topicsCounts[words[token].isTopic]++;
            newDoc.wordCount++;
            words[token].total++;
            wordCount++;
            newDoc.bagOfWords.push(words[token]);
          }

          documents.push(newDoc);
          numberOfDocuments++;

          nowCallback(callback, context, doc)
        }
      } else {
        throw new Error("Pre-process Your Data and Try Again.");
      };

      return this;
    }

    this.train = function(n, callback, context) {
      var sum, curWord;

      for (var iterations = 0; iterations < n; iterations++) {
        documents.forEach(function(currentDoc, i) {
          for (var w = 0; w < currentDoc.wordCount; w++) {
            curWord = currentDoc.bagOfWords[w];

            topics[curWord.isTopic].withWord[curWord.id]--;
            topics[curWord.isTopic].wordTotal--;
            
            sum = 0;
            
            for (var t = 0; t < numberOfTopics; t++) {
              topicWeights[t]  = (beta + currentDoc.topicsCounts[t])  
              topicWeights[t] *= (alpha + topics[t].withWord[curWord.id]) 
              topicWeights[t] /= (numberOfWords * beta + topics[t].wordTotal);               
              sum += topicWeights[t]
            }
            curWord.isTopic = weightedRandom(topicWeights, sum)

            topics[curWord.isTopic].withWord[curWord.id]++;
            topics[curWord.isTopic].wordTotal++;
          }

          for (var t = 0; t < numberOfTopics; t++) {
            topicWeights[t] /= sum;
            currentDoc.topicsCounts[t] = 0;
          };

          currentDoc.bagOfWords.forEach(function (token) {
            currentDoc.topicsCounts[token.isTopic] += 1;
          });
          
        });

        nowCallback(callback, context)
      };
      return this;
    };

    this.topicCorrelations = function(){
      var correlationMatrix = emptyMatrix(numberOfTopics),
          meanLogLikelihood = [],
          logLikelihoodOfDoc = [],
          normalizer = 1.0 / (numberOfDocuments - 1),
          standardDeviations = [];


      for (var t = 0; t < numberOfTopics; t++) {
        meanLogLikelihood[t] = 0.0;
      }

      documents.forEach(function(currentDoc, i) {
        var bagOfWordsLength = currentDoc.bagOfWords.length

        logLikelihoodOfDoc[i] = [];
        for (var t = 0; t < numberOfTopics; t++) {
          logLikelihoodOfDoc[i][t] = Math.log((currentDoc.topicsCounts[t] + beta) /
                                             (bagOfWordsLength + numberOfTopics * beta))
          meanLogLikelihood[t] += logLikelihoodOfDoc[i][t];

        }
      });

      for (var t = 0; t < numberOfTopics; t++) {
        meanLogLikelihood[t] /= numberOfDocuments;
      }

      for (var d = 0; d < numberOfDocuments; d++) {      
        matrixEach(correlationMatrix, function(t1, t2){
          correlationMatrix[t1][t2] +=  (logLikelihoodOfDoc[d][t1] - meanLogLikelihood[t1]) *
                                        (logLikelihoodOfDoc[d][t2] - meanLogLikelihood[t2])
        }, this);
      }

      //console.log(meanLogLikelihood, correlationMatrix)
      matrixEach(correlationMatrix, function(t1, t2) {
        correlationMatrix[t1][t2] *= normalizer
      }, this);

      for (var t = 0; t < numberOfTopics; t++) {
        standardDeviations[t] = Math.sqrt(correlationMatrix[t][t]);
      }

      matrixEach(correlationMatrix, function(t1, t2){
        correlationMatrix[t1][t2] /= (standardDeviations[t1] * standardDeviations[t2]);
      }, this);

      return correlationMatrix;
    };

    this.getWordsByTopics = function() {
      var tuples   = [],
          results = [];

      for (var t = 0; t < numberOfTopics; t++) {
        newArray = [];

        for (var w in topics[t].withWord){
          tuples.push([w, topics[t].withWord[w]]);
          tuples.sort(function(a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });
        }
        results[t] = tuples;
        tuples = [];
      }

      return results;
    };

    this.getSimilarDocuments = function(docIndex) {
      var self = documents[docIndex].topicsCounts,
          tuples   = [],
          difference = 0,
          list = {},
          other;

      for (var i = 0; i < numberOfDocuments; i++) {
        other = documents[i].topicsCounts;

        for (var m = 0; m < other.length; m++) {
          difference += 1/(Math.abs(self[m] - other[m]) + 1)
        }        
          list[i] = difference /other.length;
          difference = 0;
      }

      for (i in list) {
          tuples.push([i, list[i]]);
          //console.log(tuples)
          tuples.sort(function(a, b) { return a[1] < b[1] ? 1 : a[1] > b[1] ? -1 : 0 });
        }

      return tuples;
    };

    this.getDocuments = function() {
      return documents;
    };

    this.getTopics = function() {
      return topics;
    };

    this.getVocabulary = function() {
      return words;
    };

    initializeTopics();
  };

  return Model;
}());