#!/bin/sh
git clone https://github.com/jinroh/kadoh.git
cd kadoh
npm install
sudo npm install -g jake
sudo apt-get install libexpat-dev
jake build
