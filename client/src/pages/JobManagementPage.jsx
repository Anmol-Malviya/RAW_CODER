import { useState, useEffect } from 'react';
import { getJobs, patchJob, removeJob } from '../services/api';
import { 
  Briefcase, Search, Filter, Settings2, 
  ToggleLeft, ToggleRight, Trash2, Edit3,
  ExternalLink, Calendar, Users, Loader2, AlertCircle, CheckCircle
} from 'lucide-react';

export default function JobManagementPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actingJobId, setActingJobId] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await getJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleToggleStatus = async (job) => {
    if (actingJobId) return;
    setActingJobId(job._id);
    try {
      const nextStatus = !job.isActive;
      await patchJob(job._id, { isActive: nextStatus });
      setJobs(prev => prev.map(j => j._id === job._id ? { ...j, isActive: nextStatus } : j));
      showToast(nextStatus ? 'Interview opened successfully!' : 'Interview closed successfully!');
    } catch (e) {
      showToast('Failed to update status', 'error');
    } finally {
      setActingJobId(null);
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this role and all associated candidate data? This action cannot be undone.')) return;
    setActingJobId(id);
    try {
      await removeJob(id);
      setJobs(prev => prev.filter(j => j._id !== id));
      showToast('Role deleted successfully');
    } catch (e) {
      showToast('Failed to delete role', 'error');
    } finally {
      setActingJobId(null);
    }
  };

  const filtered = jobs.filter(j => 
    j.title.toLowerCase().includes(search.toLowerCase()) || 
    j.interviewCode?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Role Management</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>Manage active job roles, toggle interview visibility, and edit requirements.</p>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input 
            type="text" 
            placeholder="Search roles or codes..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: '100%', padding: '10px 16px 10px 40px', borderRadius: 10, border: '1px solid #E2E8F0', outline: 'none', fontSize: 14 }}
          />
        </div>
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 100 }}>
          <Loader2 className="spin" size={40} color="#4F46E5" />
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 80, background: 'white', borderRadius: 16, border: '1px dashed #E2E8F0' }}>
          <Briefcase size={40} color="#CBD5E1" style={{ marginBottom: 16 }} />
          <p style={{ color: '#64748B' }}>No matching job roles found.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }}>
          {filtered.map(job => (
            <div key={job._id} className="card card-hover" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16, borderTop: `4px solid ${job.isActive ? '#6366F1' : '#94A3B8'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{job.title}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 8px', borderRadius: 4, fontFamily: 'monospace' }}>
                      {job.interviewCode}
                    </span>
                    <span className={`status-pill ${job.isActive ? 'pill-emerald' : 'pill-slate'}`} style={{ fontSize: 9 }}>
                      {job.isActive ? 'OPEN' : 'CLOSED'}
                    </span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                   <button className="btn-ghost" title="Copy Invitation Link" onClick={() => {
                     navigator.clipboard.writeText(`${window.location.origin}/candidate`);
                     showToast('Link copied to clipboard!');
                   }}>
                     <ExternalLink size={18} />
                   </button>
                </div>
              </div>

              <p style={{ fontSize: 13, color: '#64748B', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: 60 }}>
                {job.description}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                <span className="status-pill pill-indigo" style={{ textTransform: 'capitalize' }}>{job.interviewType}</span>
                <span className="status-pill pill-amber" style={{ textTransform: 'capitalize' }}>{job.difficulty}</span>
                {job.hasCodingRound && <span className="status-pill pill-rose">Coding Enabled</span>}
              </div>

              <div style={{ marginTop: 'auto', paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <button 
                    onClick={() => handleToggleStatus(job)}
                    style={{ 
                      display: 'flex', alignItems: 'center', gap: 6, border: 'none', background: 'transparent',
                      cursor: 'pointer', color: job.isActive ? '#10B981' : '#64748B', fontWeight: 600, fontSize: 13
                    }}
                  >
                    {job.isActive ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                    {job.isActive ? 'Close Interview' : 'Open Interview'}
                  </button>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                   <button className="btn-ghost" style={{ color: '#EF4444' }} onClick={() => handleDeleteJob(job._id)}>
                     <Trash2 size={18} />
                   </button>
                </div>
              </div>

              {actingJobId === job._id && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
                  <Loader2 className="spin" size={24} color="#4F46E5" />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ 
          position: 'fixed', bottom: 32, right: 32, 
          background: toast.type === 'success' ? '#0F172A' : '#EF4444', 
          color: 'white', padding: '12px 24px', borderRadius: 12, 
          display: 'flex', alignItems: 'center', gap: 12, 
          boxShadow: '0 10px 30px rgba(0,0,0,0.2)', 
          fontSize: 14, fontWeight: 600, zIndex: 1000 
        }}>
          {toast.type === 'success' ? <CheckCircle size={20} color="#10B981" /> : <AlertCircle size={20} />}
          {toast.msg}
        </div>
      )}
    </div>
  );
}
