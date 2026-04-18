import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Video, Monitor, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, X, Loader2, RefreshCw, Info } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

/* ─── Keyframe animations (injected once) ─── */
const STYLE_ID = 'system-check-anims';
if (typeof document !== 'undefined' && !document.getElementById(STYLE_ID)) {
  const style = document.createElement('style');
  style.id = STYLE_ID;
  style.textContent = `
    @keyframes sc-fade-in {
      from { opacity: 0; transform: translateY(16px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes sc-spin {
      to { transform: rotate(360deg); }
    }
    @keyframes sc-check-pop {
      0%   { transform: scale(0); opacity: 0; }
      60%  { transform: scale(1.15); }
      100% { transform: scale(1); opacity: 1; }
    }
    @keyframes sc-dot-pulse {
      0%, 100% { opacity: 0.3; }
      50%      { opacity: 1; }
    }
    @keyframes sc-shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
    @keyframes sc-pulse-soft {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99,102,241,0.15); }
      50%      { box-shadow: 0 0 0 8px rgba(99,102,241,0); }
    }
  `;
  document.head.appendChild(style);
}

export default function SystemCheckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAssessment();
  const [checks, setChecks] = useState({
    camera: { status: 'pending', label: 'Camera access' },
    mic:    { status: 'pending', label: 'Microphone access' },
    screen: { status: 'pending', label: 'Screen sharing' }
  });
  const [stream, setStream] = useState(null);
  const videoRef = useRef(null);
  
  const jobData = location.state?.jobData;

  useEffect(() => {
    if (!jobData) {
      navigate('/');
    }
  }, [jobData, navigate]);

  const checkCameraMic = async () => {
    try {
      setChecks(prev => ({ 
        ...prev, 
        camera: { ...prev.camera, status: 'checking' },
        mic: { ...prev.mic, status: 'checking' }
      }));
      
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setStream(mediaStream);
      if (videoRef.current) videoRef.current.srcObject = mediaStream;
      
      setChecks(prev => ({ 
        ...prev, 
        camera: { ...prev.camera, status: 'success' },
        mic: { ...prev.mic, status: 'success' }
      }));
    } catch (err) {
      setChecks(prev => ({ 
        ...prev, 
        camera: { ...prev.camera, status: 'error' },
        mic: { ...prev.mic, status: 'error' }
      }));
    }
  };

  const checkScreen = async () => {
    try {
      setChecks(prev => ({ ...prev, screen: { ...prev.screen, status: 'checking' } }));
      await navigator.mediaDevices.getDisplayMedia({ video: true });
      setChecks(prev => ({ ...prev, screen: { ...prev.screen, status: 'success' } }));
    } catch (err) {
      setChecks(prev => ({ ...prev, screen: { ...prev.screen, status: 'error' } }));
    }
  };

  const allPassed = Object.values(checks).every(c => c.status === 'success');
  const passedCount = Object.values(checks).filter(c => c.status === 'success').length;

  const handleProceed = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate(`/apply/${jobData._id}`, { state: { jobData } });
  };

  return (
    <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 20px' }}>

      {/* ─── Header ─── */}
      <div style={{
        textAlign: 'center',
        marginBottom: 36, marginTop: 16,
        animation: 'sc-fade-in 0.5s ease-out',
      }}>
        {/* Shield icon */}
        <div style={{
          width: 60, height: 60, borderRadius: 18,
          background: '#EEF2FF',
          display: 'grid', placeItems: 'center',
          margin: '0 auto 20px',
          animation: 'sc-pulse-soft 2.5s ease-in-out infinite',
        }}>
          <ShieldCheck size={28} color="#6366F1" />
        </div>

        <h1 style={{
          fontSize: 32, fontWeight: 800,
          color: '#1A1A1A',
          letterSpacing: '-0.03em',
          marginBottom: 10,
        }}>
          Mandatory System Checks
        </h1>

        <p style={{
          fontSize: 15, fontWeight: 500,
          color: '#64748B',
          lineHeight: 1.6,
          maxWidth: 500, margin: '0 auto',
        }}>
          To ensure a fair and secure interview experience, we need to verify your hardware and permissions.
        </p>

        {/* Step pill + progress */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 12,
          marginTop: 20,
        }}>
          <span style={{
            padding: '6px 16px',
            background: '#F1F5F9',
            borderRadius: 999,
            fontSize: 12, fontWeight: 700,
            color: '#64748B',
            letterSpacing: '0.02em',
          }}>
            Step 1 of 2
          </span>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 28, height: 4, borderRadius: 999,
                background: i < passedCount ? '#6366F1' : '#E2E8F0',
                transition: 'background 0.4s ease',
              }} />
            ))}
            <span style={{
              fontSize: 12, fontWeight: 700,
              color: passedCount === 3 ? '#10B981' : '#94A3B8',
              marginLeft: 4,
            }}>
              {passedCount}/3
            </span>
          </div>
        </div>
      </div>

      {/* ─── Main Card ─── */}
      <div style={{
        background: '#FFFFFF',
        borderRadius: 28,
        border: '1px solid #F1F5F9',
        boxShadow: '0 4px 24px rgba(0,0,0,0.03)',
        overflow: 'hidden',
        animation: 'sc-fade-in 0.6s ease-out 0.1s both',
      }}>
        <div style={{ padding: '36px 40px 32px' }}>

          {/* Two column grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 32,
          }}>

            {/* Left: Permission checks */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <p style={{
                fontSize: 11, fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}>
                Device Permissions
              </p>

              <CheckItem 
                icon={<Video size={20} />} 
                check={checks.camera} 
                onRetry={checkCameraMic}
                delay={0}
              />
              <CheckItem 
                icon={<Mic size={20} />} 
                check={checks.mic} 
                onRetry={checkCameraMic}
                delay={80}
              />
              <CheckItem 
                icon={<Monitor size={20} />} 
                check={checks.screen} 
                onRetry={checkScreen}
                delay={160}
              />
            </div>

            {/* Right: Video preview */}
            <div>
              <p style={{
                fontSize: 11, fontWeight: 700,
                color: '#94A3B8',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 8,
              }}>
                Camera Preview
              </p>

              <div style={{
                position: 'relative',
                borderRadius: 20,
                overflow: 'hidden',
                aspectRatio: '16 / 9',
                background: '#0F172A',
                border: checks.camera.status === 'success'
                  ? '2px solid #6366F1'
                  : '1px solid #E2E8F0',
                transition: 'border 0.3s ease',
              }}>
                <video
                  ref={videoRef}
                  autoPlay muted playsInline
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />

                {/* PREVIEW badge */}
                <div style={{
                  position: 'absolute', top: 10, left: 10,
                  padding: '4px 10px',
                  borderRadius: 6,
                  background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(6px)',
                  fontSize: 10, fontWeight: 700,
                  color: 'rgba(255,255,255,0.8)',
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <div style={{
                    width: 5, height: 5, borderRadius: '50%',
                    background: checks.camera.status === 'success' ? '#10B981' : '#94A3B8',
                    boxShadow: checks.camera.status === 'success'
                      ? '0 0 6px rgba(16, 185, 129, 0.6)'
                      : 'none',
                  }} />
                  PREVIEW
                </div>

                {/* Placeholder when no camera */}
                {checks.camera.status !== 'success' && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    gap: 12,
                    background: '#0F172A',
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: 16,
                      background: 'rgba(255,255,255,0.06)',
                      display: 'grid', placeItems: 'center',
                    }}>
                      <Video size={26} style={{ color: 'rgba(255,255,255,0.2)' }} />
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: 'rgba(255,255,255,0.3)',
                      letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                    }}>
                      Awaiting Permission
                    </span>
                  </div>
                )}
              </div>

              {/* Privacy note */}
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 8,
                marginTop: 12,
                padding: '10px 14px',
                background: '#F8FAFC',
                borderRadius: 12,
              }}>
                <Info size={14} color="#94A3B8" style={{ marginTop: 1, flexShrink: 0 }} />
                <p style={{
                  fontSize: 12, color: '#94A3B8',
                  lineHeight: 1.5, margin: 0, fontWeight: 500,
                }}>
                  Your camera feed is only used for identity verification and is not recorded during this step.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Footer ─── */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          borderTop: '1px solid #F1F5F9',
          background: '#FAFBFC',
        }}>
          <button 
            onClick={() => navigate('/')}
            style={{
              background: 'none', border: 'none',
              color: '#64748B',
              fontWeight: 600, fontSize: 14,
              cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 4px',
              borderRadius: 8,
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#1A1A1A'}
            onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
          >
            Cancel
          </button>

          <button 
            disabled={!allPassed}
            onClick={handleProceed}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '14px 28px',
              borderRadius: 14,
              fontWeight: 800, fontSize: 14,
              border: 'none',
              cursor: allPassed ? 'pointer' : 'not-allowed',
              letterSpacing: '-0.01em',
              background: allPassed
                ? 'linear-gradient(135deg, #6366F1, #4F46E5)'
                : '#E2E8F0',
              color: allPassed ? '#FFFFFF' : '#94A3B8',
              boxShadow: allPassed
                ? '0 20px 40px -12px rgba(99, 102, 241, 0.35)'
                : 'none',
              transition: 'all 0.3s ease',
            }}
            onMouseEnter={e => {
              if (allPassed) {
                e.currentTarget.style.transform = 'translateY(-1px)';
                e.currentTarget.style.boxShadow = '0 24px 48px -12px rgba(99, 102, 241, 0.45)';
              }
            }}
            onMouseLeave={e => {
              if (allPassed) {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 20px 40px -12px rgba(99, 102, 241, 0.35)';
              }
            }}
          >
            Proceed to Resume Upload <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* ─── Troubleshoot tip ─── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        justifyContent: 'center',
        marginTop: 28,
        padding: '14px 24px',
        background: '#EEF2FF',
        borderRadius: 16,
        animation: 'sc-fade-in 0.6s ease-out 0.3s both',
      }}>
        <Info size={16} color="#6366F1" />
        <p style={{ fontSize: 13, color: '#4338CA', fontWeight: 600, margin: 0 }}>
          Having trouble?{' '}
          <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Check our troubleshooting guide</span>
          {' '}or ensure your browser has permission to access your devices.
        </p>
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════
   CheckItem — permission row (light theme)
   ══════════════════════════════════════════════ */
