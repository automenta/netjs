//http://earthquake.usgs.gov/earthquakes/feed/v1.0/atom.php
//http://earthquake.usgs.gov/earthquakes/catalogs/

//Past 7 Days - M 5+ earthquakes 
//http://earthquake.usgs.gov/earthquakes/catalogs/eqs7day-M5.xml

//http://www.emsc-csem.org/#2
//http://quakes.globalincidentmap.com/

exports.plugin = function($N) {
    var _ = require('lodash');

    return {
        name: 'OpenNARS Interface',
        description: 'Strong AI Logic-engine',
        options: {},
        version: '1.0',
        author: 'https://code.google.com/p/open-nars/',

        start: function(options) {
            //https://code.google.com/p/open-nars/wiki/InputOutputFormat
            
            //TODO: ues /object/latest/:num/nal
            $N.httpserver.get('/nal/object/latest/:num', function(req, res) {
                var maxObjects = parseInt(req.params.num);
                
                res.set('Content-type', 'text/json; charset=UTF-8');
                res.set('Transfer-Encoding', 'chunked');

                $N.getLatestObjectsStream(maxObjects, function(o) {
                    if ($N.objCanSendTo(o, null)) {
                        res.write(netentionToNARS(o));
                    }	
                }, function() {
                    res.end();				
                });

            });
            var isDigit = (function() {
              var re = /^\d$/;
              return function(c) {
                return re.test(c);
              }
            }());

            function encodeNARSTerm(n) {
                var r = encodeURIComponent(n);
                r = r.replace(/%20/g, '_');
                //- _ . ! ~ * ' ( )
                r = r.replace(/\./g, '_p');
                r = r.replace(/\-/g, '_d');
                r = r.replace(/\//g, '_s');
                r = r.replace(/\~/g, '_w');
                r = r.replace(/\*/g, '_a');
                r = r.replace(/\'/g, '_p');
                r = r.replace(/\(/g, '_b');
                r = r.replace(/\)/g, '_c');
                r = r.replace(/\*/g, '_a');
                r = r.replace(/\%/g, '__');

                if (isDigit(r[0])) {
                    r = '_' + r;
                }
                return r;                
            }
            
            var includedProperty = { };
            
            function netentionToNARS(o) {
                var statements = [];
                
                var termID = encodeNARSTerm(o.id);
                if (o.name) {
                    var termName = encodeNARSTerm(o.name) || "Untitled";                    
                    statements.push(
                        "<(*," + termName + "," + termID + ") --> NAME>. %1.00;0.79%"
                    );
                    
                    var nameTokens = _.unique(o.name.split(" "));
                    nameTokens.forEach(function(n) {
                        n = n.trim();
                        if (n.length < 2) return;
                        var termWord = encodeNARSTerm(n);
                        var conf = 1.0 / nameTokens.length;
                        statements.push(
                            "<" + termName + " --> " + termWord + ">. %" + $N._n(conf,2) + ';1.00%'
                        );
                            
                    });
                }
                
                
                if (o.author) {
                    var termAuthor = encodeNARSTerm(o.author) || "Untitled";
                    statements.push(
                        "<(*," + termID + "," + termAuthor + ") --> AUTHOR>. %1.00;0.79%"
                    );
                }
                
                if (o.value) {
                    for (var i = 0; i < o.value.length; i++) {
                        var v = o.value[i];
                        var strength = v.strength || 1.0;
                        var valID = encodeNARSTerm(v.id);
                        if (v.value) {
                            //...
                        }
                        var freq = "1.00";
                        var conf = 0.79 + (0.2 * strength);
                        statements.push(
                            "<" + termID + " --> " + valID + ">. %" + freq + ';' + $N._n(conf,2) + '%'
                        );
                        if (!$N.isPrimitive(v.id)) {
                            if (!includedProperty[v.id]) {
                                var prop = $N.property[v.id];
                                if (prop) {
                                    var prim = encodeNARSTerm(prop.extend);
                                    statements.push(
                                        "<" + valID + " --> " + prim + ">. %1.00;0.79%"
                                    );
                                }
                                includedProperty[v.id] = true;
                            }
                        }
                        
                    }
                    
                }
                
                
                return statements.join("\n") + "\n";
            }
            
            /*            
            #load it
            i = 0; s=""; Data={}
            with open("json_expanded") as f:
                while 1==1:
                    buf=f.readline()
                    if not buf:
                        break
                    i=i+1
                    if i%2==0:
                        s+=buf
            try:
                exec "json="+s
            except:
                with open("json_expanded") as f:
                    exec "json="+f.read()

            #correct atoms function
            transform={}
            def makevalid(s):
                global transform
                newterm=s.replace(" ","_").replace("$","_").replace("#","_").replace(",","_").replace(":","_").replace("%","_")
                transform[s]=newterm
                return newterm

            #generate Narsese statements <name --> tag_i>.
            TAGS=[]
            for D in json:
                try:
                  for d in D["_tag"]:
                      TAGS+=[makevalid(d)]
                      s="<"+makevalid(D["name"])+"-->"+makevalid(d)+">."
                      if not makevalid(D["name"]) in makevalid(d):
                          if s not in Data.keys():
                            Data[s]=0
                          else:
                            Data[s]=Data[s]+1
                except: 
                    None

            #generate Narsese statements <(*,name,value) --> attribute>.
            for D in json:
                try:
                  for k in D.keys():
                      try:
                        value=makevalid(D[k]).replace(",",".")
                        s="<(*,"+makevalid(D["name"])+","+str(value)+") --> "+makevalid(k)+">."
                        if not makevalid(D["name"]) in makevalid(k) and not str(value) in makevalid(k):
                            if s not in Data.keys():
                              Data[s]=0
                            else:
                              Data[s]=Data[s]+1
                      except: 
                        None
                except:
                    None

            #write them to file with the confidence value according to how often they occur
            maxi=max(Data.values())
            with open('narsinput.txt', 'w') as f:
                for s in Data.keys():
                    val=Data[s]
                    confidence=0.79+0.2*val/maxi
                    f.write(s+" %1.00;"+str(confidence)+"%\n")
                for T in TAGS:
                    f.write("<?what --> "+T+">?\n");
                f.write("20000");

                        */

        },
        stop: function(netention) {
        }

    };
};
