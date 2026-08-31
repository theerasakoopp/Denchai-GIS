import React, { useState, useEffect } from 'react';
import { getGithubToken, saveGithubToken, clearGithubToken, verifyToken } from '../utils/githubSync';

export default function GitHubSyncPanel({ lang }) {
  const [token, setToken]       = useState('');
  const [saved, setSaved]       = useState(false);
  const [status, setStatus]     = useState(null); // null | 'checking' | 'ok' | 'fail'
  const [username, setUsername] = useState('');
  const [show, setShow]         = useState(false);

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

  return (
    <div style={{ background: '#141c2e', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, overflow: 'hidden' }}>
      {/* Header */}
      <div
        onClick={() => setShow(!show)}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', cursor: 'pointer', background: 'rgba(255,255,255,0.03)' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>🔗</span>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#f0f4ff' }}>
            {lang === 'th' ? 'เชื่อม GitHub Auto-Save' : 'GitHub Auto-Save'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {saved && <span style={{ fontSize: '0.68rem', background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', padding: '2px 7px', borderRadius: 99 }}>✓ Connected</span>}
          <span style={{ color: '#64748b', fontSize: 12 }}>{show ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Body */}
      {show && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {status === 'ok' && (
            <div style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: '0.76rem', color: '#34d399' }}>
              ✅ เชื่อมต่อสำเร็จ! บัญชี: <strong>{username || 'theerasakoopp'}</strong>
            </div>
          )}
          {status === 'fail' && (
            <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '8px 12px', fontSize: '0.76rem', color: '#f87171' }}>
              ❌ Token ไม่ถูกต้อง กรุณาตรวจสอบอีกครั้ง
            </div>
          )}

          <div style={{ fontSize: '0.74rem', color: '#64748b', lineHeight: 1.5 }}>
            🔒 Token เก็บใน Browser เท่านั้น ไม่ได้ upload ขึ้น GitHub
          </div>

          {!saved ? (
            <>
              <input
                type="password"
                placeholder="วาง GitHub Token (ghp_...)"
                value={token}
                onChange={e => setToken(e.target.value)}
                style={{ padding: '8px 10px', borderRadius: 8, fontSize: '0.78rem', width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#f0f4ff', outline: 'none' }}
              />
              <button
                onClick={handleSave}
                disabled={!token || status === 'checking'}
                style={{ padding: '8px', borderRadius: 8, background: token ? 'linear-gradient(135deg,#2563eb,#3b82f6)' : 'rgba(255,255,255,0.05)', border: 'none', color: token ? '#fff' : '#64748b', fontWeight: 700, fontSize: '0.78rem', cursor: token ? 'pointer' : 'not-allowed' }}
              >
                {status === 'checking' ? '⏳ กำลังตรวจสอบ...' : '🔗 เชื่อมต่อ GitHub'}
              </button>
            </>
          ) : (
            <button
              onClick={handleClear}
              style={{ padding: '7px', borderRadius: 8, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171', fontWeight: 600, fontSize: '0.76rem', cursor: 'pointer' }}
            >
              🔓 ยกเลิกการเชื่อมต่อ
            </button>
          )}

          <div style={{ fontSize: '0.72rem', color: '#475569', lineHeight: 1.6 }}>
            หลังเชื่อมต่อแล้ว กดบันทึกใน Editor จะ Push ขึ้น GitHub อัตโนมัติ รอ ~2 นาที เว็บจะอัปเดตเลยครับ
          </div>
        </div>
      )}
    </div>
  );
}
