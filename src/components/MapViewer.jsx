import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Map, NavigationControl, ScaleControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, SunMedium, Focus } from 'lucide-react';

// ── Basemap Configs ─────────────────────────────────────────
const BASEMAP_STYLES = {
  satellite: {
    id: 'satellite',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'],
          tileSize: 256,
          attribution: 'Esri, Maxar'
        }
      },
      layers: [{ id: 'esri-layer', type: 'raster', source: 'esri-satellite' }]
    }
  },
  dark: { id: 'dark', style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json' },
  light: { id: 'light', style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json' },
  osm: {
    id: 'osm',
    style: {
      version: 8,
      sources: {
        'osm': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap'
        }
      },
      layers: [{ id: 'osm-layer', type: 'raster', source: 'osm' }]
    }
  }
};

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

// ── Build active class filter expression for MapLibre ────────
function buildFacetsFilter(filters, visibleLayers) {
  const activeClasses = Object.entries(visibleLayers)
    .filter(([, v]) => v)
    .map(([k]) => Number(k));

  if (activeClasses.length === 0) return ['==', ['literal', 1], 0]; // show nothing

  return [
    'all',
    ['>=', ['coalesce', ['get', 'area_3d'], 0], filters.minArea || 0],
    ['>=', ['coalesce', ['get', 'energy_kwh'], 0], filters.minEnergy || 0],
    ['in', ['get', 'class_id'], ['literal', activeClasses]]
  ];
}

