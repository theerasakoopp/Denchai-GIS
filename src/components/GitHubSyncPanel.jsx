import React, { useState, useEffect } from 'react';
import { getGithubToken, saveGithubToken, clearGithubToken, verifyToken } from '../utils/githubSync';

export default function GitHubSyncPanel({ lang, dark = false }) {
  const [token, setToken]       = useState('');
  const [saved, setSaved]       = useState(false);
  const [status, setStatus]     = useState(null);
  const [username, setUsername] = useState('');
  const [show, setShow]         = useState(true);

  useEffect(() => {
    const t = getGithubToken();
    if (t) { setSaved(true); setToken(t.slice(0,8) + '••••••••••••••••'); }
  }, []);

  async function handleSave() {
    if (!token || token.includes('•')) return;
    setStatus('checking');
    const result = await verifyToken(token);
    if (result.ok) {
      saveGithubToken(token);
      setSaved(true);
      setUsername(result.login);
      setStatus('ok');
      setToken(token.slice(0,8) + '••••••••••••••••');
    } else {
      setStatus('fail');
    }
  }

  function handleClear() {
    clearGithubToken();
    setSaved(false);
    setToken('');
    setStatus(null);
    setUsername('');
  }

  // styles ปรับตาม dark/light mode
  const s = {
    wrap:    { background: dark ? '#141c2e' : '#f8fafc', border: `1px solid ${dark ? 'rgba(255,255,255,0.08)' : '#e2e8f0'}`, borderRadius: 10, overflow: 'hidden' },
    header:  { display:'flex', alignItems:'center', justifyContent:'space-between', padding:'10px 14px', cursor:'pointer', background: dark ? 'rgba(255,255,255,0.03)' : '#f1f5f9' },
    title:   { fontSize:'0.8rem', fontWeight:700, color: dark ? '#f0f4ff' : '#1e293b' },
    body:    { padding:'12px 14px', display:'flex', flexDirection:'column', gap:10 },
    hint:    { fontSize:'0.74rem', color: dark ? '#64748b' : '#64748b', lineHeight:1.5 },
    input:   { padding:'8px 10px', borderRadius:8, fontSize:'0.78rem', width:'100%', background: dark ? 'rgba(255,255,255,0.05)' : '#fff', border:`1px solid ${dark ? 'rgba(255,255,255,0.1)' : '#cbd5e1'}`, color: dark ? '#f0f4ff' : '#1e293b', outline:'none' },
    btnConn: { padding:'8px', borderRadius:8, background:'linear-gradient(135deg,#2563eb,#3b82f6)', border:'none', color:'#fff', fontWeight:700, fontSize:'0.78rem', cursor:'pointer' },
    btnDis:  { padding:'7px', borderRadius:8, background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', color:'#ef4444', fontWeight:600, fontSize:'0.76rem', cursor:'pointer' },
    badge:   { fontSize:'0.68rem', background:'rgba(16,185,129,0.15)', border:'1px solid rgba(16,185,129,0.3)', color:'#10b981', padding:'2px 7px', borderRadius:99 },
    note:    { fontSize:'0.72rem', color: dark ? '#475569' : '#94a3b8', lineHeight:1.6 },
  };

  return (
    <div style={s.wrap}>
      <div onClick={() => setShow(!show)} style={s.header}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <span>🔗</span>
          <span style={s.title}>{lang === 'th' ? 'GitHub Auto-Save' : 'GitHub Auto-Save'}</span>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          {saved && <span style={s.badge}>✓ Connected</span>}
          <span style={{ color:'#94a3b8', fontSize:12 }}>{show ? '▲' : '▼'}</span>
        </div>
      </div>

      {show && (
        <div style={s.body}>
          {status === 'ok' && (
            <div style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.25)', borderRadius:8, padding:'8px 12px', fontSize:'0.76rem', color:'#10b981' }}>
              ✅ เชื่อมต่อสำเร็จ! บัญชี: <strong>{username || 'theerasakoopp'}</strong>
            </div>
          )}
          {status === 'fail' && (
            <div style={{ background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:8, padding:'8px 12px', fontSize:'0.76rem', color:'#ef4444' }}>
              ❌ Token ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง
            </div>
          )}
          <div style={s.hint}>🔒 Token เก็บใน Browser เท่านั้น ไม่ได้ upload ขึ้น GitHub</div>
          {!saved ? (
            <>
              <input type="password" placeholder="วาง GitHub Token (ghp_...)" value={token}
                onChange={e => setToken(e.target.value)} style={s.input} />
              <button onClick={handleSave} disabled={!token || status === 'checking'} style={{
                ...s.btnConn,
                background: token ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : '#e2e8f0',
                color: token ? '#fff' : '#94a3b8',
                cursor: token ? 'pointer' : 'not-allowed'
              }}>
                {status === 'checking' ? '⏳ กำลังตรวจสอบ...' : '🔗 เชื่อมต่อ GitHub'}
              </button>
            </>
          ) : (
            <button onClick={handleClear} style={s.btnDis}>🔓 ยกเลิกการเชื่อมต่อ</button>
          )}
          <div style={s.note}>
            หลังเชื่อมต่อแล้ว กดบันทึกใน Editor จะ Push ขึ้น GitHub อัตโนมัติ รอ ~2 นาที เว็บจะอัปเดตเลย
          </div>
        </div>
      )}
    </div>
  );
}
