import React, { useEffect, useState, useRef } from 'react';
import { Map, NavigationControl, ScaleControl, Popup } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import { Layers, Globe, Compass, SunMedium, Focus, Plane } from 'lucide-react';
import MUNICIPAL_BOUNDARY from '../data/boundary.json';

// ── URLs ──────────────────────────────────────────────────────
const BASE      = import.meta.env.BASE_URL || '/';
const cleanBase = BASE.endsWith('/') ? BASE : BASE + '/';

// Resolve absolute URLs at runtime (safe for browser env)
function absUrl(path) {
  try { return new URL(cleanBase + path, location.origin).href; }
  catch { return cleanBase + path; }
}

const FACETS_URL   = absUrl('rooftop_facets.geojson');
const BLDGS_URL    = absUrl('buildings.geojson');
const UAV_TILE_URL = cleanBase + 'tiles/uav/{z}/{x}/{y}.webp';

// Esri basemaps — completely free, no API key required
const ESRI = {
  dark:      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
  satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  osm:       'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
  light:     'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
};

const LEGEND_CLASS = Object.entries(ROOF_CLASSES).map(([id, c]) => ({ color: c.color, id }));
const LEGEND_ENERGY = [
  { color: '#22c55e', label: '< 7,500 kWh/y' },
  { color: '#f97316', label: '≥ 7,500 kWh/y' },
];
const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

