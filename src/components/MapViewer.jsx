import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Map, NavigationControl, ScaleControl, Popup, setWorkerUrl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, SunMedium, Focus, Plane } from 'lucide-react';
import MUNICIPAL_BOUNDARY from '../data/boundary.json';
import { POI_DATA, POI_CATEGORIES } from '../data/poi_data';
import { INFRA_DATA, INFRA_CATEGORIES } from '../data/infra_data';
import { SERVICE_DATA, SERVICE_CATEGORIES } from '../data/service_data';

// ── Build accurate tile URL without URL-encoding template tokens {z}/{x}/{y} ──
function getTileUrl(path) {
  const origin = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin.replace(/\/+$/, '') : '';
  const base = (import.meta.env.BASE_URL || '/').replace(/^\/+|\/+$/g, '');
  const cleanPath = path.replace(/^\/+/, '');
  const basePath = base ? `/${base}/` : '/';
  return `${origin}${basePath}${cleanPath}`;
}

// ── Configure MapLibre Web Worker URL to prevent 404 in production ──
try {
  const localWorker = getTileUrl('assets/maplibre-gl-worker.mjs');
  setWorkerUrl(localWorker);
} catch (e) {
  console.warn('MapLibre workerUrl setup:', e);
}

const UAV_TILE_URL = getTileUrl('tiles/uav/{z}/{x}/{y}.webp');

const TILE_SOURCES = {
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  dark: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  osm: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  light: 'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}'
};

const CLASS_COLOR_MATCH = [
  'match',
  ['get', 'class_id'],
  1, '#ef4444', // Red (N-Roof)
  2, '#22c55e', // Green (E-Roof)
  3, '#3b82f6', // Blue (S-Roof)
  4, '#eab308', // Yellow (W-Roof)
  5, '#d946ef', // Magenta (Flat Roof)
  6, '#84cc16', // Lime (Unclassified)
  7, '#8b5cf6', // Purple (PV Panel)
  '#ef4444'
];

const POI_COLOR_MATCH = [
  'match',
  ['get', 'category'],
  'temple', '#f59e0b',
  'school', '#3b82f6',
  'market', '#ef4444',
  'transport', '#8b5cf6',
  'government', '#06b6d4',
  'park', '#22c55e',
  'bank', '#6366f1',
  '#3b82f6'
];

const SERVICE_COLOR_MATCH = [
  'match',
  ['get', 'category'],
  'health', '#ef4444',
  'police', '#3b82f6',
  'fire', '#f97316',
  'welfare', '#8b5cf6',
  'post', '#06b6d4',
  'waste', '#22c55e',
  '#ef4444'
];

const INFRA_COLOR_MATCH = [
  'match',
  ['get', 'category'],
  'bridge', '#ef4444',
  'water', '#06b6d4',
  'electric', '#eab308',
  '#f97316'
];

const ENERGY_LEGEND = [
  { color: '#22c55e', label: '< 7,500 kWh/y' },
  { color: '#f97316', label: '≥ 7,500 kWh/y' },
  { color: '#64748b', label: 'U-Roof / Unclassified' },
];

const CAPACITY_LEGEND = [
  { color: '#22c55e', label: '< 5.0 kWp' },
  { color: '#f97316', label: '≥ 5.0 kWp' },
  { color: '#64748b', label: 'U-Roof' },
];

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

