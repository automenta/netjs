var assert = require("assert");
var _ = require('lodash');

var util = require('../../util/util.js');
var DB = require('../../util/db.levelup.js');


function newOntology() {
	var odb = DB('objects', { type: 'levelup', backend: 'memdown' } );
    return util.Ontology(odb, true);
}

var class1 = {
	id: 'Class1',
	description: 'A test class, with value in array form',
	extend: [],
	value: [            
		"testProperty"
	]
};


describe("Ontology", function() {
	var $N = newOntology();
    	
	it("ontology add/remove", function() {

		var data = new $N.nobject();
		assert(data, "new nobject");

		$N.add(data);
		{
			assert($N.object[data.id].id === data.id, "object inserted");
			assert($N.instance[data.id].id === data.id, "object identified as instance");
			assert($N.class[data.id] === undefined, "object not a class");
			assert($N.property[data.id] === undefined, "object not a property");
		}
		
		$N.remove(data);
		{  assert($N.object[data.id] === undefined, "object removed");    }

		$N.add(data); 
		$N.add({id: data.id, removed: true});
		{  assert($N.object[data.id] === undefined, "object removed via removal object");  }

		var prop1 = {
			id: 'testProperty',
			description: 'A test property',
			extend: 'integer',
			minArity: 1, 
			maxArity: 2, 
			default: 0, 
			strength: 1.0, 
			readonly: true        
		};
		
		assert( util.objIsProperty(prop1), "detect property as a property");
		
		$N.add(prop1);
		{  assert($N.property[prop1.id].id === prop1.id, "property present in ontology");  }



		$N.add(class1);
		{ 
			assert($N.class[class1.id].id === class1.id, "class present in ontology");  
			assert(class1.property['testProperty'], "class linked to previously defined test property");
			assert($N.classRoot['Class1'], "class identified as a root");
			//ok($N.property['embeddedProperty'], "embedded property present in ontology");
			//ok(class1.property['embeddedProperty'], "class linked to newly defined embedded property");
		} 

		

		var class2 = {
			id: 'Class2',
			description: 'A test class, with value in hash form',
			extend: "Class1",
			value: {            
				"testProperty2": {                        
					name: '2nd Embedded property, which adds to the ontology',
					extend: 'integer'
				}
			}
		};
		$N.add(class2);
		{ 
			assert($N.property['testProperty2'], "embedded property present in ontology");
			assert(class2.property['testProperty2'], "class linked to previously defined test property");
			assert(!$N.classRoot['Class2'], "class2 not identified as a root");
		} 


		var subclass1 = {
			id: 'SubClass1',
			extend: ['Class1']
		};
		$N.add(subclass1);
		{
			assert($N.class[subclass1.id].id === subclass1.id, "subclass present in ontology");
			assert(subclass1.class['Class1'] === class1, "subclass .class field");
			assert(class1.subclass['SubClass1'] === subclass1, "class .subclass field");
			assert(!$N.classRoot['SubClass1'], "class identified as a root");
		}

		//test tag indexing
		var data2 = new $N.nobject().addTag('Class1');
		$N.add(data2);
		{   assert( _.keys($N.tagged['Class1'])[0] === data2.id, "adding instance indexes by its tags" );  }

		$N.remove(data2);
		{   assert( _.keys($N.tagged['Class1']).length === 0, "removing instance unindexes by its tags" );  }
	
		
		$N.clear();		
		assert(0 == $N.dgraph.order(), "Dgraph empty after clear()");
		assert(0 == $N.ugraph.order(), "Ugraph empty after clear()");
		
	});           

	it("Directed Graph in, out", function() {
		var a = new $N.nobject("a");
		var b = new $N.nobject("b");

		$N.add(a);
		$N.add(b);    
		assert(2 == $N.dgraph.order(), "Digraph has 2 nodes after adding 2");
		assert(2 == $N.ugraph.order(), "UGraph has 2 nodes after adding 2");

		a.value = [ { id: 'html', value: '..' }];    
		$N.add(a);    
		assert(2 == $N.dgraph.order(), "Digraph has same number of nodes after reindexing existing object");

		$N.remove(a);
		assert(1 == $N.dgraph.order(), "Digraph has 1 node after removing 1 node");

		a.out = { "b": 1};
		$N.add(a);
		assert(1 == $N.dgraph.edges().length, "Digraph has 1 edge after adding node with outgoing edge");    
		assert(0 == $N.ugraph.edges().length, "Ugraph has 0 edges after adding node with outgoing edge");

		var c = new $N.nobject("c");
		a.out = { "c": true };
		$N.add(a);
		$N.add(c);
		assert(3 == $N.dgraph.order());
		assert(1 == $N.dgraph.edges().length, "the one existing edge replaced");
		assert($N.dgraph.edge("|a|c"), "edge value");
		assert("a" == $N.dgraph.predecessors("c")[0], "a is predecessor of c");

		//test in edges
		c.in = { "b": 1 };
		$N.add(c);
		assert(2 == $N.dgraph.edges().length, "additional edge, b->c");

		delete c.in;
		$N.add(c);
		assert(1 == $N.dgraph.edges().length, "removed income edge");

		//test removal of all nodes, should be no edges
		$N.remove(a).remove(b).remove(c);
		assert(0 == $N.dgraph.edges().length, "no edges when no nodes in graph");
	});    
	

	
});