function CheckItem({ icon, check, onRetry, delay = 0 }) {
  const isPending  = check.status === 'pending';
  const isChecking = check.status === 'checking';
  const isSuccess  = check.status === 'success';
  const isError    = check.status === 'error';
  const [hovered, setHovered] = useState(false);

  /* Status-based styles */
  const iconBg = isSuccess ? '#ECFDF5' : isError ? '#FEF2F2' : isChecking ? '#FFFBEB' : '#F8FAFC';
  const iconColor = isSuccess ? '#10B981' : isError ? '#EF4444' : isChecking ? '#F59E0B' : '#94A3B8';
  const statusColor = isSuccess ? '#10B981' : isError ? '#EF4444' : isChecking ? '#F59E0B' : '#94A3B8';

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ 
        padding: '14px 16px', 
        borderRadius: 16,
        background: hovered ? '#F8FAFC' : 'transparent',
        border: isSuccess ? '1px solid #D1FAE5' : isError ? '1px solid #FECDD3' : '1px solid transparent',
        display: 'flex', 
        alignItems: 'center', 
        gap: 14,
        transition: 'all 0.25s ease',
        animation: `sc-fade-in 0.4s ease-out ${delay}ms both`,
        cursor: isPending || isError ? 'pointer' : 'default',
      }}
      onClick={() => {
        if (isPending || isError) onRetry?.();
      }}
    >
      {/* Icon */}
      <div style={{ 
        width: 44, height: 44,
        borderRadius: 14,
        background: iconBg,
        color: iconColor,
        display: 'grid', placeItems: 'center',
        transition: 'all 0.3s',
        flexShrink: 0,
      }}>
        {icon}
      </div>

      {/* Label + status */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0, fontSize: 15, fontWeight: 800,
          color: '#1A1A1A',
        }}>{check.label}</p>
        <p style={{
          margin: 0, fontSize: 12, marginTop: 3,
          fontWeight: 600,
          color: statusColor,
          display: 'flex', alignItems: 'center', gap: 5,
        }}>
          {isChecking && (
            <span style={{ display: 'inline-flex', gap: 3 }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{
                  width: 4, height: 4, borderRadius: '50%',
                  background: '#F59E0B',
                  animation: `sc-dot-pulse 1s ease-in-out ${i * 0.2}s infinite`,
                }} />
              ))}
            </span>
          )}
          {isSuccess ? 'Granted' : isError ? 'Access denied' : isChecking ? 'Checking' : 'Not checked'}
        </p>
      </div>

      {/* Action / Status indicator */}
      {isSuccess ? (
        <div style={{ animation: 'sc-check-pop 0.4s ease-out' }}>
          <CheckCircle size={22} color="#10B981" />
        </div>
      ) : isError ? (
        <button 
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECDD3',
            borderRadius: 10,
            padding: '6px 14px',
            fontSize: 12, fontWeight: 700,
            color: '#EF4444',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 5,
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#FEE2E2'}
          onMouseLeave={e => e.currentTarget.style.background = '#FEF2F2'}
        >
          <RefreshCw size={13} />
          Retry
        </button>
      ) : isChecking ? (
        <Loader2 size={20} color="#F59E0B" style={{ animation: 'sc-spin 1s linear infinite' }} />
      ) : (
        <button 
          onClick={(e) => { e.stopPropagation(); onRetry(); }}
          style={{ 
            padding: '8px 18px', 
            borderRadius: 10,
            background: '#F1F5F9',
            border: 'none',
            fontSize: 13, fontWeight: 700,
            color: '#6366F1',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = '#EEF2FF';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.08)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = '#F1F5F9';
            e.currentTarget.style.boxShadow = 'none';
          }}
        >
          Allow
        </button>
      )}
    </div>
  );
}
