function renderOLMap(s, o, v) {
    
    var e = uuid();
    $('<div style="width: 100%; height: 100%"/>').attr('id', e).appendTo(v);
            
    var target = e;
    var location = objSpacePointLatLng(s.myself());

    if (!location)  {
		//swap lat,lng
        location = configuration.mapDefaultLocation || [0,0];
	}
    
    var fromProjection = new OpenLayers.Projection("EPSG:4326"); // Transform from WGS 1984
    var toProjection = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection


    var m = new OpenLayers.Map({
        div: target,
        projection: fromProjection,
        displayProjection: toProjection
        //numZoomLevels: 12
    });


	document.getElementById(e).oncontextmenu = function(e){
	 e = e?e:window.event;
	 if (e.preventDefault) e.preventDefault(); // For non-IE browsers.
	 else return false; // For IE browsers.
	};

    
    
    var mapnik = new OpenLayers.Layer.OSM();
    var aerial = new OpenLayers.Layer.OSM("Open Aerial", ["http://otile1.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
                        "http://otile2.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
                        "http://otile3.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg",
                        "http://otile4.mqcdn.com/tiles/1.0.0/sat/${z}/${x}/${y}.jpg"]);


    var vector = new OpenLayers.Layer.Vector("Vectors", {
	});
    /*var markers =  new OpenLayers.Layer.Markers( "Markers",{
	} );*/
    
    m.vector = vector;
    
    m.addLayers([
        mapnik, aerial, vector //, gphy, gmap, gsat, ghyb, /*veroad, veaer, vehyb,*/ 
    ]);

	var oClick = new OpenLayers.Control.Click({eventMethods:{
	 'rightclick': function(e) {
		//		  alert('rightclick at '+e.xy.x+','+e.xy.y);
		var pixel = new OpenLayers.Pixel(e.xy.x,e.xy.y);
		var lonlat = unproject(m.getLonLatFromPixel(pixel));
		var n = objAddGeoLocation(objNew(), lonlat.lat, lonlat.lon);

		notify( { title: 'New Object', text: ('@ ' + _n(lonlat.lat) + ',' + _n(lonlat.lon)) } );
		newPopupObjectEdit( n );
		
	    //alert("Lat: " + lonlat.lat + " (Pixel.x:" + pixel.x + ")" + "\n" + "Lon: " + lonlat.lon + " (Pixel.y:" + pixel.y + ")" );
	 },

	 /*'dblclick': function(e) {
	  alert('dblclick at '+e.xy.x+','+e.xy.y);
	 },*/

	 'click': function(e) {
		//alert('click at '+e.xy.x+','+e.xy.y);
		//http://dev.openlayers.org/docs/files/OpenLayers/Feature/Vector-js.html#OpenLayers.Feature.Vector.atPoint
		// to select all coincident map icons on click
		var dx = 10;
		var dy = 10;
		var pixel = new OpenLayers.Pixel(e.xy.x,e.xy.y);
		var lonlat = m.getLonLatFromPixel(pixel);
		var dlonlat = m.getLonLatFromPixel(new OpenLayers.Pixel(e.xy.x+dx,e.xy.y+dy));
		var dlonlat = Math.max(Math.abs(lonlat.lon-dlonlat.lon), Math.abs(lonlat.lat-dlonlat.lat));
		//console.log(dlonlat);
		var f = vector.features;
		var clicked = [];
		for (var i = 0; i < f.length; i++) {
			var F = f[i];
			if (F.onScreen(true)) {
				if (F.atPoint(lonlat,dlonlat,dlonlat)) {
					if (F.uri)
						clicked.push(F.uri);
				}
			}
		}
		clicked = _.unique(clicked);
		newPopupObjectViews(clicked);
	 },
	/*
	 'dblrightclick': function(e) {
	  alert('dblrightclick at '+e.xy.x+','+e.xy.y);
	 }*/
	}});
	m.addControl(oClick);
	oClick.activate();

    
    function saveBounds() {
        /*later(function() {
            s.set('mapExtent', m.getExtent());            
        });*/
    }
    
    //m.events.register("moveend", m, saveBounds);
    //m.events.register("zoomend", m, saveBounds);
    
    var exm = s.get('mapExtent');
    if (exm) {
        //m.zoomToExtent(exm, true);
        m.zoomToMaxExtent();
    }
    else {
        var hh = project(new OpenLayers.LonLat(location[1], location[0]));    
        center(hh);
    }
    
    m.targetLocation = m.getCenter();

    m.addControl( new OpenLayers.Control.LayerSwitcher() );

    var select;

    
	/*
    vector.events.on({
        featureselected: function(event) {
            var feature = event.feature;
            var area = feature.geometry.getArea();
            var id = feature.attributes.key;
            //var output = "Item: " + id;// + " Area: " + area.toFixed(2);
            //console.log(feature, area, id, output);
            newPopupObjectView(feature.uri);
            //document.getElementById("output-id").innerHTML = output;

        }
    });
	*/
    
/*
    var df = new OpenLayers.Control.DragFeature(vector);
    m.addControl(df);
    df.activate();*/

    function center(oll) {
        m.setCenter(oll, 12, false, true);        
    }

    
    function unproject(x) {
        x.transform(toProjection, fromProjection);
        return x;
    }
    function project(x) {
        x.transform(fromProjection, toProjection);
        return x;
    }

    function createMarker(uri, lat, lon, rad, opacity, fill, iconURL) {
        var p = project(new OpenLayers.LonLat(lon, lat));
        var t = new OpenLayers.Geometry.Point(p.lon, p.lat /*location[1],location[0]*/);
        

		if (rad) {
			function fillString(f) {
				return 'rgb(' + (f.r * 256.0) + ', ' + (f.g * 256.0) + ', ' + (f.b * 256.0) + ')';
			}
			var style = {
			    fillColor: fillString(fill),
			    //strokeColor: '#fff',
			    fillOpacity: opacity,
			    //strokeOpacity: opacity,
			    strokeWidth: 0,
			    //view-source:http://openlayers.org/dev/examples/vector-features-with-text.html
		    };
		    var radMarker = new OpenLayers.Feature.Vector(
				OpenLayers.Geometry.Polygon.createRegularPolygon(
				t,
				rad,
				6,
				0), {}, style);
		    radMarker.uri = uri;
		    m.vector.addFeatures([radMarker]);
		}

        if (iconURL) {
			var style = {
				graphicWidth: 32,
				graphicHeight: 32,
				externalGraphic: iconURL
			}
		    var iconMarker = new OpenLayers.Feature.Vector(
				t /*OpenLayers.Geometry.Polygon.createRegularPolygon(
				t,
				rad,
				6,
				0)*/, {}, style);
		    iconMarker.uri = uri;
		    m.vector.addFeatures([iconMarker]);
        }

    }

    m.location = function() {
        return unproject(m.getCenter());  
    };
    
    // Register the function for the animatio
    /*var interval = window.setInterval(function(){
        animate(tg);
    },150);*/
    
    var isVisible = function() {
        return $('#' + e).is(':visible');
    };
    
    var animate = function(feature) {
        feature.data.size += 1;
    
        var x = feature.data.size;
        
        /*feature.style = {
            pointRadius: Math.random()*10.0, //feature.data.size,  // I will change only the size of the feature
            fillColor: "#ffcc66",
            fillOpacity: Math.sin(x/10.0),
            strokeColor: "#ff9933",
            strokeWidth: Math.random()*10.0,
            graphicZIndex: 1
        };*/
        
        feature.style.strokeWidth = Math.random()*10.0; 
        
    
       feature.layer.redraw();
    
        if (!isVisible()) {
            window.clearInterval(interval);
        }
    };

    var kmllayers = [];
    
    function addKMLLayer(url) {
        
        var kml = getKMLLayer(url);
        m.addLayer(kml);      
        
        kmllayers.push(kml);
        
        
        kml.events.on({
            featureselected: function(event) {
                var feature = event.feature;
                var area = feature.geometry.getArea();
                var id = feature.attributes.key;                
                
                newPopupObjectView({
                    uri: uuid(),
                    name: feature.attributes.name,
                    text: feature.attributes.description
                });
              //feature.geometry.getBounds().getCenterLonLat(),
              //'<div class="markerContent">'+feature.attributes.description+'</div>',
            }
        });
        
        return kml;
    }
    
    
    function renderMapFeature(x, r) {
        var k = x.id;
        
        if (objHasTag(x, 'web.KML')) {
            addKMLLayer(x.kmlURL);
            return;    
        }

		renderMapMarker(x, createMarker);

    }
    
    function updateMap() {
        if (select) {
            select.deactivate();
            m.removeControl(select);
            select.destroy();
        }

        m.vector.removeAllFeatures();
        
        for (var i = 0; i < kmllayers.length; i++) {
            kmllayers[i].destroy();
        }
        kmllayers = [];
        
        var ollayers  = [vector];
                         
        var layer = s.layer();                
        if (layer.kml) {
            for (var i = 0; i < layer.kml.length; i++) {
                var l = addKMLLayer(layer.kml[i]);                
                ollayers.push(l);
            }
        }

	    currentMapNow = Date.now();        
        
        renderItems(o, v, MAP_MAX_ITEMS, function(s, v, xxrr) {
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];
                renderMapFeature(x, r);
            }        
        });
        
        /*select = new OpenLayers.Control.SelectFeature(ollayers, {
            toggle: true,
            clickout: true
        });
        m.addControl(select);    
        select.activate();*/

		m.onChange = function() {
		    updateMap();
		};
    }

    updateMap();    
    
    return m;
}

function getKMLLayer(kmlurl) {
    //use an layer cache with explicit expiration,
    //so that when this function gets here again, it doesn't need to re-fetch unless its past the explicit expiration
    //if (!window.kmlLayer) window.kmlLayer = { };
    
    //var kml = window.kmlLayer[kmlurl];
    //if (!kml) {
        var kml =new OpenLayers.Protocol.HTTP({
            //url: getProxyURL(kmlurl),
            url: kmlurl,
            format: new OpenLayers.Format.KML({
                extractStyles: true,
                extractAttributes: true,
                maxDepth: 0,
            })            
        });
        
//        window.kmlLayer[kmlurl] = kml;
//    }
    
    return new OpenLayers.Layer.Vector("KML", {
        strategies: [new OpenLayers.Strategy.Fixed()],
        protocol: kml
    });
}

