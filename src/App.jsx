import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import { Loader2 } from 'lucide-react';
import { POI_DATA, POI_CATEGORIES } from './data/poi_data';
import { INFRA_DATA, INFRA_CATEGORIES } from './data/infra_data';
import { SERVICE_DATA, SERVICE_CATEGORIES } from './data/service_data';
import './index.css';

const API = 'http://localhost:8000';

export const ROOF_CLASSES = {
  1: { name: 'N-Roof',    color: '#ef4444' }, // Red
  2: { name: 'E-Roof',    color: '#22c55e' }, // Green
  3: { name: 'S-Roof',    color: '#3b82f6' }, // Blue
  4: { name: 'W-Roof',    color: '#eab308' }, // Yellow
  5: { name: 'Flat Roof', color: '#d946ef' }, // Magenta
  6: { name: 'U-Roof',    color: '#84cc16' }, // Lime/Olive
  7: { name: 'PV Panel',  color: '#8b5cf6' }, // Violet/Purple
};

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
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      // try next path
    }
  }
  throw new Error(`Failed to load ${filename}`);
}

// ── Default dashboard: loads pre-generated GeoJSON from /public ──
function DefaultDashboard({ lang, setLang, tariff, setTariff, systemCostPerKwp, setSystemCostPerKwp }) {
  const [geoDataFacets, setGeoDataFacets] = useState(null);
  const [geoDataBuildings, setGeoDataBuildings] = useState(null);
  const [municipalBoundary, setMunicipalBoundary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ minArea: 10, minEnergy: 0 });
  const [visibleLayers, setVisibleLayers] = useState(
    Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, true]))
  );
  const [uploadedBoundary, setUploadedBoundary] = useState(null);
  const [colorMode, setColorMode] = useState('class'); // Default to Class colors
  const [viewMode, setViewMode] = useState('facets');   // Default to Roof Facet View

  // ── Smart City Tab State ──
  const [activeTab, setActiveTab] = useState('solar'); // 'poi' | 'infra' | 'service' | 'solar'
  const [selectedFeature, setSelectedFeature] = useState(null);

  // ── Layer visibility for POI/Infra/Service categories ──
  const [poiVisible, setPoiVisible] = useState(
    Object.fromEntries(Object.keys(POI_CATEGORIES).map(k => [k, true]))
  );
  const [infraVisible, setInfraVisible] = useState(
    Object.fromEntries(Object.keys(INFRA_CATEGORIES).map(k => [k, true]))
  );
  const [serviceVisible, setServiceVisible] = useState(
    Object.fromEntries(Object.keys(SERVICE_CATEGORIES).map(k => [k, true]))
  );

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        const [facets, bldgs, boundary] = await Promise.allSettled([
          fetchWithFallback('rooftop_facets.geojson'),
          fetchWithFallback('buildings.geojson'),
          fetchWithFallback('boundary.geojson')
        ]);

        if (mounted) {
          if (facets.status === 'fulfilled') setGeoDataFacets(facets.value);
          if (bldgs.status === 'fulfilled') setGeoDataBuildings(bldgs.value);
          if (boundary.status === 'fulfilled') setMunicipalBoundary(boundary.value);
        }
      } catch (err) {
        console.error("Data loading error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => { mounted = false; };
  }, []);

  const activeGeoData = viewMode === 'buildings' ? (geoDataBuildings || geoDataFacets) : (geoDataFacets || geoDataBuildings);

  const toggleLayer = (id) => setVisibleLayers(p => ({ ...p, [id]: !p[id] }));
  const toggleAllLayers = (v) =>
    setVisibleLayers(Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, v])));

  return (
    <div className="app-container">
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 5000,
          background: 'rgba(9, 13, 22, 0.85)', backdropFilter: 'blur(12px)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          gap: 16, color: '#f8fafc', fontFamily: 'Prompt, Inter, sans-serif'
        }}>
          <Loader2 size={36} color="#38bdf8" className="animate-spin" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontSize: '1.05rem', fontWeight: 600 }}>
            {lang === 'th' ? 'กำลังโหลดข้อมูล Denchai Smart City...' : 'Loading Denchai Smart City Data...'}
          </div>
          <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
            {lang === 'th' ? 'กรุณารอสักครู่ ระบบกำลังเตรียมข้อมูลภูมิสารสนเทศ' : 'Preparing GIS data layers...'}
          </div>
        </div>
      )}

      <Sidebar
        geoData={activeGeoData}
        filters={filters} setFilters={setFilters}
        visibleLayers={visibleLayers} toggleLayer={toggleLayer} toggleAllLayers={toggleAllLayers}
        uploadedBoundary={uploadedBoundary} setUploadedBoundary={setUploadedBoundary}
        colorMode={colorMode} setColorMode={setColorMode}
        viewMode={viewMode} setViewMode={setViewMode}
        lang={lang} setLang={setLang}
        tariff={tariff} setTariff={setTariff}
        systemCostPerKwp={systemCostPerKwp} setSystemCostPerKwp={setSystemCostPerKwp}
        activeTab={activeTab} setActiveTab={setActiveTab}
        poiData={POI_DATA} poiCategories={POI_CATEGORIES}
        infraData={INFRA_DATA} infraCategories={INFRA_CATEGORIES}
        serviceData={SERVICE_DATA} serviceCategories={SERVICE_CATEGORIES}
        poiVisible={poiVisible} setPoiVisible={setPoiVisible}
        infraVisible={infraVisible} setInfraVisible={setInfraVisible}
        serviceVisible={serviceVisible} setServiceVisible={setServiceVisible}
        onSelectFeature={setSelectedFeature}
      />
      <MapViewer
        facetsData={geoDataFacets}
        buildingsData={geoDataBuildings}
        filters={filters}
        visibleLayers={visibleLayers}
        uploadedBoundary={uploadedBoundary}
        municipalBoundary={municipalBoundary}
        colorMode={colorMode}
        viewMode={viewMode}
        lang={lang}
        tariff={tariff}
        activeTab={activeTab}
        poiData={POI_DATA}
        infraData={INFRA_DATA}
        serviceData={SERVICE_DATA}
        poiVisible={poiVisible}
        infraVisible={infraVisible}
        serviceVisible={serviceVisible}
        selectedFeature={selectedFeature}
      />
    </div>
  );
}

