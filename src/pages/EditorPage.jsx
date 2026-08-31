import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import MapViewer from '../components/MapViewer';
import FeatureEditModal from '../components/FeatureEditModal';
import { POI_DATA, POI_CATEGORIES } from '../data/poi_data';
import { INFRA_DATA, INFRA_CATEGORIES } from '../data/infra_data';
import { SERVICE_DATA, SERVICE_CATEGORIES } from '../data/service_data';
import { WATER_DATA, WATER_CATEGORIES } from '../data/water_data';
import {
  STREETLIGHT_DATA, STREETLIGHT_CATEGORIES,
  WATERMETER_DATA,  WATERMETER_CATEGORIES,
  TRANSFORMER_DATA, TRANSFORMER_CATEGORIES,
  TRASHBIN_DATA,    TRASHBIN_CATEGORIES,
  HYDRANT_DATA,     HYDRANT_CATEGORIES,
  DRAIN_DATA,       DRAIN_CATEGORIES,
  BUILDING_DATA,    BUILDING_CATEGORIES,
} from '../data/smartcity_data';
import { pushFileToGitHub, getGithubToken, buildJsContent, DATASET_FILE_MAP } from '../utils/githubSync';
import GitHubSyncPanel from '../components/GitHubSyncPanel';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import {
  ArrowLeft, MapPin, Building2, Waves, HeartPulse, SunMedium,
  Search, X, Download, RotateCcw, Trash2, Edit3, FolderDown,
  PenTool, PlusCircle, CheckCircle2, FileSpreadsheet, Layers,
  Database, Upload, HelpCircle, HardDrive
} from 'lucide-react';
import shp from 'shpjs';

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

