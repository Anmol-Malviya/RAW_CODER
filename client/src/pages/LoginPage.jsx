import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/api';
import { Mail, Lock, User, Sparkles, ShieldCheck, LineChart, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(searchParams.get('mode') !== 'signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsLogin(searchParams.get('mode') !== 'signup');
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const data = await loginUser(email, password);
        login(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/admin' : '/candidate');
      } else {
        const data = await registerUser(name, email, password, role);
        login(data.token, data.user);
        navigate(data.user.role === 'admin' ? '/admin' : '/candidate');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8FAFC' }}>
      {/* LEFT 60% */}
      <div
        style={{
          flex: '0 0 55%',
          padding: '64px 80px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#FFFFFF',
          borderRight: '1px solid #F1F5F9',
          position: 'relative',
          overflow: 'hidden'
        }}
        className="login-left"
      >
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, background: 'rgba(99, 102, 241, 0.03)', borderRadius: '50%', blur: '100px' }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 64 }}>
            <div 
              onClick={() => navigate('/')}
              style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
            >
              <div style={{ width: 40, height: 40, bg: '#4F46E5', background: 'linear-gradient(135deg, #6366F1, #4F46E5)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 20 }}>A</div>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>AI Interviewer</span>
            </div>
          </div>

          <h1 style={{ fontSize: 48, fontWeight: 900, color: '#0F172A', lineHeight: 1, letterSpacing: '-0.04em', maxWidth: 600 }}>
            Reinventing recruitment with <span style={{ color: '#4F46E5' }}>AI precision.</span>
          </h1>
          <p style={{ marginTop: 24, fontSize: 18, color: '#64748B', maxWidth: 480, lineHeight: 1.6, fontWeight: 500 }}>
            The world's most advanced platform for automated technical assessments and candidate intelligence.
          </p>

          <div style={{ marginTop: 64, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, maxWidth: 600 }}>
            <Feature
              icon={<Sparkles size={18} />}
              title="Resume Mapping"
              body="AI analyzes every line of the resume to build the perfect test."
            />
            <Feature
              icon={<ShieldCheck size={18} />}
              title="Full Integrity"
              body="Biometric proctoring and tab-switch detection built-in."
            />
            <Feature
              icon={<LineChart size={18} />}
              title="Smart Insight"
              body="Predictive performance scores based on spoken answers."
            />
            <Feature
              icon={<ArrowLeft size={18} />}
              title="Fast Onboarding"
              body="Get assessments live in minutes, not hours or days."
            />
          </div>
        </div>
      </div>

      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 40,
          background: '#F8FAFC'
        }}
        className="login-right"
      >
        <div className="card" style={{ width: '100%', maxWidth: 440, padding: 40, borderRadius: 32, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)' }}>
          <div style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 28, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
              {isLogin ? 'Welcome back' : 'Join AI Interviewer'}
            </h2>
            <p style={{ marginTop: 8, fontSize: 15, color: '#64748B', fontWeight: 500 }}>
              {isLogin ? 'Enter your credentials to continue.' : 'Start your journey with us today.'}
            </p>
          </div>

          {error && (
            <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 8, background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: 13 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            {!isLogin && (
              <div>
                <label className="field-label">Full name</label>
                <div style={{ position: 'relative' }}>
                  <User size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="input-soft"
                    style={{ paddingLeft: 36 }}
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="field-label">Email</label>
              <div style={{ position: 'relative' }}>
                <Mail size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="input-soft"
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input-soft"
                  style={{ paddingLeft: 36 }}
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div>
                <p className="field-label">I am a</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <RoleButton active={role === 'candidate'} onClick={() => setRole('candidate')}>Candidate</RoleButton>
                  <RoleButton active={role === 'admin'} onClick={() => setRole('admin')}>Recruiter</RoleButton>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', height: 42, marginTop: 8 }}
            >
              {loading ? 'Working…' : isLogin ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <p style={{ marginTop: 20, textAlign: 'center', fontSize: 13, color: '#64748B' }}>
            {isLogin ? 'New to AI Interviewer? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
              }}
              style={{ color: '#4F46E5', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
            >
              {isLogin ? 'Create account' : 'Sign in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}

function Feature({ icon, title, body }) {
  return (
    <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 14,
          background: '#F5F3FF',
          color: '#6366F1',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{title}</p>
        <p style={{ fontSize: 14, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>{body}</p>
      </div>
    </div>
  );
}

function RoleButton({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: '10px 14px',
        borderRadius: 8,
        border: `1px solid ${active ? '#6366F1' : '#E2E8F0'}`,
        background: active ? '#EEF2FF' : '#FFFFFF',
        color: active ? '#4338CA' : '#334155',
        fontWeight: active ? 600 : 500,
        fontSize: 13,
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
    >
      {children}
    </button>
  );
}