function buildBuildingsFilter(filters) {
  return [
    'all',
    ['>=', ['coalesce', ['get', 'area_2d'], 0], filters.minArea || 0],
    ['>=', ['coalesce', ['get', 'energy_kwh'], 0], filters.minEnergy || 0]
  ];
}

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
  tariff = 4.2
}) {
  const t = translations[lang] || translations.th;
  const langRef = useRef(lang);
  const tariffRef = useRef(tariff);
  const viewModeRef = useRef(viewMode);
  const colorModeRef = useRef(colorMode);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { tariffRef.current = tariff; }, [tariff]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const layersReadyRef = useRef(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('satellite');

  // ── Derive GeoJSON URLs from Vite base URL ──────────────────
  const BASE = import.meta.env.BASE_URL || '/';
  const FACETS_URL = `${BASE}rooftop_facets.geojson`;
  const BUILDINGS_URL = `${BASE}buildings.geojson`;

  // ── Color expressions ────────────────────────────────────────
  const getColorExpr = (mode, vm) => {
    if (vm === 'buildings') return ['coalesce', ['get', 'energy_color'], '#f97316'];
    return mode === 'energy'
      ? ['coalesce', ['get', 'energy_color'], '#22c55e']
      : ['coalesce', ['get', 'color'], '#ef4444'];
  };

  // ── Zoom helpers ─────────────────────────────────────────────
  const zoomTo = (mapInstance, geoJSON) => {
    if (!geoJSON || !geoJSON.features?.length) return;
    try {
      const bbox = turf.bbox(geoJSON);
      mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
        padding: 50, duration: 900
      });
    } catch (_) {}
  };

  const zoomToRooftops = () => {
    if (!mapRef.current) return;
    if (uploadedBoundary?.features?.length) { zoomTo(mapRef.current, uploadedBoundary); return; }
    if (facetsData?.features?.length) { zoomTo(mapRef.current, facetsData); return; }
    if (buildingsData?.features?.length) { zoomTo(mapRef.current, buildingsData); return; }
    if (municipalBoundary?.features?.length) { zoomTo(mapRef.current, municipalBoundary); }
  };

  // ── Add all GIS layers after style loads ─────────────────────
  const addAllLayers = (map) => {
    if (!map) return;

    const safeAdd = (id, def) => { if (!map.getSource(id)) map.addSource(id, def); };
    const safeLayer = (def) => { if (!map.getLayer(def.id)) map.addLayer(def); };

    // Municipal boundary
    safeAdd('municipal-src', {
      type: 'geojson',
      data: municipalBoundary || { type: 'FeatureCollection', features: [] }
    });
    safeLayer({ id: 'municipal-layer', type: 'line', source: 'municipal-src',
      paint: { 'line-color': '#38bdf8', 'line-width': 2.5, 'line-dasharray': [3, 2] }
    });

    // Uploaded AOI
    safeAdd('uploaded-src', {
      type: 'geojson',
      data: uploadedBoundary || { type: 'FeatureCollection', features: [] }
    });
    safeLayer({ id: 'uploaded-fill', type: 'fill', source: 'uploaded-src',
      paint: { 'fill-color': '#a855f7', 'fill-opacity': 0.1 }
    });
    safeLayer({ id: 'uploaded-layer', type: 'line', source: 'uploaded-src',
      paint: { 'line-color': '#c084fc', 'line-width': 3 }
    });

    // === FACETS: load via URL directly (most reliable) ===
    safeAdd('facets-src', {
      type: 'geojson',
      data: FACETS_URL,
      buffer: 64,
      tolerance: 0.5
    });
    safeLayer({
      id: 'facets-fill',
      type: 'fill',
      source: 'facets-src',
      layout: { visibility: viewModeRef.current === 'facets' ? 'visible' : 'none' },
      filter: buildFacetsFilter(filters, visibleLayers),
      paint: {
        'fill-color': getColorExpr(colorModeRef.current, viewModeRef.current),
        'fill-opacity': 0.88
      }
    });
    safeLayer({
      id: 'facets-outline',
      type: 'line',
      source: 'facets-src',
      layout: { visibility: viewModeRef.current === 'facets' ? 'visible' : 'none' },
      filter: buildFacetsFilter(filters, visibleLayers),
      paint: { 'line-color': '#fff', 'line-width': 0.7, 'line-opacity': 0.35 }
    });

    // === BUILDINGS: load via URL directly ===
    safeAdd('buildings-src', {
      type: 'geojson',
      data: BUILDINGS_URL,
      buffer: 64,
      tolerance: 0.5
    });
    safeLayer({
      id: 'buildings-fill',
      type: 'fill',
      source: 'buildings-src',
      layout: { visibility: viewModeRef.current === 'buildings' ? 'visible' : 'none' },
      filter: buildBuildingsFilter(filters),
      paint: {
        'fill-color': ['coalesce', ['get', 'energy_color'], '#f97316'],
        'fill-opacity': 0.88
      }
    });
    safeLayer({
      id: 'buildings-outline',
      type: 'line',
      source: 'buildings-src',
      layout: { visibility: viewModeRef.current === 'buildings' ? 'visible' : 'none' },
      filter: buildBuildingsFilter(filters),
      paint: { 'line-color': '#fff', 'line-width': 0.7, 'line-opacity': 0.35 }
    });

    layersReadyRef.current = true;
    setupPopups(map);
    map.triggerRepaint();
  };

  // ── Initialize Map ───────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const map = new Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES.satellite.style,
      center: [100.0556, 17.9858],
      zoom: 14,
      minZoom: 10,
      maxZoom: 22,
      pitch: 30,
      bearing: -8,
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    popupRef.current = new Popup({ closeButton: true, closeOnClick: true, maxWidth: '320px' });

    map.on('load', () => {
      mapRef.current = map;
      addAllLayers(map);
      setMapLoaded(true);

      // Auto zoom to Denchai bounding box
      map.fitBounds([[100.028, 17.965], [100.084, 18.006]], { padding: 40, duration: 800 });
    });

    // Pointer cursor
    map.on('mousemove', (e) => {
      const visible = [];
      if (map.getLayer('facets-fill') && map.getLayoutProperty('facets-fill', 'visibility') !== 'none') visible.push('facets-fill');
      if (map.getLayer('buildings-fill') && map.getLayoutProperty('buildings-fill', 'visibility') !== 'none') visible.push('buildings-fill');
      const feats = visible.length ? map.queryRenderedFeatures(e.point, { layers: visible }) : [];
      map.getCanvas().style.cursor = feats.length ? 'pointer' : '';
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; setMapLoaded(false); }
    };
  }, []);

  // ── Switch Basemap ───────────────────────────────────────────
  const changeBasemap = (key) => {
    if (key === currentBasemap || !mapRef.current) return;
    setCurrentBasemap(key);
    const map = mapRef.current;
    map.setStyle(BASEMAP_STYLES[key].style);
    map.once('style.load', () => {
      layersReadyRef.current = false;
      addAllLayers(map);
    });
  };

  // ── Sync viewMode visibility ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReadyRef.current) return;
    const isFacets = viewMode === 'facets';
    ['facets-fill', 'facets-outline'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', isFacets ? 'visible' : 'none');
    });
    ['buildings-fill', 'buildings-outline'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', isFacets ? 'none' : 'visible');
    });
    map.triggerRepaint();
  }, [viewMode, mapLoaded]);

  // ── Sync colorMode ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReadyRef.current) return;
    if (map.getLayer('facets-fill')) {
      map.setPaintProperty('facets-fill', 'fill-color', getColorExpr(colorMode, viewMode));
      map.triggerRepaint();
    }
  }, [colorMode, mapLoaded]);

  // ── Sync filters & visible layers ───────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReadyRef.current) return;
    const facetsFilter = buildFacetsFilter(filters, visibleLayers);
    const bldFilter = buildBuildingsFilter(filters);
    ['facets-fill', 'facets-outline'].forEach(id => {
      if (map.getLayer(id)) map.setFilter(id, facetsFilter);
    });
    ['buildings-fill', 'buildings-outline'].forEach(id => {
      if (map.getLayer(id)) map.setFilter(id, bldFilter);
    });
    map.triggerRepaint();
  }, [filters, visibleLayers, mapLoaded]);

  // ── Sync boundary sources ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReadyRef.current) return;
    const mSrc = map.getSource('municipal-src');
    if (mSrc && municipalBoundary) mSrc.setData(municipalBoundary);
  }, [municipalBoundary, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !layersReadyRef.current) return;
    const uSrc = map.getSource('uploaded-src');
    if (uSrc) {
      uSrc.setData(uploadedBoundary || { type: 'FeatureCollection', features: [] });
      if (uploadedBoundary) zoomTo(map, uploadedBoundary);
    }
  }, [uploadedBoundary, mapLoaded]);

  // ── Popup Setup ──────────────────────────────────────────────
  const setupPopups = (mapInstance) => {
    mapInstance.on('click', (e) => {
      const visible = [];
      if (mapInstance.getLayer('facets-fill') && mapInstance.getLayoutProperty('facets-fill', 'visibility') !== 'none') visible.push('facets-fill');
      if (mapInstance.getLayer('buildings-fill') && mapInstance.getLayoutProperty('buildings-fill', 'visibility') !== 'none') visible.push('buildings-fill');
      if (!visible.length) return;

      const feats = mapInstance.queryRenderedFeatures(e.point, { layers: visible });
      if (!feats?.length) return;

      const p = feats[0].properties;
      const curT = translations[langRef.current] || translations.th;
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
          <div style="font-size:.95rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,.12);padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
            <div style="width:12px;height:12px;border-radius:3px;background:${dotColor};box-shadow:0 0 6px ${dotColor}"></div>
            ${curMode === 'buildings' ? (p.building_id || 'Building') : clsName}
          </div>
          <div class="popup-row"><span style="color:#94a3b8">${curT.popupArea}</span><span>${area.toFixed(1)} m²</span></div>
          ${p.slope_deg ? `<div class="popup-row"><span style="color:#94a3b8">${curT.popupSlope}</span><span>${Number(p.slope_deg).toFixed(1)}°</span></div>` : ''}
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
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
  };

  // ── Stats for quick stat card ────────────────────────────────
  const activeData = viewMode === 'buildings' ? buildingsData : facetsData;
  const totalCapMwp = ((activeData?.features?.reduce((a, f) => a + (f.properties?.capacity_kwp || 0), 0) || 0) / 1000).toFixed(2);
  const totalYieldGwh = ((activeData?.features?.reduce((a, f) => a + (f.properties?.energy_corrected_kwh || f.properties?.energy_kwh || 0), 0) || 0) / 1000000).toFixed(2);

  const legendItems = viewMode === 'buildings'
    ? CAPACITY_LEGEND
    : colorMode === 'energy' ? ENERGY_LEGEND
    : Object.entries(ROOF_CLASSES).map(([id, cls]) => ({
        color: cls.color, label: t.classes?.[id] || cls.name
      }));

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="map-wrap">
      <div ref={mapContainerRef} className="map-container" />

      {/* Basemap Control */}
      <div className="map-floating-panel basemap-control">
        {[
          { key: 'satellite', icon: <Globe size={13} />, label: lang === 'th' ? 'ดาวเทียม' : 'Satellite' },
          { key: 'dark',      icon: <Layers size={13} />, label: lang === 'th' ? 'แผนที่มืด' : 'Dark' },
          { key: 'light',     icon: <SunMedium size={13} />, label: lang === 'th' ? 'สว่าง' : 'Light' },
          { key: 'osm',       icon: <Compass size={13} />, label: 'OSM' },
        ].map(({ key, icon, label }) => (
          <button key={key}
            className={`basemap-btn ${currentBasemap === key ? 'active' : ''}`}
            onClick={() => changeBasemap(key)}
          >
            {icon} {label}
          </button>
        ))}
        <button className="basemap-btn" onClick={zoomToRooftops}
          style={{ borderLeft: '1px solid rgba(255,255,255,.1)', marginLeft: 4, paddingLeft: 8 }}>
          <Focus size={13} color="#38bdf8" /> {lang === 'th' ? 'ซูมขอบเขต' : 'Fit View'}
        </button>
      </div>

      {/* Quick Stats Card */}
      <div style={{
        position: 'absolute', top: 62, left: 16, zIndex: 100,
        background: 'rgba(13,20,36,0.9)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12,
        padding: '14px 16px', color: 'white', minWidth: 210,
        boxShadow: 'var(--shadow-lg)', pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SunMedium size={14} color="#f59e0b" /> {t.appTitle}
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '.68rem', color: '#fbbf24' }}>{lang === 'th' ? 'กำลังผลิตติดตั้งรวม' : 'Total Capacity'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fcd34d' }}>
            {totalCapMwp} <span style={{ fontSize: '.8rem', fontWeight: 500 }}>MWp</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '.68rem', color: '#6ee7b7' }}>{t.kpiTotalEnergy}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
            {totalYieldGwh} <span style={{ fontSize: '.8rem', fontWeight: 500 }}>GWh/y</span>
          </div>
        </div>
      </div>

      {/* Legend */}
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
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.08)' }}>
          <div className="legend-row">
            <div style={{ width: 14, height: 2, borderTop: '2px dashed #38bdf8' }} />
            <span style={{ color: '#94a3b8' }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
          </div>
          {uploadedBoundary && (
            <div className="legend-row">
              <div style={{ width: 14, height: 3, background: '#c084fc', borderRadius: 2 }} />
              <span style={{ color: '#c084fc' }}>AOI</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
