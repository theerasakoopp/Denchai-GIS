import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Zap, Home, Upload, Layers, SunMedium, X, MapPin,
  TrendingUp, Leaf, DollarSign, Settings2, Download, Printer,
  Building2, HeartPulse, Navigation, Search, ChevronDown, ChevronRight
} from 'lucide-react';
import { ROOF_CLASSES } from '../App';
import { translations } from '../translations';
import * as turf from '@turf/turf';
import shp from 'shpjs';

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

  let targetFeatures = geoData.features;
  if (boundary && boundary.features && boundary.features.length > 0) {
    try {
      const boundaryPoly = boundary.features[0];
      targetFeatures = targetFeatures.filter(f => {
        try {
          return turf.booleanPointInPolygon(turf.centroid(f), boundaryPoly);
        } catch {
          return true;
        }
      });
    } catch {
      targetFeatures = geoData.features;
    }
  }

  const minArea = Number(filters?.minArea) || 0;
  const minEnergy = Number(filters?.minEnergy) || 0;

  for (const f of targetFeatures) {
    const p = f.properties;
    if (!p) continue;
    if (visibleLayers && visibleLayers[p.class_id] === false) continue;

    const area = Number(p.area_3d || p.area_2d || 0);
    const energy = Number(p.energy_corrected_kwh || p.energy_kwh || 0);
    const capacity = Number(p.capacity_kwp || ((area * 0.18) * 0.20));

    if (minArea > 0 && area < minArea) continue;
    if (minEnergy > 0 && energy < minEnergy) continue;

    totalArea += area;
    totalEnergy += energy;
    totalCapacity += capacity;
    count++;

    const clsId = p.class_id || 6;
    if (byCls[clsId]) {
      byCls[clsId].area += area;
      byCls[clsId].energy += energy;
      byCls[clsId].capacity += capacity;
      byCls[clsId].count++;
    }
  }

  return { totalArea, totalEnergy, totalCapacity, count, byCls };
}

function calculateFinancials(stats, tariff, systemCostPerKwp) {
  const annualSavingsTHB = stats.totalEnergy * tariff;
  const initialCostTHB = stats.totalCapacity * systemCostPerKwp;
  const paybackYears = annualSavingsTHB > 0 ? (initialCostTHB / annualSavingsTHB).toFixed(1) : 'N/A';
  const co2ReductionTons = (stats.totalEnergy * 0.4999) / 1000;
  const treesEquivalent = Math.round(co2ReductionTons * 45);

  return {
    annualSavingsTHB,
    initialCostTHB,
    paybackYears,
    co2ReductionTons,
    treesEquivalent,
  };
}

