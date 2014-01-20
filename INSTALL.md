Install Netention for Node.JS on Ubuntu Linux
=============================================

Requirements
------------
*   node.JS (latest version preferably)
*   mongoDB

Optional Requirements
---------------------
These packages facilitate the development process:
*   git
*   build-essential (includes GCC/G++)
*   libreoffice (for viewing & editing included documents, spreadsheets, & presentations in doc/ folder)

```
sudo apt-get install build-essential git mongodb
```

Instructions
------------

###The following commands run from the parent directory in which Netention will be installed

*Build & Install Node.JS from Source Code*
Note: See http://nodejs.org to find the latest version, which may be ahead of the one linked in the instructions here.
```
wget http://nodejs.org/dist/v0.10.24/node-v0.10.24.tar.gz
tar xvzf node-v0.10.24.tar.gz 
cd node-v0.10.24/
./configure ; make ; sudo make install
sudo npm -g install always
```

*Get the latest Netention source code*
```
git clone https://github.com/1h1e1s1/netjs.git ; cd netjs ; npm update
```

###The following commands run from the directory where Netention is installed (ex: 'netjs')

*Begin using Netention default options*
```
cp netention.options.js.EXAMPLE netention.options.js
```

*Edit Netention Options*
TODO: instructions for each options in netention.options.js
```
nano netention.options.js
```


*Run Netention Once*
```
node netention.js
```

*Run Netention via 'always'*
The 'always' node.js utility will automatically restart a node.js application when any of its source code files change.
```
always netention.js
```

*Run Netention via 'always', in background & with no output*
```
nohup always netention.js >/dev/null 2>/dev/null &
```

*Update Netention Source Code (from Git) & NPM Dependencies*
```
git pull ; npm update
```

*Use proxy.js to serve multiple instances on one server*
TODO

*Create a start.sh script that can be run on system startup*
TODO


Install Netention for Node.JS on Windows
========================================
Coming soon.



Install Netention for Node.JS on OSX
========================================
Coming soon.

