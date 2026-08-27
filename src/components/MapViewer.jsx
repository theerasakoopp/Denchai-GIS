import React, { useEffect, useState, useRef } from 'react';
import { Map, NavigationControl, ScaleControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, SunMedium, Focus } from 'lucide-react';

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
  const facetsDataRef = useRef(facetsData);
  const buildingsDataRef = useRef(buildingsData);
  const municipalBoundaryRef = useRef(municipalBoundary);
  const uploadedBoundaryRef = useRef(uploadedBoundary);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { tariffRef.current = tariff; }, [tariff]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);
  useEffect(() => { facetsDataRef.current = facetsData; }, [facetsData]);
  useEffect(() => { buildingsDataRef.current = buildingsData; }, [buildingsData]);
  useEffect(() => { municipalBoundaryRef.current = municipalBoundary; }, [municipalBoundary]);
  useEffect(() => { uploadedBoundaryRef.current = uploadedBoundary; }, [uploadedBoundary]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('satellite');
  const initialZoomDone = useRef(false);

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

  // Zoom to Rooftop Extent
  const zoomToRooftops = () => {
    if (!mapRef.current) return;
    if (uploadedBoundaryRef.current) {
      zoomToBoundary(mapRef.current, uploadedBoundaryRef.current);
    } else if (facetsDataRef.current && facetsDataRef.current.features?.length > 0) {
      zoomToBoundary(mapRef.current, facetsDataRef.current);
    } else if (buildingsDataRef.current && buildingsDataRef.current.features?.length > 0) {
      zoomToBoundary(mapRef.current, buildingsDataRef.current);
    } else if (municipalBoundaryRef.current) {
      zoomToBoundary(mapRef.current, municipalBoundaryRef.current);
    }
  };

  const getColorExpression = () => {
    return colorModeRef.current === 'energy'
      ? ['coalesce', ['get', 'energy_color'], '#22c55e']
      : ['coalesce', ['get', 'color'], '#3b82f6'];
  };

  // Safe layer and source rebuild
  const rebuildAllLayers = (map) => {
    if (!map) return;

    const safeAddSource = (id, def) => {
      if (!map.getSource(id)) {
        map.addSource(id, def);
      }
    };

    const safeAddLayer = (def) => {
      if (!map.getLayer(def.id)) {
        map.addLayer(def);
      }
    };

    // 1. Municipal Boundary
    safeAddSource('municipal-src', {
      type: 'geojson',
      data: municipalBoundaryRef.current || { type: 'FeatureCollection', features: [] }
    });

    safeAddLayer({
      id: 'municipal-layer',
      type: 'line',
      source: 'municipal-src',
      paint: {
        'line-color': uploadedBoundaryRef.current ? 'rgba(96, 165, 250, 0.4)' : '#38bdf8',
        'line-width': uploadedBoundaryRef.current ? 1.5 : 2.5,
        'line-dasharray': [3, 2]
      }
    });

    // 2. Uploaded AOI
    safeAddSource('uploaded-src', {
      type: 'geojson',
      data: uploadedBoundaryRef.current || { type: 'FeatureCollection', features: [] }
    });

    safeAddLayer({
      id: 'uploaded-fill',
      type: 'fill',
      source: 'uploaded-src',
      paint: {
        'fill-color': '#a855f7',
        'fill-opacity': 0.12
      }
    });

    safeAddLayer({
      id: 'uploaded-layer',
      type: 'line',
      source: 'uploaded-src',
      paint: {
        'line-color': '#c084fc',
        'line-width': 3
      }
    });

    // 3. Facets Source & Layers
    safeAddSource('facets-src', {
      type: 'geojson',
      data: facetsDataRef.current || { type: 'FeatureCollection', features: [] },
      buffer: 64,
      tolerance: 0.5
    });

    safeAddLayer({
      id: 'facets-fill',
      type: 'fill',
      source: 'facets-src',
      layout: {
        'visibility': viewModeRef.current === 'facets' ? 'visible' : 'none'
      },
      paint: {
        'fill-color': getColorExpression(),
        'fill-opacity': 0.88
      }
    });

    safeAddLayer({
      id: 'facets-outline',
      type: 'line',
      source: 'facets-src',
      layout: {
        'visibility': viewModeRef.current === 'facets' ? 'visible' : 'none'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 0.8,
        'line-opacity': 0.35
      }
    });

    // 4. Buildings Source & Layers
    safeAddSource('buildings-src', {
      type: 'geojson',
      data: buildingsDataRef.current || { type: 'FeatureCollection', features: [] },
      buffer: 64,
      tolerance: 0.5
    });

    safeAddLayer({
      id: 'buildings-fill',
      type: 'fill',
      source: 'buildings-src',
      layout: {
        'visibility': viewModeRef.current === 'buildings' ? 'visible' : 'none'
      },
      paint: {
        'fill-color': ['coalesce', ['get', 'energy_color'], '#f97316'],
        'fill-opacity': 0.88
      }
    });

    safeAddLayer({
      id: 'buildings-outline',
      type: 'line',
      source: 'buildings-src',
      layout: {
        'visibility': viewModeRef.current === 'buildings' ? 'visible' : 'none'
      },
      paint: {
        'line-color': '#ffffff',
        'line-width': 0.8,
        'line-opacity': 0.35
      }
    });

    map.triggerRepaint();
  };

  // Switch Basemap
  const changeBasemap = (key) => {
    if (key === currentBasemap || !mapRef.current) return;
    setCurrentBasemap(key);
    const map = mapRef.current;
    const basemapConfig = BASEMAP_STYLES[key];
    
    map.setStyle(basemapConfig.style);
    map.once('style.load', () => {
      rebuildAllLayers(map);
    });
  };

  // Initialize Map
  useEffect(() => {
    if (mapRef.current) return;

    try {
      const map = new Map({
        container: mapContainerRef.current,
        style: BASEMAP_STYLES.satellite.style,
        center: [100.0556, 17.9858],
        zoom: 15.5,
        pitch: 35,
        bearing: -10,
        minZoom: 11,
        maxZoom: 21,
      });

      map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
      map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

      popupRef.current = new Popup({
        closeButton: true,
        closeOnClick: true,
        maxWidth: '320px'
      });

      // Global Click Handler for Polygons
      map.on('click', (e) => {
        const queryLayers = [];
        if (map.getLayer('facets-fill') && map.getLayoutProperty('facets-fill', 'visibility') !== 'none') {
          queryLayers.push('facets-fill');
        }
        if (map.getLayer('buildings-fill') && map.getLayoutProperty('buildings-fill', 'visibility') !== 'none') {
          queryLayers.push('buildings-fill');
        }
        if (queryLayers.length === 0) return;

        const features = map.queryRenderedFeatures(e.point, { layers: queryLayers });
        if (!features || features.length === 0) return;

        const feat = features[0];
        const p = feat.properties;

        const currentLang = langRef.current || 'th';
        const curT = translations[currentLang] || translations.th;
        const curTariff = tariffRef.current || 4.2;
        const curViewMode = viewModeRef.current || 'facets';

        const area3d = Number(p.area_3d || p.area_2d || 0);
        const cap = Number(p.capacity_kwp || ((area3d * 0.18) * 0.20));
        const eng = Number(p.energy_corrected_kwh || p.energy_kwh || 0);
        const sav = Number(p.savings_thb || (eng * curTariff));
        const co2 = (eng * 0.4999) / 1000;
        const clsName = curT.classes[p.class_id] || p.class_name || (curViewMode === 'buildings' ? 'Building' : 'Roof');

        const html = `
          <div style="font-family: 'Prompt', 'Inter', sans-serif;">
            <div style="font-size: 0.95rem; font-weight: 700; border-bottom: 1px solid rgba(255,255,255,0.12); padding-bottom: 6px; margin-bottom: 8px; display:flex; align-items:center; gap:8px;">
              <div style="width:12px;height:12px;border-radius:3px;background:${p.color || p.energy_color || '#3b82f6'};box-shadow:0 0 6px ${p.color || p.energy_color || '#3b82f6'}"></div>
              ${curViewMode === 'buildings' ? (p.building_id || 'Building') : clsName}
            </div>
            <div class="popup-row"><span style="color:#94a3b8">${curT.popupArea}</span><span style="font-weight:600">${area3d.toFixed(1)} m²</span></div>
            ${p.slope_deg ? `<div class="popup-row"><span style="color:#94a3b8">${curT.popupSlope}</span><span>${Number(p.slope_deg).toFixed(1)}°</span></div>` : ''}
            ${p.aspect_deg ? `<div class="popup-row"><span style="color:#94a3b8">${curT.popupAspect}</span><span>${Number(p.aspect_deg).toFixed(1)}°</span></div>` : ''}
            <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.08);">
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
        `;

        popupRef.current.setLngLat(e.lngLat).setHTML(html).addTo(map);
      });

      // Cursor pointer on hover
      map.on('mousemove', (e) => {
        const queryLayers = [];
        if (map.getLayer('facets-fill') && map.getLayoutProperty('facets-fill', 'visibility') !== 'none') {
          queryLayers.push('facets-fill');
        }
        if (map.getLayer('buildings-fill') && map.getLayoutProperty('buildings-fill', 'visibility') !== 'none') {
          queryLayers.push('buildings-fill');
        }
        if (queryLayers.length === 0) {
          map.getCanvas().style.cursor = '';
          return;
        }

        const features = map.queryRenderedFeatures(e.point, { layers: queryLayers });
        map.getCanvas().style.cursor = features.length > 0 ? 'pointer' : '';
      });

      map.on('load', () => {
        mapRef.current = map;
        setMapLoaded(true);
        rebuildAllLayers(map);

        if (facetsDataRef.current && facetsDataRef.current.features?.length > 0) {
          if (!initialZoomDone.current && !uploadedBoundaryRef.current) {
            initialZoomDone.current = true;
            zoomToBoundary(map, facetsDataRef.current);
          }
        }
      });

      return () => {
        if (mapRef.current) {
          mapRef.current.remove();
          mapRef.current = null;
          setMapLoaded(false);
        }
      };
    } catch (e) {
      console.error("MapLibre init error:", e);
    }
  }, []);

  // Update Facets Data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !facetsData) return;

    const src = map.getSource('facets-src');
    if (src) {
      src.setData(facetsData);
    } else {
      rebuildAllLayers(map);
    }

    if (!initialZoomDone.current && facetsData.features?.length > 0 && !uploadedBoundary) {
      initialZoomDone.current = true;
      zoomToBoundary(map, facetsData);
    }
    map.triggerRepaint();
  }, [facetsData, mapLoaded]);

  // Update Buildings Data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded || !buildingsData) return;

    const src = map.getSource('buildings-src');
    if (src) {
      src.setData(buildingsData);
    }
    map.triggerRepaint();
  }, [buildingsData, mapLoaded]);

  // Update Municipal & Uploaded Boundary Data
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const mSrc = map.getSource('municipal-src');
    if (mSrc && municipalBoundary) mSrc.setData(municipalBoundary);

    const uSrc = map.getSource('uploaded-src');
    if (uSrc) {
      uSrc.setData(uploadedBoundary || { type: 'FeatureCollection', features: [] });
      if (uploadedBoundary) zoomToBoundary(map, uploadedBoundary);
    }
  }, [municipalBoundary, uploadedBoundary, mapLoaded]);

  // Update View Mode Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const isFacets = viewMode === 'facets';
    if (map.getLayer('facets-fill')) {
      map.setLayoutProperty('facets-fill', 'visibility', isFacets ? 'visible' : 'none');
    }
    if (map.getLayer('facets-outline')) {
      map.setLayoutProperty('facets-outline', 'visibility', isFacets ? 'visible' : 'none');
    }
    if (map.getLayer('buildings-fill')) {
      map.setLayoutProperty('buildings-fill', 'visibility', !isFacets ? 'visible' : 'none');
    }
    if (map.getLayer('buildings-outline')) {
      map.setLayoutProperty('buildings-outline', 'visibility', !isFacets ? 'visible' : 'none');
    }
    map.triggerRepaint();
  }, [viewMode, mapLoaded]);

  // Update Color Mode Paint
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    if (map.getLayer('facets-fill')) {
      map.setPaintProperty('facets-fill', 'fill-color', getColorExpression());
      map.setPaintProperty('facets-fill', 'fill-opacity', 0.88);
      map.triggerRepaint();
    }
  }, [colorMode, mapLoaded]);

  // Apply filters via MapLibre GPU layer filter
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    const activeClasses = Object.entries(visibleLayers)
      .filter(([, v]) => v)
      .map(([k]) => Number(k));

    // Facets filter
    if (map.getLayer('facets-fill')) {
      const facetFilter = [
        'all',
        ['>=', ['coalesce', ['get', 'area_3d'], 0], filters.minArea || 0],
        ['>=', ['coalesce', ['get', 'energy_kwh'], 0], filters.minEnergy || 0],
        ['in', ['get', 'class_id'], ['literal', activeClasses]]
      ];
      map.setFilter('facets-fill', facetFilter);
      if (map.getLayer('facets-outline')) map.setFilter('facets-outline', facetFilter);
    }

    // Buildings filter
    if (map.getLayer('buildings-fill')) {
      const bldFilter = [
        'all',
        ['>=', ['coalesce', ['get', 'area_2d'], 0], filters.minArea || 0],
        ['>=', ['coalesce', ['get', 'energy_kwh'], 0], filters.minEnergy || 0]
      ];
      map.setFilter('buildings-fill', bldFilter);
      if (map.getLayer('buildings-outline')) map.setFilter('buildings-outline', bldFilter);
    }

    map.triggerRepaint();
  }, [filters, visibleLayers, mapLoaded]);

  const activeData = viewMode === 'buildings' ? buildingsData : facetsData;
  const totalCapMwp = ((activeData?.features?.reduce((acc, f) => acc + (f.properties?.capacity_kwp || 0), 0) || 0) / 1000).toFixed(2);
  const totalYieldGwh = ((activeData?.features?.reduce((acc, f) => acc + (f.properties?.energy_corrected_kwh || f.properties?.energy_kwh || 0), 0) || 0) / 1000000).toFixed(2);

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
        <button
          className="basemap-btn"
          onClick={zoomToRooftops}
          title={lang === 'th' ? 'ซูมไปที่กลุ่มหลังคา' : 'Zoom to Rooftops'}
          style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', marginLeft: 4, paddingLeft: 8 }}
        >
          <Focus size={13} color="#38bdf8" /> {lang === 'th' ? 'ซูมขอบเขต' : 'Fit View'}
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
          <div style={{ fontSize: '0.68rem', color: '#fbbf24' }}>{lang === 'th' ? 'กำลังผลิตติดตั้งรวม (Capacity)' : 'Total Capacity'}</div>
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
            <span style={{ color: '#94a3b8' }}>{lang === 'th' ? 'ขอบเขตเทศบาลตำบลเด่นชัย' : 'Denchai Municipal Boundary'}</span>
          </div>
          {uploadedBoundary && (
            <div className="legend-row">
              <div style={{ width: 14, height: 3, background: '#c084fc', borderRadius: 2 }} />
              <span style={{ color: '#c084fc' }}>{lang === 'th' ? 'ขอบเขตพื้นที่ศึกษา (AOI)' : 'Active Study Area (AOI)'}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
