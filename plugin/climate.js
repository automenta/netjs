//interfaces to ClimateViewer.com datasets
var util = require('./../client/util.js');

exports.plugin = {
        name: 'Environment',    
    	description: 'Environment and climate datasets provided by http://ClimateViewer.com',
		options: { },
        version: '1.0',
        author: 'http://ClimateViewer.com and P2P-Foundation NORA',
        
		start: function(netention) { 
            
            netention.addTags([
                {
                    uri: 'environment', name: 'Environment'
                }
            ]);
            
            netention.addTags([
                {
                    uri: 'web.KML', name: 'KML', 
                    //tag: ['web'], tagStrength: [1.0],
                    properties: {
                        'kmlDisplay': { name: 'Display', type: 'boolean' },
                        'kmlURL': { name: 'URL', type: 'text', default: 'http://' }                        
                    }
                },
                
                //Climate Tags
                { uri: 'environment.Precipitation', name: 'Precipitation' },
                { uri: 'environment.Seismic', name: 'Seismicity' }, //earthquakes, etc.
                ///...
            ], ['environment']);

            //Specific KML layers, with appropriate tags (see above)
            //  TODO add tags to classify each layer
            //  from: http://climateviewer.com/mobile/js/cv3d-lite-9001.js

            var a = {
                
                "Area0": 
                	{"url": "http://climateviewer.com/download/files/WXMOD-CV3D.kmz",
            		"name": "Weather Modification | Geoengineering"},
            	"Area1": 
            		{"url": "http://climateviewer.com/download/files/Nuclear-Power-CV3D.kmz",
            		"name": "Nuclear Power Plants"},
            	"Area2": 
            		{"url": "http://climateviewer.com/download/files/Nuclear-Warheads-Waste-CV3D.kmz",
            		"name": "Nuclear Waste/Warheads"},
            	"Area3": 
            		{"url": "http://climateviewer.com/download/files/Nuclear-Test-Explosions-CV3D.kmz",
            		"name": "Nuclear Test Explosions"},
            	"Area4": 
            		{"url": "http://climateviewer.com/download/files/DHS-Fusion-Centers-CV3D.kmz",
            		"name": "DHS Fusion Centers"},
            	"Area5": 
            		{"url": "http://climateviewer.com/download/files/Drones-in-the-USA-SkyNET-by-CV3D.kmz",
            		"name": "Drones in the USA"},
            	"Area6": 
            		{"url": "http://climateviewer.com/download/files/echelon-CV3D.kmz",
            		"name": "ECHELON | AUSCANNZUKUS | FIVE EYES"},
            	"Area7": 
            		{"url": "http://climateviewer.com/download/files/HAARP-CV3D.kmz",
            		"name": "HAARP | HF Active Auroral Research Program"},
            	"Area8": 
            		{"url": "http://climateviewer.com/download/files/HAARP-locations-worldwide-CV3D.kmz",
            		"name": "Upper Atmospheric Radar | Ionospheric Heaters"},
            	"Area9": 
            		{"url": "http://climateviewer.com/download/files/Low-Frequency-Transmitters-CV3D.kmz",
            		"name": "Low Frequency Transmitters"},
            	"Area10": 
            		{"url": "http://climateviewer.com/download/files/North-American-Doppler-Radar-CV3D.kmz",
            		"name": "North American Doppler Radars"},
            	"Area 11": 
            		{"url": "http://climateviewer.com/download/files/Observatories-Arrays-CV3D.kmz",
            		"name": "Observatories, Telescopes, Satellite Comms"},
            	"Area 12": 
            		{"url": "http://climateviewer.com/download/files/afscn-CV3D.kmz",
            		"name": "USAF Satellite Control Network"},
            	"Area 13": 
            		{"url": "http://climateviewer.com/download/files/missile-defense-CV3D.kmz",
            		"name": "Star Wars: Missile Defense Radars (SDI)"},
            	"Area 14": 
            		{"url": "http://climateviewer.com/download/files/directed-energy-CV3D.kmz",
            		"name": "Directed Energy"},
            	"Area 15": 
            		{"url": "http://climateviewer.com/download/files/ilrs-lidar-CV3D.kmz",
            		"name": "International Laser Ranging Service | LIDAR"},
            	"Area 16": 
            		{"url": "http://climateviewer.com/download/files/The-X-Files-CV3D.kmz",
            		"name": "The X Files"},
            	"Area 17": 
            		{"url": "http://climateviewer.com/download/files/vlba-CV3D.kmz",
            		"name": "The Very Long Baseline Array | VLBA"},
            	"Area 18": 
            		{"url": "http://climateviewer.com/download/files/lofar-CV3D.kmz",
            		"name": "The Low Frequency Array | LOFAR"},
            	"Area 19": 
            		{"url": "http://climateviewer.com/download/files/evla-CV3D.kmz",
            		"name": "The Expanded Very Large Array | EVLA"},
            	"Area 20": 
            		{"url": "http://climateviewer.com/download/files/gmrt-CV3D.kmz",
            		"name": "The Giant Metrewave Radio Telescope | GMRT"},
            	"Area26": 
            		{"url": "http://climateviewer.com/download/files/ESRL-Inventory-CV3D.kmz",
            		"name": "NOAA ESRL Instruments"},
            	"Area27": 
            		{"url": "http://climateviewer.com/download/files/UHF-Doppler-Radars-CV3D.kmz",
            		"name": "Wind Profiler Radars"},
            	"Area28": 
            		{"url": "http://climateviewer.com/download/files/BSRN-CV3D.kmz",
            		"name": "Baseline Surface Radiation Network (BSRN)"},
                "Moar00": 
            		{"url": "http://climateviewer.com/download/files/Bayou-Corne-Louisanna-Sinkhole-CVmini.kmz",
            		"name": "Bayou Corne, Louisiana Sinkhole"},
            	"Moar01": 
            		{"url": "http://climateviewer.com/download/files/fukushima/Fukushima-Daiichi-Meltdown.kmz",
            		"name": "Fukushima Daiichi Nuclear Plant"},
            	"Moar02": 
            		{"url": "http://climateviewer.com/download/files/fukushima/Fukushima-Cesium-CVmini.kmz",
            		"name": "Fukushima Cesium-137 Seawater Impact Map"},
            	"Moar03": 
            		{"url": "http://climateviewer.com/download/files/fukushima/Fukushima-Tsunami-CVmini.kmz",
            		"name": "Fukushima Tsunami Debris Tracker"},
            	"USSRnuke": 
            		{"url": "http://climateviewer.com/download/files/Russian-Nuclear-Graveyard-CV3D.kmz",
            		"name": "Russian Nuclear Graveyard"},
            	"Spillz": 
            		{"url": "http://earth.tryse.net/Oil_Spill.kmz",
            		"name": "Black Tides â€“ the worst oil spills in history"},
            	"Coal01": 
            		{"url": "http://switchboard.nrdc.org/blogs/rperks/media/Coal_Ash_in_Ponds.kmz",
            		"name": "Coal Ash Ponds"},
            	"Moar04": 
            		{"url": "http://mw2.google.com/mw-ocean/ocean/kml/dead/en/1/root.kmz",
            		"name": "Nutrient Pollution in Coastal Waters"},
                "sat1": 
            		{"url": "http://ge.ssec.wisc.edu/modis/modis-google-earth/terra_latest.kml",
            		"name": "WISC MODIS Visible"},
            	"sat2": 
            		{"url": "http://climateviewer.com/download/files/CombinedGlobalWaterVapor.kmz",
            		"name": "Combined Global Water Vapor color"},
            	"sat3": 
            		{"url": "http://climateviewer.com/download/files/CombinedGlobalWaterVaporIR.kmz",
            		"name": "Combined Global Water Vapor infrared"},
            	"sat4": 
            		{"url": "http://climateviewer.com/download/files/MIDUS-GOES-CONUS-CV3D.kmz",
            		"name": "MIDUS GOES CONUS"}
            };

            //temporary
            /*{
                netention.notice({
                   uri: 'WISC_MODIS_Visible',
                   tag: ['web.KML'],
                   tagStrength: [1.0],
                   name: "WISC MODIS Visible",
                   //kmlURL: "http://www.epa.gov/mxplorer/Top%208%20CO%20Facilities.kmz",
                   //kmlURL: "http://ge.ssec.wisc.edu/modis/modis-google-earth/terra_latest.kml",
                   //kmlURL: "http://openlayers.org/dev/examples/kml/sundials.kml",
                   kmlURL: 'http://data.octo.dc.gov/feeds/itsa/itsa_current.kml',
                   when: Date.now()
                });
            }*/
            
/*
FROM http://fetchclimate.cloudapp.net/?view=datasources ::

Data source	Supported climate parameter	 Description
NCEP/NCAR Reanalysis 1

Near surface air temperature
Precipitation rate
The NCEP/NCAR Reanalysis 1 project is using a state-of-the-art analysis/forecast system to perform data assimilation using past data from 1948 to the present

Reanalysis data provided by the NOAA/OAR/ESRL PSD, Boulder, Colorado, USA, from their Web site at
http://www.esrl.noaa.gov/psd/

CRU CL 2.0

Near surface air temperature
Precipitation rate
Near surface air humidity
Diurnal temperature range
Near surface wind speed
Percent of maximum possible sunshine
Forst days frequency
Wet days frequesncy
High-resolution grid of the average climate in the recent past.

Produced by Climatic Research Unit (University of East Anglia). http://www.cru.uea.ac.uk

GHCN v2.0

Near surface air temperature
Precipitation rate
The Global Historical Climatology Network (GHCN-Monthly) data base contains historical temperature, precipitation, and pressure data for thousands of land stations worldwide.

http://www.ncdc.noaa.gov/ghcnm/v2.php

CPC Soil Moisture

Soil moisture
The monthly data set consists of a file containing monthly averaged soil moisture water height equivalents. Note that data is model-calculated and not measured directly. The dataset is now V2. There are some differences with the previous version, particularly over Africa. The V2 version also has the landmask applied to the datavalues.

Soil Moisture data provided by the NOAA/OAR/ESRL PSD, Boulder, Colorado, USA, from their Web site at http://www.esrl.noaa.gov/psd/

GTOPO30

Land elevation above sea level
GTOPO30 is a global digital elevation model (DEM) with a horizontal grid spacing of 30 arc seconds (approximately 1 kilometer). GTOPO30, completed in late 1996, was developed over a three year period through a collaborative effort led by staff at the U.S. Geological Survey's Center for Earth Resources Observation and Science (EROS).

http://eros.usgs.gov/#/Find_Data/Products_and_Data_Available/gtopo30_info

ETOPO1

Land elevation above sea level
Bathymetry
ETOPO1 is a 1 arc-minute global relief model of Earth's surface that integrates land topography and ocean bathymetry. It was built from numerous global and regional data sets. The service uses the version depicting the top of the Antarctic and Greenland ice sheets.

Amante, C. and B. W. Eakins, ETOPO1 1 Arc-Minute Global Relief Model: Procedures, Data Sources and Analysis. NOAA Technical Memorandum NESDIS NGDC-24, 19 pp, March 2009.
http://www.ngdc.noaa.gov/mgg/global/global.html
*/

/*
From IOBY.org
	Addressing:
		Clean Air, Clean Water, Climate Change, Open Space & Greening, Compost, Recycling
	Taking place at/in:
		Community Centers, Streets & Sidewalks, Schools & Playgrounds, Parks, Gardens, Urban Farms, Beaches, Waterways & Lakes
*/

/*
From Numbeo.com:

    Cost Of Living
        Cost of Living Comparison
        Cost of Living Calculator
        Cost Of Living Index
        Cost Of Living Index (Current)
        Cost Of Living Rankings By Country
        Prices By City
        Prices By Country
        Food Prices
        Basket of Goods and Services
        Motivation and Methodology
        Update Information for Your City
	Property Prices
        Property Prices Comparison
        Property Price Index
        Property Price Index Rate (Current)
        Property Price Index By Country
	Traffic
        Traffic Comparisons
        Traffic Index Rate Latest
        Traffic Index
        Traffic Index by Country
	Crime
        Crime Comparisons
        Crime Index Rate Latest
        Crime Index
        Crime Index by Country
	Health Care
        Health Care Comparisons
        Health Care Index Rate Latest
        Health Care Index
        Health Care Index by Country
	Pollution
        Pollution Comparisons
        Pollution Index Rate Latest
        Pollution Index
        Pollution Index by Country
    Quality Of Life
        Quality of Life Comparisons
        Quality of Life Index Rate Latests
        Quality of Life Index
        Quality of Life Index by Country
    Travel
        Taxi Fare Calculator
        Gas Prices Calculator
        Hotel Prices
    
*/
/*
	http://datacasting.jpl.nasa.gov/
	http://datacasting.jpl.nasa.gov/feed_directory/
*/

		},
            

		stop: function(netention) { 		}
};
