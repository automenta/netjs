//var http = require('http');
//var util = require('util');

//var myutil = require('../client/util.js');

/*
//TODO implement request-per-second parameter, bunch as many symbols together as possible per request
function GoogleFinanceSymbols(symbols) {
	var s = sensor.PeriodicSensor('GoogleFinanceSymbols_' + symbols, 5.0 * 60 * 1000, function() {
		get_quote(symbols, function(next) {
			s.out.push([ 'Finance' "emotion-happy", next]);
		});
	});

	return s;
}
exports.GoogleFinanceSymbols = GoogleFinanceSymbols;

function get_quote(tickers, output) {
	
	var p_ticker = "";
	for (i = 0; i < tickers.length; i++) {
		p_ticker = p_ticker + tickers[i] + ',';
	}
	p_ticker = p_ticker.substring(0, p_ticker.length-1);
	
	http.get({
		host: 'www.google.com',
		port: 80,
		path: '/finance/info?client=ig&q=' + p_ticker
	}, function(response) {
		response.setEncoding('utf8');
		var data = "";

		response.on('data', function(chunk) {
			data += chunk;
		});

		response.on('end', function() {
			if(data.length > 0) {
				try {
					var data_object = JSON.parse(data.substring(3));
				} catch(e) {
					return;
				}
				
				var now = Date.now();

				for (var i = 0; i < data_object.length; i++) {
					var quote = {};
					quote.ticker = data_object[i].t;
					quote.last_trade_time = data_object[i].lt;
					quote.uri = quote.ticker + "_" + quote.last_trade_time;
					quote.tag = [ 'FinanceQuote' ];
					quote.exchange = data_object[i].e;
					quote.price = data_object[i].l_cur;
					quote.change = data_object[i].c;
					quote.change_percent = data_object[i].cp;
					quote.dividend = data_object[i].div;
					quote.yield = data_object[i].yld;
					quote.when = now;
					output(quote);
				}
				


				//p_socket.emit('quote', PRETTY_PRINT_JSON ? JSON.stringify(quote, true, '\t') : JSON.stringify(quote));
			}
		});
	});
}
*/