describe("Ontology getTagged", function() {
	
	var $N = newOntology();

	it("ontology getTagged", function() {
		
		$N.clear();
		
		var a = new $N.nobject("a");
		a.addValue("trust", "y");
		a.subject = a.author = 'x';
		
		$N.add(a);
		
		assert($N.instance['a'], "a identified as instance");
		assert($N.instance['x'], "x identified as instance");
		assert($N.instance['y'], "y identified as instance");
		assert(1 == $N.dgraph.edges().length, "edge 'a know b' inferred");
		assert(3 == $N.dgraph.order(), "a, b, & x identified as instances");
		
		
		var tags = $N.getTags(a);
		
		assert(tags.length==3);
		assert(_.contains(tags,'trust'));
		assert(_.contains(tags,'y'));
		assert(_.contains(tags,'x'));
		
		$N.add(class1);
		
		a.addTag("Class1");
		$N.add(a);
		
		
		tags = $N.getTags(a);
		
		assert(tags.length === 4, 'a now has Class1 tag');
		assert(tags.indexOf('Class1')!==-1);
		
		
		
	});
	
});

/*
test("Trust Network", function() {
    var $N = new Ontology(true);
    $N.graphDistanceTag = [ "Trust" ];
    
    
    var trust = new nobject("Trust");
    trust.extend = [];
    $N.add(trust);
    
    var a = new nobject("a");
    a.author = a.id;
    
    var b = new nobject("b");
    b.author = b.id;
    
    var ab = new nobject("a trust b");
    ab.author = ab.subject = a.id;
    ab.addTag("Trust").add("object", "b");
    
    $N.add(a);
    $N.add(ab);
    $N.add(b);       
    
    strictEqual(1, $N.dgraph.edges().length, "implied trust edge from a->b");

    var ba = new nobject("b trust a");
    ba.author = ba.subject = b.id;
    ba.addTag("Trust").add("object", "a");
    
    $N.add(ba);
    strictEqual(2, $N.dgraph.edges().length, "updated trust, b->a");
    
    $N.remove(ab);    
    strictEqual(1, $N.dgraph.edges().length, "trust removed from a->b");
    
    $N.remove(ba);
    strictEqual(0, $N.dgraph.edges().length, "trust removed from b->b");

    $N.add(ba);
    strictEqual(1, $N.dgraph.edges().length, "trust added from a->b");

    strictEqual(undefined, $N._graphDistance['Trust'], "Trust distance not cached yet");
    ok($N.getGraphDistances("Trust"), "trust network calculated");
    ok($N._graphDistance['Trust'], "Trust distance cached");   

    $N.add(ab);    
    strictEqual(2, $N.dgraph.edges().length, "updated trust, b->a");
    strictEqual(undefined, $N._graphDistance['Trust'], "Trust distance invalidated");
    ok($N.getGraphDistances("Trust"), "trust network re-calculated");

    
    $N.remove(ba);    
    strictEqual(1, $N.dgraph.edges().length, "updated trust, b->a");
    strictEqual(undefined, $N._graphDistance['Trust'], "Trust distance invalidated");
    ok($N.getGraphDistances("Trust"), "trust network re-calculated");
    
    var userNodeFilter = function(n) { return n.author === n.id; };

    strictEqual(1, $N.getGraphDistance("Trust", userNodeFilter, "a", "b"), "correct graph distance calculation = 1 between directly connected");
    strictEqual(Infinity, $N.getGraphDistance("Trust", userNodeFilter, "b", "a"), "correct graph distance calculation = Infinity when no connection exist");

    $N.add(ba);
    
    strictEqual(1, $N.getGraphDistance("Trust", userNodeFilter, "b", "a"), "correct graph distance calculation = Infinity when no connection exist");
    
    //TODO test attempt at setting trust for someone other than self, which should fail
});

test("Directed Graph inout", function() {
    var $N = new Ontology(true);        
    var a = new nobject("a");
    var c = new nobject("c");
    var d = new nobject("d");
    
    a.inout = {
        'c': {
            'd': "linked"
        }
    };
    
    $N.addAll([a,c,d]);
    
    strictEqual(3, $N.dgraph.order());
    strictEqual(1, $N.dgraph.edges().length, "one edge defined");
    strictEqual("linked", $N.dgraph.edge( $N.dgraph.edges()[0] ), "one edge defined");
    strictEqual("c", $N.dgraph.source( $N.dgraph.edges()[0] ), "correct source");
    strictEqual("d", $N.dgraph.target( $N.dgraph.edges()[0] ), "correct target");
        
    delete a.inout;
    $N.add(a);
    strictEqual(0, $N.dgraph.edges().length, "after c declares no inout's, zero edges remain");

    a.inout = {
        'c': {
            'd': "linked"
        }
    };
    $N.add(a);
    strictEqual(1, $N.dgraph.edges().length, "one edge defined");

    $N.remove(a);
    strictEqual(0, $N.dgraph.edges().length, "zero edge defined after removing node");
   
    a.inout = {
        'c': {
            'b': "linked",
            'd': "linked"
        }
    };
    $N.add(a);
    strictEqual(2, $N.dgraph.edges().length, "two edges defined");
    strictEqual(2, $N.dgraph.outEdges('c').length, "c has 2 outedges");
    strictEqual(1, $N.dgraph.inEdges('b').length, "b has 1 inedge");
    
});

test("Undirected Graph", function() {
    var $N = new Ontology(true);        
    var a = new nobject("a");
    var b = new nobject("b");

    a.with = {
        "b": 1
    };
    
    $N.add(a).add(b);
    strictEqual(1, $N.ugraph.edges().length, "Ugraph has 1 undirected edge");
    strictEqual(0, $N.dgraph.edges().length, "Dgraph has 0 edges");

    b.with = {
        "a": 0.5
    };
    
    $N.add(b);
    strictEqual(1, $N.ugraph.edges().length, "After update, ugraph has still has 1 undirected edge");
    strictEqual('a`b', $N.ugraph.edges()[0], "Ugraph edge has value of 1.0, the max of the strengths");
    strictEqual(1.0, $N.ugraph.edge( $N.ugraph.edges()[0] ).a, "Ugraph edge value, from a");
    strictEqual(0.5, $N.ugraph.edge( $N.ugraph.edges()[0] ).b, "Ugraph edge value, from b");

    delete a.with;
    $N.add(a);
    strictEqual(1, $N.ugraph.edges().length, "After update, ugraph has still has 1 undirected edge");
    strictEqual(undefined, $N.ugraph.edge( $N.ugraph.edges()[0] ).a, "Missing ugraph edge value, from a");
    strictEqual(0.5, $N.ugraph.edge( $N.ugraph.edges()[0] ).b, "Ugraph edge value, from b");
    
    
    delete b.with;
    $N.add(b);
    strictEqual(0, $N.ugraph.edges().length, "After update, ugraph has 0 undirected edge");

    a.with = { "b": 1 };
    $N.add(a);
    strictEqual(1, $N.ugraph.edges().length, "After update, ugraph has still has 1 undirected edge");

    $N.remove(a).remove(b);
    strictEqual(0, $N.ugraph.edges().length, "No edges after all objects removed");
});
*/