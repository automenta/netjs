# slatebox.js

Slatebox.js is a pure javascript SVG library for interactively viewing and editing mind-maps and concept drawings.

* zoom
* resizing nodes
* popup node editing menu: node text, color, background image, shape, link
* drawing and editing node->node links
* node locking
* node z-order (front/back) control

This fork is a derivative of the same library used at [Slatebox](http://slatebox.com).  It simplifies some things, and has the SignalR features removed to eventually be replaced by etherpad-lite support, thus avoiding any Microsoft server-side components.  Also, the cursors/ are included, and the code references the local .JS files so the code does not depend on slatebox.com remote resources.  Their sneaky Google Analytics code is removed too!

## TODO

* create new node by double clicking
* create directed or undirected node->node links
* import/export to various graph formats (RDF, GraphSON, ...)
* arbor force-directed graph layout
* realtime synchronization via etherpad-lite
