/*
Ripple Interface

--Show users's wallet
--Create trust graph

TODO
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

			var remote = new ripple.Remote({ 	  // see the API Reference for available options
			  trusted:        true,
			  local_signing:  true,
			  local_fee:      true,
			  fee_cushion:     1.5,
			  servers: [	{	host:    's1.ripple.com', port:    443, secure:  true	}	  ]
			});

			$N.addTags([
                {
                    uri: 'RippleUser', name: 'Ripple User', 
                    properties: {
                        'walletBalanceXRP': { name: 'XRP Balance', type: 'real', max: 1, readonly: true },
                        'walletBalanceHRS': { name: 'Hours Balance', type: 'real', max: 1, readonly: true },
                        'walletBalanceUSD': { name: 'USD Balance', type: 'real', max: 1, readonly: true },
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
									var xrpBalance = parseFloat(res.account_data.Balance)/1e6;

									remote.request_account_lines({
										account: a
									}, function(err, res) {
										if (!err) {
											$N.getObjectByID(userid, function(err, U) {
												if (!err) {
													U.removeTag('walletBalanceXRP');
													U.removeTag('walletBalanceHRS');
													U.removeTag('walletBalanceUSD');
													U.removeTag('rippleTrust');

													U.add('walletBalanceXRP', xrpBalance);

													var balances = { };
													for (var i = 0; i < res.lines.length; i++) {
														var L = res.lines[i];
														var toAccount = L.account;
														var toUser = walletUsers[toAccount];

														if (wallets.indexOf(L.account)!=-1) {
															U.add('rippleTrust', toUser);
														}
														if (balances[L.currency] == undefined)
															balances[L.currency] = 0;
														balances[L.currency] += parseFloat(L.balance);

													}
													if (balances['USD']) {
														U.add('walletBalanceUSD', balances['USD']);
													}
													if (balances['HRS']) {
														U.add('walletBalanceHRS', balances['HRS']);
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

