var MAP_MAX_ITEMS = 500;

var currentMapNow = null;

function getProxyURL(u) {
    return '/http/' + encodeURIComponent(u);
}

function renderMapMarker(x, createMarkerFunction) {
	if (!currentMapNow) {
		console.err('set currentMapNow before calling renderMapMarker');
		return;
	}

    var s = objSpacePoint(x);
	if (!s) return;
    var fill = {
		r: 0.75,
		g: 0.75,
		b: 0.75
	};

    var op = 0.5;
    var rad = null;
    var iconURL = undefined;
    
    var ww = x.modifiedAt || x.createdAt || null;
    if (ww) {
        op = 0.25 + 0.5 * Math.exp( -((currentMapNow - ww) / 1000.0 / 48.0 / 60.0 / 60.0) );
    }

    iconURL = getTagIcon(x);
	if (!iconURL)
		iconURL = defaultIcons['unknown'];
    
    var tagStyling = {
        'Earthquake' : function() {
            var mag = objFirstValue(x,'eqMagnitude',1);
            rad = 100000 + (mag - 4.0)*700000;
            op *= 0.5;                    
            //fill = '#b33';
			fill.r = 256;
			fill.g = 75;
			fill.b = 0;
        },
        'NuclearFacility' : function() {
            rad = 7000;
            op = 0.3;
            //fill = '#ff0';                    
        },
        'Human' : function() {
            rad = 200;
            op = 0.25;                    
        },
        'Message' : function() {
            //fill = '#55f';
            rad = 50;                    
        },
        'GoalCentroid' : function() {
            rad = 200;
            op = 0.3;
            //fill = '#fa3';                    
        },
        'Item' : function() {
            rad = 50;
            op = 0.2;
            //fill = '#3af';                    
        },          
    };


    var tags = objTags(x);
    for (var i = 0; i < tags.length; i++) {
        var tt = tags[i];
        if (tagStyling[tt])
            tagStyling[tt]();
    }
    
    createMarkerFunction(x.id, s.lat, s.lon, rad, op, fill, iconURL);
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

var map2d = true;

function renderMap(s, o, v) {
    var mm = { };
    
    var typeSelect;
    
    function updateMap() {
        v.empty();

        if (typeSelect)
            map2d = (typeSelect.val() === '2D');
        else
            map2d = configuration.defaultMapMode2D;

        var mapControl = newDiv();
        typeSelect = $('<select/>');
        typeSelect.append('<option ' + (map2d ? 'selected' : '') + '>2D</option>');
        typeSelect.append('<option ' + (!map2d ? 'selected' : '') + '>3D</option>');
        typeSelect.change(function(x) {
            later(function() {
               updateMap();            
            });
        });

        var planetSelect = $('<select/>');
        planetSelect.append('<option>Earth</option>');
        planetSelect.append('<option>Moon</option>');
        planetSelect.append('<option>Mars</option>');

		mapControl.append('<span class="readwrite">Right click to Add</span>');
        mapControl.append(typeSelect);
        mapControl.append(planetSelect);

        mapControl.addClass('MapControl');
        
        
        if (map2d) {
            /*var m = renderOLMap(s, o, v);
            mm.onChange = m.onChange;       
            mm.location = m.location;*/

            var m = renderLeafletMap(s, o, v);
			mm.onChange = m.onChange;
        }
        else {
			var m = renderCesiumMap(o, v);
			if (m.onChange)
				mm.onChange = m.onChange;
        }
        
        v.append(mapControl);
        
    }
    updateMap();
                
    return mm;
}

function renderLeafletMap(s, o, v) {
    var e = uuid();
	var mapdiv = $('<div style="width: 100%; height: 100%"/>').attr('id', e).appendTo(v);

	var tooltip = $('<div class="lltooltip"/>');
	tooltip.appendTo(mapdiv);
	tooltip.hide();

	var map = L.map(e, {
	}).setView( configuration.mapDefaultLocation || [0,0], 11);

	/*L.tileLayer('http://{s}.tile.cloudmade.com/{key}/22677/256/{z}/{x}/{y}.png', {
		attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade',
		key: 'BC9A493B41014CAABB98F0471D759707'
	}).addTo(map);*/

	//http://leaflet-extras.github.io/leaflet-providers/preview/index.htmlfile
	var baseLayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
		attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
	});
	baseLayer.addTo(map);
	

	var testIcon = L.icon({
		iconUrl: 'icon/unknown.png',
		iconSize: [32, 32],
		iconAnchor: [16, 16],
		popupAnchor: [0, -28]
	});

	var icons = { };
	function getIcon(i) {
		if (!i) return testIcon;
		if (icons[i])
			return icons[i];
		else {
			icons[i] = L.icon({
					iconUrl: i,
					iconSize: [32, 32],
					iconAnchor: [16, 16],
					popupAnchor: [0, -28]
			});
			return icons[i];
		}
	}

	var featureSelect = L.featureSelect();
	featureSelect.addTo(map);

	var nobjectLayer = L.layerGroup([]);
	nobjectLayer.addTo(map);

	map.layers = { };

	map.on('click', function(e) {
		var p = e.latlng;

		//https://github.com/openplans/Leaflet.FeatureSelect/blob/gh-pages/js/feature-select.js
		featureSelect.checkIntersections(e.layerPoint, p, _.values(map.layers).concat(nobjectLayer), function(s) {
			if (s.length == 0) return;

			var nobs = s.map(function(g) {
				if (g.object) {		
					return g.object;
				}
				else if (!g.feature)
					return;

				var x = objNew();
				x.setName('point');

				var p = g.feature.properties;
				if (p) {
					x.setName(p.name);
					delete p.name;
					x.addDescription(JSON.stringify(p, null, 4));
				}
				return x;
			});

			newPopupObjectViews(nobs);

		} );

	});
	map.on('contextmenu', function(e) {
		var p = e.latlng;
		//		  alert('rightclick at '+e.xy.x+','+e.xy.y);
		
		var n = objAddGeoLocation(objNew(), p.lat, p.lng);

		$.pnotify( { title: 'New Object', text: ('@ ' + _n(p.lat) + ',' + _n(p.lng)) } );
		newPopupObjectEdit( n );
	});

	function onEachFeature(feature, layer) {
		var popupContent = "";

		if (feature.properties) {
			var name = feature.properties.name || '';
			var desc = feature.properties.description || '';

			popupContent = '<b>' + name + '</b><br/>' + desc;
		}

		//layer.bindPopup(popupContent);
	}

	function markerHover(m, label) {
		m.on('mouseover', function(e) {
			later(function() {
				tooltip.css('left', e.originalEvent.clientX);
				tooltip.css('top', e.originalEvent.clientY);

				tooltip.html(label.substring(0, 40));
				tooltip.show();
			});
		});
		m.on('mouseout', function(e) {
			later(function() {
				tooltip.hide();
			});
		});
	}

	function addLayer(tag, strength, onAdded) {
		var T = $N.getTag(tag);

		if (T.geoJSON) {
			$.getJSON(T.geoJSON, function(x) {

				T.geoJSONdata = x; //cache it there

				var g = L.geoJson(x, {

					//TODO set projection
					//coordsToLatLng( <Array> coords )	Function that will be used for converting GeoJSON coordinates to LatLng points (if not specified, coords will be assumed to be WGS84 — standard [longitude, latitude] values in degrees).

					/*style: function (feature) {
						return feature.properties && feature.properties.style;
					},*/

					//onEachFeature: onEachFeature,

					pointToLayer: function (feature, latlng) {
						/*var m = L.circleMarker(latlng, {
							radius: 8,
							fillColor: "#ff7800",
							color: "#000",
							weight: 1,
							opacity: 1,
							fillOpacity: 0.8
						});*/

						var m = L.marker(latlng, {
							icon: testIcon,
							clickable: false
						});

						if (feature.properties) {
							var name = feature.properties.name;							

							if (name) {
								markerHover(m, name);
							}
						}

						return m;
					}
				});

				g.baseAdd = g.onAdd;
				g.baseRemove = g.onRemove;
				g.imageOverlays = [];

				g.onAdd = function(map) {
					var result = g.baseAdd(map);
					if (x.overlays) {
						for (var i = 0; i < x.overlays.length; i++) {
							var O = x.overlays[i];
							var iconurl = O.geometry.icon;
							var latlonbox = O.geometry.latlonbox;  //n,e,s,w
							var rotate = O.geometry.rotate;

							var io = L.imageOverlay(iconurl, [ [ latlonbox[2], latlonbox[3] ], [ latlonbox[0], latlonbox[1] ] ]);
							g.imageOverlays.push(io);
							io.addTo(map);
						}
					}
					return result;
				};
				g.onRemove = function(map) {
					var result = g.baseRemove(map);
					for (var i = 0; i < g.imageOverlays.length; i++)
						map.removeLayer(g.imageOverlays[i]);
					return result;
				};

				g.addTo(map);
				onAdded(g);
			});


		}
		else if (T.tileLayer) {
			var template = T.tileLayer;
			var options = {
				attribution: ''
			};
			if (typeof template != "string") {
				options = template;
				template = options.template;

				var d = new Date(Date.now() - 24 * 60 * 60 * 1000  /* 24hrs ago */);
				var m = d.getMonth()+1;
				var r = d.getDate()+1;
				if (m <=9 ) m = '0' + m;
				if (r <=9 ) r = '0' + r;
				options.time = d.getFullYear() + '-' + m + '-' + r;
			}
			if (options.reprojected) {
				if (options.format.indexOf("png")!=-1) {
					//put PNG layers above, since they usually contain transparent image that could see through to a solid JPG layer beneath
					options.zIndex = 101;
				}
				else
					options.zIndex = 100;
			}
			

			var tl = L.tileLayer(template, options);

			if (options.reprojected) {
				$.pnotify({title:"Map Re-projected", text:"The '" + T.name + "' layer uses an alternate map projection.  It may not appear aligned with other layers."});
				tl.reprojects = true;				
			}

			tl.setOpacity(strength);

			tl.addTo(map);
			onAdded(tl);
		}
		else if (T.dbpediaLayer) {
			//https://github.com/kr1/Leaflet.dbpediaLayer/
			var lay = L.dbPediaLayer({lang: 'en', includeCities: true})
			lay.addTo(map);
			onAdded(lay);
		}
		else {
		}

		return null;
	}

	function removeLayer(S) {
		var rm = map.layers[S];
		if (rm) {
			map.removeLayer(rm);
		}
		delete map.layers[S];			
	}

	function updateMap() {
		nobjectLayer.clearLayers();
        renderItems(o, v, MAP_MAX_ITEMS, function(s, v, xxrr) {
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];
                //renderMapFeature(x, r);
    			var s = objSpacePoint(x);
				if (s) {
					var m = L.marker([s.lat, s.lon], {
						icon: getIcon(getTagIcon(x)),
						clickable: false
					});
					m.object = x;
					markerHover(m, objName(m));
					nobjectLayer.addLayer(m);
				}
            }        
        });		

		var focus = $N.get('focus');
		var newLayersArray = focus ? focus.value : [];

		if (!newLayersArray) newLayersArray = [];

		var newlayers = { };

		for (var i = 0; i < newLayersArray.length; i++) {
			var A = newLayersArray[i];
			newlayers[A.id] = A.strength;
		}

		var subtracting = _.difference( _.keys(map.layers), _.keys(newlayers) );
		var adding = _.difference( _.keys(newlayers), _.keys(map.layers) );
		var same = _.union( _.keys(newlayers), _.keys(map.layers) );

		for (var i = 0; i < subtracting.length; i++) {
			var S = subtracting[i];
			removeLayer(S);
		}
		for (var i = 0; i < adding.length; i++) {
			var A = adding[i];
			addLayer(A, newlayers[A], function(added) {
				map.layers[A] = added;
				updateMap();
			});			
		}

		//update opacities
		var reprojects = 0;

		for (var i = 0; i < same.length; i++) {
			var S = same[i];
			var SL = map.layers[S];
			if (SL) {
				if (SL.reprojects) {
					reprojects++;
				}
			}
		}

		//TODO reproject geoJSON layers

		for (var i = 0; i < same.length; i++) {
			var S = same[i];
			var SL = map.layers[S];
			if (SL) {
				if (SL.setOpacity) {
					if (SL.reprojects)
						SL.setOpacity(newlayers[S]);
					else {
					
						if (!reprojects)
							SL.setOpacity(newlayers[S]);
						else {

							SL.setOpacity(0);
						}
					}
				}

				//TODO setZIndex(..)
			}
		}
		if (reprojects > 0) {
			baseLayer.setOpacity(0);
		}
		else {
			baseLayer.setOpacity(1.0);
		}

	}

	updateMap();

	map.onChange = function() {
	    updateMap();
	};

	return map;
}

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

		$.pnotify( { title: 'New Object', text: ('@ ' + _n(lonlat.lat) + ',' + _n(lonlat.lon)) } );
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


