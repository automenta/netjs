var ASTRONOMICAL_DISTANCE = 99999999.0; //in km

function setGeolocatedLocation(map, onUpdated) {
    var geolocate = new OpenLayers.Control.Geolocate({
        bind: false,
        geolocationOptions: {
            enableHighAccuracy: false,
            maximumAge: 0,
            timeout: 7000
        }
    });

    geolocate.events.register("locationupdated", geolocate, onUpdated);

    geolocate.events.register("locationfailed", this, function() {
        OpenLayers.Console.log('Location detection failed');
    });

    map.addControl(geolocate);

    geolocate.activate();

}


function initLocationChooserMap(target, location, zoom, geolocate) {    
    var defaultZoomLevel = zoom || 7;
    
    /*if ((!location) && (geolocate!=false))
        geolocate = true;*/
    
    var fromProjection = new OpenLayers.Projection("EPSG:4326"); // Transform from WGS 1984
    var toProjection = new OpenLayers.Projection("EPSG:900913"); // to Spherical Mercator Projection


    var m = new OpenLayers.Map({
        div: target,
        projection: fromProjection,
        displayProjection: toProjection,
        numZoomLevels: 9,
		maxExtent: [-18924313.432222, -15538711.094146, 18924313.432222, 15538711.094146],
		restrictedExtent: [-13358338.893333, -9608371.5085962, 13358338.893333, 9608371.5085962],
		center: [-12356463.476333, 5621521.4854095]
	    });
    var mapnik = new OpenLayers.Layer.OSM();
    var vector = new OpenLayers.Layer.Vector("Editable Vectors", {});
    m.vector = vector;

    m.addLayers([
    mapnik, vector //, gphy, gmap, gsat, ghyb, /*veroad, veaer, vehyb,*/ 
    ]);
    
    m.setCenter(new OpenLayers.LonLat(0,0), defaultZoomLevel);

	var latlonDisplay = newDiv();
	$('#' + target).append(latlonDisplay);

    var df = new OpenLayers.Control.DragFeature(vector);
    m.addControl(df);
    df.activate();

    m.zoomTo(defaultZoomLevel);
    

    var rad = 10;
    var opacity = 0.5;

	var targetLocation = null;
    

	function setLocation(oll) {
		m.setCenter(oll);

		if (targetLocation)
			m.vector.removeFeatures([targetLocation]);

        var rad = 10;
        var opacity = 0.5;

        targetLocation = new OpenLayers.Feature.Vector(
		    OpenLayers.Geometry.Polygon.createRegularPolygon(
		    new OpenLayers.Geometry.Point(oll.lon, oll.lat),
		    rad,
		    6,
		    0), {}, {
		        fillColor: '#f00',
		        strokeColor: '#f00',
		        fillOpacity: opacity,
		        strokeOpacity: opacity,
		        strokeWidth: 1
		        //view-source:http://openlayers.org/dev/examples/vector-features-with-text.html
        });
        m.vector.addFeatures([targetLocation]);

        m.zoomToExtent(vector.getDataExtent());

		var uo = unproject(oll);

		latlonDisplay.html(_n(uo.lat,4) + ', ' + _n(uo.lon,4));        

		if (m.onClicked)
			m.onClicked( { lat: uo.lat, lon: uo.lon } );
	}

    if (location) {
		setLocation(project(new OpenLayers.LonLat(location[1], location[0])));
    }
    
    

    m.events.register("click", m, function(e) {
        var oll = m.getLonLatFromViewPortPx(e.xy);
		setLocation(oll);
    });
    
    function unproject(x) {
        x.transform(toProjection, fromProjection);
        return x;
    }
    function project(x) {
        x.transform(fromProjection, toProjection);
        return x;
    }


    if (geolocate) {
        setGeolocatedLocation(m, function(e) {
			setLocation(new OpenLayers.LonLat(e.point.x, e.point.y));
        });
    }

    m.location = function() {
        return unproject(m.getCenter());  
    };
    
    return m;
}

var gp1 = { }, gp2 = { };

//distance, in kilometers
function geoDist(p1, p2) {
	if (p1[0] == p2[0])
		if (p1[1] == p2[1])
			return 0;

    gp1.lat = p1[0];
    gp1.lon = p1[1];
    gp2.lat = p2[0];
    gp2.lon = p2[1];
    
    //http://dev.openlayers.org/docs/files/OpenLayers/Util-js.html#Util.distVincenty
    if (OpenLayers)
        return OpenLayers.Util.distVincenty( gp1, gp2 );
    else
        return 0;
}
