# Product Requirements Document (PRD)
## Bangkok Web Mapping Application

| | |
|---|---|
| **Document Version** | 1.2 |
| **Date** | August 9, 2026 |
| **Author** | Chaipat |
| **Status** | Active / Implemented |

---

## 1. Overview

### 1.1 Purpose
This document defines the requirements and technical specifications for a web-based interactive mapping application focused on the Bangkok, Thailand study area. The application allows users to view base and overlay map layers, control layer visibility and transparency, and upload client-side geospatial datasets (GeoJSON) for interactive visual analysis.

### 1.2 Background
The application supports GIS/spatial analysis workflows, allowing quick visualization of spatial datasets (e.g. PostGIS exports, survey data, business/market research overlays) without requiring a full desktop GIS tool.

### 1.3 Goals
- Provide a lightweight, browser-based map viewer centered on Bangkok.
- Allow toggling of multiple map layers (base + overlays).
- Support standard OGC WMS overlay services (e.g. ArcGIS Landsat Multispectral layers).
- Provide interactive transparency/opacity controls for both WMS and uploaded vector overlays.
- Support ad-hoc visualization of user-supplied GeoJSON data with animated marker clustering.

### 1.4 Non-Goals
- No server-side data storage or persistence of uploaded files (client-side only in v1).
- No user authentication/accounts in v1.
- No editing/digitizing tools (draw, edit, delete features) in v1.
- No mobile native app — web only (responsive, touch-compatible).

---

## 2. Tech Stack

| Component | Choice |
|---|---|
| Mapping library | [Leaflet](https://leafletjs.com/) v1.9.4 |
| Clustering plugin | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) v1.5.3 |
| Language | JavaScript (ES6+) / HTML5 / CSS3 |
| Base layer source | OpenStreetMap (OSM) standard tile server |
| Overlay protocol | OGC WMS via `L.tileLayer.wms` (ArcGIS Landsat Services) |
| Client-side file parsing | Browser `FileReader` API + `JSON.parse` (GeoJSON) |
| Web Server | Python 3 HTTP Server (`http.server 8080`) |

---

## 3. Functional Requirements

### 3.1 Study Area
| ID | Requirement | Status |
|---|---|---|
| FR-1.1 | The map shall default to centering on Bangkok, Thailand on load. | Implemented |
| FR-1.2 | Default center coordinates: `[13.7563, 100.5018]`. | Implemented |
| FR-1.3 | Default zoom level: `12` (city-wide view of Bangkok metro area). | Implemented |
| FR-1.4 | Users may freely pan/zoom outside the study area. | Implemented |

### 3.2 Base Layer
| ID | Requirement | Status |
|---|---|---|
| FR-2.1 | The application shall load OpenStreetMap (OSM) standard tiles as the default base layer using `L.tileLayer`. | Implemented |
| FR-2.2 | Tile source URL: `https://tile.openstreetmap.org/{z}/{x}/{y}.png`. | Implemented |
| FR-2.3 | Max zoom shall be set to `19`, matching OSM tile server limits. | Implemented |
| FR-2.4 | Proper OSM attribution shall be displayed per OSM's usage policy. | Implemented |

### 3.3 Layer Control & Transparency Tooling
| ID | Requirement | Status |
|---|---|---|
| FR-3.1 | The application shall provide a Leaflet `L.control.layers` widget in the top-right corner. | Implemented |
| FR-3.2 | The control shall list base layers as radio options and overlays as checkboxes. | Implemented |
| FR-3.3 | Newly added overlay layers (WMS and GeoJSON uploads) shall automatically appear in the layer control. | Implemented |
| FR-3.4 | Each overlay layer shall feature an interactive transparency/opacity slider control (0%–100%). | Implemented |
| FR-3.5 | Opacity controls shall dynamically re-sync and persist across layer control re-renders. | Implemented |

