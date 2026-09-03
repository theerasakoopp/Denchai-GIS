import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapViewer from '../components/MapViewer';
import FeatureEditModal from '../components/FeatureEditModal';
import { POI_DATA, POI_CATEGORIES } from '../data/poi_data';
import { INFRA_DATA, INFRA_CATEGORIES } from '../data/infra_data';
import { SERVICE_DATA, SERVICE_CATEGORIES } from '../data/service_data';
import { WATER_DATA, WATER_CATEGORIES } from '../data/water_data';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import {
  ArrowLeft, MapPin, Building2, Waves, HeartPulse, SunMedium,
  Search, X, Download, RotateCcw, Trash2, Edit3, FolderDown,
  PenTool, PlusCircle, CheckCircle2, FileSpreadsheet, Layers,
  Database, Upload, HelpCircle, HardDrive
} from 'lucide-react';
import shp from 'shpjs';

// Inline GitHub AutoSave (no separate import needed)
function GitHubAutoSave({ lang }) {
  const [token, setToken] = useState(() => localStorage.getItem('denchai_github_token') || '');
  const [status, setStatus] = useState('');
  const saveToken = () => {
    localStorage.setItem('denchai_github_token', token);
    setStatus(lang === 'th' ? 'บันทึก Token แล้ว' : 'Token saved');
    setTimeout(() => setStatus(''), 2000);
  };
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      <div style={{ fontSize:9, fontWeight:700, color:'rgba(248,113,113,0.6)',
        textTransform:'uppercase', letterSpacing:'.06em', display:'flex', alignItems:'center', gap:5 }}>
        <i className="ti ti-brand-github" style={{ fontSize:11 }} /> GitHub Auto-Save
      </div>
      <div style={{ display:'flex', gap:5 }}>
        <input type="password" value={token} onChange={e => setToken(e.target.value)}
          placeholder="ghp_..." style={{ flex:1, padding:'5px 8px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)',
            background:'rgba(255,255,255,0.05)', color:'#e2e8f0', fontSize:11, fontFamily:'inherit', outline:'none' }} />
        <button onClick={saveToken} style={{ padding:'5px 10px', borderRadius:6, border:'1px solid rgba(248,113,113,0.3)',
          background:'rgba(248,113,113,0.1)', color:'#f87171', fontSize:11, cursor:'pointer', fontFamily:'inherit' }}>
          {status || (lang === 'th' ? 'บันทึก' : 'Save')}
        </button>
      </div>
    </div>
  );
}

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

// ── GIS Templates List (16 Layers + CSV Data Dictionary) ──
const GIS_TEMPLATES = [
  { id: 'buildings', name_th: '1. อาคารและสิ่งปลูกสร้าง (Buildings)', geom: 'Polygon', icon: '🏢', file: 'template_buildings.geojson', desc: 'เลขที่บ้าน, ชนิดอาคาร, จำนวนชั้น, โครงสร้าง, พื้นที่หลังคา', fields: 14 },
  { id: 'streetlights', name_th: '2. เสาไฟฟ้าและโคมไฟส่องสว่าง (Streetlights)', geom: 'Point', icon: '💡', file: 'template_streetlights.geojson', desc: 'รหัสเสา, หลอด LED/โซลาร์เซลล์, กำลังวัตต์, สถานะติด/ดับ', fields: 13 },
  { id: 'power_grid', name_th: '3. หม้อแปลงและแนวสายส่งไฟฟ้า (Power Grid)', geom: 'Point / LineString', icon: '⚡', file: 'template_power_grid.geojson', desc: 'หม้อแปลง kVA, สายส่งแรงสูง 22kV, โหลดไฟฟ้า, พิกัดรองรับ Solar', fields: 12 },
  { id: 'drainage', name_th: '4. ระบบระบายน้ำและบ่อพัก (Drainage System)', geom: 'LineString / Point', icon: '🌊', file: 'template_drainage_system.geojson', desc: 'รางยู คสล., ท่อกลม, ขนาดความกว้าง, ทิศทางการไหล, บ่อพัก', fields: 13 },
  { id: 'water_supply', name_th: '5. ระบบท่อประปาและหัวดับเพลิง (Water Supply)', geom: 'Point / LineString', icon: '🚒', file: 'template_water_supply_hydrants.geojson', desc: 'หัวดับเพลิง (รัศมี 150ม.), แรงดันน้ำ, ท่อเมน HDPE/PVC', fields: 11 },
  { id: 'cctv_safety', name_th: '6. กล้อง CCTV และจุดเสี่ยงจราจร (CCTV & Safety)', geom: 'Point', icon: '📹', file: 'template_cctv_traffic_safety.geojson', desc: 'กล้อง AI อ่านป้ายทะเบียน, มุมมอง FOV, จุดเสี่ยงอุบัติเหตุ', fields: 12 },
  { id: 'hazard_evacuation', name_th: '7. พื้นที่เสี่ยงภัยและศูนย์อพยพ (Hazard & Evacuation)', geom: 'Polygon / Point', icon: '🚨', file: 'template_hazard_evacuation.geojson', desc: 'พื้นที่น้ำท่วมซ้ำซากริมแม่น้ำยม, ศูนย์พักพิงชั่วคราว, ความจุคน', fields: 10 },
  { id: 'waste_management', name_th: '8. การจัดการขยะและสายเดินรถ (Waste Management)', geom: 'Point / LineString', icon: '🗑️', file: 'template_waste_management.geojson', desc: 'จุดตั้งถังขยะ 4 ประเภท, สายเดินรถเก็บขยะ, รอบเวลาเก็บ', fields: 8 },
  { id: 'vulnerable_citizens', name_th: '9. พิกัดบ้านกลุ่มเปราะบาง (Vulnerable Citizens)', geom: 'Point', icon: '♿', file: 'template_vulnerable_citizens.geojson', desc: 'ผู้ป่วยติดเตียง, ผู้พิการ, เครื่องผลิตออกซิเจน, ลำดับการอพยพ', fields: 9 },
  { id: 'community_boundaries', name_th: '10. ขอบเขตชุมชนและหมู่บ้าน (Community Boundaries)', geom: 'Polygon', icon: '🏘️', file: 'template_community_boundaries.geojson', desc: 'ขอบเขต ม.1 ถึง ม.N, ผู้นำชุมชน, ประชากร, จำนวนครัวเรือน', fields: 8 },
  { id: 'poi', name_th: '11. สถานที่สำคัญและสถานที่ราชการ (POI)', geom: 'Point', icon: '📍', file: 'template_poi.geojson', desc: 'โรงพยาบาล, คลินิก, โรงเรียน, วัด, ตลาด, สถานีรถไฟ, ธนาคาร', fields: 7 },
  { id: 'roads_transport', name_th: '12. โครงข่ายถนนและคมนาคม (Roads & Transport)', geom: 'LineString', icon: '🛣️', file: 'template_roads_transport.geojson', desc: 'ทางหลวง 101/11, สายประธาน, ถนนซอย, สภาพผิวทาง, ปีงบประมาณ', fields: 11 },
  { id: 'water_bodies', name_th: '13. แหล่งน้ำผิวดินและแก้มลิง (Water Bodies)', geom: 'Polygon', icon: '💧', file: 'template_water_bodies.geojson', desc: 'แม่น้ำยม, ห้วยแม่พวก, อ่างเก็บน้ำ, สระแก้มลิง, สระประปา', fields: 7 },
  { id: 'public_services', name_th: '14. ศูนย์บริการประชาชนและหน่วยงาน (Public Services)', geom: 'Point', icon: '🏛️', file: 'template_public_services.geojson', desc: 'สถานีตำรวจ, งานดับเพลิงกู้ภัย, ไปรษณีย์, บริการสาธารณสุข', fields: 6 },
  { id: 'solar_rooftops', name_th: '15. ศักยภาพโซลาร์เซลล์บนหลังคา (Solar Rooftops)', geom: 'Polygon', icon: '☀️', file: 'template_solar_rooftops.geojson', desc: 'Class 1-7, Slope, Aspect, กำลังผลิต kWp, ประหยัดบาท/ปี, คืนทุน', fields: 13 },
  { id: 'municipal_boundary', name_th: '16. ขอบเขตการปกครองเทศบาล (Municipal Boundary)', geom: 'Polygon', icon: '🗺️', file: 'template_municipal_boundary.geojson', desc: 'แนวเขตเทศบาลตำบลเด่นชัย, ประชากร, ครัวเรือน, พื้นที่ ตร.กม.', fields: 8 }
];

