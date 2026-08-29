import React, { useState, useEffect } from 'react';
import { X, MapPin, Trash2, Save, Crosshair, Check, AlertCircle, SunMedium, Zap, DollarSign, Leaf } from 'lucide-react';
import { translations } from '../translations';
import { ROOF_CLASSES } from '../App';

export default function FeatureEditModal({
  isOpen,
  onClose,
  feature,
  categories,
  datasetType = 'poi', // 'poi' | 'infra' | 'service' | 'water' | 'solar'
  onSave,
  onDelete,
  onPickOnMap,
  onReshapeOnMap = null,
  pickedCoords = null,
  lang = 'th'
}) {
  const t = translations[lang] || translations.th;

  const [formData, setFormData] = useState({
    id: '',
    name_th: '',
    name_en: '',
    category: Object.keys(categories || {})[0] || 'main_road',
    lon: 100.055,
    lat: 17.985,
    description_th: '',
    description_en: '',
    phone: '',
    // Municipal Road Planning Attributes
    surface_type: 'concrete',
    condition: 'good',
    width_m: 6.0,
    right_of_way_m: 8.0,
    lanes: 2,
    drainage: 'none',
    lighting: 'none',
    plan_status: 'completed',
    fiscal_year: '2567',
    // Water Body Attributes
    area_sqm: 10000,
    capacity_m3: 25000,
    water_quality: 'good',
    purpose: 'อุปโภค-บริโภค / ชลประทาน',
    // Solar Rooftop Attributes
    class_id: 3,
    area_3d: 50.0,
    slope_deg: 20.0,
    aspect_deg: 180.0,
    building_id: '',
    capacity_kwp: 1.8,
    energy_kwh: 2500
  });

  const [error, setError] = useState('');

  const isLineOrPolygon = feature?.geometry?.type === 'LineString' || feature?.geometry?.type === 'Polygon';
  const isSolar = datasetType === 'solar' || datasetType === 'roof';

  useEffect(() => {
    if (feature) {
      const p = feature.properties || {};
      const isPoint = !feature.geometry || feature.geometry.type === 'Point';
      const coords = isPoint ? (feature.geometry?.coordinates || [100.055, 17.985]) : [100.055, 17.985];

      const cid = Number(p.class_id) || 3;
      const area = Number(p.area_3d || p.area_2d || 50.0);
      const cap = Number(p.capacity_kwp || ((area * 0.18) * 0.20));
      const eng = Number(p.energy_corrected_kwh || p.energy_kwh || (cap * 1350));
      const slope = typeof p.slope_deg === 'number' ? p.slope_deg : parseFloat(p.slope_deg) || 20.0;
      const aspect = typeof p.aspect_deg === 'number' ? p.aspect_deg : parseFloat(p.aspect_deg) || 180.0;

      setFormData({
        id: p.id || `custom-${Date.now()}`,
        name_th: p.name_th || (isSolar ? (p.building_id ? `หลังคาอาคาร ${p.building_id}` : (p.class_name || 'ผืนหลังคาโซลาร์')) : ''),
        name_en: p.name_en || (isSolar ? (p.building_id ? `Roof ${p.building_id}` : (p.class_name || 'Roof Facet')) : ''),
        category: String(p.category || (isSolar ? cid : Object.keys(categories || {})[0] || (datasetType === 'water' ? 'pond' : 'main_road'))),
        lon: Number(coords[0]) || 100.055,
        lat: Number(coords[1]) || 17.985,
        description_th: p.description_th || '',
        description_en: p.description_en || '',
        phone: p.phone || '',
        surface_type: p.surface_type || 'concrete',
        condition: p.condition || 'good',
        width_m: p.width_m || 6.0,
        right_of_way_m: p.right_of_way_m || 8.0,
        lanes: p.lanes || 2,
        drainage: p.drainage || 'none',
        lighting: p.lighting || 'none',
        plan_status: p.plan_status || 'completed',
        fiscal_year: p.fiscal_year || '2567',
        area_sqm: p.area_sqm || 10000,
        capacity_m3: p.capacity_m3 || 25000,
        water_quality: p.water_quality || 'good',
        purpose: p.purpose || 'อุปโภค-บริโภค / ชลประทาน',
        class_id: cid,
        area_3d: Number(area.toFixed(1)),
        slope_deg: Number(slope.toFixed(1)),
        aspect_deg: Number(aspect.toFixed(1)),
        building_id: p.building_id || '',
        capacity_kwp: Number(cap.toFixed(2)),
        energy_kwh: Number(eng.toFixed(0))
      });
    } else {
      setFormData({
        id: `custom-${Date.now()}`,
        name_th: isSolar ? 'ผืนหลังคาใหม่' : '',
        name_en: isSolar ? 'New Roof Facet' : '',
        category: Object.keys(categories || {})[0] || (datasetType === 'water' ? 'pond' : datasetType === 'infra' ? 'main_road' : 'temple'),
        lon: pickedCoords ? Number(pickedCoords[0]) : 100.055,
        lat: pickedCoords ? Number(pickedCoords[1]) : 17.985,
        description_th: '',
        description_en: '',
        phone: '',
        surface_type: 'concrete',
        condition: 'good',
        width_m: 6.0,
        right_of_way_m: 8.0,
        lanes: 2,
        drainage: 'none',
        lighting: 'none',
        plan_status: 'in_5year_plan',
        fiscal_year: '2568',
        area_sqm: 10000,
        capacity_m3: 25000,
        water_quality: 'good',
        purpose: 'อุปโภค-บริโภค / ชลประทาน',
        class_id: 3,
        area_3d: 50.0,
        slope_deg: 20.0,
        aspect_deg: 180.0,
        building_id: '',
        capacity_kwp: 1.8,
        energy_kwh: 2500
      });
    }
    setError('');
  }, [feature, isOpen, categories, datasetType]);

  // Update coords if picked from map
  useEffect(() => {
    if (pickedCoords && pickedCoords.length === 2) {
      setFormData(prev => ({
        ...prev,
        lon: Number(pickedCoords[0].toFixed(6)),
        lat: Number(pickedCoords[1].toFixed(6))
      }));
    }
  }, [pickedCoords]);

  if (!isOpen) return null;

  const isNew = !feature || !feature.properties?.id;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name_th.trim() && !formData.name_en.trim() && !isSolar) {
      setError(lang === 'th' ? 'กรุณากรอกชื่อ' : 'Please enter name');
      return;
    }

    const cid = Number(formData.class_id) || 3;
    const clsMeta = ROOF_CLASSES[cid] || { name: 'S-Roof', color: '#3b82f6' };
    const area = Number(formData.area_3d) || 50.0;
    const cap = Number(formData.capacity_kwp) || Number(((area * 0.18) * 0.20).toFixed(2));
    const yieldFactor = cid === 3 ? 1420 : cid === 5 ? 1380 : cid === 2 ? 1320 : cid === 4 ? 1300 : cid === 1 ? 1120 : cid === 7 ? 1400 : 1250;
    const eng = Math.round(cap * yieldFactor);
    const sav = Math.round(eng * 4.2);

    const updatedFeature = {
      type: 'Feature',
      id: formData.id || feature?.id || `custom-${Date.now()}`,
      geometry: feature?.geometry && feature.geometry.type !== 'Point'
        ? feature.geometry
        : {
            type: 'Point',
            coordinates: [Number(formData.lon), Number(formData.lat)]
          },
      properties: {
        ...(feature?.properties || {}),
        id: formData.id || feature?.properties?.id || feature?.id || `custom-${Date.now()}`,
        name_th: formData.name_th.trim() || formData.name_en.trim() || clsMeta.name,
        name_en: formData.name_en.trim() || formData.name_th.trim() || clsMeta.name,
        category: isSolar ? String(cid) : formData.category,
        description_th: formData.description_th.trim(),
        description_en: formData.description_en.trim(),
        ...(formData.phone ? { phone: formData.phone.trim() } : {}),
        ...(datasetType === 'infra' ? {
          surface_type: formData.surface_type,
          condition: formData.condition,
          width_m: Number(formData.width_m) || 6.0,
          right_of_way_m: Number(formData.right_of_way_m) || 8.0,
          lanes: Number(formData.lanes) || 2,
          drainage: formData.drainage,
          lighting: formData.lighting,
          plan_status: formData.plan_status,
          fiscal_year: formData.fiscal_year
        } : {}),
        ...(datasetType === 'water' ? {
          area_sqm: Number(formData.area_sqm) || 10000,
          capacity_m3: Number(formData.capacity_m3) || 25000,
          water_quality: formData.water_quality,
          purpose: formData.purpose
        } : {}),
        ...(isSolar ? {
          class_id: cid,
          class_name: clsMeta.name,
          color: clsMeta.color,
          area_3d: area,
          area_2d: Number((area * Math.cos((Number(formData.slope_deg) || 20) * Math.PI / 180)).toFixed(1)),
          slope_deg: Number(formData.slope_deg) || 20.0,
          aspect_deg: Number(formData.aspect_deg) || 180.0,
          capacity_kwp: cap,
          energy_kwh: eng,
          energy_corrected_kwh: eng,
          savings_thb: sav,
          building_id: formData.building_id || ''
        } : {})
      }
    };

    onSave(updatedFeature, datasetType);
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(t.confirmDelete || 'คุณต้องการลบสถานที่นี้ใช่หรือไม่?')) {
      if (feature?.properties?.id) {
        onDelete(feature.properties.id, datasetType);
      }
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" style={{ zIndex: 6000 }}>
      <div className="modal-card" style={{ maxWidth: 520, width: '92%' }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: isNew ? 'rgba(59, 130, 246, 0.15)' : 'rgba(245, 158, 11, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: isNew ? '#2563eb' : '#d97706', fontSize: '1.2rem'
            }}>
              {isNew ? '➕' : '✏️'}
            </div>
            <div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
                {isNew
                  ? (lang === 'th' ? 'เพิ่มสถานที่ใหม่บนแผนที่' : 'Add New Map Location')
                  : (lang === 'th' ? 'แก้ไขข้อมูล / ย้ายตำแหน่ง' : 'Edit Location & Pin')}
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>
                {lang === 'th' ? 'เทศบาลตำบลเด่นชัย จ.แพร่' : 'Denchai Smart City GIS'}
              </div>
            </div>
          </div>
          <button
            type="button"
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error alert */}
        {error && (
          <div style={{
            margin: '0 20px 12px', padding: '8px 12px', borderRadius: 8,
            background: '#fee2e2', border: '1px solid #fca5a5', color: '#b91c1c',
            fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: 6
          }}>
            <AlertCircle size={15} /> {error}
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '0 20px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Category selection */}
          {!isSolar && categories && Object.keys(categories).length > 0 && (
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>
                {lang === 'th' ? 'หมวดหมู่สถานที่ / ชั้นข้อมูล' : 'Category'}
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
                {Object.entries(categories).map(([key, cat]) => {
                  const color = cat?.color || '#3b82f6';
                  const icon = cat?.icon || '📍';
                  const label = (lang === 'th' ? cat?.name_th : cat?.name_en) || cat?.name || key;
                  const isSelected = formData.category === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData({ ...formData, category: key })}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '6px 10px', borderRadius: 8, fontSize: '0.78rem',
                        textAlign: 'left', border: isSelected ? `2px solid ${color}` : '1px solid var(--border-subtle)',
                        background: isSelected ? `${color}15` : '#f8fafc',
                        color: isSelected ? '#0f172a' : 'var(--text-sub)',
                        fontWeight: isSelected ? 700 : 500,
                        cursor: 'pointer', transition: 'all 0.15s'
                      }}
                    >
                      <span style={{ fontSize: '1rem' }}>{icon}</span>
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Name fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                {lang === 'th' ? 'ชื่อสถานที่ (ไทย) *' : 'Name (TH) *'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={lang === 'th' ? 'เช่น วัดเด่นชัย' : 'e.g. Wat Den Chai'}
                value={formData.name_th}
                onChange={e => setFormData({ ...formData, name_th: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border-subtle)', fontSize: '0.85rem',
                  fontFamily: 'Prompt, Inter, sans-serif'
                }}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                {lang === 'th' ? 'ชื่อสถานที่ (English)' : 'Name (EN)'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Wat Den Chai"
                value={formData.name_en}
                onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border-subtle)', fontSize: '0.85rem',
                  fontFamily: 'Prompt, Inter, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Coordinates or Line/Polygon Info */}
          {isLineOrPolygon ? (
            <div style={{
              background: '#f8fafc', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)', display: 'block' }}>
                    🛣️ {lang === 'th' ? 'รูปทรงแนวเส้นทาง (LineString)' : 'Geometry (LineString)'}
                  </span>
                  <span style={{ fontSize: '0.74rem', color: 'var(--text-sub)' }}>
                    {lang === 'th'
                      ? `จำนวนจุดพิกัดแนวเส้น: ${feature?.geometry?.coordinates?.length || 0} จุด`
                      : `Vertices count: ${feature?.geometry?.coordinates?.length || 0}`}
                  </span>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 600, color: '#d97706', background: '#fef3c7', padding: '4px 8px', borderRadius: 6 }}>
                  {lang === 'th' ? 'แนวเส้นถนนจริง' : 'Real Road Geometry'}
                </div>
              </div>

              {onReshapeOnMap && (
                <button
                  type="button"
                  onClick={() => onReshapeOnMap(feature)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: 'white', border: 'none', borderRadius: 8,
                    padding: '8px 12px', fontSize: '0.78rem', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, cursor: 'pointer',
                    boxShadow: '0 2px 6px rgba(217,119,6,0.25)'
                  }}
                >
                  ✏️ {lang === 'th' ? 'คลิกเพื่อดึงดัดจุดยอดแนวถนนบนแผนที่ UAV' : 'Reshape Road Vertices on Map'}
                </button>
              )}
            </div>
          ) : (
            <div style={{
              background: '#f8fafc', border: '1px solid var(--border-subtle)',
              borderRadius: 10, padding: '10px 12px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  📍 {lang === 'th' ? 'พิกัดทางภูมิศาสตร์ (Lat / Lon)' : 'Coordinates'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onPickOnMap();
                  }}
                  style={{
                    background: 'linear-gradient(135deg, #2563eb, #3b82f6)',
                    color: 'white', border: 'none', borderRadius: 6,
                    padding: '4px 10px', fontSize: '0.72rem', fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer',
                    boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
                  }}
                >
                  <Crosshair size={13} /> {lang === 'th' ? 'คลิกชี้จุดบนแผนที่ UAV' : 'Pick on UAV Map'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-sub)', display: 'block', marginBottom: 2 }}>Longitude (X)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.lon}
                    onChange={e => setFormData({ ...formData, lon: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%', padding: '6px 8px', borderRadius: 6,
                      border: '1px solid var(--border-subtle)', fontSize: '0.82rem',
                      background: 'white', fontFamily: 'monospace'
                    }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-sub)', display: 'block', marginBottom: 2 }}>Latitude (Y)</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={formData.lat}
                    onChange={e => setFormData({ ...formData, lat: parseFloat(e.target.value) || 0 })}
                    style={{
                      width: '100%', padding: '6px 8px', borderRadius: 6,
                      border: '1px solid var(--border-subtle)', fontSize: '0.82rem',
                      background: 'white', fontFamily: 'monospace'
                    }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Municipal Road Development & Engineering Attributes */}
          {datasetType === 'infra' && (
            <div style={{
              background: '#f1f5f9', border: '1px solid #cbd5e1',
              borderRadius: 10, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📋</span> {lang === 'th' ? 'ข้อมูลวิศวกรรมและการวางแผนพัฒนาเทศบาล' : 'Municipal Road Engineering & Planning'}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Surface Type */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'ประเภทผิวจราจร' : 'Surface Type'}
                  </label>
                  <select
                    value={formData.surface_type || 'concrete'}
                    onChange={e => setFormData({ ...formData, surface_type: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="concrete">{lang === 'th' ? 'คอนกรีตเสริมเหล็ก (คสล.)' : 'Reinforced Concrete'}</option>
                    <option value="asphalt">{lang === 'th' ? 'แอสฟัลต์ติก (ลาดยาง)' : 'Asphalt Concrete'}</option>
                    <option value="gravel">{lang === 'th' ? 'หินคลุก / ลูกรัง' : 'Gravel / Laterite'}</option>
                    <option value="dirt">{lang === 'th' ? 'ดินธรรมชาติ / ดินลูกรัง' : 'Dirt Road'}</option>
                    <option value="paving_block">{lang === 'th' ? 'บล็อกตัวหนอน / ทางเดินเท้า' : 'Paving Block'}</option>
                  </select>
                </div>

                {/* Condition */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'สภาพผิวทาง' : 'Pavement Condition'}
                  </label>
                  <select
                    value={formData.condition || 'good'}
                    onChange={e => setFormData({ ...formData, condition: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="good">{lang === 'th' ? '🟢 ดีมาก / สมบูรณ์' : '🟢 Good'}</option>
                    <option value="fair">{lang === 'th' ? '🟡 ปานกลาง (พอใช้)' : '🟡 Fair'}</option>
                    <option value="poor">{lang === 'th' ? '🔴 ชำรุด / ต้องปรับปรุง' : '🔴 Poor / Needs Repair'}</option>
                    <option value="under_construction">{lang === 'th' ? '🚧 อยู่ระหว่างก่อสร้าง' : '🚧 Under Construction'}</option>
                  </select>
                </div>

                {/* Width (m) */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'ความกว้างผิวจราจร (เมตร)' : 'Carriageway Width (m)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.width_m || ''}
                    onChange={e => setFormData({ ...formData, width_m: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 6.0"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  />
                </div>

                {/* Right of Way (m) */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'เขตทางทั้งหมด (เมตร)' : 'Right-of-Way (m)'}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.right_of_way_m || ''}
                    onChange={e => setFormData({ ...formData, right_of_way_m: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 8.0"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  />
                </div>

                {/* Drainage */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'ระบบระบายน้ำ' : 'Drainage System'}
                  </label>
                  <select
                    value={formData.drainage || 'none'}
                    onChange={e => setFormData({ ...formData, drainage: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="concrete_pipe">{lang === 'th' ? 'มีท่อระบายน้ำ คสล.' : 'Concrete Pipe'}</option>
                    <option value="concrete_gutter">{lang === 'th' ? 'มีรางระบายน้ำ คสล.' : 'Concrete Gutter'}</option>
                    <option value="open_ditch">{lang === 'th' ? 'รางดินเปิด' : 'Open Ditch'}</option>
                    <option value="none">{lang === 'th' ? 'ไม่มีระบบระบายน้ำ' : 'None'}</option>
                  </select>
                </div>

                {/* Lighting */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'ไฟฟ้าส่องสว่าง' : 'Street Lighting'}
                  </label>
                  <select
                    value={formData.lighting || 'none'}
                    onChange={e => setFormData({ ...formData, lighting: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="led">{lang === 'th' ? 'มีโคมไฟถนน LED' : 'LED Lighting'}</option>
                    <option value="solar">{lang === 'th' ? 'มีเสาไฟโซลาร์เซลล์' : 'Solar Street Light'}</option>
                    <option value="none">{lang === 'th' ? 'ไม่มีไฟฟ้าส่องสว่าง' : 'No Lighting'}</option>
                  </select>
                </div>
              </div>

              {/* Development Plan Status & Fiscal Year */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 10, marginTop: 4 }}>
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'สถานะแผนพัฒนาเทศบาล' : 'Development Plan Status'}
                  </label>
                  <select
                    value={formData.plan_status || 'completed'}
                    onChange={e => setFormData({ ...formData, plan_status: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="completed">{lang === 'th' ? '✅ ก่อสร้างแล้วเสร็จ / พร้อมใช้งาน' : 'Completed'}</option>
                    <option value="in_5year_plan">{lang === 'th' ? '📋 บรรจุในแผนพัฒนาท้องถิ่น (5 ปี)' : 'In 5-Year Plan'}</option>
                    <option value="budgeted">{lang === 'th' ? '💰 ได้รับงบประมาณแล้ว (เตรียมก่อสร้าง)' : 'Budget Allocated'}</option>
                    <option value="requested">{lang === 'th' ? '⏳ เสนอขอรับเงินอุดหนุน' : 'Budget Requested'}</option>
                    <option value="no_plan">{lang === 'th' ? '⚪ ยังไม่มีแผนพัฒนา' : 'No Plan'}</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? 'ปีงบประมาณ' : 'Fiscal Year'}
                  </label>
                  <input
                    type="text"
                    value={formData.fiscal_year || ''}
                    onChange={e => setFormData({ ...formData, fiscal_year: e.target.value })}
                    placeholder="เช่น 2568"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #cbd5e1', fontSize: '0.78rem', background: 'white' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ Water Body Attributes (When datasetType === 'water') ═══════════ */}
          {datasetType === 'water' && (
            <div style={{
              background: '#f0f9ff', border: '1px solid #bae6fd',
              borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 10
            }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>💧</span>
                <span>{lang === 'th' ? 'ข้อมูลคุณลักษณะแหล่งน้ำ (Water Body Parameters)' : 'Water Body Parameters'}</span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Surface Area (sqm) */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '📐 ขนาดพื้นที่ผิวน้ำ (ตร.ม.)' : 'Surface Area (sqm)'}
                  </label>
                  <input
                    type="number"
                    value={formData.area_sqm || ''}
                    onChange={e => setFormData({ ...formData, area_sqm: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 15000"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #7dd3fc', fontSize: '0.78rem', background: 'white' }}
                  />
                </div>

                {/* Capacity (m3) */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '💧 ความจุน้ำ (ลบ.ม. m³)' : 'Storage Capacity (m³)'}
                  </label>
                  <input
                    type="number"
                    value={formData.capacity_m3 || ''}
                    onChange={e => setFormData({ ...formData, capacity_m3: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 45000"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #7dd3fc', fontSize: '0.78rem', background: 'white' }}
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '🎯 วัตถุประสงค์การใช้งาน' : 'Primary Purpose'}
                  </label>
                  <select
                    value={formData.purpose || 'อุปโภค-บริโภค / ชลประทาน'}
                    onChange={e => setFormData({ ...formData, purpose: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #7dd3fc', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="อุปโภค-บริโภค / ชลประทาน">{lang === 'th' ? 'อุปโภค-บริโภค / ชลประทาน' : 'Potable & Irrigation'}</option>
                    <option value="แหล่งน้ำต้นทุนสายหลัก">{lang === 'th' ? 'แหล่งน้ำต้นทุนสายหลัก' : 'Main River Reach'}</option>
                    <option value="แก้มลิงชะลอน้ำหลาก / ป้องกันน้ำท่วม">{lang === 'th' ? 'แก้มลิงชะลอน้ำหลาก / ป้องกันน้ำท่วม' : 'Flood Retention Basin'}</option>
                    <option value="น้ำเพื่อการเกษตรและปศุสัตว์">{lang === 'th' ? 'น้ำเพื่อการเกษตรและปศุสัตว์' : 'Agriculture & Livestock'}</option>
                    <option value="สระพักน้ำดิบผลิตประปา">{lang === 'th' ? 'สระพักน้ำดิบผลิตประปา' : 'Potable Water Production'}</option>
                    <option value="ประมงและพักผ่อนหย่อนใจ">{lang === 'th' ? 'ประมงและพักผ่อนหย่อนใจ' : 'Fishery & Recreation'}</option>
                  </select>
                </div>

                {/* Water Quality */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#0369a1', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '🧪 คุณภาพน้ำ' : 'Water Quality'}
                  </label>
                  <select
                    value={formData.water_quality || 'good'}
                    onChange={e => setFormData({ ...formData, water_quality: e.target.value })}
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #7dd3fc', fontSize: '0.78rem', background: 'white' }}
                  >
                    <option value="good">{lang === 'th' ? '🟢 ดี (มาตรฐาน)' : '🟢 Good'}</option>
                    <option value="fair">{lang === 'th' ? '🟡 ปานกลาง (พอใช้)' : '🟡 Fair'}</option>
                    <option value="poor">{lang === 'th' ? '🔴 ต้องเฝ้าระวัง' : '🔴 Monitoring / Substandard'}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════ Solar Rooftop Attributes (When datasetType === 'solar' or 'roof') ═══════════ */}
          {isSolar && (
            <div style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%)',
              border: '1.5px solid #bfdbfe', borderRadius: 12, padding: '14px',
              display: 'flex', flexDirection: 'column', gap: 12,
              boxShadow: '0 4px 12px rgba(59, 130, 246, 0.08)'
            }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#1e40af', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SunMedium size={18} color="#eab308" />
                <span>{lang === 'th' ? 'ข้อมูลผืนหลังคาและศักยภาพโซลาร์เซลล์' : 'Rooftop Solar Potential Parameters'}</span>
              </div>

              {/* Roof Class Selection */}
              <div>
                <label style={{ fontSize: '0.74rem', fontWeight: 600, color: '#334155', display: 'block', marginBottom: 6 }}>
                  {lang === 'th' ? '🧭 ทิศทางและประเภทหลังคา (Orientation & Type):' : 'Orientation & Roof Type:'}
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                  {Object.entries(ROOF_CLASSES).map(([cid, info]) => {
                    const isSelected = Number(formData.class_id) === Number(cid);
                    return (
                      <button
                        key={cid}
                        type="button"
                        onClick={() => setFormData({ ...formData, class_id: Number(cid) })}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6,
                          padding: '6px 8px', borderRadius: 8, fontSize: '0.74rem',
                          textAlign: 'left',
                          border: isSelected ? `2px solid ${info.color}` : '1px solid #cbd5e1',
                          background: isSelected ? `${info.color}20` : 'white',
                          color: isSelected ? '#0f172a' : '#475569',
                          fontWeight: isSelected ? 800 : 500,
                          cursor: 'pointer', transition: 'all 0.15s',
                          boxShadow: isSelected ? `0 2px 8px ${info.color}40` : 'none'
                        }}
                      >
                        <span style={{ width: 12, height: 12, borderRadius: '50%', background: info.color, flexShrink: 0 }} />
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {info.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Area, Slope, Aspect, Building ID */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* 3D Area */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '📐 ขนาดพื้นที่หลังคา 3D (ตร.ม.)' : '3D Roof Area (sqm)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.area_3d || ''}
                    onChange={e => setFormData({ ...formData, area_3d: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 65.5"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: '0.8rem', background: 'white' }}
                  />
                </div>

                {/* Slope */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '📐 ความลาดชัน (องศา °)' : 'Slope Degree (°)'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={formData.slope_deg || ''}
                    onChange={e => setFormData({ ...formData, slope_deg: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 15.0"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: '0.8rem', background: 'white' }}
                  />
                </div>

                {/* Building ID */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '🏢 รหัสอาคาร (Building ID)' : 'Building ID'}
                  </label>
                  <input
                    type="text"
                    value={formData.building_id || ''}
                    onChange={e => setFormData({ ...formData, building_id: e.target.value })}
                    placeholder="เช่น BLD-102"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: '0.8rem', background: 'white' }}
                  />
                </div>

                {/* Aspect */}
                <div>
                  <label style={{ fontSize: '0.72rem', fontWeight: 600, color: '#1e40af', display: 'block', marginBottom: 3 }}>
                    {lang === 'th' ? '🧭 ทิศทางหันหลังคา (°)' : 'Aspect (°)'}
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={formData.aspect_deg || ''}
                    onChange={e => setFormData({ ...formData, aspect_deg: parseFloat(e.target.value) || 0 })}
                    placeholder="เช่น 180"
                    style={{ width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid #93c5fd', fontSize: '0.8rem', background: 'white' }}
                  />
                </div>
              </div>

              {/* Live Solar KPI Summary Card */}
              {(() => {
                const cid = Number(formData.class_id) || 3;
                const area = Number(formData.area_3d) || 0;
                const cap = Number(((area * 0.18) * 0.20).toFixed(2));
                const yieldFactor = cid === 3 ? 1420 : cid === 5 ? 1380 : cid === 2 ? 1320 : cid === 4 ? 1300 : cid === 1 ? 1120 : cid === 7 ? 1400 : 1250;
                const eng = Math.round(cap * yieldFactor);
                const sav = Math.round(eng * 4.2);
                const co2 = Number(((eng * 0.4999) / 1000).toFixed(2));

                return (
                  <div style={{
                    background: 'rgba(255, 255, 255, 0.9)',
                    border: '1px solid #93c5fd', borderRadius: 10, padding: '10px 12px',
                    display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Zap size={15} color="#eab308" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>กำลังติดตั้ง:</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0f172a' }}>
                          {cap} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>kWp</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <SunMedium size={15} color="#f97316" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>พลังงานผลิตได้:</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#15803d' }}>
                          {eng.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>kWh/ปี</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={15} color="#22c55e" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ประหยัดค่าไฟ:</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#047857' }}>
                          ~{sav.toLocaleString()} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>บาท/ปี</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Leaf size={15} color="#10b981" />
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#64748b' }}>ลดก๊าซคาร์บอน:</div>
                        <div style={{ fontSize: '0.88rem', fontWeight: 800, color: '#0369a1' }}>
                          ~{co2} <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>tCO₂/ปี</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Description & Phone */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8 }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                {lang === 'th' ? 'รายละเอียด/ข้อมูลสำคัญ' : 'Description'}
              </label>
              <textarea
                rows={2}
                placeholder={lang === 'th' ? 'ข้อมูลสังเขป เช่น เวลาเปิด-ปิด, จุดเด่น' : 'Short description...'}
                value={formData.description_th}
                onChange={e => setFormData({ ...formData, description_th: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border-subtle)', fontSize: '0.82rem',
                  fontFamily: 'Prompt, Inter, sans-serif', resize: 'vertical'
                }}
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 4, display: 'block' }}>
                📞 {lang === 'th' ? 'เบอร์โทรศัพท์ติดต่อ (ถ้ามี)' : 'Phone Number (Optional)'}
              </label>
              <input
                type="text"
                placeholder="เช่น 054-613XXX"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                style={{
                  width: '100%', padding: '8px 10px', borderRadius: 8,
                  border: '1px solid var(--border-subtle)', fontSize: '0.82rem',
                  fontFamily: 'Prompt, Inter, sans-serif'
                }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginTop: 8, paddingTop: 14, borderTop: '1px solid var(--border-subtle)'
          }}>
            {!isNew ? (
              <button
                type="button"
                onClick={handleDelete}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  padding: '7px 12px', borderRadius: 8, fontSize: '0.78rem',
                  color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca',
                  fontWeight: 600, cursor: 'pointer'
                }}
              >
                <Trash2 size={14} /> {lang === 'th' ? 'ลบสถานที่' : 'Delete'}
              </button>
            ) : <div />}

            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={onClose}
                style={{
                  padding: '8px 14px', borderRadius: 8, fontSize: '0.82rem',
                  border: '1px solid var(--border-subtle)', background: 'white',
                  color: 'var(--text-sub)', fontWeight: 600, cursor: 'pointer'
                }}
              >
                {lang === 'th' ? 'ยกเลิก' : 'Cancel'}
              </button>
              <button
                type="submit"
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 18px', borderRadius: 8, fontSize: '0.82rem',
                  background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                  color: 'white', border: 'none', fontWeight: 600,
                  cursor: 'pointer', boxShadow: '0 2px 6px rgba(37,99,235,0.3)'
                }}
              >
                <Save size={14} /> {lang === 'th' ? 'บันทึกข้อมูล' : 'Save'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
