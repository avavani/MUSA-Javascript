// First, I am selecting the section in my html that is tagged as #map

const mapElement = document.querySelector('#map');

// then I am setting the parameter of the base map. Here, I center it to Pennsylvania
// and then select a zoom level. 
var map = L.map(mapElement, {
    center: [40.9699, -77.7278],
    zoom: 7
});

// now I get my required key
const Mapboxkey = 'pk.eyJ1IjoiYWF2YW5pMTAzIiwiYSI6ImNtMTgxOGkyZzBvYnQyam16bXFydTUwM3QifQ.hXw8FwWysnOw3It_Sms3UQ'
const Mapboxstyle = 'mapbox/dark-v11'

//then I call my baselayer and add to map 

const baselayer = L.tileLayer(`https://api.mapbox.com/styles/v1/${Mapboxstyle}/tiles/512/{z}/{x}/{y}{r}?access_token=${Mapboxkey}`,
{zoomOffset: -1, tileSize: 512}
);

baselayer.addTo(map);

// Load GeoJSON data from a file and add it to the map

// here, the fetch and away function lets the page call the required value
const response = await fetch("pa_pres_results.geojson");
const data = await response.json();

//now, I define the style of my data layer based on parameters 
const dataLayer = L.geoJSON(data, {
    style: (feature) => {
        // first, I select the value of each county's party
        const value = feature.properties.party;

        // then, depending on whether the value is republican or democrat I set the color

        const getColor = (val) => {
            return val === "REPUBLICAN" ? '#ff3933' :
                   val === "DEMOCRAT" ? '#3393ff' :
                                        '#ffffff';
        };

        //next, I seek to adjust its opacity based on the evenness of vote share. Similar to the 
        //section above, I first extract the vote margin for each individual county.
        //then, I find the max and min values across all counties 
        
        const votewon = feature.properties.candidatevotes;
        const totvote = feature.properties.totalvotes;
        const votemargin = votewon / totvote;

        // here, for all features in my data (data.features.map), I calculate its vote margin. Here, the item seeks to represent
        //every item in our map. This creates an array of vote margins across PA
        const allMargins = data.features.map(item => item.properties.candidatevotes / item.properties.totalvotes);
        //then we find the max and min value
        const minMargin = Math.min(...allMargins);
        const maxMargin = Math.max(...allMargins);

        //Opacity is then set as the normalized value of vote share among all PA counties. As normalization gives us a value between 0 to 1
        //this method is used to set opacity. 

        const opacity = (votemargin - minMargin) / (maxMargin - minMargin);

        return {
            fillColor: getColor(value),
            weight: 2,
            opacity: 1,
            color: 'white',
            fillOpacity: opacity
        };
    },

    //then we bind the candidate value as a popup on each feature or polygon
    onEachFeature: (feature, layer) => {
        layer.bindTooltip(`${feature.properties.name}: ${feature.properties.party}`);
    }
});

//finally we add the data layer to the basemap.
dataLayer.addTo(map);