# GIS Map - Pure JavaScript Version

This version does not require React, Vite, or modern Node.js.


## Adding Missing data
* create folder data/ and then add geojson files in it
* geojson files are not included as overall zip side was exeeding github limit of 25MB
* copy geojson file from other repo : districts.geojson, india.geojson, states.geojson, taluks.geojson


## Option 1: Run with VS Code Live Server

1. Open this folder in VS Code.
2. Right-click `index.html`.
3. Click **Open with Live Server**.

## Option 2: Run using npm

This uses Python's built-in static server, so it works even with old Node/npm.

```bash
cd gis-map-pure-js
npm run dev
```

Open:

```text
http://localhost:5173/
```

## Important

Do not open `index.html` directly as a `file:///...` URL. The GeoJSON files are loaded using `fetch()`, so the page should be served through Live Server or a local HTTP server.

## Folder layout

```text
index.html
app.js
styles.css
data/*.geojson
lib/leaflet/*
```


