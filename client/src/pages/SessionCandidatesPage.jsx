import { useState, useEffect, useMemo, useRef } from 'react';
import { fetchJobs, createJob, getJobCandidates, sendCandidateEmail, sendBulkCandidateEmails, updateCandidateStatus } from '../services/api';
import {
  Plus, Users, AlertTriangle, Briefcase, Search, X, Download, Eye,
  MoreHorizontal, TrendingUp, CheckCircle2, Trash2, Star, StarOff, RotateCcw,
  Calendar, FileText, Mail, Clock, Send, CheckCheck, XCircle,
} from 'lucide-react';

import { useParams, useNavigate } from 'react-router-dom';

const STATUS_KEY = 'vyorai:admin:statuses';

export default function SessionCandidatesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const selectedJobId = id;
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState([]);
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

  const [filterScore, setFilterScore] = useState('all');
  const [filterFlags, setFilterFlags] = useState('all');
  const [filterDate, setFilterDate] = useState('all');
  const [search, setSearch] = useState('');

  // Candidate action state
  const [statuses, setStatuses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(STATUS_KEY) || '{}');
    } catch {
      return {};
    }
  });
  const [openMenuId, setOpenMenuId] = useState(null);
  const [viewing, setViewing] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    loadJobs();
  }, []);

  useEffect(() => {
    if (jobs.length > 0 || selectedJobId !== 'all') loadCandidates();
  }, [selectedJobId, jobs]);

  useEffect(() => {
    localStorage.setItem(STATUS_KEY, JSON.stringify(statuses));
  }, [statuses]);

  // Close dropdown on outside click / escape
  useEffect(() => {
    if (!openMenuId) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenuId(null);
      }
    };
    const onEsc = (e) => e.key === 'Escape' && setOpenMenuId(null);
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onEsc);
    };
  }, [openMenuId]);

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

  const loadCandidates = async () => {
    try {
      let flat = [];
      if (selectedJobId === 'all') {
        const lists = await Promise.all(jobs.map((j) => getJobCandidates(j._id).catch(() => [])));
        flat = lists.flatMap((list, idx) => list.map((c) => ({ ...c, _jobTitle: jobs[idx]?.title })));
      } else {
        const data = await getJobCandidates(selectedJobId);
        const job = jobs.find((j) => j._id === selectedJobId);
        flat = data.map((c) => ({ ...c, _jobTitle: job?.title }));
      }
      setCandidates(flat);
      
      // Sync DB status to local state if missing
      setStatuses(prev => {
        const up = { ...prev };
        let modified = false;
        flat.forEach(c => {
          if (c.status && c.status !== 'pending') {
            up[c._id] = c.status;
            modified = true;
          }
        });
        return modified ? up : prev;
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    setIsPosting(true);
    try {
      const created = await createJob(newJob.title, newJob.description, newJob.difficulty, newJob.interviewType, newJob.hasCodingRound);
      setLatestJob(created); // New state to show success
      // Open the candidate portal in a new window as requested
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

  const getStatus = (id) => statuses[id]; // 'shortlisted' | 'deleted' | undefined

  const setStatus = async (id, next) => {
    try {
      // Opt-out of calling API if deleting local status (wait, if rejecting to 'deleted', backend needs status)
      // Send standard 'pending', 'shortlisted', 'deleted'
      const backendStatus = next || 'pending';
      await updateCandidateStatus(id, backendStatus);
      
      setStatuses((prev) => {
        const copy = { ...prev };
        if (!next) delete copy[id];
        else copy[id] = next;
        return copy;
      });
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update candidate status.');
    }
    setOpenMenuId(null);
  };

  // ─── Email helper ───
  const [emailSending, setEmailSending] = useState({});
  const [emailSent, setEmailSent] = useState({});

  const handleSendEmail = async (candidate, type) => {
    const email = candidate.candidateId?.email;
    const name = candidate.candidateId?.name || 'Candidate';
    const jobTitle = candidate._jobTitle || '';
    if (!email || email === '—') {
      alert('No email address found for this candidate.');
      return;
    }
    const key = `${candidate._id}_${type}`;
    setEmailSending((p) => ({ ...p, [key]: true }));
    try {
      await sendCandidateEmail(email, name, jobTitle, type);
      setEmailSent((p) => ({ ...p, [key]: true }));
      // Auto-update status when sending email
      if (type === 'selected' && getStatus(candidate._id) !== 'shortlisted') {
        setStatus(candidate._id, 'shortlisted');
      }
      if (type === 'rejected' && getStatus(candidate._id) !== 'deleted') {
        setStatus(candidate._id, 'deleted');
      }
    } catch (err) {
      console.error('Email send failed:', err);
      alert('Failed to send email: ' + (err.response?.data?.error || err.message));
    } finally {
      setEmailSending((p) => ({ ...p, [key]: false }));
    }
  };

  const [bulkSendingType, setBulkSendingType] = useState(null);

  const handleBulkEmail = async (type) => {
    const isSelected = type === 'selected';
    // Match current filter list, not the entire database
    const targetCandidates = filtered.filter(c => {
      const isShortlisted = getStatus(c._id) === 'shortlisted';
      const email = c.candidateId?.email;
      return (isSelected ? isShortlisted : !isShortlisted) && email && email !== '—';
    });

    if (targetCandidates.length === 0) {
      alert(`No valid candidates to send ${isSelected ? 'Selection' : 'Rejection'} emails to in the current view.`);
      return;
    }

    const confirmMsg = `You are about to send ${isSelected ? 'Selected' : 'Rejected'} emails to ${targetCandidates.length} candidate(s).\n\nAre you sure you want to proceed?`;
    if (!window.confirm(confirmMsg)) return;

    setBulkSendingType(type);
    
    const payload = targetCandidates.map(c => ({
      email: c.candidateId.email,
      name: c.candidateId.name || 'Candidate',
      jobTitle: c._jobTitle || ''
    }));

    try {
      const response = await sendBulkCandidateEmails(payload, type);
      
      // Auto-mark rejected as deleted for visual cleanliness
      if (!isSelected) {
        setStatuses(prev => {
          const up = { ...prev };
          targetCandidates.forEach(c => up[c._id] = 'deleted');
          return up;
        });
      }
      
      alert(`Success! Scheduled ${targetCandidates.length} email(s) for delivery.`);
    } catch (err) {
      console.error('Bulk email failed:', err);
      alert('Bulk send failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setBulkSendingType(null);
    }
  };

  const filtered = useMemo(() => {
    const now = Date.now();
    const DAY = 86400000;
    return candidates.filter((c) => {
      if (getStatus(c._id) === 'deleted') return false;

      const name = (c.candidateId?.name || '').toLowerCase();
      const email = (c.candidateId?.email || '').toLowerCase();
      const q = search.trim().toLowerCase();
      if (q && !name.includes(q) && !email.includes(q)) return false;

      const score = c.score || 0;
      if (filterScore === 'high' && score < 7) return false;
      if (filterScore === 'mid' && (score < 4 || score >= 7)) return false;
      if (filterScore === 'low' && score >= 4) return false;

      const flags = c.tabSwitchCount || 0;
      if (filterFlags === 'flagged' && flags === 0) return false;
      if (filterFlags === 'clean' && flags > 0) return false;
      if (filterFlags === 'shortlisted' && getStatus(c._id) !== 'shortlisted') return false;

      if (filterDate !== 'all' && c.createdAt) {
        const ts = new Date(c.createdAt).getTime();
        if (filterDate === 'today' && now - ts > DAY) return false;
        if (filterDate === 'week' && now - ts > 7 * DAY) return false;
        if (filterDate === 'month' && now - ts > 30 * DAY) return false;
      }

      return true;
    });
  }, [candidates, search, filterScore, filterFlags, filterDate, statuses]);

  const stats = useMemo(() => {
    const list = candidates.filter((c) => getStatus(c._id) !== 'deleted');
    const total = list.length;
    const flagged = list.filter((c) => (c.tabSwitchCount || 0) > 0).length;
    const strong = list.filter((c) => (c.score || 0) >= 7).length;
    const avg = total ? (list.reduce((s, c) => s + (c.score || 0), 0) / total).toFixed(1) : '0.0';
    return { total, flagged, strong, avg };
  }, [candidates, statuses]);

  const activeFilterCount =
    (search ? 1 : 0) +
    (selectedJobId !== 'all' ? 1 : 0) +
    (filterScore !== 'all' ? 1 : 0) +
    (filterFlags !== 'all' ? 1 : 0) +
    (filterDate !== 'all' ? 1 : 0);

  const resetFilters = () => {
    setSearch('');
    setSelectedJobId('all');
    setFilterScore('all');
    setFilterFlags('all');
    setFilterDate('all');
  };

  const downloadReport = (c) => {
    const report = {
      candidate: {
        name: c.candidateId?.name || 'Unknown',
        email: c.candidateId?.email || null,
      },
      role: c._jobTitle || null,
      score: c.score ?? null,
      total: c.questions?.length ?? null,
      tabSwitchCount: c.tabSwitchCount ?? 0,
      testDurationSeconds: c.testDurationSeconds ?? 0,
      submittedAt: c.createdAt,
      status: getStatus(c._id) || 'pending',
      questions: (c.questions || []).map((q, i) => ({
        index: i + 1,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        answered: (c.answers || {})[q.id],
      })),
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const safeName = (c.candidateId?.name || 'candidate').replace(/\s+/g, '_');
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}_report.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      {/* Dynamic Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyItems: 'space-between', justifyContent: 'space-between', marginBottom: 32, padding: '32px 40px', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', borderRadius: 24, boxShadow: '0 20px 40px -12px rgba(15,23,42,0.4)', color: 'white', flexWrap: 'wrap', gap: 20 }}>
        <div>
            <button onClick={() => navigate('/admin')} className="btn-ghost" style={{ padding: '6px 12px', background: 'rgba(255,255,255,0.1)', color: 'white', borderRadius: 8, marginBottom: 12, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, border: 'none', cursor: 'pointer' }}>
               ← Back to All Sessions
            </button>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            {jobs.find(j => j._id === selectedJobId)?.title || 'Session Candidates'}
          </h1>
          <p style={{ marginTop: 8, fontSize: 15, color: '#94A3B8', fontWeight: 500 }}>
            Review, shortlist, and dispatch decision emails for this specific session.
          </p>
        </div>
      </div>

      {/* CANDIDATES VIEW */}
      <>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 32 }}>
        <Stat label="Candidates" value={stats.total} icon={<Users size={16} />} tone="indigo" />
        <Stat label="Strong performers" value={stats.strong} icon={<TrendingUp size={16} />} tone="emerald" />
        <Stat label="Flagged" value={stats.flagged} icon={<AlertTriangle size={16} />} tone="rose" />
        <Stat label="Average score" value={`${stats.avg}/10`} icon={<CheckCircle2 size={16} />} tone="slate" />
      </div>

      {/* Filters bar */}
      <div style={{ padding: '8px 20px', marginBottom: 24, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center', background: '#FFFFFF', borderRadius: 999, border: '1px solid #E2E8F0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
        <div style={{ position: 'relative', flex: '1 1 240px', minWidth: 220 }}>
          <Search size={16} strokeWidth={2.5} style={{ position: 'absolute', left: 4, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates…"
            style={{ width: '100%', padding: '10px 16px 10px 32px', border: 'none', background: 'transparent', fontSize: 15, fontWeight: 500, color: '#0F172A', outline: 'none' }}
          />
        </div>
        <div style={{ width: 1, height: 24, background: '#E2E8F0', margin: '0 4px' }} />
        {/* Session Dropdown is removed since candidates view is locked to one session */}
        <Select value={filterScore} onChange={setFilterScore} label="Score">
          <option value="all">All scores</option>
          <option value="high">Strong (7+)</option>
          <option value="mid">Average (4–6)</option>
          <option value="low">Weak (&lt;4)</option>
        </Select>
        <Select value={filterFlags} onChange={setFilterFlags} label="Status">
          <option value="all">All candidates</option>
          <option value="flagged">Flagged only</option>
          <option value="clean">No flags</option>
          <option value="shortlisted">Shortlisted</option>
        </Select>
        <Select value={filterDate} onChange={setFilterDate} label="Date">
          <option value="all">Any time</option>
          <option value="today">Last 24 hours</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </Select>
        {activeFilterCount > 0 && (
          <button onClick={resetFilters} style={{ padding: '8px 16px', background: '#FEF2F2', color: '#DC2626', border: 'none', borderRadius: 999, fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', transition: 'all 0.2s' }} onMouseOver={e => e.currentTarget.style.background = '#FEE2E2'} onMouseOut={e => e.currentTarget.style.background = '#FEF2F2'}>
            <RotateCcw size={14} strokeWidth={2.5} /> Reset
          </button>
        )}
      </div>

      {/* Results count & Bulk Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, flexWrap: 'wrap', gap: 12 }}>
        <p style={{ fontSize: 13, color: '#64748B' }}>
          {filtered.length} of {stats.total} candidate{stats.total !== 1 ? 's' : ''}
          {activeFilterCount > 0 && <span style={{ marginLeft: 6, color: '#4F46E5' }}>· {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''} active</span>}
        </p>
        
        {/* Bulk Action Buttons */}
        {filtered.length > 0 && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => handleBulkEmail('selected')}
              disabled={bulkSendingType !== null}
              className="btn-primary"
              style={{
                background: 'linear-gradient(135deg, #059669, #10B981)',
                padding: '6px 14px', fontSize: 13, border: 'none', borderRadius: 8,
                opacity: bulkSendingType !== null ? 0.6 : 1, transition: 'all 0.2s'
              }}
            >
              <CheckCheck size={14} style={{ marginRight: 6 }} />
              {bulkSendingType === 'selected' ? 'Sending...' : 'Bulk Email: Selected'}
            </button>
            <button
              onClick={() => handleBulkEmail('rejected')}
              disabled={bulkSendingType !== null}
              className="btn-secondary"
              style={{
                color: '#BE123C', borderColor: '#FECDD3', background: '#FFF1F2',
                padding: '6px 14px', fontSize: 13, borderRadius: 8,
                opacity: bulkSendingType !== null ? 0.6 : 1, transition: 'all 0.2s'
              }}
            >
               <XCircle size={14} style={{ marginRight: 6 }} />
              {bulkSendingType === 'rejected' ? 'Sending...' : 'Bulk Email: Rejected'}
            </button>
          </div>
        )}
      </div>

      {/* Table */}
      <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 24, padding: '8px', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.05)' }}>
        <div style={{ overflow: 'hidden', borderRadius: 16 }}>
          {loading ? (
            <div style={{ padding: 24 }}>
              {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8 }} />)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: '80px 20px', textAlign: 'center', background: '#F8FAFC', borderRadius: 16 }}>
              <div style={{ width: 80, height: 80, margin: '0 auto 20px', background: '#FFFFFF', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 20px -5px rgba(0,0,0,0.05)' }}>
                 <Briefcase size={36} color="#94A3B8" />
              </div>
              <p style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>No candidates to show</p>
              <p style={{ marginTop: 8, fontSize: 14, color: '#64748B', maxWidth: 300, margin: '8px auto 0' }}>
                {activeFilterCount > 0 ? 'Try adjusting or resetting your filters to find candidates.' : 'No candidates have applied to this session yet.'}
              </p>
            </div>
          ) : (
          <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Code</th>
                  <th>Time taken</th>
                  <th>Flags</th>
                  <th>Review</th>
                  <th>Score</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const name = c.candidateId?.name || 'Unknown';
                  const email = c.candidateId?.email || '—';
                  const initials = name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase();
                  const score = c.score || 0;
                  const flags = c.tabSwitchCount || 0;
                  const scoreTone = score >= 7 ? 'emerald' : score >= 4 ? 'amber' : 'rose';
                  const durSec = c.testDurationSeconds || 0;
                  const shortlisted = getStatus(c._id) === 'shortlisted';

                  return (
                    <tr
                      key={c._id}
                      style={{
                        background: shortlisted ? '#ECFDF5' : undefined,
                        borderLeft: shortlisted ? '3px solid #10B981' : '3px solid transparent',
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 999,
                            background: shortlisted ? '#D1FAE5' : '#EEF2FF',
                            color: shortlisted ? '#047857' : '#4338CA',
                            display: 'grid', placeItems: 'center', fontSize: 12, fontWeight: 600,
                          }}>
                            {initials || '?'}
                          </div>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A' }}>{name}</p>
                              {shortlisted && (
                                <span className="status-pill pill-emerald" style={{ padding: '2px 8px' }}>
                                  <Star size={10} style={{ marginRight: 3 }} fill="#047857" color="#047857" />
                                  Shortlisted
                                </span>
                              )}
                            </div>
                            <p style={{ fontSize: 12, color: '#64748B' }}>{email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ 
                          fontFamily: 'ui-monospace, monospace', 
                          fontSize: 12, 
                          fontWeight: 600,
                          padding: '4px 8px',
                          background: '#F1F5F9',
                          borderRadius: 4,
                          color: '#475569'
                        }}>
                          {jobs.find(j => j._id === c.jobId)?.interviewCode || '—'}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 13, color: '#334155' }}>
                          {Math.floor(durSec / 60)}m {durSec % 60}s
                        </span>
                      </td>
                      <td>
                        {flags > 0 ? (
                          <span className="status-pill pill-rose">
                            <AlertTriangle size={11} style={{ marginRight: 4 }} />
                            {flags} flag{flags !== 1 ? 's' : ''}
                          </span>
                        ) : (
                          <span className="status-pill pill-emerald">Clean</span>
                        )}
                      </td>
                      <td>
                        {c.feedback ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <div style={{ display: 'flex', gap: 1 }}>
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star 
                                  key={s} 
                                  size={10} 
                                  fill={s <= c.feedback.rating ? '#F59E0B' : 'transparent'} 
                                  color={s <= c.feedback.rating ? '#F59E0B' : '#CBD5E1'} 
                                />
                              ))}
                            </div>
                            {c.feedback.comment && <p style={{ fontSize: 10, color: '#64748B', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.feedback.comment}</p>}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: '#94A3B8' }}>No review</span>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ width: 56, height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${(score / 10) * 100}%`,
                                background: scoreTone === 'emerald' ? '#10B981' : scoreTone === 'amber' ? '#F59E0B' : '#F43F5E',
                              }}
                            />
                          </div>
                          <span style={{
                            fontSize: 13, fontWeight: 600,
                            color: scoreTone === 'emerald' ? '#047857' : scoreTone === 'amber' ? '#B45309' : '#BE123C',
                          }}>
                            {score}/10
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', position: 'relative' }}>
                        <div style={{ display: 'inline-flex', gap: 2, position: 'relative' }}>
                          <IconAction title="View report" onClick={() => setViewing(c)}>
                            <Eye size={14} />
                          </IconAction>
                          <IconAction title="Download JSON" onClick={() => downloadReport(c)}>
                            <Download size={14} />
                          </IconAction>
                          <div style={{ position: 'relative' }} ref={openMenuId === c._id ? menuRef : null}>
                            <IconAction
                              title="More"
                              onClick={() => setOpenMenuId(openMenuId === c._id ? null : c._id)}
                              active={openMenuId === c._id}
                            >
                              <MoreHorizontal size={14} />
                            </IconAction>
                            {openMenuId === c._id && (
                              <Dropdown
                                onShortlist={() => setStatus(c._id, shortlisted ? null : 'shortlisted')}
                                onDelete={() => setStatus(c._id, 'deleted')}
                                shortlisted={shortlisted}
                                onSendSelected={() => handleSendEmail(c, 'selected')}
                                onSendRejected={() => handleSendEmail(c, 'rejected')}
                                emailSending={emailSending[`${c._id}_selected`] || emailSending[`${c._id}_rejected`]}
                                emailSent={emailSent}
                                candidateId={c._id}
                              />
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
        </div>
      </div>
      </>

      {/* View candidate modal */}
      {viewing && (
        <ViewCandidateModal
          candidate={viewing}
          status={getStatus(viewing._id)}
          onClose={() => setViewing(null)}
          onShortlist={() => setStatus(viewing._id, getStatus(viewing._id) === 'shortlisted' ? null : 'shortlisted')}
          onDelete={() => {
            setStatus(viewing._id, 'deleted');
            setViewing(null);
          }}
          onDownload={() => downloadReport(viewing)}
          onSendSelected={() => handleSendEmail(viewing, 'selected')}
          onSendRejected={() => handleSendEmail(viewing, 'rejected')}
          emailSending={emailSending}
          emailSent={emailSent}
        />
      )}

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
}

/* ---------- subcomponents ---------- */

function Stat({ label, value, icon, tone }) {
  const tones = {
    indigo: { bg: '#EEF2FF', color: '#4F46E5', shadow: 'rgba(79, 70, 229, 0.2)' },
    emerald: { bg: '#ECFDF5', color: '#059669', shadow: 'rgba(5, 150, 105, 0.2)' },
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
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', borderRadius: 6,
                        background: isCorrect ? '#ECFDF5' : '#FFF1F2',
                        border: `1px solid ${isCorrect ? '#A7F3D0' : '#FECDD3'}`,
                      }}
                    >
                      <span style={{
                        width: 18, height: 18, borderRadius: 999,
                        background: isCorrect ? '#10B981' : '#F43F5E',
                        color: '#FFFFFF', fontSize: 10, fontWeight: 700,
                        display: 'grid', placeItems: 'center', flexShrink: 0,
                      }}>
                        {idx + 1}
                      </span>
                      <span style={{
                        flex: 1, fontSize: 13,
                        color: isCorrect ? '#065F46' : '#9F1239',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {q.question}
                      </span>
                      <span style={{ fontSize: 11, fontWeight: 600, color: isCorrect ? '#047857' : '#BE123C' }}>
                        {isCorrect ? 'Correct' : 'Wrong'}
                      </span>
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
