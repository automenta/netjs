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
*   build-essential (GCC/G++)

```sudo apt-get install build-essential git mongodb```

Instructions
------------

###The following commands run from the parent directory in which Netention will be installed

Build & Install Node.JS from Source Code
```wget http://nodejs.org/dist/v0.10.24/node-v0.10.24.tar.gz
tar xvzf node-v0.10.24.tar.gz 
cd node-v0.10.24/
./configure ; make ; sudo make install
sudo npm -g install always```

Get the latest Netention source code
```git clone https://github.com/1h1e1s1/netjs.git ; cd netjs ; npm update```

###The following commands run from the directory where Netention is installed (ex: 'netjs')

Start with Netention Default Options
```cp netention.options.js.EXAMPLE netention.options.js```

Edit Netention Options
```nano netention.options.js```

TODO: provide instructions for all Options

Run Netention Once
```node netention.js```

Run Netention via Always
```always netention.js```

Run Netention via Always, In Background & With No Output
```nohup always netention.js >/dev/null 2>/dev/null &```

Update Netention Source Code (from Git) & NPM Dependencies
```git pull ; npm update```



Install Netention for Node.JS on Windows
========================================
Coming soon.



Install Netention for Node.JS on OSX
========================================
Coming soon.

