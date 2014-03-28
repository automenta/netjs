/*
Ripple.com
--Show users's wallet
--Create trust graph
--Payment actions
*/

exports.plugin = function($N) { return {
        name: 'Ripple',	
		description: 'Multicurrency Wallet and Trust Network',
		options: { },
        version: '1.0',
        author: 'http://ripple.com',
        
		start: function() { 

			//https://github.com/ripple/ripple-lib
			var ripple = require('ripple-lib');
			var _ = require('underscore');


			var RIPPLE_UPDATE_INTERVAL_MS = 1000 * 60 * 15; //15min

			var remote = new ripple.Remote({
			  // see the API Reference for available options
			  trusted:        true,
			  local_signing:  true,
			  local_fee:      true,
			  fee_cushion:     1.5,
			  servers: [
				{
					host:    's1.ripple.com'
				  , port:    443
				  , secure:  true
				}
			  ]
			});

			$N.addTags([
                {
                    uri: 'RippleUser', name: 'Ripple User', 
                    properties: {
                        'walletBalanceXRP': { name: 'XRP Balance', type: 'number', max: 1 },
                        'rippleTrust': { name: 'Ripple Trust', type: 'object' }
                    }
                }				
			]);

			function updateRippleData() {
				var accounts = { };

				$N.getObjectsByTag('User', function(u) {
					var wallet = u.firstValue('walletRipple');
					if (wallet) {
						accounts[u.id] = wallet;
					}
				}, function() {

					function finished() {
						remote.disconnect();
					}

					remote.connect(function() {
					  /* remote connected */

						var pending = _.keys(accounts);
						var wallets = _.values(accounts);
						var walletUsers = _.invert(accounts);

						//https://github.com/ripple/ripple-lib/blob/develop/docs/REFERENCE.md#2-remote-functions
						function nextAccount() {
							var userid = pending.pop();
							if (!userid) {
								finished();
							}

							var a = accounts[userid];

							remote.request_account_info({
								account:a 
							}, function(err, res) {
								if (!err)		{
									var balance = parseFloat(res.account_data.Balance);

									remote.request_account_lines({
										account: a
									}, function(err, res) {
										if (!err) {
											$N.getObjectByID(userid, function(err, U) {
												if (!err) {
													$N.objRemoveTag(U, 'walletBalanceXRP');
													$N.objRemoveTag(U, 'rippleTrust');

													$N.objAddValue(U, 'walletBalanceXRP', balance);

													for (var i = 0; i < res.lines.length; i++) {
														var L = res.lines[i];
														var toAccount = L.account;
														var toUser = walletUsers[toAccount];

														if (wallets.indexOf(L.account)!=-1) {
															$N.objAddValue(U, 'rippleTrust', toUser);
														}
													}

													$N.notice(U);
												}

											});

										}
										else {
											//console.log('err', err, res);
										}

										nextAccount();
									});

								}
								else {
									//console.log('err', err, res);
									nextAccount();
								}
							});

						}

						nextAccount();

					  // see the API Reference for available functions
					});

				});


			}

			updateRippleData();
			setInterval(updateRippleData, RIPPLE_UPDATE_INTERVAL_MS);


		}
}; };

