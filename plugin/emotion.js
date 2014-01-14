var emotionTags = [
    { uri: 'emotion.calm', name: 'Calm' }, //neutral
    
    //
	{ uri: 'emotion.happy', name: 'Happy' },
	{ uri: 'emotion.trusting', name:'Trusting'},
	{ uri: 'emotion.anticipating', name: 'Anticipating'},
	{ uri: 'emotion.surprised', name:'Surprised'}, 
	
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
    { uri: 'emotion.sad', name: 'Sad', properties: {
        'undulyExtremeMeaning': { name: 'Is the meaning I’m assigning to this event unduly extreme?', type: 'textarea' },
        'harshConclusions': { name: 'Am I exaggerating a simple event to derive harsh conclusions from it?', type: 'textarea' }
        //...
	}},
    
	{ uri: 'emotion.afraid', name: 'Afraid'},
	{ uri: 'emotion.angry', name: 'Angry'},
	{ uri: 'emotion.disgusted', name: 'Disgusted'},

    { uri: 'emotion.tired', name: 'Tired' },
    { uri: 'emotion.energized', name: 'Energized' }

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

exports.plugin = {
        name: 'Emotions',	
		description: 'Plutchik\'s 8 Primary Emotions',
		options: { },
		start: function(netention) { 
            netention.addTags([ {
                uri: 'emotion', name: 'Emotion'
            }]);
            
            netention.addTags(emotionTags, ['emotion']);
            
        },
		stop: function(netention) {
		}
};
