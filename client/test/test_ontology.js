test("Object Lifecycle", function() {
    var $N = new Ontology();
        
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
        description: 'A test class',
        extend: [],
        value: [
            
            "testProperty",
            
            {   id: 'embeddedProperty',
                name: 'Embedded property, which adds to the ontology',
                extend: 'text'
            }
        ]
    };
    $N.add(class1);
    { 
        strictEqual($N.class[class1.id].id, class1.id, "class present in ontology");  
        ok($N.property['embeddedProperty'], "embedded property present in ontology");
        ok(class1.property['testProperty'], "class linked to previously defined test property");
        ok($N.classRoot['Class1'], "class identified as a root");
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
