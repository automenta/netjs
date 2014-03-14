//GENERAL.JS is a PLUGIN WHICH IS AUTOMATICALLY LOADED BY THE WEBSERVER

var lengthUnits = [ 'meter', 'foot', 'inch', 'mile' ];
var massUnits = [ 'kilogram', 'pound', 'ounce' ];
var currencyUnits = [ 'Bitcoin', 'USDollar', 'Euro', 'Gold(g)', 'Silver(g)' ];
    //http://www.therichest.org/business/most-traded-currencies/

var generalTags = [
    {uri: 'Resource', name: 'Resource', description: 'Something that may be used or applied'},

    {uri: 'Concept', name: 'Concept', description: 'An abstract concept' },

    {uri: 'Action', name: 'Action', //combined Event into this one..
		description: 'Something that may be accomplished',
        properties: {
            'active': {name: 'Active', type: 'boolean'},
            'startsAt': {name: 'Starts At', type: 'text' /*datetime*/},
            'stopsAt': {name: 'Stops At', type: 'text' /*datetime*/},
            'maxAttendance': {name: 'Maximum Attendance', type: 'integer' /*datetime*/}
            //Inviting (person)
            //Completed?
            //RSVP by
            //Reason (why)
            //Needs Volunteers?
            /*
             Are you about to take a big decision? How do you know it's the right one? Here are the five tests:
             The Eternal Recurrence Test - this thing you are about to do: if you had to watch yourself performing this action an infinite number of times, would you still go ahead? If so, do it. If not, don't.
             The Movie Of Your Life Test - this thing you are about to do: would you want it to be in the movie of your life, the scenes that show you at your very best? If so, do it. If not, don't.
             The Gravestone Test - this thing you are about to do: would you want it recorded on your gravestone after your death? If so, do it. If not, don't.
             The Mirror Test - this thing you are about to do: will you be able to look at yourself in the mirror afterwards and feel proud of what you have done? If so, do it. If not, don't.
             The Others Test - this thing you are about to do: will you be happy for others to know all about it? If so, do it. If not, don't.
             */

        }
    },

    {uri: 'Imaginary', name: 'Imaginary', description: 'Something imaginary, indefinite values.', 
        properties: {
            'involvesUser': { name: 'Involves', type: 'object' }
        }
	},

    //Being superclass of Human..
    //TODO "Contact Schema": http://portablecontacts.net/draft-spec.html#schema   
    {uri: 'Human', name: 'Human',
        properties: {
            'currentRole': {name: 'Current Role', type: 'text'},
            'biography': {name: 'Biography', type: 'textarea'},
            'birthdate': {name: 'Birthdate', type: 'timepoint'},
            //age: { name: 'Age', type: 'function', value: function(x) { return = now - getProperty(x, 'birthdate').val() ... } }

            'male': {name: 'Male', type: 'boolean'},
            'female': {name: 'Female', type: 'boolean'},
            'email': {name: 'E-Mail', type: 'text'},
            'friend': {name: 'Friend', type: 'object'},
            'trusts': {name: 'Trusts', type: 'object'},
            'parent': {name: 'Parent', type: 'object', tag: ['Human']}

            /*
             <select name="ext_sel[]" id="ext_sel2">  <option value="" selected="selected">select 3rd filter...</option>  <option value="languages">Spoken languages</option>  <option value="body">Body type</option>  <option value="height">Height</option>  <option value="weight">Weight</option>  <option value="hair">Hair color</option>  <option value="eyes">Eye color</option>  <option value="sexuality">Sexuality</option>  <option value="relationship">Status</option>  <option value="children">Children</option>  <option value="education">Education</option>  <option value="star_sign">Star sign</option>  <option value="drinking">Drinking</option>  <option value="smoking">Smoking</option>  </select>
             */
        },
        //TODO synthesis of CouchSurfing + BeWelcome.org user profile fields
    },
    /*
     Adapted from: http://keimform.de/2010/commons-in-a-taxonomy-of-goods/ by Von Stefan Meretz
     Note: Renaming "Good" to "Resource"
     TODO: Add descriptions from explanations on that page
     
     Resource
     Origin: Natural | Produced
     Constitution: Material | Non-Material
     
     SocialOwnership: Commodity | Subsistence | Commons
     LegalOwnership: Private Property | Collective Property | Free Good
     
     Exclusivity and Rivalry?
     
     */

    {uri: 'Item', name: 'Item', //combined Event into this one..
        properties: {
            'count': {name: 'Count', type: 'integer'},
            'individualWeight': {name: 'Weight (individual)', type: 'real'},
            'color': {name: 'Color', type: 'text'}
        },
		tag: ['Resource']
    },
    {uri: 'Link', name: 'Link', description: 'A link or edge in a graph between vertices, nodes, URL\'s, or URI\'s',
        properties: {
            'touchObject': {name: 'Touch', type: 'object' },
            'visitURL': {name: 'Visit', type: 'url' }
        },
		tag: ['Concept']
    },
    {uri: 'Geometry', name: 'Geometry',
        properties: {
            'length': {name: 'Length', type: 'real', units: lengthUnits },
            'width': {name: 'Width', type: 'real', units: lengthUnits },
            'height': {name: 'Height', type: 'real', units: lengthUnits},
            'mass': {name: 'Mass', type: 'real', units: massUnits}
        },
		tag: ['Concept']
    },
    {uri: 'Physical', name: 'Physical',
        properties: {
/*
http://build.smartthings.com/smartapps-overview/#SmartAppCapabilities
Attribute Name	Read/Write	Data Type	Details/Comments
isPresent	Read	Boolean	Indicates that the device is currently connected and reported data.
ftemp	Read	Float	Temperature in Fahrenheit
ctemp	Read	Float	Temperature in Celcius
X	Read	Float	Accelerometer X-Axis Value
Y	Read	Float	Accelerometer Y-Axis Value
Z	Read	Float	Accelerometer Z-Axis Value
reportTemp	Read/Write	Boolean	Used to tell the SmartTag to report or not to report temperature data
reportAccelerometer	Read/Write	Boolean	Used to tell the SmartTag to report or not to report accelerometer data
reportPresence	Read/Write	Boolean	Used to tell the SmartTag to report or not to report presence data
reportInterval	Read/Write	Integer	The reporting interface in seconds. Minimum value is 5 seconds.
tempDelta	Read/Write	Float	Defines the min change in temperature value that will result in an temperatureChanged event
accelerometerData	Read/Write	Float	Defines the min change in any accelerometer axis that will result in an accelerometerChanged event
reportOnlyChanges	Read/Write	Boolean	Used to tell the SmartHub/SmartTag only to report when data (attributes) have changed. This can be combined with the ‘reportMinimumInterval’ attribute to force a report every N seconds even if nothing has changed.
reportMinimumInterval	Read/Write	Integer	Used to tell the SmartHub/SmartTag to report every N seconds even if nothing has changed. Not used unless ‘reportOnlyChanges’ is true.
The SmartTag also generates events to the SmartThings Cloud. The following events are currently supported:

--Voltage

Event Name	Event Description
presenceDetected	Raised when SmartTag presence changes from “not present” to “present”
presenceLost	Raised when SmartTag presence changes from “present” to “not present”
presenceChange	Raised in either of the above two cases. Event attributes allow the developer to understand the details.
temperatureChanged	Raised when the temperature value changes by more than a preset amount. See capabiliites.
temperatureReport	Raised every time the device reports its current temperature
accelerometerChanged	Raised when the X, Y, or Z values of the accelerometer change by more than a preset amount. See capabilities.
accelerometerReport	Raised every time the device reports its current accelerometer values.
*/
		},
		tag: ['Concept']
    },


    {uri: 'Value', name: 'Value',
        properties: {
            'moneyAmount': {name: 'Money Amount', type: 'real', default: 0, units: currencyUnits },
            'quantity': {name: 'Quantity', type: 'integer', default: 0 },
            'quantityUnit': {name: 'Quantity Unit', type: 'string' },
            'quality': {name: 'Quality', type: 'text'},
            'offerExpires': {name: 'Offer Expires', type: 'timepoint' },
            'itemExpires': {name: 'Item Expires', type: 'timepoint' },
            'walletBTC': {name: 'Bitcoin Wallet', type: 'text'},
            'walletRipple': {name: 'Ripple Wallet', type: 'text'},
            'walletPayPal': {name: 'PayPal Address', type: 'text'},
            'walletRTN': {name: 'Bank Account', type: 'text'}, //http://en.wikipedia.org/wiki/Routing_transit_number
        },
		tag: ['Concept']
    },
    {uri: 'Contract', name: 'Contract',
        properties: {
            //http://www.therichest.org/business/most-traded-currencies/
            'transactionPaid': {name: 'Paid', type: 'boolean'},
            'transactionDue': {name: 'Due', type: 'boolean'},
            'transactionGratis': {name: 'Gratis', type: 'boolean'}

            //http://troco.ourproject.org/
            //'valueGiven'
            //'recipient'
            //'valuePromisedReturn'
            //'due' (date)
            //'transactionStatus' [ ... ]
            //public enum TrocoKey {
            //   ISSUER, ISSUER_ID, ISSUER_BTN, ISSUER_IMG, RECPT, RECPT_ID, RECPT_BTN, RECPT_IMG, GIVE_VALUE, OTHER_VALUE, SAME_VALUE, BEFORE_DATE, SIGN_BTN, STATUS, ISSUER_SIGNED, RECPT_SIGNED, REDEEMED, REDEEM_BTN, ISSUER_GPGAUTH, RECPT_GPGAUTH, ISSUER_GPGSIGN, RECPT_GPGSIGN

        },
		tag: ['Concept']
    },

    {uri: 'Media', name: 'Media', description: 'A multimedia object', tag: ['Resource'] }, //params: contentType
    //goodPartStartsAt: (time)

    {uri: 'Report', name: 'Report',	tag: ['Resource']	}, //Report=Incident
    //NewsSourceLink (url)
    //see: Ushahidi.com

    {uri: 'Arrive', name: 'Arrive', tag: ['Action'] },
    {uri: 'Depart', name: 'Depart', tag: ['Action']},

    {uri: 'Problem', name: 'Problem', tag: ['Concept'], 
		properties: {
			'problemBlame': { name: 'Blame', description: 'Who or what is blamed', type: 'object' }
		}
	}, //=Question     //blame : who

    {uri: 'Solution', name: 'Solution', tag: ['Concept']}, //=Answer

    {uri: 'Cause', name: 'Cause', tag: ['Concept']},
    {uri: 'Effect', name: 'Effect', tag: ['Concept']},
    {uri: 'Internet', name: 'Internet', tag: ['Resource']},
    {uri: 'Goal', name: 'Goal',
        properties: {
            /*'repeatPeriod': {name: 'Repeat period (sec)', type: 'real', unit: 'time'},
            'repeatDelay': {name: 'Repeat phase (sec)', type: 'real', unit: 'time'},
            'repeatStarted': {name: 'Repeat started', type: 'timepoint', readonly: true},*/
			//'goalAlert': { name: 'Alert', type: 'text', default: 'at [time/date] -or- every X [minutes|hours|days|weeks] at [time/date]'},
            'requiresAcknowledgement': {name: 'Require Acknowledgement', type: 'boolean'},
            'lastAcknowledgement': {name: 'Repeat started', type: 'timepoint', readonly: true},
            'goalEnabled': {name: 'Enabled', type: 'boolean', default: true}
        },
		tag: ['Concept']
    }, //=Project=Program=Plan=Opportunity

	{uri: 'GoalCentroid', name: 'Possible Goal', tag: [ 'Goal', 'Imaginary' ]},

    //state = considered|desired|active|completed

    {uri: 'Favorite', name: 'Favorite', tag: ['Concept']},

    {uri: 'User', name: 'User', tag: ['Resource']},
    //{ uri: 'Netention', name: 'Netention'}, //Netention itself, meta 

    {uri: 'Message', name: 'Message', tag: ['Resource']},
    /*
     At the first gate, ask yourself, ‘Is it true?
     At the second ask, ‘Is it necessary?
     At the third gate ask ‘Is it kind?
     - Sufi saying -
     */

    {uri: 'Decision', name: 'Decision', tag: ['Concept']},
    //subtag of Action?

    //http://en.wikipedia.org/wiki/List_of_biases_in_judgment_and_decision_making

    //from LOOMIO:
    {uri: 'Decision.Agree', name: 'Agree', tag: ['Decision'],
        description: 'You are happy with the proposal.'
    },
    {uri: 'Decision.Abstain', name: 'Abstain', tag: ['Decision'],
        description: 'You are unsure, or you’re happy for the group to decide without you.'
    },
    {uri: 'Decision.Disagree', name: 'Disagree', tag: ['Decision'],
        description: 'You think there might be a better alternative, but you’re willing to go with the group.'
    },
    {uri: 'Decision.Block', name: 'Block', tag: ['Decision'],
        description: 'You have serious objections and you’ll be extremely unhappy if this proposal goes ahead.'
    },
    
    //{uri: 'Social', name: 'Social', tag: ['Concept'], properties: {       }},
    //{uri: 'Friend', name: 'Friend', tag: ['Social'], operator: true},
    //{uri: 'Enemy', name: 'Enemy', tag: ['Social'], operator: true},
    
    {uri: 'Know', name: 'Know', properties: {
            'knowledge': {name: 'Knowledge', type: 'object'}
       },
		tag: ['Action']
	},


    {uri: 'Access', name: 'Access', tag: ['Concept'] },

    {uri: 'Can', name: 'Can', tag: ['Access'], operator: true, icon: '/icon/can.png'},

    {uri: 'Need', name: 'Need', tag: ['Access'], operator: true, icon: '/icon/need.png', properties: {
        'repeatNeed': {name: 'Repeat', type: 'timerepeat' },
    }},
    {uri: 'Not', name: 'Not', tag: ['Concept'], icon: '/icon/not.png', operator: true},
        
    //NEEDS from SparkRelief
    {uri: 'Volunteer', name: 'Volunteer', tag: ['Resource']},
    {uri: 'Shelter', name: 'Shelter', tag: ['Resource']},
    {uri: 'Food', name: 'Food', tag: ['Resource']},
    {uri: 'Tools', name: 'Tools', tag: ['Resource']},
    {uri: 'Health', name: 'Health', tag: ['Resource']},
    {uri: 'Transport', name: 'Transport', tag: ['Resource']},
    {uri: 'Service', name: 'Service', tag: ['Resource']},
    {uri: 'Animal', name: 'Animal', tag: ['Resource']},
    {uri: 'Infrastructure', name: 'Infrastructure', tag: ['Resource']},

    {uri: 'Nature', name: 'Nature', tag: ['Resource']},
    {uri: 'Danger', name: 'Danger', tag: ['Resource']},
    {uri: 'Plugin', name: 'Plugin', tag: ['Resource'], properties: {
		'Plugin.enable': { name: 'Enable', type: 'boolean', max: 1 },
		'Plugin.updateEvery': { name: 'Update Every (sec)', type: 'real', max: 1 }
	}},

	/*    
    {uri: 'PDF', name: 'PDF Slide', properties: {
            'pdfURL': {name: 'PDF URL', type: 'text'},
            'slideNumber': {name: 'Slide', type: 'integer', min: 1, incremental: true}
        }, tag: ['Media'] },
	*/

    //Pledge = Promise
    {uri: 'Promise', name: 'Promise',
        description: "Promise or an Offer. 'I will do it, but only if you will help.'", //PledgeBank.com
		tag: ['Concept']
    },
    {uri: 'Tag', name: 'Tag',
        description: "Indicates that an object defines a tag",
        properties: {
            'tagValueType': {name: 'Value Type', type: 'text'},
            //'tagDomain': { name: 'Domain', type: 'text' }
        },
		tag: ['Concept']
    },

    {uri: 'Earth', name: 'Earth', description: '', icon: 'icon/earth.png' },

	//http://gis.stackexchange.com/questions/6345/list-of-available-online-wms-services-weather-land-data-place-names
	{
      "uri": "Points of Interest",
      "name": "Points of Interest",
      "description": "DBPedia.org",
      "icon": "http:\/\/climateviewer.com\/gallery\/lightning_bolt.png",
      "dbpediaLayer": true,
  	  tag: ['Earth']
    },

    {uri: 'United_States', name: 'United States', description: '', icon: 'icon/earth.png', tag: ['Earth'] },

	{
      "uri": "iem-us-nexrad",
      "name": "United States NEXRAD Weather",
      "description": "Weather data © 2012 IEM Nexrad",
      "defaultStrength": 0.75,
      "wmsLayer": {
		url: "http://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi",
		layer: 'nexrad-n0r-900913'
	  },
  	  tag: ['United_States']
    },
	//http://mesonet.agron.iastate.edu/GIS/goes.phtml
	//http://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi?VER=1.1.1&SERVICE=WMS&REQUEST=GetCapabilities
	//http://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_vis.cgi?VER=1.1.1&SERVICE=WMS&REQUEST=GetCapabilities
	{
      "uri": "conus_ir",
      "name": "CONUS Infrared",
      "description": "MesoNet - Iowa State",
      "defaultStrength": 0.75,
      "wmsLayer": {
		url: "http://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_ir.cgi",
		layer: 'ir_4km_900913'
	  },
  	  tag: ['United_States']
    },
	{
      "uri": "conus_vis",
      "name": "CONUS VIS",
      "description": "MesoNet - Iowa State",
      "defaultStrength": 0.75,
      "wmsLayer": {
		url: "http://mesonet.agron.iastate.edu/cgi-bin/wms/goes/conus_vis.cgi",
		layer: 'vis_1km_900913'
	  },
  	  tag: ['United_States']
    },
	{
      "uri": "mrms_q3_24h_precipitation",
      "name": "24h Precipitation",
      "description": "MesoNet - Iowa State",
      "defaultStrength": 0.75,
      "wmsLayer": {
		url: "http://mesonet.agron.iastate.edu/cgi-bin/wms/us/mrms.cgi?",
		layer: 'mrms_p24h' //mrms_p1h
	  },
  	  tag: ['United_States']
    },
	/*{
      "uri": "flood_total_economic_loss_risk",
      "name": "Flood Total Economic Loss Risk",
      "description": "Columbia University",
      "defaultStrength": 0.75,
      "wmsLayer": {
//http://sedac.ciesin.columbia.edu/geoserver/gwc/service/wms?LAYERS=ndh-flood-total-economic-loss-risk-deciles%3Adefault&FORMAT=image%2Fpng&TRANSPARENT=TRUE&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&STYLES=&SRS=EPSG%3A4326&BBOX=33.512055159416,-47.297588968117,76.2144661913,-4.5951779362334&WIDTH=256&HEIGHT=256
//http://sedac.ciesin.columbia.edu/geoserver/gwc/service/wms?&SERVICE=WMS&REQUEST=GetMap&VERSION=1.1.1&LAYERS=ndh-flood-total-economic-loss-risk-deciles%3Adefault&STYLES=&FORMAT=image%2Fpng&TRANSPARENT=true&HEIGHT=256&WIDTH=256&SRS=EPSG%3A4326&BBOX=-79.62890625,40.17887331434696,-79.453125,40.3130432088809
		url: "http://sedac.ciesin.columbia.edu/geoserver/gwc/service/wms?",
		layer: 'ndh-flood-total-economic-loss-risk-deciles:default',
		crs: 'EPSG4326'
	  },
  	  tag: ['Earth']
    },*/
	{
      "uri": "terrain-satellite",
      "name": "Satellite",
      "description": "Esri \/ DeLorme",
      "defaultStrength": 0.75,
      "tileLayer": "http:\/\/server.arcgisonline.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/{z}\/{y}\/{x}",
  	  tag: ['Earth']
    },
    {
      "uri": "terrain-contour",
      "name": "Contour",
      "description": "Esri \/ DeLorme",
      "defaultStrength": 0.75,
	  "tileLayer": "http://services.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}?blankTile=false",
      //"tileLayer": "http:\/\/server.arcgisonline.com\/ArcGIS\/rest\/services\/Specialty\/DeLorme_World_Base_Map\/MapServer\/tile\/{z}\/{y}\/{x}",
  	  tag: ['Earth']
    },
    {
      "uri": "cycle-map",
      "name": "Cycle Map",
      "description": "OpenCycleMap.org",
      "defaultStrength": 0.75,
	  "tileLayer": "http://{s}.tile.opencyclemap.org/cycle/{z}/{x}/{y}.png",
  	  tag: ['Earth']
    },    {
      "uri": "terrain-ocean",
      "name": "Ocean Floor",
      "description": "Esri \/ GEBCO, NOAA, CHS, OSU, UNH, CSUMB, National Geographic, DeLorme, NAVTEQ, and Esri",
      "defaultStrength": 0.75,
      "tileLayer": "http:\/\/services.arcgisonline.com\/ArcGIS\/rest\/services\/Ocean_Basemap\/MapServer\/tile\/{z}\/{y}\/{x}",
  	  tag: ['Earth']
    },
    /*{
      "uri": "Weather",
      "name": "Weather",
      "description": "",
      "icon": "http:\/\/climateviewer.com\/gallery\/nws_google.gif"
  	  tag: ['Map']
    },*/
    {
      "uri": "owm-clouds",
      "name": "Clouds",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/clouds\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-precipitation",
      "name": "Precipitation",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/precipitation\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-rain",
      "name": "Rain",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/rain\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-pressure",
      "name": "Pressure",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/pressure\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-pressure_cntr",
      "name": "Pressure Contour",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/pressure_cntr\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-wind",
      "name": "Wind",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/wind\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-temp",
      "name": "Temperature",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/temp\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    },
    {
      "uri": "owm-snow",
      "name": "Snow",
      "description": "OpenWeatherMap.org",
      "defaultStrength": 0.5,
      "tileLayer": "http:\/\/{s}.tile.openweathermap.org\/map\/snow\/{z}\/{x}\/{y}.png",
  	  tag: ['Earth']
    }

];

