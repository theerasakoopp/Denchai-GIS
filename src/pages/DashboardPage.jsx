import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, LineChart, Line } from 'recharts';

// ── LPA Data ──────────────────────────────────────────────
const LPA = [
  { id:1, icon:'ti-building-community', th:'การบริหารจัดการ', score:84, color:'#00c8b4' },
  { id:2, icon:'ti-coins',              th:'การบริหารการเงิน', score:82, color:'#3b82f6' },
  { id:3, icon:'ti-users',              th:'ชุมชนและสังคม',    score:73, color:'#f59e0b' },
  { id:4, icon:'ti-road',               th:'บริการสาธารณะ',   score:63, color:'#ef4444' },
  { id:5, icon:'ti-scale',              th:'ธรรมาภิบาล',      score:87, color:'#a78bfa' },
];

const ALERTS = [
  { id:1, txt:'เสาไฟฟ้าชำรุด ซ.3 หมู่ 2',     level:'danger',  time:'2 ชม.' },
  { id:2, txt:'หัวจ่ายน้ำดับเพลิงชำรุด',       level:'danger',  time:'5 ชม.' },
  { id:3, txt:'ท่อระบายน้ำอุดตัน ซ.7',         level:'warning', time:'1 วัน' },
  { id:4, txt:'ถังขยะเต็ม หมู่ 2',             level:'warning', time:'1 วัน' },
  { id:5, txt:'มิเตอร์น้ำผิดปกติ 12 จุด',      level:'info',    time:'2 วัน' },
];

const INFRA_CHART = [
  { name:'ทางหลวง', value:32, fill:'#ea580c' },
  { name:'ถนนรพช.', value:18, fill:'#f97316' },
  { name:'สายหลัก', value:45, fill:'#f59e0b' },
  { name:'สายรอง',  value:6,  fill:'#0284c7' },
  { name:'ซอย',     value:101,fill:'#64748b' },
  { name:'เกษตร',   value:6,  fill:'#22c55e' },
];

const scoreColor = s => s >= 80 ? '#00c8b4' : s >= 65 ? '#f59e0b' : '#ef4444';
const levelColor = l => l==='danger' ? '#ef4444' : l==='warning' ? '#f59e0b' : '#3b82f6';
const levelBg    = l => l==='danger' ? 'rgba(239,68,68,0.1)' : l==='warning' ? 'rgba(245,158,11,0.08)' : 'rgba(59,130,246,0.08)';

// ── Styles ────────────────────────────────────────────────
const C = {
  page: {
    minHeight:'100vh', background:'#060d1a',
    fontFamily:"'Sarabun','IBM Plex Sans Thai',sans-serif",
    display:'flex', flexDirection:'column', color:'#f0f4ff'
  },
  card: {
    background:'#0a1628', border:'1px solid rgba(0,200,180,0.15)',
    borderRadius:8, padding:'10px 12px', display:'flex', flexDirection:'column', gap:6
  },
  cardTitle: {
    fontSize:10, fontWeight:600, color:'rgba(0,200,180,0.85)',
    textTransform:'uppercase', letterSpacing:'.06em',
    display:'flex', alignItems:'center', gap:5
  },
  row: {
    display:'flex', alignItems:'center', gap:7,
    padding:'5px 0', borderBottom:'1px solid rgba(255,255,255,0.04)'
  },
};

function CardTitle({ children }) {
  return (
    <div style={C.cardTitle}>
      <span style={{ width:3, height:10, background:'#00c8b4', borderRadius:2, flexShrink:0 }} />
      {children}
    </div>
  );
}

