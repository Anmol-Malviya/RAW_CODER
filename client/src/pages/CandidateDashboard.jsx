import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchJobs } from '../services/api';
import { Briefcase, Search, ArrowRight, Clock } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => job.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
          Welcome back, {user?.name?.split(' ')[0] || 'Candidate'}
        </h1>
        <p style={{ marginTop: 6, fontSize: 14, color: '#64748B' }}>
          Browse open roles and start your AI-driven assessment.
        </p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
        <StatCard label="Open roles" value={jobs.length} />
        <StatCard label="Assessments taken" value="0" />
        <StatCard label="Avg. completion" value="—" />
      </div>

      {/* Join with Code */}
      <div className="panel" style={{ padding: 24, marginBottom: 32, background: 'linear-gradient(to right, #EEF2FF, #F5F3FF)', border: '1px solid #C7D2FE' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1E1B4B' }}>Join interview with code</h3>
            <p style={{ marginTop: 2, fontSize: 13, color: '#4338CA' }}>Enter the unique code shared by your recruiter to begin.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flex: '1 1 300px' }}>
            <input
              type="text"
              placeholder="e.g. AB12CD"
              className="input-soft"
              style={{ textTransform: 'uppercase', flex: 1 }}
              maxLength={6}
              id="interviewCode"
            />
            <button 
              className="btn-primary" 
              style={{ whiteSpace: 'nowrap' }}
              onClick={async () => {
                const code = document.getElementById('interviewCode').value;
                if (!code) return alert('Please enter a code');
                try {
                  const data = await import('../services/api').then(m => m.validateInterviewCode(code));
                  navigate('/check', { state: { jobData: data } });
                } catch (err) {
                  alert(err.response?.data?.error || 'Invalid interview code');
                }
              }}
            >
              Join Session
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: 420, marginBottom: 20 }}>
        <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search roles…"
          className="input-soft"
          style={{ paddingLeft: 36 }}
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Available roles</h2>
        <span style={{ fontSize: 13, color: '#64748B' }}>{filteredJobs.length} result{filteredJobs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Jobs grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
        {loading ? (
          [1, 2, 3, 4].map((item) => <div key={item} className="skeleton" style={{ height: 180 }} />)
        ) : filteredJobs.length === 0 ? (
          <div className="card" style={{ padding: 40, textAlign: 'center', gridColumn: '1 / -1' }}>
            <Briefcase size={36} style={{ margin: '0 auto 12px', color: '#CBD5E1' }} />
            <p style={{ fontWeight: 600, color: '#0F172A' }}>No roles match your search</p>
            <p style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>Try a different keyword or check back soon.</p>
          </div>
        ) : (
          filteredJobs.map((job) => (
            <article key={job._id} className="card card-hover" style={{ padding: 24, display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center' }}>
                  <Briefcase size={16} />
                </div>
                <span className="status-pill pill-indigo">Active</span>
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A', lineHeight: 1.3 }}>{job.title}</h3>
              <p style={{ marginTop: 8, fontSize: 13, color: '#64748B', lineHeight: 1.6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                {job.description}
              </p>

              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 14, fontSize: 12, color: '#94A3B8' }}>
                <Clock size={12} />
                <span>Posted {new Date(job.createdAt).toLocaleDateString()}</span>
              </div>

              <button
                onClick={() => navigate('/check', { state: { jobData: job } })}
                className="btn-primary"
                style={{ marginTop: 20, width: '100%' }}
              >
                Apply & Evaluate
                <ArrowRight size={14} />
              </button>
            </article>
          ))
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="card" style={{ padding: 20 }}>
      <p style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>{label}</p>
      <p style={{ marginTop: 6, fontSize: 24, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em' }}>{value}</p>
    </div>
  );
}
