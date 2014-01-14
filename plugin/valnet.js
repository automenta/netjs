/* Value Network 

*/
var request = require('request');

exports.plugin = {
        name: 'Value Network',	
		description: '',
		options: { },
        version: '1.0',
        author: 'https://github.com/valnet/valuenetwork',
        
		start: function(netention, util) { 
            
            
            netention.addTags([
                {
                    uri: 'ProcessNetwork', name: 'Process Network', 
                    properties: {
                        'processNetworkURL': { name: 'URL', type: 'text' /* url */, min: 1, default: 'http://' },
                        'processNetworkUpdatePeriod': { name: 'Fetch Period (seconds)', type: 'real' /* number */, default: "3600", min: 1, max: 1 },
                        'lastProcessNetworkUpdate': { name: 'Last RSS Update',  type: 'timepoint' }
                    }
                },
                {
                    uri: 'ProcessNode', name: 'Process',
                    properties: {
                        'processPrevious': { name: 'Previous', type: 'object' },
                        'processNext': { name: 'Next', type: 'object' }
                    }
                }
            ]);

			var update = this.update = function(x) {
				//http://valdev.webfactional.com/accounting/json-processes/valdev.webfactional.com/accounting/json-processes/
				//http://valnet.webfactional.com/accounting/json-processes/

				var url = util.objFirstValue(x, 'processNetworkURL');
				console.log('Updating value network: ' + url);
				request(url, function (error, response, body) {
					if (error) {
						console.log('ERROR: ' + error);
						return;
					}

					var b = JSON.parse(body);
					var nodes = b.nodes;
					var edges = b.edges;

					for (var i = 0; i < nodes.length; i++) {
						var nn = nodes[i];
						var x = util.objNew(url + '#' + nn.id, nn.name);
						x.add('Process');
						x.add(util.timerange(nn.start, nn.end));
						netention.pub(x);
						/*
						{ start: '2013-09-24',
						end: '2013-10-05',
						id: 'Process-336',
						name: 'Make Marketing Brochure' } 
						*/
					}
	
					for (var i = 0; i < edges.length; i++) {
						var ee = edges[i];
						
						var id = ee.from_node + '_' + ee.to_node;

						var x = util.objNew(url + '#' + id, ee.name);
						x.add('ProcessTransition');

						if (ee.from_node)
							x.add('processPrevious', url + '#' + ee.from_node);
						if (ee.to_node)
							x.add('processNext', url + '#' + ee.to_node);

						netention.pub(x);
						/*
						{ width: 1,
						to_node: 'Process-335',
						from_node: 'Process-333',
						label: 'Electronics - XYZ piezo micromanipulator' } 
						*/
					}


					console.log(nodes.length + ' nodes, ' + edges.length + ' edges');
				});

			}

			netention.getObjectsByTag('ProcessNetwork', function(x) {				
				update(x);
            });

		},
                
        notice: function(x) {
            /*if (util.objHasTag(x, 'ProcessNetwork')) {
                this.update();
            }*/
        },
        
		stop: function(netention) {
            /*if (this.loop) {
                clearInterval(this.loop);
                this.loop = null;
            } */  
		}
};
            