//http://bioportal.bioontology.org/ontologies/MFOEM?p=classes
var emotionTags = [
	{ uri: 'Emotion', name: 'Emotion', tag: ['Concept'] },

    { uri: 'Emotion.calm', name: 'Calm', tag: ['Emotion'] }, //neutral
    
    //
	{ uri: 'Emotion.happy', name: 'Happy', tag: ['Emotion'] },
	{ uri: 'Emotion.trusting', name:'Trusting', tag: ['Emotion']},
	{ uri: 'Emotion.anticipating', name: 'Anticipating', tag: ['Emotion']},
	{ uri: 'Emotion.surprised', name:'Surprised', tag: ['Emotion']}, 
	
    //[abstract NEGATIVE supertype]
	/*
	"NEGATIVE EVENT" CBT Questions that Can Be Stored as Properties
	 
	Help decide whether the meanings you give to a negative event cause disturbance by answering:

		Is the meaning I’m assigning to this event unduly extreme? 
		Am I exaggerating a simple event to derive harsh conclusions from it?
		Am I drawing global conclusions from this isolated event? 
		Am I deciding that this specific event totally defines me? 
		Am I deciding that this specific event affects my future?
		
		Does this meaning lead me to feel better or worse about myself? 
		Is it encouraging further goal-directed action or discouraging me to give up?

	If answers to these questions are largely ‘yes’, 
	then you probably are disturbing yourself unnecessarily about a negative event. 

	The situation may in fact be negative – but your thinking may be worsening it.
	*/	
    { uri: 'Emotion.sad', name: 'Sad', properties: {
        'undulyExtremeMeaning': { name: 'Is the meaning I’m assigning to this event unduly extreme?', type: 'textarea' },
        'harshConclusions': { name: 'Am I exaggerating a simple event to derive harsh conclusions from it?', type: 'textarea' }
        //...
	}, tag: ['Emotion']},
    
	{ uri: 'Emotion.afraid', name: 'Afraid', tag: ['Emotion']},
	{ uri: 'Emotion.angry', name: 'Angry', tag: ['Emotion']},
	{ uri: 'Emotion.disgusted', name: 'Disgusted', tag: ['Emotion']},

    { uri: 'Emotion.tired', name: 'Tired', tag: ['Emotion'] },
    { uri: 'Emotion.energized', name: 'Energized', tag: ['Emotion'] }

	/*CBT thought record: 
		http://www.psychologytools.org/assets/files/Worksheets/CBT_Thought_Record.pdf

		Where were you (geolocation)
		Emotion (above tags)
		Negative automatic thought
		Evidence that supports the thought
		Evidence that does not support the thought
		Alternative Thought
		Desired emotion or feeling
	*/
	/*
	Other CBT worksheets:
		http://www.psychologytools.org/cbt.html
	*/
];

