import React, { useEffect, useState, useRef } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, Maximize2, SunMedium } from 'lucide-react';

const BASEMAP_STYLES = {
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    style: {
      version: 8,
      sources: {
        'esri-satellite': {
          type: 'raster',
          tiles: [
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
          ],
          tileSize: 256,
          attribution: 'Esri, Maxar, Earthstar Geographics'
        }
      },
      layers: [
        {
          id: 'esri-satellite-layer',
          type: 'raster',
          source: 'esri-satellite',
          minzoom: 0,
          maxzoom: 20
        }
      ]
    }
  },
  dark: {
    id: 'dark',
    name: 'Dark Matter',
    style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
  },
  light: {
    id: 'light',
    name: 'Positron (Light)',
    style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'
  },
  osm: {
    id: 'osm',
    name: 'OpenStreetMap',
    style: {
      version: 8,
      sources: {
        'osm-tiles': {
          type: 'raster',
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors'
        }
      },
      layers: [
        {
          id: 'osm-layer',
          type: 'raster',
          source: 'osm-tiles',
          minzoom: 0,
          maxzoom: 19
        }
      ]
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

export default function MapViewer({
  geoData, filters, visibleLayers,
  uploadedBoundary, municipalBoundary, colorMode, viewMode,
  lang = 'th', tariff = 4.2
}) {
  const t = translations[lang] || translations.th;
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [filteredData, setFilteredData] = useState(null);
  const [currentBasemap, setCurrentBasemap] = useState('satellite');

  // Filter features
  useEffect(() => {
    if (!geoData) return;

    const isBuildings = viewMode === 'buildings';
    const clippingBoundary = uploadedBoundary;

    const features = geoData.features.filter(f => {
      const p = f.properties;
      if (isBuildings) {
        if (filters.minEnergy > 0 && p.energy_kwh < filters.minEnergy) return false;
        if (filters.minArea > 0 && p.area_2d < filters.minArea) return false;
      } else {
        if (!visibleLayers[p.class_id]) return false;
        if (p.area_3d < filters.minArea) return false;
        if (p.energy_kwh < filters.minEnergy) return false;
      }

      if (clippingBoundary) {
        try {
          const pt = turf.centroid(f);
          return clippingBoundary.features.some(bf =>
            turf.booleanPointInPolygon(pt, bf)
          );
        } catch { return false; }
      }
      return true;
    });

    setFilteredData({ type: 'FeatureCollection', features });
  }, [geoData, filters, visibleLayers, uploadedBoundary, viewMode]);

  // Zoom to GeoJSON boundary
  const zoomToBoundary = (mapInstance, boundaryGeoJSON) => {
    if (!boundaryGeoJSON || !boundaryGeoJSON.features || boundaryGeoJSON.features.length === 0) return;
    try {
      const bbox = turf.bbox(boundaryGeoJSON);
      mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
        padding: 50,
        duration: 900,
        animate: true
      });
    } catch (err) {
      console.warn("fitBounds error:", err);
    }
  };

  // Switch Basemap
  const changeBasemap = (key) => {
    if (key === currentBasemap || !mapRef.current) return;
    setCurrentBasemap(key);
    const map = mapRef.current;
    const basemapConfig = BASEMAP_STYLES[key];
    
    map.setStyle(basemapConfig.style);
    map.once('style.load', () => {
      reAddLayers(map);
    });
  };

  // Re-add custom GIS sources & layers after style load
  const reAddLayers = (map) => {
    if (!map) return;

    if (!map.getSource('municipal-src')) {
      map.addSource('municipal-src', { type: 'geojson', data: municipalBoundary || { type: 'FeatureCollection', features: [] } });
    }
    if (!map.getSource('uploaded-src')) {
      map.addSource('uploaded-src', { type: 'geojson', data: uploadedBoundary || { type: 'FeatureCollection', features: [] } });
    }
    if (!map.getSource('features-src')) {
      map.addSource('features-src', { type: 'geojson', data: filteredData || { type: 'FeatureCollection', features: [] } });
    }

    if (!map.getLayer('municipal-layer')) {
      map.addLayer({
        id: 'municipal-layer',
        type: 'line',
        source: 'municipal-src',
        paint: {
          'line-color': uploadedBoundary ? 'rgba(96, 165, 250, 0.4)' : '#38bdf8',
          'line-width': uploadedBoundary ? 1.5 : 2.5,
          'line-dasharray': [3, 2]
        }
      });
    }

    if (!map.getLayer('uploaded-fill')) {
      map.addLayer({
        id: 'uploaded-fill',
        type: 'fill',
        source: 'uploaded-src',
        paint: {
          'fill-color': '#a855f7',
          'fill-opacity': 0.12
        }
      });
    }

    if (!map.getLayer('uploaded-layer')) {
      map.addLayer({
        id: 'uploaded-layer',
        type: 'line',
        source: 'uploaded-src',
        paint: {
          'line-color': '#c084fc',
          'line-width': 3
        }
      });
    }

    if (!map.getLayer('features-layer')) {
      const colorProp = viewMode === 'buildings' 
        ? 'energy_color'
        : (colorMode === 'energy' ? 'energy_color' : 'color');

      map.addLayer({
        id: 'features-layer',
        type: 'fill',
        source: 'features-src',
        paint: {
          'fill-color': ['coalesce', ['get', colorProp], '#f59e0b'],
          'fill-opacity': 0.88,
          'fill-outline-color': 'rgba(255, 255, 255, 0.25)'
        }
      });
    }

    setupPopups(map);
  };

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: BASEMAP_STYLES.satellite.style,
      center: [100.0548, 17.9824], // Den Chai Municipality center
      zoom: 15.5,
      pitch: 35,
      bearing: -10,
      minZoom: 11,
      maxZoom: 21,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    map.on('load', () => {
      reAddLayers(map);
      mapRef.current = map;
      setMapLoaded(true);
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        setMapLoaded(false);
      }
    };
  }, []);

  // Update Data Sources
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const mSrc = map.getSource('municipal-src');
    if (mSrc && municipalBoundary) mSrc.setData(municipalBoundary);

    const uSrc = map.getSource('uploaded-src');
    if (uSrc) {
      uSrc.setData(uploadedBoundary || { type: 'FeatureCollection', features: [] });
      if (uploadedBoundary) zoomToBoundary(map, uploadedBoundary);
      else if (municipalBoundary) zoomToBoundary(map, municipalBoundary);
    }

    const fSrc = map.getSource('features-src');
    if (fSrc && filteredData) fSrc.setData(filteredData);
  }, [filteredData, municipalBoundary, uploadedBoundary, mapLoaded]);

  // Update Layer Colors
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !map.getLayer('features-layer')) return;

    const colorProp = viewMode === 'buildings'
      ? 'energy_color'
      : (colorMode === 'energy' ? 'energy_color' : 'color');

    map.setPaintProperty('features-layer', 'fill-color', ['coalesce', ['get', colorProp], '#f59e0b']);
    map.setPaintProperty('features-layer', 'fill-opacity', 0.88);
  }, [colorMode, viewMode, mapLoaded]);

  // Setup Popup
  const setupPopups = (mapInstance) => {
    const popup = new maplibregl.Popup({
      closeButton: true,
      closeOnClick: true,
      maxWidth: '300px'
    });

    mapInstance.on('click', 'features-layer', (e) => {
      const feat = e.features[0];
      if (!feat) return;
      const p = feat.properties;

      const area3d = p.area_3d || p.area_2d || 0;
      const cap = p.capacity_kwp || ((area3d * 0.18) * 0.20);
      const eng = p.energy_corrected_kwh || p.energy_kwh || 0;
      const sav = p.savings_thb || (eng * tariff);
      const co2 = (eng * 0.4999) / 1000; // tCO2/yr
      const clsName = t.classes[p.class_id] || p.class_name || 'Roof';

      const html = `
        <div style="font-family: 'Prompt', 'Inter', sans-serif;">
          <div style="font-size: 0.95rem; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 6px; margin-bottom: 8px; display:flex; align-items:center; gap:8px;">
            <div style="width:12px;height:12px;border-radius:3px;background:${p.color || '#3b82f6'};box-shadow:0 0 6px ${p.color || '#3b82f6'}"></div>
            ${viewMode === 'buildings' ? (p.building_id || 'Building') : clsName}
          </div>
          <div class="popup-row"><span style="color:#94a3b8">${t.popupArea}</span><span style="font-weight:600">${area3d.toFixed(1)} m²</span></div>
          ${p.slope_deg ? `<div class="popup-row"><span style="color:#94a3b8">${t.popupSlope}</span><span>${p.slope_deg}°</span></div>` : ''}
          ${p.aspect_deg ? `<div class="popup-row"><span style="color:#94a3b8">${t.popupAspect}</span><span>${p.aspect_deg}°</span></div>` : ''}
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);">
            <span style="color:#fcd34d;font-weight:600">⚡ ${t.popupCapacity}</span>
            <span style="color:#fcd34d;font-weight:700">${cap.toFixed(1)} kWp</span>
          </div>
          <div class="popup-row">
            <span style="color:#34d399;font-weight:600">☀️ ${t.popupAnnualEnergy}</span>
            <span style="color:#34d399;font-weight:700">${fmt(eng)} kWh/y</span>
          </div>
          <div class="popup-row highlight">
            <span>💰 ${t.popupAnnualSavings}</span>
            <span>~${fmt(sav)} ฿/y</span>
          </div>
          <div class="popup-row">
            <span style="color:#38bdf8">🌿 ${t.popupCo2}</span>
            <span style="color:#38bdf8">${co2.toFixed(2)} t/y</span>
          </div>
        </div>
      `;

      popup.setLngLat(e.lngLat).setHTML(html).addTo(mapInstance);
    });

    mapInstance.on('mouseenter', 'features-layer', () => { mapInstance.getCanvas().style.cursor = 'pointer'; });
    mapInstance.on('mouseleave', 'features-layer', () => { mapInstance.getCanvas().style.cursor = ''; });
  };

  const totalCapMwp = ((filteredData?.features.reduce((acc, f) => acc + (f.properties.capacity_kwp || 0), 0) || 0) / 1000).toFixed(2);
  const totalYieldGwh = ((filteredData?.features.reduce((acc, f) => acc + (f.properties.energy_corrected_kwh || f.properties.energy_kwh || 0), 0) || 0) / 1000000).toFixed(2);

  const legendItems = viewMode === 'buildings'
    ? CAPACITY_LEGEND
    : colorMode === 'energy'
      ? ENERGY_LEGEND
      : Object.entries(ROOF_CLASSES).map(([id, cls]) => ({
          color: cls.color,
          label: t.classes[id] || cls.name
        }));

  return (
    <div className="map-wrap">
      <div ref={mapContainerRef} className="map-container" />

      {/* Basemap Selector Floating Control */}
      <div className="map-floating-panel basemap-control">
        <button
          className={`basemap-btn ${currentBasemap === 'satellite' ? 'active' : ''}`}
          onClick={() => changeBasemap('satellite')}
          title="Satellite Imagery"
        >
          <Globe size={13} /> {lang === 'th' ? 'ดาวเทียม' : 'Satellite'}
        </button>
        <button
          className={`basemap-btn ${currentBasemap === 'dark' ? 'active' : ''}`}
          onClick={() => changeBasemap('dark')}
          title="Dark Map"
        >
          <Layers size={13} /> {lang === 'th' ? 'แผนที่มืด' : 'Dark'}
        </button>
        <button
          className={`basemap-btn ${currentBasemap === 'light' ? 'active' : ''}`}
          onClick={() => changeBasemap('light')}
          title="Light Map"
        >
          <SunMedium size={13} /> {lang === 'th' ? 'แผนที่สว่าง' : 'Light'}
        </button>
        <button
          className={`basemap-btn ${currentBasemap === 'osm' ? 'active' : ''}`}
          onClick={() => changeBasemap('osm')}
          title="OpenStreetMap"
        >
          <Compass size={13} /> OSM
        </button>
      </div>

      {/* Floating Solar Quick Stats */}
      <div style={{
        position: 'absolute', top: 62, left: 16, zIndex: 100,
        background: 'rgba(13, 20, 36, 0.9)', backdropFilter: 'blur(16px)',
        border: '1px solid rgba(59, 130, 246, 0.3)', borderRadius: 12,
        padding: '14px 16px', color: 'white', minWidth: 210,
        boxShadow: 'var(--shadow-lg)', pointerEvents: 'none'
      }}>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <SunMedium size={14} color="#f59e0b" />
          {t.appTitle}
        </div>
        <div style={{ marginBottom: 8 }}>
          <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>{t.kpiEstInvestment ? 'กำลังผลิตติดตั้งรวม (Capacity)' : 'Total Capacity'}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fcd34d' }}>
            {totalCapMwp} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>MWp</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.68rem', color: '#6ee7b7' }}>{t.kpiTotalEnergy}</div>
          <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#34d399' }}>
            {totalYieldGwh} <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>GWh/y</span>
          </div>
        </div>
      </div>

      {/* Legend overlay */}
      <div className="map-floating-panel map-legend">
        <div className="legend-title">
          {viewMode === 'buildings' ? 'System Capacity (kWp)' : (colorMode === 'energy' ? 'Solar Heatmap' : t.roofClassesHeader)}
        </div>
        {legendItems.map((item, idx) => (
          <div key={idx} className="legend-row">
            <div className="legend-swatch" style={{ background: item.color }} />
            <span style={{ color: '#cbd5e1' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          <div className="legend-row">
            <div style={{ width: 14, height: 2, borderTop: '2px dashed #38bdf8' }} />
            <span style={{ color: '#94a3b8' }}>ขอบเขตเทศบาลตำบลเด่นชัย</span>
          </div>
          {uploadedBoundary && (
            <div className="legend-row">
              <div style={{ width: 14, height: 3, background: '#c084fc', borderRadius: 2 }} />
              <span style={{ color: '#c084fc' }}>ขอบเขตพื้นที่ศึกษา (AOI)</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