export default function DashboardPage({ lang = 'th' }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

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
    poi:     data.poi?.features?.length     || 54,
    infra:   data.infra?.features?.length   || 142,
    water:   data.water?.features?.length   || 287,
    service: data.service?.features?.length || 46,
  }), [data]);

  const lpaAvg = Math.round(LPA.reduce((s,a) => s + a.score, 0) / LPA.length);

  // Group poi by category
  const poiGroups = useMemo(() => {
    if (!data.poi?.features) return [];
    const g = {};
    data.poi.features.forEach(f => {
      const c = f.properties?.category || 'other';
      g[c] = (g[c] || 0) + 1;
    });
    return Object.entries(g).sort((a,b) => b[1]-a[1]).slice(0,6);
  }, [data.poi]);

  const waterGroups = useMemo(() => {
    if (!data.water?.features) return [];
    const g = {};
    data.water.features.forEach(f => {
      const c = f.properties?.category || 'other';
      g[c] = (g[c] || 0) + 1;
    });
    return Object.entries(g).sort((a,b) => b[1]-a[1]);
  }, [data.water]);

  const radarData = LPA.map(a => ({ aspect: a.th.slice(0,4), score: a.score }));

  const dateStr = now.toLocaleDateString('th-TH', { year:'numeric', month:'long', day:'numeric' });

  const TABS = [
    { key:'overview', label:'ภาพรวม',         icon:'ti-layout-dashboard' },
    { key:'poi',      label:'สถานที่สำคัญ',    icon:'ti-map-pin' },
    { key:'infra',    label:'โครงสร้างพื้นฐาน', icon:'ti-road' },
    { key:'water',    label:'ทรัพยากรน้ำ',     icon:'ti-droplet' },
    { key:'lpa',      label:'LPA',             icon:'ti-chart-radar' },
  ];

  const DOTS = { poi:'#00c8b4', infra:'#f59e0b', water:'#3b82f6', service:'#8b5cf6' };

  return (
    <div style={C.page}>

      {/* ── Header ── */}
      <div style={{
        background:'linear-gradient(90deg,#060d1a,#0f1f3d,#060d1a)',
        borderBottom:'1px solid rgba(0,200,180,0.2)',
        padding:'10px 20px', display:'flex', alignItems:'center',
        justifyContent:'space-between', flexShrink:0, gap:12
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <button onClick={() => navigate('/')} style={{
            padding:'5px 10px', borderRadius:6, border:'1px solid rgba(255,255,255,0.1)',
            background:'transparent', color:'#94a3b8', fontSize:12, cursor:'pointer',
            display:'flex', alignItems:'center', gap:5, fontFamily:'inherit'
          }}>
            <i className="ti ti-arrow-left" style={{ fontSize:13 }} /> กลับแผนที่
          </button>
          <div style={{ width:1, height:28, background:'rgba(255,255,255,0.08)' }} />
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <span style={{ width:8, height:8, borderRadius:'50%', background:'#00c8b4',
              boxShadow:'0 0 0 3px rgba(0,200,180,0.2)', flexShrink:0 }} />
            <div>
              <div style={{ fontSize:14, fontWeight:700, color:'#fff' }}>
                ศูนย์บริหารจัดการเทศบาลตำบลเด่นชัย — Smart City
              </div>
              <div style={{ fontSize:10, color:'rgba(0,200,180,0.7)', marginTop:1 }}>
                ข้อมูล ณ {dateStr} · อัปเดตอัตโนมัติ
              </div>
            </div>
          </div>
        </div>

        {/* KPI summary */}
        <div style={{ display:'flex', alignItems:'center', gap:0 }}>
          {[
            { num: counts.poi,     lbl:'สถานที่',     color:'#00c8b4' },
            { num: counts.infra,   lbl:'โครงสร้าง',   color:'#f59e0b' },
            { num: counts.water,   lbl:'แหล่งน้ำ',    color:'#3b82f6' },
            { num: counts.service, lbl:'บริการ',      color:'#8b5cf6' },
            { num: lpaAvg+'%',     lbl:'LPA',         color:'#a78bfa' },
          ].map((k,i) => (
            <div key={i} style={{ textAlign:'center', padding:'0 16px',
              borderLeft: i>0 ? '1px solid rgba(255,255,255,0.07)' : 'none' }}>
              <div style={{ fontSize:20, fontWeight:700, color:k.color, lineHeight:1 }}>{k.num}</div>
              <div style={{ fontSize:9, color:'rgba(255,255,255,0.4)', marginTop:2 }}>{k.lbl}</div>
            </div>
          ))}
          <div style={{ width:1, height:28, background:'rgba(255,255,255,0.08)', margin:'0 8px' }} />
          <button onClick={() => navigate('/editor')} style={{
            padding:'6px 12px', borderRadius:6, border:'1px solid rgba(56,189,248,0.35)',
            background:'rgba(56,189,248,0.08)', color:'#38bdf8',
            fontSize:11, fontWeight:600, cursor:'pointer', fontFamily:'inherit',
            display:'flex', alignItems:'center', gap:5
          }}>
            <i className="ti ti-pencil" style={{ fontSize:12 }} /> จัดการข้อมูล
          </button>
        </div>
      </div>

      {/* ── Tab Nav ── */}
      <div style={{
        display:'flex', gap:2, padding:'6px 16px',
        background:'#080f1e', borderBottom:'1px solid rgba(0,200,180,0.1)',
        flexShrink:0
      }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:'6px 14px', borderRadius:6, border:'none', cursor:'pointer',
            fontFamily:'inherit', fontSize:12, fontWeight:500,
            display:'flex', alignItems:'center', gap:6, transition:'all .15s',
            background: activeTab===t.key ? 'rgba(0,200,180,0.15)' : 'transparent',
            color: activeTab===t.key ? '#00c8b4' : '#64748b',
            borderBottom: activeTab===t.key ? '2px solid #00c8b4' : '2px solid transparent',
          }}>
            <i className={`ti ${t.icon}`} style={{ fontSize:13 }} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Body ── */}
      <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>

        {/* ══ OVERVIEW ══ */}
        {activeTab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'200px 1fr 200px', gridTemplateRows:'1fr auto', gap:10, height:'calc(100vh - 160px)' }}>

            {/* Left */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

              <div style={C.card}>
                <CardTitle>ชั้นข้อมูล</CardTitle>
                {[
                  { dot:'#00c8b4', name:'สถานที่สำคัญ',     num: counts.poi,     key:'poi' },
                  { dot:'#f59e0b', name:'โครงสร้างพื้นฐาน', num: counts.infra,   key:'infra' },
                  { dot:'#3b82f6', name:'ทรัพยากรน้ำ',      num: counts.water,   key:'water' },
                  { dot:'#8b5cf6', name:'บริการสาธารณะ',    num: counts.service, key:'service' },
                ].map((l,i) => (
                  <div key={i} style={{ ...C.row, cursor:'pointer' }} onClick={() => navigate(`/?layer=${l.key}`)}>
                    <span style={{ width:8, height:8, borderRadius:2, background:l.dot, flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#94a3b8', flex:1 }}>{l.name}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:l.dot }}>{l.num}</span>
                  </div>
                ))}
              </div>

              <div style={C.card}>
                <CardTitle>LPA คะแนนรายด้าน</CardTitle>
                {LPA.map(a => (
                  <div key={a.id} style={{ display:'flex', alignItems:'center', gap:6, padding:'3px 0' }}>
                    <span style={{ fontSize:10, color:'#64748b', width:50, flexShrink:0,
                      overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.th}</span>
                    <div style={{ flex:1, height:5, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                      <div style={{ height:'100%', width:a.score+'%', background:a.color, borderRadius:3 }} />
                    </div>
                    <span style={{ fontSize:10, fontWeight:700, color:a.color, minWidth:22, textAlign:'right' }}>{a.score}</span>
                  </div>
                ))}
              </div>

              <div style={{ ...C.card, flex:1 }}>
                <CardTitle>รายการเร่งด่วน</CardTitle>
                {ALERTS.filter(a=>a.level==='danger').map(a => (
                  <div key={a.id} style={{
                    display:'flex', alignItems:'center', gap:7, padding:'6px 8px',
                    borderRadius:6, background:levelBg(a.level), cursor:'pointer'
                  }} onClick={() => navigate('/')}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:levelColor(a.level), flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#c8d3e8', flex:1, lineHeight:1.3 }}>{a.txt}</span>
                    <span style={{ fontSize:9, color:'#475569', whiteSpace:'nowrap' }}>{a.time}</span>
                  </div>
                ))}
                {ALERTS.filter(a=>a.level==='warning').map(a => (
                  <div key={a.id} style={{
                    display:'flex', alignItems:'center', gap:7, padding:'6px 8px',
                    borderRadius:6, background:levelBg(a.level), cursor:'pointer'
                  }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:levelColor(a.level), flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#c8d3e8', flex:1, lineHeight:1.3 }}>{a.txt}</span>
                    <span style={{ fontSize:9, color:'#475569', whiteSpace:'nowrap' }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Center — Map */}
            <div style={{
              background:'linear-gradient(135deg,#060d1a,#0d2137)',
              border:'1px solid rgba(0,200,180,0.15)', borderRadius:10,
              position:'relative', overflow:'hidden', display:'flex',
              alignItems:'center', justifyContent:'center', cursor:'pointer'
            }} onClick={() => navigate('/')}>
              <div style={{
                position:'absolute', inset:0,
                backgroundImage:'linear-gradient(rgba(0,200,180,0.05) 1px,transparent 1px),linear-gradient(90deg,rgba(0,200,180,0.05) 1px,transparent 1px)',
                backgroundSize:'30px 30px'
              }} />
              <div style={{ position:'relative', textAlign:'center' }}>
                <i className="ti ti-map-2" style={{ fontSize:48, color:'rgba(0,200,180,0.15)', display:'block', marginBottom:10 }} />
                <div style={{ fontSize:14, fontWeight:600, color:'rgba(255,255,255,0.3)' }}>แผนที่ GIS เด่นชัย</div>
                <div style={{ fontSize:11, color:'rgba(0,200,180,0.4)', marginTop:4 }}>คลิกเพื่อเปิดแผนที่</div>
              </div>
              {/* Fake pins */}
              {[
                { t:'28%', l:'38%', c:'#ef4444', n:'รพ.เด่นชัย' },
                { t:'42%', l:'55%', c:'#f59e0b', n:'วัดเด่นชัย' },
                { t:'58%', l:'44%', c:'#8b5cf6', n:'โรงเรียน' },
                { t:'35%', l:'65%', c:'#0ea5e9', n:'ตลาด' },
              ].map((p,i) => (
                <div key={i} style={{ position:'absolute', top:p.t, left:p.l, display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                  <div style={{ width:10, height:14, background:p.c, border:'1.5px solid #fff', borderRadius:'50% 50% 50% 50%/60% 60% 40% 40%' }} />
                  <div style={{ fontSize:8, color:'#fff', background:`${p.c}cc`, padding:'1px 4px', borderRadius:3, whiteSpace:'nowrap' }}>{p.n}</div>
                </div>
              ))}
            </div>

            {/* Right */}
            <div style={{ display:'flex', flexDirection:'column', gap:8 }}>

              <div style={C.card}>
                <CardTitle>สถิติสถานที่</CardTitle>
                {(poiGroups.length > 0 ? poiGroups : [
                  ['โรงพยาบาล',2],['วัด/ศาสน์',11],['โรงเรียน',6],
                  ['ตลาด',7],['คมนาคม',8],['ราชการ',3]
                ]).slice(0,6).map(([k,v],i) => (
                  <div key={i} style={{ ...C.row, cursor:'pointer' }} onClick={() => navigate('/')}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:['#ef4444','#f59e0b','#8b5cf6','#f97316','#0ea5e9','#3b82f6'][i], flexShrink:0 }} />
                    <span style={{ fontSize:11, color:'#94a3b8', flex:1 }}>{k}</span>
                    <span style={{ fontSize:12, fontWeight:700, color:'#00c8b4' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div style={C.card}>
                <CardTitle>โครงสร้างพื้นฐาน</CardTitle>
                <div style={{ display:'flex', gap:2, alignItems:'flex-end', height:50 }}>
                  {INFRA_CHART.map((b,i) => (
                    <div key={i} style={{ flex:1, borderRadius:'3px 3px 0 0',
                      height: Math.max(10, b.value/101*100)+'%', background:b.fill,
                      minHeight:4, opacity:.85 }} title={`${b.name}: ${b.value}`} />
                  ))}
                </div>
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:2 }}>
                  <span style={{ fontSize:9, color:'#475569' }}>ทางหลวง</span>
                  <span style={{ fontSize:9, color:'#475569' }}>ซอย</span>
                </div>
              </div>

              <div style={{ ...C.card, flex:1 }}>
                <CardTitle>ทรัพยากรน้ำ</CardTitle>
                {(waterGroups.length > 0 ? waterGroups : [
                  ['แม่น้ำ/ลำห้วย',45],['อ่างเก็บน้ำ',23],['สระ/หนอง',189],['ประปา',30]
                ]).map(([k,v],i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'3px 0',
                    borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                    <span style={{ fontSize:10, color:'#64748b' }}>{k}</span>
                    <span style={{ fontSize:11, fontWeight:700, color:['#3b82f6','#0ea5e9','#38bdf8','#7dd3fc'][i] }}>{v}</span>
                  </div>
                ))}
                <div style={{ display:'flex', justifyContent:'space-between', paddingTop:4 }}>
                  <span style={{ fontSize:10, color:'#64748b' }}>รวม</span>
                  <span style={{ fontSize:13, fontWeight:700, color:'#00c8b4' }}>{counts.water} แห่ง</span>
                </div>
              </div>
            </div>

            {/* Bottom KPI bar */}
            <div style={{ gridColumn:'1/-1', display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
              {[
                { icon:'ti-map-pin',           num: counts.poi,     lbl:'สถานที่สำคัญ',     color:'#00c8b4', bg:'rgba(0,200,180,0.1)' },
                { icon:'ti-road',              num: counts.infra,   lbl:'โครงสร้างพื้นฐาน', color:'#f59e0b', bg:'rgba(245,158,11,0.1)' },
                { icon:'ti-droplet',           num: counts.water,   lbl:'ทรัพยากรน้ำ',      color:'#3b82f6', bg:'rgba(59,130,246,0.1)' },
                { icon:'ti-heart-rate-monitor',num: counts.service, lbl:'บริการสาธารณะ',    color:'#8b5cf6', bg:'rgba(139,92,246,0.1)' },
                { icon:'ti-chart-radar',       num: lpaAvg+'%',     lbl:'คะแนน LPA เฉลี่ย', color:'#a78bfa', bg:'rgba(167,139,250,0.1)' },
              ].map((k,i) => (
                <div key={i} style={{ ...C.card, flexDirection:'row', alignItems:'center', gap:10, padding:'10px 14px' }}>
                  <div style={{ width:36, height:36, borderRadius:8, background:k.bg,
                    display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                    <i className={`ti ${k.icon}`} style={{ fontSize:18, color:k.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize:22, fontWeight:700, color:'#fff', lineHeight:1 }}>{k.num}</div>
                    <div style={{ fontSize:10, color:'#475569', marginTop:2 }}>{k.lbl}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ LPA TAB ══ */}
        {activeTab === 'lpa' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={C.card}>
              <CardTitle>คะแนน LPA Radar</CardTitle>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="aspect" tick={{ fill:'#64748b', fontSize:11 }} />
                  <Radar dataKey="score" stroke="#00c8b4" fill="#00c8b4" fillOpacity={0.15} strokeWidth={2} />
                  <Tooltip contentStyle={{ background:'#0a1628', border:'1px solid rgba(0,200,180,0.2)', borderRadius:8, color:'#f0f4ff', fontSize:12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            <div style={C.card}>
              <CardTitle>คะแนนแต่ละด้าน</CardTitle>
              {LPA.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'8px 0',
                  borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                  <i className={`ti ${a.icon}`} style={{ fontSize:16, color:a.color, flexShrink:0 }} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, color:'#f0f4ff', fontWeight:500, marginBottom:4 }}>{a.th}</div>
                    <div style={{ height:5, background:'rgba(255,255,255,0.07)', borderRadius:3 }}>
                      <div style={{ height:'100%', width:a.score+'%', background:a.color, borderRadius:3, transition:'width .4s' }} />
                    </div>
                  </div>
                  <span style={{ fontSize:18, fontWeight:700, color:a.color, minWidth:36, textAlign:'right' }}>{a.score}</span>
                </div>
              ))}
              <div style={{ marginTop:8, padding:'8px 12px', background:'rgba(0,200,180,0.08)',
                borderRadius:8, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:13, color:'#94a3b8' }}>คะแนนเฉลี่ยรวม</span>
                <span style={{ fontSize:24, fontWeight:700, color:scoreColor(lpaAvg) }}>{lpaAvg}%</span>
              </div>
            </div>
          </div>
        )}

        {/* ══ POI TAB ══ */}
        {activeTab === 'poi' && (
          <div style={C.card}>
            <CardTitle>สถานที่สำคัญทั้งหมด {counts.poi} จุด</CardTitle>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr>
                    {['หมวดหมู่','จำนวน','สัดส่วน',''].map((h,i) => (
                      <th key={i} style={{ padding:'8px 12px', textAlign: i>0 ? 'right' : 'left',
                        fontSize:10, fontWeight:600, color:'#475569', textTransform:'uppercase',
                        letterSpacing:'.04em', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(poiGroups.length > 0 ? poiGroups : [
                    ['วัด/ศาสนสถาน',11],['คมนาคม/ปั๊ม',8],['ตลาด/ร้านค้า',7],
                    ['โรงเรียน',6],['โรงงาน',9],['โรงพยาบาล',2],['ราชการ',3],
                  ]).map(([k,v],i) => (
                    <tr key={i} style={{ cursor:'pointer' }} onClick={() => navigate('/')}>
                      <td style={{ padding:'9px 12px', color:'#c8d3e8' }}>{k}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:700, color:'#00c8b4' }}>{v}</td>
                      <td style={{ padding:'9px 12px', textAlign:'right' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                          <div style={{ width:80, height:5, background:'rgba(255,255,255,0.07)', borderRadius:3 }}>
                            <div style={{ width: Math.round(v/counts.poi*100)+'%', height:'100%', background:'#00c8b4', borderRadius:3 }} />
                          </div>
                          <span style={{ fontSize:10, color:'#475569', minWidth:28 }}>{Math.round(v/counts.poi*100)}%</span>
                        </div>
                      </td>
                      <td style={{ padding:'9px 12px', textAlign:'right', fontSize:11, color:'#00c8b4' }}>ดูแผนที่ →</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ══ INFRA TAB ══ */}
        {activeTab === 'infra' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div style={C.card}>
              <CardTitle>โครงสร้างพื้นฐานแยกประเภท</CardTitle>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={INFRA_CHART} margin={{ top:0, right:0, left:-25, bottom:0 }}>
                  <XAxis dataKey="name" tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill:'#475569', fontSize:10 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background:'#0a1628', border:'1px solid rgba(0,200,180,0.2)', borderRadius:8, color:'#f0f4ff', fontSize:12 }} />
                  <Bar dataKey="value" radius={[3,3,0,0]}>
                    {INFRA_CHART.map((e,i) => <rect key={i} fill={e.fill} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={C.card}>
              <CardTitle>รายการแจ้งซ่อม</CardTitle>
              {ALERTS.map(a => (
                <div key={a.id} style={{ display:'flex', alignItems:'center', gap:8,
                  padding:'8px 10px', borderRadius:6, background:levelBg(a.level), marginBottom:4 }}>
                  <span style={{ width:6, height:6, borderRadius:'50%', background:levelColor(a.level), flexShrink:0 }} />
                  <span style={{ fontSize:12, color:'#c8d3e8', flex:1 }}>{a.txt}</span>
                  <span style={{ fontSize:10, color:'#475569' }}>{a.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══ WATER TAB ══ */}
        {activeTab === 'water' && (
          <div style={C.card}>
            <CardTitle>ทรัพยากรน้ำทั้งหมด {counts.water} แห่ง</CardTitle>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr>
                  {['ประเภท','จำนวน','สัดส่วน',''].map((h,i) => (
                    <th key={i} style={{ padding:'8px 12px', textAlign:i>0?'right':'left',
                      fontSize:10, fontWeight:600, color:'#475569', textTransform:'uppercase',
                      letterSpacing:'.04em', borderBottom:'1px solid rgba(255,255,255,0.06)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(waterGroups.length > 0 ? waterGroups : [
                  ['แม่น้ำ/ลำห้วย',45],['อ่างเก็บน้ำ',23],['สระน้ำ/หนอง',189],['ระบบประปา',30]
                ]).map(([k,v],i) => (
                  <tr key={i} style={{ cursor:'pointer' }} onClick={() => navigate('/')}>
                    <td style={{ padding:'9px 12px', color:'#c8d3e8' }}>{k}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right', fontWeight:700, color:'#3b82f6' }}>{v}</td>
                    <td style={{ padding:'9px 12px', textAlign:'right' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8, justifyContent:'flex-end' }}>
                        <div style={{ width:80, height:5, background:'rgba(255,255,255,0.07)', borderRadius:3 }}>
                          <div style={{ width: Math.round(v/counts.water*100)+'%', height:'100%', background:'#3b82f6', borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:10, color:'#475569', minWidth:28 }}>{Math.round(v/counts.water*100)}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'9px 12px', textAlign:'right', fontSize:11, color:'#3b82f6' }}>ดูแผนที่ →</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
