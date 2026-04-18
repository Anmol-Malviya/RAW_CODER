import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { BookOpen, Calendar, Users, Plus } from 'lucide-react';
import api from '../services/api';

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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Interview Candidate Management</h1>
          <p style={{ color: '#64748B', fontSize: 16 }}>Manage candidate sessions and review candidate information.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
        {loading ? (
          <p style={{ color: '#64748B' }}>Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1', background: '#F8FAFC', borderRadius: 16 }}>
            <BookOpen size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: 18, color: '#0F172A', fontWeight: 600 }}>No Sessions Available</h3>
            <p style={{ color: '#64748B', marginTop: 8 }}>Create a session to begin managing candidates.</p>
          </div>
        ) : (
          sessions.map(session => (
            <div key={session._id} style={{ background: 'white', borderRadius: 16, padding: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 6 }}>{session.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: 13 }}>
                    <Calendar size={14} /> 
                    <span>{new Date(session.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div style={{ width: 40, height: 40, background: '#EEF2FF', color: '#4F46E5', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Users size={20} />
                </div>
              </div>
              <p style={{ color: '#475569', fontSize: 14, marginBottom: 24, flex: 1, minHeight: 40 }}>
                {session.description || 'No description provided.'}
              </p>
              <button 
                onClick={() => navigate(`/admin/workspace/session/${session._id}`)}
                style={{ width: '100%', padding: '12px', background: '#F8FAFC', color: '#4F46E5', fontWeight: 600, fontSize: 14, border: '1px solid #E2E8F0', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseOver={e => e.currentTarget.style.background = '#EEF2FF'}
                onMouseOut={e => e.currentTarget.style.background = '#F8FAFC'}
              >
                View Participants
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
