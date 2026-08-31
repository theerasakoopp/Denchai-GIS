import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis } from 'recharts';

// ── LPA Data ─────────────────────────────────────────────
const LPA_ASPECTS = [
  { id:1, icon:'ti-building-community', th:'การบริหารจัดการ',     score:84, indicators:[
    { th:'แผนพัฒนาท้องถิ่น', score:85, mapLayer:'poi' },
    { th:'แผนการดำเนินงาน',  score:78, mapLayer:'infra' },
    { th:'การบริหารงานบุคคล', score:90, mapLayer:null },
  ]},
  { id:2, icon:'ti-coins', th:'การบริหารงานการเงิน',  score:82, indicators:[
    { th:'การจัดทำงบประมาณ', score:82, mapLayer:null },
    { th:'การจัดซื้อจัดจ้าง', score:75, mapLayer:null },
    { th:'รายงานการเงิน',    score:88, mapLayer:null },
  ]},
  { id:3, icon:'ti-users', th:'การบริหารงานชุมชนฯ',   score:73, indicators:[
    { th:'บริการประชาชน',   score:72, mapLayer:'service' },
    { th:'สวัสดิการสังคม',  score:68, mapLayer:'poi' },
    { th:'การมีส่วนร่วม',   score:80, mapLayer:null },
  ]},
  { id:4, icon:'ti-road', th:'การบริการสาธารณะ',     score:63, indicators:[
    { th:'ถนนและการจราจร',      score:65, mapLayer:'infra' },
    { th:'ระบบน้ำประปา',        score:70, mapLayer:'water' },
    { th:'ไฟฟ้าสาธารณะ',        score:60, mapLayer:'streetlight' },
    { th:'การจัดการขยะ',        score:55, mapLayer:'trashbin' },
  ]},
  { id:5, icon:'ti-scale', th:'ธรรมาภิบาล',            score:87, indicators:[
    { th:'ความโปร่งใส', score:88, mapLayer:null },
    { th:'การตรวจสอบ',  score:82, mapLayer:null },
    { th:'จริยธรรม',    score:91, mapLayer:null },
  ]},
];

