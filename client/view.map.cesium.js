/* http://cesium.agi.com */

var cesiumLoaded = false;
var MAX_CESIUM_ITEMS = 250;

function renderCesiumMap(o, v) {
	var cc = { };
	var viewer;

	function render() {
		var ee = uuid();
		var vv = newDiv(ee);
		vv.attr('class', 'cesiumContainer');
		v.append(vv);
	
		viewer = cc.cesium = new Cesium.CesiumWidget(ee);
		updateMap();
	}

	var plist = [];

	function updateMap() {
		if (!viewer)
			return;

		var scene = viewer.scene;
		var ellipsoid = viewer.centralBody.getEllipsoid();
		var primitives = scene.getPrimitives();

		function addPrimitive(p) {
			var x = primitives.add(p);
			plist.push(x);
		}
		function clearPrimitives() {
			for (var i = 0; i < plist.length; i++)
				primitives.remove( plist[i] );
			plist = [];
		}
		clearPrimitives();

		var octagonVertexAngle = 3.1415 * 2.0 / 8.0;

		var imageMaterials = { };

		function newCircle(lat, lon, radiusMeters, vertexAngle, r, g, b, a, iconURL) {
			var poly = new Cesium.Polygon({
		        positions : Cesium.Shapes.computeCircleBoundary(
		            ellipsoid,
		            ellipsoid.cartographicToCartesian(Cesium.Cartographic.fromDegrees(lon, lat)),
		            radiusMeters,
					vertexAngle
					)
		    });
			if (!iconURL)
				iconURL = defaultIcons['unknown'];
			if (iconURL) {
				if (imageMaterials[iconURL]) {
					poly.material = imageMaterials[iconURL];
				}
				else {
					imageMaterials[iconURL] = poly.material = new Cesium.Material({
						fabric : {
						    type : 'Image',
						    uniforms : {
						        image: iconURL,
						    },
							components: {
								alpha: a*2.0
							}
						}
					});
				}
			}
			else {
				poly.material = Cesium.Material.fromType('Color');
				poly.material.uniforms.color = {
					red : r,
					green : g,
					blue : b,
					alpha : a
				};		
			}
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
			addPrimitive(newCircle(lat, lon, rad, octagonVertexAngle, fill.r, fill.g, fill.b, opacity, iconURL));
		}

	    currentMapNow = Date.now();        

        renderItems(o, v, MAX_CESIUM_ITEMS, function(s, v, xxrr) {
            for (var i = 0; i < xxrr.length; i++) {
                var x = xxrr[i][0];
                var r = xxrr[i][1];        
				renderMapMarker(x, createMarker, r);
            }        
        });

	}

	//ensure Cesium loaded
	if (!cesiumLoaded) {
		cesiumLoaded = true;

		loadCSS('http://cesium.agi.com/Cesium/Build/Cesium/Widgets/CesiumWidget/CesiumWidget.css');

        LazyLoad.js("http://cesium.agi.com/Cesium/Build/Cesium/Cesium.js", render);
	}
	else {
		render();
	}

 	cc.onChange = function() {
        updateMap();
    };

	return cc;
}
