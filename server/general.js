//GENERAL.JS is a PLUGIN WHICH IS AUTOMATICALLY LOADED BY THE WEBSERVER

var lengthUnits = ['meter', 'foot', 'inch', 'mile'];
var massUnits = ['kilogram', 'pound', 'ounce'];
var currencyUnits = ['Bitcoin', 'USDollar', 'Euro', 'Gold(g)', 'Silver(g)'];
//http://www.therichest.org/business/most-traded-currencies/

var generalTags = [
    {uri: 'Resource', name: 'Resource', description: 'Something that may be used or applied'},
    {uri: 'Concept', name: 'Concept', description: 'An abstract concept'},
    {uri: 'Action', name: 'Action', //combined Event into this one..
        description: 'An action or event that may be accomplished or attended',
        properties: {
            'active': {name: 'Active', type: 'boolean'},
            'startsAt': {name: 'Starts At', type: 'text' /*datetime*/},
            'stopsAt': {name: 'Stops At', type: 'text' /*datetime*/},
            'maxAttendance': {name: 'Maximum Attendance', type: 'integer' /*datetime*/}
            //Inviting (person)
            //Invitation (text)
            //Completed?
            //RSVP by
            //Reason (why)
            //Needs Volunteers?
            //Attendees
            //Agenda/Plan
            //Log

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
            'involvesUser': {name: 'Involves', type: 'object'}
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
            //'friend': {name: 'Friend', type: 'object'},
            //'parent': {name: 'Parent', type: 'object', tag: ['Human']}

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

    {uri: 'Item', name: 'Item',
        properties: {
            'purpose': {name: 'Purpose', type: 'textarea'},
            'quantity': {name: 'Quantity', type: 'integer'},
            //'stockCount': {name: 'Stock Count', type: 'integer'},
            'individualWeight': {name: 'Weight (individual)', type: 'real'},
            'color': {name: 'Color', type: 'text'},
            'itemCost': {name: 'Cost', type: 'real', default: 0, units: currencyUnits},
            'quantityUnit': {name: 'Quantity Unit', type: 'string'},
            'quantityPerTime': {name: 'Quantity per Day', type: 'real'},
            'quality': {name: 'Quality', type: 'text'},
            'offerExpires': {name: 'Offer Expires', type: 'timepoint'},
            'itemExpires': {name: 'Expires', type: 'timepoint'},
            'itemPaid': {name: 'Paid', type: 'boolean'},
            'payWalletBTC': {name: 'Pay Bitcoin Wallet', type: 'text'},
            'payWalletRipple': {name: 'Pay Ripple Wallet', type: 'text'},
            'payWalletPayPal': {name: 'Pay PayPal Address', type: 'text'},
            'payWalletRTN': {name: 'Pay Bank Account (RTN)', type: 'text'} //http://en.wikipedia.org/wiki/Routing_transit_number

        },
        tag: ['Resource']
    },
    {uri: 'Link', name: 'Link', description: 'A link or edge in a graph between vertices, nodes, URL\'s, or URI\'s',
        properties: {
            'incidentObject': {name: 'Linking', type: 'object'}
            //'visitURL': {name: 'Visit', type: 'url' }
        },
        tag: ['Concept']
    },
    {uri: 'Geometry', name: 'Geometry',
        properties: {
            'length': {name: 'Length', type: 'real', units: lengthUnits},
            'width': {name: 'Width', type: 'real', units: lengthUnits},
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
    {uri: 'Media', name: 'Media', description: 'A multimedia object', tag: ['Resource']}, //params: contentType
    //goodPartStartsAt: (time)

    {uri: 'Report', name: 'Report', tag: ['Resource']}, //Report=Incident
    //NewsSourceLink (url)
    //see: Ushahidi.com

    {uri: '_Arrive', name: 'Arrive', tag: ['Action'],
        properties: {'arriveLocation': {name: 'Arrive location', type: 'spacepoint'}}
    },
    {uri: '_Depart', name: 'Depart', tag: ['Action'],
        properties: {'departLocation': {name: 'Depart location', type: 'spacepoint'}}
    },
    {uri: 'Problem', name: 'Problem', tag: ['Concept'],
        properties: {
            'problemBlame': {name: 'Blame', description: 'Who or what is blamed', type: 'object'}
        }
    }, //=Question     //blame : who

    {uri: 'Solution', name: 'Solution', tag: ['Concept']}, //=Answer

    {uri: 'Cause', name: 'Cause', tag: ['Concept']},
    {uri: 'Effect', name: 'Effect', tag: ['Concept']},
    {uri: 'Internet', name: 'Internet', tag: ['Resource']},
    /*
     {uri: 'Role', name: 'Role', description: 'A position, job, occupation, or role',
     properties: {
     'roleSalaryHour': {name: 'Salary (per hour)', type: 'real', units: currencyUnits },
     
     },
     tag: ['Concept']
     },
     */

    /*
     Idea
     how to improve
     time to implement
     status: Brainstorming, Pitched, Being Refined, Accepted, Complete
     */

    {uri: 'Goal', name: 'Goal', description: 'A goal, dream, project, program, plan, opportunity, or deliverable',
        properties: {
            /*'repeatPeriod': {name: 'Repeat period (sec)', type: 'real', unit: 'time'},
             'repeatDelay': {name: 'Repeat phase (sec)', type: 'real', unit: 'time'},
             'repeatStarted': {name: 'Repeat started', type: 'timepoint', readonly: true},*/
            //'goalAlert': { name: 'Alert', type: 'text', default: 'at [time/date] -or- every X [minutes|hours|days|weeks] at [time/date]'},
            'requiresAcknowledgement': {name: 'Require Acknowledgement', type: 'boolean'},
            'lastAcknowledgement': {name: 'Repeat started', type: 'timepoint', readonly: true},
            'goalEnabled': {name: 'Enabled', type: 'boolean', default: true},
            'goalDependency': {name: 'Depends On', type: 'object', tag: 'Goal'},
            'goalWorker': {name: 'Worker', type: 'object', tag: 'Human'},
            'goalProgress': {name: 'Progress', type: 'real', min: 0, max: 1, mode: 'slider'},
            'goalDeadline': {name: 'Deadline', type: 'timepoint', max: 1},
            'goalCost': {name: 'Cost', type: 'real', default: 0, units: currencyUnits},
            'goalBudgeted': {name: 'Budgeted', description: 'How much funding currently budgeted toward this', type: 'real', default: 0, units: currencyUnits},
            'goalObjective': {name: 'Objective', type: 'textarea', description: 'What to accomplish and how to measure progress'}

            //status: not started, planning, in progress, completed
        },
        tag: ['Concept']
    },
    {uri: 'GoalCentroid', name: 'Possible Goal', tag: ['Goal', 'Imaginary']},
    //state = considered|desired|active|completed

    {uri: 'Favorite', name: 'Favorite', tag: ['Concept']},
    {uri: 'User', name: 'User', tag: ['Resource'], reserved: true},
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
    {uri: 'Trust', name: 'Trust', properties: {
            'trusts': {name: 'in', type: 'object', tag: 'User', min: 1}
        },
        tag: ['Action'], operator: true, icon: '/icon/trade.png'},
    {uri: 'Distrust', name: 'Distrust', properties: {
            'distrusts': {name: 'in', type: 'object', tag: 'User', min: 1}
        },
        tag: ['Action'], operator: true},
    {uri: 'Value', name: 'Value', description: 'Represents valuing, preference, or having importance',
        properties: {
            'values': {name: 'in', type: 'object', min: 1}
        },
        tag: ['Action'], operator: true},
    {uri: 'Access', name: 'Access', tag: ['Concept']},
    {uri: 'Can', name: 'Can', tag: ['Access'], operator: true, icon: '/icon/can.png'},
    {uri: 'Need', name: 'Need', tag: ['Access'], operator: true, icon: '/icon/need.png', properties: {
            //'repeatNeed': {name: 'Repeat', type: 'timerepeat' },
        }},
    {uri: 'Not', name: 'Not', tag: ['Concept'], icon: '/icon/not.png', operator: true},
    {uri: 'Offer', name: 'Offer', tag: ['Can'], icon: '/icon/can.png'},
    {uri: 'Sell', name: 'Sell', tag: ['Can'], icon: '/icon/can.png'},
    {uri: 'Lend', name: 'Lend', tag: ['Can'], icon: '/icon/can.png'},
    {uri: 'Rent', name: 'Rent', tag: ['Can'], icon: '/icon/can.png'},
    {uri: 'Swap', name: 'Swap', tag: ['Can'], icon: '/icon/can.png'},
    {uri: 'GiveAway', name: 'Share', tag: ['Can'], icon: '/icon/can.png'},
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
            'Plugin.enable': {name: 'Enable', type: 'boolean', max: 1},
            'Plugin.updateEvery': {name: 'Update Every (sec)', type: 'real', max: 1}
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
    {uri: 'Template', name: 'Template',
        description: "Template object that can create instances of it",
        properties: {},
        tag: ['Concept']
    },
    {uri: 'Earth', name: 'Earth', description: '', icon: 'icon/earth.png'},
    //http://gis.stackexchange.com/questions/6345/list-of-available-online-wms-services-weather-land-data-place-names
    {
        "uri": "Points of Interest",
        "name": "Points of Interest",
        "description": "DBPedia.org",
        "icon": "http:\/\/climateviewer.com\/gallery\/lightning_bolt.png",
        "dbpediaLayer": true,
        tag: ['Earth']
    },
    {uri: 'United_States', name: 'United States', description: '', icon: 'icon/earth.png', tag: ['Earth']},
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
    }, {
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
    {uri: 'Emotion', name: 'Emotion', tag: ['Concept'], description: 'How something feels or seems',
        properties: {
            'undulyExtremeMeaning': {name: 'Is the meaning I’m assigning to this event unduly extreme?', type: 'textarea'},
            'harshConclusions': {name: 'Am I exaggerating a simple event to derive harsh conclusions from it?', type: 'textarea'},
            'drawingGlobalConclusions': {name: 'Am I drawing global conclusions from this isolated event?', type: 'textarea'},
            'decidingTotalDefinition': {name: 'Am I deciding that this specific event totally defines who it affects?', type: 'textarea'},
            'decidingAffectedFuture': {name: 'Am I deciding that this specific event affects the future of who it affects?', type: 'textarea'},
            'feelBetterOrWorse': {name: 'Does this meaning lead me to feel better or worse about myself?', type: 'textarea'},
            'furtherGoalAction': {name: 'Is it encouraging further goal-directed action or discouraging me to give up?', type: 'textarea'}
        }
    },
    {uri: 'Emotion.calm', name: 'Calm', tag: ['Emotion']}, //neutral


    {uri: 'Emotion.happy', name: 'Happy', tag: ['Emotion']},
    {uri: 'Emotion.trusting', name: 'Trusting', tag: ['Emotion']},
    {uri: 'Emotion.anticipating', name: 'Anticipating', tag: ['Emotion']},
    {uri: 'Emotion.surprised', name: 'Surprised', tag: ['Emotion']},
    {uri: 'Emotion.sad', name: 'Sad', properties: {}, tag: ['Emotion']},
    {uri: 'Emotion.afraid', name: 'Afraid', tag: ['Emotion']},
    {uri: 'Emotion.angry', name: 'Angry', tag: ['Emotion']},
    {uri: 'Emotion.disgusted', name: 'Disgusted', tag: ['Emotion']},
    {uri: 'Emotion.tired', name: 'Tired', tag: ['Emotion']},
    {uri: 'Emotion.energized', name: 'Energized', tag: ['Emotion']}
    //{ uri: 'Emotion.creative', name: 'Creative', tag: ['Emotion'] }

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

function getDefaultTemplates($N) {
    var x = [];

    {
        x.push($N.objNew('SomethingNeeded', 'Something Needed').addTag('Need'));
    }
    {
        var n = $N.objNew('TravelRoute', 'Route to Travel');
        n.addTag('Depart').add('departLocation', {});
        n.addTag('Arrive').add('arriveLocation', {});
        x.push(n);
    }
    {
        var n = $N.objNew('FeelingReport', 'How it Feels');
        n.addTag('Report');
        n.addTag('Emotion');
        n.tagSuggestions = $N.subtags('Emotion');
        x.push(n);
    }

    for (var i = 0; i < x.length; i++)
        x[i].addTag('Template');

    return x;
}

exports.plugin = function($N) {
    return {
        name: 'General',
        description: 'General Tags',
        options: {},
        version: '1.0',
        author: 'http://netention.org',
        start: function() {
            $N.addTags(generalTags);
            $N.addTags(emotionTags);

            if ($N.client.knowLevels == 3) {
                $N.addTags([
                    {uri: 'Learn', name: 'Learn', tag: ['Know'], operator: true, icon: 'icon/know/k1.png'},
                    {uri: 'Do', name: 'Do', tag: ['Know'], operator: true, icon: 'icon/know/k4.png'},
                    {uri: 'Teach', name: 'Teach', tag: ['Know'], operator: true, icon: 'icon/know/k5.png'}
                ]);
            }
            else if ($N.client.knowLevels == 6) {
                $N.addTags([
                    /* 0 – No Knowledge, 1- Training / Knowledge Only, 2 – Ability to work with support of seniors, 
                     3 – Can independently work, 4 – Confidently Lead and Guide others, 5 – Professional Expert / Certified. */
                    {uri: 'Learn', name: 'Learn', tag: ['Know'], operator: true, icon: 'icon/know/k1.png'},
                    {uri: 'LearnDo', name: 'Learn Do', tag: ['Know'], operator: true, icon: 'icon/know/k2.png'},
                    {uri: 'DoLearn', name: 'Do Learn', tag: ['Know'], operator: true, icon: 'icon/know/k3.png'},
                    //{ uri: 'Collaborating', name: 'Collaborating', tag: ['Know'] },
                    {uri: 'DoTeach', name: 'Do Teach', tag: ['Know'], operator: true, icon: 'icon/know/k4.png'},
                    {uri: 'TeachDo', name: 'Teach Do', tag: ['Know'], operator: true, icon: 'icon/know/k5.png'},
                    {uri: 'Teach', name: 'Teach', tag: ['Know'], operator: true, icon: 'icon/know/k6.png'},
                ]);
            }
            else /* 5 */ {
                $N.addTags([
                    {uri: 'Learn', name: 'Learn', tag: ['Know'], operator: true,
                        description: 'No knowledge but curious to learn'},
                    {uri: 'DoLearn', name: 'DoLearn', tag: ['Know'], operator: true,
                        description: 'Some knowledge and willing to learn more while collaborating'},
                    {uri: 'Do', name: 'Do', tag: ['Know'], operator: true,
                        description: 'Can independently work'},
                    {uri: 'DoTeach', name: 'DoTeach', tag: ['Know'], operator: true,
                        description: 'Independently able to work and can teach or train'},
                    {uri: 'Teach', name: 'Teach', tag: ['Know'], operator: true,
                        description: 'Has expert knowledge and is most useful in teaching others'}
                ]);
            }

            _.each(getDefaultTemplates($N), function(x) {
				x.createdAt = null;
                $N.notice(x);
            });

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

    };
};


//VCARD Fields http://en.wikipedia.org/wiki/VCard
/*
 | <code>ADR</code> A structured representation of the physical delivery address for the vCard object. || <code>ADR;TYPE=home:;;123 Main St.;Springfield;IL;12345;USA</code>
 | <code>AGENT</code> || |  |  || Information about another person who will act on behalf of the vCard object. Typically this would be an area administrator, assistant, or secretary for the individual.  Can be either a URL or an embedded vCard. || <code>AGENT:<nowiki>http://mi5.gov.uk/007</nowiki></code>
 | <code>ANNIVERSARY</code>  |  Defines the person's anniversary. || <code>ANNIVERSARY:19901021</code>
 | <code>BDAY</code> Date of birth of the individual associated with the vCard. || <code>BDAY:19700310</code>
 | <code>BEGIN</code> || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || All vCards must start with this property. || <code>BEGIN:VCARD</code>
 | <code>CALADRURI</code>  |  A URL to use for sending a scheduling request to the person's calendar. || <code>CALADRURI:<nowiki>http://example.com/calendar/jdoe</nowiki></code>
 | <code>CALURI</code>  |  A URL to the person's calendar. || <code>CALURI:<nowiki>http://example.com/calendar/jdoe</nowiki></code>
 | <code>CATEGORIES</code> A list of "tags" that can be used to describe the object represented by this vCard. || <code>CATEGORIES:swimmer,biker</code>
 | <code>CLASS</code> Describes the sensitivity of the information in the vCard. || <code>CLASS:public</code>
 | <code>CLIENTPIDMAP</code>  |  Used for synchronizing different revisions of the same vCard. || <code>CLIENTPIDMAP:1;urn:uuid:3df403f4-5924-4bb7-b077-3c711d9eb34b</code>
 | <code>EMAIL</code> The address for electronic mail communication with the vCard object. || <code>EMAIL:johndoe@hotmail.com</code>
 | <code>END</code> || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || All vCards must end with this property. || <code>END:VCARD</code>
 | <code>FBURL</code>  |  Defines a URL that shows when the person is "free" or "busy" on their calendar. || <code>FBURL:<nowiki>http://example.com/fb/jdoe</nowiki></code>
 | <code>FN</code> || |  | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || The formatted name string associated with the vCard object. || <code>FN:Dr. John Doe</code>
 | <code>GENDER</code>  |  Defines the person's gender. || <code>GENDER:F</code>
 | <code>GEO</code> Specifies a latitude and longitude. || '''2.1''', '''3.0''': <code>GEO:39.95;-75.1667</code><br>'''4.0''': <code>GEO:geo:39.95,-75.1667</code>
 | <code>IMPP</code> || || | {{Check mark|16|color=light green}}* || |  Defines an instant messenger handle.<br><br>* This property was introduced in a separate RFC when the latest vCard version was 3.0.  Therefore, 3.0 vCards may use this property, even though it's not part of the 3.0 specs. || <code>IMPP:aim:johndoe@aol.com</code>
 | <code>KEY</code> The public encryption key associated with the vCard object.  It may point to an external URL, may be plain text, or may be embedded in the vCard as a [[Base64]] encoded block of text. || style="font-size:0.8em" | '''2.1''': <code>KEY;PGP:<nowiki>http://example.com/key.pgp</nowiki></code><br>'''2.1''': <code>KEY;PGP;ENCODING=BASE64:[base64-data]</code><br>'''3.0''': <code>KEY;TYPE=PGP:<nowiki>http://example.com/key.pgp</nowiki></code><br>'''3.0''': <code>KEY;TYPE=PGP;ENCODING=B:[base64-data]</code><br>'''4.0''': <code>KEY;MEDIATYPE=application/pgp-keys:<nowiki>http://example.com/key.pgp</nowiki></code><br>'''4.0''': <code>KEY:data:application/pgp-keys;base64,[base64-data]</code>
 | <code>KIND</code>  |  Defines the type of entity that this vCard represents, such as an individual or organization. || <code>KIND:individual</code>
 | <code>LABEL</code> || |  |  | {{Check mark|16|color=light green}}* || Represents the actual text that should be put on the mailing label when delivering a physical package to the person/object associated with the vCard (related to the <code>ADR</code> property).<br><br>* Not supported in version 4.0.  Instead, this information is stored in the <code>LABEL</code> parameter of the <code>ADR</code> property. || <code>LABEL;TYPE=HOME:123 Main St.\nSpringfield, IL 12345\nUSA</code>
 | <code>LANG</code>  |  Defines a language that the person speaks. || <code>LANG:fr-CA</code>
 | <code>LOGO</code> An image or graphic of the logo of the organization that is associated with the individual to which the vCard belongs.  It may point to an external URL or may be embedded in the vCard as a [[Base64]] encoded block of text. || style="font-size:0.8em" | '''2.1''': <code>LOGO;PNG:<nowiki>http://example.com/logo.png</nowiki></code><br>'''2.1''': <code>LOGO;PNG;ENCODING=BASE64:[base64-data]</code><br>'''3.0''': <code>LOGO;TYPE=PNG:<nowiki>http://example.com/logo.png</nowiki></code><br>'''3.0''': <code>PHOTO;TYPE=PNG;ENCODING=B:[base64-data]</code><br>'''4.0''': <code>LOGO;MEDIATYPE=image/png:<nowiki>http://example.com/logo.png</nowiki></code><br>'''4.0''': <code>PHOTO:data:image/png;base64,[base64-data]</code>
 | <code>MAILER</code> || |  |  || Type of email program used. || <code>MAILER:Thunderbird</code>
 | <code>MEMBER</code>  |  Defines a member that is part of the group that this vCard represents.  Acceptable values include:{{unordered list| a "mailto:" URL containing an email address | a UID which references the member's own vCard }}The <code>KIND</code> property must be set to "group" in order to use this property. || <code>MEMBER:urn:uuid:03a0e51f-d1aa-4385-8a53-e29025acd8af</code>
 | <code>N</code> || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || |  A structured representation of the name of the person, place or thing associated with the vCard object. || <code>N:Doe;John;;Dr;</code>
 | <code>NAME</code> Provides a textual representation of the <code>SOURCE</code> property. ||
 | <code>NICKNAME</code>  |  One or more descriptive/familiar names for the object represented by this vCard. || <code>NICKNAME:Jon,Johnny</code>
 | <code>NOTE</code> Specifies supplemental information or a comment that is associated with the vCard. || <code>NOTE:I am proficient in Tiger-Crane Style,\nand I am more than proficient in the exquisite art of the Samurai sword.</code>
 | <code>ORG</code> The name and optionally the unit(s) of the organization associated with the vCard object. This property is based on the X.520 Organization Name attribute and the X.520 Organization Unit attribute. || <code>ORG:Google;GMail Team;Spam Detection Squad</code>
 | <code>PHOTO</code> An image or photograph of the individual associated with the vCard.  It may point to an external URL or may be embedded in the vCard as a [[Base64]] encoded block of text. || style="font-size:0.8em" | '''2.1''': <code>PHOTO;JPEG:<nowiki>http://example.com/photo.jpg</nowiki></code><br>'''2.1''': <code>PHOTO;JPEG;ENCODING=BASE64:[base64-data]</code><br>'''3.0''': <code>PHOTO;TYPE=JPEG:<nowiki>http://example.com/photo.jpg</nowiki></code><br>'''3.0''': <code>PHOTO;TYPE=JPEG;ENCODING=B:[base64-data]</code><br>'''4.0''': <code>PHOTO;MEDIATYPE=image/jpeg:<nowiki>http://example.com/photo.jpg</nowiki></code><br>'''4.0''': <code>PHOTO:data:image/jpeg;base64,[base64-data]</code>
 | <code>PRODID</code>   |  The identifier for the product that created the vCard object. || <code>PRODID:-//ONLINE DIRECTORY//NONSGML Version 1//EN</code>
 | <code>PROFILE</code>   || States that the vCard is a vCard. || <code>PROFILE:VCARD</code>
 | <code>RELATED</code>  |  Another entity that the person is related to.  Acceptable values include:{{unordered list| a "mailto:" URL containing an email address | a UID which references the person's own vCard }} || <code>RELATED;TYPE=friend:urn:uuid:03a0e51f-d1aa-4385-8a53-e29025acd8af</code>
 | <code>REV</code> A timestamp for the last time the vCard was updated. || <code>REV:20121201T134211Z</code>
 | <code>ROLE</code> The role, occupation, or business category of the vCard object within an organization. || <code>ROLE:Executive</code>
 | <code>SORT-STRING</code> || |  |  | {{Check mark|16|color=light green}}* || Defines a string that should be used when an application sorts this vCard in some way.<br><br>* Not supported in version 4.0.  Instead, this information is stored in the <code>SORT-AS</code> parameter of the <code>N</code> and/or <code>ORG</code> properties. || <code>SORT-STRING:Doe</code>
 | <code>SOUND</code> By default, if this property is not grouped with other properties it specifies the pronunciation of the <code>FN</code> property of the vCard object.  It may point to an external URL or may be embedded in the vCard as a [[Base64]] encoded block of text. || style="font-size:0.8em" | '''2.1''': <code>SOUND;OGG:<nowiki>http://example.com/sound.ogg</nowiki></code><br>'''2.1''': <code>SOUND;OGG;ENCODING=BASE64:[base64-data]</code><br>'''3.0''': <code>SOUND;TYPE=OGG:<nowiki>http://example.com/sound.ogg</nowiki></code><br>'''3.0''': <code>SOUND;TYPE=OGG;ENCODING=B:[base64-data]</code><br>'''4.0''': <code>SOUND;MEDIATYPE=audio/ogg:<nowiki>http://example.com/sound.ogg</nowiki></code><br>'''4.0''': <code>SOUND:data:audio/ogg;base64,[base64-data]</code>
 | <code>SOURCE</code> A URL that can be used to get the latest version of this vCard. || <code>SOURCE:<nowiki>http://johndoe.com/vcard.vcf</nowiki></code>
 | <code>TEL</code> The canonical number string for a telephone number for telephony communication with the vCard object. || <code>TEL;TYPE=cell:(123) 555-5832</code>
 | <code>TITLE</code> Specifies the job title, functional position or function of the individual associated with the vCard object within an organization. || <code>TITLE:V.P. Research and Development</code>
 | <code>TZ</code> The time zone of the vCard object. || '''2.1''', '''3.0''': <code>TZ:-0500</code><br>'''4.0''': <code>TZ:America/New_York</code>
 | <code>UID</code> Specifies a value that represents a persistent, globally unique identifier associated with the object. || <code>UID:urn:uuid:da418720-3754-4631-a169-db89a02b831b</code>
 | <code>URL</code> A URL pointing to a website that represents the person in some way. || <code>URL:<nowiki>http://www.johndoe.com</nowiki></code>
 | <code>VERSION</code> || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || | {{Check mark|16|color=blue}} || The version of the vCard specification.  In versions 3.0 and 4.0, this must come right after the <code>BEGIN</code> property. || <code>VERSION:3.0</code>
 | <code>XML</code>  |  Any XML data that is attached to the vCard. This is used if the vCard was encoded in XML (xCard standard) and the XML document contained elements which are not part of the xCard standard. || <code>XML:&lt;b&gt;Not an xCard XML element&lt;/b&gt;</code>
 |}
 
 A handful of separate specifications define additional vCard properties.
 
 | <code>BIRTHPLACE</code> || [http://tools.ietf.org/html/rfc6474 RFC 6474] || The location of the individual's birth. || <code>BIRTHPLACE;VALUE=text:Maida Vale\, London\, England</code>
 | <code>DEATHDATE</code> || [http://tools.ietf.org/html/rfc6474 RFC 6474] || The individual's time of death. || <code>DEATHDATE:19540607</code>
 | <code>DEATHPLACE</code> || [http://tools.ietf.org/html/rfc6474 RFC 6474] || The location of the individual death. || <code>DEATHPLACE;VALUE=uri:geo:53.328,-2.229409</code>
 | <code>EXPERTISE</code> || [http://tools.ietf.org/html/rfc6715 RFC 6715] || A professional subject area that the person has knowledge of. || <code>EXPERTISE;LEVEL=expert:Computer Science</code>
 | <code>HOBBY</code> || [http://tools.ietf.org/html/rfc6715 RFC 6715] || A recreational activity that the person actively engages in. || <code>HOBBY;LEVEL=high:knitting</code>
 | <code>IMPP</code> || [http://tools.ietf.org/html/rfc4770 RFC 4770] || Defines an instant messenger handle.  This was added to the official vCard specification in version 4.0. || <code>IMPP:aim:johndoe@aol.com</code>
 | <code>INTEREST</code> || [http://tools.ietf.org/html/rfc6715 RFC 6715] || A recreational activity that the person is interested in, but does not necessarily take part in. || <code>INTEREST;LEVEL=high:baseball</code>
 | <code>ORG-DIRECTORY</code> || [http://tools.ietf.org/html/rfc6715 RFC 6715] || A URI representing the person's work place, which can be used to lookup information on the person's co-workers. || <code>ORG-DIRECTORY:<nowiki>http://www.company.com/employees</nowiki></code>
 |}
 
 | <code>X-ABUID</code> || string || Apple [[Address Book (application)|Address Book]] [[UUID]] for that entry
 | <code>X-ANNIVERSARY</code> || YYYY-MM-DD || arbitrary anniversary (in addition to <code>BDAY</code>, birthday)
 | <code>X-ASSISTANT</code> || string || assistant name (instead of <code>AGENT</code>)
 | <code>X-MANAGER</code> || string || manager name
 | <code>X-SPOUSE</code> || string || spouse name
 | <code>X-GENDER</code> || string || value <code>Male</code> or <code>Female</code>
 | <code>X-AIM</code> || string || rowspan="9" | Instant Messaging (IM) contact information; <code>TYPE</code> parameter as for <code>TEL</code> 
 | <code>X-ICQ</code> || string 
 | <code>X-GOOGLE-TALK</code> || string 
 | <code>X-JABBER</code> || string  
 | <code>X-MSN</code> || string  
 | <code>X-YAHOO</code> || string 
 | <code>X-TWITTER</code> || string 
 | <code>X-SKYPE</code>, <code>X-SKYPE-USERNAME</code> || string 
 | <code>X-GADUGADU</code> || string 
 | <code>X-GROUPWISE</code> || string ||
 | <code>X-MS-IMADDRESS</code> || string || IM address in VCF attachment from Outlook (right click Contact, Send Full Contact, Internet Format.)
 | <code>X-MS-CARDPICTURE</code> || string || Works as <code>PHOTO</code> or <code>LOGO</code>. Contains an image of the Card in Outlook.
 | <code>X-PHONETIC-FIRST-NAME</code>, <code>X-PHONETIC-LAST-NAME</code> || string || alternative spellings, for assisting with the pronunciation of unfamiliar names
 
 | <code>X-MOZILLA-HTML</code> || <code>TRUE</code>/<code>FALSE</code> || mail recipient prefers HTML-formatted email
 | <code>X-MOZILLA-PROPERTY</code> || string || Thunderbird specific settings
 
 | <code>X-EVOLUTION-ANNIVERSARY</code> || YYYY-MM-DD || arbitrary anniversary (in addition to <code>BDAY</code>, birthday)
 | <code>X-EVOLUTION-ASSISTANT</code> || string || assistant name (instead of <code>Agent</code>)
 | <code>X-EVOLUTION-BLOG-URL</code> || string/URL || blog URL
 | <code>X-EVOLUTION-FILE-AS</code> || string || file under different name (in addition to <code>N</code>, name components; and <code>FN</code>, full name)
 | <code>X-EVOLUTION-MANAGER</code> || string || manager name
 | <code>X-EVOLUTION-SPOUSE</code> || string || spouse name
 | <code>X-EVOLUTION-VIDEO-URL</code> || string/URL || video chat address
 | <code>X-EVOLUTION-CALLBACK</code> || <code>TEL TYPE</code> parameter value || - || callback phone number
 | <code>X-EVOLUTION-RADIO</code> || <code>TEL TYPE</code> parameter value || - || radio contact information
 | <code>X-EVOLUTION-TELEX</code> || <code>TEL TYPE</code> parameter value || - || [[Telegraphy#Telex|Telex]] contact information
 | <code>X-EVOLUTION-TTYTDD</code> || <code>TEL TYPE</code> parameter value || - || TTY [[Telecommunications device for the deaf|TDD]] contact information
 
 | <code>X-KADDRESSBOOK-BlogFeed</code> || string/URL || blog URL
 | <code>X-KADDRESSBOOK-X-Anniversary</code> || ISO date || arbitrary anniversary, in addition to <code>BDAY</code> = birthday
 | <code>X-KADDRESSBOOK-X-AssistantsName</code> || string || assistant name (instead of <code>Agent</code>)
 | <code>X-KADDRESSBOOK-X-IMAddress</code> || string || im address
 | <code>X-KADDRESSBOOK-X-ManagersName</code> || string || manager name
 | <code>X-KADDRESSBOOK-X-Office</code> || string || office description
 | <code>X-KADDRESSBOOK-X-Profession</code> || string || profession
 | <code>X-KADDRESSBOOK-X-SpouseName</code> || string || spouse name
 
 Country
 ZIP Code
 
 */
