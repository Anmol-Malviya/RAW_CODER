import { useState, useEffect } from 'react';
import { fetchJobs, updateJobStatus } from '../services/api';
import { Briefcase, Power, CheckCircle, XCircle, Users, Copy, Loader2, AlertTriangle } from 'lucide-react';

export default function JobManagementPage() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      setLoading(true);
      const data = await fetchJobs();
      setJobs(data || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (jobId, currentStatus) => {
    try {
      setToggling(jobId);
      await updateJobStatus(jobId, !currentStatus);
      // Update local state to reflect the change instantly
      setJobs(jobs.map(j => j._id === jobId ? { ...j, isActive: !currentStatus } : j));
    } catch (e) {
      console.error(e);
      alert('Failed to update job status.');
    } finally {
      setToggling(null);
    }
  };

  const copyCode = (code) => {
    navigator.clipboard.writeText(code);
    alert(`Copied link/code: ${code}`);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="spin" size={40} color="#4F46E5" />
      </div>
    );
  }

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
            <p style={{ color: '#64748B', fontSize: 14 }}>Open, close, or pause interview roles for candidates.</p>
          </div>
        </div>
      </div>

      {jobs.length === 0 ? (
        <div className="card" style={{ padding: 48, textAlign: 'center' }}>
          <AlertTriangle size={48} color="#94A3B8" style={{ margin: '0 auto 16px' }} />
          <h3 style={{ fontSize: 18, fontWeight: 600, color: '#334155' }}>No Roles Found</h3>
          <p style={{ color: '#64748B', marginTop: 8 }}>You haven't deployed any interview roles yet. Deploy a new role from the Dashboard.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {jobs.map((job) => (
            <div key={job._id} className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 24, background: job.isActive ? '#FFFFFF' : '#F8FAFC', opacity: job.isActive ? 1 : 0.8, transition: 'all 0.2s ease' }}>
              <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: job.isActive ? '#EEF2FF' : '#E2E8F0', color: job.isActive ? '#4F46E5' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Briefcase size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>{job.title}</h3>
                    {job.isActive ? (
                      <span className="status-pill pill-emerald" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <CheckCircle size={12} /> Active
                      </span>
                    ) : (
                      <span className="status-pill pill-slate" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <XCircle size={12} /> Closed
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: '#64748B' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Users size={14} /> {job.difficulty}
                    </span>
                    <span>Type: {job.interviewType}</span>
                    <span>Created: {new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ textAlign: 'right', marginRight: 16 }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', marginBottom: 2, textTransform: 'uppercase' }}>Join Code</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 800, color: '#334155', fontFamily: 'monospace', letterSpacing: '2px' }}>{job.interviewCode}</span>
                    <button onClick={() => copyCode(job.interviewCode)} className="btn-ghost" style={{ padding: 4 }} title="Copy Code">
                      <Copy size={14} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={() => handleToggleStatus(job._id, job.isActive)}
                  disabled={toggling === job._id}
                  className={job.isActive ? "btn-danger" : "btn-primary"}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, width: 120, justifyContent: 'center' }}
                >
                  {toggling === job._id ? <Loader2 size={16} className="spin" /> : <Power size={16} />}
                  {job.isActive ? 'Close Role' : 'Reopen Role'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