// ─────────────────────────────────────────────────────────────
export default function MapViewer({
  facetsData, buildingsData, filters, visibleLayers,
  uploadedBoundary, municipalBoundary, colorMode, viewMode,
  lang = 'th', tariff = 4.2
}) {
  const t = translations[lang] || translations.th;
  const langRef     = useRef(lang);
  const tariffRef   = useRef(tariff);
  const viewModeRef = useRef(viewMode);
  const colorModeRef= useRef(colorMode);
  useEffect(() => { langRef.current      = lang;      }, [lang]);
  useEffect(() => { tariffRef.current    = tariff;    }, [tariff]);
  useEffect(() => { viewModeRef.current  = viewMode;  }, [viewMode]);
  useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);

  const mapContainerRef = useRef(null);
  const mapRef   = useRef(null);
  const popupRef = useRef(null);
  const [mapLoaded,     setMapLoaded]     = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('dark');

  // ── Color fill expression ────────────────────────────────
  const colorExpr = (mode, vm) => {
    if (vm === 'buildings') return ['coalesce', ['get', 'energy_color'], '#f97316'];
    return mode === 'energy'
      ? ['coalesce', ['get', 'energy_color'], '#22c55e']
      : ['coalesce', ['get', 'color'], '#ef4444'];
  };

  // ── Zoom helpers ─────────────────────────────────────────
  const fitTo = (map, geo) => {
    if (!geo?.features?.length) return;
    try {
      const bb = turf.bbox(geo);
      map.fitBounds([[bb[0], bb[1]], [bb[2], bb[3]]], { padding: 50, duration: 900 });
    } catch (_) {}
  };
  const zoomToRooftops = () => {
    const map = mapRef.current;
    if (!map) return;
    if (uploadedBoundary?.features?.length) { fitTo(map, uploadedBoundary); return; }
    if (facetsData?.features?.length)       { fitTo(map, facetsData);       return; }
    fitTo(map, MUNICIPAL_BOUNDARY);
  };

  // ── Basemap toggle ────────────────────────────────────────
  const changeBasemap = (key) => {
    setCurrentBasemap(key);
    const map = mapRef.current;
    if (!map) return;
    const ALL = ['dark-layer','satellite-layer','osm-layer','light-layer','uav-bg','uav-layer'];
    const SHOW = {
      dark:      ['dark-layer'],
      satellite: ['satellite-layer'],
      osm:       ['osm-layer'],
      light:     ['light-layer'],
      uav:       ['uav-bg','uav-layer'],
    }[key] || ['dark-layer'];
    ALL.forEach(id => {
      if (map.getLayer(id))
        map.setLayoutProperty(id, 'visibility', SHOW.includes(id) ? 'visible' : 'none');
    });
  };

  // ── Popup handler ─────────────────────────────────────────
  const setupPopups = (map) => {
    map.on('click', (e) => {
      const ql = ['facets-fill','buildings-fill'].filter(
        id => map.getLayer(id) && map.getLayoutProperty(id,'visibility') !== 'none'
      );
      if (!ql.length) return;
      const feats = map.queryRenderedFeatures(e.point, { layers: ql });
      if (!feats?.length) return;
      const p    = feats[0].properties;
      const T    = translations[langRef.current] || translations.th;
      const trf  = tariffRef.current || 4.2;
      const mode = viewModeRef.current || 'facets';
      const area = +( p.area_3d || p.area_2d || 0);
      const cap  = +( p.capacity_kwp || (area * 0.18 * 0.20));
      const eng  = +( p.energy_corrected_kwh || p.energy_kwh || 0);
      const sav  = +( p.savings_thb || (eng * trf));
      const co2  = (eng * 0.4999) / 1000;
      const cls  = T.classes?.[p.class_id] || p.class_name || 'Roof';
      const dot  = p.color || p.energy_color || '#3b82f6';
      popupRef.current.setLngLat(e.lngLat).setHTML(`
        <div style="font-family:'Prompt','Inter',sans-serif">
          <div style="font-size:.9rem;font-weight:700;padding-bottom:6px;margin-bottom:8px;
            border-bottom:1px solid rgba(255,255,255,.12);display:flex;align-items:center;gap:8px">
            <div style="width:11px;height:11px;border-radius:3px;background:${dot}"></div>
            ${mode==='buildings' ? (p.building_id||'Building') : cls}
          </div>
          <div class="popup-row"><span style="color:#94a3b8">${T.popupArea}</span><span>${area.toFixed(1)} m²</span></div>
          ${p.slope_deg ? `<div class="popup-row"><span style="color:#94a3b8">${T.popupSlope}</span><span>${(+p.slope_deg).toFixed(1)}°</span></div>` : ''}
          <div class="popup-row" style="margin-top:6px;padding-top:6px;border-top:1px solid rgba(255,255,255,.08)">
            <span style="color:#fcd34d;font-weight:600">⚡ ${T.popupCapacity}</span>
            <span style="color:#fcd34d;font-weight:700">${cap.toFixed(1)} kWp</span>
          </div>
          <div class="popup-row">
            <span style="color:#34d399;font-weight:600">☀️ ${T.popupAnnualEnergy}</span>
            <span style="color:#34d399;font-weight:700">${fmt(eng)} kWh/y</span>
          </div>
          <div class="popup-row highlight">
            <span>💰 ${T.popupAnnualSavings}</span><span>~${fmt(sav)} ฿/y</span>
          </div>
          <div class="popup-row">
            <span style="color:#38bdf8">🌿 ${T.popupCo2}</span>
            <span style="color:#38bdf8">${co2.toFixed(2)} t/y</span>
          </div>
        </div>
      `).addTo(map);
    });
    map.on('mousemove', (e) => {
      const ql = ['facets-fill','buildings-fill'].filter(
        id => map.getLayer(id) && map.getLayoutProperty(id,'visibility') !== 'none'
      );
      const f = ql.length ? map.queryRenderedFeatures(e.point, { layers: ql }) : [];
      map.getCanvas().style.cursor = f.length ? 'pointer' : '';
    });
  };

  // ── Map init ──────────────────────────────────────────────
  useEffect(() => {
    if (mapRef.current) return;

    const style = {
      version: 8,
      sources: {
        // ── Basemap rasters (Esri — free, no API key) ────────
        's-dark':      { type:'raster', tiles:[ESRI.dark],      tileSize:256, attribution:'© Esri' },
        's-satellite': { type:'raster', tiles:[ESRI.satellite], tileSize:256, attribution:'© Esri, Maxar' },
        's-osm':       { type:'raster', tiles:[ESRI.osm],       tileSize:256, attribution:'© OpenStreetMap' },
        's-light':     { type:'raster', tiles:[ESRI.light],     tileSize:256, attribution:'© Esri' },
        's-uav':       { type:'raster', tiles:[UAV_TILE_URL],   tileSize:256, minzoom:14, maxzoom:20, attribution:'© UAV 30cm' },
        // ── Vector GeoJSON (streamed by MapLibre Web Worker) ─
        'facets-src':  { type:'geojson', data:FACETS_URL,  buffer:64, tolerance:0.5 },
        'bldgs-src':   { type:'geojson', data:BLDGS_URL,   buffer:64, tolerance:0.5 },
        'bound-src':   { type:'geojson', data:MUNICIPAL_BOUNDARY },
        'aoi-src':     { type:'geojson', data:{ type:'FeatureCollection', features:[] } },
      },
      layers: [
        // ── Basemaps (only dark-layer visible by default) ──────
        { id:'dark-layer',      type:'raster', source:'s-dark',      layout:{ visibility:'visible' } },
        { id:'satellite-layer', type:'raster', source:'s-satellite', layout:{ visibility:'none'    } },
        { id:'osm-layer',       type:'raster', source:'s-osm',       layout:{ visibility:'none'    } },
        { id:'light-layer',     type:'raster', source:'s-light',     layout:{ visibility:'none'    } },
        { id:'uav-bg',          type:'raster', source:'s-osm',       layout:{ visibility:'none'    } },
        { id:'uav-layer',       type:'raster', source:'s-uav',       layout:{ visibility:'none'    } },
        // ── Boundary (cyan dashed, always visible) ────────────
        { id:'bound-fill', type:'fill', source:'bound-src', paint:{ 'fill-color':'#00f0ff','fill-opacity':0.05 } },
        { id:'bound-glow', type:'line', source:'bound-src', paint:{ 'line-color':'#000','line-width':7,'line-opacity':0.8 } },
        { id:'bound-line', type:'line', source:'bound-src', paint:{ 'line-color':'#00f0ff','line-width':3.5,'line-dasharray':[4,2] } },
        // ── AOI ───────────────────────────────────────────────
        { id:'aoi-fill', type:'fill', source:'aoi-src', paint:{ 'fill-color':'#a855f7','fill-opacity':0.15 } },
        { id:'aoi-line', type:'line', source:'aoi-src', paint:{ 'line-color':'#c084fc','line-width':2.5 } },
        // ── Buildings ─────────────────────────────────────────
        { id:'bldgs-fill',    type:'fill', source:'bldgs-src', layout:{ visibility:'none' },
          paint:{ 'fill-color':['coalesce',['get','energy_color'],'#f97316'],'fill-opacity':0.88 } },
        { id:'bldgs-outline', type:'line', source:'bldgs-src', layout:{ visibility:'none' },
          paint:{ 'line-color':'#fff','line-width':1,'line-opacity':0.6 } },
        // ── Roof Facets (ON by default) ───────────────────────
        { id:'facets-fill',    type:'fill', source:'facets-src', layout:{ visibility:'visible' },
          paint:{ 'fill-color':['coalesce',['get','color'],'#ef4444'],'fill-opacity':0.88 } },
        { id:'facets-outline', type:'line', source:'facets-src', layout:{ visibility:'visible' },
          paint:{ 'line-color':'#fff','line-width':1,'line-opacity':0.7 } },
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
    });
    map.addControl(new NavigationControl({ visualizePitch:true }), 'top-right');
    map.addControl(new ScaleControl({ maxWidth:120, unit:'metric' }), 'bottom-left');
    popupRef.current = new Popup({ closeButton:true, closeOnClick:true, maxWidth:'320px' });

    map.on('error', (e) => console.error('[Map error]', e.error?.message || e));

    map.on('load', () => {
      mapRef.current = map;
      setupPopups(map);
      setMapLoaded(true);
      console.info('[MapViewer] Loaded. FACETS_URL =', FACETS_URL);
      map.fitBounds([[100.028, 17.965],[100.084, 18.006]], { padding:40, duration:1000 });
    });

    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; setMapLoaded(false); }
    };
  }, []); // eslint-disable-line

  // ── Sync viewMode ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const isFacets = viewMode === 'facets';
    ['facets-fill','facets-outline'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', isFacets ? 'visible' : 'none');
    });
    ['bldgs-fill','bldgs-outline'].forEach(id => {
      if (map.getLayer(id)) map.setLayoutProperty(id, 'visibility', isFacets ? 'none' : 'visible');
    });
  }, [viewMode, mapLoaded]);

  // ── Sync colorMode ────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (map.getLayer('facets-fill'))
      map.setPaintProperty('facets-fill', 'fill-color', colorExpr(colorMode, viewMode));
  }, [colorMode, viewMode, mapLoaded]);

  // ── Sync AOI boundary ─────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    const src = map.getSource('aoi-src');
    if (!src) return;
    src.setData(uploadedBoundary || { type:'FeatureCollection', features:[] });
    if (uploadedBoundary?.features?.length) fitTo(map, uploadedBoundary);
  }, [uploadedBoundary, mapLoaded]);

  // ── Stats ─────────────────────────────────────────────────
  const ad  = viewMode === 'buildings' ? buildingsData : facetsData;
  const cap = ((ad?.features?.reduce((a,f) => a+(f.properties?.capacity_kwp||0), 0)||0)/1000).toFixed(2);
  const yld = ((ad?.features?.reduce((a,f) => a+(f.properties?.energy_corrected_kwh||f.properties?.energy_kwh||0), 0)||0)/1e6).toFixed(2);

  const legendItems = viewMode==='buildings'
    ? [{ color:'#22c55e',label:'< 5 kWp' }, { color:'#f97316',label:'≥ 5 kWp' }]
    : colorMode==='energy'
      ? LEGEND_ENERGY
      : LEGEND_CLASS.map(({ color, id }) => ({ color, label: t.classes?.[id] || ROOF_CLASSES[id]?.name || id }));

  return (
    <div className="map-wrap">
      <div ref={mapContainerRef} className="map-container" />

      {/* ── Basemap toolbar ─────────────────────────────── */}
      <div className="map-floating-panel basemap-control">
        {[
          { key:'dark',      Icon:Layers,    label: lang==='th' ? 'มืด (GIS)' : 'Dark' },
          { key:'satellite', Icon:Globe,     label: lang==='th' ? 'ดาวเทียม'  : 'Satellite' },
          { key:'osm',       Icon:Compass,   label: 'OSM' },
          { key:'light',     Icon:SunMedium, label: lang==='th' ? 'สว่าง'     : 'Light' },
          { key:'uav',       Icon:Plane,     label: lang==='th' ? 'โดรน UAV'  : 'UAV 30cm' },
        ].map(({ key, Icon, label }) => (
          <button
            key={key} type="button"
            className={`basemap-btn${currentBasemap===key?' active':''}`}
            onMouseDown={(e) => { e.preventDefault(); changeBasemap(key); }}
          >
            <Icon size={13} /> {label}
          </button>
        ))}
        <div style={{ width:1, background:'rgba(255,255,255,.15)', margin:'2px 5px' }} />
        <button type="button" className="basemap-btn"
          onMouseDown={(e) => { e.preventDefault(); zoomToRooftops(); }}>
          <Focus size={13} color="#38bdf8" /> {lang==='th' ? 'ซูม' : 'Fit'}
        </button>
      </div>

      {/* ── Quick Stats ─────────────────────────────────── */}
      <div style={{
        position:'absolute', top:62, left:16, zIndex:400, pointerEvents:'none',
        background:'rgba(13,20,36,0.94)', backdropFilter:'blur(16px)',
        border:'1px solid rgba(59,130,246,0.35)', borderRadius:12,
        padding:'14px 16px', color:'white', minWidth:210,
        boxShadow:'0 8px 32px rgba(0,0,0,0.5)',
      }}>
        <div style={{ fontSize:'0.68rem', color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8, display:'flex', alignItems:'center', gap:6 }}>
          <SunMedium size={13} color="#f59e0b" /> {t.appTitle}
        </div>
        <div style={{ marginBottom:6 }}>
          <div style={{ fontSize:'0.67rem', color:'#fbbf24' }}>{lang==='th'?'กำลังผลิตรวม':'Total Capacity'}</div>
          <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#fcd34d' }}>
            {cap} <span style={{ fontSize:'0.75rem', fontWeight:500 }}>MWp</span>
          </div>
        </div>
        <div>
          <div style={{ fontSize:'0.67rem', color:'#6ee7b7' }}>{t.kpiTotalEnergy}</div>
          <div style={{ fontSize:'1.35rem', fontWeight:800, color:'#34d399' }}>
            {yld} <span style={{ fontSize:'0.75rem', fontWeight:500 }}>GWh/y</span>
          </div>
        </div>
      </div>

      {/* ── Legend ──────────────────────────────────────── */}
      <div className="map-floating-panel map-legend">
        <div className="legend-title">
          {viewMode==='buildings' ? 'Capacity' : colorMode==='energy' ? 'Solar Heatmap' : t.roofClassesHeader}
        </div>
        {legendItems.map((item, i) => (
          <div key={i} className="legend-row">
            <div className="legend-swatch" style={{ background: item.color }} />
            <span style={{ color:'#cbd5e1' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,.08)' }}>
          <div className="legend-row">
            <div style={{ width:14, height:3, borderTop:'3px dashed #00f0ff' }} />
            <span style={{ color:'#00f0ff', fontWeight:700 }}>{lang==='th'?'ขอบเขตเทศบาลเด่นชัย':'Denchai Boundary'}</span>
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
