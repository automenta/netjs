exports.plugin = function($N) {
    var _ = require('underscore');
    var convnetjs = require('convnetjs');
    
    return {
        name: 'Tag Time Prediction',
        description: '',
        options: {},
        version: '1.0',
        author: 'http://netention.org',

        start: function(options) {
            
            var cols = 0;
            var col = { };
            var colCounts = { };
            $N.getLatestObjects(100, function(o) {
                
                o.forEach(function(x) {
                    var tags = $N.objTagStrength(x);
                    _.each(tags, function(s, k) {
                        if (col[k]===undefined) {
                            col[k] = cols;
                            cols++;
                            colCounts[k] = 1;
                        }
                        else {
                            colCounts[k]++;
                        }
                    });
                    console.log(col, colCounts);                    
                });
            });
            
            // toy data: two data points, one of class 0 and other of class 1
            var train_data = [new convnetjs.Vol([1.3, 0.5]), new convnetjs.Vol([0.1, 0.7])];
            var train_labels = [0, 1];

            
            var opts = {}; // options struct
            opts.train_ratio = 0.7; // what portion of data goes to train, in train/validation fold splits. Here, 70%
            opts.num_folds = 10; // number of folds to evaluate per candidate
            opts.num_candidates = 50; // number of candidates to evaluate in parallel
            opts.num_epochs = 50; // number of epochs to make through data per fold


            var magicNet = new convnetjs.MagicNet(train_data, train_labels, opts);
            magicNet.onFinishBatch(finishedBatch); // example of setting callback for events

            // start training MagicNet. Every call trains all candidates in current batch on one example
            //setInterval(function(){ magicNet.step(); }, 0});
                        
            setInterval(function(){ magicNet.step(); }, 0);

            // once at least one batch of candidates is evaluated on all folds we can do prediction!
            function finishedBatch() {
              // prediction example. xout is Vol of scores
              // there is also predict_soft(), which returns the full score volume for all labels
              var some_test_vol = new convnetjs.Vol([0.1, 0.2]);              
              var predicted_label = magicNet.predict(some_test_vol);
              console.log(predicted_label);
            }
            
        },
        
        /*onPub: function(x) {
        },*/
        /*onDelete: function(x) {
            if (!this.matchedID)
                return;
            if (_.contains(this.matchedID, x.id))
                this.updateCentroids();
        },*/
        stop: function() {
        }
    };
};
