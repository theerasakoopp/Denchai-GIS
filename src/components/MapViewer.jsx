import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Map, NavigationControl, ScaleControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, SunMedium, Focus, Plane } from 'lucide-react';

const BASE = import.meta.env.BASE_URL || '/';
const cleanBase = BASE.endsWith('/') ? BASE : BASE + '/';

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
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('dark');

  // ── Color expression ─────────────────────────────────────────
  const getColorExpr = (mode, vm) => {
    if (vm === 'buildings') return ['coalesce', ['get', 'energy_color'], '#f97316'];
    return mode === 'energy'
      ? ['coalesce', ['get', 'energy_color'], '#22c55e']
      : ['coalesce', ['get', 'color'], '#ef4444'];
  };

  // ── Pre-filter Facets in JavaScript (Zero-fail, 100% reliable) ─
  const filteredFacets = useMemo(() => {
    if (!facetsData || !facetsData.features) return null;
    if (viewMode !== 'facets') return { type: 'FeatureCollection', features: [] };

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
  }, [facetsData, filters, visibleLayers, viewMode]);

  // ── Pre-filter Buildings in JavaScript ────────────────────────
  const filteredBuildings = useMemo(() => {
    if (!buildingsData || !buildingsData.features) return null;
    if (viewMode !== 'buildings') return { type: 'FeatureCollection', features: [] };

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
  }, [buildingsData, filters, viewMode]);

  // ── Zoom to bounding box ─────────────────────────────────────
  const zoomTo = (mapInstance, geoJSON) => {
    if (!geoJSON || !geoJSON.features?.length) return;
    try {
      const bbox = turf.bbox(geoJSON);
      mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
        padding: 50,
        duration: 900
      });
    } catch (_) {}
  };

  const zoomToRooftops = () => {
    if (!mapRef.current) return;
    if (uploadedBoundary?.features?.length) { zoomTo(mapRef.current, uploadedBoundary); return; }
    if (facetsData?.features?.length) { zoomTo(mapRef.current, facetsData); return; }
    if (buildingsData?.features?.length) { zoomTo(mapRef.current, buildingsData); return; }
    if (municipalBoundary?.features?.length) { zoomTo(mapRef.current, municipalBoundary); return; }
    mapRef.current.fitBounds([[100.028, 17.965], [100.084, 18.006]], { padding: 40, duration: 800 });
  };

  // ── Switch Basemap by Toggling Layer Visibility (Instant 0ms) ─
  const changeBasemap = (key) => {
    setCurrentBasemap(key);
    const map = mapRef.current;
    if (!map) return;

    const layers = [
      { id: 'dark-layer', visible: key === 'dark' },
      { id: 'satellite-layer', visible: key === 'satellite' },
      { id: 'osm-layer', visible: key === 'osm' },
      { id: 'light-layer', visible: key === 'light' },
      { id: 'uav-bg-osm', visible: key === 'uav' },
      { id: 'uav-layer', visible: key === 'uav' },
    ];

    layers.forEach(({ id, visible }) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });
    map.triggerRepaint();
  };

  // ── Setup Popups ─────────────────────────────────────────────
  const setupPopups = (mapInstance) => {
    mapInstance.on('click', (e) => {
      const visible = [];
      if (mapInstance.getLayer('facets-fill')) visible.push('facets-fill');
      if (mapInstance.getLayer('buildings-fill')) visible.push('buildings-fill');
      if (visible.length === 0) return;

      const feats = mapInstance.queryRenderedFeatures(e.point, { layers: visible });
      if (!feats || feats.length === 0) return;

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
      const visible = [];
      if (mapInstance.getLayer('facets-fill')) visible.push('facets-fill');
      if (mapInstance.getLayer('buildings-fill')) visible.push('buildings-fill');
      const feats = visible.length ? mapInstance.queryRenderedFeatures(e.point, { layers: visible }) : [];
      mapInstance.getCanvas().style.cursor = feats.length ? 'pointer' : '';
    });
  };

  // ── Initialize Map with All Sources & Layers ─────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const initialStyle = {
      version: 8,
      sources: {
        'carto-dark-src': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© CARTO, © OpenStreetMap'
        },
        'esri-satellite-src': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: '© Esri, Maxar'
        },
        'osm-src': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        },
        'carto-light-src': {
          type: 'raster',
          tiles: [
            'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
            'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: '© CARTO, © OpenStreetMap'
        },
        'uav-ortho-src': {
          type: 'raster',
          tiles: [`${cleanBase}tiles/uav/{z}/{x}/{y}.webp`],
          tileSize: 256,
          minzoom: 14,
          maxzoom: 20,
          attribution: '© UAV-SolarNet 30cm Orthophoto'
        }
      },
      layers: [
        // Basemap Layers (Dark active by default)
        { id: 'dark-layer', type: 'raster', source: 'carto-dark-src', layout: { visibility: 'visible' } },
        { id: 'satellite-layer', type: 'raster', source: 'esri-satellite-src', layout: { visibility: 'none' } },
        { id: 'osm-layer', type: 'raster', source: 'osm-src', layout: { visibility: 'none' } },
        { id: 'light-layer', type: 'raster', source: 'carto-light-src', layout: { visibility: 'none' } },
        { id: 'uav-bg-osm', type: 'raster', source: 'osm-src', layout: { visibility: 'none' } },
        { id: 'uav-layer', type: 'raster', source: 'uav-ortho-src', layout: { visibility: 'none' } }
      ]
    };

    const map = new Map({
      container: mapContainerRef.current,
      style: initialStyle,
      center: [100.0548, 17.9824],
      zoom: 15.5,
      minZoom: 11,
      maxZoom: 22,
      pitch: 28,
      bearing: -5
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    popupRef.current = new Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '320px'
    });

    map.on('load', () => {
      mapRef.current = map;

      // ── Municipal boundary ──────────────────────────────────
      map.addSource('municipal-src', {
        type: 'geojson',
        data: municipalBoundary || { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'municipal-layer',
        type: 'line',
        source: 'municipal-src',
        paint: {
          'line-color': '#38bdf8',
          'line-width': 2.5,
          'line-dasharray': [3, 2]
        }
      });

      // ── Uploaded AOI ────────────────────────────────────────
      map.addSource('uploaded-src', {
        type: 'geojson',
        data: uploadedBoundary || { type: 'FeatureCollection', features: [] }
      });
      map.addLayer({
        id: 'uploaded-fill',
        type: 'fill',
        source: 'uploaded-src',
        paint: { 'fill-color': '#a855f7', 'fill-opacity': 0.12 }
      });
      map.addLayer({
        id: 'uploaded-layer',
        type: 'line',
        source: 'uploaded-src',
        paint: { 'line-color': '#c084fc', 'line-width': 2.5 }
      });

      // ── Facets ──────────────────────────────────────────────
      const initFacets = filteredFacets || { type: 'FeatureCollection', features: [] };
      map.addSource('facets-src', {
        type: 'geojson',
        data: initFacets,
        buffer: 64,
        tolerance: 0.5
      });
      map.addLayer({
        id: 'facets-fill',
        type: 'fill',
        source: 'facets-src',
        paint: {
          'fill-color': getColorExpr(colorModeRef.current, viewModeRef.current),
          'fill-opacity': 0.88
        }
      });
      map.addLayer({
        id: 'facets-outline',
        type: 'line',
        source: 'facets-src',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.8,
          'line-opacity': 0.45
        }
      });

      // ── Buildings ───────────────────────────────────────────
      const initBuildings = filteredBuildings || { type: 'FeatureCollection', features: [] };
      map.addSource('buildings-src', {
        type: 'geojson',
        data: initBuildings,
        buffer: 64,
        tolerance: 0.5
      });
      map.addLayer({
        id: 'buildings-fill',
        type: 'fill',
        source: 'buildings-src',
        paint: {
          'fill-color': ['coalesce', ['get', 'energy_color'], '#f97316'],
          'fill-opacity': 0.88
        }
      });
      map.addLayer({
        id: 'buildings-outline',
        type: 'line',
        source: 'buildings-src',
        paint: {
          'line-color': '#ffffff',
          'line-width': 0.8,
          'line-opacity': 0.45
        }
      });

      setupPopups(map);
      setMapLoaded(true);

      // Fit view to Denchai
      map.fitBounds([[100.028, 17.965], [100.084, 18.006]], { padding: 40, duration: 800 });
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // ── Sync Facets Data into MapLibre Source ────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const src = map.getSource('facets-src');
    if (src && filteredFacets) {
      src.setData(filteredFacets);
      map.triggerRepaint();
    }
  }, [filteredFacets, mapLoaded]);

  // ── Sync Buildings Data into MapLibre Source ──────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const src = map.getSource('buildings-src');
    if (src && filteredBuildings) {
      src.setData(filteredBuildings);
      map.triggerRepaint();
    }
  }, [filteredBuildings, mapLoaded]);

  // ── Sync colorMode ───────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer('facets-fill')) {
      map.setPaintProperty('facets-fill', 'fill-color', getColorExpr(colorMode, viewMode));
      map.triggerRepaint();
    }
  }, [colorMode, viewMode, mapLoaded]);

  // ── Sync boundary sources ────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const mSrc = map.getSource('municipal-src');
    if (mSrc && municipalBoundary) mSrc.setData(municipalBoundary);
  }, [municipalBoundary, mapLoaded]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const uSrc = map.getSource('uploaded-src');
    if (uSrc) {
      uSrc.setData(uploadedBoundary || { type: 'FeatureCollection', features: [] });
      if (uploadedBoundary?.features?.length) zoomTo(map, uploadedBoundary);
    }
  }, [uploadedBoundary, mapLoaded]);

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
          { key: 'uav',       icon: <Plane size={13} />,     label: lang === 'th' ? 'โดรน UAV (30cm)' : 'UAV Ortho' },
          { key: 'dark',      icon: <Layers size={13} />,    label: lang === 'th' ? 'มืด (GIS)' : 'Dark' },
          { key: 'satellite', icon: <Globe size={13} />,     label: lang === 'th' ? 'ดาวเทียม' : 'Satellite' },
          { key: 'osm',       icon: <Compass size={13} />,   label: 'OSM' },
          { key: 'light',     icon: <SunMedium size={13} />, label: lang === 'th' ? 'สว่าง' : 'Light' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            className={`basemap-btn ${currentBasemap === key ? 'active' : ''}`}
            onClick={() => changeBasemap(key)}
          >
            {icon} {label}
          </button>
        ))}
        <button
          className="basemap-btn"
          onClick={zoomToRooftops}
          style={{ borderLeft: '1px solid rgba(255,255,255,0.12)', marginLeft: 4, paddingLeft: 8 }}
          title={lang === 'th' ? 'ซูมขอบเขตแปลงหลังคาเด่นชัย' : 'Fit to Denchai Rooftops'}
        >
          <Focus size={13} color="#38bdf8" /> {lang === 'th' ? 'ซูมขอบเขต' : 'Fit View'}
        </button>
      </div>

      {/* Quick Summary Card */}
      <div style={{
        position: 'absolute', top: 62, left: 16, zIndex: 100,
        background: 'rgba(13,20,36,0.92)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59,130,246,0.3)', borderRadius: 12,
        padding: '14px 16px', color: 'white', minWidth: 210,
        boxShadow: 'var(--shadow-lg)', pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SunMedium size={14} color="#f59e0b" /> {t.appTitle}
        </div>
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
      </div>

      {/* Legend Overlay */}
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
