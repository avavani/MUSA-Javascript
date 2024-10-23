import { Chart } from 'https://cdn.jsdelivr.net/npm/chart.js@4.4.4/auto/+esm';
import * as turf from 'https://cdn.jsdelivr.net/npm/@turf/turf@7.1.0/+esm';

/* 
1. Load the neighbourhood and station data.
1.5. Calculate the bikeshare density for each neighbourhoods. 
2. Create a map and add the neighbourhoods and station to it. 
3. Create the chart and add neighbourhoods to it. 

*/

//Load neighbourhood and station data

//Neighbourhood data
const hoodsResponse = await fetch('data/philadelphia-neighborhoods.geojson');
const hoodsCollection = await hoodsResponse.json();
const hoodsLayer = L.geoJSON(hoodsCollection);

//Station data

const stationsResponse = await fetch('https://gbfs.bcycle.com/bcycle_indego/station_information.json');
const stationsData = await stationsResponse.json();

function gbfsStationToFeature(gbfsStation) {
  return {
    type: 'Feature',
    properties: gbfsStation,
    geometry: {
      type: 'Point',
      coordinates: [gbfsStation.lon, gbfsStation.lat],
    }
  };
}


window.gbfsStationToFeature = gbfsStationToFeature;
window.stationsData = stationsData;


const mapEl = document.querySelector('.map');
const map = L.map(mapEl);

// Add neighborhoods to map...


hoodsLayer.addTo(map);
map.fitBounds(hoodsLayer.getBounds());

// Add bikeshare stations to map...



const stations = stationsData.data.stations.map(gbfsStationToFeature);

const stationsLayer = L.geoJSON(stations);
stationsLayer.addTo(map);

// Add tooltip with name and bikeshare density...
for (const hood of hoodsCollection.features) {
  function stationInHood(station) {
    return turf.booleanPointInPolygon(station, hood);
  }

  const hoodStations = stations.filter(stationInHood);

  const areaSqKm = hood.properties['Shape_Area'] / 3280.84 / 3280.84;
  const stationCount = hoodStations.length;
  const stationDensity = stationCount / areaSqKm;

  Object.assign(hood.properties, { areaSqKm, stationCount, stationDensity});
}

hoodsLayer.bindTooltip(layer => {
  const hood = layer.feature;
  const name = hood.properties['LISTNAME'];
  const density = hood.properties.stationDensity.toFixed(2);
  return `${name}<br>${density} stations / sq km`;
});

// Add a chart with bikeshare density...
//Below, the hood ==> hood propeorties section is a function. This says to apply the names of the neighbourhood
//and returns the LISTNAME value on the other end
const hoods = hoodsCollection.features
  .filter(hood => hood.properties.stationDensity > 0)
  .sort((a,b) => b.properties.stationDensity - a.properties.stationDensity);
const hoodNames = hoods.map(hood => hood.properties['LISTNAME']);
const hoodDensities = hoods.map(hood => hood.properties.stationDensity);

console.log(hoodNames);
console.log(hoodDensities);

const chartEl = document.querySelector('.chart canvas');
const data = {
  labels: hoodNames,
  datasets: [{
    label: 'stations per sq km',
    data: hoodDensities,
  }]
};

const options = {
  indexAxis: 'y',
  aspectRatio: 0.5,
  scales: {
    y: { beginAtZero: true }
  }
};

const chart = new Chart(chartEl, {type: 'bar', data, options});
