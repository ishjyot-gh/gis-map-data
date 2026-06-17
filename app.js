/*
 * Pure JavaScript Leaflet version of the earlier React/Vite app.
 * Run with VS Code Live Server, or: npm run start
 */

const map = L.map("map").setView([22.5, 78.9], 5);

// L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
//   maxZoom: 19,
//   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
// }).addTo(map);

const overlays = {};
const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);

const statusControl = L.control({ position: "bottomleft" });
statusControl.onAdd = function () {
  const div = L.DomUtil.create("div", "map-error");
  div.id = "status";
  div.style.display = "none";
  return div;
};
statusControl.addTo(map);

function showStatus(message) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.style.display = "block";
}

function popupText(properties) {
  const name =
    properties.NAME_3 ||
    properties.NAME_2 ||
    properties.NAME_1 ||
    properties.NAME_0 ||
    "Unknown";

  const type =
    properties.ENGTYPE_3 ||
    properties.ENGTYPE_2 ||
    properties.ENGTYPE_1 ||
    "";

  const parentParts = [
    properties.NAME_2,
    properties.NAME_1,
    properties.NAME_0
  ].filter(Boolean);

  return `
    <b>${name}</b><br/>
    ${type ? `${type}<br/>` : ""}
    ${parentParts.length ? parentParts.join(", ") : ""}
  `;
}

function styleForLayer(name) {
  const styles = {
    India: {
      weight: 2,
      fillOpacity: 0.04
    },
    States: {
      weight: 1.5,
      fillOpacity: 0.08
    },
    Districts: {
      weight: 1,
      fillOpacity: 0.05
    },
    Taluks: {
      weight: 0.6,
      fillOpacity: 0.03
    }
  };

  return styles[name] || { weight: 1, fillOpacity: 0.05 };
}

async function addGeoJsonLayer(name, url, checked) {
  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const layer = L.geoJSON(data, {
      style: styleForLayer(name),
      onEachFeature: function (feature, leafletLayer) {
        leafletLayer.bindPopup(popupText(feature.properties || {}));
      }
    });

    overlays[name] = layer;
    layerControl.addOverlay(layer, name);

    if (checked) {
      layer.addTo(map);
    }

    return layer;
  } catch (error) {
    console.error(`Failed to load ${name}:`, error);
    showStatus(`Failed to load ${name} from ${url}. Use Live Server or npm run start, not direct file open.`);
    return null;
  }
}

(async function init() {
  await addGeoJsonLayer("India", "./data/india.geojson", true);
  await addGeoJsonLayer("States", "./data/states.geojson", true);
  await addGeoJsonLayer("Districts", "./data/districts.geojson", false);
  await addGeoJsonLayer("Taluks", "./data/taluks.geojson", false);
})();

// load sites from dummy file
async function loadSites() {
  const response = await fetch("./data/sites.json");
  const sites = await response.json();

  const siteLayer = L.layerGroup();

  sites.forEach(site => {
    const marker = L.circleMarker([site.lat, site.lng], {
      radius: 8,
      color: "#dc2626",
      fillColor: "#ef4444",
      fillOpacity: 1,
      weight: 2
    });

    marker.bindPopup(`
      <b>${site.name}</b><br/>
      State: ${site.state}<br/>
      Zone: ${site.zone}<br/><br/>
      <button onclick="openSiteDetails(${site.id})">
        View Details
      </button>
    `);

    marker.addTo(siteLayer);
  });

  siteLayer.addTo(map);
  layerControl.addOverlay(siteLayer, "NPP Sites");
}

function openSiteDetails(siteId) {
  window.location.href = `./pages/site.html?id=${siteId}`;
}

loadSites();
