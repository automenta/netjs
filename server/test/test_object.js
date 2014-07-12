var assert = require("assert");
var _ = require('lodash');

var util = require('../../util/util.js');


describe("new objects", function() {
	
	var $N = util.Ontology();
	
	it("object operations", function() {
		assert( new $N.nobject().id, "Generate ID randomly when none specified" );

		assert( (new $N.nobject()).createdAt, "Has createdAt metadata");

		assert( (new $N.nobject("id")).id == "id", "New Object with supplied ID" );
		assert( (new $N.nobject("id", "name")).name == "name", "New Object with supplied name" );
	});
});


describe("Object compact & expand", function() {

	var $N = util.Ontology();
	
	function testExpand(x) {
		var y = util.objCompact(x);

		var z = util.objExpand(y);
		
		assert(z.value.length == x.value.length);
			
		assert(_.isEqual(z.value, x.value));
		assert(x.id == z.id);
		assert(x.name == z.name);
		assert(x.createdAt == z.createdAt);		
		assert(x.author == z.author);		
	}
	
	
	it("object with tags & values", function() {
	
		var x = new $N.nobject("id", "name");
		x.addTag('tag1');
		x.addTag('tag1', 0.5);
		x.addTag('tag2');
		
		var y = util.objCompact(x);
		
		assert(y.v.length == 3);
		assert(typeof y.v[0] === "string"); //the first should be turned into a string since it has strenght==1 (the default)
		assert(typeof y.v[1] !== "string");
		assert(typeof y.v[2] === "string");
		
		testExpand(x);
	});
	
	it("object 2", function() {
	
		var x = new $N.nobject("id", "name");
		x.author = 'me';
		x.addTag('tag1');
		
		testExpand(x);
	});	
});

//TODO update these

/*
describe("Object editing", function() {
       
    var x = objNew();
    var y = { id: 'tag'  };
    
    objAddValue(x, y );   
    ok( x.value.length == 1, "value object added to object");
    
    {
        var z = { id: 'property', value: 'value'  };
        objAddValue(y, z);
        ok(x.value[0].value, "attached sub-object" );
    }
    
    {
        objAddDescription(x, 'described');
        ok(x.value.length == 2, 'description added to value list');
        strictEqual(objDescription(x), 'described', 'description readable');
    }
    
    objRemoveValue(x, 0);
    ok( x.value.length == 1, "value object removed from object");    
    
    
    ok( !objName(x), "object has no default name" );
    strictEqual( objName(objName(x, 'named')) , 'named', "object name may be specified" );
    
});

describe("Tag calclulations", function() {
    var x = objNew();
    objAddValue(x, { id: 'integer', value: 5 }); //should not be counted
    objAddValue(x, { id: 'Earthquake', strength: 1.0, value: [ ] }); 
    objAddValue(x, { id: 'Earthquake', strength: 0.75, value: [ ] });  //should not be counted twice, uses max of strengths of the same type
    objAddValue(x, { id: 'Happy', strength: 0.25, value: [ ] });  //should not be counted twice    
    
    deepEqual( objTags(x, false), [ 'Earthquake', 'Happy' ], 'list of unique tags' );

    deepEqual( objTagStrength(x), { 'Earthquake': 0.8, 'Happy': 0.2 }, 'normalized strengths of tags' );

    objAddValue(x, { id: 'html', value: 'nothing' });
    deepEqual( objTags(x), [ 'Earthquake', 'Happy' ], 'objTags without primitives, when primitives present' );
    deepEqual( objTags(x, true).length, 4, 'objTags with primitives, when primitives present' );
    
    var y = objNew();
    objAddValue(y, { id: 'Earthquake', strength: 1.0, value: [ ] }); 
        
    var z = objNew();    
    deepEqual( objTagRelevance(x, z), 0.0, 'tag relevancy: when no tags present' );
    //deepEqual( objTagRelevance(x, y), 0.8, 'tag relevancy: when some tags present' );
    
});
*/