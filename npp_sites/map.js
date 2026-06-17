window.NppSitesMap = (function () {
  function initMap(containerId) {
    const map = L.map(containerId).setView([22.5, 78.9], 5);
    const overlays = {};
    const layerControl = L.control.layers(null, overlays, { collapsed: false }).addTo(map);
    const visibleLayerNames = window.NppSitesCommon.getVisibleLayerNames();
    const markLayersReady = window.NppSitesCommon.bindLayerStatePersistence(map, overlays);

    window.NppSitesCommon.createSiteMarkerPane(map);
    window.NppSitesCommon.addTileLayer(map);

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

    (async function loadMapLayers() {
      try {
        const sites = await fetch("./data/sites.json").then(response => response.json());
        const siteLayer = await window.NppSitesCommon.loadStandardLayers({
          map,
          layerControl,
          overlays,
          visibleLayerNames,
          sites,
          dataRoot: "./data",
          detailHrefForSite: site => `./npp_sites/site.html?id=${site.id}`
        });

        if (siteLayer.bounds.isValid()) {
          map.fitBounds(siteLayer.bounds, {
            padding: [20, 20]
          });
        }

        markLayersReady();
      } catch (error) {
        console.error("Failed to load map layers:", error);
        showStatus("Failed to load map data. Use Live Server or npm run start, not direct file open.");
      }
    })();
  }

  return {
    initMap
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  const mapElement = document.getElementById("map");

  if (mapElement) {
    window.NppSitesMap.initMap(mapElement.id);
  }
});
