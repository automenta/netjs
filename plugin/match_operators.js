var _ = require('lodash');
var match = require('./match_goals.js');

var updatePeriodMS = 3000;

exports.plugin = function($N) { return {
    name: 'Operator Matching',	
	description: 'Clusters operator nobjects according to their space location & tags',

	options: { },
    version: '1.0',
    author: 'http://netention.org',
    
	start: function() {            
		var that = this;

		this.matchingTags = $N.getOperatorTags();
		this.centroidTag = 'OperatorCentroid';

		//add tag for 'OperatorCentroid' with the following property:
		//	involves: Object<User>
          
       $N.addTags([
            {
                uri: 'OperatorCentroid', name: 'Possible Match'
            }
        ], [ 'Imaginary' ]);
        


		function _updateCentroids() {

			var existingCentroids = [];

		    $N.getObjectsByTag(that.centroidTag, function(o) {      
		        existingCentroids.push(o);
		    }, function() {

			    //remove old centroids, then create new ones
				$N.deleteObjects(existingCentroids, function() {

					var pobjs = { };
					var p = [];					
					var now = Date.now();
					$N.getObjectsByTag(that.matchingTags, function(t) {

						if (!t.author)		return;

						p.push(t);
						pobjs[t.id] = t;

					}, function() {
						that.matchedID = p.map(function(x) { return x.id; });

				        if (p.length < 2)
				            return;

				        var centroids = Math.floor(Math.pow(p.length, 0.55)); //a sub-exponential curve, steeper than log(x) and sqrt(x)
				        
						var c = match.getSpaceTimeTagCentroids($N, p, centroids, true, false, that.matchingTags );

						if (!c) return;


				        for (var i = 0; i < c.length; i++) {
				            var cc = c[i];

							//if implicates only one unique author, discard
							var implicatedAuthors = _.unique( cc.implicates.map(function(x) {
								return pobjs[x].author;
							}));

							if (implicatedAuthors.length < 2) {
								return;
							}

							cc.setName('Possible Match ' + i);

				            cc.addTag(that.centroidTag);

				            cc.addDescription(JSON.stringify(cc.tags,null,4));

							_.each(implicatedAuthors, function(a) {
								cc.add('involvesUser', a);
							});

				            $N.pub(cc);
				        }
					});   
				});
		    });

		}
		
		this.updateCentroids = _.throttle(_updateCentroids, updatePeriodMS);
		this.updateCentroids();
    },
            
    onPub: function(x) {
		if ( x.hasTag(this.matchingTags) && !x.hasTag(this.centroidTag) )
			this.updateCentroids();
    },

	onDelete: function(x) { 		
		if (!this.matchedID) return;
		if (_.contains(this.matchedID, x.id))
			this.updateCentroids();
	},

	stop: function() {	}
}; };

