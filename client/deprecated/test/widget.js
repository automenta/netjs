var everyPrimitiveClass = 
    new nobject('AllPrimitives', 'All Primitives');
everyPrimitiveClass.extend = [];
everyPrimitiveClass.value = [
    { id: 'TestInteger', extend: 'integer' },
    { id: 'TestReal', extend: 'real' }
];


var varietyObject = 
    new nobject().addTag('AllPrimitives')
    .add('TestInteger', 1)
    .add('TestReal', 1.5);
    //.add('TestRealUnits', 1.5, "meters");


//extend an ontology with user-interface methods
function Widget(O) {
    O.primitive.default.newViewSummary = 
        function(object, i, vID, value, options) {
            return $('<div>' + JSON.stringify(v) + '</div>');
        };
    
    O.primitive.integer.newViewSummary =
    O.primitive.real.newViewSummary =
        function(object, i, vID, value, options) {
            var number, unit = undefined;
            if (typeof value === "number")
                number = value;
            else {
                number = value.number;
                unit = value.unit;
            }
            return $('<div>' + value + ( unit? (' ' + unit) : '' ) + '</div>');
        };
     
    O.primitive.instance.newView =
        function(object) {
            for (var i = 0; i < object.value.length; i++) {
                var V = object.value[i];
                //var summaryFunc = O.primitive...
            }
        }
    return O;
};

var $N = Widget(Ontology());
