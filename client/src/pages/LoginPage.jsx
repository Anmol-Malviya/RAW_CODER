import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser } from '../services/api';
import { Mail, Lock, User, Sparkles, ShieldCheck, LineChart } from 'lucide-react';

export default function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('candidate');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

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
          flex: '0 0 60%',
          padding: '64px 72px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#FFFFFF',
          borderRight: '1px solid #E2E8F0',
        }}
        className="login-left"
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 48 }}>
          <div className="brand-mark">V</div>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>VyorAI</span>
        </div>

        <h1 style={{ fontSize: 44, fontWeight: 700, color: '#0F172A', lineHeight: 1.1, letterSpacing: '-0.02em', maxWidth: 640 }}>
          Hire faster with AI-powered interviews
        </h1>
        <p style={{ marginTop: 20, fontSize: 16, color: '#64748B', maxWidth: 520, lineHeight: 1.6 }}>
          Resume-aware assessments, live proctored interviews, and structured scorecards — all in one clean workspace built for modern hiring teams.
        </p>

        <div style={{ marginTop: 48, display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 520 }}>
          <Feature
            icon={<Sparkles size={16} />}
            title="AI-generated assessments"
            body="Questions tailored to the role and candidate's resume in seconds."
          />
          <Feature
            icon={<ShieldCheck size={16} />}
            title="Proctored interview flow"
            body="Tab switch alerts and integrity signals to keep the process fair."
          />
          <Feature
            icon={<LineChart size={16} />}
            title="Structured scorecards"
            body="Consistent reports so your team can decide faster and fairer."
          />
        </div>
      </div>

      {/* RIGHT 40% */}
      <div
        style={{
          flex: '0 0 40%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 32,
        }}
        className="login-right"
      >
        <div className="card" style={{ width: '100%', maxWidth: 400, padding: 32 }}>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em' }}>
            {isLogin ? 'Sign in to VyorAI' : 'Create your account'}
          </h2>
          <p style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
            {isLogin ? 'Welcome back. Please enter your details.' : 'Get started in under a minute.'}
          </p>

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
            {isLogin ? 'New to VyorAI? ' : 'Already have an account? '}
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
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: '#EEF2FF',
          color: '#4F46E5',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{title}</p>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>{body}</p>
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
