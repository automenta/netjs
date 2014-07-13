/* http://cesium.agi.com */

var cesiumLoaded = false;
var MAX_CESIUM_ITEMS = 250;

function renderCesiumMap(v) {
    var cc = {};
	var viewer, scene, layers, primitives, ellipsoid;
	var plist = [];
	var materialCache = { };

    function init() {

        var ee = duid();
        var vv = newDiv(ee);
        vv.attr('class', 'cesiumContainer');
        v.append(vv);


        viewer = cc.cesium = new Cesium.CesiumWidget(ee);
		scene = viewer.scene;

		primitives = scene.primitives;

		layers = scene.imageryLayers;

		ellipsoid = scene.globe;

/*
        // Move the primitive that the mouse is over to the top.
        var handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);

	    handler.setInputAction(
	        function (movement) {
	            var pickedObjects = scene.drillPick(movement.position);
	            if(Cesium.defined(pickedObjects)) {
	                for( i=0; i<pickedObjects.length; ++i) {
						var P = pickedObjects[i];
						console.log('picked', P);
					}
				}
        }, Cesium.ScreenSpaceEventType.LEFT_CLICK);
*/

        later(updateMap);
    }



    function updateMap() {
        if (!viewer)
            return;


        function addPrimitive(p) {
            var x = primitives.add(p);
            plist.push(x);
        }
        function clearPrimitives() {
            for (var i = 0; i < plist.length; i++)
                primitives.remove(plist[i]);
            plist = [];
        }
        clearPrimitives();

        var octagonVertexAngle = 3.1415 * 2.0 / 8.0;


        function newCircle(lat, lon, radiusMeters, vertexAngle, r, g, b, a, iconURL) {

			var circle = new Cesium.CircleGeometry({
			  	center: Cesium.Cartesian3.fromDegrees(lon, lat),
			  	radius: radiusMeters,
				granularity: vertexAngle
			});
			var geometry = Cesium.CircleGeometry.createGeometry(circle);

			var instance = new Cesium.GeometryInstance({
			  	geometry: geometry
			});

			var material = null;

            if (!iconURL)
                iconURL = defaultIcons['unknown'];

            if (iconURL) {
				if (materialCache[iconURL])
					material = materialCache[iconURL];
				else {
					materialCache[iconURL] = material = new Cesium.Material({
					  fabric: {
						type: 'Image',
						uniforms: {
						  image: iconURL,
						  repeat: {
							x: 1,
							y: 1
						  }
						}
					  }
					});
				}
            }
            else {
                material = Cesium.Material.fromType('Color');
                material.uniforms.color = {
                    red: r,
                    green: g,
                    blue: b,
                    alpha: a
                };
            }

			var poly = new Cesium.Primitive({
			  geometryInstances: instance,
			  appearance: new Cesium.EllipsoidSurfaceAppearance({
				material: material
			  })
			});

			scene.primitives.add(poly);

            return poly;
        }

        function createMarker(uri, lat, lon, rad, opacity, fill, iconURL) {
            /*
             var primitives = scene.getPrimitives();
             var image = new Image();
             image.onload = function() {
             var billboards = new Cesium.BillboardCollection();
             var textureAtlas = scene.getContext().createTextureAtlas({image : image});
             billboards.setTextureAtlas(textureAtlas);
             billboard = billboards.add({
             position : ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(-75.59777, 40.03883)),
             imageIndex : 0
             });
             primitives.add(billboards);
             };
             image.src = '../images/Cesium_Logo_overlay.png';
             */
            newCircle(lat, lon, rad, octagonVertexAngle, fill.r, fill.g, fill.b, opacity, iconURL);
        }

        currentMapNow = Date.now();

        renderItems(v, MAX_CESIUM_ITEMS, function(s, v, xxrr) {
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];
                renderMapMarker(x, createMarker, r);
            }
        });

		function dynamicPolygonToPrimitive(dynamicObject) {
			var cachedPosition = new Cesium.Cartesian3();
			var time = 0;
		    var dynamicPolygon = dynamicObject._polygon;

		    var polygon;
		    var showProperty = dynamicPolygon._show;
		    var ellipseProperty = dynamicObject._ellipse;
		    var positionProperty = dynamicObject._position;
		    var vertexPositionsProperty = dynamicObject._vertexPositions;
		    var polygonVisualizerIndex = dynamicObject._polygonVisualizerIndex;
		    var show = dynamicObject.isAvailable(time) && (!Cesium.defined(showProperty) || showProperty.getValue(time));
		    var hasVertexPostions = Cesium.defined(vertexPositionsProperty);

		    /*if (!show || //
		       (!hasVertexPostions && //
		       (!defined(ellipseProperty) || !defined(positionProperty)))) {
		        //Remove the existing primitive if we have one
		        if (defined(polygonVisualizerIndex)) {
    }
		        return;
		    }*/

            polygon = new Cesium.Polygon();
            polygon.asynchronous = false;
	        polygon.material = Cesium.Material.fromType(Cesium.Material.ColorType);

		  	polygon.show = true;

		    var vertexPositions;
		    if (hasVertexPostions) {
		        vertexPositions = vertexPositionsProperty.getValue(time);
		    } else {
		        vertexPositions = ellipseProperty.getValue(time, positionProperty.getValue(time, cachedPosition));
		    }

		    if (polygon._visualizerPositions !== vertexPositions && //
		        Cesium.defined(vertexPositions) && //
		        vertexPositions.length > 3) {
		        polygon.setPositions(vertexPositions);
		        polygon._visualizerPositions = vertexPositions;
		    }

		    polygon.material = Cesium.MaterialProperty.getValue(time, dynamicPolygon._material, polygon.material);
      		polygon.material.uniforms.color = new Cesium.Color(1.0, 0.0, 1.0, 0.85);
			return polygon;
		}

	}

	//var dataSource = new Cesium.GeoJsonDataSource();

    //ensure Cesium loaded
    if (!cesiumLoaded) {
        cesiumLoaded = true;

		//this is a hack to make Cesium's require.js work with Netention's screwed up util/ client-server code-sharing
		exports = undefined;
		module = undefined;

        loadCSS('http://cesiumjs.org/Cesium/Build/Cesium/Widgets/CesiumWidget/CesiumWidget.css');

        $LAB
			.script('http://cesiumjs.org/Cesium/Build/Cesium/Cesium.js')
			.wait(init);

    }
    else {
        init();
    }

    cc.onChange = function() {
        updateMap();
    };
	cc.stop = function() {
		v.html('');

		_.values(materialCache, function(m) { m.destroy(); });
		//scene.destroy();
		viewer.destroy();
	};


    return cc;
}
/*

//var dataURL = 'geo/data/hibakusha.geojson';
		var dataURL = 'geo/data/f03.0.0.1.geojson';

		dataSource.loadUrl(dataURL).then(function() {
			//new Cesium.DataSourceDisplay(viewer.get_scene(), [dataSource]);

			var objects = dataSource.getDynamicObjectCollection().getObjects();

		    Cesium.when.all([
		                     Cesium.loadImage('../icon/climateviewer/mr-yuk.png')
		                    ],
		                    function(images) {
		        // Once both images are downloaded, they are combined into one image,
		        // called a texture atlas, which is assigned to a billboard-collection.
		        // Several billboards can be added to the same collection; each billboard
		        // references an image in the texture atlas.

				//http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=Billboards.html&label=Showcases
		        var billboards = new Cesium.BillboardCollection();
		        var textureAtlas = viewer.scene.getContext().createTextureAtlas({
		            images : images
		        });
		        billboards.setTextureAtlas(textureAtlas);

				var opacityColor = new Cesium.Color(1.0, 1.0, 1.0, 0.8);
				for (var i = 0; i < objects.length; i++) {
					var O = objects[i];

					//O.geoJSON , O.name , ...

					if (O.point) {
						billboards.add({
						    position : O._position._value, //ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(-75.59777, 40.03883)),
						    imageIndex : 0,
							width: 32, height: 32,
							color: opacityColor
							/*
							show : true, // default
							position : ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(-75.59777, 40.03883)),
							pixelOffset : new Cesium.Cartesian2(0, 50), // default: (0, 0)
							eyeOffset : new Cesium.Cartesian3(0.0, 0.0, 0.0), // default
							horizontalOrigin : Cesium.HorizontalOrigin.CENTER, // default
							verticalOrigin : Cesium.VerticalOrigin.BOTTOM, // default: CENTER
							scale : 2.0, // default: 1.0
							imageIndex : 0, // default: -1
							color : Cesium.Color.LIME, // default: WHITE
							rotation : Cesium.Math.PI_OVER_FOUR, // default: 0.0
							alignedAxis : Cesium.Cartesian3.ZERO, // default
							width : 100, // default: undefined
							height : 25 // default: undefined
							scaleByDistance : new Cesium.NearFarScalar(1.5e2, 2.0, 1.5e7, 0.5)

						});
					}
					else if (O.polygon) {
						console.log("non-point", O);
						try {
							var polygon = dynamicPolygonToPrimitive(O);
							console.log(polygon);
							primitives.add(polygon);
						}
						catch (e) { console.error(e); }
					}
				}

				primitives.add(billboards);

			});
        });



		var blackMarble = layers.addImageryProvider(new Cesium.TileMapServiceImageryProvider({
			url : 'http://cesiumjs.org/blackmarble',
			//url: 'http://a.tile.openweathermap.org/map/temp',
		}));


		//minx="-20037508.340000" miny="-20037508.340000" maxx="20037508.340000" maxy="20037508.340000"/>
        //var sw = Cesium.Cartographic.fromDegrees(parseFloat(-20037508.340000), parseFloat(-20037508.340000));
        //var ne = Cesium.Cartographic.fromDegrees(parseFloat(20037508.340000), parseFloat(20037508.340000));
        //var ext = new Cesium.Extent(sw.longitude, sw.latitude, ne.longitude, ne.latitude);
		var tempMap = layers.addImageryProvider(new Cesium.TileMapServiceImageryProvider({
			url : 'http://cesiumjs.org/blackmarble',
			//url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/',
			//url: 'http://a.tile.openweathermap.org/map/temp',
			_tilingScheme: new Cesium.GeographicTilingScheme(),
			_extent: ext
		}));


		var proxy = new Cesium.DefaultProxy('http://localhost:9292');
		proxy.getURL = function(resource) {
			//package: corsproxy
        	return this.proxy + '/' + (resource.substring(7));
	    };


		var osm = new Cesium.OpenStreetMapImageryProvider({
			_url : 'http://tile.openstreetmap.org/',
			url: 'http://tile.openweathermap.org/map/temp',
			proxy: proxy
		});
		layers.addImageryProvider(osm);



		//XMin: -20037507.0671618   YMin: -30240971.9583863    XMax: 20037507.0671618   YMax: 30240971.9583862
        var sw = Cesium.Cartographic.fromDegrees(parseFloat(-30240971.9583863), parseFloat(-20037507.0671618));
        var ne = Cesium.Cartographic.fromDegrees(parseFloat(30240971.9583862), parseFloat(20037507.0671618));
        //var sw = Cesium.Cartographic.fromDegrees(parseFloat(bbox.getAttribute('miny')), parseFloat(bbox.getAttribute('minx')));
        //var ne = Cesium.Cartographic.fromDegrees(parseFloat(bbox.getAttribute('maxy')), parseFloat(bbox.getAttribute('maxx')));
        var arcgisext = new Cesium.Extent(sw.longitude, sw.latitude, ne.longitude, ne.latitude);

		var tempMap = layers.addImageryProvider(new Cesium.TileMapServiceImageryProvider({
			url: 'http://services.arcgisonline.com/ArcGIS/rest/services/Ocean_Basemap/MapServer/tile/',
			//tilingScheme: new Cesium.GeographicTilingScheme(),
			//extent: arcgisext,
			proxy: proxy
		}));


		/*<ows:LowerCorner>-180 -90</ows:LowerCorner>
		<ows:UpperCorner>180 90</ows:UpperCorner>*/
		/*
        var sw = Cesium.Cartographic.fromDegrees(-90, -180);
        var ne = Cesium.Cartographic.fromDegrees(90, 180);
        //var sw = Cesium.Cartographic.fromDegrees(parseFloat(bbox.getAttribute('miny')), parseFloat(bbox.getAttribute('minx')));
        //var ne = Cesium.Cartographic.fromDegrees(parseFloat(bbox.getAttribute('maxy')), parseFloat(bbox.getAttribute('maxx')));
        var nasaEXT = new Cesium.Extent(sw.longitude, sw.latitude, ne.longitude, ne.latitude);

		var tempMap = layers.addImageryProvider(new Cesium.TileMapServiceImageryProvider({
			url: 'http://map1.vis.earthdata.nasa.gov/wmts-geo/MODIS_Terra_CorrectedReflectance_TrueColor/default/2014-02-15/EPSG4326_250m',
			fileExtension: 'jpg',
			tileWidth: 512,
			tileHeight: 512,
			extent: nasaEXT,
			proxy: proxy
		}));

		//http://cesiumjs.org/Cesium/Build/Documentation/GeoJsonDataSource.html_data
		//http://cesiumjs.org/Cesium/Apps/Sandcastle/index.html?src=CZML.html&label=undefined

*/
