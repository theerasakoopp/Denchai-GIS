import React, { useState, useEffect } from 'react';
import { X, MapPin, Trash2, Save, Crosshair, Check, AlertCircle } from 'lucide-react';
import { translations } from '../translations';

export default function FeatureEditModal({
  isOpen,
  onClose,
  feature,
  categories,
  datasetType = 'poi', // 'poi' | 'infra' | 'service'
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
    fiscal_year: '2567'
  });

  const [error, setError] = useState('');

  const isLineOrPolygon = feature?.geometry?.type === 'LineString' || feature?.geometry?.type === 'Polygon';

  useEffect(() => {
    if (feature) {
      const p = feature.properties || {};
      const isPoint = !feature.geometry || feature.geometry.type === 'Point';
      const coords = isPoint ? (feature.geometry?.coordinates || [100.055, 17.985]) : [100.055, 17.985];

      setFormData({
        id: p.id || `custom-${Date.now()}`,
        name_th: p.name_th || '',
        name_en: p.name_en || '',
        category: p.category || Object.keys(categories || {})[0] || 'main_road',
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
        fiscal_year: p.fiscal_year || '2567'
      });
    } else {
      setFormData({
        id: `custom-${Date.now()}`,
        name_th: '',
        name_en: '',
        category: Object.keys(categories || {})[0] || (datasetType === 'infra' ? 'main_road' : 'temple'),
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
        fiscal_year: '2568'
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
    if (!formData.name_th.trim() && !formData.name_en.trim()) {
      setError(lang === 'th' ? 'กรุณากรอกชื่อ' : 'Please enter name');
      return;
    }

    const updatedFeature = {
      type: 'Feature',
      geometry: feature?.geometry && feature.geometry.type !== 'Point'
        ? feature.geometry
        : {
            type: 'Point',
            coordinates: [Number(formData.lon), Number(formData.lat)]
          },
      properties: {
        ...(feature?.properties || {}),
        id: formData.id || `custom-${Date.now()}`,
        name_th: formData.name_th.trim() || formData.name_en.trim(),
        name_en: formData.name_en.trim() || formData.name_th.trim(),
        category: formData.category,
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
          <div>
            <label className="form-label" style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: 6, display: 'block' }}>
              {lang === 'th' ? 'หมวดหมู่สถานที่' : 'Category'}
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6, maxHeight: 130, overflowY: 'auto', paddingRight: 4 }}>
              {Object.entries(categories || {}).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFormData({ ...formData, category: key })}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px', borderRadius: 8, fontSize: '0.78rem',
                    textAlign: 'left', border: formData.category === key ? `2px solid ${cat.color}` : '1px solid var(--border-subtle)',
                    background: formData.category === key ? `${cat.color}15` : '#f8fafc',
                    color: formData.category === key ? '#0f172a' : 'var(--text-sub)',
                    fontWeight: formData.category === key ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.15s'
                  }}
                >
                  <span style={{ fontSize: '1rem' }}>{cat.icon}</span>
                  <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lang === 'th' ? cat.name_th : cat.name_en}
                  </span>
                </button>
              ))}
            </div>
          </div>

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
