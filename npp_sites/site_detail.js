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

async function initSitePage() {
  const siteId = getSiteIdFromUrl();
  const sites = await fetch("../data/sites.json").then(response => response.json());
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

  const overlays = {};
  const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(siteMap);
  const visibleLayerNames = window.NppSitesCommon.getVisibleLayerNames();
  const markLayersReady = window.NppSitesCommon.bindLayerStatePersistence(siteMap, overlays);

  window.NppSitesCommon.createSiteMarkerPane(siteMap);
  window.NppSitesCommon.addTileLayer(siteMap);
  await window.NppSitesCommon.loadStandardLayers({
    map: siteMap,
    layerControl,
    overlays,
    visibleLayerNames,
    sites,
    dataRoot: "../data",
    selectedSiteId: currentSite.id,
    detailHrefForSite: site => `./site.html?id=${site.id}`
  });

  markLayersReady();
}

initSitePage();
