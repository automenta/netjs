var httpProxy = require('http-proxy')

var proxy = httpProxy.createProxy();

var options = {  
  'domain1.com': 'http://127.0.0.1:8081',
  'domain2.org': 'http://127.0.0.1:8082'
}

require('http').createServer(function(req, res) {  
  proxy.web(req, res, {
    target: options[req.headers.host]
  }, function(e) { console.log('Proxy Error', e); });
}).listen(80);

