document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("map");

  if (!mapElement) {
    return;
  }

  if (!window.NppSitesMap || typeof window.NppSitesMap.initMap !== "function") {
    console.error("NppSitesMap.initMap is not available.");
    return;
  }

  window.NppSitesMap.initMap(mapElement.id);
});
