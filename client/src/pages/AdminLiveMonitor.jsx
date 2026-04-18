import React, { useState, useEffect, useRef } from 'react';
import { Video, Eye, AlertTriangle, ShieldAlert, BadgeCheck, Search, Maximize2, X } from 'lucide-react';
import { io } from 'socket.io-client';

const LiveVideoRenderer = ({ candidate, onFullscreen }) => {
  return (
    <div className="card" style={{ overflow: 'hidden', padding: 0, position: 'relative', border: candidate.status === 'critical' ? '2px solid #EF4444' : candidate.status === 'warning' ? '2px solid #F59E0B' : '1px solid #E2E8F0' }}>
      <div style={{ position: 'relative', background: '#000', height: 220, overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        {candidate.frame ? (
          <img 
            src={candidate.frame} 
            alt="Candidate stream" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        ) : (
          <div style={{ color: '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            Waiting for connection...
          </div>
        )}
        
        {/* Overlays */}
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 8 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.6)', color: 'white', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444' }} /> LIVE
          </span>
          <span style={{ display: 'inline-flex', alignItems: 'center', background: 'rgba(0,0,0,0.6)', color: '#E2E8F0', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontWeight: 500, backdropFilter: 'blur(4px)', fontFamily: 'monospace' }}>
            {candidate.duration || '0s'}
          </span>
        </div>

        <button 
          onClick={() => onFullscreen(candidate)}
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', backdropFilter: 'blur(4px)', transition: 'background 0.2s' }}
          onMouseOver={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
          onMouseOut={(e) => e.currentTarget.style.background = 'rgba(0,0,0,0.5)'}
        >
          <Maximize2 size={14} />
        </button>

        {candidate.status !== 'clean' && (
          <div style={{ position: 'absolute', bottom: 12, right: 12, display: 'flex', alignItems: 'center', gap: 6, background: candidate.status === 'critical' ? '#EF4444' : '#F59E0B', color: 'white', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
            <AlertTriangle size={14} />
            {candidate.flags || 0} Flags detected
          </div>
        )}
      </div>

      <div style={{ padding: 16, background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: '#0F172A', display: 'flex', alignItems: 'center', gap: 6 }}>
              {candidate.name}
              {candidate.status === 'clean' && <BadgeCheck size={14} color="#10B981" />}
            </h3>
            <p style={{ fontSize: 13, color: '#64748B', margin: '2px 0 0' }}>{candidate.role}</p>
          </div>
          <button className="btn-outline" style={{ padding: '6px 12px', fontSize: 12, fontWeight: 600, color: '#3B82F6', border: '1px solid #3B82F6', background: 'transparent', borderRadius: 6, cursor: 'pointer' }}>
            Terminate
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AdminLiveMonitor() {
  const [searchTerm, setSearchTerm] = useState('');
  const [fullscreenCandidateId, setFullscreenCandidateId] = useState(null);
  const [liveStreams, setLiveStreams] = useState({});
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000');
    
    socketRef.current.on('live_frame', (data) => {
      setLiveStreams(prev => ({
        ...prev,
        [data.candidateId]: {
          ...data,
          lastSeen: Date.now()
        }
      }));
    });

    socketRef.current.on('candidate_disconnected', ({ socketId }) => {
      // Optional: Handle disconnect by graying out or removing
    });

    return () => {
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, []);

  // Cleanup old streams that haven't sent a frame in 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setLiveStreams(prev => {
        const next = { ...prev };
        let changed = false;
        for (const [id, stream] of Object.entries(next)) {
          if (now - stream.lastSeen > 10000) {
            delete next[id];
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const candidatesList = Object.values(liveStreams);
  const filteredCandidates = candidatesList.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const fullscreenCandidate = fullscreenCandidateId ? liveStreams[fullscreenCandidateId] : null;

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0', height: 'calc(100vh - 100px)', display: 'flex', flexDirection: 'column' }}>
      
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#FEF2F2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', animation: 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' }}>
            <Video size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0F172A', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 10, margin: 0 }}>
              Live Proctoring 
              <span style={{ fontSize: 11, fontWeight: 700, padding: '2px 8px', background: '#EF4444', color: 'white', borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase' }}>REC</span>
            </h1>
            <p style={{ color: '#64748B', fontSize: 14, margin: '4px 0 0' }}>Real-time monitoring of all active candidate sessions to ensure fair play.</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="input-with-icon" style={{ position: 'relative', width: 300 }}>
            <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 11 }} />
            <input 
              type="text" 
              placeholder="Search candidate or role..." 
              className="base-input" 
              style={{ paddingLeft: 36, width: '100%', height: 38, border: '1px solid #E2E8F0', borderRadius: 8, outline: 'none' }} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Grid of Live Feeds */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 20, overflowY: 'auto', paddingRight: 10 }}>
        {filteredCandidates.map(candidate => (
          <LiveVideoRenderer 
            key={candidate.candidateId} 
            candidate={candidate}  
            onFullscreen={(c) => setFullscreenCandidateId(c.candidateId)} 
          />
        ))}

        {filteredCandidates.length === 0 && (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center', color: '#94A3B8' }}>
            <Eye size={48} style={{ margin: '0 auto', opacity: 0.3, marginBottom: 16 }} />
            <h3 style={{ fontSize: 18, color: '#475569', fontWeight: 600 }}>No active candidates right now</h3>
            <p style={{ fontSize: 14 }}>When candidates start an assessment, you will see their live video streams here automatically.</p>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>

      {/* Fullscreen Modal View */}
      {fullscreenCandidate && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(15, 23, 42, 0.95)', display: 'flex', flexDirection: 'column', padding: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
            <div style={{ color: 'white' }}>
              <h2 style={{ fontSize: 24, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 12, margin: 0 }}>
                {fullscreenCandidate.name} 
                <span style={{ padding: '4px 10px', background: '#EF4444', color: 'white', fontSize: 12, borderRadius: 6, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'white' }} /> LIVE
                </span>
              </h2>
              <p style={{ color: '#94A3B8', marginTop: 4 }}>{fullscreenCandidate.role} • Running for {fullscreenCandidate.duration}</p>
            </div>
            <button onClick={() => setFullscreenCandidateId(null)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 44, height: 44, borderRadius: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'background 0.2s' }} onMouseOver={e=>e.currentTarget.style.background='rgba(255,255,255,0.2)'} onMouseOut={e=>e.currentTarget.style.background='rgba(255,255,255,0.1)'}>
              <X size={20} />
            </button>
          </div>
          
          <div style={{ flex: 1, display: 'flex', gap: 24 }}>
            <div style={{ flex: 3, background: 'black', borderRadius: 16, overflow: 'hidden', position: 'relative' }}>
              <img 
                src={fullscreenCandidate.frame} 
                alt="Full screen feed"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
              />
              {fullscreenCandidate.status !== 'clean' && (
                <div style={{ position: 'absolute', top: 24, right: 24, padding: '12px 20px', background: 'rgba(239, 68, 68, 0.9)', color: 'white', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 10, fontWeight: 600, backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                  <ShieldAlert size={20} /> AI Proctor: Suspicious behavior detected ({fullscreenCandidate.flags} flags)
                </div>
              )}
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: '#1E293B', padding: 24, borderRadius: 16, color: 'white' }}>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 16, color: '#CBD5E1' }}>Proctor Action Log</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13 }}>
                  <div style={{ display: 'flex', gap: 12, color: '#94A3B8' }}><span>12:01 PM</span> <span>Test Started</span></div>
                  {fullscreenCandidate.status !== 'clean' && (
                    <>
                    <div style={{ display: 'flex', gap: 12, color: '#F59E0B' }}><span>12:08 PM</span> <span>Tab switched out of focus</span></div>
                    <div style={{ display: 'flex', gap: 12, color: '#EF4444' }}><span>12:15 PM</span> <span>Multiple faces detected</span></div>
                    </>
                  )}
                  <div style={{ display: 'flex', gap: 12, color: '#94A3B8' }}><span>12:20 PM</span> <span>Submitted section 1</span></div>
                </div>
              </div>

              <button className="btn-primary" style={{ height: 48, border: 'none', borderRadius: 8, background: '#EF4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontSize: 15, fontWeight: 600, cursor: 'pointer' }}>
                <AlertTriangle size={18} /> Send Warning Message
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
