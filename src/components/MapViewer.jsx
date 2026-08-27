import React, { useEffect, useState, useRef } from 'react';
import { Map, NavigationControl, ScaleControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, SunMedium, Focus, Plane } from 'lucide-react';
import MUNICIPAL_BOUNDARY from '../data/boundary.json';

// ── Derive clean base URL once ────────────────────────────────
const BASE = import.meta.env.BASE_URL || '/';
const cleanBase = BASE.endsWith('/') ? BASE : BASE + '/';
const FACETS_URL  = `${cleanBase}rooftop_facets.geojson`;
const BUILDINGS_URL = `${cleanBase}buildings.geojson`;
const UAV_TILE_URL = `${cleanBase}tiles/uav/{z}/{x}/{y}.webp`;

const ENERGY_LEGEND = [
  { color: '#22c55e', label: '< 7,500 kWh/y' },
  { color: '#f97316', label: '≥ 7,500 kWh/y' },
  { color: '#64748b', label: 'U-Roof / Unclassified' },
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
  const langRef     = useRef(lang);
  const tariffRef   = useRef(tariff);
  const viewModeRef = useRef(viewMode);
  const colorModeRef= useRef(colorMode);

  useEffect(() => { langRef.current     = lang;      }, [lang]);
  useEffect(() => { tariffRef.current   = tariff;    }, [tariff]);
  useEffect(() => { viewModeRef.current = viewMode;  }, [viewMode]);
  useEffect(() => { colorModeRef.current= colorMode; }, [colorMode]);

  const mapContainerRef = useRef(null);
  const mapRef   = useRef(null);
  const popupRef = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('dark');

  // ── Color fill expression ──────────────────────────────────
  const getColorExpr = (mode, vm) => {
    if (vm === 'buildings') return ['coalesce', ['get', 'energy_color'], '#f97316'];
    return mode === 'energy'
      ? ['coalesce', ['get', 'energy_color'], '#22c55e']
      : ['coalesce', ['get', 'color'], '#ef4444'];
  };

  // ── Fit bounds helper ─────────────────────────────────────
  const fitTo = (mapInstance, geoJSON) => {
    if (!geoJSON?.features?.length) return;
    try {
      const bbox = turf.bbox(geoJSON);
      mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], { padding: 50, duration: 900 });
    } catch (_) {}
  };

  const zoomToRooftops = () => {
    const map = mapRef.current;
    if (!map) return;
    if (uploadedBoundary?.features?.length) { fitTo(map, uploadedBoundary); return; }
    if (facetsData?.features?.length)       { fitTo(map, facetsData);       return; }
    fitTo(map, MUNICIPAL_BOUNDARY);
  };

  // ── Instant basemap toggle ────────────────────────────────
  const changeBasemap = (key) => {
    setCurrentBasemap(key);
    const map = mapRef.current;
    if (!map) return;
    const cfg = {
      uav:       ['uav-bg-osm','uav-layer'],
      dark:      ['dark-layer'],
      satellite: ['satellite-layer'],
      osm:       ['osm-layer'],
      light:     ['light-layer'],
    };
    const allIds = ['uav-bg-osm','uav-layer','dark-layer','satellite-layer','osm-layer','light-layer'];
    const show   = cfg[key] || [];
    allIds.forEach(id => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', show.includes(id) ? 'visible' : 'none');
      }
    });
  };

  // ── Popup factory ─────────────────────────────────────────
  const setupPopups = (mapInstance) => {
    mapInstance.on('click', (e) => {
      const queryLayers = ['facets-fill', 'buildings-fill'].filter(id =>
        mapInstance.getLayer(id) &&
        mapInstance.getLayoutProperty(id, 'visibility') !== 'none'
      );
      if (!queryLayers.length) return;
      const feats = mapInstance.queryRenderedFeatures(e.point, { layers: queryLayers });
      if (!feats?.length) return;

      const p      = feats[0].properties;
      const curT   = translations[langRef.current] || translations.th;
      const curTrf = tariffRef.current || 4.2;
      const curMode= viewModeRef.current || 'facets';
      const area   = Number(p.area_3d || p.area_2d || 0);
      const cap    = Number(p.capacity_kwp || (area * 0.18 * 0.20));
      const eng    = Number(p.energy_corrected_kwh || p.energy_kwh || 0);
      const sav    = Number(p.savings_thb || (eng * curTrf));
      const co2    = (eng * 0.4999) / 1000;
      const cls    = curT.classes?.[p.class_id] || p.class_name || (curMode === 'buildings' ? 'Building' : 'Roof');
      const dot    = p.color || p.energy_color || '#3b82f6';

      popupRef.current.setLngLat(e.lngLat).setHTML(`
        <div style="font-family:'Prompt','Inter',sans-serif">
          <div style="font-size:.9rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px">
            <div style="width:11px;height:11px;border-radius:3px;background:${dot}"></div>
            ${curMode === 'buildings' ? (p.building_id || 'Building') : cls}
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

    mapInstance.on('mousemove', (e) => {
      const ql = ['facets-fill','buildings-fill'].filter(id =>
        mapInstance.getLayer(id) && mapInstance.getLayoutProperty(id,'visibility') !== 'none'
      );
      const f = ql.length ? mapInstance.queryRenderedFeatures(e.point, { layers: ql }) : [];
      mapInstance.getCanvas().style.cursor = f.length ? 'pointer' : '';
    });
  };

  // ── Map initialisation (one-shot) ────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const style = {
      version: 8,
      glyphs: 'https://fonts.openmaptiles.org/{fontstack}/{range}.pbf',
      sources: {
        // Basemap rasters
        'osm-src':          { type:'raster', tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256, attribution:'© OpenStreetMap' },
        'carto-dark-src':   { type:'raster', tiles:['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png','https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png','https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'], tileSize:512, attribution:'© CARTO' },
        'satellite-src':    { type:'raster', tiles:['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize:256, attribution:'© Esri' },
        'carto-light-src':  { type:'raster', tiles:['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png','https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'], tileSize:512, attribution:'© CARTO' },
        'uav-src':          { type:'raster', tiles:[UAV_TILE_URL], tileSize:256, minzoom:14, maxzoom:20, attribution:'© UAV 30cm' },
        // Vector data — let MapLibre stream them directly
        'facets-src':       { type:'geojson', data: FACETS_URL,   buffer:64, tolerance:0.5 },
        'buildings-src':    { type:'geojson', data: BUILDINGS_URL, buffer:64, tolerance:0.5 },
        'boundary-src':     { type:'geojson', data: MUNICIPAL_BOUNDARY },
        'aoi-src':          { type:'geojson', data: { type:'FeatureCollection', features:[] } },
      },
      layers: [
        // ── Basemaps ─────────────────────────────────────────
        { id:'dark-layer',      type:'raster', source:'carto-dark-src',  layout:{ visibility:'visible' } },
        { id:'satellite-layer', type:'raster', source:'satellite-src',   layout:{ visibility:'none'    } },
        { id:'osm-layer',       type:'raster', source:'osm-src',         layout:{ visibility:'none'    } },
        { id:'light-layer',     type:'raster', source:'carto-light-src', layout:{ visibility:'none'    } },
        { id:'uav-bg-osm',      type:'raster', source:'osm-src',         layout:{ visibility:'none'    } },
        { id:'uav-layer',       type:'raster', source:'uav-src',         layout:{ visibility:'none'    } },

        // ── Municipal boundary (always on top of basemap) ───
        { id:'boundary-fill', type:'fill', source:'boundary-src', paint:{ 'fill-color':'#00f0ff', 'fill-opacity':0.05 } },
        { id:'boundary-glow', type:'line', source:'boundary-src', paint:{ 'line-color':'#000', 'line-width':7, 'line-opacity':0.85 } },
        { id:'boundary-line', type:'line', source:'boundary-src', paint:{ 'line-color':'#00f0ff', 'line-width':3.5, 'line-dasharray':[4,2] } },

        // ── AOI boundary ─────────────────────────────────────
        { id:'aoi-fill', type:'fill', source:'aoi-src', paint:{ 'fill-color':'#a855f7','fill-opacity':0.15 } },
        { id:'aoi-line', type:'line', source:'aoi-src', paint:{ 'line-color':'#c084fc','line-width':2.5 } },

        // ── Buildings (on top of boundaries) ─────────────────
        { id:'buildings-fill',    type:'fill', source:'buildings-src', layout:{ visibility:'none' }, paint:{ 'fill-color':['coalesce',['get','energy_color'],'#f97316'], 'fill-opacity':0.88 } },
        { id:'buildings-outline', type:'line', source:'buildings-src', layout:{ visibility:'none' }, paint:{ 'line-color':'#fff','line-width':1,'line-opacity':0.6 } },

        // ── Roof facets (topmost vector layer) ───────────────
        { id:'facets-fill',    type:'fill', source:'facets-src', layout:{ visibility:'visible' }, paint:{ 'fill-color':['coalesce',['get','color'],'#ef4444'], 'fill-opacity':0.88 } },
        { id:'facets-outline', type:'line', source:'facets-src', layout:{ visibility:'visible' }, paint:{ 'line-color':'#fff','line-width':1,'line-opacity':0.7 } },
      ]
    };

    const map = new Map({
      container: mapContainerRef.current,
      style,
      center:  [100.0548, 17.9824],
      zoom:    15,
      minZoom: 11,
      maxZoom: 22,
      pitch:   20,
      bearing: 0,
    });

    map.addControl(new NavigationControl({ visualizePitch: true }), 'top-right');
    map.addControl(new ScaleControl({ maxWidth: 120, unit: 'metric' }), 'bottom-left');

    popupRef.current = new Popup({ closeButton: true, closeOnClick: true, maxWidth: '320px' });

    map.on('load', () => {
      mapRef.current = map;
      setupPopups(map);
      setMapLoaded(true);

      // Fit to Denchai municipal area
      map.fitBounds([[100.028, 17.965],[100.084, 18.006]], { padding: 40, duration: 1000 });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; setMapLoaded(false); }
    };
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync viewMode — show facets OR buildings layer ─────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const isFacets = viewMode === 'facets';
    ['facets-fill','facets-outline'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', isFacets ? 'visible' : 'none');
    });
    ['buildings-fill','buildings-outline'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', isFacets ? 'none' : 'visible');
    });
  }, [viewMode, mapLoaded]);

  // ── Sync facet color expression when colorMode changes ─────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer('facets-fill')) {
      map.setPaintProperty('facets-fill', 'fill-color', getColorExpr(colorMode, viewMode));
    }
  }, [colorMode, viewMode, mapLoaded]);

  // ── Sync AOI (uploaded boundary) ─────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const src = map.getSource('aoi-src');
    if (!src) return;
    src.setData(uploadedBoundary || { type:'FeatureCollection', features:[] });
    if (uploadedBoundary?.features?.length) fitTo(map, uploadedBoundary);
  }, [uploadedBoundary, mapLoaded]);

  // ── Stats for floating card ───────────────────────────────
  const activeData = viewMode === 'buildings' ? buildingsData : facetsData;
  const totalCapMwp   = ((activeData?.features?.reduce((a,f)=> a + (f.properties?.capacity_kwp||0), 0)||0)/1000).toFixed(2);
  const totalYieldGwh = ((activeData?.features?.reduce((a,f)=> a + (f.properties?.energy_corrected_kwh||f.properties?.energy_kwh||0), 0)||0)/1e6).toFixed(2);

  const legendItems = viewMode === 'buildings'
    ? [{ color:'#22c55e', label:'< 5.0 kWp' }, { color:'#f97316', label:'≥ 5.0 kWp' }]
    : colorMode === 'energy'
      ? ENERGY_LEGEND
      : Object.entries(ROOF_CLASSES).map(([id, cls]) => ({ color: cls.color, label: t.classes?.[id] || cls.name }));

  return (
    <div className="map-wrap">
      <div ref={mapContainerRef} className="map-container" />

      {/* ── Basemap Switcher ─────────────────────────────── */}
      <div className="map-floating-panel basemap-control">
        {[
          { key:'dark',      icon:<Layers size={13}/>,    label: lang==='th' ? 'มืด (GIS)' : 'Dark' },
          { key:'satellite', icon:<Globe size={13}/>,     label: lang==='th' ? 'ดาวเทียม' : 'Satellite' },
          { key:'osm',       icon:<Compass size={13}/>,   label: 'OSM' },
          { key:'light',     icon:<SunMedium size={13}/>, label: lang==='th' ? 'สว่าง' : 'Light' },
          { key:'uav',       icon:<Plane size={13}/>,     label: lang==='th' ? 'โดรน UAV' : 'UAV 30cm' },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            type="button"
            className={`basemap-btn${currentBasemap === key ? ' active' : ''}`}
            onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); changeBasemap(key); }}
          >
            {icon} {label}
          </button>
        ))}
        <div style={{ width:1, background:'rgba(255,255,255,0.15)', margin:'2px 4px' }} />
        <button
          type="button"
          className="basemap-btn"
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); zoomToRooftops(); }}
          title={lang==='th' ? 'ซูมไปที่หลังคาเด่นชัย' : 'Fit to Denchai'}
        >
          <Focus size={13} color="#38bdf8" /> {lang==='th' ? 'ซูม' : 'Fit'}
        </button>
      </div>

      {/* ── Quick Stats Card ─────────────────────────────── */}
      <div style={{
        position:'absolute', top:62, left:16, zIndex:400,
        background:'rgba(13,20,36,0.94)', backdropFilter:'blur(16px)',
        border:'1px solid rgba(59,130,246,0.35)', borderRadius:12,
        padding:'14px 16px', color:'white', minWidth:210,
        boxShadow:'0 8px 32px rgba(0,0,0,0.5)', pointerEvents:'none'
      }}>
        <div style={{ fontSize:'0.7rem', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
          <SunMedium size={13} color="#f59e0b" /> {t.appTitle}
        </div>
        <div style={{ marginBottom:6 }}>
          <div style={{ fontSize:'0.67rem', color:'#fbbf24' }}>{lang==='th' ? 'กำลังผลิตรวม' : 'Total Capacity'}</div>
          <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#fcd34d' }}>
            {totalCapMwp} <span style={{ fontSize:'0.75rem', fontWeight:500 }}>MWp</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize:'0.67rem', color:'#6ee7b7' }}>{t.kpiTotalEnergy}</div>
          <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#34d399' }}>
            {totalYieldGwh} <span style={{ fontSize:'0.75rem', fontWeight:500 }}>GWh/y</span>
          </div>
        </div>
      </div>

      {/* ── Legend ────────────────────────────────────────── */}
      <div className="map-floating-panel map-legend">
        <div className="legend-title">
          {viewMode === 'buildings' ? 'System Capacity' : colorMode === 'energy' ? 'Solar Heatmap' : t.roofClassesHeader}
        </div>
        {legendItems.map((item, i) => (
          <div key={i} className="legend-row">
            <div className="legend-swatch" style={{ background: item.color }} />
            <span style={{ color:'#cbd5e1' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,0.08)' }}>
          <div className="legend-row">
            <div style={{ width:14, height:3, borderTop:'3px dashed #00f0ff' }} />
            <span style={{ color:'#00f0ff', fontWeight:700 }}>{lang==='th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
          </div>
          {uploadedBoundary && (
            <div className="legend-row">
              <div style={{ width:14, height:3, background:'#c084fc', borderRadius:2 }} />
              <span style={{ color:'#c084fc' }}>AOI</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