// ── Result viewer: loads GeoJSON from API job results ─────────────
function ResultDashboard({ jobId, lang, setLang, tariff, setTariff, systemCostPerKwp, setSystemCostPerKwp }) {
  const [geoData, setGeoData] = useState(null);
  const [boundary, setBoundary] = useState(null);
  const [filters, setFilters] = useState({ minArea: 10, minEnergy: 0 });
  const [visibleLayers, setVisibleLayers] = useState(
    Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, true]))
  );
  const [uploadedBoundary, setUploadedBoundary] = useState(null);
  const [colorMode, setColorMode] = useState('class');

  useEffect(() => {
    if (!jobId) return;
    fetch(`${API}/api/results/${jobId}/geojson`)
      .then(r => r.json()).then(setGeoData).catch(console.error);
    fetch(`${API}/api/results/${jobId}/boundary`)
      .then(r => r.json()).then(setBoundary).catch(() => {});
  }, [jobId]);

  const toggleLayer = (id) => setVisibleLayers(p => ({ ...p, [id]: !p[id] }));
  const toggleAllLayers = (v) =>
    setVisibleLayers(Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, v])));

  return (
    <div className="app-container">
      <div style={{
        position: 'absolute', top: 14, right: 16, zIndex: 2000,
        display: 'flex', gap: 10,
      }}>
        <Link to="/" style={{
          padding: '8px 14px', background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.15)', borderRadius: 8,
          color: '#94a3b8', textDecoration: 'none', fontSize: '0.78rem',
          fontFamily: 'Prompt, Inter, sans-serif',
        }}>
          ⬅ {lang === 'th' ? 'กลับหน้าหลัก' : 'Back to Dashboard'}
        </Link>
      </div>

      <Sidebar
        geoData={geoData}
        filters={filters} setFilters={setFilters}
        visibleLayers={visibleLayers} toggleLayer={toggleLayer} toggleAllLayers={toggleAllLayers}
        uploadedBoundary={uploadedBoundary} setUploadedBoundary={setUploadedBoundary}
        colorMode={colorMode} setColorMode={setColorMode}
        viewMode="facets" setViewMode={() => {}}
        lang={lang} setLang={setLang}
        tariff={tariff} setTariff={setTariff}
        systemCostPerKwp={systemCostPerKwp} setSystemCostPerKwp={setSystemCostPerKwp}
        activeTab="solar" setActiveTab={() => {}}
      />
      <MapViewer
        facetsData={geoData}
        buildingsData={null}
        filters={filters}
        visibleLayers={visibleLayers}
        uploadedBoundary={uploadedBoundary}
        municipalBoundary={boundary}
        colorMode={colorMode}
        viewMode="facets"
        lang={lang}
        tariff={tariff}
        activeTab="solar"
      />
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState('th'); // Default to Thai
  const [tariff, setTariff] = useState(4.20); // Average THB per kWh unit
  const [systemCostPerKwp, setSystemCostPerKwp] = useState(28000); // 28,000 THB/kWp

  return (
    <HashRouter>
      <Routes>
        <Route
          path="/"
          element={
            <DefaultDashboard
              lang={lang} setLang={setLang}
              tariff={tariff} setTariff={setTariff}
              systemCostPerKwp={systemCostPerKwp} setSystemCostPerKwp={setSystemCostPerKwp}
            />
          }
        />
        <Route path="/upload" element={<UploadPage />} />
        <Route path="/processing/:jobId" element={<ProcessingPage />} />
        <Route
          path="/result/:jobId"
          element={
            <ResultDashboard
              jobId={window.location.hash.split('/').pop()}
              lang={lang} setLang={setLang}
              tariff={tariff} setTariff={setTariff}
              systemCostPerKwp={systemCostPerKwp} setSystemCostPerKwp={setSystemCostPerKwp}
            />
          }
        />
      </Routes>
    </HashRouter>
  );
}