function triggerTemplateDownload(filename) {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const fileUrl = `${cleanBase}templates/${filename}`;

  const link = document.createElement('a');
  link.href = fileUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Helper: fetch with fallback paths
async function fetchWithFallback(filename) {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : base + '/';
  const paths = [
    `${cleanBase}${filename}`,
    `./${filename}`,
    `./public/${filename}`,
    `/${filename}`
  ];

  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (res.ok) return await res.json();
    } catch (e) {}
  }
  throw new Error(`Failed to load ${filename}`);
}

export default function EditorPage({ lang = 'th', setLang, tariff = 4.20, setTariff, systemCostPerKwp = 28000, setSystemCostPerKwp }) {
  const t = translations[lang] || translations.th;
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // ── Layer State ──
  const [activeLayer, setActiveLayer] = useState('poi'); // 'poi' | 'infra' | 'water' | 'service' | 'solar'
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);

  // ── GIS Datasets from LocalStorage ──
  const [poiData, setPoiData] = useState(() => {
    try {
      const s = localStorage.getItem('denchai_poi_data');
      return s ? JSON.parse(s) : POI_DATA;
    } catch { return POI_DATA; }
  });

  const [infraData, setInfraData] = useState(() => {
    try {
      const s = localStorage.getItem('denchai_infra_data');
      if (s) {
        const p = JSON.parse(s);
        if (p?.features) return p;
      }
    } catch {}
    return INFRA_DATA;
  });

  const [serviceData, setServiceData] = useState(() => {
    try {
      const s = localStorage.getItem('denchai_service_data');
      return s ? JSON.parse(s) : SERVICE_DATA;
    } catch { return SERVICE_DATA; }
  });

  const [waterData, setWaterData] = useState(() => {
    try {
      const s = localStorage.getItem('denchai_water_data');
      return s ? JSON.parse(s) : WATER_DATA;
    } catch { return WATER_DATA; }
  });

  const [geoDataFacets, setGeoDataFacets] = useState(null);
  const [geoDataBuildings, setGeoDataBuildings] = useState(null);
  const [municipalBoundary, setMunicipalBoundary] = useState(null);

  // ── Editor & Modal State ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editDatasetType, setEditDatasetType] = useState('poi');
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState(null);
  const [reshapingFeature, setReshapingFeature] = useState(null);
  const [triggerDrawRoad,     setTriggerDrawRoad]     = useState(false);
  const [triggerDrawDrain,    setTriggerDrawDrain]    = useState(false);
  const [triggerDrawBuilding, setTriggerDrawBuilding] = useState(false);
  const [triggerDrawWater,    setTriggerDrawWater]    = useState(false);
  const [triggerDrawRoof,     setTriggerDrawRoof]     = useState(false);
  const [expandedCats,        setExpandedCats]        = useState({});

  const downloadCSVTemplate = (layerKey) => {
    const templates = {
      poi: 'template_poi.csv', infra: 'template_infra.csv',
      water: 'template_water.csv', service: 'template_service.csv',
      building_sc: 'template_building_sc.csv', drain: 'template_drain.csv',
    };
    const filename = templates[layerKey] || 'template_poi.csv';
    const link = document.createElement('a');
    link.href = `${import.meta.env.BASE_URL || '/'}${filename}`;
    link.download = filename;
    link.click();
  };
  const [selectedFeature, setSelectedFeature] = useState(null);

  // ── Load background layers ──
  useEffect(() => {
    const savedFacets = localStorage.getItem('denchai_rooftop_facets');
    if (savedFacets) {
      try {
        const p = JSON.parse(savedFacets);
        if (p?.features) setGeoDataFacets(p);
      } catch {}
    } else {
      fetchWithFallback('rooftop_facets.geojson').then(setGeoDataFacets).catch(() => {});
    }
    fetchWithFallback('buildings.geojson').then(setGeoDataBuildings).catch(() => {});
    fetchWithFallback('boundary.geojson').then(setMunicipalBoundary).catch(() => {});
  }, []);

  // ── Current Dataset Context ──
  const currentDataset = useMemo(() => {
    switch (activeLayer) {
      case 'poi':     return { type: 'poi',     name: lang === 'th' ? 'สถานที่สำคัญ (POI)' : 'Points of Interest', data: poiData, categories: POI_CATEGORIES, icon: '📍' };
      case 'infra':   return { type: 'infra',   name: lang === 'th' ? 'โครงข่ายถนน/คมนาคม' : 'Roads & Infrastructure', data: infraData, categories: INFRA_CATEGORIES, icon: '🛣️' };
      case 'water':   return { type: 'water',   name: lang === 'th' ? 'แหล่งน้ำ (Polygon)' : 'Water Bodies', data: waterData, categories: WATER_CATEGORIES, icon: '💧' };
      case 'service': return { type: 'service', name: lang === 'th' ? 'บริการสาธารณะ' : 'Public Services', data: serviceData, categories: SERVICE_CATEGORIES, icon: '🏥' };
      case 'solar':   return { type: 'solar',   name: lang === 'th' ? 'ผืนหลังคาโซลาร์ (Facets)' : 'Solar Rooftops', data: geoDataFacets, categories: ROOF_CLASSES, icon: '☀️' };
      default:        return { type: 'poi',     name: 'POI', data: poiData, categories: POI_CATEGORIES, icon: '📍' };
    }
  }, [activeLayer, poiData, infraData, serviceData, waterData, geoDataFacets, lang]);

  // Filtered items
  const items = useMemo(() => {
    if (!currentDataset.data?.features) return [];
    const term = searchTerm.trim().toLowerCase();
    if (!term) return currentDataset.data.features;

    return currentDataset.data.features.filter(f => {
      const p = f.properties || {};
      const nameTh = (p.name_th || p.name || p.building_name || '').toLowerCase();
      const nameEn = (p.name_en || '').toLowerCase();
      const desc = (p.description_th || p.notes || '').toLowerCase();
      const id = String(p.id || p.building_id || '').toLowerCase();
      return nameTh.includes(term) || nameEn.includes(term) || desc.includes(term) || id.includes(term);
    });
  }, [currentDataset, searchTerm]);

  // ── CRUD Handlers ──
  const handleOpenAdd = (datasetType = activeLayer) => {
    setEditDatasetType(datasetType);
    setEditingFeature(null);
    setPickedCoordinates(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (feature, datasetType = activeLayer) => {
    setEditDatasetType(datasetType);
    setEditingFeature(feature);
    setPickedCoordinates(feature.geometry?.coordinates || null);
    setIsEditModalOpen(true);
  };

  const handleSaveFeature = (savedFeature, datasetType = activeLayer) => {
    const targetId = savedFeature.properties?.id || savedFeature.id;

    const updater = (prevData, storageKey) => {
      if (!prevData?.features) return prevData;
      const exists = prevData.features.some(f => (f.properties?.id || f.id) === targetId);
      let updatedFeatures;
      if (exists) {
        updatedFeatures = prevData.features.map(f =>
          (f.properties?.id || f.id) === targetId ? savedFeature : f
        );
      } else {
        updatedFeatures = [savedFeature, ...prevData.features];
      }
      const newCollection = { ...prevData, features: updatedFeatures };
      try { localStorage.setItem(storageKey, JSON.stringify(newCollection)); } catch {}
      return newCollection;
    };

    if (datasetType === 'poi') setPoiData(prev => updater(prev, 'denchai_poi_data'));
    else if (datasetType === 'infra') setInfraData(prev => updater(prev, 'denchai_infra_data'));
    else if (datasetType === 'service') setServiceData(prev => updater(prev, 'denchai_service_data'));
    else if (datasetType === 'water') setWaterData(prev => updater(prev, 'denchai_water_data'));
    else if (datasetType === 'solar') setGeoDataFacets(prev => updater(prev, 'denchai_rooftop_facets'));

    setIsEditModalOpen(false);
    setSelectedFeature(savedFeature);
  };

  const handleDeleteFeature = (featureToDelete, datasetType = activeLayer) => {
    const targetId = featureToDelete?.properties?.id || featureToDelete?.id;
    if (!targetId) return;

    if (!window.confirm(lang === 'th' ? `คุณต้องการลบ "${featureToDelete.properties?.name_th || targetId}" ใช่หรือไม่?` : `Are you sure you want to delete this feature?`)) {
      return;
    }

    const deleter = (prevData, storageKey) => {
      if (!prevData?.features) return prevData;
      const updatedFeatures = prevData.features.filter(f => (f.properties?.id || f.id) !== targetId);
      const newCollection = { ...prevData, features: updatedFeatures };
      try { localStorage.setItem(storageKey, JSON.stringify(newCollection)); } catch {}
      return newCollection;
    };

    if (datasetType === 'poi') setPoiData(prev => deleter(prev, 'denchai_poi_data'));
    else if (datasetType === 'infra') setInfraData(prev => deleter(prev, 'denchai_infra_data'));
    else if (datasetType === 'service') setServiceData(prev => deleter(prev, 'denchai_service_data'));
    else if (datasetType === 'water') setWaterData(prev => deleter(prev, 'denchai_water_data'));
    else if (datasetType === 'solar') setGeoDataFacets(prev => deleter(prev, 'denchai_rooftop_facets'));

    setIsEditModalOpen(false);
    setSelectedFeature(null);
  };

  const handleResetData = (datasetType = activeLayer) => {
    if (!window.confirm(lang === 'th' ? 'คุณต้องการคืนค่าเริ่มต้นของชั้นข้อมูลนี้ใช่หรือไม่?' : 'Reset this layer to default?')) return;
    if (datasetType === 'poi') { localStorage.removeItem('denchai_poi_data'); setPoiData(POI_DATA); }
    else if (datasetType === 'infra') { localStorage.removeItem('denchai_infra_data'); setInfraData(INFRA_DATA); }
    else if (datasetType === 'service') { localStorage.removeItem('denchai_service_data'); setServiceData(SERVICE_DATA); }
    else if (datasetType === 'water') { localStorage.removeItem('denchai_water_data'); setWaterData(WATER_DATA); }
    else if (datasetType === 'solar') {
      localStorage.removeItem('denchai_rooftop_facets');
      fetchWithFallback('rooftop_facets.geojson').then(setGeoDataFacets);
    }
  };

  const handleExportData = (datasetType = activeLayer) => {
    const dataToExport = currentDataset.data;
    if (!dataToExport) return;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denchai_${datasetType}_${new Date().toISOString().slice(0, 10)}.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let geojson = null;
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        const text = await file.text();
        geojson = JSON.parse(text);
      } else if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        geojson = await shp(buffer);
      }

      if (geojson && geojson.features) {
        if (activeLayer === 'poi') { localStorage.setItem('denchai_poi_data', JSON.stringify(geojson)); setPoiData(geojson); }
        else if (activeLayer === 'infra') { localStorage.setItem('denchai_infra_data', JSON.stringify(geojson)); setInfraData(geojson); }
        else if (activeLayer === 'water') { localStorage.setItem('denchai_water_data', JSON.stringify(geojson)); setWaterData(geojson); }
        else if (activeLayer === 'service') { localStorage.setItem('denchai_service_data', JSON.stringify(geojson)); setServiceData(geojson); }
        else if (activeLayer === 'solar') { localStorage.setItem('denchai_rooftop_facets', JSON.stringify(geojson)); setGeoDataFacets(geojson); }
        alert(lang === 'th' ? `นำเข้าข้อมูล ${geojson.features.length} รายการสำเร็จ!` : `Successfully imported ${geojson.features.length} features!`);
      }
    } catch (err) {
      alert('Error parsing file. Please provide valid GeoJSON or Shapefile ZIP.');
    }
  };

  // ── btn style helper ──
  const btnStyle = (color) => ({
    display:'flex', alignItems:'center', justifyContent:'center', gap:5,
    padding:'7px 8px', borderRadius:7, fontSize:'0.73rem', fontWeight:700,
    cursor:'pointer', fontFamily:'inherit',
    border:`1px solid ${color}55`, background:`${color}18`, color
  });

  // ── EditorFeatureRow ──
  const EditorFeatureRow = ({ feature, idx }) => {
    const p = feature.properties || {};
    const name = p.name_th || p.name || p.building_name || `รายการ #${idx + 1}`;
    const catMeta = currentDataset.categories?.[p.category] || {};
    const isLinePoly = ['LineString','Polygon','MultiPolygon'].includes(feature.geometry?.type);
    return (
      <div style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 8px',
        borderRadius:7, background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)',
        transition:'background .1s' }}
        onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.07)'}
        onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}>
        <div style={{ flex:1, minWidth:0, cursor:'pointer' }} onClick={() => setSelectedFeature(feature)}>
          <div style={{ display:'flex', alignItems:'center', gap:5, marginBottom:1 }}>
            <span style={{ width:7, height:7, borderRadius: isLinePoly ? 1 : 7,
              background: catMeta.color || '#f87171', flexShrink:0 }} />
            <span style={{ fontSize:11.5, fontWeight:600, color:'#f0f4ff',
              overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{name}</span>
          </div>
          <div style={{ fontSize:'0.63rem', color:'rgba(255,255,255,0.25)', paddingLeft:12,
            overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
            {p.id?.slice(0,20) || ''}{p.description_th ? ` · ${p.description_th.slice(0,30)}` : ''}
          </div>
        </div>
        <div style={{ display:'flex', gap:3, flexShrink:0 }}>
          {isLinePoly && (
            <button type="button" onClick={e => { e.stopPropagation(); setReshapingFeature(feature); }}
              style={{ padding:'3px 5px', borderRadius:4, fontSize:11,
                color:'#60a5fa', background:'rgba(59,130,246,0.1)',
                border:'1px solid rgba(59,130,246,0.2)', cursor:'pointer' }}>⬡</button>
          )}
          <button type="button" onClick={e => { e.stopPropagation(); handleOpenEdit(feature, activeLayer); }}
            style={{ padding:'3px 7px', borderRadius:4, fontSize:10, fontWeight:600,
              color:'#f87171', background:'rgba(248,113,113,0.1)',
              border:'1px solid rgba(248,113,113,0.22)', cursor:'pointer', fontFamily:'inherit' }}>✏️</button>
          <button type="button" onClick={e => { e.stopPropagation(); handleDeleteFeature(feature, activeLayer); }}
            style={{ padding:'3px 5px', borderRadius:4,
              color:'#ef4444', background:'rgba(239,68,68,0.07)',
              border:'1px solid rgba(239,68,68,0.18)', cursor:'pointer' }}>
            <Trash2 size={10} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden' }}>

      {/* ── Left Editor Sidebar — Crimson Dark Theme ── */}
      <aside style={{
        width: 380, minWidth: 380, background: '#0d0204',
        borderRight: '1px solid rgba(248,113,113,0.15)',
        display: 'flex', flexDirection: 'column', zIndex: 1000,
        boxShadow: '4px 0 24px rgba(0,0,0,0.4)', height: '100%'
      }}>

        {/* Header — Crimson */}
        <div style={{
          background: 'linear-gradient(160deg,#1a0508 0%,#2d0a10 60%,#3d0f18 100%)',
          padding: '12px 14px 10px', flexShrink: 0,
          borderBottom: '1px solid rgba(248,113,113,0.2)',
          position: 'relative', overflow: 'hidden'
        }}>
          <div style={{ position:'absolute', top:0, right:0, width:120, height:100,
            background:'radial-gradient(ellipse at 100% 0%,rgba(248,113,113,0.18) 0%,transparent 70%)',
            pointerEvents:'none' }} />
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:1,
            background:'linear-gradient(90deg,transparent,rgba(248,113,113,0.4),transparent)',
            pointerEvents:'none' }} />

          <div style={{ display:'flex', alignItems:'center', gap:9, marginBottom:8, position:'relative' }}>
            <div style={{ width:34, height:34, borderRadius:8,
              background:'rgba(248,113,113,0.15)', border:'1.5px solid rgba(248,113,113,0.4)',
              display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
              <i className="ti ti-pencil-plus" style={{ fontSize:17, color:'#f87171' }} aria-hidden="true" />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:13.5, fontWeight:700, color:'#fff', lineHeight:1.2 }}>GIS Editor Studio</div>
              <div style={{ fontSize:9.5, color:'rgba(255,255,255,0.5)', marginTop:2 }}>
                {lang === 'th' ? 'โหมดการแก้ไข/ปรับปรุงข้อมูล GIS' : 'Data Edit & Update Mode'}
              </div>
            </div>
            <div style={{ display:'flex', gap:2 }}>
              <div style={{ fontSize:8, fontWeight:700, color:'#f87171',
                background:'rgba(248,113,113,0.12)', border:'1px solid rgba(248,113,113,0.3)',
                padding:'2px 6px', borderRadius:99, display:'flex', alignItems:'center', gap:3, marginRight:3 }}>
                <span style={{ width:5, height:5, borderRadius:'50%', background:'#f87171', flexShrink:0 }} />
                แก้ไขอยู่
              </div>
              {['th','en'].map(l => (
                <button key={l} onClick={() => setLang?.(l)} style={{
                  background: lang===l ? 'rgba(248,113,113,0.2)' : 'transparent',
                  color: lang===l ? '#f87171' : 'rgba(255,255,255,0.35)',
                  border:'none', borderRadius:4, padding:'3px 7px',
                  fontSize:10, fontWeight:700, cursor:'pointer', fontFamily:'inherit'
                }}>{l.toUpperCase()}</button>
              ))}
            </div>
          </div>

          {/* Nav */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:4, position:'relative' }}>
            {[
              { to:'/',          icon:'ti-map',              label:lang==='th'?'แผนที่':'Map' },
              { to:'/dashboard', icon:'ti-layout-dashboard', label:'Dashboard' },
              { to:'/editor',    icon:'ti-pencil',           label:lang==='th'?'แก้ไข':'Editor', active:true },
            ].map((b,i) => (
              <Link key={i} to={b.to} style={{
                display:'flex', alignItems:'center', justifyContent:'center', gap:4,
                padding:'6px 4px', borderRadius:7, fontSize:10.5, fontWeight:500,
                textDecoration:'none', fontFamily:'inherit',
                border: b.active ? '1px solid rgba(248,113,113,0.45)' : '1px solid rgba(255,255,255,0.08)',
                background: b.active ? 'rgba(248,113,113,0.18)' : 'rgba(255,255,255,0.04)',
                color: b.active ? '#f87171' : 'rgba(255,255,255,0.45)',
              }}>
                <i className={`ti ${b.icon}`} style={{ fontSize:12 }} aria-hidden="true" />
                {b.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Body: Vertical tabs + content */}
        <div style={{ display:'flex', flex:1, minHeight:0, overflow:'hidden' }}>

          {/* Vertical Tabs */}
          <nav style={{
            width:62, flexShrink:0, background:'#080002',
            borderRight:'1px solid rgba(248,113,113,0.1)',
            display:'flex', flexDirection:'column', overflowY:'auto', scrollbarWidth:'none'
          }}>
            {[
              { key:'poi',         emoji:'📍', nameTh:'สถาน\nที่',      cnt: poiData?.features?.length || 0 },
              { key:'infra',       emoji:'🏗️', nameTh:'โครง\nสร้าง',   cnt: infraData?.features?.length || 0 },
              { key:'water',       emoji:'💧', nameTh:'แหล่ง\nน้ำ',    cnt: waterData?.features?.length || 0 },
              { key:'service',     emoji:'⚡', nameTh:'บริการ',         cnt: serviceData?.features?.length || 0 },
              { key:'streetlight', emoji:'💡', nameTh:'Smart\nCity',    cnt: 0 },
              { key:'building_sc', emoji:'🏢', nameTh:'อาคาร\nที่ดิน', cnt: 0 },
            ].map(tab => {
              const smartKeys = ['solar','streetlight','watermeter','transformer','trashbin','hydrant','drain'];
              const on = activeLayer === tab.key || (tab.key === 'streetlight' && smartKeys.includes(activeLayer));
              return (
                <button key={tab.key} onClick={() => {
                  if (tab.key === 'streetlight') setActiveLayer('streetlight');
                  else setActiveLayer(tab.key);
                }} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  padding:'10px 4px', cursor:'pointer', fontFamily:'inherit',
                  borderRight: on ? '2.5px solid #f87171' : '2.5px solid transparent',
                  borderBottom:'1px solid rgba(255,255,255,0.04)',
                  borderTop:'none', borderLeft:'none',
                  background: on ? 'rgba(248,113,113,0.08)' : 'transparent',
                  flexShrink:0, transition:'all .12s'
                }}>
                  <span style={{ fontSize:16, lineHeight:1 }}>{tab.emoji}</span>
                  <span style={{ fontSize:8.5, fontWeight:on?700:500,
                    color:on?'#f87171':'rgba(255,255,255,0.35)',
                    lineHeight:1.25, textAlign:'center', whiteSpace:'pre-line' }}>
                    {lang==='th' ? tab.nameTh : tab.nameTh}
                  </span>
                  <span style={{ fontSize:8, fontWeight:700, padding:'1px 4px',
                    borderRadius:99, minWidth:16, textAlign:'center',
                    background:on?'rgba(248,113,113,0.2)':'rgba(255,255,255,0.06)',
                    color:on?'#f87171':'rgba(255,255,255,0.3)' }}>
                    {tab.cnt || '—'}
                  </span>
                </button>
              );
            })}
          </nav>

          {/* Scrollable Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'10px 10px',
            display:'flex', flexDirection:'column', gap:0, background:'#0d0204' }}>

          {/* ── Search ── */}
          <div style={{ padding:'8px 10px 6px', flexShrink:0 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6,
              background:'rgba(255,255,255,0.06)', border:'1px solid rgba(248,113,113,0.2)',
              borderRadius:8, padding:'6px 9px' }}>
              <Search size={13} color="rgba(248,113,113,0.5)" />
              <input type="text"
                placeholder={lang==='th' ? 'ค้นหาชื่อ, ประเภท...' : 'Search name, type...'}
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                style={{ background:'transparent', border:'none', outline:'none',
                  fontSize:12, color:'#e2e8f0', flex:1, fontFamily:'inherit' }} />
              {searchTerm && <button onClick={() => setSearchTerm('')}
                style={{ background:'none', border:'none', cursor:'pointer', color:'rgba(255,255,255,0.3)' }}>
                <X size={13} />
              </button>}
            </div>
          </div>

          {/* ── Action buttons row (สำหรับ layer ที่ active) ── */}
          <div style={{ padding:'0 10px 8px', flexShrink:0, display:'flex', flexDirection:'column', gap:5 }}>
            {/* Add button */}
            {activeLayer === 'infra' ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                <button type="button" onClick={() => setTriggerDrawRoad(true)} style={btnStyle('#f59e0b')}>
                  <i className="ti ti-line" style={{ fontSize:13 }} /> + วาดถนน
                </button>
                <button type="button" onClick={() => handleOpenAdd('infra')} style={btnStyle('#f87171')}>
                  <i className="ti ti-map-pin-plus" style={{ fontSize:13 }} /> + เพิ่มจุด
                </button>
              </div>
            ) : activeLayer === 'water' ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                <button type="button" onClick={() => setTriggerDrawWater(true)} style={btnStyle('#60a5fa')}>
                  <i className="ti ti-polygon" style={{ fontSize:13 }} /> + วาดแหล่งน้ำ
                </button>
                <button type="button" onClick={() => handleOpenAdd('water')} style={btnStyle('#f87171')}>
                  <i className="ti ti-map-pin-plus" style={{ fontSize:13 }} /> + เพิ่มจุด
                </button>
              </div>
            ) : activeLayer === 'building_sc' ? (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:5 }}>
                <button type="button" onClick={() => setTriggerDrawBuilding(true)} style={btnStyle('#fbbf24')}>
                  <i className="ti ti-building-skyscraper" style={{ fontSize:13 }} /> + วาดอาคาร
                </button>
                <button type="button" onClick={() => handleOpenAdd('building_sc')} style={btnStyle('#f87171')}>
                  <i className="ti ti-map-pin-plus" style={{ fontSize:13 }} /> + ปักจุด
                </button>
              </div>
            ) : (
              <button type="button" onClick={() => handleOpenAdd(activeLayer)} style={{ ...btnStyle('#f87171'), width:'100%', justifyContent:'center' }}>
                <i className="ti ti-map-pin-plus" style={{ fontSize:13 }} />
                + {activeLayer==='service' ? t.addServiceBtn : t.addPoiBtn}
              </button>
            )}

            {/* GPS + CSV + Import/Export */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr 1fr', gap:4 }}>
              {[
                { label:'GPS', icon:'ti-current-location', color:'#34d399', onClick: () => {
                  if (!navigator.geolocation) return;
                  navigator.geolocation.getCurrentPosition(
                    pos => alert(`Lat: ${pos.coords.latitude.toFixed(6)}\nLng: ${pos.coords.longitude.toFixed(6)}`),
                    err => alert(err.message), { enableHighAccuracy: true }
                  );
                }},
                { label:'CSV', icon:'ti-table', color:'#a78bfa', onClick: () => downloadCSVTemplate(activeLayer) },
                { label:'Import', icon:'ti-upload', color:'rgba(255,255,255,0.5)', onClick: () => fileInputRef.current?.click() },
                { label:'Export', icon:'ti-download', color:'rgba(255,255,255,0.5)', onClick: () => handleExportData(activeLayer) },
              ].map((b,i) => (
                <button key={i} type="button" onClick={b.onClick} style={{
                  display:'flex', flexDirection:'column', alignItems:'center', gap:2,
                  padding:'5px 2px', borderRadius:7, fontSize:'0.65rem', fontWeight:600, cursor:'pointer',
                  border:'1px solid rgba(255,255,255,0.08)', background:'rgba(255,255,255,0.04)', color:b.color, fontFamily:'inherit'
                }}>
                  <i className={`ti ${b.icon}`} style={{ fontSize:14 }} />
                  {b.label}
                </button>
              ))}
              <input type="file" ref={fileInputRef} style={{ display:'none' }}
                accept=".geojson,.json,.zip" onChange={handleImportFile} />
            </div>
          </div>

          {/* ── Category Groups — เหมือน View mode ── */}
          <div style={{ flex:1, overflowY:'auto', padding:'0 8px 8px',
            display:'flex', flexDirection:'column', gap:4,
            scrollbarWidth:'thin', scrollbarColor:'rgba(248,113,113,0.2) transparent' }}>

            {/* Header bar */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
              padding:'4px 2px', flexShrink:0 }}>
              <span style={{ fontSize:10, fontWeight:700, color:'rgba(255,255,255,0.35)',
                textTransform:'uppercase', letterSpacing:'.05em' }}>
                {items.length} รายการ
              </span>
              <button type="button" onClick={() => handleResetData(activeLayer)}
                style={{ fontSize:9, color:'rgba(248,113,113,0.5)', background:'none',
                  border:'none', cursor:'pointer', fontFamily:'inherit' }}>
                🔄 คืนค่า
              </button>
            </div>

            {/* Group by category */}
            {(() => {
              const categories = currentDataset.categories || {};
              const catKeys = Object.keys(categories);

              // ถ้าไม่มี categories ให้แสดง flat list
              if (catKeys.length === 0) {
                return items.map((feature, idx) => (
                  <EditorFeatureRow key={feature.properties?.id || idx} feature={feature} idx={idx} />
                ));
              }

              return catKeys.map(catKey => {
                const cat = categories[catKey];
                const catItems = items.filter(f => (f.properties?.category || f.properties?.class_id) === catKey);
                if (catItems.length === 0 && searchTerm) return null;
                const isExpanded = expandedCats[catKey] !== false; // default expanded

                return (
                  <div key={catKey} style={{ border:'1px solid rgba(248,113,113,0.1)',
                    borderRadius:9, overflow:'hidden', background:'rgba(248,113,113,0.03)' }}>

                    {/* Category header */}
                    <div onClick={() => setExpandedCats(prev => ({ ...prev, [catKey]: !isExpanded }))}
                      style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
                        cursor:'pointer', background:'rgba(248,113,113,0.06)',
                        borderBottom: isExpanded ? '1px solid rgba(248,113,113,0.08)' : 'none',
                        transition:'background .12s' }}
                      onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.1)'}
                      onMouseLeave={e => e.currentTarget.style.background='rgba(248,113,113,0.06)'}>
                      <span style={{ width:8, height:8, borderRadius:2, background:cat.color, flexShrink:0 }} />
                      <span style={{ fontSize:14 }}>{cat.icon}</span>
                      <span style={{ fontSize:12, color:'#e2e8f0', fontWeight:500, flex:1 }}>
                        {lang==='th' ? cat.name_th : cat.name_en}
                      </span>
                      <span style={{ fontSize:10, fontWeight:700,
                        background: catItems.length > 0 ? 'rgba(248,113,113,0.2)' : 'rgba(255,255,255,0.06)',
                        color: catItems.length > 0 ? '#f87171' : 'rgba(255,255,255,0.3)',
                        padding:'1px 7px', borderRadius:99 }}>{catItems.length}</span>

                      {/* Quick add button */}
                      <button type="button" onClick={e => { e.stopPropagation(); handleOpenAdd(activeLayer, catKey); }}
                        style={{ padding:'3px 7px', borderRadius:5, fontSize:10, fontWeight:600,
                          color:'#f87171', background:'rgba(248,113,113,0.12)',
                          border:'1px solid rgba(248,113,113,0.25)', cursor:'pointer' }}>
                        + เพิ่ม
                      </button>
                      <i className={`ti ti-chevron-${isExpanded ? 'up' : 'down'}`}
                        style={{ fontSize:12, color:'rgba(255,255,255,0.3)' }} />
                    </div>

                    {/* Feature list */}
                    {isExpanded && (
                      <div style={{ display:'flex', flexDirection:'column', gap:2, padding:'4px 6px 6px' }}>
                        {catItems.length === 0 ? (
                          <div style={{ padding:'10px', textAlign:'center', fontSize:11,
                            color:'rgba(255,255,255,0.2)' }}>ยังไม่มีข้อมูล</div>
                        ) : catItems.map((feature, idx) => (
                          <EditorFeatureRow key={feature.properties?.id || idx}
                            feature={feature} idx={idx} />
                        ))}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* ── Footer: GitHub + Download ── */}
          <div style={{ padding:'8px 10px', borderTop:'1px solid rgba(255,255,255,0.05)', flexShrink:0,
            display:'flex', flexDirection:'column', gap:6 }}>
            <GitHubAutoSave lang={lang} />
            <button type="button" onClick={() => setShowTemplatesModal(true)}
              style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'6px', borderRadius:7, fontSize:'0.7rem', fontWeight:600, cursor:'pointer',
                border:'1px solid rgba(139,92,246,0.25)', background:'rgba(139,92,246,0.06)',
                color:'rgba(139,92,246,0.7)', fontFamily:'inherit' }}>
              <i className="ti ti-download" style={{ fontSize:12 }} />
              ดาวน์โหลด Template & CSV
            </button>
          </div>

          </div>{/* end scrollable content */}
        </div>{/* end body flex */}
      </aside>

      {/* ── Right Main Map Area (Full Screen Studio) ── */}
      <main style={{ flex: 1, position: 'relative', height: '100%' }}>
        <MapViewer
          facetsData={geoDataFacets}
          buildingsData={geoDataBuildings}
          filters={{ minArea: 0, minEnergy: 0 }}
          visibleLayers={Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, true]))}
          uploadedBoundary={null}
          municipalBoundary={municipalBoundary}
          colorMode="class"
          viewMode="facets"
          lang={lang}
          tariff={tariff}
          activeTab={activeLayer}
          poiData={poiData}
          infraData={infraData}
          serviceData={serviceData}
          waterData={waterData}
          poiVisible={Object.fromEntries(Object.keys(POI_CATEGORIES).map(k => [k, true]))}
          infraVisible={Object.fromEntries(Object.keys(INFRA_CATEGORIES).map(k => [k, true]))}
          serviceVisible={Object.fromEntries(Object.keys(SERVICE_CATEGORIES).map(k => [k, true]))}
          waterVisible={Object.fromEntries(Object.keys(WATER_CATEGORIES).map(k => [k, true]))}
          selectedFeature={selectedFeature}
          isEditorMode={true}
          isPickingLocation={isPickingLocation}
          onLocationPicked={(coords) => {
            setPickedCoordinates(coords);
            setIsPickingLocation(false);
            setIsEditModalOpen(true);
          }}
          onEditFeature={handleOpenEdit}
          onAddFeature={handleOpenAdd}
          setUploadedBoundary={() => {}}
          reshapingFeature={reshapingFeature}
          onFinishReshaping={() => setReshapingFeature(null)}
          onSaveFeature={handleSaveFeature}
          onDeleteFeature={handleDeleteFeature}
          onSplitFeature={() => {}}
          onMergeFeatures={() => {}}
          triggerDrawRoad={triggerDrawRoad}
          onResetTriggerDrawRoad={() => setTriggerDrawRoad(false)}
          triggerDrawDrain={triggerDrawDrain}
          onResetTriggerDrawDrain={() => setTriggerDrawDrain(false)}
          triggerDrawBuilding={triggerDrawBuilding}
          onResetTriggerDrawBuilding={() => setTriggerDrawBuilding(false)}
          triggerDrawWater={triggerDrawWater}
          onResetTriggerDrawWater={() => setTriggerDrawWater(false)}
          triggerDrawRoof={triggerDrawRoof}
          onResetTriggerDrawRoof={() => setTriggerDrawRoof(false)}
        />

        {/* Feature Edit / Add Modal */}
        <FeatureEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          feature={editingFeature}
          categories={currentDataset.categories}
          datasetType={editDatasetType}
          onSave={handleSaveFeature}
          onDelete={handleDeleteFeature}
          onPickOnMap={() => {
            setIsEditModalOpen(false);
            setIsPickingLocation(true);
          }}
          onReshapeOnMap={(feat) => {
            setIsEditModalOpen(false);
            setReshapingFeature(feat);
          }}
          pickedCoords={pickedCoordinates}
          lang={lang}
        />
      </main>

      {/* ── GIS Layer Templates & Data Dictionary Modal ── */}
      {showTemplatesModal && (
        <div className="modal-backdrop" onClick={() => setShowTemplatesModal(false)}>
          <div className="modal-content" style={{ maxWidth: 760, width: '92vw' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header" style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700, fontSize: '0.95rem' }}>
                <FolderDown size={20} color="#2563eb" />
                <span>{lang === 'th' ? 'ศูนย์ดาวน์โหลด Template ชั้นข้อมูล GIS (16 หมวด)' : 'GIS Layer Template Center (16 Datasets)'}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowTemplatesModal(false)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* Highlight Banner: CSV Data Dictionary for Municipality */}
              <div style={{
                background: 'linear-gradient(135deg, #1e293b, #0f172a)', color: '#ffffff',
                borderRadius: 12, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                gap: 12, boxShadow: '0 4px 14px rgba(0,0,0,0.15)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <FileSpreadsheet size={28} color="#38bdf8" />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc' }}>
                      📊 {lang === 'th' ? 'พจนานุกรมข้อมูลเชิงพื้นที่ (GIS Data Dictionary CSV)' : 'GIS Data Dictionary (CSV Format)'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 2 }}>
                      {lang === 'th'
                        ? 'ไฟล์ CSV พร้อมเปิดใน Microsoft Excel ภาษาไทย สำหรับทำเล่มโครงการนำเสนอผู้บริหารเทศบาล'
                        : 'CSV file ready for Microsoft Excel with UTF-8 BOM encoding for official municipality reports.'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)', border: 'none',
                    fontWeight: 700, fontSize: '0.76rem', padding: '8px 14px', flexShrink: 0, gap: 6
                  }}
                  onClick={() => triggerTemplateDownload('GIS_DATA_DICTIONARY_DENCHAI.csv')}
                >
                  <Download size={14} />
                  {lang === 'th' ? 'ดาวน์โหลด CSV' : 'Download CSV'}
                </button>
              </div>

              {/* Grid of 16 GeoJSON Templates */}
              <div>
                <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
                  📂 {lang === 'th' ? 'แม่แบบชั้นข้อมูล GeoJSON แยกรายหมวด (สำหรับ QGIS/QField)' : 'Standard GeoJSON Templates for QGIS'}
                </div>

                <div className="template-card-grid">
                  {GIS_TEMPLATES.map(tpl => (
                    <div key={tpl.id} className="template-card">
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '1rem' }}>{tpl.icon}</span>
                          <span style={{
                            fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 6,
                            background: tpl.geom === 'Polygon' ? '#e0e7ff' : tpl.geom === 'LineString' ? '#fef3c7' : '#dcfce7',
                            color: tpl.geom === 'Polygon' ? '#3730a3' : tpl.geom === 'LineString' ? '#92400e' : '#166534'
                          }}>
                            {tpl.geom}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0f172a', marginBottom: 2 }}>
                          {tpl.name_th}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', lineHeight: 1.35, marginBottom: 8 }}>
                          {tpl.desc}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f1f5f9', paddingTop: 6 }}>
                        <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>
                          {tpl.fields} {lang === 'th' ? 'ฟิลด์ข้อมูล' : 'fields'}
                        </span>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{
                            fontSize: '0.68rem', padding: '4px 8px', color: '#2563eb', background: '#eff6ff',
                            border: '1px solid #bfdbfe', fontWeight: 600, gap: 4
                          }}
                          onClick={() => triggerTemplateDownload(tpl.file)}
                        >
                          <Download size={11} /> {lang === 'th' ? 'โหลด GeoJSON' : 'Download'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
