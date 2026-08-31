import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, Cell } from 'recharts';

const COLORS = ['#378ADD','#1D9E75','#D85A30','#7F77DD','#BA7517'];

// ── LPA 5 ด้านหลัก ──────────────────────────────────────
const LPA_ASPECTS = [
  {
    id: 1, icon: '🏛️',
    th: 'การบริหารจัดการ', en: 'Management',
    indicators: [
      { th: 'แผนพัฒนาท้องถิ่น', en: 'Local Dev Plan', score: 85, max: 100, mapLayer: 'poi' },
      { th: 'แผนการดำเนินงาน', en: 'Action Plan', score: 78, max: 100, mapLayer: 'infra' },
      { th: 'การบริหารงานบุคคล', en: 'HR Management', score: 90, max: 100, mapLayer: null },
    ]
  },
  {
    id: 2, icon: '💰',
    th: 'การบริหารงานการเงิน', en: 'Finance',
    indicators: [
      { th: 'การจัดทำงบประมาณ', en: 'Budgeting', score: 82, max: 100, mapLayer: null },
      { th: 'การจัดซื้อจัดจ้าง', en: 'Procurement', score: 75, max: 100, mapLayer: null },
      { th: 'รายงานการเงิน', en: 'Financial Report', score: 88, max: 100, mapLayer: null },
    ]
  },
  {
    id: 3, icon: '👥',
    th: 'การบริหารงานชุมชนฯ', en: 'Community',
    indicators: [
      { th: 'บริการประชาชน', en: 'Citizen Services', score: 72, max: 100, mapLayer: 'service' },
      { th: 'สวัสดิการสังคม', en: 'Social Welfare', score: 68, max: 100, mapLayer: 'poi' },
      { th: 'การมีส่วนร่วม', en: 'Participation', score: 80, max: 100, mapLayer: null },
    ]
  },
  {
    id: 4, icon: '🏗️',
    th: 'การบริการสาธารณะ', en: 'Public Services',
    indicators: [
      { th: 'ถนนและการจราจร', en: 'Roads', score: 65, max: 100, mapLayer: 'infra' },
      { th: 'ระบบน้ำประปา', en: 'Water Supply', score: 70, max: 100, mapLayer: 'water' },
      { th: 'ไฟฟ้าสาธารณะ', en: 'Street Lighting', score: 60, max: 100, mapLayer: 'streetlight' },
      { th: 'การจัดการขยะ', en: 'Waste Mgmt', score: 55, max: 100, mapLayer: 'trashbin' },
    ]
  },
  {
    id: 5, icon: '⚖️',
    th: 'ธรรมาภิบาล', en: 'Governance',
    indicators: [
      { th: 'ความโปร่งใส', en: 'Transparency', score: 88, max: 100, mapLayer: null },
      { th: 'การตรวจสอบ', en: 'Audit', score: 82, max: 100, mapLayer: null },
      { th: 'จริยธรรม', en: 'Ethics', score: 91, max: 100, mapLayer: null },
    ]
  },
];

// ── Mock alerts ───────────────────────────────────────────
const ALERTS = [
  { id: 1, th: 'เสาไฟฟ้าชำรุด ซ.3 หมู่ 2', layer: 'streetlight', lat: 17.982, lng: 100.051, level: 'danger' },
  { id: 2, th: 'ถนนทรุดตัว หมู่ 5', layer: 'infra', lat: 17.975, lng: 100.048, level: 'danger' },
  { id: 3, th: 'ท่อระบายน้ำอุดตัน ซ.7', layer: 'drain', lat: 17.979, lng: 100.055, level: 'warning' },
  { id: 4, th: 'ถังขยะเต็ม หมู่ 2', layer: 'trashbin', lat: 17.983, lng: 100.043, level: 'warning' },
  { id: 5, th: 'มิเตอร์น้ำผิดปกติ 12 จุด', layer: 'watermeter', lat: 17.978, lng: 100.052, level: 'info' },
  { id: 6, th: 'หัวจ่ายน้ำดับเพลิง ชำรุด', layer: 'hydrant', lat: 17.977, lng: 100.049, level: 'danger' },
];

