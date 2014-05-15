/** true if its first value is a reference to the Class tag */
function objIsClass(x) {
    if (x.extend)
        if (Array.isArray(x.extend))
           return true;
   return false;
}

/** true if its value consists of only one primitive tag (with no datavalue) */
function objIsProperty(x) {
    if (x.extend)
        if (isPrimitive(x.extend))
           return true;
   return false;   
}

/** an interface for interacting with nobjects and ontology */
var Ontology = function() {
    var that = this;        
    
    //resets to empty state
    this.clear = function() {
        //indexed by id (URI)
        that.object = { };        
        that.tagged = { };  //index of object tags

        that.instance = { };
        that.property = { };
        that.class = { };
        that.classRoot = { };   //root classes        
        
        that.primitive = {
          'default': { },
          
          'instance': { },
          'property': { },
          'class': { },
          
          'integer': { },
          'real': { },
          'text': { },
          'html': { },
          'object': { },
          'spacepoint': { }
          //...
        };
    };
    this.clear();
    
    this.add = function(x) {
        //updates all cached fields, indexes
        //can be called repeatedly to update existing object with that ID
                
        if (x.removed) {        
            return that.remove(x);
        }
        
        that.object[x.id] = x;
        
        if (objIsClass(x)) {
            that.class[x.id] = x;
            x._class = true;
            delete that.property[x.id]; delete x._property;
            delete that.instance[x.id]; delete x._instance;
            
            x.property = { };
            x.class = { };
            x.subclass = { };
            
            if (x.value) {
                for (var i = 0; i < x.value.length; i++) {
                    var v = x.value[i];
                    
                    if (objIsProperty(v)) {
                        //embedded property
                        that.add(v);
                        v = v.id;
                    }
                    
                    if (typeof v === "string") {
                        var existingProperty = that.property[v];
                        if (existingProperty)
                            x.value[i] = x.property[v] = existingProperty;
                        else
                            console.error('Class', x.id, 'missing property', k);
                    }
                    
                }                
            }
            if (x.extend.length == 0)
                that.classRoot[x.id] = x;
            else {
                for (var i = 0; i < x.extend.length; i++) {
                    var v = x.extend[i];
                    var c = that.class[v];
                    if (c) {
                        x.class[v] = c;
                        c.subclass[x.id] = x;
                    }
                    else {
                        console.error('Class', x.id, 'extends missing class', v);  
                    }
                }
            }
        }
        else if (objIsProperty(x)) {
            that.property[x.id] = x;
            x._property = true;
            delete that.class[x.id];    delete x._class;
            delete that.instance[x.id]; delete x._instance;
        }
        else {
            that.instance[x.id] = x;
            x._instance = true;
            delete that.class[x.id];    delete x._class;
            delete that.property[x.id]; delete x._property;
            
            indexInstance(x);
        }
        
//        that.update(x);
        
        return that;        
    };
    
//    this.update = function(x) {
//        
//    };
    
    function indexInstance(x) {
        var tags = objTags(x, false);
        tags.forEach(function(t) {
           if (!that.tagged[t]) 
               that.tagged[t] = { };
           that.tagged[t][x.id] = x;
        });
        
        //TODO index author, replyTo
    }
    function unindexInstance(x) {
        var tags = objTags(x, false);
        tags.forEach(function(t) {
           if (that.tagged[t]) 
               delete that.tagged[t][x.id];           
        });        
    }
    
    this.remove = function(x) {
        if (typeof x == "object") {            
            x = x.id;
        }
        var existingObject = that.object[x];
        if (!existingObject)
            return;
        
        unindexInstance(existingObject);
        
        delete that.object[x];
        delete that.class[x];
        delete that.property[x];
        delete that.instance[x];
        return that;
    };
    
    //.searchOntology(query)
    //.getGraph(propertyList,options)
        //extracts a graph via the object values of certain types; useful for computing trust and other networks
};
