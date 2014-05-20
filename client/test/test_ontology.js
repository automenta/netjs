test("Ontology", function() {
    var $N = new Ontology(true);
        
    var data = new nobject();
    ok(data, "new nobject()");
    
    $N.add(data);
    {
        strictEqual($N.object[data.id].id, data.id, "object inserted");
        strictEqual($N.object[data.id].id, data.id, "object identified as instance");
        ok(data._instance, "object marked as instance");
    }
    
    
    
    $N.remove(data);
    {  strictEqual($N.object[data.id], undefined, "object removed");    }
    
    $N.add(data); $N.add({id: data.id, removed: true});
    {  strictEqual($N.object[data.id], undefined, "object removed via removal object");  }

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
    ok( objIsProperty(prop1), "detect property as a property");
    $N.add(prop1);
    {  strictEqual($N.property[prop1.id].id, prop1.id, "property present in ontology");  }
    
    var class1 = {
        id: 'Class1',
        description: 'A test class, with value in array form',
        extend: [],
        value: [            
            "testProperty"/*,            
            {   id: 'embeddedProperty',
                name: 'Embedded property, which adds to the ontology',
                extend: 'text'
            }*/
        ]
    };
    $N.add(class1);
    { 
        strictEqual($N.class[class1.id].id, class1.id, "class present in ontology");  
        ok(class1.property['testProperty'], "class linked to previously defined test property");
        ok($N.classRoot['Class1'], "class identified as a root");
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
        ok($N.property['testProperty2'], "embedded property present in ontology");
        ok(class2.property['testProperty2'], "class linked to previously defined test property");
        ok(!$N.classRoot['Class2'], "class2 not identified as a root");
    } 
    
    
    var subclass1 = {
        id: 'SubClass1',
        extend: ['Class1']
    };
    $N.add(subclass1);
    {
        strictEqual($N.class[subclass1.id].id, subclass1.id, "subclass present in ontology");
        strictEqual(subclass1.class['Class1'], class1, "subclass .class field");
        strictEqual(class1.subclass['SubClass1'], subclass1, "class .subclass field");
        ok(!$N.classRoot['SubClass1'], "class identified as a root");
    }

    //test tag indexing
    var data2 = new nobject().addTag('Class1');
    $N.add(data2);
    {   strictEqual( _.keys($N.tagged['Class1'])[0], data2.id, "adding instance indexes by its tags" );  }
    
    $N.remove(data2);
    {   strictEqual( _.keys($N.tagged['Class1']).length, 0, "removing instance unindexes by its tags" );  }
    
    
});


test("Directed Graph", function() {
    var $N = new Ontology(true);        
    var a = new nobject("a");
    var b = new nobject("b");

    $N.add(a).add(b);    
    strictEqual(2, $N.dgraph.order(), "Digraph has 2 nodes after adding 2");
    strictEqual(2, $N.ugraph.order(), "UGraph has 2 nodes after adding 2");
    
    a.value = [ { id: 'html', value: '..' }];    
    $N.add(a);    
    strictEqual(2, $N.dgraph.order(), "Digraph has same number of nodes after reindexing existing object");
    
    $N.remove(a);
    strictEqual(1, $N.dgraph.order(), "Digraph has 1 node after removing 1 node");
    
    a.out = { "b": 1};
    $N.add(a);
    strictEqual(1, $N.dgraph.edges().length, "Digraph has 1 edge after adding node with outgoing edge");    
    strictEqual(0, $N.ugraph.edges().length, "Ugraph has 0 edges after adding node with outgoing edge");
    
    var c = new nobject("c");
    a.out = { "c": true };
    $N.add(a);
    $N.add(c);
    strictEqual(3, $N.dgraph.order());
    strictEqual(1, $N.dgraph.edges().length, "the one existing edge replaced");
    strictEqual(true, $N.dgraph.edge("a|c"), "edge value");
    strictEqual("a", $N.dgraph.predecessors("c")[0], "a is predecessor of c");
        
    //test in edges
    c.in = { "b": 1 };
    $N.add(c);
    strictEqual(2, $N.dgraph.edges().length, "additional edge, b->c");
    
    delete c.in;
    $N.add(c);
    strictEqual(1, $N.dgraph.edges().length, "removed income edge");
    
    //test removal of all nodes, should be no edges
    $N.remove(a).remove(b).remove(c);
    strictEqual(0, $N.dgraph.edges().length, "no edges when no nodes in graph");
    
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