exports.plugin = function($N) { return {
    name: 'General',
    description: 'General Tags',
    options: {},
    version: '1.0',
    author: 'http://netention.org',

    start: function() {
        $N.addTags(generalTags);
        $N.addTags(emotionTags);

		if ($N.client.knowLevels == 6) {
			$N.addTags([
				/* 0 – No Knowledge, 1- Training / Knowledge Only, 2 – Ability to work with support of seniors, 
				 3 – Can independently work, 4 – Confidently Lead and Guide others, 5 – Professional Expert / Certified. */
			    { uri: 'Learn', name: 'Learn', tag: ['Know'], operator:true, icon: 'icon/know/k1.png' },
				{ uri: 'LearnDo', name: 'Learn Do', tag: ['Know'], operator:true, icon: 'icon/know/k2.png' },
				{ uri: 'DoLearn', name: 'Do Learn', tag: ['Know'], operator:true, icon: 'icon/know/k3.png' },
				//{ uri: 'Collaborating', name: 'Collaborating', tag: ['Know'] },
				{ uri: 'DoTeach', name: 'Do Teach', tag: ['Know'], operator:true, icon: 'icon/know/k4.png' },
				{ uri: 'TeachDo', name: 'Teach Do', tag: ['Know'], operator:true, icon: 'icon/know/k5.png' },
				{ uri: 'Teach', name: 'Teach', tag: ['Know'], operator:true, icon: 'icon/know/k6.png' },

			]);
		}
		else {
			$N.addTags([
				{uri: 'Learn', name: 'Learn', tag: ['Know'], operator: true,
					description: 'No knowledge but curious to learn' },
				{uri: 'DoLearn', name: 'DoLearn', tag: ['Know'], operator: true,
					description: 'Some knowledge and willing to learn more while collaborating' },
				{uri: 'Do', name: 'Do', tag: ['Know'], operator: true,
					description: 'Can independently work' },
				{uri: 'DoTeach', name: 'DoTeach', tag: ['Know'], operator: true,
					description: 'Independently able to work and can teach or train' },
				{uri: 'Teach', name: 'Teach', tag: ['Know'], operator: true,
					description: 'Has expert knowledge and is most useful in teaching others' }
			]);
		}

        /*function indexPDF(name, path) {
            var introPresentation = util.objNew(path, name);
            introPresentation.add('PDF');
            introPresentation.add('pdfURL', path);
            introPresentation.add('slideNumber', 1);
            netention.pub(introPresentation);
        }
        //indexPDF('Spacetime-Tag Planning', 'doc/netention_spacetime_tag_planning.pdf');
        //indexPDF('Netention Theory', 'doc/seh_netention_intro.pdf');
		*/

    }

}; };
