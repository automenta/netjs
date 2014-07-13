addView({
	id: 'map',
	name: 'Map',
	icon: 'icon/view.map.svg',
	start: function(v) {

		browseTagFilters = {};	//TEMPORARY

		var typeSelect;

		var mm;
		function updateMap() {
			v.empty();

			if (typeSelect)
				map2d = (typeSelect.val() === '2D');
			else
				map2d = configuration.defaultMapMode2D;

			var mapControl = newDiv().css('z-index', '5000').css('pointer-events', 'auto');
			mapControl.addClass('leaflet-control leaflet-top leaflet-left');

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

			mapControl.append(planetSelect);
			mapControl.append(typeSelect);

			mapControl.append('<div class="MapInstructions">Right Click to Add</div>');
			setTimeout(function() {
				$('div.MapInstructions').fadeOut();
			}, 1500);


			if (map2d) {
				/*var m = renderOLMap(s, o, v);
				 mm.onChange = m.onChange;
				 mm.location = m.location;*/

				mm = renderLeafletMap(v);
			}
			else {
				mm = renderCesiumMap(v);
			}

			$('.leaflet-control-container .leaflet-top.leaflet-left').append(mapControl);

		}
		updateMap();

		return mm;

	},
	stop: function() {
	}
});

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
    if (!s)
        return;
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
        op = 0.25 + 0.5 * Math.exp(-((currentMapNow - ww) / 1000.0 / 48.0 / 60.0 / 60.0));
    }

    iconURL = getTagIcon(x);
    if (!iconURL)
        iconURL = defaultIcons['unknown'];

    var tagStyling = {
        'Earthquake': function() {
            var mag = objFirstValue(x, 'eqMagnitude', 1);
            rad = 100000 + (mag - 4.0) * 700000;
            op *= 0.5;
            //fill = '#b33';
            fill.r = 256;
            fill.g = 75;
            fill.b = 0;
        },
        'NuclearFacility': function() {
            rad = 7000;
            op = 0.3;
            //fill = '#ff0';
        },
        'Human': function() {
            rad = 200;
            op = 0.25;
        },
        'Message': function() {
            //fill = '#55f';
            rad = 50;
        },
        'GoalCentroid': function() {
            rad = 200;
            op = 0.3;
            //fill = '#fa3';
        },
        'Item': function() {
            rad = 50;
            op = 0.2;
            //fill = '#3af';
        }
    };


    var tags = objTags(x);
    for (var i = 0; i < tags.length; i++) {
        var tt = tags[i];
        if (tagStyling[tt])
            tagStyling[tt]();
    }

    createMarkerFunction(x.id, s.lat, s.lon, rad, op, fill, iconURL);
}




var map2d = true;


function newLeafletGeoCoder() {
    return new L.Control.OSMGeocoder({
        collapsed: true, /* Whether its collapsed or not */
        position: 'topright', /* The position of the control */
        text: 'Go', /* The text of the submit button */
        bounds: null, /* a L.LatLngBounds object to limit the results to */
        email: null, /* an email string with a contact to provide to Nominatim. Useful if you are doing lots of queries */
        callback: function(results) {
            var bbox = results[0].boundingbox,
                    first = new L.LatLng(bbox[0], bbox[2]),
                    second = new L.LatLng(bbox[1], bbox[3]),
                    bounds = new L.LatLngBounds([first, second]);
            this._map.fitBounds(bounds);
        }
    });
}

