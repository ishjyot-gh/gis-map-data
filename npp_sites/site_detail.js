let siteMap;

function getSiteIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return Number(params.get("id"));
}

function formatLabel(key) {
  const labels = {
    id: "ID",
    lat: "Latitude",
    lng: "Longitude",
    reactor_type: "Reactor Type",
    installed_capacity_mw: "Installed Capacity (MW)"
  };

  if (labels[key]) {
    return labels[key];
  }

  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, char => char.toUpperCase());
}

function formatValue(value) {
  if (value === undefined || value === null || value === "") {
    return "Not available";
  }

  if (Array.isArray(value)) {
    return value.join(", ");
  }

  return String(value);
}

function renderSiteDetails(site) {
  const detailList = document.getElementById("siteDetails");
  const preferredOrder = [
    "id",
    "state",
    "zone",
    "reactor_type",
    "operator",
    "installed_capacity_mw",
    "units",
    "status",
    "lat",
    "lng"
  ];

  const displayedKeys = preferredOrder.filter(key => key in site);
  const remainingKeys = Object.keys(site).filter(key => (
    !["name", "description"].includes(key) &&
    !displayedKeys.includes(key)
  ));

  detailList.replaceChildren();

  [...displayedKeys, ...remainingKeys].forEach(key => {
    const term = document.createElement("dt");
    const description = document.createElement("dd");

    term.textContent = formatLabel(key);
    description.textContent = formatValue(site[key]);

    detailList.append(term, description);
  });
}

async function loadLocalLayers() {
  const states = await fetch("../data/states.geojson").then(response => response.json());

  L.geoJSON(states, {
    style: {
      color: "#2563eb",
      weight: 1,
      fillOpacity: 0
    }
  }).addTo(siteMap);
}

async function initSitePage() {
  const siteId = getSiteIdFromUrl();
  const response = await fetch("../data/sites.json");
  const sites = await response.json();
  const currentSite = sites.find(site => site.id === siteId);

  if (!currentSite) {
    document.getElementById("siteName").textContent = "Site not found";
    document.getElementById("siteDescription").textContent = "No matching site was found in sites.json.";
    return;
  }

  document.getElementById("siteName").textContent = currentSite.name;
  document.getElementById("siteDescription").textContent = currentSite.description || "";
  document.getElementById("siteStatus").textContent = currentSite.status || "Operational";
  renderSiteDetails(currentSite);

  siteMap = L.map("siteMap").setView([currentSite.lat, currentSite.lng], 9);

  L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  }).addTo(siteMap);

  L.circleMarker([currentSite.lat, currentSite.lng], {
    radius: 9,
    color: "#7f1d1d",
    fillColor: "#ef4444",
    fillOpacity: 0.8,
    weight: 3
  }).addTo(siteMap).bindPopup(`
    <b>${currentSite.name}</b><br/>
    State: ${currentSite.state || "Not available"}<br/>
    Reactor Type: ${currentSite.reactor_type || "Not available"}<br/>
    Operator: ${currentSite.operator || "Not available"}
  `).openPopup();

  await loadLocalLayers();
}

initSitePage();
