import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Map, NavigationControl, ScaleControl, Popup, Marker, setWorkerUrl, addProtocol } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import {
  Layers, Globe, Compass, SunMedium, Focus, Plane,
  MapPin, Activity, Square, Pencil, Trash2, Download, X, Ruler, CheckCircle2,
  Scissors, GitMerge, Plus, Magnet
} from 'lucide-react';
import { splitLineAtPoint, mergeTwoLines, findSnapTarget } from '../utils/gisTopology';
import MUNICIPAL_BOUNDARY from '../data/boundary.json';
import { POI_DATA, POI_CATEGORIES } from '../data/poi_data';
import { INFRA_DATA, INFRA_CATEGORIES } from '../data/infra_data';
import { SERVICE_DATA, SERVICE_CATEGORIES } from '../data/service_data';
import { WATER_DATA, WATER_CATEGORIES } from '../data/water_data';

// ── Thai Area Formatting Helper ──
function formatThaiArea(sqm) {
  if (!sqm || sqm <= 0) return '0 ตร.ม.';
  const rai = Math.floor(sqm / 1600);
  const rem1 = sqm % 1600;
  const ngan = Math.floor(rem1 / 400);
  const rem2 = rem1 % 400;
  const wah = (rem2 / 4).toFixed(1);

  let str = `${sqm.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} ตร.ม.`;
  if (rai > 0 || ngan > 0 || Number(wah) > 0) {
    str += ` (${rai > 0 ? rai + ' ไร่ ' : ''}${ngan > 0 ? ngan + ' งาน ' : ''}${wah} ตร.วา)`;
  }
  return str;
}

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

// ── Register Custom Protocol 'uav' to make white border & background transparent ──
try {
  addProtocol('uav', async (params, abortController) => {
    const rawUrl = params.url.replace(/^uav:\/\//, '');
    const response = await fetch(rawUrl, { signal: abortController.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();

    try {
      const img = await createImageBitmap(blob);
      let canvas;
      if (typeof OffscreenCanvas !== 'undefined') {
        canvas = new OffscreenCanvas(img.width, img.height);
      } else {
        canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
      }
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, img.width, img.height);
      const d = imgData.data;

      let hasWhite = false;
      for (let i = 0; i < d.length; i += 4) {
        const r = d[i], g = d[i+1], b = d[i+2];
        // Strip out white nodata background / white collar around UAV orthophoto
        if (r >= 246 && g >= 246 && b >= 246) {
          d[i+3] = 0; // 100% transparent
          hasWhite = true;
        } else if (r >= 236 && g >= 236 && b >= 236) {
          const factor = (255 - Math.max(r, g, b)) / 19;
          d[i+3] = Math.round(d[i+3] * factor);
          hasWhite = true;
        }
      }

      if (hasWhite) {
        ctx.putImageData(imgData, 0, 0);
        let outBlob;
        if (canvas.convertToBlob) {
          outBlob = await canvas.convertToBlob({ type: 'image/webp', quality: 0.92 });
        } else {
          outBlob = await new Promise(res => canvas.toBlob(res, 'image/png'));
        }
        const ab = await outBlob.arrayBuffer();
        return { data: ab };
      }
    } catch (_) {}

    const originalBuffer = await blob.arrayBuffer();
    return { data: originalBuffer };
  });
} catch (err) {
  console.warn('MapLibre UAV custom protocol setup:', err);
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
  'hospital', '#ef4444',
  'clinic', '#10b981',
  'pharmacy', '#ec4899',
  'industry', '#a855f7',
  'temple', '#f59e0b',
  'school', '#3b82f6',
  'market', '#f97316',
  'transport', '#8b5cf6',
  'government', '#0891b2',
  'park', '#16a34a',
  'bank', '#6366f1',
  '#3b82f6'
];

const SERVICE_COLOR_MATCH = [
  'match',
  ['get', 'category'],
  'health', '#ef4444',
  'police', '#1d4ed8',
  'fire', '#dc2626',
  'welfare', '#8b5cf6',
  'post', '#0891b2',
  'waste', '#16a34a',
  '#ef4444'
];

const INFRA_COLOR_MATCH = [
  'match',
  ['get', 'category'],
  'highway',       '#c2410c',
  'rural_road',    '#0369a1',
  'main_road',     '#d97706',
  'collector_road','#ea580c',
  'local_road',    '#94a3b8',
  'agri_road',     '#16a34a',
  'planned_road',  '#db2777',
  'rail',          '#6d28d9',
  'bridge',        '#b91c1c',
  'water',         '#0891b2',
  'electric',      '#ca8a04',
  '#d97706'
];

export const WATER_COLOR_MATCH = [
  'match',
  ['get', 'category'],
  'river', '#0284c7',
  'canal', '#06b6d4',
  'reservoir', '#0ea5e9',
  'pond', '#14b8a6',
  'water_plant', '#3b82f6',
  '#0284c7'
];

const ENERGY_LEGEND = [
  { color: '#22c55e', label: '< 7,500 kWh/y' },
  { color: '#f97316', label: '≥ 7,500 kWh/y' },
  { color: '#64748b', label: 'U-Roof / Unclassified' },
];

const MAPLIBRE_DRAW_THEME = [
  // Polygon Fill (Inactive)
  {
    id: 'gl-draw-polygon-fill-inactive',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static'], ['==', 'active', 'false']],
    paint: {
      'fill-color': '#38bdf8',
      'fill-outline-color': '#38bdf8',
      'fill-opacity': 0.2
    }
  },
  // Polygon Fill (Active)
  {
    id: 'gl-draw-polygon-fill-active',
    type: 'fill',
    filter: ['all', ['==', '$type', 'Polygon'], ['!=', 'mode', 'static'], ['==', 'active', 'true']],
    paint: {
      'fill-color': '#f59e0b',
      'fill-outline-color': '#f59e0b',
      'fill-opacity': 0.25
    }
  },
  // Line & Polygon Stroke (Inactive)
  {
    id: 'gl-draw-line-inactive',
    type: 'line',
    filter: ['all', ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']], ['!=', 'mode', 'static'], ['==', 'active', 'false']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#38bdf8',
      'line-width': 3.5
    }
  },
  // Line & Polygon Stroke (Active)
  {
    id: 'gl-draw-line-active',
    type: 'line',
    filter: ['all', ['any', ['==', '$type', 'LineString'], ['==', '$type', 'Polygon']], ['!=', 'mode', 'static'], ['==', 'active', 'true']],
    layout: {
      'line-cap': 'round',
      'line-join': 'round'
    },
    paint: {
      'line-color': '#f59e0b',
      'line-width': 4.5
    }
  },
  // Point Outer
  {
    id: 'gl-draw-point-outer',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 9,
      'circle-color': '#ffffff'
    }
  },
  // Point Inner
  {
    id: 'gl-draw-point-inner',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'feature']],
    paint: {
      'circle-radius': 6,
      'circle-color': ['case', ['==', ['get', 'active'], 'true'], '#f59e0b', '#38bdf8']
    }
  },
  // Vertex Outer (during direct_select)
  {
    id: 'gl-draw-vertex-outer',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 8,
      'circle-color': '#ffffff'
    }
  },
  // Vertex Inner (during direct_select)
  {
    id: 'gl-draw-vertex-inner',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'vertex']],
    paint: {
      'circle-radius': 5,
      'circle-color': ['case', ['==', ['get', 'active'], 'true'], '#ef4444', '#f59e0b']
    }
  },
  // Midpoint (between vertices for adding new points)
  {
    id: 'gl-draw-midpoint',
    type: 'circle',
    filter: ['all', ['==', '$type', 'Point'], ['==', 'meta', 'midpoint']],
    paint: {
      'circle-radius': 4,
      'circle-color': '#f59e0b'
    }
  }
];

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

