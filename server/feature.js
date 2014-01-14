var util = require('../client/util.js');

//http://www.brainpickings.org/index.php/2012/05/10/graphing-jane-austen/

function wordCount(t) {
    //http://stackoverflow.com/questions/4593565/regular-expression-for-accurate-word-count-using-javascript
    return t.match(/\S+/g).length;
}

function wordOccurrences(string, subString, allowOverlapping){
    //http://stackoverflow.com/questions/4009756/how-to-count-string-occurrence-in-string
    
    string+=""; subString+="";
    if(subString.length<=0) return string.length+1;

    var n=0, pos=0;
    var step=(allowOverlapping)?(1):(subString.length);

    while(true){
        pos=string.indexOf(subString,pos);
        if(pos>=0){ n++; pos+=step; } else break;
    }
    return(n);
}

function objAnalysis(x) {
    var t = util.objName(x) + '\n' + util.objDescription(x);
    var a = { };
    var numWords = wordCount(t);
    
    if (t.indexOf(':)')!=-1) {
        a['happy'] = 1.0;
    }
    if (t.indexOf(':(')!=-1) {
        a['sad'] = 1.0;
    }
    
    if (numWords > 0) {
        a['written'] = numWords;
        a['cursing'] = (wordOccurrences(t, 'fuck', false) + wordOccurrences(t, 'shit', false)) / numWords;
    }
    
    
        /*            
            'Writing': [ 0, 0.25, 0.5, 0.5, 0.75, 1.0 ],
            'Happy': [  0, 0.25, 0, 0, 0  ],
            'Sad': [  0, 0, 0, 0, 0, 1  ],
            'Buying': [ 0, 0, 0.25, 0.25, 0 ],
            'Questioning': [0,0,0,0,0],
            'Cursing': [0,0,0,0,0],
            'Linking': [0,0,0,0,0],
            'Retweeting': [0,0,0,0,0],
            'Mentioning': [0,0,0,0,0],
            'Moving': [0,0,0,0,0], //geolocation changes
            'Laughing': [ 1.0, 0, 0, 0, 0.25 ]                    
        },*/
    
    return a;
}
exports.objAnalysis = objAnalysis;
