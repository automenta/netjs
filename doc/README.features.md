
**License:** 100% Open-Source Software - WTFPL / MIT License

# Components
**100% Javascript** Client & Server for ubiquity, simplicity, and ease
* **Client**: HTML5/Javascript
 * [javascript client libraries, see [client/index.html](../client/index.html)]
* **Server**: Node.JS
 * [npm's: see [package.json](../package.json)]
 * **Databases**
    * **MongoDB** - Native NoSQL Database
    * _TODO:_ support other databases

----

# Web Server
Designed to serve clients and connect to other servers and services to form an organic, decentralized P2P network of semantically relevant data exchange.
 * **HTTP AJAJ REST API** (_Express framework_)
 * **WebSockets API** (_socket.io_)
   * Real-time server push
 * **Static content** (HTML, JS, CSS, images, etc...) served for client applications 
 * **Multiple Identities** - each account contains one or more identities
  * Automatically creates default identity on first login
  * Create new identities
  * Delete identities
  * Switch between identities ('become')
  * Logout
 * **Public access** (no authentication, optionally disabled)
  *  Login link available
 * **Anonymous access** (optionally disabled)
   * One-click entry: No password or credentials
   * All anonymous users share a set of Selves
 * **Authentication access** (_Passport.js_)
   * E-Mail/Password
   * OpenID
   * Google Accounts
   * Facebook
   * _TODO:_ Twitter
 * **Site-wide password** (HTTP Basic authentication, optional)
 * **User Objects** - Create, edit, remove, and publish
 * **Uploaded files** - stored and served
 * **Sharing scopes**
  * Private - only accessible by author
  * Trusted - only accessible by those "trusted" by author
  * Public - accessible by all
  * Anonymous - public, missing author information
 * **Configuration**
  * options.js file
  * _TODO:_ online configuration for administrator
 * **Plugin** activation & deactivation
 * **RSS Feed** Outputs

----

# Web Client (HTML5/JS)
 * **Dynamically Generated HTML Widgets** - jQuery + jQueryUI
 * **Responsive layout** for Desktop and Mobile
 * **Browser compatibility**
   * Chrome
   * Firefox
   * Android
 * **Views** which can be enabled or disabled in site configuration
 * **Themes**
   * Default theme specified in client configuration
   * Selectable by users
 * **Rebrand-able** in all aspects
 * **Local (offline) mode**, operating without server
  * Only needs the contents of client/* placed on a web-server
  * Offline configuration: client_configuration.js
  * Offline static ontology: ontology.static.json
  * Loads statically provided objects from HTTP
  * Stores objects in localStorage
  * Additional functionality via PHP scripts
 * **Focus** selects semantically relevant objects
 * **Hotkeys** and **Voice Input**

----

# Ontology
Collection of **Tags** providing a common semantic vocabulary for describing reality and imagination.  A default ontology is provided by the server for clients to use.

 * **id** (Uniform Resource Identifier)
 * **name**
 * **description** (optional)
   * Used along with Name to match keywords for auto-suggesting tags while editing objects
 * **extend** - Array of (zero or more) super-tags that they inherit from, forming a **type hierarchy**
 * **reserved** (optional) - prevents use by users
 * **icon** (optional) - relative URL to an icon image                         
 * **properties** - Set of (zero or more) data-typed properties for which values may be specified
   * **id**
   * **name**
   * **description** (optional)
   * **extend** - string, extends one primitive data type; analogous to MIME Content-type
        * **boolean**
        * **integer**
        * **real** (floating point number)
            * unit (optional: string array of measurement units)
            * _TODO:_ precision (optional: integer, number decimals)
            * _TODO:_ minValue, maxValue (optional: float)
            * _TODO:_ mode (optional: "numeric"|"slider"|"spinner"; slider available if minValue and maxValue specified)
            * _TODO:_ increment (optional: float)
        * **url** (URL string)
            * _TODO:_ iframe (boolean, width, height)
        * **text** (string)
        * **html** (multiline HTML string)
        * **image** (images)
        * **markdown** (markdown content, renderable to HTML)
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
        * _TODO:_ **timerange** (start and stop timepoints, which may be -Inf,+Inf)
        * _TODO:_ **timeduration** (integer, in milliseconds)
        * **sketch** (vector drawing)
        * **object** (reference to another object)
            * _TODO_: tag restrictions (optional)
        * **timeseries** (timeseries data, multiple keyed values per time index)
        * **tagcloud** (set of weighted tags, index ->  strength)
        * _TODO:_ **select**
            * options (string array)
            * min, max (integer, number that can be selected)
            
   * **default** (optional) - default value
   * **min** (optional) - integer of minimum allowed instances (arity)
   * **max** (optional) - integer of maximum allowed instances (arity)
   * **readonly** (optional) - prevents editing

_TODO:_ The data values for certain types may be interpreted according to the mode of the object: whether it is real or imaginary.  Imaginary descriptions allow one to use boolean expressions (indefinite descriptions) to describe aspects of an ideal or desired reality that can be matched with constant values (definite descriptions) pertaining to real (factual) objects.

----

# Object
A **netention object**, or simply "**nobject**",  semantically expresses a discrete unit of thought and all its related quantifiable and qualifiable characteristics, along with metadata describing provenance information.  

They are canonically serializable as **JSON** objects which is a compact representation readily manipulated by Javascript, most programming languages (via libraries), and certain NoSQL databases.
 * **id** - URI of this object; typically a randomly generated UUID
 * **name** - string representing a title or subject-line
 * **author** - ID of the author
 * **subject** - ID of who or what the object describes
 * **createdAt** - unix time this object was created
 * **modifiedAt** - unix time this object was last modified.  if not present, assumed to be the same as createdAt
 * **focus** - indicates if object is a focus change
 * **expiresAt** - unix time by which this object should be automatically removed
 * **removed** - indicates that any instances of an object with this ID should be deleted (used for broadcasting deletion)
 * **hidden** - indicates the object should not ordinarily be displayed in lists and feeds
 * **scope** - integer indicating the sharing/privacy level (see ObjScope constants in util.js)
 * **value** - array of value entries (for preserving their order)
   * **id** - URI of the tag this represents, or the property this provides a value for
   * **value** - object representing the data value (not used if id refers to a tag)
   * **strength** - value from 0 to 100% (0.0 to 1.0) indicating the relative strength or weight of this value in relation to other values in this object
 * **in** - embedded object indexed by ID's of objects forming directed edge **to**; the value is the edge's associated value (can be numeric, representing its strength or an object)
 * **out** - embedded object indexed by ID's of objects forming directed edge **from**
 * **with** - embedded object indexed by ID's of objects forming undirected edge **with**

----

# Focus
A **focus** describes what one is thinking about or interested in.  It functions as a semantic analog-to-digital converter for expressing one’s mental state in a machine-readable data structure.  A focus may be used to compare relevancy with known data objects in order to filter and data, or to create a new (prototype) data object (which may be stored for future use and/or shared with others).

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
Widgets are dynamically generated HTML5 user-interface components that are utilized repeatedly by views and other widgets.

## Avatar Menu
Provides access to views, identity manipulation, display of the current focus, common actions (such as creating a new object), and additional controls specific to, and added by the current view.  It can be minimized and maximized by clicking the avatar square (displaying the current user's avatar icon).

## Object Summary
### Metadata Line

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

## Action Menu

----

# Views
A View is a particular mode of interacting with the client user-interface.  One view is active at any time (support for views containing multiple embedded views will be eventually possible).  Changes to the client's identity, focus, or memory can trigger a view to refresh, unless the **view lock** (_TODO_) is active.

## Browse View
 * List
 * Grid
 * Slides
 * _TODO:_ Table

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

## Plugin View
__TODO:__ Should only be used and accessible by administrators because it affects all users.

----

# Actions
Actions are client-side operations that may be invoked on a set of zero or more selected objects.  Their relevance is determined contextually; certain operations pertain to certain kinds and amounts of objects.  Changing the selection set updates the set of possible actions.

__See:__ client/actions.js

----
# Server Plugins
Server plugins provide server-side functionality, such as:
 * Enhancing the ontology with extra tags and properties
 * Importing or generating data from remote systems
 * Exporting data to remote systems
 * Modifying data
 * Triggering actions

Each plugin can be activated and deactivated during run-time, with a list of plugins to automatically activate on startup specified in options.js.  A plugin exposes a standard interface that provides it with access to server functionality and allows the server to call the event handlers it defines.

----

# Connections
_TODO:_ Connections provide information and actions about how the client and/or server interface with remote systems.

In **Local** mode, they provide ways for the offline client to connect to remote systems.

----

# Server Configuration
The server configuration (**options.js**) specifies all information necessary for the server to start.  It also includes the client configuration which is served to the client.

See **options.js.EXAMPLE** for notes about each configuration option.

----

# Client Configuration
In **WebSocket** mode, the client configuration is provided by the client section of the server's configuration in **options.js**

In **Local** mode, the client configuration is provided by **client/client_configuration.js**

----
# Utility API
A set of functions shared by both the client and server systems.  Includes functions for inspecting and manipulating nobjects.

See: **client/util.h**

----

# Client API
The **$N** global object provides an interface to all client functionality:
 * Connection and Disconnection
 * Publishing, updating, deleting, and retrieving objects
 * Becoming Selves
 * Accessing and changing configuration data
 * ...


----

# Server API
The server object, referenced by **$N** (separate and different from the client's $N) provides an interface to all server functionality:
 * Publishing, updating, deleting, and retrieving objects
 * Adding URL handlers
 * Accessing and changing configuration data
 * ...

----

# Server HTTP API

----

# Server WebSockets API
...