### 3.4 Map Controls & Marker Clustering
| ID | Requirement | Status |
|---|---|---|
| FR-4.1 | Display standard zoom control with "+" and "−" buttons in the top-left. | Implemented |
| FR-4.2 | Support touch pinch-to-zoom and mouse wheel zoom. | Implemented |
| FR-4.3 | Point features in vector datasets shall render using animated marker clustering (`Leaflet.markercluster`). | Implemented |
| FR-4.4 | Clusters shall spiderfy on max zoom, animate markers on add/zoom, and show coverage boundaries on hover. | Implemented |

### 3.5 WMS Overlay Support
| ID | Requirement | Status |
|---|---|---|
| FR-5.1 | Support OGC WMS overlays using `L.tileLayer.wms`. | Implemented |
| FR-5.2 | WMS layers shall support options: `layers`, `format`, `transparent`, `attribution`. | Implemented |
| FR-5.3 | Default pre-configured WMS layers: Landsat Multispectral Natural Color & Agriculture (`MS:Natural Color with DRA`, `MS:Agriculture with DRA`). | Implemented |

### 3.6 User Data Upload & Sample Datasets
| ID | Requirement | Status |
|---|---|---|
| FR-6.1 | File upload control (`<input type="file">`) accepting `.geojson` / `.json` files. | Implemented |
| FR-6.2 | Parsed client-side via `FileReader` API without server round-trips. | Implemented |
| FR-6.3 | Renders Point, LineString, Polygon geometries with dynamic bounding (`fitBounds`). | Implemented |
| FR-6.4 | Feature popups displaying detailed property tables. | Implemented |
| FR-6.5 | User-facing error notifications for invalid file formats or missing GeoJSON structures. | Implemented |
| FR-6.6 | Included sample dataset `bangkok-landmarks.geojson` containing 20 curated Bangkok Points of Interest. | Implemented |

---

## 4. Non-Functional Requirements

| ID | Requirement | Status |
|---|---|---|
| NFR-1 | **Performance:** Map interactions (pan/zoom) remain smooth with chunked loading for large datasets. | Implemented |
| NFR-2 | **Browser Support:** Compatible with modern Web APIs across Chrome, Firefox, Safari, and Edge. | Implemented |
| NFR-3 | **Responsiveness:** Flexbox header and map layout auto-adjusting to viewport size. | Implemented |
| NFR-4 | **File Size Limit:** Configurable 10 MB limit for uploaded GeoJSON files. | Implemented |
| NFR-5 | **Data Privacy:** Client-side in-memory execution with no persistence to remote storage. | Implemented |

---

## 5. Actual File & Code Structure

```
/
├── index.html                  — Application HTML shell, head CDN scripts, header UI & map container
├── style.css                   — Core CSS, color tokens, layout, map viewport & opacity slider styling
├── config.js                   — Central configuration object (study area, base layer, Landsat WMS layers)
├── map-init.js                 — Leaflet map initialization, base layer, zoom & layer control management
├── wms-layers.js               — WMS layer registration & persistent opacity slider control manager
├── geojson-upload.js           — Client-side GeoJSON file reader, validation, Leaflet.markercluster rendering
├── app.js                      — Application bootstrap entry point and console logger
└── bangkok-landmarks.geojson   — Sample GeoJSON dataset containing 20 Bangkok landmarks/POIs
```

---

## 6. Acceptance Criteria Verification

- [x] Map loads centered on Bangkok (`[13.7563, 100.5018]`, zoom 12) with OSM base layer.
- [x] Zoom controls (+/−) functional in top-left corner.
- [x] Layer control dynamically lists base layers and overlays in top-right corner.
- [x] Landsat Multispectral ArcGIS WMS overlays load and render correctly.
- [x] Interactive transparency sliders attached to WMS and GeoJSON overlay entries.
- [x] Users can upload `.geojson` / `.json` files and view clustered markers on the map.
- [x] Map auto-fits extent (`fitBounds`) on dataset load.
- [x] Clicking features displays formatted property popups.
- [x] Sample dataset `bangkok-landmarks.geojson` updated with 20 Bangkok POIs.

