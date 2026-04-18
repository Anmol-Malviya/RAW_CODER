import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { ArrowLeft, CheckCircle, XCircle, Mail, UserPlus, FileText, Loader2, Search } from 'lucide-react';

export default function WorkspaceSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, shortlisted, rejected, pending
  


  useEffect(() => {
    loadCandidates();
  }, [id]);

  const loadCandidates = async () => {
    try {
      setLoading(true);
      const { data } = await api.get(`/sessions/${id}/candidates`);
      setCandidates(data);
    } catch (error) {
      console.error('Failed to load candidates', error);
    } finally {
      setLoading(false);
    }
  };


  const handleUpdateStatus = async (candidateId, newStatus) => {
    try {
      // Optimistic update
      setCandidates(prev => prev.map(c => c._id === candidateId ? { ...c, status: newStatus } : c));
      await api.patch(`/candidates/${candidateId}/status`, { status: newStatus });
    } catch (error) {
      console.error('Failed to update status', error);
      // Revert on error
      loadCandidates();
    }
  };



  const filteredCandidates = candidates.filter(c => filter === 'all' || c.status === filter);

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      <button 
        onClick={() => navigate('/admin/workspace')}
        style={{ background: 'transparent', border: 'none', color: '#64748B', display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', marginBottom: 24, fontSize: 14, fontWeight: 500 }}
      >
        <ArrowLeft size={16} /> Back to Sessions
      </button>

      {/* Header and Bulk Actions */}
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, padding: '24px', background: '#F8FAFC', borderRadius: 16, border: '1px solid #E2E8F0' }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>Session Participants</h1>
          <p style={{ color: '#64748B', fontSize: 14 }}>Review session candidate participants.</p>
        </div>

      </div>

      {/* Filters and Search */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {['all', 'pending'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '6px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize',
                background: filter === f ? '#4F46E5' : '#F1F5F9',
                color: filter === f ? 'white' : '#64748B',
                border: 'none',
                transition: 'all 0.2s'
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Candidates Table */}
      <div style={{ background: 'white', borderRadius: 16, border: '1px solid #E2E8F0', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Name & Email</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#475569' }}>Resume / Details</th>
              <th style={{ padding: '16px 24px', fontSize: 13, fontWeight: 600, color: '#475569', textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>Loading candidates...</td>
              </tr>
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>No candidates found for this filter.</td>
              </tr>
            ) : (
              filteredCandidates.map(candidate => (
                <tr key={candidate._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '16px 24px' }}>
                    <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 14 }}>{candidate.name}</p>
                    <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{candidate.email}</p>
                  </td>
                  <td style={{ padding: '16px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4F46E5', fontSize: 13, cursor: 'pointer' }}>
                      <FileText size={16} /> View Details
                    </div>
                  </td>
                  <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                    <span style={{
                      display: 'inline-flex', alignItems: 'center', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                      background: candidate.status === 'shortlisted' ? '#D1FAE5' : candidate.status === 'rejected' ? '#FFE4E6' : '#FEF3C7',
                      color: candidate.status === 'shortlisted' ? '#047857' : candidate.status === 'rejected' ? '#BE123C' : '#D97706'
                    }}>
                      {candidate.status}
                    </span>
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
