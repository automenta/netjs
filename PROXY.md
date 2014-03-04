= Running Multiple Netention Servers via Proxy


1. sudo npm install -g bouncy
https://github.com/substack/bouncy

2. Creates routes.json, like:

{
	"domain1.com" : 8081,
	"domain2.org" : 8082
}

3. Run: sudo bouncy routes.json 80

4. To run in background: sudo -b bouncy routes.json 80