export default function MapViewer({
  facetsData,
  buildingsData,
  filters,
  visibleLayers,
  uploadedBoundary,
  municipalBoundary,
  colorMode,
  viewMode,
  lang = 'th',
  tariff = 4.2,
  // Smart City props
  activeTab = 'solar',
  poiData = POI_DATA,
  infraData = INFRA_DATA,
  serviceData = SERVICE_DATA,
  poiVisible = {},
  infraVisible = {},
  serviceVisible = {},
  selectedFeature = null,
}) {
  const t = translations[lang] || translations.th;
  const langRef = useRef(lang);
  const tariffRef = useRef(tariff);
  const viewModeRef = useRef(viewMode);
  const colorModeRef = useRef(colorMode);
  const activeTabRef = useRef(activeTab);
  const facetsDataRef = useRef(facetsData);
  const buildingsDataRef = useRef(buildingsData);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { tariffRef.current = tariff; }, [tariff]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { facetsDataRef.current = facetsData; }, [facetsData]);
  useEffect(() => { buildingsDataRef.current = buildingsData; }, [buildingsData]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('uav');

  // ── Color expression ─────────────────────────────────────────
  const getColorExpr = (mode, vm) => {
    if (vm === 'buildings') return ['coalesce', ['get', 'energy_color'], '#f97316'];
    return mode === 'energy'
      ? ['coalesce', ['get', 'energy_color'], '#22c55e']
      : CLASS_COLOR_MATCH;
  };

  // ── Filtered Facets ──────────────────────────────────────────
  const filteredFacets = useMemo(() => {
    if (!facetsData || !facetsData.features) return null;

    const minArea = Number(filters?.minArea) || 0;
    const minEnergy = Number(filters?.minEnergy) || 0;

    const filtered = facetsData.features.filter(f => {
      const p = f.properties;
      if (!p) return false;
      if (visibleLayers && visibleLayers[p.class_id] === false) return false;
      const area = p.area_3d || p.area_2d || 0;
      const eng = p.energy_corrected_kwh || p.energy_kwh || 0;
      if (minArea > 0 && area < minArea) return false;
      if (minEnergy > 0 && eng < minEnergy) return false;
      return true;
    });

    return { type: 'FeatureCollection', features: filtered };
  }, [facetsData, filters, visibleLayers]);

  // ── Filtered Buildings ───────────────────────────────────────
  const filteredBuildings = useMemo(() => {
    if (!buildingsData || !buildingsData.features) return null;

    const minArea = Number(filters?.minArea) || 0;
    const minEnergy = Number(filters?.minEnergy) || 0;

    const filtered = buildingsData.features.filter(f => {
      const p = f.properties;
      if (!p) return false;
      const area = p.area_2d || p.area_3d || 0;
      const eng = p.energy_corrected_kwh || p.energy_kwh || 0;
      if (minArea > 0 && area < minArea) return false;
      if (minEnergy > 0 && eng < minEnergy) return false;
      return true;
    });

    return { type: 'FeatureCollection', features: filtered };
  }, [buildingsData, filters]);

  // ── Zoom Helpers ─────────────────────────────────────────────
  const zoomTo = (mapInstance, geoJSON) => {
    if (!geoJSON || !geoJSON.features?.length) return;
    try {
      const bbox = turf.bbox(geoJSON);
      mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
        padding: { top: 60, bottom: 60, left: 420, right: 60 },
        duration: 900
      });
    } catch (_) {}
  };

  const zoomToRooftops = () => {
    const map = mapRef.current;
    if (!map) return;
    if (uploadedBoundary?.features?.length) { zoomTo(map, uploadedBoundary); return; }
    if (activeTab === 'poi' && poiData?.features?.length) { zoomTo(map, poiData); return; }
    if (activeTab === 'infra' && infraData?.features?.length) { zoomTo(map, infraData); return; }
    if (activeTab === 'service' && serviceData?.features?.length) { zoomTo(map, serviceData); return; }
    if (facetsData?.features?.length) { zoomTo(map, facetsData); return; }
    if (buildingsData?.features?.length) { zoomTo(map, buildingsData); return; }
    zoomTo(map, MUNICIPAL_BOUNDARY);
  };

  // ── Apply Basemap to MapLibre Directly ───────────────────────
  const applyBasemap = (map, key) => {
    if (!map) return;
    const allBasemapLayers = ['satellite-layer', 'uav-layer', 'dark-layer', 'osm-layer', 'light-layer'];
    const showLayers = {
      uav: ['satellite-layer', 'uav-layer'],
      satellite: ['satellite-layer'],
      dark: ['dark-layer'],
      osm: ['osm-layer'],
      light: ['light-layer'],
    }[key] || ['satellite-layer', 'uav-layer'];

    allBasemapLayers.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', showLayers.includes(id) ? 'visible' : 'none');
      }
    });
    map.triggerRepaint();
  };

  const changeBasemap = (key) => {
    setCurrentBasemap(key);
    applyBasemap(mapRef.current, key);
  };

  // ── Setup Popups ─────────────────────────────────────────────
  const setupPopups = (mapInstance) => {
    mapInstance.on('click', (e) => {
      const allInteractiveLayers = [
        'poi-circle',
        'service-circle',
        'infra-circle',
        'infra-line',
        'facets-fill',
        'bldgs-fill'
      ];
      const ql = allInteractiveLayers.filter(
        id => mapInstance.getLayer(id) && mapInstance.getLayoutProperty(id, 'visibility') !== 'none'
      );
      if (!ql.length) return;

      const feats = mapInstance.queryRenderedFeatures(e.point, { layers: ql });
      if (!feats?.length) return;

      const feat = feats[0];
      const p = feat.properties;
      const layerId = feat.layer.id;
      const curT = translations[langRef.current] || translations.th;
      const curLang = langRef.current || 'th';

      // 1. POI & Service & Infra popups
      if (layerId === 'poi-circle' || layerId === 'service-circle' || layerId === 'infra-circle' || layerId === 'infra-line') {
        const name = curLang === 'th' ? (p.name_th || p.name_en) : (p.name_en || p.name_th);
        const desc = curLang === 'th' ? (p.description_th || p.description_en) : (p.description_en || p.description_th);
        const cat = p.category || '';
        const icon = layerId === 'poi-circle' ? '📍' : layerId === 'service-circle' ? '🏥' : '🏗️';
        const color = layerId === 'poi-circle' ? '#3b82f6' : layerId === 'service-circle' ? '#ef4444' : '#f97316';

        popupRef.current.setLngLat(e.lngLat).setHTML(`
          <div style="font-family:'Prompt','Inter',sans-serif">
            <div style="font-size:0.95rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
              <span style="font-size:1.1rem">${icon}</span>
              <span style="color:#f8fafc">${name}</span>
            </div>
            ${desc ? `<div style="font-size:0.78rem;color:#cbd5e1;line-height:1.4;margin-bottom:8px">${desc}</div>` : ''}
            ${p.phone ? `<div class="popup-row"><span style="color:#94a3b8">📞 ${curT.servicePhone || 'โทร'}</span><span style="color:#38bdf8;font-weight:600">${p.phone}</span></div>` : ''}
            ${p.length_km ? `<div class="popup-row"><span style="color:#94a3b8">📏 ${curLang === 'th' ? 'ระยะทาง' : 'Length'}</span><span>${p.length_km} km</span></div>` : ''}
            ${p.capacity_kva ? `<div class="popup-row"><span style="color:#94a3b8">⚡ ${curLang === 'th' ? 'กำลังผลิต' : 'Capacity'}</span><span>${p.capacity_kva} KVA</span></div>` : ''}
            ${p.capacity_m3 ? `<div class="popup-row"><span style="color:#94a3b8">💧 ${curLang === 'th' ? 'ความจุ' : 'Capacity'}</span><span>${p.capacity_m3} m³</span></div>` : ''}
            ${p.width_m ? `<div class="popup-row"><span style="color:#94a3b8">📐 ${curLang === 'th' ? 'ความกว้าง' : 'Width'}</span><span>${p.width_m} m</span></div>` : ''}
            <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08)">
              <span style="color:#94a3b8">${curLang === 'th' ? 'หมวดหมู่' : 'Category'}</span>
              <span style="color:${color};font-weight:600;text-transform:capitalize">${cat}</span>
            </div>
          </div>
        `).addTo(mapInstance);
        return;
      }

      // 2. Solar rooftop / building popup
      const curTariff = tariffRef.current || 4.2;
      const curMode = viewModeRef.current || 'facets';

      const area = Number(p.area_3d || p.area_2d || 0);
      const cap = Number(p.capacity_kwp || ((area * 0.18) * 0.20));
      const eng = Number(p.energy_corrected_kwh || p.energy_kwh || 0);
      const sav = Number(p.savings_thb || (eng * curTariff));
      const co2 = (eng * 0.4999) / 1000;
      const clsName = curT.classes?.[p.class_id] || p.class_name || (curMode === 'buildings' ? 'Building' : 'Roof');
      const dotColor = p.color || p.energy_color || '#3b82f6';

      popupRef.current.setLngLat(e.lngLat).setHTML(`
        <div style="font-family:'Prompt','Inter',sans-serif">
          <div style="font-size:0.95rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
            <div style="width:12px;height:12px;border-radius:3px;background:${dotColor};box-shadow:0 0 6px ${dotColor}"></div>
            ${curMode === 'buildings' ? (p.building_id || 'Building') : clsName}
          </div>
          <div class="popup-row"><span style="color:#94a3b8">${curT.popupArea}</span><span>${area.toFixed(1)} m²</span></div>
          ${p.slope_deg ? `<div class="popup-row"><span style="color:#94a3b8">${curT.popupSlope}</span><span>${Number(p.slope_deg).toFixed(1)}°</span></div>` : ''}
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08)">
            <span style="color:#fcd34d;font-weight:600">⚡ ${curT.popupCapacity}</span>
            <span style="color:#fcd34d;font-weight:700">${cap.toFixed(1)} kWp</span>
          </div>
          <div class="popup-row">
            <span style="color:#34d399;font-weight:600">☀️ ${curT.popupAnnualEnergy}</span>
            <span style="color:#34d399;font-weight:700">${fmt(eng)} kWh/y</span>
          </div>
          <div class="popup-row highlight">
            <span>💰 ${curT.popupAnnualSavings}</span>
            <span>~${fmt(sav)} ฿/y</span>
          </div>
          <div class="popup-row">
            <span style="color:#38bdf8">🌿 ${curT.popupCo2}</span>
            <span style="color:#38bdf8">${co2.toFixed(2)} t/y</span>
          </div>
        </div>
      `).addTo(mapInstance);
    });

    mapInstance.on('mousemove', (e) => {
      const allInteractiveLayers = [
        'poi-circle',
        'service-circle',
        'infra-circle',
        'infra-line',
        'facets-fill',
        'bldgs-fill'
      ];
      const ql = allInteractiveLayers.filter(
        id => mapInstance.getLayer(id) && mapInstance.getLayoutProperty(id, 'visibility') !== 'none'
      );
      const feats = ql.length ? mapInstance.queryRenderedFeatures(e.point, { layers: ql }) : [];
      mapInstance.getCanvas().style.cursor = feats.length ? 'pointer' : '';
    });
  };

  // ── Initialize Map ───────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const initialStyle = {
      version: 8,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        // ── Basemap Rasters ──────────────────────────────────
        's-satellite': { type: 'raster', tiles: [TILE_SOURCES.satellite], tileSize: 256, attribution: '© Esri, Maxar' },
        's-uav': {
          type: 'raster',
          tiles: [UAV_TILE_URL],
          tileSize: 256,
          minzoom: 14,
          maxzoom: 19,
          attribution: '© UAV 30cm Orthophoto'
        },
        's-dark': { type: 'raster', tiles: [TILE_SOURCES.dark], tileSize: 256, attribution: '© Esri' },
        's-osm': { type: 'raster', tiles: [TILE_SOURCES.osm], tileSize: 256, attribution: '© OpenStreetMap' },
        's-light': { type: 'raster', tiles: [TILE_SOURCES.light], tileSize: 256, attribution: '© Esri' },

        // ── Vector GeoJSON Sources ───────────────────────────
        'bound-src': { type: 'geojson', data: MUNICIPAL_BOUNDARY },
        'aoi-src': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } },
        'facets-src': {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          buffer: 64,
          tolerance: 0.5
        },
        'bldgs-src': {
          type: 'geojson',
          data: { type: 'FeatureCollection', features: [] },
          buffer: 64,
          tolerance: 0.5
        },
        // ── Smart City Layers (In-memory ready) ──────────────
        'poi-src': { type: 'geojson', data: poiData || POI_DATA },
        'infra-src': { type: 'geojson', data: infraData || INFRA_DATA },
        'service-src': { type: 'geojson', data: serviceData || SERVICE_DATA }
      },
      layers: [
        // ── 1. Base Satellite (Underneath UAV) ───────────────
        { id: 'satellite-layer', type: 'raster', source: 's-satellite', layout: { visibility: 'visible' } },
        { id: 'uav-layer', type: 'raster', source: 's-uav', layout: { visibility: 'visible' } },
        { id: 'dark-layer', type: 'raster', source: 's-dark', layout: { visibility: 'none' } },
        { id: 'osm-layer', type: 'raster', source: 's-osm', layout: { visibility: 'none' } },
        { id: 'light-layer', type: 'raster', source: 's-light', layout: { visibility: 'none' } },

        // ── 2. Municipal Boundary Background Fill ─────────────
        { id: 'bound-fill', type: 'fill', source: 'bound-src', layout: { visibility: 'visible' }, paint: { 'fill-color': '#00f0ff', 'fill-opacity': 0.04 } },

        // ── 3. Uploaded AOI ──────────────────────────────────
        { id: 'aoi-fill', type: 'fill', source: 'aoi-src', paint: { 'fill-color': '#a855f7', 'fill-opacity': 0.15 } },
        { id: 'aoi-line', type: 'line', source: 'aoi-src', paint: { 'line-color': '#c084fc', 'line-width': 2.5 } },

        // ── 4. Buildings Footprints ──────────────────────────
        {
          id: 'bldgs-fill',
          type: 'fill',
          source: 'bldgs-src',
          layout: { visibility: 'none' },
          paint: {
            'fill-color': ['coalesce', ['get', 'energy_color'], '#f97316'],
            'fill-opacity': 0.85
          }
        },
        {
          id: 'bldgs-outline',
          type: 'line',
          source: 'bldgs-src',
          layout: { visibility: 'none' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.0,
            'line-opacity': 0.6
          }
        },

        // ── 5. Roof Facets Polygons (Vibrant on UAV) ─────────
        {
          id: 'facets-fill',
          type: 'fill',
          source: 'facets-src',
          layout: { visibility: 'visible' },
          paint: {
            'fill-color': CLASS_COLOR_MATCH,
            'fill-opacity': 0.85
          }
        },
        {
          id: 'facets-outline',
          type: 'line',
          source: 'facets-src',
          layout: { visibility: 'visible' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.2,
            'line-opacity': 0.85
          }
        },

        // ── 6. Infrastructure Lines (Glow + Solid) ───────────
        {
          id: 'infra-line-glow',
          type: 'line',
          source: 'infra-src',
          layout: { visibility: 'visible' },
          filter: ['==', ['geometry-type'], 'LineString'],
          paint: {
            'line-color': '#000000',
            'line-width': 6,
            'line-opacity': 0.7
          }
        },
        {
          id: 'infra-line',
          type: 'line',
          source: 'infra-src',
          layout: { visibility: 'visible' },
          filter: ['==', ['geometry-type'], 'LineString'],
          paint: {
            'line-color': '#f97316',
            'line-width': 3.5,
            'line-opacity': 0.95
          }
        },

        // ── 7. Infrastructure Points (Glow + Center) ─────────
        {
          id: 'infra-circle-glow',
          type: 'circle',
          source: 'infra-src',
          layout: { visibility: 'visible' },
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'circle-radius': 14,
            'circle-color': INFRA_COLOR_MATCH,
            'circle-opacity': 0.25
          }
        },
        {
          id: 'infra-circle',
          type: 'circle',
          source: 'infra-src',
          layout: { visibility: 'visible' },
          filter: ['==', ['geometry-type'], 'Point'],
          paint: {
            'circle-radius': 8,
            'circle-color': INFRA_COLOR_MATCH,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95
          }
        },
        {
          id: 'infra-label',
          type: 'symbol',
          source: 'infra-src',
          layout: {
            visibility: 'visible',
            'text-field': ['get', 'name_th'],
            'text-size': 11,
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#fde047',
            'text-halo-color': '#090d16',
            'text-halo-width': 2.5
          }
        },

        // ── 8. POI Circles & Labels ──────────────────────────
        {
          id: 'poi-glow',
          type: 'circle',
          source: 'poi-src',
          layout: { visibility: 'visible' },
          paint: {
            'circle-radius': 15,
            'circle-color': POI_COLOR_MATCH,
            'circle-opacity': 0.25
          }
        },
        {
          id: 'poi-circle',
          type: 'circle',
          source: 'poi-src',
          layout: { visibility: 'visible' },
          paint: {
            'circle-radius': 8.5,
            'circle-color': POI_COLOR_MATCH,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95
          }
        },
        {
          id: 'poi-label',
          type: 'symbol',
          source: 'poi-src',
          layout: {
            visibility: 'visible',
            'text-field': ['get', 'name_th'],
            'text-size': 11,
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#ffffff',
            'text-halo-color': '#090d16',
            'text-halo-width': 2.5
          }
        },

        // ── 9. Service Circles & Labels ──────────────────────
        {
          id: 'service-glow',
          type: 'circle',
          source: 'service-src',
          layout: { visibility: 'visible' },
          paint: {
            'circle-radius': 15,
            'circle-color': SERVICE_COLOR_MATCH,
            'circle-opacity': 0.25
          }
        },
        {
          id: 'service-circle',
          type: 'circle',
          source: 'service-src',
          layout: { visibility: 'visible' },
          paint: {
            'circle-radius': 8.5,
            'circle-color': SERVICE_COLOR_MATCH,
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95
          }
        },
        {
          id: 'service-label',
          type: 'symbol',
          source: 'service-src',
          layout: {
            visibility: 'visible',
            'text-field': ['get', 'name_th'],
            'text-size': 11,
            'text-offset': [0, 1.3],
            'text-anchor': 'top',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#fca5a5',
            'text-halo-color': '#090d16',
            'text-halo-width': 2.5
          }
        },

        // ── 10. TOPMOST: Municipal Boundary (Always on Top) ─
        {
          id: 'bound-glow',
          type: 'line',
          source: 'bound-src',
          layout: { visibility: 'visible' },
          paint: {
            'line-color': '#000000',
            'line-width': 8.0,
            'line-opacity': 0.95
          }
        },
        {
          id: 'bound-line',
          type: 'line',
          source: 'bound-src',
          layout: { visibility: 'visible' },
          paint: {
            'line-color': '#00f0ff',
            'line-width': 4.0,
            'line-opacity': 1.0
          }
        },
        {
          id: 'bound-line-inner',
          type: 'line',
          source: 'bound-src',
          layout: { visibility: 'visible' },
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.5,
            'line-dasharray': [4, 3],
            'line-opacity': 1.0
          }
        }
      ]
    };

    const map = new Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [100.055, 17.985],
      zoom: 13.8,
      minZoom: 10,
      maxZoom: 22,
      pitch: 0,
      bearing: 0
    });

    mapRef.current = map;

    popupRef.current = new Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '320px'
    });

    map.on('error', (e) => {
      console.warn('[MapViewer Warning]', e.error?.message || e);
    });

    map.on('load', () => {
      try {
        map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
      } catch (_) {}
      try {
        map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');
      } catch (_) {}

      setupPopups(map);
      setMapLoaded(true);

      // Force push GeoJSON data
      const curFacets = filteredFacets || facetsDataRef.current;
      if (curFacets?.features?.length) {
        map.getSource('facets-src')?.setData(curFacets);
      }

      const curBldgs = filteredBuildings || buildingsDataRef.current;
      if (curBldgs?.features?.length) {
        map.getSource('bldgs-src')?.setData(curBldgs);
      }

      if (poiData) map.getSource('poi-src')?.setData(poiData);
      if (infraData) map.getSource('infra-src')?.setData(infraData);
      if (serviceData) map.getSource('service-src')?.setData(serviceData);

      map.getSource('bound-src')?.setData(MUNICIPAL_BOUNDARY);
      applyBasemap(map, currentBasemap);

      // Automatically frame the entire municipal boundary cleanly!
      zoomTo(map, MUNICIPAL_BOUNDARY);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // ── Sync Basemap Visibility automatically when currentBasemap changes ─
  useEffect(() => {
    if (mapRef.current) {
      applyBasemap(mapRef.current, currentBasemap);
    }
  }, [currentBasemap, mapLoaded]);

  // ── Sync Facets Data into MapLibre Source on React Filter ────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const dataToSet = filteredFacets || facetsData;
    if (!dataToSet?.features) return;

    const pushFacets = () => {
      const src = map.getSource('facets-src');
      if (src) {
        src.setData(dataToSet);
        map.triggerRepaint();
      }
    };

    if (map.isStyleLoaded()) {
      pushFacets();
    } else {
      map.once('load', pushFacets);
    }
  }, [filteredFacets, facetsData, mapLoaded]);

  // ── Sync Buildings Data into MapLibre Source ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const dataToSet = filteredBuildings || buildingsData;
    if (!dataToSet?.features) return;

    const pushBldgs = () => {
      const src = map.getSource('bldgs-src');
      if (src) {
        src.setData(dataToSet);
        map.triggerRepaint();
      }
    };

    if (map.isStyleLoaded()) {
      pushBldgs();
    } else {
      map.once('load', pushBldgs);
    }
  }, [filteredBuildings, buildingsData, mapLoaded]);

  // ── Sync Tab & viewMode visibility ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const isSolar = activeTab === 'solar';
    const isFacets = viewMode === 'facets';

    // Solar layers
    if (map.getLayer('facets-fill')) map.setLayoutProperty('facets-fill', 'visibility', isSolar && isFacets ? 'visible' : 'none');
    if (map.getLayer('facets-outline')) map.setLayoutProperty('facets-outline', 'visibility', isSolar && isFacets ? 'visible' : 'none');
    if (map.getLayer('bldgs-fill')) map.setLayoutProperty('bldgs-fill', 'visibility', isSolar && !isFacets ? 'visible' : 'none');
    if (map.getLayer('bldgs-outline')) map.setLayoutProperty('bldgs-outline', 'visibility', isSolar && !isFacets ? 'visible' : 'none');

    // POI layers
    const isPoi = activeTab === 'poi';
    if (map.getLayer('poi-glow')) map.setLayoutProperty('poi-glow', 'visibility', isPoi ? 'visible' : 'none');
    if (map.getLayer('poi-circle')) map.setLayoutProperty('poi-circle', 'visibility', isPoi ? 'visible' : 'none');
    if (map.getLayer('poi-label')) map.setLayoutProperty('poi-label', 'visibility', isPoi ? 'visible' : 'none');

    // Infra layers
    const isInfra = activeTab === 'infra';
    if (map.getLayer('infra-line-glow')) map.setLayoutProperty('infra-line-glow', 'visibility', isInfra ? 'visible' : 'none');
    if (map.getLayer('infra-line')) map.setLayoutProperty('infra-line', 'visibility', isInfra ? 'visible' : 'none');
    if (map.getLayer('infra-circle-glow')) map.setLayoutProperty('infra-circle-glow', 'visibility', isInfra ? 'visible' : 'none');
    if (map.getLayer('infra-circle')) map.setLayoutProperty('infra-circle', 'visibility', isInfra ? 'visible' : 'none');
    if (map.getLayer('infra-label')) map.setLayoutProperty('infra-label', 'visibility', isInfra ? 'visible' : 'none');

    // Service layers
    const isService = activeTab === 'service';
    if (map.getLayer('service-glow')) map.setLayoutProperty('service-glow', 'visibility', isService ? 'visible' : 'none');
    if (map.getLayer('service-circle')) map.setLayoutProperty('service-circle', 'visibility', isService ? 'visible' : 'none');
    if (map.getLayer('service-label')) map.setLayoutProperty('service-label', 'visibility', isService ? 'visible' : 'none');

    // Municipal boundary is ALWAYS visible on all tabs!
    if (map.getLayer('bound-fill')) map.setLayoutProperty('bound-fill', 'visibility', 'visible');
    if (map.getLayer('bound-glow')) map.setLayoutProperty('bound-glow', 'visibility', 'visible');
    if (map.getLayer('bound-line')) map.setLayoutProperty('bound-line', 'visibility', 'visible');
    if (map.getLayer('bound-line-inner')) map.setLayoutProperty('bound-line-inner', 'visibility', 'visible');

    // When tab changes, automatically frame that tab's data!
    if (activeTab === 'poi' && poiData?.features?.length) {
      zoomTo(map, poiData);
    } else if (activeTab === 'infra' && infraData?.features?.length) {
      zoomTo(map, infraData);
    } else if (activeTab === 'service' && serviceData?.features?.length) {
      zoomTo(map, serviceData);
    }

    map.triggerRepaint();
  }, [viewMode, activeTab, mapLoaded]);

  // ── Sync colorMode ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (map.getLayer('facets-fill')) {
      map.setPaintProperty('facets-fill', 'fill-color', getColorExpr(colorMode, viewMode));
      map.triggerRepaint();
    }
  }, [colorMode, viewMode, mapLoaded]);

  // ── Sync uploaded boundary AOI ───────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const uSrc = map.getSource('aoi-src');
    if (uSrc) {
      uSrc.setData(uploadedBoundary || { type: 'FeatureCollection', features: [] });
      if (uploadedBoundary?.features?.length) zoomTo(map, uploadedBoundary);
    }
  }, [uploadedBoundary, mapLoaded]);

  // ── Sync POI/Infra/Service data into map sources ─────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pushData = () => {
      if (poiData) map.getSource('poi-src')?.setData(poiData);
      if (infraData) map.getSource('infra-src')?.setData(infraData);
      if (serviceData) map.getSource('service-src')?.setData(serviceData);
    };
    if (map.isStyleLoaded()) pushData();
    else map.once('load', pushData);
  }, [poiData, infraData, serviceData, mapLoaded]);

  // ── Filter POI/Infra/Service by category visibility ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // POI filter
    if (map.getLayer('poi-circle') && poiVisible) {
      const visibleCats = Object.entries(poiVisible).filter(([,v]) => v).map(([k]) => k);
      const poiFilter = visibleCats.length === 0
        ? ['==', ['get', 'category'], '__none__']
        : ['in', ['get', 'category'], ['literal', visibleCats]];
      ['poi-glow', 'poi-circle', 'poi-label'].forEach(id => {
        if (map.getLayer(id)) map.setFilter(id, poiFilter);
      });
    }

    // Infra filter
    const infraCats = Object.entries(infraVisible || {}).filter(([,v]) => v).map(([k]) => k);
    ['infra-line-glow', 'infra-line', 'infra-circle-glow', 'infra-circle', 'infra-label'].forEach(layerId => {
      if (map.getLayer(layerId)) {
        const isLine = layerId.includes('line');
        const baseFilter = isLine ? ['==', ['geometry-type'], 'LineString'] : ['==', ['geometry-type'], 'Point'];
        if (infraCats.length === 0) {
          map.setFilter(layerId, ['all', baseFilter, ['==', ['get', 'category'], '__none__']]);
        } else {
          map.setFilter(layerId, ['all', baseFilter, ['in', ['get', 'category'], ['literal', infraCats]]]);
        }
      }
    });

    // Service filter
    if (map.getLayer('service-circle') && serviceVisible) {
      const visCats = Object.entries(serviceVisible).filter(([,v]) => v).map(([k]) => k);
      const svcFilter = visCats.length === 0
        ? ['==', ['get', 'category'], '__none__']
        : ['in', ['get', 'category'], ['literal', visCats]];
      ['service-glow', 'service-circle', 'service-label'].forEach(id => {
        if (map.getLayer(id)) map.setFilter(id, svcFilter);
      });
    }

    map.triggerRepaint();
  }, [poiVisible, infraVisible, serviceVisible, mapLoaded]);

  // ── Fly to Selected Feature when clicked in Sidebar ──────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !selectedFeature) return;

    try {
      let coords = null;
      if (selectedFeature.geometry?.type === 'Point') {
        coords = selectedFeature.geometry.coordinates;
      } else if (selectedFeature.geometry) {
        const centroid = turf.centroid(selectedFeature);
        coords = centroid.geometry.coordinates;
      }

      if (coords) {
        map.flyTo({
          center: coords,
          zoom: 17.5,
          pitch: 25,
          duration: 1200
        });

        // Open popup
        const p = selectedFeature.properties || {};
        const name = lang === 'th' ? (p.name_th || p.name_en) : (p.name_en || p.name_th);
        const desc = lang === 'th' ? (p.description_th || p.description_en) : (p.description_en || p.description_th);

        if (popupRef.current) {
          popupRef.current.setLngLat(coords).setHTML(`
            <div style="font-family:'Prompt','Inter',sans-serif">
              <div style="font-size:0.95rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;margin-bottom:8px;color:#f8fafc">
                📍 ${name}
              </div>
              ${desc ? `<div style="font-size:0.78rem;color:#cbd5e1;line-height:1.4;margin-bottom:8px">${desc}</div>` : ''}
              ${p.phone ? `<div class="popup-row"><span style="color:#94a3b8">📞 โทร</span><span style="color:#38bdf8;font-weight:600">${p.phone}</span></div>` : ''}
            </div>
          `).addTo(map);
        }
      }
    } catch (_) {}
  }, [selectedFeature, lang]);

  // ── Stats for floating card ──────────────────────────────────
  const activeData = viewMode === 'buildings' ? buildingsData : facetsData;
  const totalCapMwp = ((activeData?.features?.reduce((a, f) => a + (f.properties?.capacity_kwp || 0), 0) || 0) / 1000).toFixed(2);
  const totalYieldGwh = ((activeData?.features?.reduce((a, f) => a + (f.properties?.energy_corrected_kwh || f.properties?.energy_kwh || 0), 0) || 0) / 1000000).toFixed(2);

  const legendItems = viewMode === 'buildings'
    ? CAPACITY_LEGEND
    : colorMode === 'energy' ? ENERGY_LEGEND
    : Object.entries(ROOF_CLASSES).map(([id, cls]) => ({
        color: cls.color, label: t.classes?.[id] || cls.name
      }));

  return (
    <div className="map-wrap">
      <div ref={mapContainerRef} className="map-container" />

      {/* Basemap Switcher & Controls */}
      <div className="map-floating-panel basemap-control">
        {[
          { key: 'uav',       icon: <Plane size={14} />,     label: lang === 'th' ? 'โดรน UAV (30cm)' : 'UAV Ortho' },
          { key: 'satellite', icon: <Globe size={14} />,     label: lang === 'th' ? 'ดาวเทียม' : 'Satellite' },
          { key: 'dark',      icon: <Layers size={14} />,    label: lang === 'th' ? 'มืด (GIS)' : 'Dark' },
          { key: 'osm',       icon: <Compass size={14} />,   label: 'OSM' },
          { key: 'light',     icon: <SunMedium size={14} />, label: lang === 'th' ? 'สว่าง' : 'Light' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            className={`basemap-btn ${currentBasemap === key ? 'active' : ''}`}
            onPointerDown={(e) => {
              e.preventDefault();
              changeBasemap(key);
            }}
            onClick={(e) => {
              e.preventDefault();
              changeBasemap(key);
            }}
          >
            {icon} {label}
          </button>
        ))}
        <button
          type="button"
          className="basemap-btn"
          onPointerDown={(e) => {
            e.preventDefault();
            zoomToRooftops();
          }}
          onClick={(e) => {
            e.preventDefault();
            zoomToRooftops();
          }}
          style={{ borderLeft: '1px solid rgba(255,255,255,0.18)', marginLeft: 4, paddingLeft: 8 }}
          title={lang === 'th' ? 'ซูมขอบเขตเด่นชัย' : 'Fit to Denchai'}
        >
          <Focus size={14} color="#38bdf8" /> {lang === 'th' ? 'ซูมขอบเขต' : 'Fit View'}
        </button>
      </div>

      {/* Quick Summary Card — changes with activeTab */}
      <div style={{
        position: 'absolute', top: 62, left: 16, zIndex: 400,
        background: 'rgba(13,20,36,0.94)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59,130,246,0.35)', borderRadius: 12,
        padding: '14px 16px', color: 'white', minWidth: 210,
        boxShadow: 'var(--shadow-lg)', pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          🏙️ Denchai Smart City
        </div>
        {activeTab === 'solar' ? (
          <>
            <div style={{ marginBottom: 6 }}>
              <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>{lang === 'th' ? 'กำลังผลิตติดตั้งรวม' : 'Total Capacity'}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fcd34d' }}>
                {totalCapMwp} <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>MWp</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>{t.kpiTotalEnergy}</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#34d399' }}>
                {totalYieldGwh} <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>GWh/y</span>
              </div>
            </div>
          </>
        ) : (
          <div>
            <div style={{ fontSize: '0.68rem', color: '#38bdf8' }}>
              {activeTab === 'poi' ? (lang === 'th' ? '📍 สถานที่สำคัญ' : '📍 Points of Interest')
               : activeTab === 'infra' ? (lang === 'th' ? '🏗️ โครงสร้างพื้นฐาน' : '🏗️ Infrastructure')
               : (lang === 'th' ? '🏥 บริการสาธารณะ' : '🏥 Public Services')}
            </div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8' }}>
              {activeTab === 'poi' ? (poiData?.features?.length || 0)
               : activeTab === 'infra' ? (infraData?.features?.length || 0)
               : (serviceData?.features?.length || 0)}
              <span style={{ fontSize: '0.78rem', fontWeight: 500 }}> {lang === 'th' ? 'จุดข้อมูล' : 'locations'}</span>
            </div>
          </div>
        )}
      </div>

      {/* Legend Overlay (Solar tab) */}
      {activeTab === 'solar' && (
        <div className="map-floating-panel map-legend">
          <div className="legend-title">
            {viewMode === 'buildings' ? 'System Capacity' : colorMode === 'energy' ? 'Solar Heatmap' : t.roofClassesHeader}
          </div>
          {legendItems.map((item, i) => (
            <div key={i} className="legend-row">
              <div className="legend-swatch" style={{ background: item.color }} />
              <span style={{ color: '#cbd5e1' }}>{item.label}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="legend-row">
              <div style={{ width: 14, height: 3, borderTop: '3px solid #00f0ff' }} />
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
            </div>
            {uploadedBoundary && (
              <div className="legend-row">
                <div style={{ width: 14, height: 3, background: '#c084fc', borderRadius: 2 }} />
                <span style={{ color: '#c084fc' }}>AOI</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend Overlay (POI tab) */}
      {activeTab === 'poi' && (
        <div className="map-floating-panel map-legend">
          <div className="legend-title">📍 {lang === 'th' ? 'หมวดหมู่สถานที่สำคัญ' : 'POI Categories'}</div>
          {Object.entries(POI_CATEGORIES).map(([key, cat]) => (
            <div key={key} className="legend-row">
              <div className="legend-swatch" style={{ background: cat.color, borderRadius: '50%' }} />
              <span style={{ color: '#cbd5e1' }}>{cat.icon} {lang === 'th' ? cat.name_th : cat.name_en}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="legend-row">
              <div style={{ width: 14, height: 3, borderTop: '3px solid #00f0ff' }} />
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend Overlay (Infrastructure tab) */}
      {activeTab === 'infra' && (
        <div className="map-floating-panel map-legend">
          <div className="legend-title">🏗️ {lang === 'th' ? 'หมวดหมู่โครงสร้างพื้นฐาน' : 'Infrastructure'}</div>
          {Object.entries(INFRA_CATEGORIES).map(([key, cat]) => (
            <div key={key} className="legend-row">
              <div className="legend-swatch" style={{ background: cat.color, borderRadius: key === 'road' ? 0 : '50%' }} />
              <span style={{ color: '#cbd5e1' }}>{cat.icon} {lang === 'th' ? cat.name_th : cat.name_en}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="legend-row">
              <div style={{ width: 14, height: 3, borderTop: '3px solid #00f0ff' }} />
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Legend Overlay (Services tab) */}
      {activeTab === 'service' && (
        <div className="map-floating-panel map-legend">
          <div className="legend-title">🏥 {lang === 'th' ? 'หมวดหมู่บริการสาธารณะ' : 'Public Services'}</div>
          {Object.entries(SERVICE_CATEGORIES).map(([key, cat]) => (
            <div key={key} className="legend-row">
              <div className="legend-swatch" style={{ background: cat.color, borderRadius: '50%' }} />
              <span style={{ color: '#cbd5e1' }}>{cat.icon} {lang === 'th' ? cat.name_th : cat.name_en}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <div className="legend-row">
              <div style={{ width: 14, height: 3, borderTop: '3px solid #00f0ff' }} />
              <span style={{ color: '#00f0ff', fontWeight: 700 }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
