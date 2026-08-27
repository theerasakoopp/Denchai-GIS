import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';

const API = 'http://localhost:8000';

const STEPS = [
  { key: 'tiling',    label: 'Step 1 — Tiling',        range: [0,  30],  color: '#3b82f6' },
  { key: 'inference', label: 'Step 2 — AI Inference',   range: [30, 80],  color: '#6366f1' },
  { key: 'postproc',  label: 'Step 3 — Vectorizing',    range: [80, 100], color: '#22c55e' },
];

function stepStatus(step, currentStatus, progress) {
  const idx  = STEPS.findIndex(s => s.key === currentStatus);
  const myIdx = STEPS.findIndex(s => s.key === step);
  if (currentStatus === 'done') return 'done';
  if (currentStatus === 'error') return myIdx <= idx ? 'error' : 'pending';
  if (myIdx < idx) return 'done';
  if (myIdx === idx) return 'active';
  return 'pending';
}

export default function ProcessingPage() {
  const { jobId } = useParams();
  const nav       = useNavigate();

  const [status, setStatus]   = useState('pending');
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState('Starting...');
  const [error, setError]     = useState('');
  const intervalRef           = useRef(null);

  useEffect(() => {
    intervalRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/api/status/${jobId}`);
        const data = await res.json();

        setStatus(data.status);
        setProgress(data.progress ?? 0);
        setMessage(data.message ?? '');

        if (data.status === 'done') {
          clearInterval(intervalRef.current);
          // Load result GeoJSON into public folder via redirect
          setTimeout(() => nav(`/result/${jobId}`), 1200);
        }
        if (data.status === 'error') {
          setError(data.error || data.message);
          clearInterval(intervalRef.current);
        }
      } catch (e) {
        setError('Cannot reach backend at localhost:8000');
        clearInterval(intervalRef.current);
      }
    }, 1500);

    return () => clearInterval(intervalRef.current);
  }, [jobId, nav]);

  const pct = Math.min(100, Math.round(progress));

  return (
    <div style={{
      minHeight: '100vh', background: '#0f172a',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Inter', sans-serif", padding: 24,
    }}>
      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Title */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <h1 style={{
            fontSize: '1.6rem', fontWeight: 700, margin: 0,
            background: 'linear-gradient(135deg, #60a5fa, #a78bfa)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          }}>
            Pipeline Running
          </h1>
          <p style={{ color: '#64748b', marginTop: 8, fontSize: '0.85rem' }}>
            Job ID: <code style={{ color: '#94a3b8' }}>{jobId}</code>
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 16, padding: 32,
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
        }}>

          {/* Overall progress bar */}
          <div style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Overall Progress</span>
              <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#60a5fa' }}>{pct}%</span>
            </div>
            <div style={{ height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                width: `${pct}%`,
                background: status === 'error'
                  ? 'linear-gradient(to right, #ef4444, #dc2626)'
                  : status === 'done'
                  ? 'linear-gradient(to right, #22c55e, #16a34a)'
                  : 'linear-gradient(to right, #3b82f6, #6366f1)',
                borderRadius: 4,
                transition: 'width 0.5s ease',
                boxShadow: status !== 'error' ? '0 0 12px rgba(99,102,241,0.5)' : 'none',
              }} />
            </div>
          </div>

          {/* Step indicators */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 28 }}>
            {STEPS.map(step => {
              const st = stepStatus(step.key, status, progress);
              return (
                <div key={step.key} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '12px 16px', borderRadius: 10,
                  background: st === 'active'
                    ? `rgba(${step.color === '#3b82f6' ? '59,130,246' : step.color === '#6366f1' ? '99,102,241' : '34,197,94'},0.08)`
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${st === 'active' ? step.color + '44' : 'rgba(255,255,255,0.06)'}`,
                  transition: 'all 0.3s',
                }}>
                  {/* Icon */}
                  {st === 'done'    && <CheckCircle size={20} color="#22c55e" />}
                  {st === 'active'  && <Loader size={20} color={step.color} style={{ animation: 'spin 1.2s linear infinite' }} />}
                  {st === 'pending' && <div style={{ width: 20, height: 20, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.15)' }} />}
                  {st === 'error'   && <AlertCircle size={20} color="#ef4444" />}
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '0.85rem', fontWeight: 600,
                      color: st === 'done' ? '#22c55e' : st === 'active' ? '#f8fafc' : '#475569',
                    }}>
                      {step.label}
                    </div>
                    {st === 'active' && (
                      <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: 2 }}>{message}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Status message */}
          {status === 'done' && (
            <div style={{
              background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
              borderRadius: 10, padding: '14px 16px', textAlign: 'center',
            }}>
              <CheckCircle size={24} color="#22c55e" style={{ marginBottom: 6 }} />
              <div style={{ color: '#22c55e', fontWeight: 600 }}>Pipeline complete!</div>
              <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: 4 }}>Redirecting to Dashboard...</div>
            </div>
          )}

          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 10, padding: 16,
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                <AlertCircle size={16} color="#f87171" />
                <span style={{ color: '#f87171', fontWeight: 600, fontSize: '0.85rem' }}>Pipeline Error</span>
              </div>
              <pre style={{
                color: '#94a3b8', fontSize: '0.72rem', overflowX: 'auto',
                background: 'rgba(0,0,0,0.3)', padding: 10, borderRadius: 6, margin: 0,
                maxHeight: 200, overflowY: 'auto',
              }}>{error}</pre>
              <button onClick={() => nav('/upload')} style={{
                marginTop: 12, padding: '8px 16px', background: 'rgba(239,68,68,0.2)',
                border: '1px solid rgba(239,68,68,0.4)', borderRadius: 8,
                color: '#f87171', cursor: 'pointer', fontSize: '0.8rem',
              }}>
                ← Try again
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        * { box-sizing: border-box; }
        body { margin: 0; }
      `}</style>
    </div>
  );
}
