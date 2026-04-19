import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { BookOpen, Calendar, Users, ChevronRight, Briefcase, Loader2 } from 'lucide-react';

export default function WorkspaceDashboard() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/sessions');
      setSessions(data);
    } catch (error) {
      console.error('Failed to load sessions', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* Header */}
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14,
            background: 'linear-gradient(135deg, #6366F1, #7C3AED)',
            display: 'grid', placeItems: 'center', color: 'white',
            boxShadow: '0 4px 14px rgba(99,102,241,0.35)'
          }}>
            <Briefcase size={22} />
          </div>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: '#0F172A', margin: 0, letterSpacing: '-0.02em' }}>
              Interview Candidate Management
            </h1>
            <p style={{ color: '#64748B', fontSize: 15, margin: '4px 0 0' }}>
              Manage candidate sessions, shortlisting, rejection, and bulk email communication.
            </p>
          </div>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        display: 'flex', gap: 16, marginBottom: 32, flexWrap: 'wrap'
      }}>
        <div style={{
          flex: '1 1 180px', padding: '20px 24px', background: '#FFFFFF',
          borderRadius: 16, border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Total Sessions</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#0F172A', margin: '8px 0 0' }}>{loading ? '—' : sessions.length}</p>
        </div>
        <div style={{
          flex: '1 1 180px', padding: '20px 24px', background: '#FFFFFF',
          borderRadius: 16, border: '1px solid #E2E8F0',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Active</p>
          <p style={{ fontSize: 32, fontWeight: 800, color: '#10B981', margin: '8px 0 0' }}>{loading ? '—' : sessions.filter(s => s.isActive).length}</p>
        </div>
      </div>

      {/* Session Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 20 }}>
        {loading ? (
          <div style={{ gridColumn: '1 / -1', padding: 60, textAlign: 'center' }}>
            <Loader2 size={36} color="#6366F1" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
            <p style={{ color: '#64748B', fontSize: 15 }}>Loading sessions...</p>
          </div>
        ) : sessions.length === 0 ? (
          <div style={{
            padding: 60, textAlign: 'center', gridColumn: '1 / -1',
            background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0'
          }}>
            <div style={{
              width: 72, height: 72, margin: '0 auto 20px', borderRadius: 20,
              background: '#F8FAFC', display: 'grid', placeItems: 'center'
            }}>
              <BookOpen size={32} color="#94A3B8" />
            </div>
            <h3 style={{ fontSize: 18, color: '#0F172A', fontWeight: 700 }}>No Sessions Available</h3>
            <p style={{ color: '#64748B', marginTop: 8, fontSize: 14 }}>
              Create an interview session from the "Manage Roles" page to get started.
            </p>
          </div>
        ) : (
          sessions.map(session => (
            <div
              key={session._id}
              onClick={() => navigate(`/admin/workspace/session/${session._id}`)}
              style={{
                background: '#FFFFFF', borderRadius: 16, padding: 0,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                border: '1px solid #E2E8F0', cursor: 'pointer',
                transition: 'all 0.25s ease', overflow: 'hidden',
              }}
              onMouseOver={e => {
                e.currentTarget.style.borderColor = '#818CF8';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(99,102,241,0.12)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseOut={e => {
                e.currentTarget.style.borderColor = '#E2E8F0';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.04)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {/* Card top accent */}
              <div style={{ height: 4, background: 'linear-gradient(90deg, #6366F1, #7C3AED)' }} />

              <div style={{ padding: '24px 24px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: '#0F172A', marginBottom: 6, margin: 0 }}>
                      {session.title}
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13, marginTop: 6 }}>
                      <Calendar size={13} />
                      <span>{new Date(session.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                  </div>
                  <div style={{
                    width: 42, height: 42, background: '#EEF2FF', color: '#4F46E5',
                    borderRadius: 12, display: 'grid', placeItems: 'center', flexShrink: 0
                  }}>
                    <Users size={20} />
                  </div>
                </div>

                <p style={{ color: '#475569', fontSize: 13, marginBottom: 0, lineHeight: 1.5, minHeight: 20 }}>
                  {session.description || 'No description provided.'}
                </p>
              </div>

              {/* Card footer */}
              <div style={{
                padding: '14px 24px', borderTop: '1px solid #F1F5F9',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                background: '#FAFBFC'
              }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#4F46E5' }}>View Participants</span>
                <ChevronRight size={16} color="#4F46E5" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
