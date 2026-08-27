import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FolderOpen, Play, AlertCircle, Info, Upload } from 'lucide-react';

const API = 'http://localhost:8000';

const Field = ({ label, value, onChange, placeholder, hint }) => (
  <div style={{ marginBottom: 16 }}>
    <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', marginBottom: 6 }}>
      {label}
    </label>
    <input
      type="text"
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      style={{
        width: '100%', padding: '10px 14px',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 8, color: '#f8fafc', fontSize: '0.85rem',
        outline: 'none', transition: 'border-color 0.2s',
        fontFamily: 'monospace',
      }}
      onFocus={e => e.target.style.borderColor = '#3b82f6'}
      onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
    />
    {hint && <p style={{ fontSize: '0.7rem', color: '#475569', marginTop: 4 }}>{hint}</p>}
  </div>
);

export default function UploadPage() {
  const nav = useNavigate();
  const [form, setForm] = useState({
    rgb_path:        '',
    dsm_path:        '',
    checkpoint_path: '',
    boundary_path:   '',
    tile_size:       1024,
    overlap:         64,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const set = (k) => (v) => setForm(f => ({ ...f, [k]: v }));

  const handleStart = async () => {
    if (!form.rgb_path.trim() || !form.dsm_path.trim()) {
      setError('กรุณาระบุ Path ของ RGB และ DSM');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const body = {
        rgb_path:        form.rgb_path.trim(),
        dsm_path:        form.dsm_path.trim(),
        checkpoint_path: form.checkpoint_path.trim() || null,
        boundary_path:   form.boundary_path.trim() || null,
        tile_size:       Number(form.tile_size),
        overlap:         Number(form.overlap),
      };
      const res  = await fetch(`${API}/api/start`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Server error');
      }
      const { job_id } = await res.json();
      nav(`/processing/${job_id}`);
    } catch (e) {
      setError(e.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 640 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>☀️</div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Rooftop Solar Pipeline
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: '0.9rem' }}>
            RGB + DSM → AI Inference → Dashboard
          </p>
        </div>

        {/* Form card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 32,
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>

          {/* Info box */}
          <div style={{
            background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)',
            borderRadius: 8, padding: '10px 14px', marginBottom: 24,
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Info size={14} color="#60a5fa" style={{ flexShrink: 0, marginTop: 2 }} />
            <p style={{ fontSize: '0.75rem', color: '#93c5fd', margin: 0, lineHeight: 1.6 }}>
              ระบุ <b>path บนเครื่อง</b> ของไฟล์ GeoTIFF (ไม่ต้องอัปโหลด — ไฟล์ถูกอ่านโดยตรง)
            </p>
          </div>

          <p style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 16 }}>
            Required
          </p>

          <Field label="RGB Orthophoto (.tif)" value={form.rgb_path} onChange={set('rgb_path')}
            placeholder="D:\Data\orthophoto.tif"
            hint="GeoTIFF สี RGB ขนาดสูงสุด 20 GB" />
          <Field label="DSM (.tif)" value={form.dsm_path} onChange={set('dsm_path')}
            placeholder="D:\Data\dsm.tif"
            hint="Digital Surface Model (Float32 หรือ Int16)" />

          <p style={{ fontSize: '0.76rem', fontWeight: 700, color: '#64748b',
            textTransform: 'uppercase', letterSpacing: '0.07em', margin: '20px 0 16px' }}>
            Optional
          </p>

          <Field label="AI Checkpoint (.pth)" value={form.checkpoint_path} onChange={set('checkpoint_path')}
            placeholder="ว่างไว้ = ใช้ default checkpoint" />
          <Field label="Boundary Shapefile / GeoJSON" value={form.boundary_path} onChange={set('boundary_path')}
            placeholder="D:\Data\study_area.shp (optional)" />

          {/* Tile settings */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                color: '#94a3b8', marginBottom: 6 }}>Tile Size (px)</label>
              <select value={form.tile_size} onChange={e => set('tile_size')(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                  color: '#f8fafc', fontSize: '0.85rem' }}>
                <option value={512}>512 × 512</option>
                <option value={1024}>1024 × 1024</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600,
                color: '#94a3b8', marginBottom: 6 }}>Overlap (px)</label>
              <select value={form.overlap} onChange={e => set('overlap')(e.target.value)}
                style={{ width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                  color: '#f8fafc', fontSize: '0.85rem' }}>
                <option value={0}>0 (no overlap)</option>
                <option value={64}>64</option>
                <option value={128}>128</option>
              </select>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: 8, padding: '10px 14px', marginBottom: 20,
              display: 'flex', gap: 8, alignItems: 'center',
            }}>
              <AlertCircle size={14} color="#f87171" />
              <span style={{ color: '#f87171', fontSize: '0.8rem' }}>{error}</span>
            </div>
          )}

          <button
            onClick={handleStart}
            disabled={loading}
            style={{
              width: '100%', padding: '14px',
              background: loading ? 'rgba(99,102,241,0.3)' : 'linear-gradient(135deg, #3b82f6, #6366f1)',
              border: 'none', borderRadius: 10, color: 'white',
              fontSize: '0.95rem', fontWeight: 700, cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              transition: 'all 0.2s', boxShadow: loading ? 'none' : '0 4px 20px rgba(59,130,246,0.35)',
            }}
          >
            {loading ? (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56" style={{ animation: 'spin 1s linear infinite' }} />
                </svg>
                Starting Pipeline...
              </>
            ) : (
              <><Play size={18} /> Run Full Pipeline</>
            )}
          </button>
        </div>

        {/* Back link */}
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: '0.8rem' }}>
          <a href="/" style={{ color: '#3b82f6', textDecoration: 'none' }}>
            ← กลับไปยัง Dashboard
          </a>
        </p>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        option { background: #1e293b; }
      `}</style>
    </div>
  );
}
