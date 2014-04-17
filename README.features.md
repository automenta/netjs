
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

----

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

----

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

----

# Ontology
Collection of **Tags** providing a common semantic vocabulary for describing reality and imagination.  A default ontology is provided by the server for clients to use.

 * **uri** (Uniform Resource Identifier)
 * **name**
 * **description** (optional)
   * Used along with Name to match keywords for auto-suggesting tags while editing objects
 * **tag** - Array of (zero or more) super-tags that they inherit from, forming a **type hierarchy**
 * **reserved** (optional) - prevents use by users
 * **icon** (optional) - relative URL to an icon image                         
 * **operator** (optional) - indicates if a tag that operates on other tags
 * **properties** - Set of (zero or more) data-typed properties for which values may be specified
   * **uri**
   * **name**
   * **description** (optional)
   * **type** - data type
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
   * **readonly** (optional) - prevents editing

_TODO:_ The data values for certain types may be interpreted according to the mode of the object: whether it is real or imaginary.  Imaginary descriptions allow one to use boolean expressions (indefinite descriptions) to describe aspects of an ideal or desired reality that can be matched with constant values (definite descriptions) pertaining to real (factual) objects.

----

# Object
A **netention object**, or simply "**nobject**",  semantically expresses a discrete unit of thought and all its related quantifiable and qualifiable characteristics, along with metadata describing provenance information.  They are canonically serializable as **JSON** objects which is a compact representation readily manipulated by Javascript, most programming languages (via libraries), and certain NoSQL databases.
 * **name** - string representing a title or subject-line
 * **author** - ID of the author
 * **createdAt** - unix time this object was created
 * **modifiedAt** - unix time this object was last modified.  if not present, assumed to be the same as createdAt
 * _TODO:_ **expiresAt** - unix time by which this object should be automatically removed
 * **removed** - indicates that any instances of an object with this ID should be deleted (used for broadcasting deletion)
 * **scope** - integer indicating the sharing/privacy level (see ObjScope constants in util.js)
 * **value** - array of value entries (for preserving their order)
   * **id** - URI of the tag this represents, or the property this provides a value for
   * **value** - object representing the data value (not used if id refers to a tag)
   * **strength** - value from 0 to 100% (0.0 to 1.0) indicating the relative strength or weight of this value in relation to other values in this object

----

# Focus
Each **focus** is a method of describing what one is thinking about or interested in.  It functions as a semantic analog-to-digital converter for expressing one’s mental state in a machine-readable data structure.  A focus may be used to compare relevancy with known data objects in order to filter and data, or to create a new (prototype) data object (which may be stored for future use and/or shared with others).

It is expressed as a nobject with optional extra metadata.  Its values represent a proportional-strength tag vector.  Other metadata fields indicate filtering and sorting modes.  

The server can then aggregate all user focus objects, as they change, and analyze their attention dynamics.

 * **Keywords** (provided by the name field)
 * **Tags**
 * **Who** - selects by author
 * _TODO:_ **Where** - geolocation
 * _TODO:_ **When** - time range
 * **userRelation.itrust** - objects by those that I "trust"
 * **userRelation.trustme** - objects by those that "trust" me
 * ...

**See**: client/search.js

----

# Widgets

## Object Summary

## Object Editor

## Tag Selector

### Tree Tagger
### Wiki Tagger
### Emotion Tagger
### User Tagger
### Need Tagger
### URL Taggger
### Favorites Tagger

## Focus Editor

## Self Inventory

## Timeline

## Share View Object Summary

## Map Location Chooser

----

# Views

## Browse View

## Chat View

## Time  View

## Map View

## Self View

## Share View

## Trends View

## Templates View

## Wiki View

## Graph View

## Main Menu View
