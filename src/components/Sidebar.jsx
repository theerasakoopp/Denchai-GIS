import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Zap, Home, Upload, Layers, SunMedium, X, MapPin,
  TrendingUp, Leaf, DollarSign, Settings2, Download, Printer,
  Building2, HeartPulse, Navigation, Search, ChevronDown, ChevronRight, Waves,
  FileSpreadsheet, FolderDown, RotateCcw, Trash2, Edit3
} from 'lucide-react';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import * as turf from '@turf/turf';
import shp from 'shpjs';
import GitHubSyncPanel from './GitHubSyncPanel';

const fmt = (n) => new Intl.NumberFormat('en-US').format(Math.round(n || 0));

const fmtEnergy = (n) => {
  if (n >= 1e9) return (n / 1e9).toFixed(2) + ' TWh';
  if (n >= 1e6) return (n / 1e6).toFixed(2) + ' GWh';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + ' MWh';
  return fmt(n) + ' kWh';
};

// Filter features by criteria
function applyFilters(geoData, filters, visibleLayers, boundary, viewMode) {
  if (!geoData || !geoData.features) return { totalArea: 0, totalEnergy: 0, totalCapacity: 0, count: 0, byCls: {} };

  let totalArea = 0, totalEnergy = 0, totalCapacity = 0, count = 0;
  const byCls = Object.fromEntries(
    Object.keys(ROOF_CLASSES).map(k => [k, { area: 0, energy: 0, capacity: 0, count: 0 }])
  );

  for (const f of geoData.features) {
    const p = f.properties;
    if (!p) continue;
    const cid = p.class_id || 1;
    if (visibleLayers && visibleLayers[cid] === false) continue;

    const area = p.area_3d || p.area_2d || 0;
    const energy = p.energy_corrected_kwh || p.energy_kwh || 0;
    const cap = p.capacity_kwp || 0;

    const minArea = Number(filters?.minArea) || 0;
    const minEnergy = Number(filters?.minEnergy) || 0;

    if (minArea > 0 && area < minArea) continue;
    if (minEnergy > 0 && energy < minEnergy) continue;

    totalArea += area;
    totalEnergy += energy;
    totalCapacity += cap;
    count++;

    if (byCls[cid]) {
      byCls[cid].area += area;
      byCls[cid].energy += energy;
      byCls[cid].capacity += cap;
      byCls[cid].count++;
    }
  }

  // Financial and environmental formulas
  const totalInvestmentTHB = totalCapacity * 28000;
  const annualSavingsTHB = totalEnergy * 4.20;
  const paybackYears = annualSavingsTHB > 0 ? (totalInvestmentTHB / annualSavingsTHB).toFixed(1) : '-';
  const co2ReductionTons = (totalEnergy * 0.4999) / 1000;
  const treesEquivalent = Math.round(totalEnergy * 0.4999 / 20);

  return {
    totalArea: Math.round(totalArea),
    totalEnergy: Math.round(totalEnergy),
    totalCapacity: Number(totalCapacity.toFixed(2)),
    count,
    byCls,
    annualSavingsTHB,
    totalInvestmentTHB,
    paybackYears,
    co2ReductionTons,
    treesEquivalent,
  };
}

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

// Helper: trigger direct browser download for template files
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

