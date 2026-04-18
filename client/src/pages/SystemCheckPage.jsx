import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Mic, Video, Monitor, CheckCircle, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';

export default function SystemCheckPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAssessment();
  const [checks, setChecks] = useState({
    camera: { status: 'pending', label: 'Camera access' },
    mic: { status: 'pending', label: 'Microphone access' },
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

  const handleProceed = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate(`/apply/${jobData._id}`, { state: { jobData } });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full border border-slate-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Mandatory System Checks</h1>
        </div>
        
        <p style={{ color: '#475569', marginBottom: 32, fontSize: 16 }}>
          To ensure a fair and secure interview experience, we need to verify your hardware and permissions.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 32, marginBottom: 32 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <CheckItem 
              icon={<Video size={20} />} 
              check={checks.camera} 
              onRetry={checkCameraMic} 
            />
            <CheckItem 
              icon={<Mic size={20} />} 
              check={checks.mic} 
              onRetry={checkCameraMic} 
            />
            <CheckItem 
              icon={<Monitor size={20} />} 
              check={checks.screen} 
              onRetry={checkScreen} 
            />
          </div>

          <div style={{ backgroundColor: '#0f172a', borderRadius: 12, overflow: 'hidden', position: 'relative', aspectRatio: '16/9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 8, left: 8, padding: '4px 8px', backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', borderRadius: 4, fontSize: 10, color: 'white', fontWeight: 700 }}>
              PREVIEW
            </div>
            {checks.camera.status !== 'success' && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1e293b', color: '#94a3b8' }}>
                <Video size={48} style={{ opacity: 0.2 }} />
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, borderTop: '1px solid #e2e8f0' }}>
          <button 
            onClick={() => navigate('/')}
            style={{ color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 15 }}
          >
            Cancel
          </button>
          <button 
            disabled={!allPassed}
            onClick={handleProceed}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 8, fontWeight: 700, border: 'none',
              cursor: allPassed ? 'pointer' : 'not-allowed',
              backgroundColor: allPassed ? '#4f46e5' : '#e2e8f0',
              color: allPassed ? 'white' : '#94a3b8',
              boxShadow: allPassed ? '0 4px 12px rgba(79, 70, 229, 0.3)' : 'none',
              transition: 'all 0.2s'
            }}
          >
            Proceed to Resume Upload <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}

function CheckItem({ icon, check, onRetry }) {
  const isPending = check.status === 'pending';
  const isChecking = check.status === 'checking';
  const isSuccess = check.status === 'success';
  const isError = check.status === 'error';

  return (
    <div style={{ 
      padding: 16, 
      borderRadius: 12, 
      border: `1px solid ${isSuccess ? '#a7f3d0' : isError ? '#fecdd3' : '#e2e8f0'}`,
      backgroundColor: isSuccess ? '#ecfdf5' : isError ? '#fff1f2' : '#f8fafc',
      display: 'flex', 
      alignItems: 'center', 
      gap: 16,
      transition: 'all 0.2s'
    }}>
      <div style={{ 
        padding: 8, 
        borderRadius: 8, 
        backgroundColor: isSuccess ? '#d1fae5' : isError ? '#ffe4e6' : '#e2e8f0',
        color: isSuccess ? '#059669' : isError ? '#e11d48' : '#64748b',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        {icon}
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: '#0f172a' }}>{check.label}</p>
        <p style={{ margin: 0, fontSize: 12, marginTop: 4, color: isSuccess ? '#047857' : isError ? '#be123c' : '#64748b' }}>
          {isSuccess ? 'Permission granted' : isError ? 'Access denied' : isChecking ? 'Checking...' : 'Not checked'}
        </p>
      </div>
      {isSuccess ? (
        <CheckCircle size={20} color="#10b981" />
      ) : isError ? (
        <button onClick={onRetry} style={{ background: 'none', border: 'none', padding: 4, borderRadius: 4, color: '#e11d48', cursor: 'pointer' }}>
          <AlertCircle size={20} />
        </button>
      ) : (
        <button 
          onClick={onRetry} 
          disabled={isChecking}
          style={{ 
            padding: '6px 12px', 
            backgroundColor: 'white', 
            border: '1px solid #cbd5e1', 
            borderRadius: 6, 
            fontSize: 12, 
            fontWeight: 700, 
            color: '#334155', 
            cursor: isChecking ? 'not-allowed' : 'pointer',
            opacity: isChecking ? 0.5 : 1
          }}
        >
          {isChecking ? '...' : 'Allow'}
        </button>
      )}
    </div>
  );
}
