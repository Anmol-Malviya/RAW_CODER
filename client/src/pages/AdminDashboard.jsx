import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchJobs, createJob, getJobCandidates, sendCandidateEmail, sendBulkCandidateEmails, updateCandidateStatus } from '../services/api';
import { Plus, CheckCircle2, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const STATUS_KEY = 'vyorai:admin:statuses';

export default function AdminDashboard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const [showNewJobModal, setShowNewJobModal] = useState(false);
  const [newJob, setNewJob] = useState({ 
    title: '', 
    description: '',
    difficulty: 'intermediate',
    interviewType: 'technical',
    hasCodingRound: false
  });
  const [isPosting, setIsPosting] = useState(false);
  const [latestJob, setLatestJob] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await fetchJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const created = await createJob(newJob.title, newJob.description, newJob.difficulty, newJob.interviewType, newJob.hasCodingRound);
      setLatestJob(created);
      const joinUrl = window.location.origin + '/candidate';
      window.open(joinUrl, '_blank');
      
      setNewJob({ 
        title: '', 
        description: '',
        difficulty: 'intermediate',
        interviewType: 'technical',
        hasCodingRound: false
      });
      await loadJobs();
    } catch (e) {
      console.error(e);
      alert('Failed to create job. Please try again.');
    } finally {
      setIsPosting(false);
    }
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Dynamic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyItems: 'space-between', justifyContent: 'space-between', marginBottom: 32, padding: '32px 40px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 24, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.4)', color: 'white', flexWrap: 'wrap', gap: 20 }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>Manage Roles</p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            Interview Sessions
          </h1>
          <p style={{ marginTop: 8, fontSize: 15, color: '#94A3B8', fontWeight: 500 }}>
            Manage your interview sessions and navigate to candidate lists.
          </p>
        </div>
        <button onClick={() => setShowNewJobModal(true)} style={{ height: 44, padding: '0 24px', background: '#6366F1', color: 'white', borderRadius: 12, fontWeight: 700, fontSize: 14, border: 'none', display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(99,102,241,0.5)', transition: 'all 0.2s' }} onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 20px -4px rgba(99,102,241,0.6)'; }} onMouseOut={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 8px 16px -4px rgba(99,102,241,0.5)'; }}>
          <Plus size={18} strokeWidth={2.5} /> Create Session
        </button>
      </div>

      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: '8px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
          <div style={{ overflow: 'hidden', borderRadius: 16 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Session Title</th>
                  <th>Join Code</th>
                  <th>Difficulty</th>
                  <th>Created</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {jobs.map(job => (
                  <tr key={job._id}>
                    <td><span style={{ fontWeight: 600, color: '#0F172A' }}>{job.title}</span></td>
                    <td><span className="status-pill pill-indigo" style={{ fontFamily: 'monospace' }}>{job.interviewCode}</span></td>
                    <td>{job.difficulty}</td>
                    <td style={{ color: '#64748B' }}>{new Date(job.createdAt).toLocaleDateString()}</td>
                    <td style={{ textAlign: 'right' }}>
                      <button onClick={() => navigate(`/admin/candidates/${job._id}`)} className="btn-primary" style={{ padding: '6px 16px', fontSize: 13, borderRadius: 8, border: 'none', background: '#4F46E5', color: 'white', cursor: 'pointer' }}>
                        View Candidates
                      </button>
                    </td>
                  </tr>
                ))}
                {jobs.length === 0 && !loading && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                      No interview sessions created yet. Click "Create Session" to begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* New job modal */}
      {showNewJobModal && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(15,23,42,0.4)' }}
          onClick={() => !isPosting && setShowNewJobModal(false)}
        >
          <div
            className="card"
            onClick={(e) => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 520, padding: 0, boxShadow: '0 20px 60px rgba(15,23,42,0.15)' }}
          >
            <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0F172A' }}>{latestJob ? 'Role Deployed Successfully!' : 'Post a new role'}</h2>
                <p style={{ marginTop: 2, fontSize: 12, color: '#64748B' }}>
                  {latestJob ? 'Share this code with candidates to start their interview.' : 'This context will be used to generate candidate assessments.'}
                </p>
              </div>
              <button onClick={() => { setShowNewJobModal(false); setLatestJob(null); }} className="btn-ghost" style={{ padding: 6 }}>
                <X size={16} />
              </button>
            </div>

            {latestJob ? (
              <div style={{ padding: 32, textAlign: 'center' }}>
                <div style={{ width: 64, height: 64, background: '#ECFDF5', color: '#10B981', borderRadius: 20, display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <CheckCircle2 size={32} />
                </div>
                <p style={{ fontSize: 14, color: '#64748B', marginBottom: 8 }}>Candidate Join Code</p>
                <div style={{ 
                  fontSize: 42, 
                  fontWeight: 900, 
                  color: '#4F46E5', 
                  letterSpacing: '0.1em', 
                  background: '#F8FAFC', 
                  padding: '16px 24px', 
                  borderRadius: 16,
                  border: '1px dashed #6366F1',
                  display: 'inline-block',
                  fontFamily: 'monospace'
                }}>
                  {latestJob.interviewCode}
                </div>
                <button 
                  onClick={() => window.open(window.location.origin + '/candidate', '_blank')}
                  className="btn-secondary"
                  style={{ width: '100%', marginTop: 24, height: 44, borderColor: '#6366F1', color: '#4F46E5', fontWeight: 700 }}
                >
                  Open Interview Portal
                </button>
                <button 
                  onClick={() => { setShowNewJobModal(false); setLatestJob(null); }}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: 12, height: 44 }}
                >
                  Done
                </button>
              </div>
            ) : (
              <form onSubmit={handleCreateJob} style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label className="field-label">Job title</label>
                  <input
                    required autoFocus
                    placeholder="e.g. Senior Frontend Engineer"
                    value={newJob.title}
                    onChange={(e) => setNewJob({ ...newJob, title: e.target.value })}
                    className="input-soft"
                  />
                </div>
                <div>
                  <label className="field-label">Description & requirements</label>
                  <textarea
                    required rows={5}
                    placeholder="Paste the full responsibilities and technical stack…"
                    value={newJob.description}
                    onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                    className="input-soft"
                    style={{ resize: 'vertical', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label className="field-label">Difficulty</label>
                    <select
                      className="input-soft"
                      value={newJob.difficulty}
                      onChange={(e) => setNewJob({ ...newJob, difficulty: e.target.value })}
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div>
                    <label className="field-label">Interview Type</label>
                    <select
                      className="input-soft"
                      value={newJob.interviewType}
                      onChange={(e) => setNewJob({ ...newJob, interviewType: e.target.value })}
                    >
                      <option value="technical">Technical</option>
                      <option value="HR">HR</option>
                      <option value="mixed">Mixed</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                  <input
                    type="checkbox"
                    id="hasCoding"
                    checked={newJob.hasCodingRound}
                    onChange={(e) => setNewJob({ ...newJob, hasCodingRound: e.target.checked })}
                    style={{ width: 16, height: 16, cursor: 'pointer' }}
                  />
                  <label htmlFor="hasCoding" style={{ fontSize: 13, fontWeight: 500, color: '#334155', cursor: 'pointer' }}>
                    Enable Coding Round
                  </label>
                </div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 6 }}>
                  <button type="button" className="btn-secondary" onClick={() => setShowNewJobModal(false)} disabled={isPosting}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isPosting}>
                    {isPosting ? 'Posting…' : 'Create role'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
    rose: { bg: '#FFF1F2', color: '#E11D48', shadow: 'rgba(225, 29, 72, 0.2)' },
    slate: { bg: '#F1F5F9', color: '#475569', shadow: 'rgba(71, 85, 105, 0.2)' },
  };
  const t = tones[tone];
  return (
    <div style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 20, background: '#FFFFFF', borderRadius: 24, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.02)', border: '1px solid #E2E8F0', transition: 'all 0.3s' }} onMouseOver={e => { e.currentTarget.style.boxShadow = `0 16px 32px -8px ${t.shadow}`; e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.borderColor = t.bg; }} onMouseOut={e => { e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.02)'; e.currentTarget.style.transform = 'none'; e.currentTarget.style.borderColor = '#E2E8F0'; }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: t.bg, color: t.color, display: 'grid', placeItems: 'center', flexShrink: 0, boxShadow: `inset 0 2px 4px ${t.shadow}` }}>
        <div style={{ transform: 'scale(1.2)' }}>{icon}</div>
      </div>
      <div>
        <p style={{ fontSize: 13, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
        <p style={{ marginTop: 4, fontSize: 32, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</p>
      </div>
    </div>
  );
}

function Select({ value, onChange, children, label }) {
  const hasValue = value !== 'all';
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      style={{
        width: 'auto', minWidth: 140, cursor: 'pointer', padding: '10px 36px 10px 18px', background: hasValue ? '#EFF6FF' : 'transparent', color: hasValue ? '#4F46E5' : '#475569', fontWeight: 600, fontSize: 14, border: `2px solid ${hasValue ? '#4F46E5' : 'transparent'}`, borderRadius: 999, outline: 'none', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='none' stroke='${hasValue? '%234F46E5': '%2364748b'}' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M3 5l3 3 3-3'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center', transition: 'all 0.2s'
      }}
      onMouseOver={e => !hasValue && (e.currentTarget.style.background = '#F8FAFC')}
      onMouseOut={e => !hasValue && (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </select>
  );
}

function IconAction({ title, children, onClick, active }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="btn-ghost"
      style={{
        padding: 6,
        color: active ? '#4F46E5' : '#64748B',
        background: active ? '#EEF2FF' : undefined,
      }}
    >
      {children}
    </button>
  );
}

function Dropdown({ onShortlist, onDelete, shortlisted, onSendSelected, onSendRejected, emailSending, emailSent, candidateId }) {
  const selectedSent = emailSent?.[`${candidateId}_selected`];
  const rejectedSent = emailSent?.[`${candidateId}_rejected`];
  return (
    <div
      role="menu"
      style={{
        position: 'absolute',
        right: 0,
        top: 'calc(100% + 6px)',
        minWidth: 220,
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 8,
        boxShadow: '0 10px 30px rgba(15,23,42,0.12)',
        padding: 4,
        zIndex: 30,
      }}
    >
      <DropdownItem onClick={onShortlist} tone={shortlisted ? 'slate' : 'emerald'}>
        {shortlisted ? <StarOff size={14} /> : <Star size={14} />}
        {shortlisted ? 'Remove shortlist' : 'Keep / Shortlist'}
      </DropdownItem>
      <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
      <DropdownItem onClick={!emailSending && !selectedSent ? onSendSelected : undefined} tone="emerald">
        {selectedSent ? <CheckCheck size={14} /> : <Send size={14} />}
        {emailSending ? 'Sending…' : selectedSent ? 'Selected mail sent ✓' : 'Send Selected Email'}
      </DropdownItem>
      <DropdownItem onClick={!emailSending && !rejectedSent ? onSendRejected : undefined} tone="rose">
        {rejectedSent ? <CheckCheck size={14} /> : <XCircle size={14} />}
        {emailSending ? 'Sending…' : rejectedSent ? 'Rejected mail sent ✓' : 'Send Rejected Email'}
      </DropdownItem>
      <div style={{ height: 1, background: '#F1F5F9', margin: '4px 0' }} />
      <DropdownItem onClick={onDelete} tone="rose">
        <Trash2 size={14} />
        Delete candidate
      </DropdownItem>
    </div>
  );
}

function DropdownItem({ children, onClick, tone }) {
  const tones = {
    emerald: '#047857',
    rose: '#BE123C',
    slate: '#334155',
  };
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      style={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 10px',
        borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: tones[tone],
        fontSize: 13,
        fontWeight: 500,
        cursor: 'pointer',
        textAlign: 'left',
        transition: 'background 0.15s ease',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
    >
      {children}
    </button>
  );
}

function ViewCandidateModal({ candidate: c, status, onClose, onShortlist, onDelete, onDownload, onSendSelected, onSendRejected, emailSending, emailSent }) {
  const name = c.candidateId?.name || 'Unknown';
  const email = c.candidateId?.email || '—';
  const score = c.score || 0;
  const flags = c.tabSwitchCount || 0;
  const durSec = c.testDurationSeconds || 0;
  const total = c.questions?.length || 0;
  const correct = (c.questions || []).filter((q) => (c.answers || {})[q.id] === q.correctAnswer).length;
  const accuracy = total ? Math.round((correct / total) * 100) : 0;
  const shortlisted = status === 'shortlisted';

  const selectedSending = emailSending?.[`${c._id}_selected`];
  const rejectedSending = emailSending?.[`${c._id}_rejected`];
  const selectedDone = emailSent?.[`${c._id}_selected`];
  const rejectedDone = emailSent?.[`${c._id}_rejected`];

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(15,23,42,0.45)',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        onClick={(e) => e.stopPropagation()}
        style={{ width: '100%', maxWidth: 640, padding: 0, maxHeight: '90vh', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 60px rgba(15,23,42,0.15)' }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{
              width: 44, height: 44, borderRadius: 999,
              background: shortlisted ? '#D1FAE5' : '#EEF2FF',
              color: shortlisted ? '#047857' : '#4338CA',
              display: 'grid', placeItems: 'center',
              fontSize: 14, fontWeight: 600,
            }}>
              {name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <h2 style={{ fontSize: 17, fontWeight: 600, color: '#0F172A' }}>{name}</h2>
                {shortlisted && (
                  <span className="status-pill pill-emerald">
                    <Star size={10} fill="#047857" color="#047857" style={{ marginRight: 3 }} />
                    Shortlisted
                  </span>
                )}
              </div>
              <p style={{ marginTop: 2, fontSize: 12, color: '#64748B' }}>{c._jobTitle || '—'}</p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost" style={{ padding: 6 }} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
            <InfoRow icon={<Mail size={12} />} label="Email" value={email} />
            <InfoRow icon={<Calendar size={12} />} label="Submitted" value={c.createdAt ? new Date(c.createdAt).toLocaleString() : '—'} />
            <InfoRow icon={<Clock size={12} />} label="Time taken" value={`${Math.floor(durSec / 60)}m ${durSec % 60}s`} />
            <InfoRow icon={<AlertTriangle size={12} />} label="Flags" value={`${flags} tab switch${flags === 1 ? '' : 'es'}`} />
          </div>

          {c.feedback && (
            <div style={{ marginBottom: 20, padding: 16, background: '#F8FAFC', borderRadius: 12, border: '1px solid #E2E8F0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sparkles size={12} /> Candidate Feedback
              </p>
              <div style={{ display: 'flex', gap: 2, marginBottom: 8 }}>
                {[1, 2, 3, 4, 5].map(s => (
                  <Star 
                    key={s} 
                    size={16} 
                    fill={s <= c.feedback.rating ? '#F59E0B' : 'transparent'} 
                    color={s <= c.feedback.rating ? '#F59E0B' : '#CBD5E1'} 
                  />
                ))}
              </div>
              {c.feedback.comment && (
                <p style={{ fontSize: 14, color: '#334155', fontStyle: 'italic', lineHeight: 1.5 }}>
                  "{c.feedback.comment}"
                </p>
              )}
            </div>
          )}

          {/* Email Actions Panel */}
          <div className="panel" style={{ padding: 16, marginBottom: 20, background: '#F8FAFC' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12 }}>
              📧 Send Decision Email
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={!selectedSending && !selectedDone ? onSendSelected : undefined}
                disabled={selectedSending || selectedDone}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10, border: 'none',
                  background: selectedDone ? '#D1FAE5' : 'linear-gradient(135deg, #059669, #10B981)',
                  color: selectedDone ? '#047857' : '#FFFFFF',
                  fontWeight: 700, fontSize: 13, cursor: selectedDone ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: selectedSending ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {selectedDone ? <><CheckCheck size={14} /> Selected Mail Sent</> : selectedSending ? 'Sending…' : <><Send size={14} /> Send Selected</>}
              </button>
              <button
                onClick={!rejectedSending && !rejectedDone ? onSendRejected : undefined}
                disabled={rejectedSending || rejectedDone}
                style={{
                  flex: 1, padding: '10px 16px', borderRadius: 10,
                  border: rejectedDone ? '1px solid #FECDD3' : '1px solid #E2E8F0',
                  background: rejectedDone ? '#FFF1F2' : '#FFFFFF',
                  color: rejectedDone ? '#BE123C' : '#334155',
                  fontWeight: 700, fontSize: 13, cursor: rejectedDone ? 'default' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  opacity: rejectedSending ? 0.7 : 1,
                  transition: 'all 0.2s',
                }}
              >
                {rejectedDone ? <><CheckCheck size={14} /> Rejected Mail Sent</> : rejectedSending ? 'Sending…' : <><XCircle size={14} /> Send Rejected</>}
              </button>
            </div>
          </div>

          {/* Video Recordings */}
          {(c.videoUrl || c.screenUrl) && (
            <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Recordings</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {c.videoUrl && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, marginBottom: 4, color: '#64748B' }}>Candidate Camera</p>
                    <video src={c.videoUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                  </div>
                )}
                {c.screenUrl && (
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, marginBottom: 4, color: '#64748B' }}>Screen Share</p>
                    <video src={c.screenUrl} controls style={{ width: '100%', borderRadius: 8, background: '#000' }} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Score block */}
          <div className="panel" style={{ padding: 16, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Score</p>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{score}/10 · {accuracy}% accuracy</span>
            </div>
            <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%', width: `${(score / 10) * 100}%`,
                  background: score >= 7 ? '#10B981' : score >= 4 ? '#F59E0B' : '#F43F5E',
                }}
              />
            </div>
            <p style={{ marginTop: 8, fontSize: 12, color: '#64748B' }}>
              {correct} correct of {total} question{total !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Questions list */}
          {total > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Question outcomes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {c.questions.map((q, idx) => {
                  const isCorrect = (c.answers || {})[q.id] === q.correctAnswer;
                  return (
                    <div
                      key={q.id || idx}
                      style={{
                        padding: '12px 16px', borderRadius: 12,
                        background: isCorrect ? '#F0FDF4' : '#FFF1F2',
                        border: `1px solid ${isCorrect ? '#DCFCE7' : '#FFE4E6'}`,
                        display: 'flex', flexDirection: 'column', gap: 10
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <div style={{ 
                          width: 24, height: 24, borderRadius: 6, 
                          background: isCorrect ? '#10B981' : '#F43F5E', 
                          color: 'white', display: 'grid', placeItems: 'center', 
                          fontSize: 11, fontWeight: 800, flexShrink: 0, marginTop: 2 
                        }}>
                          {idx + 1}
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', lineHeight: 1.4 }}>{q.question}</p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginLeft: 34 }}>
                        <div style={{ fontSize: 11, color: isCorrect ? '#065F46' : '#991B1B' }}>
                          <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Response:</span><br/>
                          { (c.answers || {})[q.id] || 'Skipped' }
                        </div>
                        <div style={{ fontSize: 11, color: '#166534' }}>
                          <span style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Best Approach:</span><br/>
                          { q.correctAnswer }
                        </div>
                      </div>

                      {q.explanation && (
                         <div style={{ marginLeft: 34, fontSize: 11, color: '#64748B', fontStyle: 'italic', borderTop: '1px solid rgba(0,0,0,0.05)', paddingTop: 8 }}>
                           <Sparkles size={10} style={{ marginRight: 4, display: 'inline' }} /> {q.explanation}
                         </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #E2E8F0', display: 'flex', gap: 10, justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <button onClick={onDelete} className="btn-secondary" style={{ color: '#BE123C', borderColor: '#FECDD3' }}>
            <Trash2 size={14} /> Delete
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onDownload} className="btn-secondary">
              <Download size={14} /> Download
            </button>
            <button
              onClick={onShortlist}
              className="btn-primary"
              style={shortlisted ? { background: '#059669' } : undefined}
            >
              {shortlisted ? <><StarOff size={14} /> Remove shortlist</> : <><Star size={14} /> Keep / Shortlist</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, padding: 10, borderRadius: 8, background: '#F8FAFC', border: '1px solid #F1F5F9' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 500, wordBreak: 'break-word' }}>{value}</span>
    </div>
  );
}
