import { useState, useEffect } from 'react';
import { fetchAllSessions } from '../services/api';
import { 
  History, Search, Filter, Clock, 
  CheckCircle, AlertCircle, ExternalLink,
  User, Briefcase, Calendar, Loader2
} from 'lucide-react';

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const data = await fetchAllSessions();
      setSessions(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = sessions.filter(s => {
    const candidateName = s.candidateId?.name || 'Unknown';
    const matchSearch = candidateName.toLowerCase().includes(search.toLowerCase()) || 
                      s.jobRole.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || s.sessionType === filterType;
    return matchSearch && matchType;
  });

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
            <History size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Interview Sessions</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>View all active and completed candidate interview sessions.</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Search candidates or roles..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 14 }}
          />
        </div>
        <select 
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          style={{ padding: '0 16px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', background: 'white', fontSize: 14, cursor: 'pointer' }}
        >
          <option value="all">All Types</option>
          <option value="live">Live Assessments</option>
          <option value="practice">Practice Mode</option>
        </select>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Candidate</th>
              <th>Job Role</th>
              <th>Status</th>
              <th>Score</th>
              <th>Date</th>
              <th>Type</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [1, 2, 3, 4, 5].map(i => (
                <tr key={i}>
                  <td colSpan="7"><div className="skeleton" style={{ height: 24, margin: '8px 0' }} /></td>
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" style={{ textAlign: 'center', padding: '48px', color: '#94A3B8' }}>No sessions found.</td>
              </tr>
            ) : (
              filtered.map((s) => (
                <tr key={s._id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 8, background: '#F1F5F9', color: '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 12 }}>
                        {s.candidateId?.name?.[0] || 'U'}
                      </div>
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>{s.candidateId?.name || 'Guest Candidate'}</p>
                        <p style={{ fontSize: 11, color: '#64748B', margin: 0 }}>{s.candidateId?.email || 'N/A'}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <p style={{ fontSize: 13, fontWeight: 500, color: '#475569', margin: 0 }}>{s.jobRole}</p>
                  </td>
                  <td>
                    <span className={`status-pill ${s.completedAt ? 'pill-emerald' : 'pill-amber'}`}>
                      {s.completedAt ? 'Completed' : 'Active'}
                    </span>
                  </td>
                  <td>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', margin: 0 }}>
                      {s.score !== undefined ? `${s.score}/10` : '—'}
                    </p>
                  </td>
                  <td>
                    <p style={{ fontSize: 12, color: '#64748B', margin: 0 }}>{formatDate(s.createdAt)}</p>
                  </td>
                  <td>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', color: s.sessionType === 'live' ? '#4F46E5' : '#10B981' }}>
                      {s.sessionType}
                    </span>
                  </td>
                  <td>
                    <button 
                      className="btn-ghost" 
                      style={{ padding: 6 }} 
                      title="View Details"
                      onClick={() => window.open(`/session/${s._id}`, '_blank')}
                    >
                      <ExternalLink size={16} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
