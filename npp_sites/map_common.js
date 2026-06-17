window.NppSitesCommon = (function () {
  const layerStateKey = "nppSites.visibleLayers";
  const defaultVisibleLayers = ["India", "States", "NPP Sites"];

  function addTileLayer(map) {
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
  }

  function createSiteMarkerPane(map) {
    map.createPane("siteMarkers");
    map.getPane("siteMarkers").style.zIndex = 650;
  }

  function getVisibleLayerNames() {
    try {
      const storedLayers = JSON.parse(localStorage.getItem(layerStateKey));

      if (Array.isArray(storedLayers)) {
        return storedLayers;
      }
    } catch (error) {
      console.warn("Could not read saved map layers:", error);
    }

    return defaultVisibleLayers;
  }

  function saveVisibleLayerNames(map, overlays) {
    const visibleLayers = Object.entries(overlays)
      .filter(([, layer]) => map.hasLayer(layer))
      .map(([name]) => name);

    localStorage.setItem(layerStateKey, JSON.stringify(visibleLayers));
  }

  function bindLayerStatePersistence(map, overlays) {
    let layersReady = false;

    map.on("overlayadd overlayremove", () => {
      if (layersReady) {
        saveVisibleLayerNames(map, overlays);
      }
    });

    return function markLayersReady() {
      layersReady = true;
      saveVisibleLayerNames(map, overlays);
    };
  }

  function boundaryPopupText(properties) {
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
        color: "#2563eb",
        weight: 1.8,
        opacity: 0.9,
        fillOpacity: 0.04
      },
      Taluks: {
        color: "#1d4ed8",
        weight: 1.2,
        opacity: 0.85,
        fillOpacity: 0.025
      }
    };

    return styles[name] || { weight: 1, fillOpacity: 0.05 };
  }

  async function addGeoJsonLayer(options) {
    const { map, layerControl, overlays, name, url, visibleLayerNames } = options;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const layer = L.geoJSON(data, {
      style: styleForLayer(name),
      onEachFeature: function (feature, leafletLayer) {
        leafletLayer.bindPopup(boundaryPopupText(feature.properties || {}));
      }
    });

    overlays[name] = layer;
    layerControl.addOverlay(layer, name);

    if (visibleLayerNames.includes(name)) {
      layer.addTo(map);
    }

    return layer;
  }

  async function addBoundaryLayers(options) {
    const { dataRoot } = options;
    const boundaries = [
      ["India", "india.geojson"],
      ["States", "states.geojson"],
      ["Districts", "districts.geojson"],
      ["Taluks", "taluks.geojson"]
    ];

    for (const [name, fileName] of boundaries) {
      try {
        await addGeoJsonLayer({
          ...options,
          name,
          url: `${dataRoot}/${fileName}`
        });
      } catch (error) {
        console.warn(`Skipping ${name} layer:`, error);
      }
    }
  }

  function sitePopupText(site, detailHref) {
    return `
      <b>${site.name}</b><br/>
      State: ${site.state || "Not available"}<br/>
      Reactor Type: ${site.reactor_type || "Not available"}<br/>
      Operator: ${site.operator || "Not available"}<br/><br/>
      <button type="button" onclick="window.location.href='${detailHref}'">
        Details
      </button>
    `;
  }

  function createSiteLayer(options) {
    const {
      map,
      layerControl,
      overlays,
      sites,
      visibleLayerNames,
      detailHrefForSite,
      selectedSiteId
    } = options;
    const siteLayer = L.layerGroup();
    const siteBounds = L.latLngBounds();
    let selectedMarker = null;

    sites.forEach(site => {
      const isSelected = site.id === selectedSiteId;
      const latLng = [site.lat, site.lng];
      const marker = L.circleMarker(latLng, {
        radius: isSelected ? 10 : 8,
        color: "#7f1d1d",
        fillColor: isSelected ? "#f97316" : "#ef4444",
        fillOpacity: isSelected ? 0.95 : 0.85,
        weight: 3,
        pane: "siteMarkers"
      });

      marker.bindPopup(sitePopupText(site, detailHrefForSite(site)));
      marker.addTo(siteLayer);
      siteBounds.extend(latLng);

      if (isSelected) {
        selectedMarker = marker;
      }
    });

    overlays["NPP Sites"] = siteLayer;
    layerControl.addOverlay(siteLayer, "NPP Sites");

    if (visibleLayerNames.includes("NPP Sites")) {
      siteLayer.addTo(map);

      if (selectedMarker) {
        selectedMarker.openPopup();
      }
    }

    return {
      layer: siteLayer,
      bounds: siteBounds
    };
  }

  async function loadStandardLayers(options) {
    await addBoundaryLayers(options);
    return createSiteLayer(options);
  }

  return {
    addTileLayer,
    bindLayerStatePersistence,
    createSiteMarkerPane,
    getVisibleLayerNames,
    loadStandardLayers
  };
})();