export default function DashboardPage({ lang = 'th' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('mayor');
  const [selectedLpaAspect, setSelectedLpaAspect] = useState(null);

  // โหลดข้อมูลจาก localStorage โดยตรง
  const poiData     = useMemo(() => { try { const s = localStorage.getItem('denchai_poi_data');     return s ? JSON.parse(s) : null; } catch { return null; } }, []);
  const infraData   = useMemo(() => { try { const s = localStorage.getItem('denchai_infra_data');   return s ? JSON.parse(s) : null; } catch { return null; } }, []);
  const waterData   = useMemo(() => { try { const s = localStorage.getItem('denchai_water_data');   return s ? JSON.parse(s) : null; } catch { return null; } }, []);
  const serviceData = useMemo(() => { try { const s = localStorage.getItem('denchai_service_data'); return s ? JSON.parse(s) : null; } catch { return null; } }, []);

  const stats = useMemo(() => ({
    poi:     poiData?.features?.length     || 53,
    infra:   infraData?.features?.length   || 142,
    water:   waterData?.features?.length   || 287,
    service: serviceData?.features?.length || 46,
  }), [poiData, infraData, waterData, serviceData]);

  const lpaAvgScore = useMemo(() => {
    const all = LPA_ASPECTS.flatMap(a => a.indicators);
    return Math.round(all.reduce((s, i) => s + i.score, 0) / all.length);
  }, []);

  const barData = [
    { name: lang === 'th' ? 'สถานที่' : 'POI',      value: stats.poi,     fill: COLORS[0] },
    { name: lang === 'th' ? 'โครงสร้าง' : 'Infra',  value: stats.infra,   fill: COLORS[1] },
    { name: lang === 'th' ? 'แหล่งน้ำ' : 'Water',   value: stats.water,   fill: COLORS[2] },
    { name: lang === 'th' ? 'บริการ' : 'Service',    value: stats.service, fill: COLORS[3] },
  ];

  const radarData = LPA_ASPECTS.map(a => ({
    aspect: a.th.split('การ').pop().split('งาน').pop().trim().slice(0, 6),
    score: Math.round(a.indicators.reduce((s, i) => s + i.score, 0) / a.indicators.length),
  }));

  // ── Navigate to map ─────────────────────────────────────
  function goToMap(layer) {
    navigate(`/?layer=${layer}`);
  }

  // ── Styles ──────────────────────────────────────────────
  const s = {
    page:    { minHeight: '100vh', background: '#080c14', color: '#f0f4ff', fontFamily: "'Prompt', 'Inter', sans-serif", display: 'flex', flexDirection: 'column' },
    header:  { background: '#0f1623', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    tabNav:  { display: 'flex', gap: 6, background: 'rgba(0,0,0,0.2)', padding: '10px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' },
    tab:     { padding: '7px 18px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', background: 'transparent', color: '#8899bb', transition: 'all 0.15s', fontFamily: 'inherit' },
    tabA:    { background: 'rgba(59,130,246,0.15)', color: '#60a5fa', borderBottom: '2px solid #3b82f6' },
    body:    { flex: 1, padding: '20px 24px', overflow: 'auto' },
    grid4:   { display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 12, marginBottom: 16 },
    grid2:   { display: 'grid', gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr)', gap: 12, marginBottom: 16 },
    grid3:   { display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 12, marginBottom: 16 },
    card:    { background: '#141c2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '14px 16px' },
    kpiVal:  { fontSize: 28, fontWeight: 800, color: '#f0f4ff', lineHeight: 1.1 },
    kpiLbl:  { fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 },
    kpiSub:  { fontSize: 11, marginTop: 4 },
    secLbl:  { fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 },
    btn:     { padding: '6px 12px', borderRadius: 7, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
    btnBack: { padding: '7px 14px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: '#8899bb', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' },
  };

  const alertColor = l => l === 'danger' ? '#ef4444' : l === 'warning' ? '#f59e0b' : '#3b82f6';
  const alertBg    = l => l === 'danger' ? 'rgba(239,68,68,0.1)' : l === 'warning' ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';

  return (
    <div style={s.page}>

      {/* Header */}
      <div style={s.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button style={s.btnBack} onClick={() => navigate('/')}>← {lang === 'th' ? 'กลับแผนที่' : 'Back to Map'}</button>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700 }}>🏙️ {lang === 'th' ? 'ศูนย์บริหารจัดการเทศบาลตำบลเด่นชัย' : 'Denchai Smart City — Executive Dashboard'}</div>
            <div style={{ fontSize: 11, color: '#64748b' }}>{lang === 'th' ? 'ข้อมูล ณ วันที่ 31 สิงหาคม 2569' : 'Data as of August 31, 2026'}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={s.btn} onClick={() => navigate('/editor')}>✏️ {lang === 'th' ? 'จัดการข้อมูล' : 'Editor'}</button>
          <button style={{ ...s.btn, borderColor: 'rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.1)', color: '#34d399' }}>📄 {lang === 'th' ? 'Export PDF' : 'Export PDF'}</button>
        </div>
      </div>

      {/* Tab Nav */}
      <div style={s.tabNav}>
        {[
          { key: 'mayor',  label: lang === 'th' ? '👤 นายกเทศมนตรี' : '👤 Mayor' },
          { key: 'deputy', label: lang === 'th' ? '👤 รองนายกฯ' : '👤 Deputy Mayor' },
          { key: 'lpa',    label: lang === 'th' ? '📋 การประเมิน LPA' : '📋 LPA Assessment' },
        ].map(t => (
          <button key={t.key} style={{ ...s.tab, ...(activeTab === t.key ? s.tabA : {}) }} onClick={() => setActiveTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={s.body}>

        {/* ── TAB: MAYOR ── */}
        {activeTab === 'mayor' && (
          <>
            {/* KPI row */}
            <div style={s.grid4}>
              {[
                { label: lang === 'th' ? 'สถานที่สำคัญ' : 'Key Locations', val: stats.poi,     sub: '24 หมวดหมู่',       sub2: 'text-accent',  layer: 'poi',     icon: '📍' },
                { label: lang === 'th' ? 'โครงสร้างพื้นฐาน' : 'Infrastructure', val: stats.infra,   sub: 'รอซ่อม 8 จุด',     sub2: 'text-warning', layer: 'infra',   icon: '🏗️' },
                { label: lang === 'th' ? 'แหล่งน้ำ' : 'Water Bodies',    val: stats.water,  sub: 'ครอบคลุม 100%',    sub2: 'text-success', layer: 'water',   icon: '💧' },
                { label: lang === 'th' ? 'คะแนน LPA เฉลี่ย' : 'LPA Score',      val: lpaAvgScore + '%', sub: '5 ด้านการประเมิน', sub2: 'text-accent',  layer: null,      icon: '📋' },
              ].map((k, i) => (
                <div key={i} style={{ ...s.card, cursor: k.layer ? 'pointer' : 'default' }} onClick={() => k.layer && goToMap(k.layer)}>
                  <div style={s.kpiLbl}>{k.icon} {k.label}</div>
                  <div style={s.kpiVal}>{k.val}</div>
                  <div style={{ ...s.kpiSub, color: k.sub2 === 'text-accent' ? '#60a5fa' : k.sub2 === 'text-warning' ? '#f59e0b' : '#34d399' }}>
                    {k.sub} {k.layer && <span style={{ color: '#475569' }}>· คลิกดูแผนที่</span>}
                  </div>
                </div>
              ))}
            </div>

            {/* Chart + Alerts */}
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.secLbl}>สัดส่วนข้อมูลแต่ละหมวด</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={barData} margin={{ top: 0, right: 10, left: -20, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false}/>
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}/>
                    <Tooltip contentStyle={{ background: '#141c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff', fontSize: 12 }}/>
                    <Bar dataKey="value" radius={[4,4,0,0]}>
                      {barData.map((entry, i) => <Cell key={i} fill={entry.fill}/>)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div style={s.card}>
                <div style={s.secLbl}>รายการเร่งด่วน</div>
                {ALERTS.filter(a => a.level === 'danger').map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => goToMap(a.layer)}>
                    <span style={{ fontSize: 12, color: '#f0f4ff' }}>{a.th}</span>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: alertBg(a.level), color: alertColor(a.level) }}>เร่งด่วน</span>
                  </div>
                ))}
                <div style={{ marginTop: 8, fontSize: 11, color: '#475569' }}>คลิกเพื่อดูตำแหน่งบนแผนที่</div>
              </div>
            </div>

            {/* Summary cards */}
            <div style={s.grid3}>
              {[
                { label: 'บริการสาธารณะ', val: stats.service + ' จุด', icon: '🏥', sub: 'โรงพยาบาล, โรงเรียน, ตลาด', layer: 'service' },
                { label: 'แจ้งซ่อมทั้งหมด', val: '24 เรื่อง', icon: '🔧', sub: 'ดำเนินการแล้ว 18 เรื่อง', layer: 'infra' },
                { label: 'ความพึงพอใจ', val: '4.2 / 5', icon: '⭐', sub: 'จากการสำรวจประชาชน', layer: null },
              ].map((c, i) => (
                <div key={i} style={{ ...s.card, cursor: c.layer ? 'pointer' : 'default' }} onClick={() => c.layer && goToMap(c.layer)}>
                  <div style={s.kpiLbl}>{c.icon} {c.label}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: '#f0f4ff', margin: '4px 0' }}>{c.val}</div>
                  <div style={{ fontSize: 11, color: '#64748b' }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ── TAB: DEPUTY ── */}
        {activeTab === 'deputy' && (
          <>
            {/* Smart City status */}
            <div style={s.grid4}>
              {[
                { icon: '💡', label: 'เสาไฟฟ้า', val: '0', status: 'รอเพิ่มข้อมูล', layer: 'streetlight' },
                { icon: '💧', label: 'มิเตอร์น้ำ', val: '0', status: 'รอเพิ่มข้อมูล', layer: 'watermeter' },
                { icon: '⚡', label: 'หม้อแปลง', val: '0', status: 'รอเพิ่มข้อมูล', layer: 'transformer' },
                { icon: '🗑️', label: 'ถังขยะ', val: '0', status: 'รอเพิ่มข้อมูล', layer: 'trashbin' },
              ].map((k, i) => (
                <div key={i} style={{ ...s.card, cursor: 'pointer' }} onClick={() => goToMap(k.layer)}>
                  <div style={s.kpiLbl}>{k.icon} {k.label}</div>
                  <div style={s.kpiVal}>{k.val}</div>
                  <div style={{ ...s.kpiSub, color: '#475569' }}>{k.status} · คลิกดูแผนที่</div>
                </div>
              ))}
            </div>

            {/* All alerts */}
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.secLbl}>รายการแจ้งซ่อมทั้งหมด</div>
                {ALERTS.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                    onClick={() => goToMap(a.layer)}>
                    <div>
                      <div style={{ fontSize: 12, color: '#f0f4ff' }}>{a.th}</div>
                      <div style={{ fontSize: 10, color: '#475569', marginTop: 1 }}>📍 {a.lat.toFixed(3)}, {a.lng.toFixed(3)}</div>
                    </div>
                    <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 99, background: alertBg(a.level), color: alertColor(a.level), flexShrink: 0, marginLeft: 8 }}>
                      {a.level === 'danger' ? 'เร่งด่วน' : a.level === 'warning' ? 'ปานกลาง' : 'ปกติ'}
                    </span>
                  </div>
                ))}
              </div>
              <div style={s.card}>
                <div style={s.secLbl}>สรุปสถานะ</div>
                {[
                  { label: 'เร่งด่วน', val: ALERTS.filter(a => a.level === 'danger').length, color: '#ef4444' },
                  { label: 'ปานกลาง', val: ALERTS.filter(a => a.level === 'warning').length, color: '#f59e0b' },
                  { label: 'ปกติ', val: ALERTS.filter(a => a.level === 'info').length, color: '#3b82f6' },
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < 2 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                    <span style={{ fontSize: 13, color: '#f0f4ff' }}>{r.label}</span>
                    <span style={{ fontSize: 20, fontWeight: 700, color: r.color }}>{r.val}</span>
                  </div>
                ))}
                <div style={{ marginTop: 12, padding: '8px 10px', background: 'rgba(59,130,246,0.08)', borderRadius: 8, fontSize: 11, color: '#93c5fd' }}>
                  💡 กดแต่ละรายการเพื่อดูตำแหน่งบนแผนที่
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── TAB: LPA ── */}
        {activeTab === 'lpa' && (
          <>
            {/* LPA Score overview */}
            <div style={s.grid2}>
              <div style={s.card}>
                <div style={s.secLbl}>คะแนนรวม 5 ด้าน</div>
                <ResponsiveContainer width="100%" height={200}>
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)"/>
                    <PolarAngleAxis dataKey="aspect" tick={{ fill: '#8899bb', fontSize: 11 }}/>
                    <Radar name="LPA" dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2}/>
                    <Tooltip contentStyle={{ background: '#141c2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#f0f4ff', fontSize: 12 }}/>
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div style={s.card}>
                <div style={s.secLbl}>สรุปคะแนนแต่ละด้าน</div>
                {LPA_ASPECTS.map(a => {
                  const avg = Math.round(a.indicators.reduce((s, i) => s + i.score, 0) / a.indicators.length);
                  const color = avg >= 80 ? '#34d399' : avg >= 65 ? '#f59e0b' : '#ef4444';
                  return (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'pointer' }}
                      onClick={() => setSelectedLpaAspect(selectedLpaAspect === a.id ? null : a.id)}>
                      <span style={{ fontSize: 14 }}>{a.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, color: '#f0f4ff', fontWeight: 500 }}>{a.th}</div>
                        <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, marginTop: 4 }}>
                          <div style={{ height: '100%', width: avg + '%', background: color, borderRadius: 2, transition: 'width 0.4s' }}/>
                        </div>
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{avg}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* LPA detail */}
            {selectedLpaAspect && (
              <div style={s.card}>
                {LPA_ASPECTS.filter(a => a.id === selectedLpaAspect).map(a => (
                  <div key={a.id}>
                    <div style={s.secLbl}>{a.icon} {a.th} — ตัวชี้วัดย่อย</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 10 }}>
                      {a.indicators.map((ind, i) => (
                        <div key={i} style={{ background: '#0f1623', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(255,255,255,0.06)', cursor: ind.mapLayer ? 'pointer' : 'default' }}
                          onClick={() => ind.mapLayer && goToMap(ind.mapLayer)}>
                          <div style={{ fontSize: 11, color: '#64748b', marginBottom: 4 }}>{ind.th}</div>
                          <div style={{ fontSize: 20, fontWeight: 700, color: ind.score >= 80 ? '#34d399' : ind.score >= 65 ? '#f59e0b' : '#ef4444' }}>{ind.score}</div>
                          <div style={{ height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 6 }}>
                            <div style={{ height: '100%', width: ind.score + '%', background: ind.score >= 80 ? '#34d399' : ind.score >= 65 ? '#f59e0b' : '#ef4444', borderRadius: 2 }}/>
                          </div>
                          {ind.mapLayer && <div style={{ fontSize: 10, color: '#475569', marginTop: 4 }}>📍 คลิกดูบนแผนที่</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div style={{ marginTop: 8, padding: '10px 14px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 10, fontSize: 12, color: '#93c5fd' }}>
              💡 กดที่แต่ละด้านเพื่อดูตัวชี้วัดย่อย · กดตัวชี้วัดที่มีไอคอน 📍 เพื่อดูข้อมูลบนแผนที่
            </div>
          </>
        )}

      </div>
    </div>
  );
}