L.FeatureSelect = L.Class.extend({
  includes: L.Mixin.Events,

  options: {
    icon: L.divIcon({
      iconSize: [16, 16],
      iconAnchor: [8, 8],
      className: 'leaflet-feature-selector'
    }),
    selectSize: [16, 16],
    featureGroup: null
  },

  initialize: function (options) {
    L.setOptions(this, options);

    this.options.selectSize = L.point(this.options.selectSize);
  },

  addTo: function (map) {
    this._map = map;
    this._center = map.getCenter();

    this.layers = {};

    /*this._marker = L.marker(this._center, {
      icon: this.options.icon,
      clickable: false,
      zIndexOffset: 1000
    }).addTo(map);

    map.on('move', this._checkIntersections, this);*/

	/*
    this.options.featureGroup.on('layeradd', function(evt) {
      this._checkIntersections();
    }, this);
    this.options.featureGroup.on('layerremove', function(evt) {
      this._handleNoIntersection(evt.layer);
      this._checkIntersections();
    }, this);
	*/

    return this;
  },
	/*
  _handleIntersection: function(layer) {
    if (!this.layers[L.stamp(layer)]) {
      this.layers[L.stamp(layer)] = layer;

      this.justSelected.push(layer);
    }
  },

  _handleNoIntersection: function(layer) {
    if (this.layers[L.stamp(layer)]) {
      delete this.layers[L.stamp(layer)];
      this.justUnselected.push(layer);
    }
  },
	*/
  checkIntersections: function(epoint, point, layers, withSelected) {
    var selectBounds, selectBoundsCoords;

    this.justSelected = [];
    this.justUnselected  = [];

    var deltaBounds = L.latLngBounds(
      this._map.unproject([
        epoint.x + this.options.selectSize.x/2,
        epoint.y - this.options.selectSize.y/2
      ]),
      this._map.unproject([
        epoint.x - this.options.selectSize.x/2,
        epoint.y + this.options.selectSize.y/2
      ])
    );
	var dl = Math.max( Math.abs(deltaBounds.getWest() - deltaBounds.getEast()), Math.abs(deltaBounds.getNorth() - deltaBounds.getSouth()) );

	var southWest = L.latLng(point.lat-dl, point.lng-dl),
    	northEast = L.latLng(point.lat+dl, point.lng+dl);
    selectBounds = L.latLngBounds(southWest, northEast);


    selectBoundsCoords = L.rectangle(selectBounds).toGeoJSON().geometry.coordinates[0];

	var selected = [];
	for (var jj = 0; jj < layers.length; jj++) {
		var layerg = layers[jj];
		if (!layerg.getLayers) continue;

		var layergs = layerg.getLayers();
		for (var j = 0; j < layergs.length; j++) {
			var layer = layergs[j];
			  var type = "Point";
			  var coords = [0,0];
			  if (layer.feature) {
				  coords = layer.feature.geometry.coordinates,
				  type = layer.feature.geometry.type;
			  }
			  else {
				if (layer._latlng)
					coords = [ layer._latlng.lng, layer._latlng.lat ];
			  }
			  var len, i, intersects = false;

			  switch (type) {
				case 'Point':
				  coords = [ coords ];
				  // fall through
				case 'MultiPoint':
				  for (i=0; i<coords.length; i++) {
				    if (selectBounds.contains([coords[i][1], coords[i][0]]))  {
				    //if (selectBounds.contains(L.latLng([coords[i][1], coords[i][0]])))  {
				      intersects = true;
				    }
				  }
				  break;

				case 'LineString':
				  coords = [ coords ];
				  // fall through
				case 'MultiLineString':
				  for (i=0; i<coords.length; i++) {
				    if (selectBounds.intersects(layer.getBounds()) && this._lineStringsIntersect(selectBoundsCoords, coords[i])) {
				      intersects = true;
				    }
				  }
				  break;

				case 'Polygon':
				  coords = [ coords ];
				  // fall through
				case 'MultiPolygon':
				  for (i=0; i<coords.length; i++) {
				    if (selectBounds.intersects(layer.getBounds()) && this._pointInPolygon(this._center.lng, this._center.lat, coords[i][0])) {
				      intersects = true;
				    }
				  }
				  break;

			  }

			  if (intersects) {
				//this._handleIntersection(layer);
				selected.push(layer);
			  } //else {		//this._handleNoIntersection(layer);			  }

		}

    }

	withSelected(selected);

	/*
	if (this.justSelected.length) {
      this.fire('select', {
        layers: this.justSelected
      });
    }

    if (this.justUnselected.length) {
      this.fire('unselect', {
        layers: this.justUnselected
      });
    }*/
  },

  // adapted from https://github.com/maxogden/geojson-js-utils/
  _lineStringsIntersect: function (c1, c2) {
    for (var i = 0; i <= c1.length - 2; ++i) {
      for (var j = 0; j <= c2.length - 2; ++j) {
        var a1 = {x: c1[i][1], y: c1[i][0] },
          a2 = {x: c1[i + 1][1], y: c1[i + 1][0] },
          b1 = {x: c2[j][1], y: c2[j][0] },
          b2 = {x: c2[j + 1][1], y: c2[j + 1][0] },

          ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x),
          ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x),
          u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

        if (u_b !== 0) {
          var ua = ua_t / u_b,
            ub = ub_t / u_b;
          if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
            return true;
          }
        }
      }
    }

    return false;
  },

  // Adapted from http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices
  _pointInPolygon: function(x, y, polyCoords) {
    var inside = false,
        intersects, i, j;

    for (i = 0, j = polyCoords.length - 1; i < polyCoords.length; j = i++) {
      var xi = polyCoords[i][0], yi = polyCoords[i][1];
      var xj = polyCoords[j][0], yj = polyCoords[j][1];

      intersects = ((yi > y) !== (yj > y)) &&
                       (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
      if (intersects) {
        inside = !inside;
      }
    }

    return inside;
  }
});

L.featureSelect = function (options) {
  return new L.FeatureSelect(options);
};
