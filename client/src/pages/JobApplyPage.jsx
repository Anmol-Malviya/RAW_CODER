import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FileUp, ArrowLeft, CheckCircle2, Loader2, FileText, X } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import { generateMCQ } from '../services/api';
import api from '../services/api';

const parseError = (err) => {
  if (err.response?.data?.error) {
    if (typeof err.response.data.error === 'string') return err.response.data.error;
    return JSON.stringify(err.response.data.error);
  }
  return err.message;
};

const STEPS = [
  { id: 'parse', label: 'Parsing resume' },
  { id: 'generate', label: 'Generating questions' },
  { id: 'prepare', label: 'Preparing interview' },
];

export default function JobApplyPage() {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [activeStep, setActiveStep] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const navigate = useNavigate();
  const { dispatch } = useAssessment();

  useEffect(() => {
    const fetchJob = async () => {
      try {
        const response = await api.get(`/jobs/${jobId}`);
        setJob(response.data);
      } catch (err) {
        setError('Failed to load job details. It may have been removed.');
      } finally {
        setLoading(false);
      }
    };
    fetchJob();
  }, [jobId]);

  useEffect(() => {
    if (!generating) return;
    const timer = setInterval(() => {
      setActiveStep((s) => (s < STEPS.length - 1 ? s + 1 : s));
    }, 900);
    return () => clearInterval(timer);
  }, [generating]);

  const handleFile = (selected) => {
    if (selected && selected.type === 'application/pdf') {
      setFile(selected);
      setError('');
    } else {
      setError('Please upload a valid PDF file.');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please provide your resume to start the assessment.');
      return;
    }
    setGenerating(true);
    setActiveStep(0);
    setError('');

    try {
      const result = await generateMCQ(file, jobId);
      dispatch({
        type: 'INITIALIZE',
        payload: {
          sessionId: result.sessionId,
          questions: result.questions,
          rawQuestions: result._rawQuestions || [],
          jobRole: job?.title || 'Assessment',
        },
      });
      navigate('/assessment');
    } catch (err) {
      console.error('Generation error:', err);
      setError(parseError(err) || 'Failed to generate assessment. Please try again.');
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 600, margin: '0 auto' }}>
        <div className="skeleton" style={{ height: 40, marginBottom: 16, maxWidth: 300 }} />
        <div className="skeleton" style={{ height: 80, marginBottom: 24 }} />
        <div className="skeleton" style={{ height: 240 }} />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <button
        type="button"
        onClick={() => navigate('/candidate')}
        className="btn-ghost"
        style={{ marginBottom: 20, marginLeft: -12 }}
      >
        <ArrowLeft size={14} />
        Back to jobs
      </button>

      <h1 style={{ fontSize: 28, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
        Start your AI assessment
      </h1>
      <p style={{ marginTop: 8, fontSize: 14, color: '#64748B' }}>
        Upload your resume — VyorAI will analyze your experience and generate role-specific questions.
      </p>

      <div className="card" style={{ padding: 20, marginTop: 24, background: '#F8FAFC' }}>
        <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Role</p>
        <p style={{ marginTop: 4, fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{job?.title || 'Job role'}</p>
        <p style={{ marginTop: 6, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
          {job?.description}
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ marginTop: 24 }}>
        {/* Drop zone */}
        <label
          htmlFor="resume"
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 40,
            borderRadius: 12,
            border: `1px dashed ${dragOver ? '#6366F1' : file ? '#A5B4FC' : '#CBD5E1'}`,
            background: dragOver ? '#EEF2FF' : file ? '#FAFAFF' : '#FFFFFF',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textAlign: 'center',
          }}
        >
          <input
            type="file"
            id="resume"
            accept=".pdf"
            style={{ display: 'none' }}
            onChange={(e) => handleFile(e.target.files[0])}
          />
          <div style={{ width: 48, height: 48, borderRadius: 10, background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', marginBottom: 14 }}>
            <FileUp size={22} />
          </div>
          <p style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>
            {file ? 'Replace resume' : 'Drop your resume here'}
          </p>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
            PDF only, max 10MB — or <span style={{ color: '#4F46E5', fontWeight: 500 }}>click to browse</span>
          </p>
        </label>

        {file && (
          <div
            className="panel"
            style={{ padding: 14, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: '#ECFDF5', color: '#059669', display: 'grid', placeItems: 'center' }}>
                <FileText size={16} />
              </div>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{file.name}</p>
                <p style={{ fontSize: 12, color: '#64748B' }}>{(file.size / 1024).toFixed(0)} KB · ready</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setFile(null)}
              className="btn-ghost"
              style={{ padding: 8 }}
              aria-label="Remove file"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {error && (
          <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 8, background: '#FFF1F2', border: '1px solid #FECDD3', color: '#BE123C', fontSize: 13 }}>
            {error}
          </div>
        )}

        {generating && (
          <div className="card" style={{ padding: 20, marginTop: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#0F172A', marginBottom: 14 }}>Preparing your assessment</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {STEPS.map((step, idx) => {
                const done = idx < activeStep;
                const active = idx === activeStep;
                return (
                  <div key={step.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 999,
                        background: done ? '#10B981' : active ? '#EEF2FF' : '#F1F5F9',
                        color: done ? '#FFFFFF' : active ? '#6366F1' : '#94A3B8',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {done ? <CheckCircle2 size={12} /> : active ? <Loader2 size={12} className="spin" /> : <span style={{ fontSize: 10, fontWeight: 600 }}>{idx + 1}</span>}
                    </div>
                    <span style={{ fontSize: 13, color: done ? '#0F172A' : active ? '#0F172A' : '#94A3B8', fontWeight: active ? 600 : 500 }}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={!file || generating || !job}
          className="btn-primary"
          style={{ width: '100%', height: 44, marginTop: 20 }}
        >
          {generating ? 'Starting assessment…' : 'Start AI Assessment'}
        </button>
      </form>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}.spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
}
