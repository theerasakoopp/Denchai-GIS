import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link } from 'react-router-dom';
import MapViewer from './components/MapViewer';
import Sidebar from './components/Sidebar';
import UploadPage from './pages/UploadPage';
import ProcessingPage from './pages/ProcessingPage';
import './index.css';

const API = 'http://localhost:8000';

export const ROOF_CLASSES = {
  1: { name: 'N-Roof',    color: '#ff0000' }, // Red
  2: { name: 'E-Roof',    color: '#00ff00' }, // Green
  3: { name: 'S-Roof',    color: '#0000ff' }, // Blue
  4: { name: 'W-Roof',    color: '#ffff00' }, // Yellow
  5: { name: 'Flat Roof', color: '#ff00ff' }, // Magenta
  6: { name: 'U-Roof',    color: '#808000' }, // Olive
  7: { name: 'PV Panel',  color: '#8000ff' }, // Violet/Purple
};

// ── Default dashboard: loads pre-generated GeoJSON from /public ──
function DefaultDashboard({ lang, setLang, tariff, setTariff, systemCostPerKwp, setSystemCostPerKwp }) {
  const [geoDataFacets, setGeoDataFacets] = useState(null);
  const [geoDataBuildings, setGeoDataBuildings] = useState(null);
  const [municipalBoundary, setMunicipalBoundary] = useState(null);
  const [filters, setFilters] = useState({ minArea: 10, minEnergy: 0 });
  const [visibleLayers, setVisibleLayers] = useState(
    Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, true]))
  );
  const [uploadedBoundary, setUploadedBoundary] = useState(null);
  const [colorMode, setColorMode] = useState('class'); // Default to Class colors
  const [viewMode, setViewMode] = useState('facets');   // Default to Roof Facet View

  useEffect(() => {
    fetch('./buildings.geojson').then(r => r.json()).then(setGeoDataBuildings).catch(() => {});
    fetch('./rooftop_facets.geojson').then(r => r.json()).then(setGeoDataFacets).catch(() => {});
    fetch('./boundary.geojson').then(r => r.json()).then(setMunicipalBoundary).catch(() => {});
  }, []);

  const activeGeoData = viewMode === 'buildings' ? (geoDataBuildings || geoDataFacets) : geoDataFacets;

  const toggleLayer = (id) => setVisibleLayers(p => ({ ...p, [id]: !p[id] }));
  const toggleAllLayers = (v) =>
    setVisibleLayers(Object.fromEntries(Object.keys(ROOF_CLASSES).map(k => [k, v])));

  return (
    <div className="app-container">
      {/* Top action bar */}
      <div style={{
        position: 'absolute', top: 14, right: 16, zIndex: 2000,
        display: 'flex', gap: 10, alignItems: 'center'
      }}>
        <Link to="/upload" style={{
          padding: '8px 14px',
          background: 'linear-gradient(135deg, rgba(59,130,246,0.3), rgba(99,102,241,0.3))',
          border: '1px solid rgba(99,102,241,0.5)', borderRadius: 8,
          color: '#93c5fd', textDecoration: 'none', fontSize: '0.78rem',
          fontFamily: 'Prompt, Inter, sans-serif', fontWeight: 600,
          backdropFilter: 'blur(12px)',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          display: 'flex', alignItems: 'center', gap: 6
        }}>
          <span>➕</span>
          <span>{lang === 'th' ? 'ประมวลผลข้อมูลใหม่ (UAV Pipeline)' : 'Run New Pipeline'}</span>
        </Link>
      </div>

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
      />
      <MapViewer
        geoData={activeGeoData}
        filters={filters}
        visibleLayers={visibleLayers}
        uploadedBoundary={uploadedBoundary}
        municipalBoundary={municipalBoundary}
        colorMode={colorMode}
        viewMode={viewMode}
        lang={lang}
        tariff={tariff}
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
      />
      <MapViewer
        geoData={geoData}
        filters={filters}
        visibleLayers={visibleLayers}
        uploadedBoundary={uploadedBoundary}
        municipalBoundary={boundary}
        colorMode={colorMode}
        viewMode="facets"
        lang={lang}
        tariff={tariff}
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
