var exampleObject = {
    id: 'CompleteExample',
    name: 'Object Name',
    createdAt: 38483478478,
    modifiedAt: 8384848783,
    author: '388439f983f983hf',
    scope: 'public',
    value: [
        
        { id: 'integer', value: 7  },
        { id: 'real', value: 3.14  },
        { id: 'boolean', value: true  },
        { id: 'url', value: 'http://netention.org'  },
        { id: 'text', value: 'Object\'s Description'  },
        { id: 'textarea', value: 'Object\'s Description'  },
        { id: 'object', value: null  },
        
        
        { id: 'spacepoint', value: { lat: -3, lon: -3, altitude: 20, planet: 'Earth', name: '3284 Main Street, New York City', 'circle': 384.2 /* meters */ } },
        //spacemovement (velocity, acceleration)
        
        { id: 'timepoint', value: { at: 384848833, timezone: 'EST' } },
        { id: 'timerange', value: { startsAt: 384848833, endsAt: 83484848, timezone: 'EST' } },
        
        { id: 'emotion.happy', strength: 0.75 },
        { id: 'emotion.surprised', strength: 0.25 },
        { id: 'emotion.sad', strength: 0.25, 
            value: [ { id: 'excessiveWorry', value: 'yes very' } ]  },
    	{ id: 'environment.EarthQuake', strength: 0.5,
            value: [ { id: 'eqMagnitude', value: 5.2}, { id: 'eqDepth', value: 205 } ] },

        //{ id: 'HumanBodySelect' },
        //{ id: 'EmotionSelect' }
        //{ id: 'cortexit', value: 'Sentence 1. Sentence 2. Sentence 3.'  },
        
    ]
};