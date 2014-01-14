var request = require('request'),
    unzip = require('unzip'),
    fs = require('fs'),
    xml2js = require('xml2js'),
    crypto = require('crypto');

function getRandomFilename() {
    return crypto.randomBytes(16).toString('hex');
}

//FROM: https://gist.github.com/1722941
function removeRecurse(path,cb) {
    var self = this;

    fs.stat(path, function(err, stats) {
      if(err){
        cb(err,stats);
        return;
      }
      if(stats.isFile()){
        fs.unlink(path, function(err) {
          if(err) {
            cb(err,null);
          }else{
            cb(null,true);
          }
          return;
        });
      }else if(stats.isDirectory()){
        // A folder may contain files
        // We need to delete the files first
        // When all are deleted we could delete the 
        // dir itself
        fs.readdir(path, function(err, files) {
          if(err){
            cb(err,null);
            return;
          }
          var f_length = files.length;
          var f_delete_index = 0;

          // Check and keep track of deleted files
          // Delete the folder itself when the files are deleted

          var checkStatus = function(){
            // We check the status
            // and count till we r done
            if(f_length===f_delete_index){
              fs.rmdir(path, function(err) {
                if(err){
                  cb(err,null);
                }else{ 
                  cb(null,true);
                }
              });
              return true;
            }
            return false;
          };
          if(!checkStatus()){
            for(var i=0;i<f_length;i++){
              // Create a local scope for filePath
              // Not really needed, but just good practice
              // (as strings arn't passed by reference)
              (function(){
                var filePath = path + '/' + files[i];
                // Add a named function as callback
                // just to enlighten debugging
                removeRecurse(filePath,function removeRecursiveCB(err,status){
                  if(!err){
                    f_delete_index ++;
                    checkStatus();
                  }else{
                    cb(err,null);
                    return;
                  }
                });
    
              })()
            }
          }
        });
      }
    });
  }

function endsWith(str, p) {return (str.match(p+"$")==str)}

function parseKML(data) {

	var parser = new xml2js.Parser();
	
    parser.parseString(data, function (err, result) {
    	
        function processFolder(F) {
        	
            var fName = F.name;
            
            if (F.Placemark!=undefined) {
                for (var nl = 0; nl < F.Placemark.length; nl++) {
                	var p = F.Placemark[nl];
                	
                	
                	var coord = null;
                	if (p.Point!=undefined) {
                		coord = p.Point.coordinates;
                	}
                	
                	console.log('PLACEMARK ' + p.name, coord);
                	
                }
            	
            }
            
            if (F.NetworkLink!=undefined) {
                for (var nl = 0; nl < F.NetworkLink.length; nl++) {
                    var NL = F.NetworkLink[nl];
                    
                    console.log(fName + '.' + NL.name);
                    
                    var u = '';
                    if (NL.Url!=undefined) {
                        u = NL.Url[0].href[0];
                    }
                    else if (NL.Link!=undefined) {
                        u = NL.Link[0].href[0];
                    }
                    
                    if ((u.indexOf('kml')!=-1) || (u.indexOf('Kml')!=-1)) {
                        console.log('  layer = ' + u);                            
                    	parseKMLURL(u);
                    }
                    else if (u.indexOf('kmz')!=-1) {
                        console.log('  kmz = ' + u);                                
                    }
                    else {
                        console.log('  unknown = ' + u);
                    }
                }
            }

            if (F.Folder!=undefined) {
                for (var ff = 0; ff < F.Folder.length; ff++) {
                    var FF = F.Folder[ff];
                    processFolder(FF);
                }                    
            }
        }
        if (result.kml.Document.Folder!=undefined) {
	        for (var rf = 0; rf < result.kml.Document.Folder.length; rf++) {                    
	            processFolder(result.kml.Document.Folder[rf]);
	        }        	
        }
        
        if (result.kml.Folder!=undefined) {
	        for (var rf = 0; rf < result.kml.Folder.length; rf++) {                    
	            var F = result.kml.Folder[rf];
	            processFolder(F);
	        }
        }

//            console.dir(result.kml.Folder[0].NetworkLink[0].name);
//            console.dir(result.kml.Folder[0].NetworkLink[0].Link);
//            console.dir(result.kml.Folder[0].Folder);

    });
	
}

function parseKMLURL(kmlUrlPath) {
	var r = request(kmlUrlPath, function (error, response, body) {
	  if (!error && response.statusCode == 200) {
		    parseKML(body);
	  }
	  else {
		  console.error(kmlUrlPath + ' unreachable');
	  }
	});
}

function parseKMLFile(kmlfilePath) {
    fs.readFile(kmlfilePath, function(err, data) {
    	if (err) {
    		console.log(err);
    	}
    	else {
    		parseKML(data);
    	}
    });
    
}
function parseKMZ(kmzurl) {

    var outputFolder = '/tmp/kmz-' + getRandomFilename();
    
    fs.mkdir(outputFolder);

    request(kmzurl).pipe(unzip.Extract({ path: outputFolder  }))
      .on("error", function (er) {
        console.error(er);
      })
      .on("end", function () {

        parseKMLFile(outputFolder + '/doc.kml');
        
        removeRecurse(outputFolder, function() { });
        

      });
}


//parseKMZ('http://rezn8d.com/trdb/trdb-9001.kmz');
parseKMLFile('/home/me/Downloads/KML_Samples.kml');
