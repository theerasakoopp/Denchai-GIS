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
import { WATER_DATA, WATER_CATEGORIES } from './data/water_data';
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

import FeatureEditModal from './components/FeatureEditModal';

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
  const [activeTab, setActiveTab] = useState('poi'); // Default to POI (สถานที่สำคัญ)
  const [selectedFeature, setSelectedFeature] = useState(null);

  // ── Editable Datasets (with LocalStorage persistence) ──
  const [poiData, setPoiData] = useState(() => {
    try {
      const saved = localStorage.getItem('denchai_poi_data');
      return saved ? JSON.parse(saved) : POI_DATA;
    } catch {
      return POI_DATA;
    }
  });

  const [infraData, setInfraData] = useState(() => {
    try {
      const saved = localStorage.getItem('denchai_infra_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.features && Array.isArray(parsed.features)) return parsed;
      }
    } catch {}
    return INFRA_DATA;
  });

  const [serviceData, setServiceData] = useState(() => {
    try {
      const saved = localStorage.getItem('denchai_service_data');
      return saved ? JSON.parse(saved) : SERVICE_DATA;
    } catch {
      return SERVICE_DATA;
    }
  });

  const [waterData, setWaterData] = useState(() => {
    try {
      const saved = localStorage.getItem('denchai_water_data');
      return saved ? JSON.parse(saved) : WATER_DATA;
    } catch {
      return WATER_DATA;
    }
  });

  // ── Editor & Modal State ──
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingFeature, setEditingFeature] = useState(null);
  const [editDatasetType, setEditDatasetType] = useState('poi'); // 'poi' | 'infra' | 'service' | 'water' | 'solar'
  const [isPickingLocation, setIsPickingLocation] = useState(false);
  const [pickedCoordinates, setPickedCoordinates] = useState(null);
  const [reshapingFeature, setReshapingFeature] = useState(null);
  const [triggerDrawRoad, setTriggerDrawRoad] = useState(false);
  const [triggerDrawWater, setTriggerDrawWater] = useState(false);
  const [triggerDrawRoof, setTriggerDrawRoof] = useState(false);

  // ── Layer visibility for POI/Infra/Service/Water categories ──
  const [poiVisible, setPoiVisible] = useState(
    Object.fromEntries(Object.keys(POI_CATEGORIES).map(k => [k, true]))
  );
  const [infraVisible, setInfraVisible] = useState(
    Object.fromEntries(Object.keys(INFRA_CATEGORIES).map(k => [k, true]))
  );
  const [serviceVisible, setServiceVisible] = useState(
    Object.fromEntries(Object.keys(SERVICE_CATEGORIES).map(k => [k, true]))
  );
  const [waterVisible, setWaterVisible] = useState(
    Object.fromEntries(Object.keys(WATER_CATEGORIES).map(k => [k, true]))
  );

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      setLoading(true);
      try {
        // Check localStorage for edited rooftop facets first!
        const savedFacets = localStorage.getItem('denchai_rooftop_facets');
        let facetsPromise = null;
        if (savedFacets) {
          try {
            const parsed = JSON.parse(savedFacets);
            if (parsed?.features && Array.isArray(parsed.features)) {
              facetsPromise = Promise.resolve(parsed);
            }
          } catch {}
        }
        if (!facetsPromise) {
          facetsPromise = fetchWithFallback('rooftop_facets.geojson');
        }

        const [facets, bldgs, boundary] = await Promise.allSettled([
          facetsPromise,
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

  // ── CRUD Handlers for Map & POI Editor ──
  const handleOpenAdd = (datasetType = 'poi') => {
    setEditDatasetType(datasetType);
    setEditingFeature(null);
    setPickedCoordinates(null);
    setIsEditModalOpen(true);
  };

  const handleOpenEdit = (feature, datasetType = 'poi') => {
    setEditDatasetType(datasetType);
    setEditingFeature(feature);
    setPickedCoordinates(feature.geometry?.coordinates || null);
    setIsEditModalOpen(true);
  };

  const handleSaveFeature = (savedFeature, datasetType) => {
    const targetId = savedFeature.properties?.id || savedFeature.id;
    if (datasetType === 'poi') {
      setPoiData(prev => {
        const existing = prev.features || [];
        const idx = existing.findIndex(f => (f.properties?.id || f.id) === targetId);
        const updated = idx >= 0
          ? existing.map(f => (f.properties?.id || f.id) === targetId ? savedFeature : f)
          : [...existing, savedFeature];
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_poi_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'infra') {
      setInfraData(prev => {
        const existing = prev.features || [];
        const idx = existing.findIndex(f => (f.properties?.id || f.id) === targetId);
        const updated = idx >= 0
          ? existing.map(f => (f.properties?.id || f.id) === targetId ? savedFeature : f)
          : [...existing, savedFeature];
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_infra_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'service') {
      setServiceData(prev => {
        const existing = prev.features || [];
        const idx = existing.findIndex(f => (f.properties?.id || f.id) === targetId);
        const updated = idx >= 0
          ? existing.map(f => (f.properties?.id || f.id) === targetId ? savedFeature : f)
          : [...existing, savedFeature];
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_service_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'water') {
      setWaterData(prev => {
        const existing = prev.features || [];
        const idx = existing.findIndex(f => (f.properties?.id || f.id) === targetId);
        const updated = idx >= 0
          ? existing.map(f => (f.properties?.id || f.id) === targetId ? savedFeature : f)
          : [...existing, savedFeature];
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_water_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'solar' || datasetType === 'roof') {
      setGeoDataFacets(prev => {
        const existing = prev?.features || [];
        const idx = existing.findIndex(f => (f.properties?.id || f.id) === targetId);
        const updated = idx >= 0
          ? existing.map(f => (f.properties?.id || f.id) === targetId ? savedFeature : f)
          : [...existing, savedFeature];
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_rooftop_facets', JSON.stringify(newCol));
        return newCol;
      });
    }
  };

  const handleDeleteFeature = (featureId, datasetType) => {
    if (datasetType === 'poi') {
      setPoiData(prev => {
        const updated = (prev.features || []).filter(f => (f.properties?.id || f.id) !== featureId);
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_poi_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'infra') {
      setInfraData(prev => {
        const updated = (prev.features || []).filter(f => (f.properties?.id || f.id) !== featureId);
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_infra_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'service') {
      setServiceData(prev => {
        const updated = (prev.features || []).filter(f => (f.properties?.id || f.id) !== featureId);
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_service_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'water') {
      setWaterData(prev => {
        const updated = (prev.features || []).filter(f => (f.properties?.id || f.id) !== featureId);
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_water_data', JSON.stringify(newCol));
        return newCol;
      });
    } else if (datasetType === 'solar' || datasetType === 'roof') {
      setGeoDataFacets(prev => {
        const updated = (prev?.features || []).filter(f => (f.properties?.id || f.id) !== featureId);
        const newCol = { type: 'FeatureCollection', features: updated };
        localStorage.setItem('denchai_rooftop_facets', JSON.stringify(newCol));
        return newCol;
      });
    }
  };

  const handleSplitFeature = (oldId, [feat1, feat2], datasetType = 'infra') => {
    if (datasetType === 'infra') {
      setInfraData(prev => {
        const filtered = (prev.features || []).filter(f => f.properties?.id !== oldId && f.id !== oldId);
        const newCol = { type: 'FeatureCollection', features: [feat1, feat2, ...filtered] };
        localStorage.setItem('denchai_infra_data', JSON.stringify(newCol));
        return newCol;
      });
    }
  };

  const handleMergeFeatures = (oldId1, oldId2, mergedFeat, datasetType = 'infra') => {
    if (datasetType === 'infra') {
      setInfraData(prev => {
        const filtered = (prev.features || []).filter(
          f => f.properties?.id !== oldId1 && f.id !== oldId1 && f.properties?.id !== oldId2 && f.id !== oldId2
        );
        const newCol = { type: 'FeatureCollection', features: [mergedFeat, ...filtered] };
        localStorage.setItem('denchai_infra_data', JSON.stringify(newCol));
        return newCol;
      });
    }
  };

  const handleResetData = (datasetType) => {
    if (window.confirm(lang === 'th' ? 'คุณต้องการคืนค่าเริ่มต้นทั้งหมดใช่หรือไม่?' : 'Reset to default data?')) {
      if (datasetType === 'poi') {
        localStorage.removeItem('denchai_poi_data');
        setPoiData(POI_DATA);
      } else if (datasetType === 'infra') {
        localStorage.removeItem('denchai_infra_data');
        setInfraData(INFRA_DATA);
      } else if (datasetType === 'service') {
        localStorage.removeItem('denchai_service_data');
        setServiceData(SERVICE_DATA);
      } else if (datasetType === 'water') {
        localStorage.removeItem('denchai_water_data');
        setWaterData(WATER_DATA);
      } else if (datasetType === 'solar' || datasetType === 'roof') {
        localStorage.removeItem('denchai_rooftop_facets');
        fetchWithFallback('rooftop_facets.geojson').then(data => {
          if (data) setGeoDataFacets(data);
        });
      }
    }
  };

  const handleExportData = (datasetType) => {
    const dataToExport = datasetType === 'poi'
      ? poiData
      : datasetType === 'infra'
        ? infraData
        : datasetType === 'water'
          ? waterData
          : datasetType === 'solar' || datasetType === 'roof'
            ? geoDataFacets
            : serviceData;
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `denchai_${datasetType}_data.geojson`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleStartPickLocation = () => {
    setIsEditModalOpen(false);
    setIsPickingLocation(true);
  };

  const handleLocationPicked = (coords) => {
    setPickedCoordinates(coords);
    setIsPickingLocation(false);
    setIsEditModalOpen(true);
  };

  const currentCategories = editDatasetType === 'poi' ? POI_CATEGORIES
    : editDatasetType === 'infra' ? INFRA_CATEGORIES
    : editDatasetType === 'water' ? WATER_CATEGORIES
    : editDatasetType === 'solar' || editDatasetType === 'roof' ? ROOF_CLASSES
    : SERVICE_CATEGORIES;

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

      {/* Picking Location Banner */}
      {isPickingLocation && (
        <div style={{
          position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)',
          zIndex: 5500, background: 'rgba(15, 23, 42, 0.95)', backdropFilter: 'blur(12px)',
          color: 'white', border: '1px solid #38bdf8', borderRadius: 30,
          padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 16,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)', animation: 'pulse 2s infinite'
        }}>
          <span style={{ fontSize: '0.92rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
            🎯 {lang === 'th' ? 'คลิกบนแผนที่ UAV เพื่อกำหนดตำแหน่งพิกัด' : 'Click on the UAV map to place pin'}
          </span>
          <button
            type="button"
            onClick={() => {
              setIsPickingLocation(false);
              setIsEditModalOpen(true);
            }}
            style={{
              background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
              color: 'white', borderRadius: 20, padding: '4px 12px', fontSize: '0.78rem',
              cursor: 'pointer', fontWeight: 600
            }}
          >
            {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
          </button>
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
        poiData={poiData} poiCategories={POI_CATEGORIES}
        infraData={infraData} infraCategories={INFRA_CATEGORIES}
        serviceData={serviceData} serviceCategories={SERVICE_CATEGORIES}
        waterData={waterData} waterCategories={WATER_CATEGORIES}
        poiVisible={poiVisible} setPoiVisible={setPoiVisible}
        infraVisible={infraVisible} setInfraVisible={setInfraVisible}
        serviceVisible={serviceVisible} setServiceVisible={setServiceVisible}
        waterVisible={waterVisible} setWaterVisible={setWaterVisible}
        onSelectFeature={setSelectedFeature}
        onAddFeature={handleOpenAdd}
        onEditFeature={handleOpenEdit}
        onDeleteFeature={handleDeleteFeature}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onStartDrawRoad={() => setTriggerDrawRoad(true)}
        onStartDrawWater={() => setTriggerDrawWater(true)}
        onStartDrawRoof={() => setTriggerDrawRoof(true)}
        onReshapeRoad={(feat) => setReshapingFeature(feat)}
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
        poiData={poiData}
        infraData={infraData}
        serviceData={serviceData}
        waterData={waterData}
        poiVisible={poiVisible}
        infraVisible={infraVisible}
        serviceVisible={serviceVisible}
        waterVisible={waterVisible}
        selectedFeature={selectedFeature}
        isPickingLocation={isPickingLocation}
        onLocationPicked={handleLocationPicked}
        onEditFeature={handleOpenEdit}
        onAddFeature={handleOpenAdd}
        setUploadedBoundary={setUploadedBoundary}
        reshapingFeature={reshapingFeature}
        onFinishReshaping={() => setReshapingFeature(null)}
        onSaveFeature={handleSaveFeature}
        onDeleteFeature={handleDeleteFeature}
        onSplitFeature={handleSplitFeature}
        onMergeFeatures={handleMergeFeatures}
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
        categories={currentCategories}
        datasetType={editDatasetType}
        onSave={handleSaveFeature}
        onDelete={handleDeleteFeature}
        onPickOnMap={handleStartPickLocation}
        onReshapeOnMap={(feat) => {
          setIsEditModalOpen(false);
          setReshapingFeature(feat);
        }}
        pickedCoords={pickedCoordinates}
        lang={lang}
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