function downloadCSVTemplate(layer) {
  const templates = {
    streetlight: 'id,name_th,name_en,category,lat,lng,status,install_year,watt,remark\nsl_001,เสาไฟฟ้าหมู่ 1,Streetlight 1,light_on,17.9820,100.0510,ปกติ,2563,150,',
    watermeter:  'id,name_th,name_en,category,lat,lng,meter_no,owner_name,usage_type,remark\nwm_001,มิเตอร์น้ำ 1,Water Meter 1,residential,17.9815,100.0505,WM-0001,นายสมชาย,บ้านพักอาศัย,',
    transformer: 'id,name_th,name_en,category,lat,lng,kva,owner,install_year,remark\ntr_001,หม้อแปลง 1,Transformer 1,pea,17.9825,100.0515,100,การไฟฟ้าส่วนภูมิภาค,2560,',
    trashbin:    'id,name_th,name_en,category,lat,lng,capacity_l,collect_day,remark\ntb_001,ถังขยะหมู่ 1,Trash Bin 1,general,17.9818,100.0508,240,จันทร์-พฤหัส,',
    hydrant:     'id,name_th,name_en,category,lat,lng,pipe_diameter,pressure_bar,remark\nhy_001,หัวจ่ายน้ำ 1,Hydrant 1,active,17.9822,100.0512,100,3.5,',
    drain:       'id,name_th,name_en,category,lat,lng\ndr_001,คูระบายน้ำ 1,Drain 1,main,17.9820,100.0510',
    building_sc: 'id,house_no,moo,road,tambon,name_th,name_en,category,lat,lng,floors,area_sqm,height_m,width_m,length_m,wall_mat,roof_mat,year_built,condition,land_deed_no,parcel_id,owner_name,owner_id,tax_value,tax_year,permit_no,survey_date,surveyor,remark\nbld_001,123/4,5,ถนนเด่นชัย-งาว,เด่นชัย,บ้านนายสมชาย,,residential,17.9819,100.0509,2,120,,8,15,คสล.,กระเบื้อง,2545,ดี,,,นายสมชาย ใจดี,1234567890123,,2567,,2567-08-31,เจ้าหน้าที่สำรวจ,',
    poi:         'id,name_th,name_en,category,lat,lng,address,phone,remark\npoi_001,วัดตัวอย่าง,Sample Temple,วัด/ศาสนสถาน,17.9820,100.0510,หมู่ 1 ต.เด่นชัย,,',
    infra:       'id,name_th,name_en,category,lat,lng,road_type,width_m,surface,remark\nrd_001,ถนนตัวอย่าง,Sample Road,ถนนคอนกรีต,17.9820,100.0510,คอนกรีต,6,,',
    service:     'id,name_th,name_en,category,lat,lng,phone,open_hours,remark\nsv_001,โรงพยาบาลตัวอย่าง,Sample Hospital,โรงพยาบาล/สถานพยาบาล,17.9820,100.0510,054-000000,08:00-16:00,',
  };
  const csv = templates[layer] || templates.poi;
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `template_${layer}.csv`;
  a.click(); URL.revokeObjectURL(url);
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

// ── GitHub Auto-Save Panel (inline) ──────────────────────
function GitHubAutoSave({ lang }) {
  const [token, setToken]   = React.useState('');
  const [saved, setSaved]   = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [user, setUser]     = React.useState('');
  const [open, setOpen]     = React.useState(true);

  React.useEffect(() => {
    const t = localStorage.getItem('denchai_github_token');
    if (t) { setSaved(true); setToken(t.slice(0,8) + '••••••••'); }
  }, []);

  async function connect() {
    if (!token || token.includes('•')) return;
    setStatus('checking');
    try {
      const res = await fetch('https://api.github.com/user', {
        headers: { 'Authorization': `Bearer ${token}`, 'Accept': 'application/vnd.github+json' }
      });
      if (res.ok) {
        const d = await res.json();
        localStorage.setItem('denchai_github_token', token);
        setSaved(true); setUser(d.login); setStatus('ok');
        setToken(token.slice(0,8) + '••••••••');
      } else { setStatus('fail'); }
    } catch { setStatus('fail'); }
  }

  function disconnect() {
    localStorage.removeItem('denchai_github_token');
    setSaved(false); setToken(''); setStatus(null); setUser('');
  }

  return (
    <div style={{ background:'#f8fafc', border:'1px solid #e2e8f0', borderRadius:10, overflow:'hidden', marginBottom:2 }}>
      <div onClick={() => setOpen(!open)} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', cursor:'pointer', background:'#f1f5f9' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>🔗</span>
          <span style={{ fontSize:'0.8rem', fontWeight:700, color:'#1e293b' }}>GitHub Auto-Save</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {saved && <span style={{ fontSize:'0.68rem', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#10b981', padding:'2px 7px', borderRadius:99 }}>✓ Connected</span>}
          <span style={{ color:'#94a3b8', fontSize:12 }}>{open ? '▲' : '▼'}</span>
        </div>
      </div>
      {open && (
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
          {status === 'ok' && <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, padding:'8px 12px', fontSize:'0.76rem', color:'#10b981' }}>✅ เชื่อมต่อสำเร็จ! บัญชี: <strong>{user}</strong></div>}
          {status === 'fail' && <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'8px 12px', fontSize:'0.76rem', color:'#ef4444' }}>❌ Token ไม่ถูกต้อง</div>}
          <div style={{ fontSize:'0.72rem', color:'#64748b' }}>🔒 Token เก็บใน Browser เท่านั้น ไม่ได้ upload ขึ้น GitHub</div>
          {!saved ? (
            <>
              <input type="password" placeholder="วาง GitHub Token (ghp_...)" value={token} onChange={e => setToken(e.target.value)}
                style={{ padding:'8px 10px', borderRadius:8, fontSize:'0.78rem', width:'100%', background:'#fff', border:'1px solid #cbd5e1', color:'#1e293b', outline:'none' }} />
              <button onClick={connect} disabled={!token || status === 'checking'}
                style={{ padding:'8px', borderRadius:8, background: token ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : '#e2e8f0', border:'none', color: token ? '#fff' : '#94a3b8', fontWeight:700, fontSize:'0.78rem', cursor: token ? 'pointer' : 'not-allowed' }}>
                {status === 'checking' ? '⏳ กำลังตรวจสอบ...' : '🔗 เชื่อมต่อ GitHub'}
              </button>
            </>
          ) : (
            <button onClick={disconnect} style={{ padding:'7px', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontWeight:600, fontSize:'0.76rem', cursor:'pointer' }}>
              🔓 ยกเลิกการเชื่อมต่อ
            </button>
          )}
          <div style={{ fontSize:'0.72rem', color:'#94a3b8', lineHeight:1.5 }}>กดบันทึกใน Editor จะ Push ขึ้น GitHub อัตโนมัติ รอ ~2 นาที เว็บจะอัปเดตเลย</div>
        </div>
      )}
    </div>
  );
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

  const [streetlightData, setStreetlightData] = useState(() => { try { const s = localStorage.getItem('denchai_streetlight_data'); return s ? JSON.parse(s) : STREETLIGHT_DATA; } catch { return STREETLIGHT_DATA; } });
  const [watermeterData,  setWatermeterData]  = useState(() => { try { const s = localStorage.getItem('denchai_watermeter_data');  return s ? JSON.parse(s) : WATERMETER_DATA;  } catch { return WATERMETER_DATA;  } });
  const [transformerData, setTransformerData] = useState(() => { try { const s = localStorage.getItem('denchai_transformer_data'); return s ? JSON.parse(s) : TRANSFORMER_DATA; } catch { return TRANSFORMER_DATA; } });
  const [trashbinData,    setTrashbinData]    = useState(() => { try { const s = localStorage.getItem('denchai_trashbin_data');    return s ? JSON.parse(s) : TRASHBIN_DATA;    } catch { return TRASHBIN_DATA;    } });
  const [hydrantData,     setHydrantData]     = useState(() => { try { const s = localStorage.getItem('denchai_hydrant_data');     return s ? JSON.parse(s) : HYDRANT_DATA;     } catch { return HYDRANT_DATA;     } });
  const [drainData,       setDrainData]       = useState(() => { try { const s = localStorage.getItem('denchai_drain_data');       return s ? JSON.parse(s) : DRAIN_DATA;       } catch { return DRAIN_DATA;       } });
  const [buildingScData,  setBuildingScData]  = useState(() => { try { const s = localStorage.getItem('denchai_building_sc_data'); return s ? JSON.parse(s) : BUILDING_DATA;    } catch { return BUILDING_DATA;    } });

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
  const [triggerDrawRoad, setTriggerDrawRoad] = useState(false);
  const [triggerDrawWater, setTriggerDrawWater] = useState(false);
  const [triggerDrawRoof, setTriggerDrawRoof] = useState(false);
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
      case 'poi':         return { type: 'poi',         name: lang === 'th' ? 'สถานที่สำคัญ (POI)' : 'Points of Interest',    data: poiData,          categories: POI_CATEGORIES,         icon: '📍' };
      case 'infra':       return { type: 'infra',       name: lang === 'th' ? 'โครงข่ายถนน/คมนาคม' : 'Roads & Infrastructure', data: infraData,        categories: INFRA_CATEGORIES,       icon: '🛣️' };
      case 'water':       return { type: 'water',       name: lang === 'th' ? 'แหล่งน้ำ (Polygon)' : 'Water Bodies',           data: waterData,        categories: WATER_CATEGORIES,       icon: '💧' };
      case 'service':     return { type: 'service',     name: lang === 'th' ? 'บริการสาธารณะ' : 'Public Services',            data: serviceData,      categories: SERVICE_CATEGORIES,     icon: '🏥' };
      case 'solar':       return { type: 'solar',       name: lang === 'th' ? 'ผืนหลังคาโซลาร์' : 'Solar Rooftops',           data: geoDataFacets,    categories: ROOF_CLASSES,           icon: '☀️' };
      case 'streetlight': return { type: 'streetlight', name: lang === 'th' ? 'เสาไฟฟ้า/ไฟส่องสว่าง' : 'Street Lights',       data: streetlightData,  categories: STREETLIGHT_CATEGORIES, icon: '💡' };
      case 'watermeter':  return { type: 'watermeter',  name: lang === 'th' ? 'มิเตอร์น้ำ' : 'Water Meters',                  data: watermeterData,   categories: WATERMETER_CATEGORIES,  icon: '💧' };
      case 'transformer': return { type: 'transformer', name: lang === 'th' ? 'หม้อแปลงไฟฟ้า' : 'Transformers',               data: transformerData,  categories: TRANSFORMER_CATEGORIES, icon: '⚡' };
      case 'trashbin':    return { type: 'trashbin',    name: lang === 'th' ? 'ถังขยะ' : 'Trash Bins',                        data: trashbinData,     categories: TRASHBIN_CATEGORIES,    icon: '🗑️' };
      case 'hydrant':     return { type: 'hydrant',     name: lang === 'th' ? 'หัวจ่ายน้ำดับเพลิง' : 'Fire Hydrants',          data: hydrantData,      categories: HYDRANT_CATEGORIES,     icon: '🚒' };
      case 'drain':       return { type: 'drain',       name: lang === 'th' ? 'แนวทางระบายน้ำ' : 'Drainage',                   data: drainData,        categories: DRAIN_CATEGORIES,       icon: '🌊' };
      case 'building_sc': return { type: 'building_sc', name: lang === 'th' ? 'ชั้นอาคาร' : 'Buildings',                      data: buildingScData,   categories: BUILDING_CATEGORIES,    icon: '🏢' };
      default:            return { type: 'poi',         name: 'POI',                                                           data: poiData,          categories: POI_CATEGORIES,         icon: '📍' };
    }
  }, [activeLayer, poiData, infraData, serviceData, waterData, geoDataFacets,
      streetlightData, watermeterData, transformerData, trashbinData,
      hydrantData, drainData, buildingScData, lang]);

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

    const updater = (prevData, storageKey, categoriesObj, dataExport, catsExport) => {
      if (!prevData?.features) return prevData;
      const exists = prevData.features.some(f => (f.properties?.id || f.id) === targetId);
      const updatedFeatures = exists
        ? prevData.features.map(f => (f.properties?.id || f.id) === targetId ? savedFeature : f)
        : [savedFeature, ...prevData.features];
      const newCollection = { ...prevData, features: updatedFeatures };
      try { localStorage.setItem(storageKey, JSON.stringify(newCollection)); } catch {}

      // GitHub Auto-Save
      if (getGithubToken() && DATASET_FILE_MAP[datasetType]) {
        const { path } = DATASET_FILE_MAP[datasetType];
        const content = buildJsContent(dataExport, catsExport, categoriesObj, newCollection);
        pushFileToGitHub({ path, content, message: `update ${datasetType} — ${updatedFeatures.length} features` })
          .catch(err => console.warn('GitHub push failed:', err));
      }
      return newCollection;
    };

    if (datasetType === 'poi')         setPoiData(prev        => updater(prev, 'denchai_poi_data',         POI_CATEGORIES,         'POI_DATA',         'POI_CATEGORIES'));
    else if (datasetType === 'infra')  setInfraData(prev      => updater(prev, 'denchai_infra_data',       INFRA_CATEGORIES,       'INFRA_DATA',       'INFRA_CATEGORIES'));
    else if (datasetType === 'service')setServiceData(prev    => updater(prev, 'denchai_service_data',     SERVICE_CATEGORIES,     'SERVICE_DATA',     'SERVICE_CATEGORIES'));
    else if (datasetType === 'water')  setWaterData(prev      => updater(prev, 'denchai_water_data',       WATER_CATEGORIES,       'WATER_DATA',       'WATER_CATEGORIES'));
    else if (datasetType === 'solar')  setGeoDataFacets(prev  => updater(prev, 'denchai_rooftop_facets',   {},                     'ROOFTOP_DATA',     'ROOF_CLASSES'));
    else if (datasetType === 'streetlight') setStreetlightData(prev => updater(prev, 'denchai_streetlight_data', STREETLIGHT_CATEGORIES, 'STREETLIGHT_DATA', 'STREETLIGHT_CATEGORIES'));
    else if (datasetType === 'watermeter')  setWatermeterData(prev  => updater(prev, 'denchai_watermeter_data',  WATERMETER_CATEGORIES,  'WATERMETER_DATA',  'WATERMETER_CATEGORIES'));
    else if (datasetType === 'transformer') setTransformerData(prev => updater(prev, 'denchai_transformer_data', TRANSFORMER_CATEGORIES, 'TRANSFORMER_DATA', 'TRANSFORMER_CATEGORIES'));
    else if (datasetType === 'trashbin')    setTrashbinData(prev    => updater(prev, 'denchai_trashbin_data',    TRASHBIN_CATEGORIES,    'TRASHBIN_DATA',    'TRASHBIN_CATEGORIES'));
    else if (datasetType === 'hydrant')     setHydrantData(prev     => updater(prev, 'denchai_hydrant_data',     HYDRANT_CATEGORIES,     'HYDRANT_DATA',     'HYDRANT_CATEGORIES'));
    else if (datasetType === 'drain')       setDrainData(prev       => updater(prev, 'denchai_drain_data',       DRAIN_CATEGORIES,       'DRAIN_DATA',       'DRAIN_CATEGORIES'));
    else if (datasetType === 'building_sc') setBuildingScData(prev  => updater(prev, 'denchai_building_sc_data', BUILDING_CATEGORIES,    'BUILDING_DATA',    'BUILDING_CATEGORIES'));

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
      const name = file.name.toLowerCase();

      if (name.endsWith('.geojson') || name.endsWith('.json')) {
        const text = await file.text();
        geojson = JSON.parse(text);

      } else if (name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        geojson = await shp(buffer);

      } else if (name.endsWith('.csv')) {
        const text = await file.text();
        geojson = csvToGeoJSON(text, activeLayer);

      } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
        const buffer = await file.arrayBuffer();
        const XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/xlsx.mjs');
        const wb = XLSX.read(buffer, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        geojson = rowsToGeoJSON(rows, activeLayer);

      } else {
        alert('รองรับไฟล์: GeoJSON, Shapefile (ZIP), CSV, Excel (.xlsx)');
        return;
      }

      if (geojson && geojson.features?.length > 0) {
        applyImportedData(geojson);
        alert(lang === 'th' ? `✅ นำเข้าข้อมูล ${geojson.features.length} รายการสำเร็จ!` : `✅ Imported ${geojson.features.length} features!`);
      } else {
        alert(lang === 'th' ? '⚠️ ไม่พบข้อมูล หรือไฟล์ไม่ถูกต้อง' : '⚠️ No valid data found in file');
      }
    } catch (err) {
      console.error(err);
      alert('เกิดข้อผิดพลาด: ' + err.message);
    }
    e.target.value = '';
  };

  // ── CSV → GeoJSON ─────────────────────────────────────────
  const csvToGeoJSON = (text, layer) => {
    const lines = text.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const latKey  = headers.find(h => /^(lat|latitude|ละติจูด|y)$/i.test(h));
    const lngKey  = headers.find(h => /^(lng|lon|longitude|ลองจิจูด|x)$/i.test(h));
    if (!latKey || !lngKey) throw new Error(`ไม่พบคอลัมน์พิกัด (lat/lng หรือ latitude/longitude)\nคอลัมน์ที่พบ: ${headers.join(', ')}`);

    const features = lines.slice(1).filter(l => l.trim()).map((line, i) => {
      const vals = line.split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const props = {};
      headers.forEach((h, j) => { props[h] = vals[j] || ''; });
      const lat = parseFloat(props[latKey]);
      const lng = parseFloat(props[lngKey]);
      if (isNaN(lat) || isNaN(lng)) return null;
      props.id = props.id || `${layer}_${String(i+1).padStart(3,'0')}`;
      return { type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lng, lat] } };
    }).filter(Boolean);

    return { type: 'FeatureCollection', features };
  };

  // ── Excel rows → GeoJSON ──────────────────────────────────
  const rowsToGeoJSON = (rows, layer) => {
    if (!rows.length) return { type: 'FeatureCollection', features: [] };
    const keys = Object.keys(rows[0]);
    const latKey = keys.find(k => /^(lat|latitude|ละติจูด|y)$/i.test(k));
    const lngKey = keys.find(k => /^(lng|lon|longitude|ลองจิจูด|x)$/i.test(k));
    if (!latKey || !lngKey) throw new Error(`ไม่พบคอลัมน์พิกัด\nคอลัมน์ที่พบ: ${keys.join(', ')}`);

    const features = rows.map((row, i) => {
      const lat = parseFloat(row[latKey]);
      const lng = parseFloat(row[lngKey]);
      if (isNaN(lat) || isNaN(lng)) return null;
      const props = { ...row };
      props.id = props.id || `${layer}_${String(i+1).padStart(3,'0')}`;
      return { type: 'Feature', properties: props, geometry: { type: 'Point', coordinates: [lng, lat] } };
    }).filter(Boolean);

    return { type: 'FeatureCollection', features };
  };

  // ── Apply imported data to correct layer ──────────────────
  const applyImportedData = (geojson) => {
    const storageMap = {
      poi: 'denchai_poi_data', infra: 'denchai_infra_data',
      water: 'denchai_water_data', service: 'denchai_service_data',
      solar: 'denchai_rooftop_facets',
      streetlight: 'denchai_streetlight_data', watermeter: 'denchai_watermeter_data',
      transformer: 'denchai_transformer_data',  trashbin: 'denchai_trashbin_data',
      hydrant: 'denchai_hydrant_data',           drain: 'denchai_drain_data',
      building_sc: 'denchai_building_sc_data',
    };
    const setterMap = {
      poi: setPoiData, infra: setInfraData, water: setWaterData, service: setServiceData,
      solar: setGeoDataFacets,
      streetlight: setStreetlightData, watermeter: setWatermeterData,
      transformer: setTransformerData, trashbin: setTrashbinData,
      hydrant: setHydrantData, drain: setDrainData, building_sc: setBuildingScData,
    };
    const key = storageMap[activeLayer];
    const setter = setterMap[activeLayer];
    if (key && setter) {
      localStorage.setItem(key, JSON.stringify(geojson));
      setter(geojson);
      // Auto-push to GitHub if token exists
      if (getGithubToken() && DATASET_FILE_MAP[activeLayer]) {
        const { path } = DATASET_FILE_MAP[activeLayer];
        const cats = { poi: 'POI_CATEGORIES', infra: 'INFRA_CATEGORIES', water: 'WATER_CATEGORIES', service: 'SERVICE_CATEGORIES', streetlight: 'STREETLIGHT_CATEGORIES', watermeter: 'WATERMETER_CATEGORIES', transformer: 'TRANSFORMER_CATEGORIES', trashbin: 'TRASHBIN_CATEGORIES', hydrant: 'HYDRANT_CATEGORIES', drain: 'DRAIN_CATEGORIES', building_sc: 'BUILDING_CATEGORIES' };
        const datas = { poi: 'POI_DATA', infra: 'INFRA_DATA', water: 'WATER_DATA', service: 'SERVICE_DATA', streetlight: 'STREETLIGHT_DATA', watermeter: 'WATERMETER_DATA', transformer: 'TRANSFORMER_DATA', trashbin: 'TRASHBIN_DATA', hydrant: 'HYDRANT_DATA', drain: 'DRAIN_DATA', building_sc: 'BUILDING_DATA' };
        import('../utils/githubSync').then(({ buildJsContent, pushFileToGitHub }) => {
          const content = buildJsContent(datas[activeLayer] || 'DATA', cats[activeLayer] || 'CATEGORIES', {}, geojson);
          pushFileToGitHub({ path, content, message: `import ${activeLayer} data — ${geojson.features.length} features` }).catch(console.warn);
        });
      }
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

  return (
    <div className="app-container" style={{ display: 'flex', width: '100vw', height: '100vh', overflow: 'hidden', position: 'relative' }}>

      {/* ── Mobile overlay backdrop ── */}
      {isMobile && sidebarOpen && (
        <div onClick={() => setSidebarOpen(false)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 999 }}/>
      )}

      {/* ── Mobile toggle button ── */}
      {isMobile && !sidebarOpen && (
        <button onClick={() => setSidebarOpen(true)} style={{
          position: 'absolute', top: 14, left: 14, zIndex: 1100,
          padding: '10px 14px', background: '#0f172a', border: '1px solid #38bdf8',
          borderRadius: 10, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer'
        }}>☰ เมนู</button>
      )}

      {/* ── Left Editor Sidebar Panel ── */}
      <aside style={{
        width: isMobile ? '100vw' : 440,
        minWidth: isMobile ? 'unset' : 440,
        background: '#ffffff', borderRight: '1px solid #e2e8f0',
        display: sidebarOpen ? 'flex' : 'none',
        flexDirection: 'column', zIndex: 1000,
        boxShadow: '4px 0 20px rgba(0,0,0,0.06)',
        height: '100%',
        position: isMobile ? 'absolute' : 'relative',
        left: 0, top: 0
      }}>
        
        {/* Top Studio Header */}
        <div style={{
          padding: '14px 18px', background: '#0f172a', color: '#ffffff',
          borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Link
              to="/"
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                background: 'rgba(255,255,255,0.12)', borderRadius: 8, color: '#f8fafc',
                textDecoration: 'none', fontSize: '0.75rem', fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)'
              }}
              title="กลับหน้าหลัก Dashboard"
            >
              <ArrowLeft size={14} />
              <span>{lang === 'th' ? 'กลับหน้าแสดงผล' : 'Back to Viewer'}</span>
            </Link>
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🛠️ GIS Editor Studio</span>
              </div>
              <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                {lang === 'th' ? 'ศูนย์จัดการข้อมูลเทศบาล' : 'Municipality Data Center'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
            <button style={{ background: lang === 'th' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: '0.68rem', cursor: 'pointer' }} onClick={() => setLang?.('th')}>TH</button>
            <button style={{ background: lang === 'en' ? '#2563eb' : 'transparent', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 7px', fontSize: '0.68rem', cursor: 'pointer' }} onClick={() => setLang?.('en')}>EN</button>
            {isMobile && (
              <button onClick={() => setSidebarOpen(false)} style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: 'none', borderRadius: 6, padding: '5px 8px', fontSize: 16, cursor: 'pointer', marginLeft: 4 }}>✕</button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* Layer Selector */}
          <div style={{ background: '#f8fafc', padding: 12, borderRadius: 10, border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>
              📂 {lang === 'th' ? 'เลือกชั้นข้อมูลที่ต้องการจัดการ:' : 'Select Layer to Manage:'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {[
                { key: 'poi',         icon: '📍', label: t.tabPoi },
                { key: 'infra',       icon: '🛣️', label: lang === 'th' ? 'ถนน/คมนาคม' : 'Roads' },
                { key: 'water',       icon: '💧', label: lang === 'th' ? 'แหล่งน้ำ' : 'Water' },
                { key: 'service',     icon: '🏥', label: t.tabService },
                { key: 'solar',       icon: '☀️', label: lang === 'th' ? 'หลังคาโซลาร์' : 'Solar Roof' },
                { key: 'streetlight', icon: '💡', label: lang === 'th' ? 'เสาไฟฟ้า' : 'Streetlight' },
                { key: 'watermeter',  icon: '💧', label: lang === 'th' ? 'มิเตอร์น้ำ' : 'Water Meter' },
                { key: 'transformer', icon: '⚡', label: lang === 'th' ? 'หม้อแปลง' : 'Transformer' },
                { key: 'trashbin',    icon: '🗑️', label: lang === 'th' ? 'ถังขยะ' : 'Trash Bin' },
                { key: 'hydrant',     icon: '🚒', label: lang === 'th' ? 'หัวจ่ายน้ำ' : 'Hydrant' },
                { key: 'drain',       icon: '🌊', label: lang === 'th' ? 'ระบายน้ำ' : 'Drainage' },
                { key: 'building_sc', icon: '🏢', label: lang === 'th' ? 'อาคาร' : 'Building' },
              ].map(lay => (
                <button
                  key={lay.key}
                  type="button"
                  className={`btn btn-sm ${activeLayer === lay.key ? 'btn-primary' : ''}`}
                  style={{
                    justifyContent: 'center', fontSize: '0.72rem', padding: '7px 4px',
                    fontWeight: activeLayer === lay.key ? 700 : 500,
                    border: activeLayer === lay.key ? 'none' : '1px solid #cbd5e1',
                    background: activeLayer === lay.key ? 'linear-gradient(135deg, #ea580c, #c2410c)' : '#ffffff',
                    color: activeLayer === lay.key ? '#ffffff' : '#334155'
                  }}
                  onClick={() => setActiveLayer(lay.key)}
                >
                  <span>{lay.icon}</span>
                  <span>{lay.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Web Digitizing Action Box */}
          <div style={{
            background: '#f8fafc', border: '1px solid #e2e8f0',
            borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: '0.8rem', color: '#1e293b' }}>
                <i className="ti ti-pencil-plus" style={{ fontSize: 16, color: '#2563eb' }} aria-hidden="true" />
                <span>{lang === 'th' ? 'เครื่องมือจัดการข้อมูล' : 'Data Tools'}</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 600, background: '#f1f5f9', padding: '2px 8px', borderRadius: 99 }}>
                {currentDataset.data?.features?.length || 0} {lang === 'th' ? 'รายการ' : 'items'}
              </span>
            </div>

            {/* GPS + Template */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
              <button type="button" style={{ padding: '8px 6px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.4)', background: 'rgba(16,185,129,0.06)', color: '#059669', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                onClick={() => {
                  if (!navigator.geolocation) { alert('Browser ไม่รองรับ GPS'); return; }
                  navigator.geolocation.getCurrentPosition(
                    pos => { const { latitude, longitude } = pos.coords; alert(`ตำแหน่งของคุณ:\nLat: ${latitude.toFixed(6)}\nLng: ${longitude.toFixed(6)}`); },
                    err => alert('ไม่สามารถดึง GPS ได้: ' + err.message),
                    { enableHighAccuracy: true }
                  );
                }}>
                <i className="ti ti-current-location" style={{ fontSize: 14 }} aria-hidden="true" />
                GPS ตำแหน่งฉัน
              </button>
              <button type="button" style={{ padding: '8px 6px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.4)', background: 'rgba(99,102,241,0.06)', color: '#4f46e5', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, transition: 'all 0.15s' }}
                onClick={() => downloadCSVTemplate(activeLayer)}>
                <i className="ti ti-template" style={{ fontSize: 14 }} aria-hidden="true" />
                Template CSV
              </button>
            </div>

            {/* Dynamic Buttons */}
            {activeLayer === 'infra' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    justifyContent: 'center', padding: '9px 8px', fontSize: '0.78rem', fontWeight: 700, gap: 6,
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none'
                  }}
                  onClick={() => setTriggerDrawRoad(true)}
                >
                  🛣️ {lang === 'th' ? '+ วาดแนวถนน' : '+ Draw Road'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    justifyContent: 'center', padding: '9px 8px', fontSize: '0.78rem', fontWeight: 600, gap: 6,
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                  }}
                  onClick={() => handleOpenAdd('infra')}
                >
                  📍 {lang === 'th' ? '+ เพิ่มจุดสิ่งปลูกสร้าง' : '+ Add Node'}
                </button>
              </div>
            ) : activeLayer === 'water' ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    justifyContent: 'center', padding: '9px 8px', fontSize: '0.78rem', fontWeight: 700, gap: 6,
                    background: 'linear-gradient(135deg, #0284c7, #0369a1)', border: 'none'
                  }}
                  onClick={() => setTriggerDrawWater(true)}
                >
                  💧 {lang === 'th' ? '+ วาดแปลงแหล่งน้ำ' : '+ Draw Water'}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  style={{
                    justifyContent: 'center', padding: '9px 8px', fontSize: '0.78rem', fontWeight: 600, gap: 6,
                    background: 'linear-gradient(135deg, #06b6d4, #0891b2)'
                  }}
                  onClick={() => handleOpenAdd('water')}
                >
                  📍 {lang === 'th' ? '+ เพิ่มข้อมูลน้ำ' : '+ Add Info'}
                </button>
              </div>
            ) : activeLayer === 'solar' ? (
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', padding: '9px 10px', fontSize: '0.8rem', fontWeight: 700, gap: 6,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none'
                }}
                onClick={() => setTriggerDrawRoof(true)}
              >
                ☀️ {lang === 'th' ? '+ วาดหลังคาโซลาร์ใหม่ (Polygon)' : '+ Draw Solar Roof'}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', padding: '9px 12px', fontSize: '0.82rem', fontWeight: 700, gap: 6,
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                }}
                onClick={() => handleOpenAdd(activeLayer)}
              >
                📍 + {
                  activeLayer === 'service'     ? (lang === 'th' ? 'เพิ่มบริการสาธารณะ' : 'Add Service') :
                  activeLayer === 'streetlight' ? (lang === 'th' ? 'เพิ่มเสาไฟฟ้า' : 'Add Streetlight') :
                  activeLayer === 'watermeter'  ? (lang === 'th' ? 'เพิ่มมิเตอร์น้ำ' : 'Add Water Meter') :
                  activeLayer === 'transformer' ? (lang === 'th' ? 'เพิ่มหม้อแปลงไฟฟ้า' : 'Add Transformer') :
                  activeLayer === 'trashbin'    ? (lang === 'th' ? 'เพิ่มถังขยะ' : 'Add Trash Bin') :
                  activeLayer === 'hydrant'     ? (lang === 'th' ? 'เพิ่มหัวจ่ายน้ำดับเพลิง' : 'Add Hydrant') :
                  activeLayer === 'drain'       ? (lang === 'th' ? 'เพิ่มแนวระบายน้ำ' : 'Add Drainage') :
                  activeLayer === 'building_sc' ? (lang === 'th' ? 'เพิ่มอาคาร' : 'Add Building') :
                  activeLayer === 'water'       ? (lang === 'th' ? 'เพิ่มแหล่งน้ำ' : 'Add Water Body') :
                  activeLayer === 'infra'       ? (lang === 'th' ? 'เพิ่มสิ่งก่อสร้าง' : 'Add Infrastructure') :
                  (lang === 'th' ? 'เพิ่มสถานที่ใหม่' : 'Add New Place')
                }
              </button>
            )}

            {/* Import / Export */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, borderTop: '1px solid #e2e8f0', paddingTop: 8 }}>
              <button type="button"
                style={{ padding: '7px 6px', borderRadius: 8, border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.06)', color: '#4f46e5', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                onClick={() => fileInputRef.current?.click()} title="Import CSV, Excel, GeoJSON, Shapefile">
                <i className="ti ti-upload" style={{ fontSize: 14 }} aria-hidden="true" />
                {lang === 'th' ? 'นำเข้าไฟล์' : 'Import'}
              </button>
              <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept=".geojson,.json,.zip,.csv,.xlsx,.xls" onChange={handleImportFile} />
              <button type="button"
                style={{ padding: '7px 6px', borderRadius: 8, border: '1px solid rgba(100,116,139,0.35)', background: 'rgba(100,116,139,0.06)', color: '#475569', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                onClick={() => handleExportData(activeLayer)}>
                <i className="ti ti-download" style={{ fontSize: 14 }} aria-hidden="true" />
                {lang === 'th' ? 'ส่งออก GeoJSON' : 'Export'}
              </button>
            </div>
          </div>

          {/* GitHub Auto-Save — inline */}
          <GitHubAutoSave lang={lang} />

          {/* GIS Templates Center Action Banner */}
          <div style={{
            background: 'linear-gradient(135deg, #eff6ff, #f0fdf4)', border: '1px solid #bfdbfe',
            borderRadius: 12, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 700, fontSize: '0.8rem', color: '#1e40af' }}>
              <FolderDown size={16} color="#2563eb" />
              <span>{lang === 'th' ? 'ศูนย์ดาวน์โหลด Template ชั้นข้อมูล GIS (16 หมวด)' : 'GIS Layer Template Center (16 Datasets)'}</span>
            </div>
            <p style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.4 }}>
              {lang === 'th'
                ? 'ดาวน์โหลดไฟล์ GeoJSON สำหรับนำไปวาดใน QGIS และพจนานุกรมข้อมูล (CSV Data Dictionary) สำหรับนำเสนอเทศบาล'
                : 'Download standard GeoJSON templates for QGIS and CSV Data Dictionary for municipality presentation.'}
            </p>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                width: '100%', justifyContent: 'center', background: '#2563eb', color: '#ffffff',
                fontWeight: 700, fontSize: '0.75rem', padding: '8px 10px', gap: 6, border: 'none'
              }}
              onClick={() => setShowTemplatesModal(true)}
            >
              📥 {t.downloadTemplates || 'เปิดศูนย์ดาวน์โหลด Template & CSV'}
            </button>
          </div>

          {/* Search within Current Layer */}
          <div className="search-bar">
            <Search size={14} className="search-icon" />
            <input
              type="text"
              placeholder={lang === 'th' ? `ค้นหาใน ${currentDataset.name}...` : `Search in ${currentDataset.name}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="search-clear" onClick={() => setSearchTerm('')}>
                <X size={13} />
              </button>
            )}
          </div>

          {/* Feature List Table / Items */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                📋 {lang === 'th' ? `รายการข้อมูล (${items.length})` : `Feature List (${items.length})`}
              </span>
              <button
                type="button"
                className="btn-text"
                style={{ fontSize: '0.68rem', color: '#ef4444' }}
                onClick={() => handleResetData(activeLayer)}
              >
                🔄 {lang === 'th' ? 'คืนค่าเริ่มต้น' : 'Reset Layer'}
              </button>
            </div>

            <div style={{
              maxHeight: 380, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6,
              background: '#f8fafc', padding: 6, borderRadius: 10, border: '1px solid #e2e8f0'
            }}>
              {items.length === 0 ? (
                <div style={{ padding: '24px 12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem' }}>
                  {lang === 'th' ? 'ไม่พบข้อมูลในเงื่อนไขการค้นหา' : 'No items match search'}
                </div>
              ) : (
                items.map((feature, idx) => {
                  const p = feature.properties || {};
                  const name = p.name_th || p.name || p.building_name || (lang === 'th' ? `รายการ #${idx + 1}` : `Feature #${idx + 1}`);
                  const catMeta = currentDataset.categories?.[p.category] || ROOF_CLASSES[p.class_id] || {};
                  const isGeometryLineOrPoly = feature.geometry?.type === 'LineString' || feature.geometry?.type === 'Polygon';

                  return (
                    <div
                      key={p.id || idx}
                      style={{
                        background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8,
                        padding: '8px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        gap: 8, transition: 'all 0.15s ease'
                      }}
                    >
                      <div
                        style={{ flex: 1, minWidth: 0, cursor: 'pointer' }}
                        onClick={() => setSelectedFeature(feature)}
                        title={lang === 'th' ? 'คลิกเพื่อซูมดูบนแผนที่' : 'Click to view on map'}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                          <span style={{ fontSize: '0.8rem' }}>{catMeta.icon || currentDataset.icon}</span>
                          <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {name}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {p.id ? `ID: ${p.id}` : ''} {p.description_th ? `• ${p.description_th}` : ''}
                        </div>
                      </div>

                      {/* Actions: Edit, Reshape, Delete */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                        {isGeometryLineOrPoly && (
                          <button
                            type="button"
                            className="btn btn-sm"
                            style={{ padding: '4px 6px', fontSize: '0.68rem', color: '#0284c7', background: '#f0f9ff', border: '1px solid #bae6fd' }}
                            onClick={() => setReshapingFeature(feature)}
                            title={lang === 'th' ? 'ปรับรูปแปลง/พิกัดบนแผนที่' : 'Reshape geometry'}
                          >
                            🔄
                          </button>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ padding: '4px 8px', fontSize: '0.68rem', color: '#2563eb', background: '#eff6ff', border: '1px solid #bfdbfe' }}
                          onClick={() => handleOpenEdit(feature, activeLayer)}
                          title={lang === 'th' ? 'แก้ไขข้อมูล' : 'Edit attributes'}
                        >
                          ✏️ {lang === 'th' ? 'แก้' : 'Edit'}
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm"
                          style={{ padding: '4px 6px', fontSize: '0.68rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca' }}
                          onClick={() => handleDeleteFeature(feature, activeLayer)}
                          title={lang === 'th' ? 'ลบข้อมูล' : 'Delete'}
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
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