// ── Category List Panel (Original Clean Design: Accordion + Chips + Toggle Switches) ──
function CategoryListPanel({
  data, categories, visibleCats, setVisibleCats,
  lang, t, summaryIcon, summaryLabel, onItemClick,
  datasetType = 'poi',
  onAddFeature, onEditFeature, onDeleteFeature,
  onResetData, onExportData, onStartDrawRoad, onStartDrawWater, onReshapeRoad
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCatFilter, setSelectedCatFilter] = useState('all');
  const [expandedCats, setExpandedCats] = useState({});

  const toggleAccordion = (catKey) => {
    setExpandedCats(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const expandAll = () => {
    setExpandedCats(Object.fromEntries(Object.keys(categories).map(k => [k, true])));
  };

  const collapseAll = () => {
    setExpandedCats({});
  };

  // Group and filter items
  const { grouped, totalCount, filteredCount } = useMemo(() => {
    if (!data?.features) return { grouped: {}, totalCount: 0, filteredCount: 0 };
    const g = {};
    let total = 0;
    let filtered = 0;
    const term = searchTerm.trim().toLowerCase();

    for (const f of data.features) {
      total++;
      const p = f.properties || {};
      const cat = p.category || 'other';

      // Apply category chip filter
      if (selectedCatFilter !== 'all' && cat !== selectedCatFilter) continue;

      // Apply search filter
      if (term) {
        const nameTh = (p.name_th || p.name || '').toLowerCase();
        const nameEn = (p.name_en || '').toLowerCase();
        const descTh = (p.description_th || '').toLowerCase();
        const descEn = (p.description_en || '').toLowerCase();
        if (!nameTh.includes(term) && !nameEn.includes(term) && !descTh.includes(term) && !descEn.includes(term)) {
          continue;
        }
      }

      filtered++;
      if (!g[cat]) g[cat] = [];
      g[cat].push(f);
    }
    return { grouped: g, totalCount: total, filteredCount: filtered };
  }, [data, searchTerm, selectedCatFilter]);

  const toggleCat = (catKey) => {
    setVisibleCats(prev => ({ ...prev, [catKey]: !prev[catKey] }));
  };

  const showAll = () => setVisibleCats(
    Object.fromEntries(Object.keys(categories).map(k => [k, true]))
  );
  const hideAll = () => setVisibleCats(
    Object.fromEntries(Object.keys(categories).map(k => [k, false]))
  );

  return (
    <>
      {/* Search Bar */}
      <div className="search-bar" style={{ flexShrink: 0 }}>
        <Search size={15} className="search-icon" />
        <input
          type="text"
          placeholder={
            datasetType === 'infra' ? (lang === 'th' ? 'ค้นหาชื่อถนน, ทางหลวง, ทางรถไฟ...' : 'Search roads, highways...')
            : datasetType === 'water' ? (lang === 'th' ? 'ค้นหาชื่อแม่น้ำ, ห้วย, คลอง, สระน้ำ...' : 'Search rivers, canals, ponds...')
            : (lang === 'th' ? 'ค้นหาชื่อสถานที่, โรงพยาบาล, วัด, ร้านยา...' : 'Search places, hospitals, temples...')
          }
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <button className="search-clear" onClick={() => setSearchTerm('')}>
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category Filter Chips Bar */}
      <div className="category-chips-bar" style={{ flexShrink: 0 }}>
        <button
          className={`cat-chip ${selectedCatFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCatFilter('all')}
        >
          {lang === 'th' ? 'ทั้งหมด' : 'All'} ({totalCount})
        </button>
        {Object.entries(categories).map(([k, meta]) => {
          const count = (grouped[k] || []).length;
          if (count === 0 && selectedCatFilter !== k) return null;
          return (
            <button
              key={k}
              className={`cat-chip ${selectedCatFilter === k ? 'active' : ''}`}
              onClick={() => setSelectedCatFilter(selectedCatFilter === k ? 'all' : k)}
            >
              <span>{meta.icon}</span>
              <span>{lang === 'th' ? meta.name_th : meta.name_en}</span>
              <span className="chip-count">({count})</span>
            </button>
          );
        })}
      </div>

      {/* Layer Control Toolbar */}
      <div className="layer-control-toolbar" style={{ flexShrink: 0 }}>
        <span className="toolbar-label">
          {lang === 'th' ? `ชั้นข้อมูล (${totalCount})` : `Layers (${totalCount})`}
        </span>
        <div className="toolbar-actions">
          <button onClick={expandAll} className="btn-text" style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: 5, color: '#334155', fontWeight: 600 }}>
            {lang === 'th' ? 'ขยายทั้งหมด' : 'Expand All'}
          </button>
          <button onClick={showAll} className="btn-text" style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: 5, color: '#334155', fontWeight: 600 }}>
            {t.poiShowAll || 'แสดงทั้งหมด'}
          </button>
          <button onClick={hideAll} className="btn-text" style={{ background: '#f1f5f9', padding: '3px 7px', borderRadius: 5, color: '#334155', fontWeight: 600 }}>
            {t.poiHideAll || 'ซ่อนทั้งหมด'}
          </button>
        </div>
      </div>

      {/* Category Accordion List with iOS-Style Switches */}
      <div className="category-groups-container">
        {Object.entries(categories).map(([catKey, meta]) => {
          const items = grouped[catKey] || [];
          const isVisible = visibleCats[catKey] !== false;
          const isExpanded = expandedCats[catKey] === true;

          return (
            <div key={catKey} className={`category-group ${!isVisible ? 'dimmed' : ''}`}>
              <div
                className="category-header"
                onClick={() => toggleAccordion(catKey)}
              >
                <div className="cat-label">
                  <span className="cat-dot" style={{ background: meta.color }} />
                  <span className="cat-accordion-arrow">
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </span>
                  <span className="cat-icon">{meta.icon}</span>
                  <span className="cat-name">{lang === 'th' ? meta.name_th : meta.name_en}</span>
                </div>

                <div className="cat-actions" onClick={(e) => e.stopPropagation()}>
                  <span className="cat-count">{items.length}</span>
                  <label
                    className="cat-toggle-switch"
                    title={isVisible ? (lang === 'th' ? 'ซ่อนเลเยอร์นี้' : 'Hide layer') : (lang === 'th' ? 'แสดงเลเยอร์นี้' : 'Show layer')}
                  >
                    <input
                      type="checkbox"
                      checked={isVisible}
                      onChange={() => toggleCat(catKey)}
                    />
                    <span className="slider round"></span>
                  </label>
                </div>
              </div>

              {isExpanded && items.length > 0 && (
                <div className="category-items">
                  {items.map((feature, idx) => {
                    const p = feature.properties || {};
                    const name = lang === 'th' ? (p.name_th || p.name) : (p.name_en || p.name_th || p.name);
                    const desc = lang === 'th' ? p.description_th : (p.description_en || p.description_th);
                    const isLineOrPoly = feature.geometry?.type === 'LineString' || feature.geometry?.type === 'Polygon';

                    return (
                      <div
                        key={p.id || idx}
                        className="category-item"
                        onClick={() => onItemClick?.(feature)}
                        title={lang === 'th' ? 'คลิกเพื่อซูมดูบนแผนที่' : 'Click to fly to map position'}
                      >
                        <div className="item-main">
                          <div className="item-name">
                            <span>{name || (lang === 'th' ? 'ไม่มีชื่อระบุ' : 'Unnamed Item')}</span>
                          </div>
                          {desc && <div className="item-desc">{desc}</div>}
                          {p.phone && <div className="item-sub">📞 {p.phone}</div>}
                          {p.surface_type && (
                            <div className="item-sub">
                              🛣️ {p.surface_type} | {p.condition || 'good'} | {p.width_m ? `${p.width_m}m` : ''}
                            </div>
                          )}
                          {p.area_sqm && (
                            <div className="item-sub">
                              💧 {fmt(p.area_sqm)} ตร.ม. | {p.water_quality || 'good'}
                            </div>
                          )}
                        </div>

                        {/* Action buttons on item */}
                        <div className="item-actions" onClick={(e) => e.stopPropagation()}>
                          {isLineOrPoly && onReshapeRoad && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.68rem', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0' }}
                              onClick={() => onReshapeRoad(feature)}
                              title={lang === 'th' ? 'ปรับรูปแปลง/เส้นทางบนแผนที่' : 'Reshape'}
                            >
                              🔄
                            </button>
                          )}
                          {onEditFeature && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.68rem' }}
                              onClick={() => onEditFeature(feature, datasetType)}
                              title={lang === 'th' ? 'แก้ไขข้อมูล' : 'Edit'}
                            >
                              <Edit3 size={11} />
                            </button>
                          )}
                          {onDeleteFeature && (
                            <button
                              type="button"
                              className="btn btn-sm"
                              style={{ padding: '3px 6px', fontSize: '0.68rem', color: '#ef4444' }}
                              onClick={() => onDeleteFeature(feature, datasetType)}
                              title={lang === 'th' ? 'ลบ' : 'Delete'}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Quick Action Toolbar at Bottom of Tab */}
      <div style={{
        background: '#f8fafc', border: '1px solid #e2e8f0',
        borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
        marginTop: 4, flexShrink: 0
      }}>
        {datasetType === 'infra' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                justifyContent: 'center', padding: '8px 6px', fontSize: '0.76rem', fontWeight: 700, gap: 5,
                background: 'linear-gradient(135deg, #f59e0b, #d97706)', border: 'none'
              }}
              onClick={() => onStartDrawRoad?.()}
            >
              🛣️ {lang === 'th' ? '+ วาดถนนใหม่' : '+ Draw Road'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                justifyContent: 'center', padding: '8px 6px', fontSize: '0.76rem', fontWeight: 600, gap: 5,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
              }}
              onClick={() => onAddFeature(datasetType)}
            >
              📍 {lang === 'th' ? '+ เพิ่มสิ่งก่อสร้าง' : '+ Add Node'}
            </button>
          </div>
        ) : datasetType === 'water' ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                justifyContent: 'center', padding: '8px 6px', fontSize: '0.76rem', fontWeight: 700, gap: 5,
                background: 'linear-gradient(135deg, #0284c7, #0369a1)', border: 'none'
              }}
              onClick={() => onStartDrawWater?.()}
            >
              💧 {lang === 'th' ? '+ วาดแหล่งน้ำ' : '+ Draw Water'}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              style={{
                justifyContent: 'center', padding: '8px 6px', fontSize: '0.76rem', fontWeight: 600, gap: 5,
                background: 'linear-gradient(135deg, #06b6d4, #0891b2)'
              }}
              onClick={() => onAddFeature(datasetType)}
            >
              📍 {lang === 'th' ? '+ เพิ่มข้อมูลน้ำ' : '+ Add Info'}
            </button>
          </div>
        ) : (
          onAddFeature && (
            <button
              type="button"
              className="btn btn-primary"
              style={{
                width: '100%', justifyContent: 'center', padding: '8px 12px',
                fontSize: '0.82rem', fontWeight: 600, gap: 6,
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)'
              }}
              onClick={() => onAddFeature(datasetType)}
            >
              {datasetType === 'service' ? t.addServiceBtn : t.addPoiBtn}
            </button>
          )
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {onExportData && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '5px 8px' }}
              onClick={() => onExportData(datasetType)}
            >
              <Download size={12} /> {lang === 'th' ? 'ส่งออก GeoJSON' : 'Export'}
            </button>
          )}
          {onResetData && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '5px 8px', color: '#64748b' }}
              onClick={() => onResetData(datasetType)}
            >
              🔄 {lang === 'th' ? 'คืนค่าเริ่มต้น' : 'Reset'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}

// ── Main Sidebar Export Component ──
export default function Sidebar({
  geoData,
  filters, setFilters,
  visibleLayers, toggleLayer, toggleAllLayers,
  uploadedBoundary, setUploadedBoundary,
  colorMode, setColorMode,
  viewMode, setViewMode,
  lang, setLang,
  tariff, setTariff,
  systemCostPerKwp, setSystemCostPerKwp,
  activeTab = 'poi', setActiveTab = () => {},
  poiData, poiCategories,
  infraData, infraCategories,
  serviceData, serviceCategories,
  waterData, waterCategories,
  poiVisible, setPoiVisible,
  infraVisible, setInfraVisible,
  serviceVisible, setServiceVisible,
  waterVisible, setWaterVisible,
  streetlightData, streetlightCategories, streetlightVisible, setStreetlightVisible,
  watermeterData,  watermeterCategories,  watermeterVisible,  setWatermeterVisible,
  transformerData, transformerCategories, transformerVisible, setTransformerVisible,
  trashbinData,    trashbinCategories,    trashbinVisible,    setTrashbinVisible,
  hydrantData,     hydrantCategories,     hydrantVisible,     setHydrantVisible,
  drainData,       drainCategories,       drainVisible,       setDrainVisible,
  buildingData,    buildingCategories,    buildingVisible,    setBuildingVisible,
  onSelectFeature,
  onAddFeature, onEditFeature, onDeleteFeature,
  onResetData, onExportData,
  onStartDrawRoad, onStartDrawWater, onStartDrawRoof, onReshapeRoad
}) {
  const t = translations[lang] || translations.th;
  const aoiFileInputRef = useRef(null);

  const [showRoiModal, setShowRoiModal] = useState(false);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const [tempTariff, setTempTariff] = useState(tariff || 4.20);
  const [tempSystemCost, setTempSystemCost] = useState(systemCostPerKwp || 28000);

  const stats = useMemo(() => {
    return applyFilters(geoData, filters, visibleLayers, uploadedBoundary, viewMode);
  }, [geoData, filters, visibleLayers, uploadedBoundary, viewMode]);

  // Dynamic calculations
  const totalInvestmentThb = (stats.totalCapacity || 0) * (systemCostPerKwp || 28000);
  const annualSavingsThb = (stats.totalEnergy || 0) * (tariff || 4.20);
  const paybackYears = annualSavingsThb > 0 ? (totalInvestmentThb / annualSavingsThb).toFixed(1) : '-';
  const co2ReductionTons = (stats.totalEnergy * 0.4999) / 1000;
  const treesEquivalent = Math.round(stats.totalEnergy * 0.4999 / 20);

  // Solar Direction Chart Data
  const chartData = useMemo(() => {
    return Object.entries(ROOF_CLASSES).map(([cid, meta]) => {
      const clsStats = stats.byCls[cid] || { area: 0, energy: 0, capacity: 0, count: 0 };
      const className = t.classes?.[cid] || meta.name;
      return {
        cid,
        name: className.split('(')[0].trim(),
        energy: clsStats.energy,
        capacity: clsStats.capacity,
        area: clsStats.area,
        color: meta.color,
      };
    }).filter(d => d.energy > 0);
  }, [stats, t, lang]);

  const handleAoiUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        const text = await file.text();
        const json = JSON.parse(text);
        setUploadedBoundary(json);
      } else if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        const geojson = await shp(buffer);
        setUploadedBoundary(geojson);
      }
    } catch (err) {
      console.error('AOI upload error:', err);
      alert('Cannot parse boundary file. Please provide valid GeoJSON or Shapefile ZIP.');
    }
  };

  const TABS = [
    { key: 'poi',       icon: '📍', label: t.tabPoi },
    { key: 'infra',     icon: '🏗️', label: t.tabInfra },
    { key: 'water',     icon: '💧', label: lang === 'th' ? 'แหล่งน้ำ' : 'Water' },
    { key: 'service',   icon: '🏥', label: t.tabService },
    { key: 'smartcity', icon: '🏙️', label: lang === 'th' ? 'Smart City' : 'Smart City' },
  ];

  return (
    <aside className="sidebar">
      {/* Header */}
      <div className="sidebar-header">
        <div className="brand-badge-container">
          <div className="brand-badge">
            <span className="brand-pulse" />
            <span>{t.badgeSmartCity || t.badgeLive}</span>
          </div>

          <div className="lang-switch">
            <button
              className={`lang-btn ${lang === 'th' ? 'active' : ''}`}
              onClick={() => setLang('th')}
            >
              🇹🇭 TH
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
            >
              🇬🇧 EN
            </button>
          </div>
        </div>

        <h1>{t.appTitle}</h1>
        <p>{t.appSubtitle}</p>
      </div>

      {/* ── Top Smart City Tab Navigation (Original Clean 5 Tabs) ── */}
      {setActiveTab && (
        <nav className="tab-nav">
          {TABS.map(tab => (
            <button
              key={tab.key}
              className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              title={tab.label}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      )}

      {/* Main Scrollable Area */}
      <div className="sidebar-scroll">

        {/* ═══════════ TAB: POI ═══════════ */}
        {activeTab === 'poi' && poiData && poiCategories && (
          <CategoryListPanel
            data={poiData}
            categories={poiCategories}
            visibleCats={poiVisible || {}}
            setVisibleCats={setPoiVisible || (() => {})}
            lang={lang}
            t={t}
            summaryIcon="📍"
            summaryLabel={t.poiHeader}
            onItemClick={onSelectFeature}
            datasetType="poi"
            onAddFeature={onAddFeature}
            onEditFeature={onEditFeature}
            onDeleteFeature={onDeleteFeature}
            onResetData={onResetData}
            onExportData={onExportData}
          />
        )}

        {/* ═══════════ TAB: INFRASTRUCTURE ═══════════ */}
        {activeTab === 'infra' && infraData && infraCategories && (
          <>
          <CategoryListPanel
            data={infraData}
            categories={infraCategories}
            visibleCats={infraVisible || {}}
            setVisibleCats={setInfraVisible || (() => {})}
            lang={lang}
            t={t}
            summaryIcon="🏗️"
            summaryLabel={t.infraHeader}
            onItemClick={onSelectFeature}
            datasetType="infra"
            onAddFeature={onAddFeature}
            onEditFeature={onEditFeature}
            onDeleteFeature={onDeleteFeature}
            onResetData={onResetData}
            onExportData={onExportData}
            onStartDrawRoad={onStartDrawRoad}
            onReshapeRoad={onReshapeRoad}
          />

          {/* ── Smart City Layers ── */}
          <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
              🏙️ {lang === 'th' ? 'โครงสร้างพื้นฐานเมืองอัจฉริยะ' : 'Smart City Infrastructure'}
            </div>
            {[
              { icon:'💡', label: lang==='th' ? 'เสาไฟฟ้า/ไฟส่องสว่าง' : 'Street Lights',   count: streetlightData?.features?.length || 0, color:'#facc15' },
              { icon:'💧', label: lang==='th' ? 'มิเตอร์น้ำ'           : 'Water Meters',    count: watermeterData?.features?.length  || 0, color:'#0ea5e9' },
              { icon:'⚡', label: lang==='th' ? 'หม้อแปลงไฟฟ้า'       : 'Transformers',    count: transformerData?.features?.length || 0, color:'#eab308' },
              { icon:'🗑️', label: lang==='th' ? 'ถังขยะ'              : 'Trash Bins',      count: trashbinData?.features?.length   || 0, color:'#64748b' },
              { icon:'🚒', label: lang==='th' ? 'หัวจ่ายน้ำดับเพลิง' : 'Fire Hydrants',   count: hydrantData?.features?.length    || 0, color:'#ef4444' },
              { icon:'🌊', label: lang==='th' ? 'แนวทางระบายน้ำ'      : 'Drainage Lines',  count: drainData?.features?.length      || 0, color:'#0284c7' },
              { icon:'🏢', label: lang==='th' ? 'ชั้นอาคาร'           : 'Buildings',       count: buildingData?.features?.length   || 0, color:'#94a3b8' },
            ].map((item, i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'5px 0', borderBottom: i < 6 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <div style={{ width:8, height:8, borderRadius:2, background:item.color, flexShrink:0 }}></div>
                  <span style={{ fontSize:'0.76rem', color:'#f0f4ff' }}>{item.icon} {item.label}</span>
                </div>
                <span style={{ fontSize:'0.72rem', color: item.count > 0 ? '#34d399' : '#475569', fontWeight:600 }}>
                  {item.count > 0 ? `${item.count} จุด` : 'ว่างเปล่า'}
                </span>
              </div>
            ))}
          </div>

          {/* ── ขอบเขตเทศบาล ── */}
          <div style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:10, padding:'10px 14px' }}>
            <div style={{ fontSize:'0.72rem', fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:8 }}>
              🗺️ {lang === 'th' ? 'ขอบเขตการปกครอง' : 'Administrative Boundary'}
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0' }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <svg width="28" height="10"><line x1="0" y1="5" x2="8" y2="5" stroke="#888" strokeWidth="1.5" strokeDasharray="4,2"/><circle cx="12" cy="5" r="1.5" fill="#888"/><line x1="16" y1="5" x2="28" y2="5" stroke="#888" strokeWidth="1.5" strokeDasharray="4,2"/></svg>
                <span style={{ fontSize:'0.78rem', fontWeight:600, color:'#f0f4ff' }}>
                  {lang === 'th' ? 'แนวเขตเทศบาลตำบลเด่นชัย' : 'Denchai Municipal Boundary'}
                </span>
              </div>
              <span style={{ fontSize:'0.72rem', color:'#34d399', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', padding:'2px 8px', borderRadius:99 }}>
                {lang === 'th' ? 'แสดงตลอด' : 'Always On'}
              </span>
            </div>
          </div>
          </>
        )}

        {/* ═══════════ TAB: WATER BODIES (POLYGON) ═══════════ */}
        {activeTab === 'water' && waterData && waterCategories && (
          <CategoryListPanel
            data={waterData}
            categories={waterCategories}
            visibleCats={waterVisible || {}}
            setVisibleCats={setWaterVisible || (() => {})}
            lang={lang}
            t={t}
            summaryIcon="💧"
            summaryLabel={t.waterHeader || 'แหล่งน้ำและแหล่งกักเก็บน้ำ'}
            onItemClick={onSelectFeature}
            datasetType="water"
            onAddFeature={onAddFeature}
            onEditFeature={onEditFeature}
            onDeleteFeature={onDeleteFeature}
            onResetData={onResetData}
            onExportData={onExportData}
            onStartDrawWater={onStartDrawWater}
            onReshapeRoad={onReshapeRoad}
          />
        )}

        {/* ═══════════ TAB: PUBLIC SERVICES ═══════════ */}
        {activeTab === 'service' && serviceData && serviceCategories && (
          <CategoryListPanel
            data={serviceData}
            categories={serviceCategories}
            visibleCats={serviceVisible || {}}
            setVisibleCats={setServiceVisible || (() => {})}
            lang={lang}
            t={t}
            summaryIcon="🏥"
            summaryLabel={t.serviceHeader}
            onItemClick={onSelectFeature}
            datasetType="service"
            onAddFeature={onAddFeature}
            onEditFeature={onEditFeature}
            onDeleteFeature={onDeleteFeature}
            onResetData={onResetData}
            onExportData={onExportData}
          />
        )}

        {/* ═══════════ TAB: SMART CITY ═══════════ */}
        {activeTab === 'smartcity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Header */}
            <div style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 10, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 24 }}>🏙️</span>
              <div>
                <div style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>Smart City Layers</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#f0f4ff' }}>โครงสร้างพื้นฐานเมือง</div>
              </div>
            </div>

            {/* Summary stats */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { icon:'💡', label:'เสาไฟฟ้า',    count: streetlightData?.features?.length || 0 },
                { icon:'💧', label:'มิเตอร์น้ำ',   count: watermeterData?.features?.length  || 0 },
                { icon:'⚡', label:'หม้อแปลง',     count: transformerData?.features?.length || 0 },
                { icon:'🗑️', label:'ถังขยะ',       count: trashbinData?.features?.length   || 0 },
                { icon:'🚒', label:'หัวจ่ายน้ำ',   count: hydrantData?.features?.length    || 0 },
                { icon:'🌊', label:'ระบายน้ำ',     count: drainData?.features?.length      || 0 },
              ].map((item, i) => (
                <div key={i} style={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.08)', borderRadius:8, padding:'8px 10px', display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:'1rem' }}>{item.icon}</span>
                  <div>
                    <div style={{ fontSize:'0.68rem', color:'#64748b' }}>{item.label}</div>
                    <div style={{ fontSize:'0.9rem', fontWeight:700, color: item.count > 0 ? '#34d399' : '#475569' }}>{item.count} <span style={{ fontSize:'0.65rem', fontWeight:400 }}>จุด</span></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Link to infra tab */}
            <button onClick={() => setActiveTab('infra')} style={{ padding:'10px', borderRadius:8, background:'linear-gradient(135deg,#2563eb,#3b82f6)', border:'none', color:'#fff', fontWeight:700, fontSize:'0.8rem', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
              🏗️ {lang === 'th' ? 'ดูรายละเอียดใน Tab โครงสร้างพื้นฐาน' : 'View in Infrastructure Tab'} →
            </button>

            {/* GitHub Sync Panel */}
            <GitHubSyncPanel lang={lang} />

            {/* Info box */}
            <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '10px 14px', fontSize: '0.76rem', color: '#93c5fd', lineHeight: 1.6 }}>
              💡 {lang === 'th' ? 'เพิ่มข้อมูลได้ผ่าน Editor Studio → เลือก Layer → วาดจุดบนแผนที่' : 'Add data via Editor Studio → Select Layer → Draw on map'}
            </div>
          </div>
        )}

        {/* ═══════════ TAB: SOLAR POTENTIAL (Original Dashboard) ═══════════ */}
        {activeTab === 'solar' && (
          <>
            {/* Rooftop Solar Action Toolbar */}
            <div style={{
              background: 'rgba(30, 41, 59, 0.7)', border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 12, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)'
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fcd34d', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <SunMedium size={16} color="#eab308" />
                  <span>{lang === 'th' ? 'การจัดการผืนหลังคาโซลาร์' : 'Rooftop Management'}</span>
                </div>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 500 }}>
                  {geoData?.features?.length || 0} {lang === 'th' ? 'ผืน' : 'facets'}
                </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                style={{
                  width: '100%', justifyContent: 'center', padding: '8px 10px',
                  fontSize: '0.78rem', fontWeight: 700, gap: 6,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', boxShadow: '0 2px 8px rgba(245,158,11,0.3)'
                }}
                onClick={() => onStartDrawRoof?.()}
              >
                ☀️ {lang === 'th' ? '+ วาดหลังคาโซลาร์ใหม่' : '+ Draw Solar Roof'}
              </button>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                {onExportData && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '5px 6px' }}
                    onClick={() => onExportData('solar')}
                    title="Export Rooftop GeoJSON"
                  >
                    <Download size={12} /> {lang === 'th' ? 'ส่งออก GeoJSON' : 'Export'}
                  </button>
                )}
                {onResetData && (
                  <button
                    type="button"
                    className="btn btn-sm"
                    style={{ justifyContent: 'center', fontSize: '0.72rem', padding: '5px 6px', color: '#94a3b8' }}
                    onClick={() => onResetData('solar')}
                    title="Reset to default rooftop data"
                  >
                    🔄 {lang === 'th' ? 'รีเซ็ตข้อมูล' : 'Reset'}
                  </button>
                )}
              </div>
            </div>

            {/* View Mode & Color Mode Selector */}
            <div>
              <div className="section-title">{t.viewMode}</div>
              <div className="segmented-control">
                <button
                  className={`segmented-item ${viewMode === 'facets' ? 'active' : ''}`}
                  onClick={() => setViewMode('facets')}
                >
                  {t.viewFacets}
                </button>
                <button
                  className={`segmented-item ${viewMode === 'buildings' ? 'active' : ''}`}
                  onClick={() => setViewMode('buildings')}
                >
                  {t.viewBuildings}
                </button>
              </div>
            </div>

            <div>
              <div className="section-title">{t.colorMode}</div>
              <div className="segmented-control">
                <button
                  className={`segmented-item ${colorMode === 'class' ? 'active' : ''}`}
                  onClick={() => setColorMode('class')}
                >
                  {t.colorClass}
                </button>
                <button
                  className={`segmented-item ${colorMode === 'energy' ? 'active' : ''}`}
                  onClick={() => setColorMode('energy')}
                >
                  {t.colorEnergy}
                </button>
              </div>
            </div>

            {/* Solar Financial & Environmental KPI Cards */}
            <div>
              <div className="section-title">
                <span>{lang === 'th' ? 'ศักยภาพและผลตอบแทนรวม' : 'Solar & ROI Summary'}</span>
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    setTempTariff(tariff);
                    setTempSystemCost(systemCostPerKwp);
                    setShowRoiModal(true);
                  }}
                  title={t.roiSettings}
                >
                  <Settings2 size={12} /> {lang === 'th' ? 'ตั้งค่า ROI' : 'ROI Settings'}
                </button>
              </div>

              <div className="stats-grid">
                <div className="stat-card full-width highlight">
                  <div className="stat-label">
                    <SunMedium size={13} color="#10b981" />
                    {t.kpiTotalEnergy}
                  </div>
                  <div className="stat-value energy">
                    {fmtEnergy(stats.totalEnergy)}
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">
                    <DollarSign size={13} color="#38bdf8" />
                    {t.kpiTotalSavings}
                  </div>
                  <div className="stat-value savings">
                    {(annualSavingsThb / 1e6).toFixed(2)}
                    <span className="stat-unit">{t.unitMillionThb}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">
                    <TrendingUp size={13} color="#f59e0b" />
                    {t.kpiPaybackPeriod}
                  </div>
                  <div className="stat-value">
                    {paybackYears}
                    <span className="stat-unit">{t.unitYears}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">
                    <Leaf size={13} color="#34d399" />
                    {t.kpiCarbonOffset}
                  </div>
                  <div className="stat-value">
                    {fmt(co2ReductionTons)}
                    <span className="stat-unit">{t.unitTonsPerYear}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">
                    <Leaf size={13} color="#22c55e" />
                    {t.kpiTreeEquivalent}
                  </div>
                  <div className="stat-value">
                    {fmt(treesEquivalent)}
                    <span className="stat-unit">{t.unitTrees}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">
                    <Home size={13} color="#a855f7" />
                    {t.kpiTotalArea}
                  </div>
                  <div className="stat-value">
                    {fmt(stats.totalArea)}
                    <span className="stat-unit">{t.unitSqM}</span>
                  </div>
                </div>

                <div className="stat-card">
                  <div className="stat-label">
                    <Zap size={13} color="#eab308" />
                    {t.kpiBuildingCount}
                  </div>
                  <div className="stat-value">
                    {fmt(stats.count)}
                    <span className="stat-unit">{t.unitItems}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Energy Yield by Direction Chart */}
            {chartData.length > 0 && (
              <div>
                <div className="section-title">{lang === 'th' ? 'พลังงานตามทิศหลังคา (kWh/ปี)' : 'Energy by Roof Orientation'}</div>
                <div className="chart-container">
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 20 }}>
                      <XAxis
                        dataKey="name"
                        tick={{ fill: '#64748b', fontSize: 10 }}
                        angle={-25}
                        textAnchor="end"
                        interval={0}
                      />
                      <YAxis hide />
                      <Tooltip
                        formatter={(val, name, item) => [fmtEnergy(val), item.payload.name]}
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: 8, color: '#fff', fontSize: '0.75rem' }}
                      />
                      <Bar dataKey="energy" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Sliders & Spatial Filtering */}
            <div>
              <div className="section-title">{t.filterHeader}</div>
              <div className="slider-container">
                <div className="slider-header">
                  <span className="slider-label">{t.minArea}</span>
                  <span className="slider-value">{filters.minArea} {t.unitSqM}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="10"
                  value={filters.minArea}
                  onChange={(e) => setFilters(f => ({ ...f, minArea: Number(e.target.value) }))}
                />
              </div>

              <div className="slider-container">
                <div className="slider-header">
                  <span className="slider-label">{t.minEnergy}</span>
                  <span className="slider-value">{fmt(filters.minEnergy)} kWh</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100000"
                  step="5000"
                  value={filters.minEnergy}
                  onChange={(e) => setFilters(f => ({ ...f, minEnergy: Number(e.target.value) }))}
                />
              </div>

              {(filters.minArea > 0 || filters.minEnergy > 0) && (
                <button
                  className="btn btn-sm"
                  style={{ width: '100%', marginTop: 8 }}
                  onClick={() => setFilters({ minArea: 0, minEnergy: 0 })}
                >
                  {t.resetFilters}
                </button>
              )}
            </div>

            {/* Roof Direction Layer Toggles */}
            <div>
              <div className="section-title">
                <span>{t.roofClassesHeader}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn-text" onClick={() => toggleAllLayers(true)}>{t.selectAll}</button>
                  <span style={{ color: '#cbd5e1' }}>|</span>
                  <button className="btn-text" onClick={() => toggleAllLayers(false)}>{t.deselectAll}</button>
                </div>
              </div>

              <div className="layer-list">
                {Object.entries(ROOF_CLASSES).map(([cid, meta]) => {
                  const isChecked = visibleLayers[cid] !== false;
                  const count = stats.byCls[cid]?.count || 0;
                  const className = t.classes?.[cid] || meta.name;

                  return (
                    <label key={cid} className={`layer-item ${!isChecked ? 'inactive' : ''}`}>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleLayer(cid)}
                      />
                      <span className="layer-color-dot" style={{ background: meta.color }} />
                      <span className="layer-name">{className}</span>
                      <span className="layer-count">({count})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Print & Export Report */}
            <div>
              <div className="section-title">{t.exportHeader}</div>
              <button
                className="btn btn-primary"
                style={{ width: '100%', justifyContent: 'center', gap: 8 }}
                onClick={() => window.print()}
              >
                <Printer size={15} />
                {t.exportReport}
              </button>
            </div>
          </>
        )}

        {/* ── GIS Templates Center Quick Access Button (Always accessible at bottom) ── */}
        <div style={{
          background: 'linear-gradient(135deg, #f0fdf4, #eff6ff)', border: '1px solid #bfdbfe',
          borderRadius: 10, padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          marginTop: 8, flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <FolderDown size={18} color="#2563eb" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.76rem', color: '#1e3a8a' }}>
                {lang === 'th' ? 'แม่แบบชั้นข้อมูล GIS (16 หมวด)' : 'GIS Layer Templates (16)'}
              </div>
              <div style={{ fontSize: '0.66rem', color: '#64748b' }}>
                {lang === 'th' ? 'GeoJSON Template & CSV Data Dictionary' : 'Standard GeoJSON & CSV for Excel'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-sm"
            style={{ background: '#2563eb', color: '#ffffff', fontSize: '0.7rem', fontWeight: 600, padding: '5px 9px', border: 'none' }}
            onClick={() => setShowTemplatesModal(true)}
          >
            📥 {lang === 'th' ? 'ดาวน์โหลด' : 'Download'}
          </button>
        </div>

      </div>

      {/* ── Solar Economic ROI Settings Modal ── */}
      {showRoiModal && (
        <div className="modal-backdrop" onClick={() => setShowRoiModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 700 }}>
                <Settings2 size={18} color="#2563eb" />
                <span>{t.roiSettings}</span>
              </div>
              <button className="modal-close-btn" onClick={() => setShowRoiModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  {t.tariffRate}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempTariff}
                  onChange={(e) => setTempTariff(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#475569', marginBottom: 4 }}>
                  {t.systemCost}
                </label>
                <input
                  type="number"
                  step="1000"
                  value={tempSystemCost}
                  onChange={(e) => setTempSystemCost(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #cbd5e1',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 10 }}>
                <button className="btn btn-sm" onClick={() => setShowRoiModal(false)}>
                  {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => {
                    setTariff(tempTariff);
                    setSystemCostPerKwp(tempSystemCost);
                    setShowRoiModal(false);
                  }}
                >
                  {t.applyRoi}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GIS Layer Templates & Data Dictionary Download Modal ── */}
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
    </aside>
  );
}