// ── Category List Panel (reusable for POI/Infra/Service) ──
function CategoryListPanel({
  data, categories, visibleCats, setVisibleCats,
  lang, t, summaryIcon, summaryLabel, onItemClick,
  datasetType = 'poi',
  onAddFeature, onEditFeature, onDeleteFeature,
  onResetData, onExportData
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
      const p = f.properties;
      const cat = p.category || 'other';

      // Apply category chip filter
      if (selectedCatFilter !== 'all' && cat !== selectedCatFilter) continue;

      // Apply search filter
      if (term) {
        const nameTh = (p.name_th || '').toLowerCase();
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
      {/* Summary Card */}
      <div className="tab-summary-card" style={{ flexShrink: 0 }}>
        <div className="summary-icon">{summaryIcon}</div>
        <div className="summary-text">
          <div className="summary-title">{summaryLabel}</div>
          <div className="summary-value">
            {totalCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>{t.poiCount}</span>
          </div>
        </div>
      </div>

      {/* Editor Action Toolbar */}
      <div style={{
        background: '#f8fafc', border: '1px solid var(--border-subtle)',
        borderRadius: 10, padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8,
        flexShrink: 0
      }}>
        {onAddFeature && (
          <button
            type="button"
            className="btn btn-primary"
            style={{
              width: '100%', justifyContent: 'center', padding: '8px 12px',
              fontSize: '0.82rem', fontWeight: 600, gap: 6,
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
              boxShadow: '0 2px 6px rgba(37,99,235,0.25)'
            }}
            onClick={() => onAddFeature(datasetType)}
          >
            {datasetType === 'poi' ? t.addPoiBtn
             : datasetType === 'infra' ? t.addInfraBtn
             : t.addServiceBtn}
          </button>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
          {onExportData && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ justifyContent: 'center', fontSize: '0.75rem', padding: '5px 8px' }}
              onClick={() => onExportData(datasetType)}
              title="Export GeoJSON"
            >
              <Download size={12} /> {t.exportPoiBtn || 'Export'}
            </button>
          )}
          {onResetData && (
            <button
              type="button"
              className="btn btn-sm"
              style={{ justifyContent: 'center', fontSize: '0.75rem', padding: '5px 8px', color: '#64748b' }}
              onClick={() => onResetData(datasetType)}
              title="Reset Default"
            >
              🔄 {t.resetPoiBtn || 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-input-wrap">
        <Search size={14} color="#64748b" style={{ flexShrink: 0 }} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder={lang === 'th' ? 'ค้นหาชื่อสถานที่, โรงพยาบาล, วัด, ร้านยา...' : 'Search places, hospital, temples...'}
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex' }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* Category Quick Filter Chips */}
      <div className="category-chip-bar">
        <button
          type="button"
          className={`category-chip ${selectedCatFilter === 'all' ? 'active' : ''}`}
          onClick={() => setSelectedCatFilter('all')}
        >
          {lang === 'th' ? 'ทั้งหมด' : 'All'} ({totalCount})
        </button>
        {Object.entries(categories).map(([catKey, catMeta]) => {
          const count = (data?.features || []).filter(f => f.properties?.category === catKey).length;
          if (count === 0) return null;
          return (
            <button
              key={catKey}
              type="button"
              className={`category-chip ${selectedCatFilter === catKey ? 'active' : ''}`}
              onClick={() => setSelectedCatFilter(catKey)}
            >
              <span>{catMeta.icon}</span>
              <span>{lang === 'th' ? catMeta.name_th.split('/')[0] : catMeta.name_en}</span>
              <span style={{ opacity: 0.7, fontSize: '0.65rem' }}>({count})</span>
            </button>
          );
        })}
      </div>

      {/* Layer Control Bar & Accordion Control */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '0 2px', flexShrink: 0
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: '0.74rem', fontWeight: 600, color: 'var(--text-sub)' }}>
            {lang === 'th' ? 'ชั้นข้อมูล' : 'Layers'} ({filteredCount})
          </span>
          <button
            type="button"
            className="btn btn-sm"
            style={{ padding: '2px 6px', fontSize: '0.65rem' }}
            onClick={Object.keys(expandedCats).length > 0 ? collapseAll : expandAll}
          >
            {Object.keys(expandedCats).length > 0 ? (lang === 'th' ? 'พับทั้งหมด' : 'Collapse') : (lang === 'th' ? 'ขยายทั้งหมด' : 'Expand')}
          </button>
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button className="btn btn-sm" style={{ padding: '3px 7px', fontSize: '0.68rem' }} onClick={showAll}>{t.poiShowAll}</button>
          <button className="btn btn-sm" style={{ padding: '3px 7px', fontSize: '0.68rem' }} onClick={hideAll}>{t.poiHideAll}</button>
        </div>
      </div>

      {/* Category Groups Container */}
      <div className="category-groups-container">
        {Object.entries(categories).map(([catKey, catMeta]) => {
          if (selectedCatFilter !== 'all' && selectedCatFilter !== catKey) return null;
          const items = grouped[catKey] || [];
          const isVisible = visibleCats[catKey] !== false;
          const isExpanded = searchTerm ? items.length > 0 : !!expandedCats[catKey];

          if (searchTerm && items.length === 0) return null;

          return (
            <div className="category-group" key={catKey}>
              <div
                className="category-header"
                onClick={() => toggleAccordion(catKey)}
                title={lang === 'th' ? 'คลิกเพื่อขยาย/พับรายชื่อ' : 'Click to expand/collapse'}
              >
                <div className="cat-label">
                  <div className="cat-dot" style={{ background: catMeta.color, boxShadow: `0 0 6px ${catMeta.color}40` }} />
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    {isExpanded ? <ChevronDown size={13} color="#64748b" /> : <ChevronRight size={13} color="#64748b" />}
                    <span>{catMeta.icon} {lang === 'th' ? catMeta.name_th : catMeta.name_en}</span>
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span className="cat-count">{items.length}</span>
                  <div
                    className={`toggle-switch ${isVisible ? 'on' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCat(catKey);
                    }}
                    title={lang === 'th' ? 'เปิด-ปิดชั้นข้อมูลบนแผนที่' : 'Toggle map layer'}
                  />
                </div>
              </div>

              {isExpanded && items.length > 0 && (
                <div className="category-items">
                  {items.map(item => (
                    <div
                      className="category-item"
                      key={item.properties.id}
                    >
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, cursor: 'pointer', overflow: 'hidden' }}
                        onClick={() => onItemClick?.(item)}
                        title={lang === 'th' ? item.properties.name_th : item.properties.name_en}
                      >
                        <Navigation size={11} color="#3b82f6" style={{ flexShrink: 0 }} />
                        <span className="item-name">
                          {lang === 'th' ? item.properties.name_th : item.properties.name_en}
                        </span>
                      </div>

                      {/* Quick action buttons */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
                        {onEditFeature && (
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            style={{
                              background: 'none', border: 'none', padding: '3px 4px',
                              cursor: 'pointer', borderRadius: 4, color: '#64748b',
                              display: 'flex', alignItems: 'center', fontSize: '0.75rem'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditFeature(item, datasetType);
                            }}
                            title={t.editPoiBtn || 'Edit'}
                          >
                            ✏️
                          </button>
                        )}
                        {onDeleteFeature && (
                          <button
                            type="button"
                            className="btn-icon-subtle"
                            style={{
                              background: 'none', border: 'none', padding: '3px 4px',
                              cursor: 'pointer', borderRadius: 4, color: '#ef4444',
                              display: 'flex', alignItems: 'center', fontSize: '0.75rem'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (window.confirm(t.confirmDelete || 'คุณต้องการลบสถานที่นี้ใช่หรือไม่?')) {
                                onDeleteFeature(item.properties.id, datasetType);
                              }
                            }}
                            title={t.deletePlace || 'Delete'}
                          >
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export default function Sidebar({
  geoData, filters, setFilters,
  visibleLayers, toggleLayer, toggleAllLayers,
  uploadedBoundary, setUploadedBoundary,
  colorMode, setColorMode,
  viewMode, setViewMode,
  lang, setLang,
  tariff, setTariff,
  systemCostPerKwp, setSystemCostPerKwp,
  // Smart City tab props
  activeTab = 'poi', setActiveTab,
  poiData, poiCategories,
  infraData, infraCategories,
  serviceData, serviceCategories,
  poiVisible, setPoiVisible,
  infraVisible, setInfraVisible,
  serviceVisible, setServiceVisible,
  onSelectFeature,
  onAddFeature,
  onEditFeature,
  onDeleteFeature,
  onResetData,
  onExportData,
}) {
  const t = translations[lang] || translations.th;
  const fileInputRef = useRef();
  const [showRoiModal, setShowRoiModal] = useState(false);
  const [tempTariff, setTempTariff] = useState(tariff);
  const [tempSystemCost, setTempSystemCost] = useState(systemCostPerKwp);

  const stats = useMemo(
    () => applyFilters(geoData, filters, visibleLayers, uploadedBoundary, viewMode),
    [geoData, filters, visibleLayers, uploadedBoundary, viewMode]
  );

  // Financial and environmental calculations
  const annualSavingsThb = stats.totalEnergy * tariff;
  const totalInvestmentThb = stats.totalCapacity * systemCostPerKwp;
  const paybackYears = annualSavingsThb > 0 ? (totalInvestmentThb / annualSavingsThb).toFixed(1) : '-';
  const co2ReductionTons = (stats.totalEnergy * 0.4999) / 1000; // 0.4999 kg CO2/kWh
  const treesEquivalent = Math.round(co2ReductionTons * 45); // ~45 trees per ton CO2

  const isBuildings = viewMode === 'buildings';

  const chartData = isBuildings
    ? [
        { name: '< 5 kWp', energy: Math.round(stats.totalEnergy * 0.3 / 1e3), color: '#22c55e' },
        { name: '5-20 kWp', energy: Math.round(stats.totalEnergy * 0.5 / 1e3), color: '#38bdf8' },
        { name: '≥ 20 kWp', energy: Math.round(stats.totalEnergy * 0.2 / 1e3), color: '#f97316' },
      ]
    : Object.entries(ROOF_CLASSES).map(([id, cls]) => ({
        name: t.classes[id] ? t.classes[id].split(' ')[0] : cls.name,
        energy: Math.round((stats.byCls[id]?.energy || 0) / 1e3), // MWh
        color: cls.color,
      }));

  // Upload AOI
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      let geojson;
      if (file.name.endsWith('.zip')) {
        const buffer = await file.arrayBuffer();
        geojson = await shp(buffer);
        if (Array.isArray(geojson)) geojson = geojson[0];
      } else if (file.name.endsWith('.geojson') || file.name.endsWith('.json')) {
        const text = await file.text();
        geojson = JSON.parse(text);
      } else {
        alert(lang === 'th' ? 'รองรับเฉพาะไฟล์ .zip (Shapefile) หรือ .geojson' : 'Only .zip (Shapefile) or .geojson files are supported.');
        return;
      }

      if (geojson && (geojson.type === 'FeatureCollection' || geojson.type === 'Feature')) {
        const standardGeoJSON = geojson.type === 'Feature'
          ? { type: 'FeatureCollection', features: [geojson] }
          : geojson;
        setUploadedBoundary(standardGeoJSON);
      }
    } catch (err) {
      console.error(err);
      alert(lang === 'th' ? 'ไม่สามารถอ่านไฟล์ได้ กรุณาตรวจสอบความถูกต้อง' : 'Failed to parse file.');
    }
  };

  // Export CSV
  const exportCsv = () => {
    if (!geoData || !geoData.features) return;
    const headers = ['ID', 'Type', 'Area_3D_sqm', 'Slope_deg', 'Capacity_kWp', 'Energy_kWh_yr', 'Est_Savings_THB_yr'];
    const rows = geoData.features.map(f => {
      const p = f.properties;
      return [
        p.id || p.building_id || '',
        p.class_name || p.class_id || '',
        p.area_3d || p.area_2d || 0,
        p.slope_deg || '',
        p.capacity_kwp || 0,
        Math.round(p.energy_corrected_kwh || p.energy_kwh || 0),
        Math.round((p.energy_corrected_kwh || p.energy_kwh || 0) * tariff)
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Denchai_Solar_GIS_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export GeoJSON
  const exportGeoJson = () => {
    if (!geoData) return;
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(geoData));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    dlAnchorElem.setAttribute('download', `Denchai_Solar_GIS_${Date.now()}.geojson`);
    dlAnchorElem.click();
  };

  // ── Tab definitions ──
  const TABS = [
    { key: 'poi',     icon: '📍', lucide: <MapPin size={15} />,     label: t.tabPoi },
    { key: 'infra',   icon: '🏗️', lucide: <Building2 size={15} />,  label: t.tabInfra },
    { key: 'service', icon: '🏥', lucide: <HeartPulse size={15} />, label: t.tabService },
    { key: 'solar',   icon: '☀️', lucide: <SunMedium size={15} />,  label: t.tabSolar },
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

      {/* ── Smart City Tab Navigation ── */}
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

        {/* ═══════════ TAB: SOLAR POTENTIAL (Original Content) ═══════════ */}
        {activeTab === 'solar' && (
          <>
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
                    <Home size={13} color="#a78bfa" />
                    {t.kpiBuildingCount}
                  </div>
                  <div className="stat-value">
                    {fmt(stats.count)}
                    <span className="stat-unit">{t.unitItems}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Energy Yield Chart */}
            <div>
              <div className="section-title">
                <span>{isBuildings ? (lang === 'th' ? 'สัดส่วนขนาดกำลังผลิต' : 'Capacity Distribution') : (lang === 'th' ? 'พลังงานแยกตามทิศทาง (MWh/y)' : 'Energy by Roof Orientation (MWh/y)')}</span>
              </div>
              <div style={{ width: '100%', height: 140, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#0f172a', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
                      formatter={(val) => [`${fmt(val)} MWh`, 'Energy']}
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

            {/* Filters */}
            <div>
              <div className="section-title">
                <span>{t.filterHeader}</span>
                {(filters.minArea > 0 || filters.minEnergy > 0) && (
                  <button
                    className="btn btn-sm"
                    onClick={() => setFilters({ minArea: 0, minEnergy: 0 })}
                  >
                    {t.resetFilters}
                  </button>
                )}
              </div>
              <div className="filter-box">
                <div className="slider-group">
                  <div className="slider-label-row">
                    <span>{t.minArea}</span>
                    <span className="slider-val">{filters.minArea} m²</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={filters.minArea}
                    onChange={(e) => setFilters(p => ({ ...p, minArea: Number(e.target.value) }))}
                  />
                </div>

                <div className="slider-group">
                  <div className="slider-label-row">
                    <span>{t.minEnergy}</span>
                    <span className="slider-val">{fmt(filters.minEnergy)} kWh</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="30000"
                    step="500"
                    value={filters.minEnergy}
                    onChange={(e) => setFilters(p => ({ ...p, minEnergy: Number(e.target.value) }))}
                  />
                </div>
              </div>
            </div>

            {/* Roof Classification Layers (Only in facets mode) */}
            {!isBuildings && (
              <div>
                <div className="section-title">
                  <span>{t.roofClassesHeader}</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="btn btn-sm" onClick={() => toggleAllLayers(true)}>{t.selectAll}</button>
                    <button className="btn btn-sm" onClick={() => toggleAllLayers(false)}>{t.deselectAll}</button>
                  </div>
                </div>
                <div className="layer-list">
                  {Object.entries(ROOF_CLASSES).map(([id, cls]) => {
                    const active = !!visibleLayers[id];
                    return (
                      <div
                        key={id}
                        className={`layer-item ${active ? 'active' : 'muted'}`}
                        onClick={() => toggleLayer(id)}
                      >
                        <div className="layer-left">
                          <div className="color-dot" style={{ background: cls.color }} />
                          <span className="layer-name">{t.classes[id] || cls.name}</span>
                        </div>
                        <span className="layer-count">{fmt(stats.byCls[id]?.count || 0)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* AOI Study Area Upload */}
            <div>
              <div className="section-title">{t.aoiHeader}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept=".zip,.geojson,.json"
                  onChange={handleFileUpload}
                />
                <button
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} /> {t.aoiUploadBtn}
                </button>

                {uploadedBoundary && (
                  <button
                    className="btn"
                    style={{ width: '100%', color: '#f87171' }}
                    onClick={() => setUploadedBoundary(null)}
                  >
                    <X size={14} /> {t.aoiRemove}
                  </button>
                )}
              </div>
            </div>

            {/* Export & Actions */}
            <div>
              <div className="section-title">{t.exportHeader}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <button className="btn" onClick={exportCsv}>
                  <Download size={13} /> {t.exportCsv}
                </button>
                <button className="btn" onClick={exportGeoJson}>
                  <Download size={13} /> GeoJSON
                </button>
                <button
                  className="btn btn-primary"
                  style={{ gridColumn: 'span 2' }}
                  onClick={() => window.print()}
                >
                  <Printer size={13} /> {t.exportReport}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Solar ROI Settings Modal (Light Theme) */}
      {showRoiModal && (
        <div className="modal-overlay" onClick={() => setShowRoiModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#0f172a', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={18} color="#2563eb" />
                {t.roiSettings}
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', color: '#64748b', cursor: 'pointer' }}
                onClick={() => setShowRoiModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  {t.tariffRate}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempTariff}
                  onChange={e => setTempTariff(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '9px 12px', background: '#f8fafc',
                    border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#475569', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                  {t.systemCost}
                </label>
                <input
                  type="number"
                  step="1000"
                  value={tempSystemCost}
                  onChange={e => setTempSystemCost(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '9px 12px', background: '#f8fafc',
                    border: '1px solid #cbd5e1', borderRadius: 8, color: '#0f172a', fontSize: '0.9rem'
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 10 }}>
                <button className="btn" onClick={() => setShowRoiModal(false)}>
                  {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
                </button>
                <button
                  className="btn btn-primary"
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
    </aside>
  );
}
