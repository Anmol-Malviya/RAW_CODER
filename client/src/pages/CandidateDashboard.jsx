import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { fetchJobs, getUserSessions } from '../services/api';
import { Briefcase, Search, ArrowRight, Clock, ClipboardList, FileText, CheckCircle, ChevronRight, BarChart3 } from 'lucide-react';

export default function CandidateDashboard() {
  const { user } = useAuth();
  const [jobs, setJobs] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('jobs'); // 'jobs' | 'reports'
  const navigate = useNavigate();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, sessionsData] = await Promise.all([
        fetchJobs(),
        getUserSessions()
      ]);
      setJobs(jobsData);
      setSessions(sessionsData);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => job.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
      {/* ─── Ultra-Minimal Header ─── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 40, marginTop: 20 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.03em' }}>
            Hello, {user?.name?.split(' ')[0] || 'Candidate'}
          </h1>
          <p style={{ marginTop: 6, fontSize: 15, color: '#64748B', fontWeight: 500 }}>
            {activeTab === 'jobs' 
              ? 'Find your next career move with AI-driven assessments.' 
              : 'Review your performance and growth across previous sessions.'}
          </p>
        </div>
        
        {/* Modern Tab Switcher */}
        <div style={{ background: '#F1F5F9', padding: 4, borderRadius: 14, display: 'flex', gap: 4 }}>
          <button 
            onClick={() => setActiveTab('jobs')}
            style={{ 
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: activeTab === 'jobs' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'jobs' ? '#6366F1' : '#64748B',
              boxShadow: activeTab === 'jobs' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <Briefcase size={16} /> Open Roles
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            style={{ 
              padding: '10px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              fontSize: 13, fontWeight: 700, transition: 'all 0.2s',
              background: activeTab === 'reports' ? '#FFFFFF' : 'transparent',
              color: activeTab === 'reports' ? '#6366F1' : '#64748B',
              boxShadow: activeTab === 'reports' ? '0 4px 12px rgba(0,0,0,0.05)' : 'none',
              display: 'flex', alignItems: 'center', gap: 8
            }}
          >
            <ClipboardList size={16} /> My Reports
          </button>
        </div>
      </div>

      {activeTab === 'jobs' ? (
        <>
          {/* Stats row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
            <StatCard icon={<Briefcase size={20} color="#6366F1" />} label="Curated for you" value={`${jobs.length} Positions`} />
            <StatCard icon={<CheckCircle size={20} color="#10B981" />} label="Completed" value={`${sessions.length} Assessments`} />
            <StatCard icon={<BarChart3 size={20} color="#F59E0B" />} label="Success Rate" value="Highly Competitive" />
          </div>

          {/* Join with Code - Premium Panel */}
          <div style={{ 
            padding: '32px 40px', marginBottom: 48, borderRadius: 32,
            background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)', 
            boxShadow: '0 20px 40px -12px rgba(99,102,241,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap',
            color: 'white'
          }}>
            <div style={{ flex: 1, minWidth: 300 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.01em' }}>Have a direct invitation?</h3>
              <p style={{ marginTop: 8, fontSize: 15, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>Enter your session code to jump straight into the interview.</p>
            </div>
            <div style={{ display: 'flex', gap: 12, flex: '1 1 360px', background: 'rgba(255,255,255,0.1)', padding: 10, borderRadius: 20, backdropFilter: 'blur(10px)' }}>
              <input
                type="text"
                placeholder="ENTER CODE"
                id="interviewCode"
                style={{ 
                  flex: 1, background: 'transparent', border: 'none', color: 'white', 
                  fontSize: 16, fontWeight: 800, padding: '0 16px', outline: 'none',
                  textTransform: 'uppercase'
                }}
                maxLength={6}
              />
              <button 
                className="btn-primary" 
                style={{ background: 'white', color: '#4F46E5', fontWeight: 800, padding: '14px 28px', borderRadius: 14 }}
                onClick={async () => {
                  const code = document.getElementById('interviewCode').value;
                  if (!code) return;
                  try {
                    const data = await import('../services/api').then(m => m.validateInterviewCode(code));
                    navigate('/check', { state: { jobData: data } });
                  } catch (err) { alert(err.response?.data?.error || 'Invalid code'); }
                }}
              >
                Start Session <ArrowRight size={18} />
              </button>
            </div>
          </div>

          {/* Search & Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
            <div style={{ position: 'relative', width: 400 }}>
              <Search size={18} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find a role by title..."
                style={{ 
                  width: '100%', padding: '14px 16px 14px 48px', borderRadius: 16,
                  border: '1px solid #E2E8F0', background: '#FFFFFF', fontSize: 14, fontWeight: 500,
                  boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}
              />
            </div>
            <span style={{ fontSize: 13, color: '#64748B', fontWeight: 700 }}>{filteredJobs.length} ROLES AVAILABLE</span>
          </div>

          {/* Jobs List - Clean & Professional */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24, marginBottom: 40 }}>
            {loading ? (
              [1, 2, 3].map((item) => <div key={item} className="skeleton" style={{ height: 240, borderRadius: 24 }} />)
            ) : filteredJobs.length === 0 ? (
              <div style={{ textAlign: 'center', gridColumn: '1 / -1', padding: '60px 0', background: '#FFFFFF', borderRadius: 32, border: '1px solid #F1F5F9' }}>
                <p style={{ fontWeight: 700, color: '#64748B' }}>No matching roles found.</p>
              </div>
            ) : (
              filteredJobs.map((job) => (
                <article key={job._id} style={{ 
                  padding: 32, background: '#FFFFFF', borderRadius: 32, border: '1px solid #F1F5F9',
                  display: 'flex', flexDirection: 'column', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.02)'
                }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseOut={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, background: '#F5F3FF', color: '#6366F1', display: 'grid', placeItems: 'center' }}>
                      <Briefcase size={20} />
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#10B981', background: '#ECFDF5', padding: '4px 12px', borderRadius: 8 }}>NEW OPENING</span>
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1A1A1A', marginBottom: 10 }}>{job.title}</h3>
                  <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, marginBottom: 24, flex: 1 }}>{job.description}</p>
                  
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24, fontSize: 12, color: '#94A3B8', fontWeight: 600 }}>
                    <Clock size={14} /> Posted {new Date(job.createdAt).toLocaleDateString()}
                  </div>

                  <button
                    onClick={() => navigate('/check', { state: { jobData: job } })}
                    style={{ 
                      width: '100%', padding: '16px 0', borderRadius: 16, background: '#1A1A1A', color: 'white',
                      border: 'none', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#000000'}
                    onMouseOut={e => e.currentTarget.style.background = '#1A1A1A'}
                  >
                    Apply Now <ArrowRight size={16} />
                  </button>
                </article>
              ))
            )}
          </div>
        </>
      ) : (
        /* ─── Reports Section ─── */
        <div style={{ background: '#FFFFFF', borderRadius: 32, border: '1px solid #F1F5F9', padding: 40, boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 20, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em' }}>Activity History</h2>
            <p style={{ marginTop: 6, fontSize: 14, color: '#64748B', fontWeight: 500 }}>Track your performance and view detailed AI reports from past assessments.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {loading ? (
              [1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: 80, borderRadius: 16 }} />)
            ) : sessions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0' }}>
                <div style={{ width: 64, height: 64, borderRadius: 20, background: '#F8FAFC', color: '#CBD5E1', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
                  <FileText size={32} />
                </div>
                <p style={{ fontWeight: 700, color: '#64748B' }}>No assessment history found.</p>
                <p style={{ fontSize: 14, color: '#94A3B8', marginTop: 4 }}>Completed interviews will appear here automatically.</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session._id} style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px',
                  background: '#F8FAFC', borderRadius: 20, border: '1px solid #F1F5F9', transition: 'all 0.2s'
                }} onMouseOver={e => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.03)'; }} onMouseOut={e => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.boxShadow = 'none'; }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                     <div style={{ width: 44, height: 44, borderRadius: 14, background: '#FFFFFF', color: '#10B981', display: 'grid', placeItems: 'center', border: '1px solid #E2E8F0' }}>
                        <CheckCircle size={20} />
                     </div>
                     <div>
                       <p style={{ fontSize: 15, fontWeight: 800, color: '#1A1A1A' }}>{session.jobId?.title || 'General Assessment'}</p>
                       <p style={{ fontSize: 12, fontWeight: 600, color: '#64748B', marginTop: 2 }}>{new Date(session.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} • {session.answers ? Object.keys(session.answers).length : 0} Questions</p>
                     </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                    <div style={{ textAlign: 'right' }}>
                       <p style={{ fontSize: 10, fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>AI Score</p>
                       <p style={{ fontSize: 16, fontWeight: 800, color: '#6366F1' }}>{session.score || 0}%</p>
                    </div>
                    <button 
                      onClick={() => navigate('/results', { state: { sessionId: session._id, fromHistory: true } })}
                      style={{ 
                        padding: '10px 18px', borderRadius: 12, background: '#FFFFFF', color: '#1A1A1A',
                        border: '1px solid #E2E8F0', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#6366F1'; e.currentTarget.style.color = '#6366F1'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#1A1A1A'; }}
                    >
                      View Report <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <div style={{ padding: '24px 28px', background: '#FFFFFF', borderRadius: 28, border: '1px solid #F1F5F9', boxShadow: '0 4px 12px rgba(0,0,0,0.01)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
        <p style={{ fontSize: 12, color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
      </div>
      <p style={{ fontSize: 24, fontWeight: 800, color: '#1A1A1A', letterSpacing: '-0.02em' }}>{value}</p>
    </div>
  );
}