// ── Module-level Pin Image Creator (ใช้ซ้ำได้ทุก scope) ────────────
const PIN_W = 32, PIN_H = 44;
function createPinImage(color) {
  const canvas = document.createElement('canvas');
  canvas.width  = PIN_W;
  canvas.height = PIN_H;
  const ctx = canvas.getContext('2d');
  const cx = PIN_W / 2, cr = PIN_W * 0.44, cy = cr + 2;

  ctx.shadowColor = 'rgba(0,0,0,0.35)';
  ctx.shadowBlur = 4;
  ctx.shadowOffsetY = 2;

  ctx.beginPath();
  ctx.arc(cx, cy, cr, Math.PI, 0);
  ctx.lineTo(cx + cr * 0.25, cy + cr * 1.1);
  ctx.quadraticCurveTo(cx, PIN_H - 2, cx - cr * 0.25, cy + cr * 1.1);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.shadowColor = 'transparent';

  ctx.beginPath();
  ctx.arc(cx, cy, cr * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();

  ctx.beginPath();
  ctx.arc(cx, cy, cr, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  return {
    data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
    width: canvas.width, height: canvas.height
  };
}

export default function MapViewer({
  facetsData,
  buildingsData,
  filters,
  visibleLayers,
  uploadedBoundary,
  setUploadedBoundary = null,
  municipalBoundary,
  colorMode,
  viewMode,
  lang = 'th',
  tariff = 4.2,
  // Smart City props
  activeTab = 'poi',
  poiData = POI_DATA,
  infraData = INFRA_DATA,
  serviceData = SERVICE_DATA,
  waterData = WATER_DATA,
  poiVisible = {},
  infraVisible = {},
  serviceVisible = {},
  waterVisible = {},
  selectedFeature = null,
  isEditorMode = false,
  // Editor props
  isPickingLocation = false,
  onLocationPicked = null,
  onEditFeature = null,
  onAddFeature = null,
  reshapingFeature = null,
  onFinishReshaping = null,
  onSaveFeature = null,
  triggerDrawRoad = false,
  onResetTriggerDrawRoad = null,
  triggerDrawDrain = false,
  onResetTriggerDrawDrain = null,
  triggerDrawWater = false,
  onResetTriggerDrawWater = null,
  triggerDrawRoof = false,
  onResetTriggerDrawRoof = null,
  triggerDrawBuilding = false,
  onResetTriggerDrawBuilding = null,
  onSplitFeature = null,
  onMergeFeatures = null,
  onDeleteFeature = null,
}) {
  const t = translations[lang] || translations.th;
  const langRef = useRef(lang);
  const tariffRef = useRef(tariff);
  const viewModeRef = useRef(viewMode);
  const colorModeRef = useRef(colorMode);
  const activeTabRef = useRef(activeTab);
  const facetsDataRef = useRef(facetsData);
  const buildingsDataRef = useRef(buildingsData);
  const poiDataRef = useRef(poiData);
  const infraDataRef = useRef(infraData);
  const serviceDataRef = useRef(serviceData);
  const waterDataRef = useRef(waterData);
  const isPickingLocationRef = useRef(isPickingLocation);
  const onLocationPickedRef = useRef(onLocationPicked);
  const onEditFeatureRef = useRef(onEditFeature);
  const onSplitFeatureRef = useRef(onSplitFeature);
  const onMergeFeaturesRef = useRef(onMergeFeatures);
  const onDeleteFeatureRef = useRef(onDeleteFeature);

  useEffect(() => { langRef.current = lang; }, [lang]);
  useEffect(() => { tariffRef.current = tariff; }, [tariff]);
  useEffect(() => { viewModeRef.current = viewMode; }, [viewMode]);
  useEffect(() => { colorModeRef.current = colorMode; }, [colorMode]);
  useEffect(() => { activeTabRef.current = activeTab; }, [activeTab]);
  useEffect(() => { facetsDataRef.current = facetsData; }, [facetsData]);
  useEffect(() => { buildingsDataRef.current = buildingsData; }, [buildingsData]);
  useEffect(() => { poiDataRef.current = poiData; }, [poiData]);
  useEffect(() => { infraDataRef.current = infraData; }, [infraData]);
  useEffect(() => { serviceDataRef.current = serviceData; }, [serviceData]);
  useEffect(() => { waterDataRef.current = waterData; }, [waterData]);
  useEffect(() => { isPickingLocationRef.current = isPickingLocation; }, [isPickingLocation]);
  useEffect(() => { onLocationPickedRef.current = onLocationPicked; }, [onLocationPicked]);
  useEffect(() => { onEditFeatureRef.current = onEditFeature; }, [onEditFeature]);
  useEffect(() => { onSplitFeatureRef.current = onSplitFeature; }, [onSplitFeature]);
  useEffect(() => { onMergeFeaturesRef.current = onMergeFeatures; }, [onMergeFeatures]);
  useEffect(() => { onDeleteFeatureRef.current = onDeleteFeature; }, [onDeleteFeature]);

  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);
  const drawRef = useRef(null);
  const poiLabelMarkersRef = useRef([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentBasemap, setCurrentBasemap] = useState('uav');
  const [activeDrawMode, setActiveDrawMode] = useState('none');
  const [measureInfo, setMeasureInfo] = useState(null);
  const [editingRoadId, setEditingRoadId] = useState(null);
  const [editingRoadName, setEditingRoadName] = useState('');
  const [topologyMode, setTopologyMode] = useState('none'); // 'none' | 'reshape' | 'split' | 'merge' | 'delete'
  const [mergeFirstFeature, setMergeFirstFeature] = useState(null);
  const [snapEnabled, setSnapEnabled] = useState(true);
  const topologyModeRef = useRef('none');
  const mergeFirstFeatureRef = useRef(null);
  const snapEnabledRef = useRef(true);
  const activeDrawModeRef = useRef('none');
  const editingRoadIdRef = useRef(null);
  const editingRoadFeatRef = useRef(null);
  const drawingDatasetTypeRef = useRef(null);

  useEffect(() => { topologyModeRef.current = topologyMode; }, [topologyMode]);
  useEffect(() => { mergeFirstFeatureRef.current = mergeFirstFeature; }, [mergeFirstFeature]);
  useEffect(() => { snapEnabledRef.current = snapEnabled; }, [snapEnabled]);
  useEffect(() => { activeDrawModeRef.current = activeDrawMode; }, [activeDrawMode]);
  useEffect(() => { editingRoadIdRef.current = editingRoadId; }, [editingRoadId]);

  const startReshapingRoad = (feat) => {
    if (!feat || !drawRef.current || !mapRef.current) return;
    const draw = drawRef.current;
    try {
      draw.deleteAll();
      const ids = draw.add(feat);
      const targetId = ids && ids.length ? ids[0] : (feat.id || feat.properties?.id);
      draw.changeMode('direct_select', { featureId: targetId });
      setActiveDrawMode('select');
      setEditingRoadId(targetId);
      editingRoadFeatRef.current = feat;
      setEditingRoadName(feat.properties?.name_th || feat.properties?.name_en || feat.properties?.class_name || 'ผืนหลังคา/ถนน');

      const centroid = turf.centroid(feat);
      mapRef.current.flyTo({ center: centroid.geometry.coordinates, zoom: 18, duration: 800 });
    } catch (e) {
      console.warn('start reshaping error:', e);
    }
  };

  useEffect(() => {
    if (triggerDrawRoad && drawRef.current) {
      drawingDatasetTypeRef.current = 'infra';
      setDrawMode('line');
      onResetTriggerDrawRoad?.();
    }
  }, [triggerDrawRoad]);

  useEffect(() => {
    if (triggerDrawDrain && drawRef.current) {
      drawingDatasetTypeRef.current = 'drain';
      setDrawMode('line');
      onResetTriggerDrawDrain?.();
    }
  }, [triggerDrawDrain]);

  useEffect(() => {
    if (triggerDrawWater && drawRef.current) {
      drawingDatasetTypeRef.current = 'water';
      setDrawMode('polygon');
      onResetTriggerDrawWater?.();
    }
  }, [triggerDrawWater]);

  useEffect(() => {
    if (triggerDrawRoof && drawRef.current) {
      drawingDatasetTypeRef.current = 'solar';
      setDrawMode('polygon');
      onResetTriggerDrawRoof?.();
    }
  }, [triggerDrawRoof]);

  useEffect(() => {
    if (triggerDrawBuilding && drawRef.current) {
      drawingDatasetTypeRef.current = 'building_sc';
      setDrawMode('polygon');
      onResetTriggerDrawBuilding?.();
    }
  }, [triggerDrawBuilding]);

  useEffect(() => {
    if (!reshapingFeature || !drawRef.current || !mapRef.current) return;
    startReshapingRoad(reshapingFeature);
  }, [reshapingFeature]);

  const updateMeasurements = () => {
    if (!drawRef.current) return;
    const data = drawRef.current.getAll();
    if (!data || !data.features || data.features.length === 0) {
      setMeasureInfo(null);
      return;
    }
    const selectedIds = drawRef.current.getSelectedIds();
    const targetFeat = selectedIds.length > 0
      ? data.features.find(f => f.id === selectedIds[0]) || data.features[data.features.length - 1]
      : data.features[data.features.length - 1];

    if (!targetFeat) {
      setMeasureInfo(null);
      return;
    }

    const geomType = targetFeat.geometry?.type;
    if (geomType === 'LineString') {
      const lenKm = turf.length(targetFeat, { units: 'kilometers' });
      const lenM = lenKm * 1000;
      const coords = targetFeat.geometry?.coordinates;
      let bearingInfo = null;
      if (coords && coords.length >= 2) {
        const startPt = turf.point(coords[0]);
        const endPt = turf.point(coords[coords.length - 1]);
        let angle = Math.round(turf.bearing(startPt, endPt));
        if (angle < 0) angle += 360;

        const directions = [
          { min: 337.5, max: 360,   th: 'ทิศเหนือ (N)', en: 'North (N)' },
          { min: 0,     max: 22.5,  th: 'ทิศเหนือ (N)', en: 'North (N)' },
          { min: 22.5,  max: 67.5,  th: 'ทิศตะวันออกเฉียงเหนือ (NE)', en: 'Northeast (NE)' },
          { min: 67.5,  max: 112.5, th: 'ทิศตะวันออก (E)', en: 'East (E)' },
          { min: 112.5, max: 157.5, th: 'ทิศตะวันออกเฉียงใต้ (SE)', en: 'Southeast (SE)' },
          { min: 157.5, max: 202.5, th: 'ทิศใต้ (S)', en: 'South (S)' },
          { min: 202.5, max: 247.5, th: 'ทิศตะวันตกเฉียงใต้ (SW)', en: 'Southwest (SW)' },
          { min: 247.5, max: 292.5, th: 'ทิศตะวันตก (W)', en: 'West (W)' },
          { min: 292.5, max: 337.5, th: 'ทิศตะวันตกเฉียงเหนือ (NW)', en: 'Northwest (NW)' },
        ];
        const dir = directions.find(d => angle >= d.min && angle < d.max) || directions[0];
        bearingInfo = { angle, dirText: lang === 'th' ? dir.th : dir.en };
      }

      setMeasureInfo({
        type: 'line',
        feature: targetFeat,
        lengthKm: lenKm.toFixed(3),
        lengthM: lenM.toFixed(1),
        bearing: bearingInfo,
        totalFeatures: data.features.length
      });
    } else if (geomType === 'Polygon') {
      const areaM2 = turf.area(targetFeat);
      setMeasureInfo({
        type: 'polygon',
        feature: targetFeat,
        areaSqm: areaM2.toFixed(1),
        thaiArea: formatThaiArea(areaM2),
        totalFeatures: data.features.length
      });
    } else if (geomType === 'Point') {
      setMeasureInfo({
        type: 'point',
        feature: targetFeat,
        coords: targetFeat.geometry.coordinates,
        totalFeatures: data.features.length
      });
    }
  };

  const rectStartRef = useRef(null); // จุดเริ่มต้น Rectangle

  const setDrawMode = (mode) => {
    const draw = drawRef.current;
    const map  = mapRef.current;
    if (!draw) return;

    // รีเซ็ต rectangle state
    rectStartRef.current = null;

    if (mode === 'point') {
      draw.changeMode('draw_point');
      setActiveDrawMode('point');
      if (map) map.getCanvas().style.cursor = 'crosshair';
    } else if (mode === 'line') {
      draw.changeMode('draw_line_string');
      setActiveDrawMode('line');
      if (map) map.getCanvas().style.cursor = 'crosshair';
    } else if (mode === 'polygon') {
      draw.changeMode('draw_polygon');
      setActiveDrawMode('polygon');
      if (map) map.getCanvas().style.cursor = 'crosshair';
    } else if (mode === 'select') {
      draw.changeMode('simple_select');
      setActiveDrawMode('select');
      if (map) map.getCanvas().style.cursor = '';
    } else {
      draw.changeMode('simple_select');
      setActiveDrawMode('none');
      if (map) map.getCanvas().style.cursor = '';
    }
  };

  const handleTrash = () => {
    drawRef.current?.trash();
    setTimeout(updateMeasurements, 50);
  };

  const handleClearAll = () => {
    if (window.confirm(lang === 'th' ? 'ล้างรูปทรงที่วาดทั้งหมดใช่หรือไม่?' : 'Delete all drawn shapes?')) {
      drawRef.current?.deleteAll();
      setMeasureInfo(null);
      setActiveDrawMode('none');
    }
  };

  const handleExportDrawn = () => {
    const data = drawRef.current?.getAll();
    if (!data || !data.features?.length) {
      alert(lang === 'th' ? 'ไม่มีรูปทรงที่วาดบนแผนที่' : 'No shapes drawn on map');
      return;
    }
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data));
    const link = document.createElement('a');
    link.setAttribute('href', dataStr);
    link.setAttribute('download', `Denchai_Draw_${Date.now()}.geojson`);
    link.click();
  };

  const handleApplyAsAOI = (feat) => {
    if (!feat || feat.geometry?.type !== 'Polygon') return;
    const aoiCollection = { type: 'FeatureCollection', features: [feat] };
    setUploadedBoundary?.(aoiCollection);
  };

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

  // ── Zoom Helpers (Always Centered on Municipal Boundary) ────
  const zoomTo = (mapInstance, geoJSON = MUNICIPAL_BOUNDARY) => {
    const target = geoJSON || MUNICIPAL_BOUNDARY;
    if (!target || !target.features?.length) return;
    try {
      const bbox = turf.bbox(target);
      mapInstance.fitBounds([[bbox[0], bbox[1]], [bbox[2], bbox[3]]], {
        padding: { top: 50, bottom: 50, left: 410, right: 50 },
        duration: 800
      });
    } catch (_) {}
  };

  const zoomToRooftops = () => {
    const map = mapRef.current;
    if (!map) return;
    if (uploadedBoundary?.features?.length) { zoomTo(map, uploadedBoundary); return; }
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

  // ── Setup Popups & Interactive Handlers ───────────────────────
  const setupPopups = (mapInstance) => {
    mapInstance.on('click', (e) => {
      // 0. If picking location, trigger callback and stop
      if (isPickingLocationRef.current) {
        onLocationPickedRef.current?.([e.lngLat.lng, e.lngLat.lat]);
        return;
      }

      // 0.r Rectangle draw mode — คลิกครั้งแรก = จุด start, ครั้งที่สอง = สร้าง polygon
      if (activeDrawModeRef.current === 'rectangle') {
        const lngLat = [e.lngLat.lng, e.lngLat.lat];
        if (!rectStartRef.current) {
          // จุดแรก — เก็บ start point
          rectStartRef.current = lngLat;
          mapInstance.getCanvas().style.cursor = 'crosshair';
        } else {
          // จุดที่สอง — สร้าง rectangle polygon
          const [lng1, lat1] = rectStartRef.current;
          const [lng2, lat2] = lngLat;
          const rectCoords = [
            [lng1, lat1], [lng2, lat1],
            [lng2, lat2], [lng1, lat2],
            [lng1, lat1]
          ];
          const rectFeature = {
            type: 'Feature',
            id: `rect-${Date.now()}`,
            geometry: { type: 'Polygon', coordinates: [rectCoords] },
            properties: {
              id: `rect-${Date.now()}`,
              name_th: 'สี่เหลี่ยมที่วาด',
              category: 'other',
              draw_type: 'rectangle'
            }
          };
          rectStartRef.current = null;
          setActiveDrawMode('none');
          mapInstance.getCanvas().style.cursor = '';
          // เปิด modal เพื่อบันทึกข้อมูล
          const areaM2 = Math.abs((lng2 - lng1) * (lat2 - lat1)) * 111319 * 111319 * Math.cos((lat1 + lat2) / 2 * Math.PI / 180);
          const feat = { ...rectFeature, properties: { ...rectFeature.properties, area_sqm: Number(areaM2.toFixed(1)) } };
          setTimeout(() => {
            const ds = drawingDatasetTypeRef.current || 'water';
            onEditFeatureRef.current?.(feat, ds);
          }, 100);
        }
        return;
      }

      // 0.0 Topology: Reshape line mode
      if (topologyModeRef.current === 'reshape') {
        const lineFeats = mapInstance.queryRenderedFeatures(e.point, { layers: ['infra-line'] });
        if (lineFeats?.length) {
          const clickedTileFeat = lineFeats[0];
          const p = clickedTileFeat.properties;
          const origFeat = infraDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || clickedTileFeat.id)) || clickedTileFeat;
          setTopologyMode('none');
          startReshapingRoad(origFeat);
          return;
        }
      }

      // 0.1 Topology: Split line mode
      if (topologyModeRef.current === 'split') {
        const lineFeats = mapInstance.queryRenderedFeatures(e.point, { layers: ['infra-line'] });
        if (lineFeats?.length) {
          const clickedTileFeat = lineFeats[0];
          const p = clickedTileFeat.properties;
          const origFeat = infraDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || clickedTileFeat.id)) || clickedTileFeat;
          const splitParts = splitLineAtPoint(origFeat, [e.lngLat.lng, e.lngLat.lat]);
          if (splitParts && splitParts.length === 2) {
            onSplitFeatureRef.current?.(origFeat.properties?.id || origFeat.id, splitParts, 'infra');
            alert(`✂️ ตัดเส้นทาง "${origFeat.properties?.name_th || 'ถนน'}" ออกเป็น 2 ตอนเรียบร้อยแล้ว!\n- ตอน 1: ${splitParts[0].properties.length_km} กม.\n- ตอน 2: ${splitParts[1].properties.length_km} กม.`);
          } else {
            alert('ไม่สามารถตัดเส้นทาง ณ จุดนี้ได้ กรุณาลองคลิกใหม่อีกครั้ง');
          }
          setTopologyMode('none');
          return;
        }
      }

      // 0.2 Topology: Merge lines mode
      if (topologyModeRef.current === 'merge') {
        const lineFeats = mapInstance.queryRenderedFeatures(e.point, { layers: ['infra-line'] });
        if (lineFeats?.length) {
          const clickedTileFeat = lineFeats[0];
          const p = clickedTileFeat.properties;
          const origFeat = infraDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || clickedTileFeat.id)) || clickedTileFeat;

          if (!mergeFirstFeatureRef.current) {
            setMergeFirstFeature(origFeat);
            return;
          } else {
            const firstFeat = mergeFirstFeatureRef.current;
            const firstId = firstFeat.properties?.id || firstFeat.id;
            const secondId = origFeat.properties?.id || origFeat.id;
            if (firstId === secondId) {
              alert('ท่านเลือกถนนเส้นเดิม กรุณาคลิกเลือกถนนเส้นอื่นที่ต้องการนำมาเชื่อมต่อ');
              return;
            }
            const merged = mergeTwoLines(firstFeat, origFeat);
            if (merged) {
              onMergeFeaturesRef.current?.(firstId, secondId, merged, 'infra');
              alert(`🔗 รวมเส้นทาง "${firstFeat.properties?.name_th || 'ถนน'}" และ "${origFeat.properties?.name_th || 'ถนน'}" เรียบร้อยแล้ว!\nความยาวรวม: ${merged.properties.length_km} กม.`);
            }
            setTopologyMode('none');
            setMergeFirstFeature(null);
            return;
          }
        }
      }

      // 0.3 Topology: Delete mode
      if (topologyModeRef.current === 'delete') {
        const delLayers = ['infra-line', 'infra-circle', 'poi-circle', 'service-circle'].filter(
          id => mapInstance.getLayer(id) && mapInstance.getLayoutProperty(id, 'visibility') !== 'none'
        );
        const delFeats = mapInstance.queryRenderedFeatures(e.point, { layers: delLayers });
        if (delFeats?.length) {
          const clickedFeat = delFeats[0];
          const p = clickedFeat.properties;
          const name = curLang === 'th' ? (p.name_th || p.name_en) : (p.name_en || p.name_th);
          const dsType = clickedFeat.layer.id.startsWith('service') ? 'service' : clickedFeat.layer.id.startsWith('infra') ? 'infra' : 'poi';
          const targetId = p.id || clickedFeat.id;
          if (window.confirm(`คุณต้องการลบ "${name || 'รายการนี้'}" ออกจากระบบใช่หรือไม่?`)) {
            onDeleteFeatureRef.current?.(targetId, dsType);
            alert(`🗑️ ลบ "${name || 'รายการนี้'}" เรียบร้อยแล้ว!`);
          }
          setTopologyMode('none');
          return;
        }
      }

      const allInteractiveLayers = [
        'water-fill',
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

      // 0.9 Water Body Polygon popup
      if (layerId === 'water-fill') {
        const name = curLang === 'th' ? (p.name_th || p.name_en) : (p.name_en || p.name_th);
        const desc = curLang === 'th' ? (p.description_th || p.description_en) : (p.description_en || p.description_th);
        const cat = p.category || '';
        const catMeta = WATER_CATEGORIES[cat] || { name_th: 'แหล่งน้ำ', name_en: 'Water Body', color: '#0284c7', icon: '💧' };
        const areaSqm = p.area_sqm ? Number(p.area_sqm).toLocaleString() : '-';
        const areaRai = p.area_rai || (p.area_sqm ? formatThaiArea(p.area_sqm) : '-');
        const cap = p.capacity_m3 ? Number(p.capacity_m3).toLocaleString() : '-';
        const purpose = p.purpose || '-';
        const quality = p.water_quality === 'good' ? '🟢 ดี (มาตรฐาน)' : p.water_quality === 'fair' ? '🟡 ปานกลาง' : '🔵 เฝ้าระวัง';

        popupRef.current
          .setLngLat(e.lngLat)
          .setHTML(`
            <div style="font-family:'Prompt','Inter',sans-serif;min-width:240px;">
              <div style="font-size:0.95rem;font-weight:700;border-bottom:1px solid rgba(255,255,255,0.12);padding-bottom:6px;margin-bottom:8px;display:flex;align-items:center;gap:8px;">
                <span style="font-size:1.15rem">${catMeta.icon}</span>
                <span style="color:#38bdf8;">${name || 'แหล่งน้ำ'}</span>
              </div>
              <div style="color:#0284c7;font-size:0.75rem;margin-top:-4px;margin-bottom:6px;font-weight:600;">
                ${curLang === 'th' ? catMeta.name_th : catMeta.name_en}
              </div>
              ${desc ? `<div style="font-size:0.78rem;color:#cbd5e1;line-height:1.4;margin-bottom:8px;">${desc}</div>` : ''}

              <div class="popup-body" style="margin-top:6px;font-size:0.8rem;border-top:1px solid rgba(255,255,255,0.08);padding-top:6px;">
                <div class="popup-row" style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="color:#94a3b8">📐 ขนาดพื้นที่:</span>
                  <span style="color:#38bdf8;font-weight:600">${areaRai} (${areaSqm} ตร.ม.)</span>
                </div>
                <div class="popup-row" style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="color:#94a3b8">💧 ความจุน้ำ:</span>
                  <span style="color:#06b6d4;font-weight:700">~${cap} ลบ.ม. (m³)</span>
                </div>
                <div class="popup-row" style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="color:#94a3b8">🎯 วัตถุประสงค์:</span>
                  <span style="color:#f8fafc;font-weight:500">${purpose}</span>
                </div>
                <div class="popup-row" style="display:flex;justify-content:space-between;margin-bottom:4px;">
                  <span style="color:#94a3b8">🧪 คุณภาพน้ำ:</span>
                  <span style="color:#f8fafc;font-weight:600">${quality}</span>
                </div>
              </div>

              <div style="margin-top:10px;display:flex;gap:6px;">
                <button
                  type="button"
                  id="btn-edit-popup-water"
                  style="flex:1;background:#0284c7;color:white;border:none;border-radius:6px;padding:5px 8px;font-size:0.75rem;font-weight:600;cursor:pointer;"
                >
                  ✏️ แก้ไขข้อมูล
                </button>
                <button
                  type="button"
                  id="btn-delete-popup-water"
                  style="background:rgba(239,68,68,0.2);color:#ef4444;border:1px solid #ef4444;border-radius:6px;padding:5px 8px;font-size:0.75rem;font-weight:600;cursor:pointer;"
                >
                  🗑️ ลบ
                </button>
              </div>
            </div>
          `)
          .addTo(mapInstance);

        setTimeout(() => {
          const editBtn = document.getElementById('btn-edit-popup-water');
          if (editBtn) {
            editBtn.onclick = () => {
              popupRef.current.remove();
              const origFeat = waterDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
              onEditFeatureRef.current?.(origFeat, 'water');
            };
          }
          const delBtn = document.getElementById('btn-delete-popup-water');
          if (delBtn) {
            delBtn.onclick = () => {
              if (window.confirm(`คุณต้องการลบ "${name || 'แหล่งน้ำนี้'}" ใช่หรือไม่?`)) {
                popupRef.current.remove();
                onDeleteFeatureRef.current?.(p.id || feat.id, 'water');
              }
            };
          }
        }, 50);

        return;
      }

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
            ${layerId === 'infra-line' ? `
              <div style="background:rgba(255,255,255,0.06);border-radius:6px;padding:6px 8px;margin-top:6px;font-size:0.73rem;display:flex;flex-direction:column;gap:3px">
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#94a3b8">🏗️ ผิวจราจร:</span>
                  <span style="color:#f8fafc;font-weight:600">
                    ${p.surface_type === 'concrete' ? 'คอนกรีต (คสล.)'
                      : p.surface_type === 'asphalt' ? 'แอสฟัลต์ (ลาดยาง)'
                      : p.surface_type === 'gravel' ? 'หินคลุก/ลูกรัง'
                      : p.surface_type === 'dirt' ? 'ดินธรรมชาติ'
                      : p.surface_type === 'paving_block' ? 'บล็อกตัวหนอน'
                      : 'คอนกรีต (คสล.)'}
                  </span>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#94a3b8">📊 สภาพทาง:</span>
                  <span style="color:${p.condition === 'poor' ? '#ef4444' : p.condition === 'fair' ? '#f59e0b' : p.condition === 'under_construction' ? '#ec4899' : '#22c55e'};font-weight:600">
                    ${p.condition === 'poor' ? '🔴 ชำรุด/ต้องซ่อม'
                      : p.condition === 'fair' ? '🟡 ปานกลาง'
                      : p.condition === 'under_construction' ? '🚧 อยู่ระหว่างก่อสร้าง'
                      : '🟢 ดีมาก/สมบูรณ์'}
                  </span>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#94a3b8">📐 ผิว/เขตทาง:</span>
                  <span style="color:#38bdf8">${p.width_m || 6} ม. / ${p.right_of_way_m || 8} ม. (${p.lanes || 2} เลน)</span>
                </div>
                <div style="display:flex;justify-content:space-between">
                  <span style="color:#94a3b8">📋 แผนพัฒนา:</span>
                  <span style="color:#e2e8f0">
                    ${p.plan_status === 'in_5year_plan' ? '📋 ในแผนพัฒนา 5 ปี'
                      : p.plan_status === 'budgeted' ? '💰 ได้รับงบประมาณแล้ว'
                      : p.plan_status === 'requested' ? '⏳ เสนอขอรับงบ'
                      : p.plan_status === 'no_plan' ? '⚪ ยังไม่มีแผน'
                      : '✅ ก่อสร้างแล้วเสร็จ'}
                  </span>
                </div>
              </div>
            ` : ''}
            ${layerId === 'infra-line' ? `
              <button id="btn-direct-reshape-road" style="margin-top:8px;width:100%;padding:7px 10px;border-radius:6px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;color:white;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:6px;box-shadow:0 2px 6px rgba(217,119,6,0.3)">
                🛣️ ${curLang === 'th' ? 'ดัดจุดยอดแนวถนนบนแผนที่' : 'Reshape Road on Map'}
              </button>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-top:5px">
                <button id="btn-popup-split-road" style="padding:6px 6px;border-radius:6px;background:#ef4444;border:none;color:white;font-size:0.72rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px">
                  ✂️ ${curLang === 'th' ? 'ตัดเส้นตรงนี้' : 'Split Here'}
                </button>
                <button id="btn-popup-merge-road" style="padding:6px 6px;border-radius:6px;background:#8b5cf6;border:none;color:white;font-size:0.72rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px">
                  🔗 ${curLang === 'th' ? 'ต่อรวมเส้น' : 'Merge'}
                </button>
              </div>
            ` : ''}
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:6px">
              <button id="btn-edit-popup-place" style="padding:6px 8px;border-radius:6px;background:rgba(59,130,246,0.2);border:1px solid #3b82f6;color:#60a5fa;font-size:0.75rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px">
                ✏️ ${curLang === 'th' ? 'แก้ไข' : 'Edit'}
              </button>
              <button id="btn-delete-popup-place" style="padding:6px 8px;border-radius:6px;background:rgba(239,68,68,0.2);border:1px solid #ef4444;color:#fca5a5;font-size:0.75rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:5px">
                🗑️ ${curLang === 'th' ? 'ลบทั้งเส้น/จุด' : 'Delete'}
              </button>
            </div>
          </div>
        `).addTo(mapInstance);

        setTimeout(() => {
          const reshapeBtn = document.getElementById('btn-direct-reshape-road');
          if (reshapeBtn) {
            reshapeBtn.onclick = () => {
              const originalFeat = infraDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
              startReshapingRoad(originalFeat);
              popupRef.current.remove();
            };
          }

          const splitBtn = document.getElementById('btn-popup-split-road');
          if (splitBtn) {
            splitBtn.onclick = () => {
              const originalFeat = infraDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
              const splitParts = splitLineAtPoint(originalFeat, [e.lngLat.lng, e.lngLat.lat]);
              if (splitParts && splitParts.length === 2) {
                onSplitFeatureRef.current?.(originalFeat.properties?.id || originalFeat.id, splitParts, 'infra');
                alert(`✂️ ตัดเส้นทาง "${originalFeat.properties?.name_th || 'ถนน'}" ออกเป็น 2 ตอนเรียบร้อยแล้ว!\n- ตอน 1: ${splitParts[0].properties.length_km} กม.\n- ตอน 2: ${splitParts[1].properties.length_km} กม.`);
              }
              popupRef.current.remove();
            };
          }

          const mergeBtn = document.getElementById('btn-popup-merge-road');
          if (mergeBtn) {
            mergeBtn.onclick = () => {
              const originalFeat = infraDataRef.current?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
              setMergeFirstFeature(originalFeat);
              setTopologyMode('merge');
              popupRef.current.remove();
            };
          }

          const editBtn = document.getElementById('btn-edit-popup-place');
          if (editBtn) {
            editBtn.onclick = () => {
              const dsType = layerId.startsWith('service') ? 'service' : layerId.startsWith('infra') ? 'infra' : 'poi';
              const fullDataset = dsType === 'infra' ? infraDataRef.current : dsType === 'service' ? serviceDataRef.current : poiDataRef.current;
              const originalFeat = fullDataset?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
              onEditFeatureRef.current?.(originalFeat, dsType);
              popupRef.current.remove();
            };
          }

          const delBtn = document.getElementById('btn-delete-popup-place');
          if (delBtn) {
            delBtn.onclick = () => {
              const dsType = layerId.startsWith('service') ? 'service' : layerId.startsWith('infra') ? 'infra' : 'poi';
              const targetId = p.id || feat.id;
              if (window.confirm(`คุณต้องการลบ "${name || 'รายการนี้'}" ออกจากระบบใช่หรือไม่?`)) {
                onDeleteFeatureRef.current?.(targetId, dsType);
                popupRef.current.remove();
              }
            };
          }
        }, 50);

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

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-top:8px;padding-top:6px;border-top:1px solid rgba(255,255,255,0.12)">
            <button id="btn-edit-popup-roof" style="padding:6px 8px;border-radius:6px;background:linear-gradient(135deg,#3b82f6,#2563eb);border:none;color:white;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px">
              ✏️ ${curLang === 'th' ? 'แก้ไขหลังคา' : 'Edit Roof'}
            </button>
            <button id="btn-reshape-popup-roof" style="padding:6px 8px;border-radius:6px;background:linear-gradient(135deg,#f59e0b,#d97706);border:none;color:white;font-size:0.75rem;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px">
              📐 ${curLang === 'th' ? 'ดัดรูปแปลง' : 'Reshape'}
            </button>
          </div>
          <button id="btn-delete-popup-roof" style="width:100%;margin-top:4px;padding:5px 8px;border-radius:6px;background:rgba(239,68,68,0.15);border:1px solid #ef4444;color:#fca5a5;font-size:0.72rem;font-weight:600;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:4px">
            🗑️ ${curLang === 'th' ? 'ลบผืนหลังคานี้' : 'Delete Roof'}
          </button>
        </div>
      `).addTo(mapInstance);

      setTimeout(() => {
        const editRoofBtn = document.getElementById('btn-edit-popup-roof');
        if (editRoofBtn) {
          editRoofBtn.onclick = () => {
            const fullDataset = facetsDataRef.current;
            const originalFeat = fullDataset?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
            onEditFeatureRef.current?.(originalFeat, 'solar');
            popupRef.current.remove();
          };
        }

        const reshapeRoofBtn = document.getElementById('btn-reshape-popup-roof');
        if (reshapeRoofBtn) {
          reshapeRoofBtn.onclick = () => {
            const fullDataset = facetsDataRef.current;
            const originalFeat = fullDataset?.features?.find(f => (f.properties?.id || f.id) === (p.id || feat.id)) || feat;
            startReshapingRoad(originalFeat);
            popupRef.current.remove();
          };
        }

        const deleteRoofBtn = document.getElementById('btn-delete-popup-roof');
        if (deleteRoofBtn) {
          deleteRoofBtn.onclick = () => {
            const targetId = p.id || feat.id;
            if (window.confirm(curLang === 'th' ? `คุณต้องการลบผืนหลังคานี้ (${clsName}) ออกจากระบบใช่หรือไม่?` : `Delete this roof facet (${clsName})?`)) {
              onDeleteFeatureRef.current?.(targetId, 'solar');
              popupRef.current.remove();
            }
          };
        }
      }, 50);
    });

    mapInstance.on('mousemove', (e) => {
      // 1. Live Snapping Detection
      if (snapEnabledRef.current) {
        const isEditingOrDrawing = (
          activeDrawModeRef.current !== 'none' ||
          topologyModeRef.current === 'reshape' ||
          editingRoadIdRef.current !== null ||
          isPickingLocationRef.current
        );

        if (isEditingOrDrawing) {
          const target = findSnapTarget(
            [e.lngLat.lng, e.lngLat.lat],
            mapInstance,
            infraDataRef.current,
            buildingsDataRef.current,
            24
          );

          const snapSrc = mapInstance.getSource('snap-src');
          if (target) {
            currentSnapCoordsRef.current = target.snappedCoords;
            if (snapSrc) {
              snapSrc.setData({
                type: 'FeatureCollection',
                features: [{
                  type: 'Feature',
                  geometry: { type: 'Point', coordinates: target.snappedCoords },
                  properties: { type: target.snappedType }
                }]
              });
            }
            mapInstance.getCanvas().style.cursor = 'crosshair';
            return;
          } else {
            currentSnapCoordsRef.current = null;
            if (snapSrc) {
              snapSrc.setData({ type: 'FeatureCollection', features: [] });
            }
          }
        }
      }

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
      // ไม่เปลี่ยน cursor ถ้าอยู่ใน draw mode อยู่แล้ว
      const inDrawMode = activeDrawModeRef.current !== 'none';
      if (!inDrawMode) {
        mapInstance.getCanvas().style.cursor = feats.length ? 'pointer' : '';
      }
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
          tiles: [`uav://${UAV_TILE_URL}`],
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
        'service-src': { type: 'geojson', data: serviceData || SERVICE_DATA },
        'water-src': { type: 'geojson', data: waterData || WATER_DATA },
        // ── Snap Indicator Source ────────────────────────────
        'snap-src': { type: 'geojson', data: { type: 'FeatureCollection', features: [] } }
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

        // ── 5.0 Water Bodies (Polygons) ──────────────────────
        {
          id: 'water-fill',
          type: 'fill',
          source: 'water-src',
          layout: { visibility: 'visible' },
          paint: {
            'fill-color': WATER_COLOR_MATCH,
            'fill-opacity': 0.65
          }
        },
        {
          id: 'water-line',
          type: 'line',
          source: 'water-src',
          layout: { visibility: 'visible' },
          paint: {
            'line-color': '#38bdf8',
            'line-width': 2.0,
            'line-opacity': 0.95
          }
        },
        {
          id: 'water-label',
          type: 'symbol',
          source: 'water-src',
          layout: {
            visibility: 'none',
            'text-field': ['get', 'name_th'],
            'text-font': ['Arial Unicode MS Regular'],
            'text-size': 11.5,
            'text-offset': [0, 0],
            'text-anchor': 'center',
            'text-allow-overlap': false
          },
          paint: {
            'text-color': '#bae6fd',
            'text-halo-color': '#0369a1',
            'text-halo-width': 2.5
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
            'line-width': 3.5,
            'line-opacity': 0.25
          }
        },
        {
          id: 'infra-line',
          type: 'line',
          source: 'infra-src',
          layout: { visibility: 'visible', 'line-cap': 'round', 'line-join': 'round' },
          filter: ['==', ['geometry-type'], 'LineString'],
          paint: {
            'line-color': INFRA_COLOR_MATCH,
            'line-width': [
              'match', ['get', 'category'],
              'highway',       3.5,
              'rural_road',    2.5,
              'main_road',     2.5,
              'collector_road',2.0,
              'local_road',    1.5,
              'agri_road',     1.5,
              'planned_road',  1.8,
              'rail',          2.5,
              'bridge',        2.8,
              1.8
            ],
            'line-opacity': ['match', ['get', 'category'],
              'planned_road', 0.6,
              0.85
            ]
          }
        },
        {
          id: 'infra-rail-dash',
          type: 'line',
          source: 'infra-src',
          layout: { visibility: 'visible', 'line-cap': 'butt' },
          filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'category'], 'rail']],
          paint: {
            'line-color': '#ffffff',
            'line-width': 1.2,
            'line-dasharray': [3, 3],
            'line-opacity': 0.7
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
            'text-font': ['Arial Unicode MS Regular'],
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
          type: 'symbol',
          source: 'poi-src',
          minzoom: 12,
          layout: {
            visibility: 'visible',
            'icon-image': ['coalesce',
              ['image', ['concat', 'poi-pin-', ['get', 'category']]],
              ['image', 'poi-pin-default']
            ],
            'icon-size': ['interpolate', ['linear'], ['zoom'], 12, 0.6, 15, 0.9, 18, 1.1],
            'icon-anchor': 'bottom',
            'icon-allow-overlap': false,
            'icon-ignore-placement': false,
          },
          paint: {}
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
            'text-font': ['Arial Unicode MS Regular'],
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
          layout: { visibility: 'visible', 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#444444',
            'line-width': 0.8,
            'line-opacity': 0.5,
            'line-dasharray': [6, 3, 1, 3]
          }
        },
        {
          id: 'bound-line-inner',
          type: 'line',
          source: 'bound-src',
          layout: { visibility: 'visible', 'line-cap': 'round', 'line-join': 'round' },
          paint: {
            'line-color': '#333333',
            'line-width': 0,
            'line-opacity': 0,
            'line-dasharray': [8, 4, 1, 4]
          }
        },

        // ── 11. TOPMOST: Snap Target Glowing Indicator ───────
        {
          id: 'snap-glow',
          type: 'circle',
          source: 'snap-src',
          paint: {
            'circle-radius': 16,
            'circle-color': '#06b6d4',
            'circle-opacity': 0.35,
            'circle-blur': 0.6
          }
        },
        {
          id: 'snap-ring',
          type: 'circle',
          source: 'snap-src',
          paint: {
            'circle-radius': 8.5,
            'circle-color': 'rgba(6, 182, 212, 0.25)',
            'circle-stroke-width': 2.5,
            'circle-stroke-color': '#38bdf8'
          }
        },
        {
          id: 'snap-dot',
          type: 'circle',
          source: 'snap-src',
          paint: {
            'circle-radius': 3.5,
            'circle-color': '#ffffff'
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

      // ── Custom POI Pin Icons (Canvas → MapLibre image) ────────
      // Register pin image for each POI category
      Object.entries(POI_CATEGORIES).forEach(([key, cat]) => {
        const imgId = `poi-pin-${key}`;
        if (!map.hasImage(imgId)) {
          const img = createPinImage(cat.color);
          map.addImage(imgId, img, { pixelRatio: 1 });
        }
      });

      // ── Custom POI Text Label Image (Canvas → bypass glyphs) ──
      const createLabelImage = (text, color) => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const font = "bold 13px 'Sarabun','Noto Sans Thai',sans-serif";
        ctx.font = font;
        const m = ctx.measureText(text);
        const pad = 5, h = 20;
        canvas.width  = Math.ceil(m.width) + pad * 2;
        canvas.height = h;
        ctx.font = font;
        ctx.fillStyle = 'rgba(10,15,30,0.75)';
        ctx.beginPath();
        ctx.roundRect(0, 0, canvas.width, h, 4);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, pad, h / 2);
        return {
          data: ctx.getImageData(0, 0, canvas.width, canvas.height).data,
          width: canvas.width, height: canvas.height
        };
      };

      // ── helper เรียกได้ซ้ำ ──────────────────────────────────────
      const ensurePinImages = (m) => {
        Object.entries(POI_CATEGORIES).forEach(([key, cat]) => {
          const imgId = `poi-pin-${key}`;
          if (!m.hasImage(imgId)) {
            m.addImage(imgId, createPinImage(cat.color), { pixelRatio: 1 });
          }
        });
        if (!m.hasImage('poi-pin-default')) {
          m.addImage('poi-pin-default', createPinImage('#3b82f6'), { pixelRatio: 1 });
        }
      };
      ensurePinImages(map);
      // re-register ทุกครั้งที่ style reload
      map.on('styleimagemissing', (e) => {
        if (e.id?.startsWith('poi-pin-')) {
          const key = e.id.replace('poi-pin-', '');
          const color = POI_CATEGORIES[key]?.color || '#3b82f6';
          if (!map.hasImage(e.id)) {
            map.addImage(e.id, createPinImage(color), { pixelRatio: 1 });
          }
        }
      });
      try {
        const drawInstance = new MapboxDraw({
          displayControlsDefault: false,
          controls: {
            point: false,
            line_string: false,
            polygon: false,
            trash: false
          },
          defaultMode: 'simple_select',
          styles: MAPLIBRE_DRAW_THEME
        });
        map.addControl(drawInstance, 'top-right');
        drawRef.current = drawInstance;

        map.on('draw.create', (e) => {
          updateMeasurements();
          const targetFeat = e.features?.[0];
          if (!targetFeat) return;

          const activeDs = drawingDatasetTypeRef.current || (activeTabRef.current === 'water' ? 'water' : activeTabRef.current === 'infra' ? 'infra' : activeTabRef.current === 'solar' ? 'solar' : null);

          if (activeDs === 'water' && targetFeat.geometry?.type === 'Polygon') {
            const areaM2 = turf.area(targetFeat);
            const newWaterFeat = {
              type: 'Feature',
              id: `water-${Date.now()}`,
              geometry: targetFeat.geometry,
              properties: {
                id: `water-${Date.now()}`,
                name_th: '',
                name_en: '',
                category: 'pond',
                area_sqm: Number(areaM2.toFixed(1)),
                area_rai: formatThaiArea(areaM2),
                capacity_m3: Math.round(areaM2 * 2.5),
                water_quality: 'good',
                purpose: 'อุปโภค-บริโภค / ชลประทาน',
                description_th: `แหล่งน้ำที่วาดใหม่ พื้นที่ ${formatThaiArea(areaM2)}`
              }
            };
            drawingDatasetTypeRef.current = null;
            setTimeout(() => {
              onEditFeatureRef.current?.(newWaterFeat, 'water');
            }, 100);
          } else if (activeDs === 'solar' && targetFeat.geometry?.type === 'Polygon') {
            const areaM2 = turf.area(targetFeat);
            const cap = Number(((areaM2 * 0.18) * 0.20).toFixed(2));
            const eng = Math.round(cap * 1420);
            const sav = Math.round(eng * 4.2);
            const newRoofFeat = {
              type: 'Feature',
              id: `roof-${Date.now()}`,
              geometry: targetFeat.geometry,
              properties: {
                id: `roof-${Date.now()}`,
                name_th: 'ผืนหลังคาใหม่',
                name_en: 'New Roof Facet',
                class_id: 3,
                class_name: 'S-Roof',
                color: '#3b82f6',
                area_3d: Number(areaM2.toFixed(1)),
                area_2d: Number((areaM2 * Math.cos(20 * Math.PI / 180)).toFixed(1)),
                slope_deg: 20.0,
                aspect_deg: 180.0,
                capacity_kwp: cap,
                energy_kwh: eng,
                energy_corrected_kwh: eng,
                savings_thb: sav,
                building_id: '',
                description_th: `ผืนหลังคาวาดใหม่ พื้นที่ ${areaM2.toFixed(1)} ตร.ม.`
              }
            };
            drawingDatasetTypeRef.current = null;
            setTimeout(() => {
              onEditFeatureRef.current?.(newRoofFeat, 'solar');
            }, 100);
          } else if (activeDs === 'infra' && targetFeat.geometry?.type === 'LineString') {
            const lenKm = turf.length(targetFeat, { units: 'kilometers' });
            const newRoadFeat = {
              type: 'Feature',
              id: `road-${Date.now()}`,
              geometry: targetFeat.geometry,
              properties: {
                id: `road-${Date.now()}`,
                name_th: '',
                name_en: '',
                category: 'main_road',
                surface_type: 'concrete',
                condition: 'good',
                width_m: 6.0,
                right_of_way_m: 8.0,
                lanes: 2,
                drainage: 'concrete_pipe',
                lighting: 'led',
                plan_status: 'completed',
                fiscal_year: '2567',
                length_km: Number(lenKm.toFixed(3)),
                description_th: `ถนนที่วาดใหม่ ความยาว ${lenKm.toFixed(2)} กม.`
              }
            };
            drawingDatasetTypeRef.current = null;
            setTimeout(() => {
              onEditFeatureRef.current?.(newRoadFeat, 'infra');
            }, 100);
          } else if (activeDs === 'drain' && targetFeat.geometry?.type === 'LineString') {
            const lenM = turf.length(targetFeat, { units: 'kilometers' }) * 1000;
            const newDrainFeat = {
              type: 'Feature',
              id: `drain-${Date.now()}`,
              geometry: targetFeat.geometry,
              properties: {
                id: `drain-${Date.now()}`,
                name_th: '',
                name_en: '',
                category: 'main',
                width_m: 1.0,
                depth_m: 0.5,
                material: 'คสล.',
                condition: 'ดี',
                length_m: Number(lenM.toFixed(1)),
                description_th: `คูระบายน้ำที่วาดใหม่ ความยาว ${lenM.toFixed(0)} ม.`
              }
            };
            drawingDatasetTypeRef.current = null;
            setTimeout(() => {
              onEditFeatureRef.current?.(newDrainFeat, 'drain');
            }, 100);
          } else if (activeDs === 'building_sc' && targetFeat.geometry?.type === 'Polygon') {
            const areaM2 = turf.area(targetFeat);
            const newBldgFeat = {
              type: 'Feature',
              id: `bld-${Date.now()}`,
              geometry: targetFeat.geometry,
              properties: {
                id:          `bld-${Date.now()}`,
                name_th:     '',
                category:    'residential',
                area_sqm:    Number(areaM2.toFixed(1)),
                area_usable_sqm: Number((areaM2 * 0.8).toFixed(1)),
                floors:      1,
                wall_mat:    'คสล.',
                roof_mat:    'กระเบื้อง',
                condition:   'ดี',
                tambon:      'เด่นชัย',
                amphoe:      'เด่นชัย',
                changwat:    'แพร่',
              }
            };
            drawingDatasetTypeRef.current = null;
            setTimeout(() => {
              onEditFeatureRef.current?.(newBldgFeat, 'building_sc');
            }, 100);
          }
        });
        map.on('draw.update', updateMeasurements);
        map.on('draw.delete', updateMeasurements);
        map.on('draw.selectionchange', updateMeasurements);
        map.on('draw.modechange', (e) => {
          if (e.mode === 'simple_select') {
            setActiveDrawMode('select');
          }
        });
      } catch (err) {
        console.warn('MapboxDraw init error:', err);
      }

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
      if (waterData) map.getSource('water-src')?.setData(waterData);

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

    // POI layers — แสดงตลอด
    if (map.getLayer('poi-glow'))   map.setLayoutProperty('poi-glow',   'visibility', 'visible');
    if (map.getLayer('poi-circle')) map.setLayoutProperty('poi-circle', 'visibility', 'visible');

    // Infra layers — แสดงตลอด ไม่ขึ้นกับ Tab
    if (map.getLayer('infra-line-glow'))   map.setLayoutProperty('infra-line-glow',   'visibility', 'visible');
    if (map.getLayer('infra-line'))        map.setLayoutProperty('infra-line',         'visibility', 'visible');
    if (map.getLayer('infra-circle-glow')) map.setLayoutProperty('infra-circle-glow', 'visibility', 'visible');
    if (map.getLayer('infra-circle'))      map.setLayoutProperty('infra-circle',       'visibility', 'visible');
    if (map.getLayer('infra-label'))       map.setLayoutProperty('infra-label',        'visibility', 'visible');

    // Water layers — แสดงตลอด
    if (map.getLayer('water-fill'))  map.setLayoutProperty('water-fill',  'visibility', 'visible');
    if (map.getLayer('water-line'))  map.setLayoutProperty('water-line',  'visibility', 'visible');
    if (map.getLayer('water-label')) map.setLayoutProperty('water-label', 'visibility', 'none');

    // Service layers — แสดงตลอด
    if (map.getLayer('service-glow'))   map.setLayoutProperty('service-glow',   'visibility', 'visible');
    if (map.getLayer('service-circle')) map.setLayoutProperty('service-circle', 'visibility', 'visible');
    if (map.getLayer('service-label'))  map.setLayoutProperty('service-label',  'visibility', 'visible');

    // Municipal boundary — แสดงตลอด
    if (map.getLayer('bound-fill'))       map.setLayoutProperty('bound-fill',       'visibility', 'visible');
    if (map.getLayer('bound-glow'))       map.setLayoutProperty('bound-glow',       'visibility', 'visible');
    if (map.getLayer('bound-line'))       map.setLayoutProperty('bound-line',       'visibility', 'visible');
    if (map.getLayer('bound-line-inner')) map.setLayoutProperty('bound-line-inner', 'visibility', 'visible');

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

  // ── Sync Picking Cursor ──────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    try {
      map.getCanvas().style.cursor = isPickingLocation ? 'crosshair' : '';
    } catch (_) {}
  }, [isPickingLocation]);

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

  // ── Sync POI/Infra/Service/Water data into map sources ─────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const pushData = () => {
      try {
        if (poiData && map.getSource('poi-src')) {
          map.getSource('poi-src').setData(poiData);
        }
        if (infraData && map.getSource('infra-src')) {
          map.getSource('infra-src').setData(infraData);
        }
        if (serviceData && map.getSource('service-src')) {
          map.getSource('service-src').setData(serviceData);
        }
        if (waterData && map.getSource('water-src')) {
          map.getSource('water-src').setData(waterData);
        }
      } catch (e) {
        console.warn('Map setData error:', e);
      }
    };

    if (map.getSource('poi-src')) {
      pushData();
    } else {
      map.once('load', pushData);
    }
  }, [poiData, infraData, serviceData, waterData, mapLoaded]);

  // ── POI HTML Label Markers (รองรับภาษาไทยสมบูรณ์) ──────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;

    // ลบ label เดิมทั้งหมด
    poiLabelMarkersRef.current.forEach(m => m.remove());
    poiLabelMarkersRef.current = [];

    if (!poiData?.features) return;

    const zoom = map.getZoom();
    if (zoom < 13) return; // ไม่แสดง label เมื่อ zoom ออกไกล

    poiData.features.forEach(f => {
      const coords = f.geometry?.coordinates;
      const name   = f.properties?.name_th;
      if (!coords || !name) return;

      const cat   = f.properties?.category || 'default';
      const color = POI_CATEGORIES[cat]?.color || '#3b82f6';

      const el = document.createElement('div');
      el.style.cssText = [
        'position:absolute',
        'pointer-events:none',
        'white-space:nowrap',
        `font-family:'Sarabun','Noto Sans Thai','Tahoma',sans-serif`,
        'font-size:12px',
        'font-weight:600',
        'color:#ffffff',
        'background:rgba(10,15,30,0.72)',
        'padding:2px 6px',
        'border-radius:4px',
        `border-left:3px solid ${color}`,
        'backdrop-filter:blur(2px)',
        'line-height:1.4',
        'transform:translate(14px,-28px)',
        'max-width:160px',
        'overflow:hidden',
        'text-overflow:ellipsis',
      ].join(';');
      el.textContent = name;

      const marker = new Marker({ element: el, anchor: 'left' })
        .setLngLat([coords[0], coords[1]])
        .addTo(map);

      poiLabelMarkersRef.current.push(marker);
    });

    // ซ่อน/แสดงตาม zoom
    const onZoom = () => {
      const z = map.getZoom();
      const visible = z >= 13;
      poiLabelMarkersRef.current.forEach(m => {
        m.getElement().style.display = visible ? 'block' : 'none';
      });
    };
    map.on('zoom', onZoom);
    return () => map.off('zoom', onZoom);
  }, [poiData, mapLoaded]);
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // POI filter
    if (map.getLayer('poi-circle') && poiVisible) {
      const visibleCats = Object.entries(poiVisible).filter(([,v]) => v).map(([k]) => k);
      const poiFilter = visibleCats.length === 0
        ? ['==', ['get', 'category'], '__none__']
        : ['in', ['get', 'category'], ['literal', visibleCats]];
      ['poi-glow', 'poi-circle'].forEach(id => {
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

    // Water filter — ถ้าไม่มีค่าใดใน waterVisible ให้แสดงทั้งหมด
    if (map.getLayer('water-fill')) {
      if (!waterVisible || Object.keys(waterVisible).length === 0) {
        ['water-fill', 'water-line', 'water-label'].forEach(id => {
          if (map.getLayer(id)) map.setFilter(id, null);
        });
      } else {
        const visWater = Object.entries(waterVisible).filter(([,v]) => v).map(([k]) => k);
        const waterFilter = visWater.length === 0
          ? ['==', ['get', 'category'], '__none__']
          : ['in', ['get', 'category'], ['literal', visWater]];
        ['water-fill', 'water-line', 'water-label'].forEach(id => {
          if (map.getLayer(id)) map.setFilter(id, waterFilter);
        });
      }
    }

    // Service filter — ถ้าไม่มีค่าใดให้แสดงทั้งหมด
    if (map.getLayer('service-circle')) {
      if (!serviceVisible || Object.keys(serviceVisible).length === 0) {
        ['service-glow', 'service-circle', 'service-label'].forEach(id => {
          if (map.getLayer(id)) map.setFilter(id, null);
        });
      } else {
        const visCats = Object.entries(serviceVisible).filter(([,v]) => v).map(([k]) => k);
        const svcFilter = visCats.length === 0
          ? ['==', ['get', 'category'], '__none__']
          : ['in', ['get', 'category'], ['literal', visCats]];
        ['service-glow', 'service-circle', 'service-label'].forEach(id => {
          if (map.getLayer(id)) map.setFilter(id, svcFilter);
        });
      }
    }

    map.triggerRepaint();
  }, [poiVisible, infraVisible, serviceVisible, waterVisible, mapLoaded]);

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

      {/* ── TOOLBAR: Viewer Mode vs Editor Mode ── */}
      {!isEditorMode ? (
        /* ── Viewer Mode Toolbar (Top Left: Basemap + Fit View + Measurement Tools) ── */
        <div className="map-floating-panel" style={{
          position: 'absolute', top: 14, left: 16, zIndex: 1200,
          display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px',
          background: 'rgba(13, 20, 36, 0.94)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 10,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)'
        }}>
          {[
            { key: 'uav',       icon: <Plane size={14} />,     label: lang === 'th' ? 'โดรน UAV' : 'UAV' },
            { key: 'satellite', icon: <Globe size={14} />,     label: lang === 'th' ? 'ดาวเทียม' : 'Sat' },
            { key: 'dark',      icon: <Layers size={14} />,    label: lang === 'th' ? 'มืด (GIS)' : 'Dark' },
            { key: 'osm',       icon: <Compass size={14} />,   label: 'OSM' },
            { key: 'light',     icon: <SunMedium size={14} />, label: lang === 'th' ? 'สว่าง' : 'Light' },
          ].map(({ key, icon, label }) => (
            <button
              key={key}
              type="button"
              className={`basemap-btn ${currentBasemap === key ? 'active' : ''}`}
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
            onClick={(e) => {
              e.preventDefault();
              zoomToRooftops();
            }}
            style={{ borderLeft: '1px solid rgba(255,255,255,0.18)', marginLeft: 4, paddingLeft: 8 }}
            title={lang === 'th' ? 'ซูมขอบเขตเด่นชัย' : 'Fit to Denchai'}
          >
            <Focus size={14} color="#38bdf8" /> {lang === 'th' ? 'ซูมขอบเขต' : 'Fit'}
          </button>

          {/* Viewer Measurement Tools */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: '1px solid rgba(255,255,255,0.2)', marginLeft: 4, paddingLeft: 8 }}>
            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'line' ? 'active' : ''}`}
              onClick={() => {
                setDrawMode(activeDrawMode === 'line' ? 'none' : 'line');
              }}
              title={lang === 'th' ? 'วัดระยะทาง (คลิกจุดบนแผนที่เพื่อคำนวณความยาว)' : 'Measure Distance'}
              style={{ color: activeDrawMode === 'line' ? '#ffffff' : '#38bdf8', fontWeight: 600 }}
            >
              <Ruler size={13} /> {lang === 'th' ? 'วัดระยะ' : 'Distance'}
            </button>
            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'polygon' ? 'active' : ''}`}
              onClick={() => {
                setDrawMode(activeDrawMode === 'polygon' ? 'none' : 'polygon');
              }}
              title={lang === 'th' ? 'วัดพื้นที่ (คลิกตีกรอบรูปแปลงเพื่อคำนวณ ตร.ม. และไร่)' : 'Measure Area'}
              style={{ color: activeDrawMode === 'polygon' ? '#ffffff' : '#4ade80', fontWeight: 600 }}
            >
              <Square size={13} /> {lang === 'th' ? 'วัดพื้นที่' : 'Area'}
            </button>
            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'bearing' ? 'active' : ''}`}
              onClick={() => {
                if (activeDrawMode === 'bearing') {
                  setDrawMode('none');
                } else {
                  setDrawMode('line');
                  setActiveDrawMode('bearing');
                }
              }}
              title={lang === 'th' ? 'วัดทิศทางและมุมองศา (Azimuth / Bearing)' : 'Measure Bearing / Angle'}
              style={{ color: activeDrawMode === 'bearing' ? '#ffffff' : '#f59e0b', fontWeight: 600 }}
            >
              <Compass size={13} /> {lang === 'th' ? 'วัดมุม/ทิศ' : 'Bearing'}
            </button>
          </div>
        </div>
      ) : (
        /* ── Editor Studio Toolbars (Top Left Basemap + Top Right Digitizing Toolbar) ── */
        <>
          {/* Basemap Switcher (Top Left in Editor Mode) */}
          <div className="map-floating-panel" style={{
            position: 'absolute', top: 14, left: 16, zIndex: 1200,
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px',
            background: 'rgba(13, 20, 36, 0.94)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8
          }}>
            {[
              { key: 'uav',       icon: <Plane size={14} />,     label: 'UAV' },
              { key: 'satellite', icon: <Globe size={14} />,     label: 'Sat' },
              { key: 'dark',      icon: <Layers size={14} />,    label: 'Dark' },
              { key: 'osm',       icon: <Compass size={14} />,   label: 'OSM' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                type="button"
                className={`basemap-btn ${currentBasemap === key ? 'active' : ''}`}
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
              onClick={(e) => {
                e.preventDefault();
                zoomToRooftops();
              }}
              style={{ borderLeft: '1px solid rgba(255,255,255,0.18)', marginLeft: 4, paddingLeft: 6 }}
              title={lang === 'th' ? 'ซูมขอบเขตเด่นชัย' : 'Fit to Denchai'}
            >
              <Focus size={14} color="#38bdf8" />
            </button>
          </div>

          {/* Full Digitizing & Topology Toolkit (Top Right in Editor Mode) */}
          <div className="map-floating-panel" style={{
            position: 'absolute', top: 14, right: 16, zIndex: 1500,
            display: 'flex', alignItems: 'center', gap: 4, padding: '4px 6px',
            background: 'rgba(13, 20, 36, 0.94)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: 8
          }}>
            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'point' ? 'active' : ''}`}
              onClick={() => {
                setDrawMode(activeDrawMode === 'point' ? 'none' : 'point');
                setTopologyMode('none');
              }}
              title={lang === 'th' ? 'วาด/ปักหมุดจุดพิกัด (Point)' : 'Draw Point'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <MapPin size={13} color={activeDrawMode === 'point' ? '#fff' : '#38bdf8'} /> {lang === 'th' ? 'จุด' : 'Point'}
            </button>

            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'line' ? 'active' : ''}`}
              onClick={() => {
                setDrawMode(activeDrawMode === 'line' ? 'none' : 'line');
                setTopologyMode('none');
              }}
              title={lang === 'th' ? 'วาดเส้น / วัดระยะทาง (LineString)' : 'Draw Line / Measure'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <Activity size={13} color={activeDrawMode === 'line' ? '#fff' : '#f59e0b'} /> {lang === 'th' ? 'เส้น' : 'Line'}
            </button>

            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'polygon' ? 'active' : ''}`}
              onClick={() => {
                setDrawMode(activeDrawMode === 'polygon' ? 'none' : 'polygon');
                setTopologyMode('none');
              }}
              title={lang === 'th' ? 'วาดพื้นที่แบบอิสระ (Polygon)' : 'Draw Polygon (freeform)'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <Square size={13} color={activeDrawMode === 'polygon' ? '#fff' : '#10b981'} /> {lang === 'th' ? 'พื้นที่' : 'Polygon'}
            </button>

            {/* ── Rectangle Polygon ── */}
            <button
              type="button"
              className={`basemap-btn ${activeDrawMode === 'rectangle' ? 'active' : ''}`}
              onClick={() => {
                if (activeDrawMode === 'rectangle') {
                  setDrawMode('none');
                } else {
                  setActiveDrawMode('rectangle');
                  setTopologyMode('none');
                  const map = mapRef.current;
                  if (map) map.getCanvas().style.cursor = 'crosshair';
                }
              }}
              title={lang === 'th' ? 'วาดสี่เหลี่ยม (Rectangle) — คลิกจุดแรก ลากไปจุดที่สอง' : 'Draw Rectangle'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <i className="ti ti-rectangle" style={{ fontSize:13, color: activeDrawMode === 'rectangle' ? '#fff' : '#a78bfa' }} aria-hidden="true" /> {lang === 'th' ? 'สี่เหลี่ยม' : 'Rect'}
            </button>

            <button
              type="button"
              className={`basemap-btn ${topologyMode === 'reshape' || editingRoadId ? 'active' : ''}`}
              onClick={() => {
                if (editingRoadId) {
                  drawRef.current?.deleteAll();
                  setEditingRoadId(null);
                  setEditingRoadName('');
                  setActiveDrawMode('none');
                  onFinishReshaping?.();
                }
                setTopologyMode(topologyMode === 'reshape' ? 'none' : 'reshape');
                setMergeFirstFeature(null);
                setDrawMode('none');
              }}
              title={lang === 'th' ? 'ดัดจุดยอดแนวเส้นทาง (Reshape Line)' : 'Reshape Line'}
              style={{
                padding: '6px 10px', fontSize: '0.74rem', fontWeight: 700,
                borderLeft: '1px solid rgba(255,255,255,0.2)', marginLeft: 2, paddingLeft: 8,
                color: topologyMode === 'reshape' || editingRoadId ? '#fff' : '#38bdf8',
                background: topologyMode === 'reshape' || editingRoadId ? '#0284c7' : 'rgba(56, 189, 248, 0.12)',
                borderRadius: 6
              }}
            >
              <Pencil size={13} color={topologyMode === 'reshape' || editingRoadId ? '#fff' : '#38bdf8'} />
              <span>{lang === 'th' ? 'ดัดเส้น' : 'Reshape'}</span>
            </button>

            <button
              type="button"
              className={`basemap-btn ${topologyMode === 'split' ? 'active' : ''}`}
              onClick={() => {
                setTopologyMode(topologyMode === 'split' ? 'none' : 'split');
                setMergeFirstFeature(null);
                setDrawMode('none');
              }}
              title={lang === 'th' ? 'ตัดเส้นทางออกเป็น 2 ตอน (Split Line)' : 'Split Line'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <Scissors size={13} color={topologyMode === 'split' ? '#fff' : '#ef4444'} /> {lang === 'th' ? 'ตัดเส้น' : 'Split'}
            </button>

            <button
              type="button"
              className={`basemap-btn ${topologyMode === 'merge' ? 'active' : ''}`}
              onClick={() => {
                setTopologyMode(topologyMode === 'merge' ? 'none' : 'merge');
                setMergeFirstFeature(null);
                setDrawMode('none');
              }}
              title={lang === 'th' ? 'ต่อรวมเส้นทาง 2 เส้นเข้าด้วยกัน (Merge Lines)' : 'Merge Lines'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <GitMerge size={13} color={topologyMode === 'merge' ? '#fff' : '#a855f7'} /> {lang === 'th' ? 'ต่อเส้น' : 'Merge'}
            </button>

            <button
              type="button"
              className={`basemap-btn ${topologyMode === 'delete' ? 'active' : ''}`}
              onClick={() => {
                setTopologyMode(topologyMode === 'delete' ? 'none' : 'delete');
                setMergeFirstFeature(null);
                setDrawMode('none');
              }}
              title={lang === 'th' ? 'ลบเส้นทางหรือสถานที่บนแผนที่' : 'Delete Feature'}
              style={{ padding: '6px 9px', fontSize: '0.72rem' }}
            >
              <Trash2 size={13} color={topologyMode === 'delete' ? '#fff' : '#f87171'} /> {lang === 'th' ? 'ลบเส้น' : 'Delete'}
            </button>

            <button
              type="button"
              className={`basemap-btn ${snapEnabled ? 'active' : ''}`}
              onClick={() => setSnapEnabled(!snapEnabled)}
              title={lang === 'th' ? `ระบบดูดจุดยอดอัตโนมัติ (Snapping): ${snapEnabled ? 'เปิดอยู่' : 'ปิดอยู่'}` : `Snap: ${snapEnabled ? 'ON' : 'OFF'}`}
              style={{
                padding: '6px 9px', fontSize: '0.72rem',
                borderLeft: '1px solid rgba(255,255,255,0.2)', marginLeft: 2, paddingLeft: 8,
                color: snapEnabled ? '#10b981' : '#94a3b8',
                background: snapEnabled ? 'rgba(16, 185, 129, 0.15)' : 'transparent',
                display: 'flex', alignItems: 'center', gap: 4
              }}
            >
              <Magnet size={13} color={snapEnabled ? '#10b981' : '#94a3b8'} />
              <span style={{ fontWeight: 600 }}>{snapEnabled ? '🧲 Snap' : 'Snap ปิด'}</span>
            </button>
          </div>
        </>
      )}

      {/* ── Real-time Measurement HUD Card ── */}
      {measureInfo && (
        <div style={{
          position: 'absolute', top: isEditorMode ? 62 : 62, right: 16, zIndex: 1400,
          background: 'rgba(13, 20, 36, 0.95)', backdropFilter: 'blur(16px)',
          border: '1px solid rgba(56, 189, 248, 0.4)', borderRadius: 12,
          padding: '12px 16px', color: 'white', minWidth: 260, maxWidth: 330,
          boxShadow: '0 12px 30px rgba(0, 0, 0, 0.5)', animation: 'slideDown 0.2s ease-out'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 6 }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
              {measureInfo.type === 'line'
                ? (activeDrawMode === 'bearing' ? '🧭 ผลการวัดมุมและทิศทาง (Azimuth)' : '📏 ผลการวัดระยะทาง (Distance)')
                : measureInfo.type === 'polygon' ? '📐 ผลการคำนวณพื้นที่ (Area)'
                : '📍 พิกัดจุด (Point)'}
            </span>
            <button
              type="button"
              onClick={() => {
                setMeasureInfo(null);
                drawRef.current?.deleteAll();
                setActiveDrawMode('none');
              }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: 2 }}
              title="ล้างการวัด"
            >
              <X size={14} />
            </button>
          </div>

          {measureInfo.type === 'line' && (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ระยะทางรวม:</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 800, color: '#38bdf8' }}>
                {measureInfo.lengthKm} <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>กม.</span>
                <span style={{ fontSize: '0.74rem', fontWeight: 400, color: '#cbd5e1', marginLeft: 6 }}>({measureInfo.lengthM} ม.)</span>
              </div>

              {measureInfo.bearing && (
                <div style={{ marginTop: 8, padding: '6px 10px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                  <div style={{ fontSize: '0.68rem', color: '#fcd34d' }}>🧭 ทิศทางและมุมองศา (Bearing):</div>
                  <div style={{ fontSize: '0.92rem', fontWeight: 700, color: '#fbbf24', marginTop: 2 }}>
                    {measureInfo.bearing.angle}° {measureInfo.bearing.dirText}
                  </div>
                </div>
              )}

              {/* Only show Add/Save buttons if in isEditorMode */}
              {isEditorMode && onEditFeature && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', marginTop: 10, padding: '7px 10px', fontSize: '0.76rem', justifyContent: 'center' }}
                  onClick={() => {
                    const newRoadFeat = {
                      type: 'Feature',
                      id: `road-${Date.now()}`,
                      geometry: measureInfo.feature.geometry,
                      properties: {
                        id: `road-${Date.now()}`,
                        name_th: '',
                        name_en: '',
                        category: 'main_road',
                        description_th: `ถนนที่วาดใหม่ ความยาว ${measureInfo.lengthKm} กม.`,
                        length_km: Number(measureInfo.lengthKm)
                      }
                    };
                    onEditFeature(newRoadFeat, 'infra');
                  }}
                >
                  + บันทึกเป็นถนนเส้นทางใหม่
                </button>
              )}
            </div>
          )}

          {measureInfo.type === 'polygon' && (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>ขนาดพื้นที่รวม:</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#4ade80' }}>
                {measureInfo.areaSqm} <span style={{ fontSize: '0.78rem', fontWeight: 500 }}>ตร.ม.</span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: 2 }}>
                {measureInfo.thaiArea}
              </div>

              {/* Only show Add/Save buttons if in isEditorMode */}
              {isEditorMode && onEditFeature && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: '0.76rem',
                      fontWeight: 700, justifyContent: 'center',
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      border: 'none', boxShadow: '0 2px 8px rgba(245,158,11,0.4)'
                    }}
                    onClick={() => {
                      const areaM2 = Number(measureInfo.areaSqm) || turf.area(measureInfo.feature);
                      const cap = Number(((areaM2 * 0.18) * 0.20).toFixed(2));
                      const eng = Math.round(cap * 1420);
                      const sav = Math.round(eng * 4.2);
                      const newRoofFeat = {
                        type: 'Feature',
                        id: `roof-${Date.now()}`,
                        geometry: measureInfo.feature.geometry,
                        properties: {
                          id: `roof-${Date.now()}`,
                          name_th: 'ผืนหลังคาใหม่',
                          name_en: 'New Roof Facet',
                          class_id: 3,
                          class_name: 'S-Roof',
                          color: '#3b82f6',
                          area_3d: Number(areaM2.toFixed(1)),
                          area_2d: Number((areaM2 * Math.cos(20 * Math.PI / 180)).toFixed(1)),
                          slope_deg: 20.0,
                          aspect_deg: 180.0,
                          capacity_kwp: cap,
                          energy_kwh: eng,
                          energy_corrected_kwh: eng,
                          savings_thb: sav,
                          building_id: '',
                          description_th: `ผืนหลังคาวาดใหม่ พื้นที่ ${areaM2.toFixed(1)} ตร.ม.`
                        }
                      };
                      onEditFeature(newRoofFeat, 'solar');
                    }}
                  >
                    ☀️ + บันทึกและกำหนดคุณสมบัติหลังคาโซลาร์
                  </button>

                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{
                      width: '100%', padding: '7px 10px', fontSize: '0.76rem',
                      fontWeight: 700, justifyContent: 'center',
                      background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                      border: 'none'
                    }}
                    onClick={() => {
                      const areaM2 = Number(measureInfo.areaSqm) || turf.area(measureInfo.feature);
                      const newWaterFeat = {
                        type: 'Feature',
                        id: `water-${Date.now()}`,
                        geometry: measureInfo.feature.geometry,
                        properties: {
                          id: `water-${Date.now()}`,
                          name_th: '',
                          name_en: '',
                          category: 'pond',
                          area_sqm: Number(areaM2.toFixed(1)),
                          area_rai: formatThaiArea(areaM2),
                          capacity_m3: Math.round(areaM2 * 2.5),
                          water_quality: 'good',
                          purpose: 'อุปโภค-บริโภค / ชลประทาน',
                          description_th: `แหล่งน้ำที่วาดใหม่ พื้นที่ ${formatThaiArea(areaM2)}`
                        }
                      };
                      onEditFeature(newWaterFeat, 'water');
                    }}
                  >
                    💧 + บันทึกและกำหนดคุณสมบัติแหล่งน้ำ
                  </button>
                </div>
              )}
            </div>
          )}

          {measureInfo.type === 'point' && (
            <div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>พิกัดภูมิศาสตร์ (Lon, Lat):</div>
              <div style={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#fcd34d', margin: '4px 0 8px' }}>
                {measureInfo.coords[0].toFixed(6)}, {measureInfo.coords[1].toFixed(6)}
              </div>
              {isEditorMode && onAddFeature && (
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.74rem', justifyContent: 'center' }}
                  onClick={() => {
                    onAddFeature(activeTab === 'service' ? 'service' : 'poi');
                  }}
                >
                  + บันทึกเป็นสถานที่สำคัญ
                </button>
              )}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
            <button
              type="button"
              className="btn btn-sm"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.68rem', padding: '4px 6px' }}
              onClick={handleExportDrawn}
            >
              <Download size={11} /> ส่งออก GeoJSON
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{ flex: 1, justifyContent: 'center', fontSize: '0.68rem', padding: '4px 6px', color: '#f87171' }}
              onClick={handleClearAll}
            >
              <Trash2 size={11} /> ล้างการวัด
            </button>
          </div>
        </div>
      )}

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
              <div style={{ width: 28, height: 3, borderTop: '2px dashed #555555' }} />
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
              <div style={{ width: 28, height: 3, borderTop: '2px dashed #555555' }} />
              <span style={{ color: '#94a3b8' }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
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
              <div style={{ width: 28, height: 3, borderTop: '2px dashed #555555' }} />
              <span style={{ color: '#94a3b8' }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
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
              <div style={{ width: 28, height: 3, borderTop: '2px dashed #555555' }} />
              <span style={{ color: '#94a3b8' }}>{lang === 'th' ? 'ขอบเขตเทศบาลเด่นชัย' : 'Denchai Boundary'}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
