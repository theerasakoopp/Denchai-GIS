import React, { useMemo, useRef, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  Zap, Home, Upload, Layers, SunMedium, X, MapPin,
  TrendingUp, Leaf, DollarSign, Settings2, Download, Printer,
  Building2, HeartPulse, Navigation
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

  const isBuildings = viewMode === 'buildings';

  for (const f of geoData.features) {
    const p = f.properties;
    if (!p) continue;

    if (!isBuildings) {
      if (!visibleLayers[p.class_id]) continue;
    }

    const area = p.area_3d || p.area_2d || 0;
    const correctedEnergy = p.energy_corrected_kwh || p.energy_kwh || 0;
    const cap = p.capacity_kwp || ((area * 0.18) * 0.20);

    if (filters.minArea > 0 && area < filters.minArea) continue;
    if (filters.minEnergy > 0 && correctedEnergy < filters.minEnergy) continue;

    if (boundary && boundary.features && boundary.features.length > 0) {
      try {
        const pt = turf.centroid(f);
        const inside = boundary.features.some(bf =>
          turf.booleanPointInPolygon(pt, bf)
        );
        if (!inside) continue;
      } catch { continue; }
    }

    totalArea += area;
    totalEnergy += correctedEnergy;
    totalCapacity += cap;
    count++;

    if (p.class_id && byCls[p.class_id]) {
      byCls[p.class_id].area += area;
      byCls[p.class_id].energy += correctedEnergy;
      byCls[p.class_id].capacity += cap;
      byCls[p.class_id].count++;
    }
  }

  return { totalArea, totalEnergy, totalCapacity, count, byCls };
}

// ── Category List Panel (reusable for POI/Infra/Service) ──
function CategoryListPanel({
  data, categories, visibleCats, setVisibleCats,
  lang, t, summaryIcon, summaryLabel, onItemClick
}) {
  const grouped = useMemo(() => {
    if (!data?.features) return {};
    const g = {};
    for (const f of data.features) {
      const cat = f.properties.category || 'other';
      if (!g[cat]) g[cat] = [];
      g[cat].push(f);
    }
    return g;
  }, [data]);

  const totalCount = data?.features?.length || 0;

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
      <div className="tab-summary-card">
        <div className="summary-icon">{summaryIcon}</div>
        <div className="summary-text">
          <div className="summary-title">{summaryLabel}</div>
          <div className="summary-value">{totalCount} <span style={{ fontSize: '0.75rem', fontWeight: 500, color: '#94a3b8' }}>{t.poiCount}</span></div>
        </div>
      </div>

      {/* Show/Hide All */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <button className="btn btn-sm" onClick={showAll}>{t.poiShowAll}</button>
        <button className="btn btn-sm" onClick={hideAll}>{t.poiHideAll}</button>
      </div>

      {/* Category Groups */}
      {Object.entries(categories).map(([catKey, catMeta]) => {
        const items = grouped[catKey] || [];
        const isVisible = visibleCats[catKey] !== false;

        return (
          <div className="category-group" key={catKey}>
            <div className="category-header" onClick={() => toggleCat(catKey)}>
              <div className="cat-label">
                <div className="cat-dot" style={{ background: catMeta.color, boxShadow: `0 0 6px ${catMeta.color}40` }} />
                <span>{catMeta.icon} {lang === 'th' ? catMeta.name_th : catMeta.name_en}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="cat-count">{items.length}</span>
                <div className={`toggle-switch ${isVisible ? 'on' : ''}`} />
              </div>
            </div>
            {isVisible && items.length > 0 && (
              <div className="category-items">
                {items.map(item => (
                  <div
                    className="category-item"
                    key={item.properties.id}
                    onClick={() => onItemClick?.(item)}
                  >
                    <span className="item-name">
                      {lang === 'th' ? item.properties.name_th : item.properties.name_en}
                    </span>
                    <Navigation size={11} color="#64748b" />
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
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
  activeTab = 'solar', setActiveTab,
  poiData, poiCategories,
  infraData, infraCategories,
  serviceData, serviceCategories,
  poiVisible, setPoiVisible,
  infraVisible, setInfraVisible,
  serviceVisible, setServiceVisible,
  onSelectFeature,
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
              <div style={{ width: '100%', height: 140, background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '10px 0' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, fontSize: 11 }}
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

      {/* Solar ROI Settings Modal */}
      {showRoiModal && (
        <div className="modal-overlay" onClick={() => setShowRoiModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: 8 }}>
                <Settings2 size={18} color="#38bdf8" />
                {t.roiSettings}
              </h3>
              <button
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                onClick={() => setShowRoiModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                  {t.tariffRate}
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={tempTariff}
                  onChange={e => setTempTariff(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontSize: '0.9rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#cbd5e1', display: 'block', marginBottom: 6 }}>
                  {t.systemCost}
                </label>
                <input
                  type="number"
                  step="1000"
                  value={tempSystemCost}
                  onChange={e => setTempSystemCost(Number(e.target.value))}
                  style={{
                    width: '100%', padding: '9px 12px', background: 'rgba(0,0,0,0.4)',
                    border: '1px solid var(--border)', borderRadius: 8, color: '#fff', fontSize: '0.9rem'
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
