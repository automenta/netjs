/*
This is the client configuration file that is loaded by the static client-only version.
The server version will generate its own version of this file, ignoring this.
*/

var configuration = {
	"connection": "local",
	"siteName": '_a_123_a_',
	"siteDescription": 'http://netention.org',
	"ui":"ui.mobile.js",
	"initialView":"graph",
	"avatarMenuDisplayInitially":true,
	"avatarMenuTagTreeAlways":false,
	"favicon":null,
	"loginLogo":"/theme/login-logo.png",
	"defaultAvatarIcon":"/theme/default-avatar.jpg",
	"wikiStartPage":"Life",
	"showPlanOnSelfPage":true,
	"autoLoginDefaultProfile":true,
	"defaultTheme":"_cybernetic",
	"requireIdentity":true,
	"maxStartupObjects":8192,
	"defaultMapMode2D":true,
	"mapDefaultLocation":[40.44,-80],
	"enableTogetherJS":false,
	"viewUpdateMS":850,
	"knowLevels":3,
	"focusEnable":false,
	"views":["us","map","browse","wiki","graph","share","templates","chat","main","trends","time"],
	"newUserProperties":[],
	"shareTags": ['Offer', 'Sell', 'Lend', 'Rent', 'Swap', 'GiveAway', 'Need', 'Teach', 'Learn'],
	"shareCategories": ['Food', 'Service', 'Volunteer', 'Shelter', 'Tools', 'Health', 'Transport', 'Human', 'Animal'],
	"defaultScope": 2,
	"enableAnonymous": true,
	"wikiProxy": "http://www.automenta.com/proxy/proxy.php?url="
};



/* Netention Client Configuration */

//all hardcoded stuff here is temporary until icons are specified by ontology
var defaultIcons = { 
    'default': '/icon/rrze/status/true.png',

	'unknown': '/icon/unknown.png',

	'Favorite': '/icon/rrze/actions/observe.png',
	'Goal': '/icon/rrze/status/error.png',
    'Earthquake': '/icon/quake.png',
    'NuclearFacility': '/icon/nuclear.png',
    'Human': '/icon/rrze/emblems/crown.png',
    'User': '/icon/rrze/emblems/ID-clip.png',
    'Message': '/icon/rrze/emblems/at.png',
    'Decision.Agree': '/icon/loomio/agree.png',
    'Decision.Disagree': '/icon/loomio/disagree.png',
    'Decision.Block': '/icon/loomio/block.png',
    'Decision.Abstain': '/icon/loomio/abstain.png',
    'Event': '/icon/rrze/actions/dial-in.png',
    'Report': '/icon/rrze/actions/add.png',
    'Similar': '/icon/approx_equal.png',
    'Emotion.happy': '/icon/emoticon/happy.svg',
    'Emotion.sad': '/icon/emoticon/sad.svg',
    'Emotion.angry': '/icon/emoticon/angry.svg',
    'Emotion.surprised': '/icon/emoticon/surprised.svg',
    'Tweet': '/icon/twitter.png',
    'GoalCentroid': '/icon/rrze/emblems/workflow-cycle.png',
	'Item': '/icon/rrze/emblems/database.png',
	'Volunteer': '/icon/sparkrelief/cat-volunteer-28.png',
	'Shelter': '/icon/sparkrelief/cat-shelter-28.png',
	'Food':  '/icon/sparkrelief/cat-food-28.png',
	'Tools':  '/icon/sparkrelief/cat-goods-28.png',
	'Health':  '/icon/sparkrelief/cat-medical-28.png',
	'Transport':  '/icon/sparkrelief/cat-transportation-28.png',
	'Service':  '/icon/sparkrelief/cat-services-28.png',
	'Animal':  '/icon/sparkrelief/cat-pets-28.png'
};


var themes = {
	//BASIC
    "_bright":'Bright',
    "ui-darkness":'Dark',

	//ORIGINAL
    "_matrix-green":'Matrix (green)',
    "_matrix-red":'Matrix (red)',
    "_matrix-blue":'Matrix (blue)',
    "_space": 'Space',
    "_cybernetic": 'Cybernetic',
    "_notebook": 'Notebook',
    "_rainforest": 'Rainforest',
    "_metamaps": 'MetaMaps',
    "_scroogle": 'Google',
    "_n$a": 'N$A',

	//from ThemeRoller
    "black-tie": 'Black Tie',
    "blitzer": 'Blitzer',
    "cupertino": 'Cupertino',
    "dark-hive": 'Dark Hive',
    "dot-luv": 'Dot Luv',
    "excite-bike": 'Excite Bike',
    "flick": 'Flick',
    "hot-sneaks": 'Hot Sneaks',
    "humanity": 'Humanity',
    "le-frog": 'Le Frog',
    "mint-choc": 'Mint Chocolate',
    "overcast": 'Overcast',
    "pepper-grinder": 'Pepper Grinder',
    "redmond": 'Redmond',
    "smoothness": 'Smoothness',
    "south-street": 'South Street',
    "start": 'Start',
    "sunny": 'Sunny',
    "swanky-purse": 'Swanky Purse',
    "trontastic": 'Trontastic',
    "vader": 'Vader'    
};

var tagAlias = { };

