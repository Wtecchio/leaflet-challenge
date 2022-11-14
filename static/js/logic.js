//create the tile layers for the backgrounds of the map
var defaultMap = L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
	maxZoom: 17,
	attribution: 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
});

//grayscale layer
var grayscale = L.tileLayer('https://stamen-tiles-{s}.a.ssl.fastly.net/toner/{z}/{x}/{y}{r}.{ext}', {
	attribution: 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	subdomains: 'abcd',
	minZoom: 0,
	maxZoom: 20,
	ext: 'png'
});

//Esri World map
var EsriMap = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, DeLorme, NAVTEQ, USGS, Intermap, iPC, NRCAN, Esri Japan, METI, Esri China (Hong Kong), Esri (Thailand), TomTom, 2012'
});

//CartoDB
var CartoDB = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}{r}.png', {
	attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
	subdomains: 'abcd',
	maxZoom: 20
});

// make a basemap object
let basemaps = {
    Default: defaultMap,
    "Dark Mode": grayscale,
    "Esri Map": EsriMap,
    "Carto DB": CartoDB
};

//map object
var myMap = L.map("map",{
    center : [36.77, -119.418],
    zoom: 5,
    layers: [defaultMap, grayscale, EsriMap, CartoDB]

});

//add default map to map
defaultMap.addTo(myMap);



//get the data for tectonic plates and draw on the map
//variable to hold the tectonic plates layer
let tectonicplates = new L.layerGroup();

//call the api to get the info for the tectonic plates
d3.json("https://raw.githubusercontent.com/fraxen/tectonicplates/master/GeoJSON/PB2002_boundaries.json").then(function(plateData){
    //check if data loades
    //console.log(plateData)

    //load data using geoJson and add to tectonic plate layer
    L.geoJson(plateData,{
        //add styling to make the lines visible
        color: "green",
        weight:2
    }).addTo(tectonicplates);
})

//add plates to the map
tectonicplates.addTo(myMap);

//create variable to hold earthquake data layer
let earthquakes = new L.layerGroup();


//get data for earthquakes from API
d3.json("https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_week.geojson")
.then(
    function(earthquakeData){
        //check to see if data came through
        //console.log(earthquakeData)

        //plot circles, where radius is dependent on the magnitude
        //color = depth

        //make a function that chooses the color of the data paoint
        function dataColor(depth){
            if (depth > 90)
                return "red";
            if (depth > 70)
                return "#fc4904";
            else if(depth > 50)
                return "#fc8402";
            else if (depth > 30)
                return "#fcad05";
            else if (depth > 10)
                return "#cafc00";
            else
                return "green";
        }

        //make a function that makes raidus size
        function radiusSize(mag){

            if (mag == 0)
                return 1; //makes sure that 0 magnitutde earthquakes appear
            else 
                return mag * 5; //change the ratio of the magnitude
        }

        //add on to the style for each data point
        function dataStyle(feature){

            return {
                opacity: 5,
                fillOpacity:.5,
                fillColor: dataColor(feature.geometry.coordinates[2]), //use index 2 for the depth deliveryed from the API
                color: "000000", //black outline
                radius: radiusSize(feature.properties.mag), //grabs the magnitude
                weight: 0.5,
                stroke: true
            }
        }


        //add the GeoJson Data
        L.geoJson(earthquakeData, {
            //make each feature a marker that is on the map
            pointToLayer: function(feature,latLng) {
                return L.circleMarker(latLng);
            },
            //set the style for each marker
            style: dataStyle, //calls the data style function and passes in the earthquake data
            //add popups
            onEachFeature: function(feature, layer){
                layer.bindPopup(`Magnitude: <b>${feature.properties.mag}</b><br>
                                Depth: <b>${feature.geometry.coordinates[2]}<br>
                                Location: <b>${feature.properties.place}</b><br>`);
            }


        }).addTo(earthquakes);


    }


);

    //add the earthquake layer to the map
    earthquakes.addTo(myMap)


//add the overlay for the tectonic plates
let overlays = {
    "Tectonic Plates": tectonicplates,
    "Earthquake Data": earthquakes
};

// add the Layer control
L.control
    .layers(basemaps, overlays)
    .addTo(myMap);

//add the legend
let legend = L.control({

    position: "bottomright"

});

//add the properties for the legend
legend.onAdd = function() {

    //div for the legend to appear in the page
    let div = L.DomUtil.create("div", "info legend");

    //set up the invervals 
    let intervals = [-10,10,30,50,70,90];
    //set the colors for the inverals
    let colors = [
        "green",
        "#cafc00",
        "#fcad05",
        "#fc8402",
        "#fc4904",
        "red"
    ];

    //loop through the inverals and the colors and generate a label with a square for each interval
    for (var i = 0; i < intervals.length; i++)
    {
        //inner html that sets the square for each interval and label
        div.innerHTML += "<i style='background: "
            +colors[i]
            +"'></i>"
            +intervals[i]
            + (intervals[i + 1] ? "km -" + intervals[i + 1] + "km<br>" : "+");
    }

    return div;
};

//add legend 
legend.addTo(myMap);