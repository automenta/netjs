/*
 Ripple Interface
 
 --Show users's wallet
 --Create trust graph
 
 TODO
 --Payment actions
 */

exports.plugin = function($N) {
    return {
        name: 'Ripple',
        description: 'Multicurrency Wallet and Trust Network',
        options: {},
        version: '1.0',
        author: 'http://ripple.com',
        start: function(options) {
            
            var defaultPaymentCurrency = 'HRS';

            //https://github.com/ripple/ripple-lib
            var ripple = require('ripple-lib');
            var _ = require('lodash');

            $N.addAll([
                {
                    id: 'RippleUser', name: 'Ripple User', icon: '/icon/wallet.png', extend: ['User'],
                    value: {
                        'walletBalanceXRP': {name: 'XRP Balance', extend: 'real', max: 1, readonly: true},
                        'walletBalanceHRS': {name: 'Hours Balance', extend: 'real', max: 1, readonly: true},
                        'walletBalanceUSD': {name: 'USD Balance', extend: 'real', max: 1, readonly: true},
                        'rippleActions': {name: 'Ripple Actions', extend: 'html', max: 1, readonly: true},
                        'walletRipple': {name: 'Ripple Wallet', extend: 'text', min: 1, max: 1}
                    }
                },
                {
                    id: 'RippleTrust', name: 'Ripple Credit', icon: '/icon/wallet.png', extend: ['Trust'],
                    value: {
                        'rippleTrusts': {name: 'in', extend: 'object', min: 1, readonly: true}
                    }
                },
            ]);

            function _updateRippleData(specificUser) {
                var accounts = {};
                var accountsUpdate = {};

                $N.getObjectsByTag('User', function(u) {
                    var wallet = u.firstValue('walletRipple');
                    if (wallet) {

                        if (specificUser) {
                            if (u.id === specificUser) {
                                accountsUpdate[u.id] = true;
                            }
                        }
                        else {
                            accountsUpdate[u.id] = true;
                        }
                        accounts[u.id] = wallet;
                    }
                }, function() {

                    var remote = new ripple.Remote({// see the API Reference for available options
                        trusted: true,
                        local_signing: true,
                        local_fee: true,
                        fee_cushion: 1.5,
                        servers: [{host: 's1.ripple.com', port: 443, secure: true}]
                    });

                    function finished() {
                        remote.disconnect();
                    }

                    remote.connect(function() {
                        var pending = _.keys(accounts);
                        var wallets = _.values(accounts);
                        var walletUsers = _.invert(accounts);

                        pending = _.intersection(pending, _.keys(accountsUpdate));

                        //https://github.com/ripple/ripple-lib/blob/develop/docs/REFERENCE.md#2-remote-functions
                        function nextAccount() {
                            var userid = pending.pop();
                            if (!userid) {
                                finished();
                                return;
                            }
                            if (!accountsUpdate[userid]) {
                                //nextAccount();
                                return;
                            }

                            var a = accounts[userid].trim();

                            remote.request_account_info({
                                account: a
                            }, function(err, res) {
                                if (!err) {
                                    var xrpBalance = parseFloat(res.account_data.Balance) / 1e6;
                                
                                    remote.request_account_lines({
                                        account: a
                                    }, function(err, res) {

                                        if (!err) {
                                            $N.getObjectByID(userid, function(err, U) {

                                                if (!err) {
                                                    //var originalU = _.clone(U);

                                                    U.removeTag('walletBalanceXRP');
                                                    U.removeTag('walletBalanceHRS');
                                                    U.removeTag('walletBalanceUSD');
                                                    U.removeTag('rippleActions');

                                                    var nn = encodeURIComponent(U.name);
                                                    var trustURL = 'https://ripple.com//trust?to=' + accounts[userid] + '&name=' + nn;
                                                    var payURL = 'https://ripple.com//send?to=' + accounts[userid] + '&name=' + nn;
                                                    if (defaultPaymentCurrency) {
                                                        var ams = '&amount=0' + encodeURIComponent('/' + defaultPaymentCurrency);
                                                        payURL = payURL + ams;
                                                        //trustURL = trustURL + ams; //currently ripple.com responds weird when this is added to a trust URL
                                                    }

                                                    var a =
                                                            '[<a target="_blank" href="' + trustURL + '">Trust</a>]&nbsp;' +
                                                            '[<a target="_blank" href="' + payURL + '">Send</a>]';
                                                    ;
                                                    U.add('rippleActions', a);

                                                    U.add('walletBalanceXRP', xrpBalance);

                                                    var balances = {};
                                                    var trusts = {};
                                                    for (var i = 0; i < res.lines.length; i++) {
                                                        var L = res.lines[i];
                                                        var toAccount = L.account;
                                                        var toUser = walletUsers[toAccount];

                                                        if (wallets.indexOf(L.account) != -1) {
                                                            if (parseFloat(L.limit) > 0) {
                                                                //U.add('rippleTrust', toUser);
                                                                trusts[toUser] = L;
                                                                /*var td = JSON.stringify(L);
                                                                 U.add({id: 'rippleTrust', value: toUser, 
                                                                 description: td});*/
                                                            }
                                                        }
                                                        if (balances[L.currency] == undefined)
                                                            balances[L.currency] = 0;
                                                        balances[L.currency] += parseFloat(L.balance);

                                                    }
                                                    var userRippleTrustObjId = U.id + '.rippleTrust';
                                                    if (_.keys(trusts).length > 0) {
                                                        var rt = $N.objNew(userRippleTrustObjId);
                                                        rt.name = 'Ripple Trust';
                                                        rt.author = rt.subject = U.id;
                                                        rt.hidden = true;
                                                        rt.readonly = true;
                                                        
                                                        //rt.addTag('Trust'); //dont add actual Trust until it gets verified by a payment or some other ripple action
                                                        
                                                        rt.addTag('RippleTrust');
                                                        _.each(trusts, function(v, k) {
                                                            rt.add('rippleTrusts', k);
                                                        });
                                                        $N.pub(rt);
                                                    }
                                                    else {
                                                        $N.deleteObject(userRippleTrustObjId);
                                                    }

                                                    if (balances['USD']) {
                                                        U.add('walletBalanceUSD', balances['USD']);
                                                    }
                                                    if (balances['HRS']) {
                                                        U.add('walletBalanceHRS', balances['HRS']);
                                                    }

                                                    U.touch();
                                                    $N.pub(U);
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

            function updateRippleData(specificUser) {
                try {
                    _updateRippleData(specificUser);
                }
                catch (e) {
                    console.error(e);
                }
            }

            updateRippleData();
            
            if (options.walletUpdateIntervalMS)
                setInterval(updateRippleData, options.walletUpdateIntervalMS);

            this.updateRippleData = updateRippleData;

        },
        onConnect: function(who) {
            if (this.updateRippleData)
                this.updateRippleData(who.id);
        },
        /*onPub: function(who) {
          //..  
        },*/
    };
};

