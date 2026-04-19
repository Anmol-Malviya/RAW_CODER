import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  ArrowLeft, CheckCircle, XCircle, Mail, FileText, Loader2,
  Search, Star, AlertTriangle, Send, Users, Filter, X, Check
} from 'lucide-react';

// ─── Toast notification component ───
function Toast({ message, type, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  const bg = type === 'success' ? '#ECFDF5' : type === 'error' ? '#FEF2F2' : '#EFF6FF';
  const border = type === 'success' ? '#A7F3D0' : type === 'error' ? '#FECACA' : '#BFDBFE';
  const color = type === 'success' ? '#065F46' : type === 'error' ? '#991B1B' : '#1E40AF';
  const Icon = type === 'success' ? Check : type === 'error' ? X : Mail;

  return (
    <div style={{
      position: 'fixed', top: 24, right: 24, zIndex: 10000,
      background: bg, border: `1px solid ${border}`, borderRadius: 12,
      padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 10,
      boxShadow: '0 10px 40px rgba(0,0,0,0.12)', maxWidth: 420,
      animation: 'slideIn 0.3s ease'
    }}>
      <Icon size={18} color={color} />
      <p style={{ margin: 0, fontSize: 14, fontWeight: 500, color, flex: 1 }}>{message}</p>
      <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
        <X size={14} color={color} />
      </button>
    </div>
  );
}

// ─── Confirmation modal ───
function ConfirmModal({ title, message, confirmLabel, confirmColor, onConfirm, onCancel, loading }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(15,23,42,0.5)', backdropFilter: 'blur(4px)',
      display: 'grid', placeItems: 'center', padding: 20,
    }} onClick={onCancel}>
      <div style={{
        background: '#FFFFFF', borderRadius: 20, padding: 32, width: '100%', maxWidth: 440,
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      }} onClick={e => e.stopPropagation()}>
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', margin: '0 0 8px' }}>{title}</h3>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px' }}>{message}</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: '10px 20px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: '1px solid #E2E8F0', background: '#FFFFFF', color: '#475569',
              cursor: 'pointer', transition: 'all 0.2s'
            }}
          >Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: '10px 24px', borderRadius: 10, fontSize: 14, fontWeight: 600,
              border: 'none', background: confirmColor || '#6366F1', color: 'white',
              cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.7 : 1,
              display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
            }}
          >
            {loading && <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───
export default function WorkspaceSessionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [bulkLoading, setBulkLoading] = useState(null); // 'shortlisted' | 'rejected'
  const [emailsSent, setEmailsSent] = useState({ shortlisted: false, rejected: false });

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
      setToast({ message: 'Failed to load candidates. Please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (candidateId, newStatus) => {
    const prev = candidates.find(c => c._id === candidateId);
    // Optimistic update
    setCandidates(p => p.map(c => c._id === candidateId ? { ...c, status: newStatus } : c));
    try {
      await api.patch(`/candidates/${candidateId}/status`, { status: newStatus });
      setToast({ message: `Candidate ${newStatus === 'shortlisted' ? 'shortlisted' : 'rejected'} successfully.`, type: 'success' });
    } catch (error) {
      console.error('Failed to update status', error);
      // Revert
      setCandidates(p => p.map(c => c._id === candidateId ? { ...c, status: prev?.status || 'pending' } : c));
      setToast({ message: 'Failed to update status. Please try again.', type: 'error' });
    }
  };

  const handleBulkEmail = async (type) => {
    const label = type === 'shortlisted' ? 'shortlisted' : 'rejected';
    const count = candidates.filter(c => c.status === type).length;

    if (count === 0) {
      setToast({ message: `No ${label} candidates to send emails to.`, type: 'error' });
      return;
    }

    setConfirmModal({
      title: type === 'shortlisted' ? 'Send Shortlisted Emails?' : 'Send Rejection Emails?',
      message: type === 'shortlisted'
        ? `This will send "Congratulations" emails to ${count} shortlisted candidate(s). This action cannot be undone.`
        : `This will send "Application Update" emails to ${count} rejected candidate(s). This action cannot be undone.`,
      confirmLabel: `Send ${count} Email${count > 1 ? 's' : ''}`,
      confirmColor: type === 'shortlisted' ? '#059669' : '#DC2626',
      type,
    });
  };

  const executeBulkEmail = async (type) => {
    setBulkLoading(type);
    try {
      const url = type === 'shortlisted'
        ? `/sessions/${id}/send-shortlisted-emails`
        : `/sessions/${id}/send-rejection-emails`;
      const { data } = await api.post(url);
      setToast({ message: data.message || 'Emails sent successfully!', type: 'success' });
      setEmailsSent(p => ({ ...p, [type]: true }));
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to send emails.';
      setToast({ message: msg, type: 'error' });
    } finally {
      setBulkLoading(null);
      setConfirmModal(null);
    }
  };

  // Filtered + searched candidates
  const filteredCandidates = useMemo(() => {
    return candidates.filter(c => {
      if (filter !== 'all' && c.status !== filter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!c.name?.toLowerCase().includes(q) && !c.email?.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [candidates, filter, search]);

  // Stats
  const stats = useMemo(() => ({
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    shortlisted: candidates.filter(c => c.status === 'shortlisted').length,
    rejected: candidates.filter(c => c.status === 'rejected').length,
  }), [candidates]);

  const filterButtons = [
    { key: 'all', label: 'All', count: stats.total },
    { key: 'pending', label: 'Pending', count: stats.pending },
    { key: 'shortlisted', label: 'Shortlisted', count: stats.shortlisted },
    { key: 'rejected', label: 'Rejected', count: stats.rejected },
  ];

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px' }}>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Confirmation Modal */}
      {confirmModal && (
        <ConfirmModal
          title={confirmModal.title}
          message={confirmModal.message}
          confirmLabel={confirmModal.confirmLabel}
          confirmColor={confirmModal.confirmColor}
          loading={bulkLoading !== null}
          onConfirm={() => executeBulkEmail(confirmModal.type)}
          onCancel={() => !bulkLoading && setConfirmModal(null)}
        />
      )}

      {/* Back */}
      <button
        onClick={() => navigate('/admin/workspace')}
        style={{
          background: 'transparent', border: 'none', color: '#64748B',
          display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
          marginBottom: 24, fontSize: 14, fontWeight: 500,
          transition: 'color 0.2s'
        }}
        onMouseOver={e => e.currentTarget.style.color = '#4F46E5'}
        onMouseOut={e => e.currentTarget.style.color = '#64748B'}
      >
        <ArrowLeft size={16} /> Back to Sessions
      </button>

      {/* Header + Bulk Actions */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 28, padding: '24px 28px', background: '#FFFFFF',
        borderRadius: 20, border: '1px solid #E2E8F0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.03)', gap: 16
      }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: '0 0 4px', letterSpacing: '-0.01em' }}>
            Session Participants
          </h1>
          <p style={{ color: '#64748B', fontSize: 14, margin: 0 }}>
            Manage candidate statuses and send bulk communication.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {/* Send Shortlisted Emails */}
          <button
            onClick={() => handleBulkEmail('shortlisted')}
            disabled={bulkLoading !== null || stats.shortlisted === 0}
            style={{
              padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              background: emailsSent.shortlisted ? '#D1FAE5' : 'linear-gradient(135deg, #059669, #10B981)',
              color: emailsSent.shortlisted ? '#065F46' : 'white',
              border: emailsSent.shortlisted ? '1px solid #A7F3D0' : 'none',
              cursor: bulkLoading !== null || stats.shortlisted === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 13,
              opacity: stats.shortlisted === 0 ? 0.5 : 1,
              transition: 'all 0.2s', boxShadow: emailsSent.shortlisted ? 'none' : '0 2px 8px rgba(16,185,129,0.3)'
            }}
          >
            {bulkLoading === 'shortlisted' ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : emailsSent.shortlisted ? (
              <Check size={15} />
            ) : (
              <Mail size={15} />
            )}
            {emailsSent.shortlisted ? 'Shortlisted Emails Sent ✓' : `Send Shortlisted Emails (${stats.shortlisted})`}
          </button>

          {/* Send Rejection Emails */}
          <button
            onClick={() => handleBulkEmail('rejected')}
            disabled={bulkLoading !== null || stats.rejected === 0}
            style={{
              padding: '10px 18px', borderRadius: 10, display: 'flex', alignItems: 'center', gap: 8,
              background: emailsSent.rejected ? '#FEF2F2' : 'linear-gradient(135deg, #DC2626, #F43F5E)',
              color: emailsSent.rejected ? '#991B1B' : 'white',
              border: emailsSent.rejected ? '1px solid #FECACA' : 'none',
              cursor: bulkLoading !== null || stats.rejected === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600, fontSize: 13,
              opacity: stats.rejected === 0 ? 0.5 : 1,
              transition: 'all 0.2s', boxShadow: emailsSent.rejected ? 'none' : '0 2px 8px rgba(220,38,38,0.3)'
            }}
          >
            {bulkLoading === 'rejected' ? (
              <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} />
            ) : emailsSent.rejected ? (
              <Check size={15} />
            ) : (
              <Mail size={15} />
            )}
            {emailsSent.rejected ? 'Rejection Emails Sent ✓' : `Send Rejection Emails (${stats.rejected})`}
          </button>
        </div>
      </div>

      {/* Stats cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#6366F1', bg: '#EEF2FF' },
          { label: 'Pending', value: stats.pending, color: '#D97706', bg: '#FFFBEB' },
          { label: 'Shortlisted', value: stats.shortlisted, color: '#059669', bg: '#ECFDF5' },
          { label: 'Rejected', value: stats.rejected, color: '#DC2626', bg: '#FEF2F2' },
        ].map(s => (
          <div key={s.label} style={{
            flex: '1 1 140px', padding: '16px 20px', background: '#FFFFFF',
            borderRadius: 14, border: '1px solid #E2E8F0', minWidth: 120
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: 999, background: s.color }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: s.color, margin: 0 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters + Search */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20, flexWrap: 'wrap', gap: 12
      }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {filterButtons.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              style={{
                padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600,
                cursor: 'pointer', border: 'none', transition: 'all 0.2s',
                background: filter === f.key ? '#4F46E5' : '#F1F5F9',
                color: filter === f.key ? 'white' : '#64748B',
              }}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            style={{
              padding: '9px 14px 9px 36px', fontSize: 13, border: '1px solid #E2E8F0',
              borderRadius: 10, outline: 'none', width: 220, fontWeight: 500,
              color: '#0F172A', background: '#FFFFFF', transition: 'border 0.2s'
            }}
            onFocus={e => e.target.style.borderColor = '#818CF8'}
            onBlur={e => e.target.style.borderColor = '#E2E8F0'}
          />
        </div>
      </div>

      {/* Candidates Table */}
      <div style={{
        background: '#FFFFFF', borderRadius: 20, border: '1px solid #E2E8F0',
        overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
      }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0' }}>
              <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Candidate</th>
              <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Resume / Details</th>
              <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
              <th style={{ padding: '14px 24px', fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="4" style={{ padding: 60, textAlign: 'center' }}>
                  <Loader2 size={28} color="#6366F1" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: '#94A3B8', fontSize: 14 }}>Loading candidates...</p>
                </td>
              </tr>
            ) : filteredCandidates.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ padding: 60, textAlign: 'center' }}>
                  <Users size={32} color="#CBD5E1" style={{ margin: '0 auto 12px', display: 'block' }} />
                  <p style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>
                    {search ? 'No candidates match your search.' : 'No candidates found for this filter.'}
                  </p>
                </td>
              </tr>
            ) : (
              filteredCandidates.map(candidate => {
                const initials = candidate.name ? candidate.name.split(' ').map(p => p[0]).join('').slice(0, 2).toUpperCase() : '?';
                const statusConfig = {
                  pending: { bg: '#FEF3C7', color: '#D97706', border: '#FDE68A', label: 'Pending' },
                  shortlisted: { bg: '#D1FAE5', color: '#047857', border: '#A7F3D0', label: 'Shortlisted' },
                  rejected: { bg: '#FFE4E6', color: '#BE123C', border: '#FECDD3', label: 'Rejected' },
                };
                const sc = statusConfig[candidate.status] || statusConfig.pending;

                return (
                  <tr
                    key={candidate._id}
                    style={{
                      borderBottom: '1px solid #F1F5F9',
                      transition: 'background 0.15s',
                      background: candidate.status === 'shortlisted' ? '#FAFFFE' : 'transparent'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#F8FAFC'}
                    onMouseOut={e => e.currentTarget.style.background = candidate.status === 'shortlisted' ? '#FAFFFE' : 'transparent'}
                  >
                    {/* Name & Email */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{
                          width: 38, height: 38, borderRadius: 10,
                          background: candidate.status === 'shortlisted' ? '#D1FAE5' : '#EEF2FF',
                          color: candidate.status === 'shortlisted' ? '#047857' : '#4338CA',
                          display: 'grid', placeItems: 'center', fontSize: 13, fontWeight: 700,
                          flexShrink: 0
                        }}>
                          {initials}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <p style={{ fontWeight: 600, color: '#0F172A', fontSize: 14, margin: 0 }}>{candidate.name}</p>
                            {candidate.status === 'shortlisted' && (
                              <Star size={12} fill="#059669" color="#059669" />
                            )}
                          </div>
                          <p style={{ fontSize: 12, color: '#64748B', margin: '2px 0 0' }}>{candidate.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Resume */}
                    <td style={{ padding: '16px 24px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#4F46E5', fontSize: 13, cursor: 'pointer' }}
                        title={candidate.resumeDetails || 'No details'}
                      >
                        <FileText size={14} />
                        <span style={{ fontWeight: 500 }}>View Details</span>
                        {candidate.score != null && (
                          <span style={{
                            marginLeft: 8, padding: '2px 8px', borderRadius: 999,
                            fontSize: 11, fontWeight: 700,
                            background: candidate.score >= 7 ? '#D1FAE5' : candidate.score >= 4 ? '#FEF3C7' : '#FFE4E6',
                            color: candidate.score >= 7 ? '#047857' : candidate.score >= 4 ? '#D97706' : '#BE123C',
                          }}>
                            Score: {candidate.score}/10
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td style={{ padding: '16px 24px' }}>
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', padding: '5px 12px',
                        borderRadius: 999, fontSize: 12, fontWeight: 600,
                        background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                        gap: 4
                      }}>
                        {candidate.status === 'shortlisted' && <CheckCircle size={12} />}
                        {candidate.status === 'rejected' && <XCircle size={12} />}
                        {sc.label}
                      </span>
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: 6 }}>
                        <button
                          onClick={() => handleUpdateStatus(candidate._id, 'shortlisted')}
                          disabled={candidate.status === 'shortlisted'}
                          title="Shortlist"
                          style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: candidate.status === 'shortlisted' ? 'default' : 'pointer',
                            border: '1px solid',
                            borderColor: candidate.status === 'shortlisted' ? '#A7F3D0' : '#D1FAE5',
                            background: candidate.status === 'shortlisted' ? '#D1FAE5' : '#FFFFFF',
                            color: '#059669', display: 'flex', alignItems: 'center', gap: 5,
                            transition: 'all 0.2s',
                            opacity: candidate.status === 'shortlisted' ? 0.6 : 1,
                          }}
                          onMouseOver={e => { if (candidate.status !== 'shortlisted') { e.currentTarget.style.background = '#059669'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#059669'; }}}
                          onMouseOut={e => { if (candidate.status !== 'shortlisted') { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#059669'; e.currentTarget.style.borderColor = '#D1FAE5'; }}}
                        >
                          <CheckCircle size={13} />
                          Shortlist
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(candidate._id, 'rejected')}
                          disabled={candidate.status === 'rejected'}
                          title="Reject"
                          style={{
                            padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                            cursor: candidate.status === 'rejected' ? 'default' : 'pointer',
                            border: '1px solid',
                            borderColor: candidate.status === 'rejected' ? '#FECDD3' : '#FFE4E6',
                            background: candidate.status === 'rejected' ? '#FFE4E6' : '#FFFFFF',
                            color: '#DC2626', display: 'flex', alignItems: 'center', gap: 5,
                            transition: 'all 0.2s',
                            opacity: candidate.status === 'rejected' ? 0.6 : 1,
                          }}
                          onMouseOver={e => { if (candidate.status !== 'rejected') { e.currentTarget.style.background = '#DC2626'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#DC2626'; }}}
                          onMouseOut={e => { if (candidate.status !== 'rejected') { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#DC2626'; e.currentTarget.style.borderColor = '#FFE4E6'; }}}
                        >
                          <XCircle size={13} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes slideIn { from { transform: translateX(100px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      `}</style>
    </div>
  );
}