// ── Styles ────────────────────────────────────────────────
const S = {
  page:   { minHeight:'100vh', background:'#080c14', color:'#f0f4ff',
            fontFamily:"'Sarabun','IBM Plex Sans Thai',sans-serif", display:'flex', flexDirection:'column' },
  hdr:    { background:'#0d1420', borderBottom:'1px solid rgba(255,255,255,0.07)',
            padding:'12px 24px', display:'flex', alignItems:'center', justifyContent:'space-between' },
  tabs:   { display:'flex', gap:4, background:'rgba(0,0,0,0.2)', padding:'10px 24px',
            borderBottom:'1px solid rgba(255,255,255,0.06)', flexWrap:'wrap' },
  tab:    { padding:'7px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
            border:'none', background:'transparent', color:'#8899bb', fontFamily:'inherit', display:'flex', alignItems:'center', gap:6 },
  tabA:   { background:'rgba(59,130,246,0.15)', color:'#60a5fa', borderBottom:'2px solid #3b82f6' },
  body:   { flex:1, padding:'20px 24px', overflowY:'auto' },
  card:   { background:'#141c2e', border:'1px solid rgba(255,255,255,0.07)', borderRadius:12, padding:'14px 16px' },
  g4:     { display:'grid', gridTemplateColumns:'repeat(4,minmax(0,1fr))', gap:12, marginBottom:16 },
  g2:     { display:'grid', gridTemplateColumns:'minmax(0,1.4fr) minmax(0,1fr)', gap:12, marginBottom:16 },
  g3:     { display:'grid', gridTemplateColumns:'repeat(3,minmax(0,1fr))', gap:12, marginBottom:16 },
  lbl:    { fontSize:11, fontWeight:600, color:'#64748b', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:8 },
  kval:   { fontSize:28, fontWeight:600, color:'#f0f4ff', lineHeight:1.1 },
  ksub:   { fontSize:12, marginTop:4 },
  btnBk:  { padding:'7px 14px', borderRadius:8, border:'1px solid rgba(255,255,255,0.1)',
            background:'transparent', color:'#8899bb', fontSize:13, fontWeight:500, cursor:'pointer', fontFamily:'inherit' },
  btnE:   { padding:'7px 12px', borderRadius:8, border:'1px solid rgba(56,189,248,0.3)',
            background:'rgba(56,189,248,0.08)', color:'#38bdf8', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  btnPDF: { padding:'7px 12px', borderRadius:8, border:'1px solid rgba(16,185,129,0.3)',
            background:'rgba(16,185,129,0.08)', color:'#34d399', fontSize:12, fontWeight:600, cursor:'pointer', fontFamily:'inherit' },
  tbl:    { width:'100%', borderCollapse:'collapse', fontSize:13 },
  th:     { padding:'8px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'#64748b',
            textTransform:'uppercase', letterSpacing:'.04em', borderBottom:'1px solid rgba(255,255,255,0.07)' },
  td:     { padding:'9px 12px', borderBottom:'1px solid rgba(255,255,255,0.04)', color:'#c8d3e8', verticalAlign:'middle' },
  sec:    { fontSize:12, fontWeight:600, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:10, display:'flex', alignItems:'center', gap:6 },
};

const scoreColor = s => s >= 80 ? '#34d399' : s >= 65 ? '#f59e0b' : '#ef4444';
const levelBg    = l => l === 'danger' ? 'rgba(239,68,68,0.12)' : l === 'warning' ? 'rgba(245,158,11,0.12)' : 'rgba(59,130,246,0.12)';
const levelColor = l => l === 'danger' ? '#ef4444' : l === 'warning' ? '#f59e0b' : '#3b82f6';
const levelLabel = l => l === 'danger' ? 'เร่งด่วน' : l === 'warning' ? 'ปานกลาง' : 'ปกติ';

const ALERTS = [
  { id:1, th:'เสาไฟฟ้าชำรุด ซ.3 หมู่ 2',    layer:'streetlight', level:'danger' },
  { id:2, th:'ถนนทรุดตัว หมู่ 5',            layer:'infra',       level:'danger' },
  { id:3, th:'ท่อระบายน้ำอุดตัน ซ.7',        layer:'drain',       level:'warning' },
  { id:4, th:'ถังขยะเต็ม หมู่ 2',            layer:'trashbin',    level:'warning' },
  { id:5, th:'มิเตอร์น้ำผิดปกติ 12 จุด',    layer:'watermeter',  level:'info' },
  { id:6, th:'หัวจ่ายน้ำดับเพลิง ชำรุด',    layer:'hydrant',     level:'danger' },
];

export default function DashboardPage({ lang = 'th' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandLpa, setExpandLpa] = useState(null);

  // โหลดข้อมูลจาก localStorage
  const data = useMemo(() => {
    const load = key => { try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : null; } catch { return null; } };
    return {
      poi:     load('denchai_poi_data'),
      infra:   load('denchai_infra_data'),
      water:   load('denchai_water_data'),
      service: load('denchai_service_data'),
    };
  }, []);

  const counts = useMemo(() => ({
    poi:     data.poi?.features?.length     || 53,
    infra:   data.infra?.features?.length   || 142,
    water:   data.water?.features?.length   || 287,
    service: data.service?.features?.length || 46,
  }), [data]);

  const lpaAvg = Math.round(LPA_ASPECTS.reduce((s,a) => s + a.score, 0) / LPA_ASPECTS.length);

  function goMap(layer) { navigate(`/?layer=${layer}`); }

  const TABS = [
    { key:'overview',  icon:'ti-layout-dashboard', label:'ภาพรวม' },
    { key:'poi',       icon:'ti-map-pin',           label:'สถานที่สำคัญ' },
    { key:'infra',     icon:'ti-road',              label:'โครงสร้างพื้นฐาน' },
    { key:'water',     icon:'ti-droplet',           label:'ทรัพยากรน้ำ' },
    { key:'building',  icon:'ti-building',          label:'อาคาร/ภาษี' },
    { key:'lpa',       icon:'ti-chart-radar',       label:'การประเมิน LPA' },
  ];

  // group POI by category
  const poiGroups = useMemo(() => {
    if (!data.poi?.features) return [];
    const g = {};
    data.poi.features.forEach(f => {
      const cat = f.properties?.category || 'other';
      if (!g[cat]) g[cat] = [];
      g[cat].push(f);
    });
    return Object.entries(g).map(([cat, items]) => ({ cat, items, count: items.length }))
      .sort((a,b) => b.count - a.count);
  }, [data.poi]);

  // group infra by category
  const infraGroups = useMemo(() => {
    if (!data.infra?.features) return [];
    const g = {};
    data.infra.features.forEach(f => {
      const cat = f.properties?.category || 'other';
      if (!g[cat]) g[cat] = [];
      g[cat].push(f);
    });
    return Object.entries(g).map(([cat, items]) => ({ cat, items, count: items.length }))
      .sort((a,b) => b.count - a.count);
  }, [data.infra]);

  // group water by category
  const waterGroups = useMemo(() => {
    if (!data.water?.features) return [];
    const g = {};
    data.water.features.forEach(f => {
      const cat = f.properties?.category || 'other';
      if (!g[cat]) g[cat] = [];
      g[cat].push(f);
    });
    return Object.entries(g).map(([cat, items]) => ({ cat, items, count: items.length }))
      .sort((a,b) => b.count - a.count);
  }, [data.water]);

  const barData = [
    { name:'สถานที่', value: counts.poi,     fill:'#378ADD' },
    { name:'โครงสร้าง', value: counts.infra, fill:'#1D9E75' },
    { name:'แหล่งน้ำ', value: counts.water,  fill:'#D85A30' },
    { name:'บริการ',  value: counts.service,  fill:'#7F77DD' },
  ];

  const radarData = LPA_ASPECTS.map(a => ({
    aspect: a.th.slice(0,5), score: a.score,
  }));

  return (
    <div style={S.page}>

      {/* Header */}
      <div style={S.hdr}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <button style={S.btnBk} onClick={() => navigate('/')}>
            <i className="ti ti-arrow-left" style={{ fontSize:14, marginRight:4 }} /> กลับแผนที่
          </button>
          <div>
            <div style={{ fontSize:15, fontWeight:600 }}>
              <i className="ti ti-building-community" style={{ fontSize:16, color:'#60a5fa', marginRight:8 }} />
              ศูนย์บริหารจัดการเทศบาลตำบลเด่นชัย
            </div>
            <div style={{ fontSize:11, color:'#64748b' }}>ข้อมูล ณ วันที่ 31 สิงหาคม 2569</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button style={S.btnE} onClick={() => navigate('/editor')}>
            <i className="ti ti-pencil" style={{ fontSize:13 }} /> จัดการข้อมูล
          </button>
          <button style={S.btnPDF}>
            <i className="ti ti-file-export" style={{ fontSize:13 }} /> Export PDF
          </button>
        </div>
      </div>

      {/* Tab nav */}
      <div style={S.tabs}>
        {TABS.map(t => (
          <button key={t.key} style={{ ...S.tab, ...(activeTab === t.key ? S.tabA : {}) }}
            onClick={() => setActiveTab(t.key)}>
            <i className={`ti ${t.icon}`} style={{ fontSize:14 }} />
            {t.label}
          </button>
        ))}
      </div>

      <div style={S.body}>

        {/* ══ TAB: OVERVIEW ══ */}
        {activeTab === 'overview' && (<>
          <div style={S.g4}>
            {[
              { label:'สถานที่สำคัญ', val: counts.poi,     sub:'24 หมวดหมู่ · คลิกดูแผนที่',     subColor:'#60a5fa', icon:'ti-map-pin',           layer:'poi' },
              { label:'โครงสร้างพื้นฐาน', val: counts.infra,  sub:'รอซ่อม 8 จุด · คลิกดูแผนที่',   subColor:'#f59e0b', icon:'ti-road',              layer:'infra' },
              { label:'แหล่งน้ำ',    val: counts.water,  sub:'ครอบคลุม 100% · คลิกดูแผนที่',   subColor:'#34d399', icon:'ti-droplet',           layer:'water' },
              { label:'คะแนน LPA เฉลี่ย', val: lpaAvg+'%',sub:'5 ด้านการประเมิน',              subColor:'#60a5fa', icon:'ti-chart-radar',       layer:null },
            ].map((k,i) => (
              <div key={i} style={{ ...S.card, cursor: k.layer ? 'pointer' : 'default' }}
                onClick={() => k.layer && goMap(k.layer)}>
                <div style={{ ...S.lbl, display:'flex', alignItems:'center', gap:6 }}>
                  <i className={`ti ${k.icon}`} style={{ fontSize:13 }} />{k.label}
                </div>
                <div style={S.kval}>{k.val}</div>
                <div style={{ ...S.ksub, color: k.subColor }}>{k.sub}</div>
              </div>
            ))}
          </div>

          <div style={S.g2}>
            <div style={S.card}>
              <div style={S.lbl}>สัดส่วนข้อมูลแต่ละหมวด</div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top:0, right:10, left:-20, bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fill:'#64748b', fontSize:11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#64748b', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f4ff', fontSize:12 }} />
                  <Bar dataKey="value" radius={[4,4,0,0]}>
                    {barData.map((e,i) => <rect key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <div style={S.lbl}>รายการเร่งด่วน</div>
              {ALERTS.filter(a => a.level === 'danger').map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between',
                  padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}
                  onClick={() => goMap(a.layer)}>
                  <span style={{ fontSize:13, color:'#f0f4ff' }}>{a.th}</span>
                  <span style={{ fontSize:10, padding:'2px 8px', borderRadius:99, background:levelBg(a.level), color:levelColor(a.level), flexShrink:0, marginLeft:8 }}>
                    {levelLabel(a.level)}
                  </span>
                </div>
              ))}
              <div style={{ marginTop:8, fontSize:11, color:'#475569' }}>คลิกเพื่อดูตำแหน่งบนแผนที่</div>
            </div>
          </div>

          <div style={S.g3}>
            {[
              { label:'บริการสาธารณะ', val: counts.service+' จุด', sub:'โรงพยาบาล, โรงเรียน, ตลาด', icon:'ti-heart-rate-monitor', layer:'service' },
              { label:'แจ้งซ่อมทั้งหมด', val:'24 เรื่อง',           sub:'ดำเนินการแล้ว 18 เรื่อง',    icon:'ti-tool',              layer:'infra' },
              { label:'ความพึงพอใจ', val:'4.2 / 5',              sub:'จากการสำรวจประชาชน',          icon:'ti-star',              layer:null },
            ].map((c,i) => (
              <div key={i} style={{ ...S.card, cursor: c.layer ? 'pointer' : 'default' }}
                onClick={() => c.layer && goMap(c.layer)}>
                <div style={{ ...S.lbl, display:'flex', alignItems:'center', gap:6 }}>
                  <i className={`ti ${c.icon}`} style={{ fontSize:13 }} />{c.label}
                </div>
                <div style={{ fontSize:22, fontWeight:600, color:'#f0f4ff', margin:'4px 0' }}>{c.val}</div>
                <div style={{ fontSize:12, color:'#64748b' }}>{c.sub}</div>
              </div>
            ))}
          </div>
        </>)}

        {/* ══ TAB: POI ══ */}
        {activeTab === 'poi' && (<>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:'#f0f4ff', marginBottom:2 }}>
                <i className="ti ti-map-pin" style={{ fontSize:16, color:'#60a5fa', marginRight:8 }} />
                รายงานสถานที่สำคัญ
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>ทั้งหมด {counts.poi} จุด · {poiGroups.length} หมวดหมู่</div>
            </div>
            <button style={S.btnE} onClick={() => goMap('poi')}>
              <i className="ti ti-map-2" style={{ fontSize:13 }} /> ดูบนแผนที่
            </button>
          </div>
          <div style={S.card}>
            <table style={S.tbl}>
              <thead>
                <tr>
                  <th style={S.th}>หมวดหมู่</th>
                  <th style={{ ...S.th, textAlign:'right' }}>จำนวน</th>
                  <th style={{ ...S.th, textAlign:'right' }}>สัดส่วน</th>
                  <th style={{ ...S.th, width:120 }}></th>
                </tr>
              </thead>
              <tbody>
                {poiGroups.length > 0 ? poiGroups.map((g,i) => (
                  <tr key={i} style={{ cursor:'pointer' }} onClick={() => goMap('poi')}>
                    <td style={S.td}>{g.cat}</td>
                    <td style={{ ...S.td, textAlign:'right', fontWeight:600, color:'#60a5fa' }}>{g.count}</td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                        <div style={{ width:80, height:5, background:'rgba(255,255,255,0.08)', borderRadius:3 }}>
                          <div style={{ width: Math.round(g.count/counts.poi*100)+'%', height:'100%', background:'#3b82f6', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:'#64748b', minWidth:30 }}>{Math.round(g.count/counts.poi*100)}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <span style={{ fontSize:11, color:'#3b82f6', cursor:'pointer' }}>ดูแผนที่ →</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ ...S.td, textAlign:'center', color:'#475569', padding:'24px' }}>
                    ยังไม่มีข้อมูล — <span style={{ color:'#3b82f6', cursor:'pointer' }} onClick={() => navigate('/editor')}>เพิ่มข้อมูลใน Editor Studio</span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ══ TAB: INFRASTRUCTURE ══ */}
        {activeTab === 'infra' && (<>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:'#f0f4ff', marginBottom:2 }}>
                <i className="ti ti-road" style={{ fontSize:16, color:'#1D9E75', marginRight:8 }} />
                รายงานโครงสร้างพื้นฐาน
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>ทั้งหมด {counts.infra} รายการ</div>
            </div>
            <button style={S.btnE} onClick={() => goMap('infra')}>
              <i className="ti ti-map-2" style={{ fontSize:13 }} /> ดูบนแผนที่
            </button>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginBottom:16 }}>
            {[
              { label:'รายการเร่งด่วน', val: ALERTS.filter(a=>a.level==='danger').length, color:'#ef4444', icon:'ti-alert-triangle' },
              { label:'รอดำเนินการ',   val: ALERTS.filter(a=>a.level==='warning').length, color:'#f59e0b', icon:'ti-clock' },
            ].map((k,i) => (
              <div key={i} style={S.card}>
                <div style={{ ...S.lbl, display:'flex', alignItems:'center', gap:6 }}>
                  <i className={`ti ${k.icon}`} style={{ fontSize:13, color:k.color }} />{k.label}
                </div>
                <div style={{ ...S.kval, color:k.color }}>{k.val}</div>
              </div>
            ))}
          </div>
          <div style={{ ...S.card, marginBottom:16 }}>
            <div style={S.lbl}>รายการแจ้งซ่อมทั้งหมด</div>
            <table style={S.tbl}>
              <thead>
                <tr>
                  <th style={S.th}>รายการ</th>
                  <th style={S.th}>Layer</th>
                  <th style={S.th}>สถานะ</th>
                  <th style={{ ...S.th, width:100 }}></th>
                </tr>
              </thead>
              <tbody>
                {ALERTS.map(a => (
                  <tr key={a.id} style={{ cursor:'pointer' }} onClick={() => goMap(a.layer)}>
                    <td style={S.td}>{a.th}</td>
                    <td style={{ ...S.td, color:'#64748b', fontSize:11 }}>{a.layer}</td>
                    <td style={S.td}>
                      <span style={{ fontSize:11, padding:'2px 8px', borderRadius:99,
                        background:levelBg(a.level), color:levelColor(a.level) }}>
                        {levelLabel(a.level)}
                      </span>
                    </td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <span style={{ fontSize:11, color:'#3b82f6' }}>ดูแผนที่ →</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={S.card}>
            <div style={S.lbl}>โครงสร้างพื้นฐานแยกประเภท</div>
            <table style={S.tbl}>
              <thead>
                <tr>
                  <th style={S.th}>ประเภท</th>
                  <th style={{ ...S.th, textAlign:'right' }}>จำนวน</th>
                  <th style={{ ...S.th, textAlign:'right' }}>สัดส่วน</th>
                  <th style={{ ...S.th, width:100 }}></th>
                </tr>
              </thead>
              <tbody>
                {infraGroups.length > 0 ? infraGroups.map((g,i) => (
                  <tr key={i} style={{ cursor:'pointer' }} onClick={() => goMap('infra')}>
                    <td style={S.td}>{g.cat}</td>
                    <td style={{ ...S.td, textAlign:'right', fontWeight:600, color:'#34d399' }}>{g.count}</td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                        <div style={{ width:80, height:5, background:'rgba(255,255,255,0.08)', borderRadius:3 }}>
                          <div style={{ width: Math.round(g.count/counts.infra*100)+'%', height:'100%', background:'#1D9E75', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:'#64748b', minWidth:30 }}>{Math.round(g.count/counts.infra*100)}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <span style={{ fontSize:11, color:'#3b82f6' }}>ดูแผนที่ →</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ ...S.td, textAlign:'center', color:'#475569', padding:'24px' }}>
                    ยังไม่มีข้อมูล — <span style={{ color:'#3b82f6', cursor:'pointer' }} onClick={() => navigate('/editor')}>เพิ่มข้อมูลใน Editor Studio</span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ══ TAB: WATER ══ */}
        {activeTab === 'water' && (<>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:'#f0f4ff', marginBottom:2 }}>
                <i className="ti ti-droplet" style={{ fontSize:16, color:'#0ea5e9', marginRight:8 }} />
                รายงานทรัพยากรน้ำ
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>ทั้งหมด {counts.water} แหล่งน้ำ</div>
            </div>
            <button style={S.btnE} onClick={() => goMap('water')}>
              <i className="ti ti-map-2" style={{ fontSize:13 }} /> ดูบนแผนที่
            </button>
          </div>
          <div style={S.card}>
            <div style={S.lbl}>แหล่งน้ำแยกประเภท</div>
            <table style={S.tbl}>
              <thead>
                <tr>
                  <th style={S.th}>ประเภท</th>
                  <th style={{ ...S.th, textAlign:'right' }}>จำนวน</th>
                  <th style={{ ...S.th, textAlign:'right' }}>สัดส่วน</th>
                  <th style={{ ...S.th, width:100 }}></th>
                </tr>
              </thead>
              <tbody>
                {waterGroups.length > 0 ? waterGroups.map((g,i) => (
                  <tr key={i} style={{ cursor:'pointer' }} onClick={() => goMap('water')}>
                    <td style={S.td}>{g.cat}</td>
                    <td style={{ ...S.td, textAlign:'right', fontWeight:600, color:'#0ea5e9' }}>{g.count}</td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                        <div style={{ width:80, height:5, background:'rgba(255,255,255,0.08)', borderRadius:3 }}>
                          <div style={{ width: Math.round(g.count/counts.water*100)+'%', height:'100%', background:'#0ea5e9', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:'#64748b', minWidth:30 }}>{Math.round(g.count/counts.water*100)}%</span>
                      </div>
                    </td>
                    <td style={{ ...S.td, textAlign:'right' }}>
                      <span style={{ fontSize:11, color:'#3b82f6' }}>ดูแผนที่ →</span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={4} style={{ ...S.td, textAlign:'center', color:'#475569', padding:'24px' }}>
                    ยังไม่มีข้อมูล — <span style={{ color:'#3b82f6', cursor:'pointer' }} onClick={() => navigate('/editor')}>เพิ่มข้อมูลใน Editor Studio</span>
                  </td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>)}

        {/* ══ TAB: BUILDING ══ */}
        {activeTab === 'building' && (<>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:'#f0f4ff', marginBottom:2 }}>
                <i className="ti ti-building" style={{ fontSize:16, color:'#94a3b8', marginRight:8 }} />
                รายงานอาคารและภาษีที่ดิน
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>เชื่อมข้อมูลภาษีที่ดินและสิ่งปลูกสร้าง พ.ร.บ.2562</div>
            </div>
            <button style={S.btnE} onClick={() => goMap('building_sc')}>
              <i className="ti ti-map-2" style={{ fontSize:13 }} /> ดูบนแผนที่
            </button>
          </div>
          <div style={{ ...S.card, padding:'32px', textAlign:'center' }}>
            <i className="ti ti-building-skyscraper" style={{ fontSize:40, color:'#334155', marginBottom:12 }} />
            <div style={{ fontSize:15, fontWeight:500, color:'#64748b', marginBottom:8 }}>ยังไม่มีข้อมูลอาคาร</div>
            <div style={{ fontSize:12, color:'#475569', marginBottom:16 }}>
              เพิ่มข้อมูลโดย Digitize จากภาพโดรน หรือ Import CSV จากระบบภาษีเทศบาล
            </div>
            <div style={{ display:'flex', gap:8, justifyContent:'center' }}>
              <button style={S.btnE} onClick={() => navigate('/editor')}>
                <i className="ti ti-pencil-plus" style={{ fontSize:13 }} /> เพิ่มข้อมูลอาคาร
              </button>
              <button style={{ ...S.btnE, borderColor:'rgba(99,102,241,0.3)', color:'#a78bfa' }}
                onClick={() => navigate('/editor')}>
                <i className="ti ti-upload" style={{ fontSize:13 }} /> Import CSV ภาษี
              </button>
            </div>
          </div>
        </>)}

        {/* ══ TAB: LPA ══ */}
        {activeTab === 'lpa' && (<>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
            <div>
              <div style={{ fontSize:16, fontWeight:600, color:'#f0f4ff', marginBottom:2 }}>
                <i className="ti ti-chart-radar" style={{ fontSize:16, color:'#a78bfa', marginRight:8 }} />
                การประเมินประสิทธิภาพ อปท. (LPA)
              </div>
              <div style={{ fontSize:12, color:'#64748b' }}>คะแนนเฉลี่ยรวม: <span style={{ color: scoreColor(lpaAvg), fontWeight:600 }}>{lpaAvg}%</span> · 5 ด้านหลัก</div>
            </div>
          </div>
          <div style={S.g2}>
            <div style={S.card}>
              <div style={S.lbl}>คะแนนรายด้าน</div>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.08)" />
                  <PolarAngleAxis dataKey="aspect" tick={{ fill:'#8899bb', fontSize:11 }} />
                  <Radar dataKey="score" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip contentStyle={{ background:'#141c2e', border:'1px solid rgba(255,255,255,0.1)', borderRadius:8, color:'#f0f4ff', fontSize:12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={S.card}>
              <div style={S.lbl}>สรุปคะแนนแต่ละด้าน</div>
              {LPA_ASPECTS.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0',
                  borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}
                  onClick={() => setExpandLpa(expandLpa === a.id ? null : a.id)}>
                  <i className={`ti ${a.icon}`} style={{ fontSize:15, color:'#64748b', flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#f0f4ff', fontWeight:500 }}>{a.th}</div>
                    <div style={{ height:4, background:'rgba(255,255,255,0.08)', borderRadius:2, marginTop:4 }}>
                      <div style={{ height:'100%', width:a.score+'%', background:scoreColor(a.score), borderRadius:2, transition:'width .4s' }} />
                    </div>
                  </div>
                  <span style={{ fontSize:15, fontWeight:600, color:scoreColor(a.score), minWidth:36, textAlign:'right' }}>{a.score}</span>
                </div>
              ))}
            </div>
          </div>

          {expandLpa && (
            <div style={{ ...S.card, marginBottom:16 }}>
              {LPA_ASPECTS.filter(a => a.id === expandLpa).map(a => (
                <div key={a.id}>
                  <div style={S.lbl}><i className={`ti ${a.icon}`} style={{ fontSize:13 }} /> {a.th} — ตัวชี้วัดย่อย</div>
                  <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))', gap:10 }}>
                    {a.indicators.map((ind,i) => (
                      <div key={i} style={{ background:'#0f1623', borderRadius:8, padding:'10px 12px',
                        border:'1px solid rgba(255,255,255,0.06)', cursor: ind.mapLayer ? 'pointer' : 'default' }}
                        onClick={() => ind.mapLayer && goMap(ind.mapLayer)}>
                        <div style={{ fontSize:12, color:'#64748b', marginBottom:4 }}>{ind.th}</div>
                        <div style={{ fontSize:22, fontWeight:600, color:scoreColor(ind.score) }}>{ind.score}</div>
                        <div style={{ height:3, background:'rgba(255,255,255,0.06)', borderRadius:2, marginTop:6 }}>
                          <div style={{ height:'100%', width:ind.score+'%', background:scoreColor(ind.score), borderRadius:2 }} />
                        </div>
                        {ind.mapLayer && <div style={{ fontSize:11, color:'#475569', marginTop:4 }}>คลิกดูบนแผนที่</div>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div style={{ ...S.card, fontSize:12, color:'#93c5fd', background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.15)' }}>
            <i className="ti ti-info-circle" style={{ fontSize:14, marginRight:6 }} />
            กดที่แต่ละด้านเพื่อดูตัวชี้วัดย่อย · กดตัวชี้วัดที่มีไอคอนแผนที่เพื่อดูข้อมูลบนแผนที่
          </div>
        </>)}

      </div>
    </div>
  );
}
