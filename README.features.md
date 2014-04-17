
**License:** 100% Open-Source Software - WTFPL / MIT License

# Components
Javascript Client & Server for Ubiquity, Simplicity, and Ease
* **Client**: HTML5/Javascript
 * [javascript client libraries]
* **Server**: Node.JS
 * [npm's: see package.json]
 * **Databases**
   * **MongoDB** - Native NoSQL Database
   * _TODO: other databases_
    
# Web Server
Designed to serve clients and connect to other servers and services to form an organic, decentralized P2P network of semantically relevant data exchange.
 * **HTTP AJAJ REST API** (_Express framework_)
 * **WebSockets API** (_socket.io_)
   * Real-time server push
 * Serves static content (HTML, JS, CSS, images, etc...) for client applications 
 * Each account contains **multiple Selves**
  * Automatically creates default Self on first login
  * Create new Selves
  * Delete Selves
  * Switch between Selves ('become')
  * Logout
 * **Public access** (no authentication, optionally disabled)
  *  Login link available
 * **Anonymous access** (optionally disabled)
   * One-click entry: No password or credentials
   * All anonymous users share a set of Selves
 * **Authentication access** (_Passport.js_)
   * OpenID
   * Google Accounts
   * Twitter
   * _TODO:_ Facebook
 * **Site-wide password** (HTTP Basic authentication, optional)
 * Create, edit, remove, and serve **user objects** in database
 * Stores and serves **uploaded files**
 * Sharing scopes
  * Private - only accessible by author
  * Trusted - only accessible by those "trusted" by author
  * Public - accessible by all
 * **Configuration**
  * options.js file
  * _TODO:_ online configuration for administrator
 * **Plugin** activation & deactivation

# Web Client (HTML5/JS)
 * jQuery + jQueryUI **dynamically generated GUI widgets**
 * **Responsive layout** for Desktop and Mobile
 * **Browser compatibility**
   * Chrome
   * Firefox
   * Android
 * Multiple **Views** which can be enabled or disabled in site configuration
 * Multiple **Themes**
   * Default theme specified in client configuration
   * Selectable by users
 * Completely **Rebrand-able**
 * Operates in **Local (offline) mode**, without server
  * Only needs the contents of client/* placed on a web-server
  * Offline configuration: client_configuration.js
  * Offline static ontology: ontology.static.json
  * Loads statically provided objects from HTTP
  * Stores objects in localStorage
  * Additional functionality via PHP scripts
 * Semantic **Focus** selects relevant objects
 * Hotkeys

# Ontology
Collection of **Tags** providing a common semantic vocabulary for describing reality and imagination.
 * **uri** (Uniform Resource Identifier)
 * **name**
 * **description** (optional)
   * Used along with Name to match keywords for auto-suggesting tags while editing objects
 * **tag** - Array of (zero or more) super-tags that they inherit from, forming a **type hierarchy**
 * **properties** - Set of (zero or more) data-typed properties for which values may be specified
   * URI
   * Name
   * Description (optional)
   * Data Type
     * **boolean**
     * **integer**
     * **real** (floating point number)
       * Unit types (optional)
     * **text** (string)
     * **textarea** (multiline HTML string)
     * **url** (URL string)
     * **spacepoint** (point in space)
       * latitude
       * longitude
       * altitude
       * planet ID
     * _TODO:_  **spaceregion** (region in space)
       * geocircular
       * geopolygonal
       * geoquadrilateral      
     * **timepoint** (point in time, unixtime integer)
     * _TODO:_ **timerange**
     * **sketch** (vector drawing)
     * **object** (reference to another object)
       * tag restrictions (optional)
     * **media** (URL to an image, video, or other embeddable content) 


   * **default** (optional) - default value
   * **min** (optional) - integer of minimum allowed instances (arity)
   * **max** (optional) - integer of maximum allowed instances (arity)
   * **readronly** (optional) - prevents editing
   * **reserved** (optional) - prevents use by users
   * **icon** (optional) - relative URL to an icon image                         
 * Operator flag (optional) - indicates a tag that operates on other tags

_TODO:_ The data values for certain types may be interpreted according to the mode of the object: whether it is real or imaginary.  Imaginary descriptions allow one to use boolean expressions (indefinite descriptions) to describe aspects of an ideal or desired reality that can be matched with constant values (definite descriptions) pertaining to real (factual) objects.