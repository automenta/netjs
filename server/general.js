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
            'repeatPeriod': {name: 'Repeat period (sec)', type: 'real', unit: 'time'},
            'repeatDelay': {name: 'Repeat phase (sec)', type: 'real', unit: 'time'},
            'repeatStarted': {name: 'Repeat started', type: 'timepoint', readonly: true},
            'requiresAcknowledgement': {name: 'Require Acknowledgement', type: 'boolean'},
            'lastAcknowledgement': {name: 'Repeat started', type: 'timepoint', readonly: true},
            'goalEnabled': {name: 'Enabled', type: 'boolean'}
        }
    }, //=Project=Program=Plan=Opportunity
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
    {uri: 'Skill', name: 'Skill', properties: {
            'knowledge': {name: 'Knowledge', type: 'object'}
       }},
    /* 0 – No Knowledge, 1- Training / Knowledge Only, 2 – Ability to work with support of seniors, 
     3 – Can independently work, 4 – Confidently Lead and Guide others, 5 – Professional Expert / Certified. */
    {uri: 'BeginnerStudent', name: 'Student', tag: ['Skill']},
    {uri: 'IntermediateStudent', name: 'Student Collaborator', tag: ['Skill']},
    {uri: 'CollaboratingStudent', name: 'Collaborator Student', tag: ['Skill']},
    {uri: 'Collaborating', name: 'Collaborating', tag: ['Skill']},
    {uri: 'CollaboratingTeacher', name: 'Collaborator Teacher', tag: ['Skill']},
    {uri: 'IntermediateTeacher', name: 'Teacher Collaborator', tag: ['Skill']},
    {uri: 'ExpertTeacher', name: 'Teacher', tag: ['Skill']},
    {uri: 'Can', name: 'Can'},
    {uri: 'Need', name: 'Need'},
    {uri: 'Not', name: 'Not'},
    //NEEDS from SparkRelief
    {uri: 'Volunteer', name: 'Volunteer', tag: ['Need']},
    {uri: 'Shelter', name: 'Shelter', tag: ['Need']},
    {uri: 'Food', name: 'Food', tag: ['Need']},
    {uri: 'Tools', name: 'Tools', tag: ['Need']},
    {uri: 'Health', name: 'Health', tag: ['Need']},
    {uri: 'Transport', name: 'Transport', tag: ['Need']},
    {uri: 'Service', name: 'Service', tag: ['Need']},
    {uri: 'Animal', name: 'Animal', tag: ['Need']},
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

exports.plugin = {
    name: 'General',
    description: 'General Tags',
    options: {},
    version: '1.0',
    author: 'http://netention.org',
    start: function(netention, util) {
        netention.addTags(generalTags);

        function indexPDF(name, path) {
            var introPresentation = util.objNew(path, name);
            introPresentation.add('PDF');
            introPresentation.add('pdfURL', path);
            introPresentation.add('slideNumber', 1);
            netention.pub(introPresentation);
        }
        //indexPDF('Spacetime-Tag Planning', 'doc/netention_spacetime_tag_planning.pdf');
        //indexPDF('Netention Theory', 'doc/seh_netention_intro.pdf');

    },
    stop: function(netention) {
    }
};
