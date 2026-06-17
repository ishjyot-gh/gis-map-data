let siteMap;
let currentSite;
let sectorLayer;

const directionAngles = {
  N: 0,
  NE: 45,
  E: 90,
  SE: 135,
  S: 180,
  SW: 225,
  W: 270,
  NW: 315
};

function getSiteIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

async function initSitePage() {
  const siteId = getSiteIdFromUrl();

  const response = await fetch("../data/sites.json");
  const sites = await response.json();

  currentSite = sites.find(site => site.id === siteId);

  if (!currentSite) {
    alert("Site not found");
    return;
  }

  document.getElementById("siteName").textContent = currentSite.name;
  document.getElementById("siteState").textContent = currentSite.state;
  document.getElementById("siteZone").textContent = currentSite.zone;
  document.getElementById("siteDescription").textContent = currentSite.description;

  siteMap = L.map("siteMap").setView([currentSite.lat, currentSite.lng], 9);

  L.circleMarker([currentSite.lat, currentSite.lng], {
    radius: 9,
    color: "#991b1b",
    fillColor: "#dc2626",
    fillOpacity: 1
  }).addTo(siteMap).bindPopup(`<b>${currentSite.name}</b>`).openPopup();

  await loadLocalLayers();
}

async function loadLocalLayers() {
  const states = await fetch("../data/states.geojson").then(r => r.json());

  L.geoJSON(states, {
    style: {
      color: "#2563eb",
      weight: 1,
      fillOpacity: 0
    }
  }).addTo(siteMap);
}

function destinationPoint(lat, lng, distanceKm, bearingDeg) {
  const R = 6371;
  const bearing = bearingDeg * Math.PI / 180;

  const lat1 = lat * Math.PI / 180;
  const lng1 = lng * Math.PI / 180;

  const lat2 = Math.asin(
    Math.sin(lat1) * Math.cos(distanceKm / R) +
    Math.cos(lat1) * Math.sin(distanceKm / R) * Math.cos(bearing)
  );

  const lng2 = lng1 + Math.atan2(
    Math.sin(bearing) * Math.sin(distanceKm / R) * Math.cos(lat1),
    Math.cos(distanceKm / R) - Math.sin(lat1) * Math.sin(lat2)
  );

  return [
    lat2 * 180 / Math.PI,
    lng2 * 180 / Math.PI
  ];
}

function createSectorPolygon(centerLat, centerLng, directionDeg, radiusKm, spreadDeg) {
  const points = [[centerLat, centerLng]];

  const startAngle = directionDeg - spreadDeg / 2;
  const endAngle = directionDeg + spreadDeg / 2;

  for (let angle = startAngle; angle <= endAngle; angle += 3) {
    points.push(destinationPoint(centerLat, centerLng, radiusKm, angle));
  }

  points.push([centerLat, centerLng]);

  return points;
}

function highlightSector() {
  const direction = document.getElementById("windDirection").value;
  const speed = Number(document.getElementById("windSpeed").value || 0);

  const angle = directionAngles[direction];

  const radiusKm = speed > 0 ? Math.min(speed * 2, 100) : 30;

  const sectorPoints = createSectorPolygon(
    currentSite.lat,
    currentSite.lng,
    angle,
    radiusKm,
    45
  );

  if (sectorLayer) {
    siteMap.removeLayer(sectorLayer);
  }

  sectorLayer = L.polygon(sectorPoints, {
    color: "#dc2626",
    weight: 2,
    fillColor: "#f87171",
    fillOpacity: 0.35
  }).addTo(siteMap);

  siteMap.fitBounds(sectorLayer.getBounds());
}

initSitePage();