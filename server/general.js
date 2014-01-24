//GENERAL.JS is a PLUGIN WHICH IS AUTOMATICALLY LOADED BY THE WEBSERVER

var lengthUnits = [ 'meter', 'foot', 'inch', 'mile' ];
var massUnits = [ 'kilogram', 'pound', 'ounce' ];
var currencyUnits = [ 'Bitcoin', 'USDollar', 'Euro', 'Gold(g)', 'Silver(g)' ];
    //http://www.therichest.org/business/most-traded-currencies/

var generalTags = [
    {uri: 'Imaginary', name: 'Imaginary', description: 'Something imaginary, indefinite values.'},
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
        }
    },
    {uri: 'Action', name: 'Action', //combined Event into this one..
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
    {uri: 'Geometry', name: 'Geometry',
        properties: {
            'length': {name: 'Length', type: 'real', units: lengthUnits },
            'width': {name: 'Width', type: 'real', units: lengthUnits },
            'height': {name: 'Height', type: 'real', units: lengthUnits},
            'mass': {name: 'Mass', type: 'real', units: massUnits}
        }
    },
    {uri: 'Value', name: 'Value',
        properties: {
            'moneyAmount': {name: 'Money Amount', type: 'real', default: 0, units: currencyUnits },
            'walletBTC': {name: 'Bitcoin Wallet', type: 'text'},
            'walletRipple': {name: 'Ripple Wallet', type: 'text'},
            'walletPayPal': {name: 'PayPal Address', type: 'text'},
            'walletRTN': {name: 'Bank Account', type: 'text'}, //http://en.wikipedia.org/wiki/Routing_transit_number
        }
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

        }
    },
    {uri: 'Media', name: 'Media'}, //params: contentType
    //goodPartStartsAt: (time)

    {uri: 'Report', name: 'Report'}, //Report=Incident
    //NewsSourceLink (url)
    //see: Ushahidi.com

    {uri: 'Arrive', name: 'Arrive'},
    {uri: 'Depart', name: 'Depart'},
    {uri: 'Problem', name: 'Problem'}, //=Question
    //blame : who

    {uri: 'Solution', name: 'Solution'}, //=Answer

    {uri: 'Cause', name: 'Cause'},
    {uri: 'Effect', name: 'Effect'},
    {uri: 'Internet', name: 'Internet'},
    {uri: 'Goal', name: 'Goal',
        properties: {
            /*'repeatPeriod': {name: 'Repeat period (sec)', type: 'real', unit: 'time'},
            'repeatDelay': {name: 'Repeat phase (sec)', type: 'real', unit: 'time'},
            'repeatStarted': {name: 'Repeat started', type: 'timepoint', readonly: true},*/
			//'goalAlert': { name: 'Alert', type: 'text', default: 'at [time/date] -or- every X [minutes|hours|days|weeks] at [time/date]'},
            'requiresAcknowledgement': {name: 'Require Acknowledgement', type: 'boolean'},
            'lastAcknowledgement': {name: 'Repeat started', type: 'timepoint', readonly: true},
            'goalEnabled': {name: 'Enabled', type: 'boolean', default: true}
        }
    }, //=Project=Program=Plan=Opportunity

	{uri: 'GoalCentroid', name: 'Possible Goal', tag: [ 'Goal', 'Imaginary' ]},

    //state = considered|desired|active|completed

    {uri: 'Favorite', name: 'Favorite'},
    {uri: 'User', name: 'User'},
    //{ uri: 'Netention', name: 'Netention'}, //Netention itself, meta 

    {uri: 'Message', name: 'Message'},
    /*
     At the first gate, ask yourself, ‘Is it true?
     At the second ask, ‘Is it necessary?
     At the third gate ask ‘Is it kind?
     - Sufi saying -
     */

    {uri: 'Decision', name: 'Decision'},
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
    
    {uri: 'Social', name: 'Social', properties: {       }},
    {uri: 'Friend', name: 'Friend', tag: ['Social'], operator: true},
    {uri: 'Enemy', name: 'Enemy', tag: ['Social'], operator: true},
    
    {uri: 'Know', name: 'Know', properties: {
            'knowledge': {name: 'Knowledge', type: 'object'}
       }},
    /* 0 – No Knowledge, 1- Training / Knowledge Only, 2 – Ability to work with support of seniors, 
     3 – Can independently work, 4 – Confidently Lead and Guide others, 5 – Professional Expert / Certified. */
    {uri: 'Learn', name: 'Learn', tag: ['Know'], operator: true,
        description: 'No knowledge but curious to learn' },
    {uri: 'DoLearn', name: 'DoLearn', tag: ['Know'], operator: true,
        description: 'Some knowledge and willing to learn more while collaborating' },
    {uri: 'Do', name: 'Do', tag: ['Know'], operator: true,
        description: 'Can independently work' },
    {uri: 'DoTeach', name: 'DoTeach', tag: ['Know'], operator: true,
        description: 'Independently able to work and can teach or train' },
    {uri: 'Teach', name: 'Teach', tag: ['Know'], operator: true,
        description: 'Has expert knowledge and is most useful in teaching others' },
        
    {uri: 'Can', name: 'Can', operator: true},
    {uri: 'Need', name: 'Need', operator: true, properties: {
        'repeatNeed': {name: 'Repeat', type: 'timerepeat' },
    }},
    {uri: 'Not', name: 'Not', operator: true},
    
    {uri: 'Support', name: 'Support', description: 'A life-supporting component of civilization or infrastructure'},
    
    //NEEDS from SparkRelief
    {uri: 'Volunteer', name: 'Volunteer', tag: ['Support']},
    {uri: 'Shelter', name: 'Shelter', tag: ['Support']},
    {uri: 'Food', name: 'Food', tag: ['Support']},
    {uri: 'Tools', name: 'Tools', tag: ['Support']},
    {uri: 'Health', name: 'Health', tag: ['Support']},
    {uri: 'Transport', name: 'Transport', tag: ['Support']},
    {uri: 'Service', name: 'Service', tag: ['Support']},
    {uri: 'Animal', name: 'Animal', tag: ['Support']},
    
    {uri: 'PDF', name: 'PDF Slide', properties: {
            'pdfURL': {name: 'PDF URL', type: 'text'},
            'slideNumber': {name: 'Slide', type: 'integer', min: 1, incremental: true}
        }},
    //Pledge = Promise
    //  
    {uri: 'Promise', name: 'Promise',
        description: "Promise or an Offer. 'I will do it, but only if you will help.'" //PledgeBank.com
    },
    {uri: 'Tag', name: 'Tag',
        description: "Indicates that an object defines a tag",
        properties: {
            'tagValueType': {name: 'Value Type', type: 'text'},
            //'tagDomain': { name: 'Domain', type: 'text' }
        }


    }


];

var emotionTags = [
	{ uri: 'Emotion', name: 'Emotion'},
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