function renderLeafletMap(v) {
    var e = duid();
    var mapdiv = $('<div style="width: 100%; height: 100%"/>').attr('id', e).appendTo(v);

    var tooltip = $('<div class="lltooltip"/>');
    tooltip.appendTo(mapdiv);
    tooltip.hide();

    var map = L.map(e, {
        worldCopyJump: true,
        zoomControl: false
    }).setView(configuration.mapDefaultLocation || [0, 0], 11);

    /*L.tileLayer('http://{s}.tile.cloudmade.com/{key}/22677/256/{z}/{x}/{y}.png', {
     attribution: 'Map data &copy; 2011 OpenStreetMap contributors, Imagery &copy; 2012 CloudMade',
     key: 'BC9A493B41014CAABB98F0471D759707'
     }).addTo(map);*/

    //http://leaflet-extras.github.io/leaflet-providers/preview/index.htmlfile
    var baseLayer = L.tileLayer('http://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Tiles courtesy of <a href="http://hot.openstreetmap.org/" target="_blank">Humanitarian OpenStreetMap Team</a>'
    });
    baseLayer.addTo(map);

    map.addControl(newLeafletGeoCoder());
    new L.Control.Zoom({position: 'topright'}).addTo(map);


    //https://github.com/Leaflet/Leaflet.draw -------------

    // FeatureGroup to store editable layers
    var drawnItems;
    if (localStorage['mapdraw']) {
        drawnItems = new L.geoJson(JSON.parse(localStorage['mapdraw']));
    }
    else {
        drawnItems = new L.FeatureGroup();
    }
    map.addLayer(drawnItems);

    // Draw control and pass it the FeatureGroup of editable layers
    var drawControl = new L.Control.Draw({
        edit: {
            featureGroup: drawnItems
        },
        position: 'bottomleft'
    });
    map.addControl(drawControl);

    map.on('draw:created', function(e) {
        var type = e.layerType,
                layer = e.layer;

        /*if (type === 'marker') {
         layer.bindPopup('A popup!');
         }*/

        drawnItems.addLayer(layer);
        localStorage['mapdraw'] = JSON.stringify(drawnItems.toGeoJSON());
    });

    //------------


    var testIcon = L.icon({
        iconUrl: 'icon/unknown.png',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -28]
    });

    var icons = {};
    function getIcon(i, pxsize) {
        if (!pxsize)
            pxsize = 32;

        if (!i)
            return testIcon;

        if (!icons[i]) {
            icons[i] = L.icon({
                iconUrl: i,
                iconSize: [pxsize, pxsize],
                iconAnchor: [pxsize / 2, pxsize / 2],
                popupAnchor: [0, -28]
            });
        }
        return icons[i];
    }

    var featureSelect = L.featureSelect();
    featureSelect.addTo(map);

    var nobjectLayer = L.layerGroup([]);
    nobjectLayer.addTo(map);

    map.layers = {};

    map.on('click', function(e) {
        var p = e.latlng;

        //https://github.com/openplans/Leaflet.FeatureSelect/blob/gh-pages/js/feature-select.js
        featureSelect.checkIntersections(e.layerPoint, p, _.values(map.layers).concat(nobjectLayer), function(s) {
            if (s.length == 0)
                return;

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

        });

    });
    map.on('contextmenu', function(e) {
        var p = e.latlng;
        //		  alert('rightclick at '+e.xy.x+','+e.xy.y);

        var n = objAddGeoLocation(objNew(), p.lat, p.lng);

        notify({title: 'New Object', text: ('@ ' + _n(p.lat) + ',' + _n(p.lng))});
        newPopupObjectEdit(n);
    });

    function onEachFeature(feature, layer) {
        var popupContent = '';

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
                tooltip.css({
                    left: e.originalEvent.clientX,
                    top: e.originalEvent.clientY
                }).html(label.substring(0, 40)).show();
            });
        }).on('mouseout', function(e) {
            later(function() {
                tooltip.hide();
            });
        });
    }

    function addLayer(tag, strength, onAdded) {
        var T = $N.getTag(tag);
        if (!T)
            return;

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

                    pointToLayer: function(feature, latlng) {
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

                            var io = L.imageOverlay(iconurl, [[latlonbox[2], latlonbox[3]], [latlonbox[0], latlonbox[1]]]);
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
        else if (T.wmsLayer) {
            var l = T.wmsLayer;
            var o = {
                layers: l.layer,
                format: 'image/png',
                transparent: true,
                attribution: ''
            };
            /*if (l.crs) {
             if (l.crs == 'EPSG4326')
             o.crs = L.CRS.EPSG4326;
             }*/
            var w = L.tileLayer.wms(l.url, o);
            w.setOpacity(strength);
            w.addTo(map);
            onAdded(w);
        }
        else if (T.tileLayer) {
            var template = T.tileLayer;
            var options = {
                attribution: ''
            };
            if (typeof template != 'string') {
                options = template;
                template = options.template;

                var d = new Date(Date.now() - 24 * 60 * 60 * 1000  /* 24hrs ago */);
                var m = d.getMonth() + 1;
                var r = d.getDate() + 1;
                if (m <= 9)
                    m = '0' + m;
                if (r <= 9)
                    r = '0' + r;
                options.time = d.getFullYear() + '-' + m + '-' + r;
            }
            if (options.reprojected) {
                if (options.format.indexOf('png') != -1) {
                    //put PNG layers above, since they usually contain transparent image that could see through to a solid JPG layer beneath
                    options.zIndex = 101;
                }
                else
                    options.zIndex = 100;
            }


            var tl = L.tileLayer(template, options);

            if (options.reprojected) {
                notify({title: 'Map Re-projected', text: "The '" + T.name + "' layer uses an alternate map projection.  It may not appear aligned with other layers."});
                tl.reprojects = true;
            }

            tl.setOpacity(strength);

            tl.addTo(map);
            onAdded(tl);
        }
        else if (T.dbpediaLayer) {
            //https://github.com/kr1/Leaflet.dbpediaLayer/
            var lay = L.dbPediaLayer({lang: 'en', includeCities: true});
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

    var markers = new WeakMap();
    function getMarker(x) {
        var existing = markers.get(x);
        if ((existing != null) && (existing !== undefined))
            return existing;
        if (existing === undefined) {
            var s = objSpacePoint(x);
            if ((s) && (s.lat !== undefined) && (s.lon !== undefined)) {
                var m = L.marker([s.lat, s.lon], {
                    clickable: false
                });
                m.object = x;
                markerHover(m, objName(m));

                if (objHasTag(x, 'Earthquake')) {
                    m.setOpacity(0.25);
                    var mag = parseFloat(objFirstValue(x, 'eqMagnitude'));
                    var depthKM = -(s.alt || 0) /* parseFloat(objFirstValue(x, 'eqDepth')) */ / 1000.0;
                    var ipx = undefined;
                    if (mag) {
                        var rad = 500 + Math.exp(mag) * 1000;
                        var ww = x.modifiedAt || x.createdAt || null;
                        var op = 1.0;
                        if (ww) {
                            var daysAgo = (currentMapNow - ww) / 1000.0 / 60.0 / 60.0 / 24.0;
                            op = Math.pow((daysAgo + 1) / 12.0, -1);
                        }
                        op *= 0.75;
                        if (op < 0.1) op = 0.1;

                        var r = Math.pow(depthKM / 10.0, -1); //redness: more red = closer to surface
                        var g = 1 - r;
                        var b = 0;
                        var a = 1.0;

                        var eqCircle = L.circle([s.lat, s.lon], rad, {
                            stroke: true,
                            color: 'black',
                            weight: 1,
                            fillColor: _rgba(r, g, b, a),
                            opacity: Math.min((op * 2.0), 1.0),
                            fillOpacity: op
                        });

                        m.extraGeometry = [eqCircle];

                        //ipx = parseInt(10 + mag * 6.0);
                    }
                    m.setIcon(getIcon(getTagIcon(x, ipx)));
                }
                else {
                    m.setIcon(getIcon(getTagIcon(x)));
                }

                markers.set(x, m);
                return m;
            }
            else {
                markers.set(x, null);
            }
        }
        return null;
    }

    function updateMap() {

        renderItems(v, MAP_MAX_ITEMS, function(s, v, xxrr) {
            nobjectLayer.clearLayers();

            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                //var r = xxrr[i][1];

                var m = getMarker(x);
                if (m) {
					try {
						nobjectLayer.addLayer(m);
						if (m.extraGeometry) {
							for (var j = 0; j < m.extraGeometry.length; j++) {
								nobjectLayer.addLayer(m.extraGeometry[j]);
							}
						}
					}
					catch (e) { /* TODO this should not happen. check m before calling addLayer to avoid any overhead involved in catching this */ }
                }

            }

        });

        var focus = $N.get('focus');
        var newLayersArray = focus ? focus.value : [];

        if (!newLayersArray)
            newLayersArray = [];

        var newlayers = {};

        for (var i = 0; i < newLayersArray.length; i++) {
            var A = newLayersArray[i];
            newlayers[A.id] = A.strength;
        }

        var subtracting = _.difference(_.keys(map.layers), _.keys(newlayers));
        var adding = _.difference(_.keys(newlayers), _.keys(map.layers));
        var same = _.union(_.keys(newlayers), _.keys(map.layers));

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

    map.onChange = updateMap;
    map.stop = function() {
        map = null;
    };

    return map;
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
    initialize: function(options) {
        L.setOptions(this, options);

        this.options.selectSize = L.point(this.options.selectSize);
    },
    addTo: function(map) {
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
        this.justUnselected = [];

        var deltaBounds = L.latLngBounds(
                this._map.unproject([
                    epoint.x + this.options.selectSize.x / 2,
                    epoint.y - this.options.selectSize.y / 2
                ]),
                this._map.unproject([
                    epoint.x - this.options.selectSize.x / 2,
                    epoint.y + this.options.selectSize.y / 2
                ])
                );
        var dl = Math.max(Math.abs(deltaBounds.getWest() - deltaBounds.getEast()), Math.abs(deltaBounds.getNorth() - deltaBounds.getSouth()));

        var southWest = L.latLng(point.lat - dl, point.lng - dl),
                northEast = L.latLng(point.lat + dl, point.lng + dl);
        selectBounds = L.latLngBounds(southWest, northEast);


        selectBoundsCoords = L.rectangle(selectBounds).toGeoJSON().geometry.coordinates[0];

        var selected = [];
        for (var jj = 0; jj < layers.length; jj++) {
            var layerg = layers[jj];
            if (!layerg.getLayers)
                continue;

            var layergs = layerg.getLayers();
            for (var j = 0; j < layergs.length; j++) {
                var layer = layergs[j];
                var type = 'Point';
                var coords = [0, 0];
                if (layer.feature) {
                    coords = layer.feature.geometry.coordinates,
                            type = layer.feature.geometry.type;
                }
                else {
                    if (layer._latlng)
                        coords = [layer._latlng.lng, layer._latlng.lat];
                }
                var len, i, intersects = false;

                switch (type) {
                    case 'Point':
                        coords = [coords];
                        // fall through
                    case 'MultiPoint':
                        for (i = 0; i < coords.length; i++) {
                            if (selectBounds.contains([coords[i][1], coords[i][0]])) {
                                //if (selectBounds.contains(L.latLng([coords[i][1], coords[i][0]])))  {
                                intersects = true;
                            }
                        }
                        break;

                    case 'LineString':
                        coords = [coords];
                        // fall through
                    case 'MultiLineString':
                        for (i = 0; i < coords.length; i++) {
                            if (selectBounds.intersects(layer.getBounds()) && this._lineStringsIntersect(selectBoundsCoords, coords[i])) {
                                intersects = true;
                            }
                        }
                        break;

                    case 'Polygon':
                        coords = [coords];
                        // fall through
                    case 'MultiPolygon':
                        for (i = 0; i < coords.length; i++) {
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
    _lineStringsIntersect: function(c1, c2) {
        for (var i = 0; i <= c1.length - 2; ++i) {
            for (var j = 0; j <= c2.length - 2; ++j) {
                var a1 = {x: c1[i][1], y: c1[i][0]},
                a2 = {x: c1[i + 1][1], y: c1[i + 1][0]},
                b1 = {x: c2[j][1], y: c2[j][0]},
                b2 = {x: c2[j + 1][1], y: c2[j + 1][0]},
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

L.featureSelect = function(options) {
    return new L.FeatureSelect(options);
};
