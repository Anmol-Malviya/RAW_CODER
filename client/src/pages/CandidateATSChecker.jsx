import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Upload, Sparkles, AlertCircle, CheckCircle2, Search, Zap, Target, BarChart, ChevronRight } from 'lucide-react';

export default function CandidateATSChecker() {
  const [file, setFile] = useState(null);
  const [targetRole, setTargetRole] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (f && f.type === 'application/pdf') {
      setFile(f);
    } else {
      alert('Please upload a PDF file.');
    }
  };

  const startAnalysis = async () => {
    if (!file || !targetRole) return;
    setAnalyzing(true);
    setResult(null);

    // Simulated AI Analysis
    await new Promise(r => setTimeout(r, 2500));

    const mockScore = Math.floor(Math.random() * 20) + 65; // 65-85
    const mockSuggestions = [
      'Add more action verbs like "Spearheaded" and "Architected"',
      `Include more keywords related to ${targetRole}`,
      'Quantify your achievements with percentages and metrics',
      'Optimize the header for better extraction'
    ];

    setResult({
      score: mockScore,
      matchGrade: mockScore > 80 ? 'Excellent' : mockScore > 70 ? 'Good' : 'Average',
      matchingKeywords: ['Real-time Architecture', 'API Integration', 'Cloud Native', 'Team Leadership'],
      missingKeywords: ['CI/CD Optimization', 'Unit Testing', 'Security Protocols'],
      suggestions: mockSuggestions,
    });
    setAnalyzing(false);
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', paddingBottom: 60 }}>
      {/* Header section */}
      <div style={{ marginBottom: 40, textAlign: 'center' }}>
        <h1 style={{ fontSize: 32, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.02em', marginBottom: 12 }}>
          ATS Resume <span className="gradient-text">Score Checker</span>
        </h1>
        <p style={{ color: '#64748B', maxWidth: 600, margin: '0 auto', fontSize: 16 }}>
          AI-powered analysis to see how well your resume matches target job descriptions and passes through automated tracking systems.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 400px) 1fr', gap: 32, alignItems: 'start' }}>
        {/* Left: Input Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24, borderRadius: 24 }}>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Target Job Role</label>
              <div style={{ position: 'relative' }}>
                <Target size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input 
                  type="text" 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  placeholder="e.g. Senior Frontend Engineer" 
                  className="base-input"
                  style={{ paddingLeft: 40, border: '1px solid #E2E8F0', borderRadius: 12 }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#475569', textTransform: 'uppercase', marginBottom: 8 }}>Upload Resume (PDF)</label>
              <div 
                onClick={() => fileInputRef.current.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const f = e.dataTransfer.files[0];
                  if (f && f.type === 'application/pdf') setFile(f);
                }}
                style={{ 
                  border: `2px dashed ${dragOver ? '#6366F1' : file ? '#10B981' : '#CBD5E1'}`, 
                  background: dragOver ? '#F5F3FF' : file ? '#F0FDF4' : '#F8FAFC',
                  borderRadius: 16, padding: '32px 16px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s'
                }}
              >
                <input ref={fileInputRef} type="file" hidden accept=".pdf" onChange={handleFileChange} />
                {file ? (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ background: '#10B981', color: 'white', padding: 8, borderRadius: 12 }}>
                      <CheckCircle2 size={24} />
                    </div>
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: '#065F46' }}>{file.name}</p>
                      <button onClick={(e) => { e.stopPropagation(); setFile(null); }} style={{ fontSize: 11, color: '#D97706', fontWeight: 600, background: 'none', border: 'none', marginTop: 4 }}>Change file</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
                    <Upload size={32} color={dragOver ? '#6366F1' : '#94A3B8'} />
                    <p style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>
                      <span style={{ color: '#4F46E5', fontWeight: 700 }}>Choose a file</span> or drag and drop
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button 
              disabled={!file || !targetRole || analyzing}
              onClick={startAnalysis}
              className="btn-primary" 
              style={{ width: '100%', height: 48, borderRadius: 14, boxShadow: '0 8px 16px rgba(79, 70, 229, 0.2)' }}
            >
              {analyzing ? 'AI Analyzing...' : (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                  Analyze Resume <Sparkles size={16} />
                </span>
              )}
            </button>
          </div>

          <div className="card" style={{ padding: 20, background: '#EEF2FF', border: '1px solid #E0E7FF' }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: '#4338CA', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertCircle size={16} /> Why use ATS Checker?
            </h3>
            <ul style={{ fontSize: 12, color: '#64748B', display: 'flex', flexDirection: 'column', gap: 8, padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'flex', gap: 6 }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366F1', marginTop: 6 }} /> 75% of resumes are rejected by bots before human review.</li>
              <li style={{ display: 'flex', gap: 6 }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366F1', marginTop: 6 }} /> Ensure your skills map correctly to job descriptions.</li>
              <li style={{ display: 'flex', gap: 6 }}><div style={{ width: 4, height: 4, borderRadius: '50%', background: '#6366F1', marginTop: 6 }} /> Optimize keyword density for maximum reach.</li>
            </ul>
          </div>
        </div>

        {/* Right: Results Panel */}
        <div style={{ minHeight: 400 }}>
          <AnimatePresence mode="wait">
            {!analyzing && !result && (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', border: '2px dashed #E2E8F0', borderRadius: 24, padding: 40 }}
              >
                <div style={{ width: 80, height: 80, background: '#F8FAFC', borderRadius: 30, display: 'grid', placeItems: 'center', marginBottom: 20 }}>
                  <Search size={32} color="#94A3B8" />
                </div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: '#475569' }}>Analysis Results Will Appear Here</h2>
                <p style={{ color: '#94A3B8', fontSize: 14, marginTop: 8, maxWidth: 300 }}>Upload your resume and enter a job role to see your potential match score.</p>
              </motion.div>
            )}

            {analyzing && (
              <motion.div 
                key="loading" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
              >
                <div className="processing-blob" style={{ position: 'relative', marginBottom: 32 }}>
                   <div style={{ width: 120, height: 120, borderRadius: '50%', border: '4px solid #F1F5F9', borderTopColor: '#6366F1', animation: 'spin 2s linear infinite' }} />
                   <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center' }}>
                     <Zap size={32} className="pulse" color="#6366F1" />
                   </div>
                </div>
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#0F172A' }}>Scanning Resume Content...</h2>
                <p style={{ color: '#6366F1', fontWeight: 700, marginTop: 8, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: 12 }}>Artificial Intelligence Processing</p>
              </motion.div>
            )}

            {result && !analyzing && (
              <motion.div key="result" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="card" style={{ padding: 40, borderRadius: 24, border: 'none', boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.08)' }}>
                  
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 40 }}>
                    <div>
                      <p style={{ fontSize: 14, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Fit Score</p>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 4 }}>
                        <span style={{ fontSize: 64, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.04em' }}>{result.score}</span>
                        <span style={{ fontSize: 24, fontWeight: 700, color: '#94A3B8' }}>/ 100</span>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                       <span style={{ 
                         padding: '10px 20px', borderRadius: 99, 
                         background: result.score > 80 ? '#ECFDF5' : '#FFFBEB', 
                         color: result.score > 80 ? '#047857' : '#B45309', 
                         fontWeight: 800, fontSize: 14, border: '1px solid currentColor' 
                       }}>
                         Grade: {result.matchGrade}
                       </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 40 }}>
                    <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                         <CheckCircle2 size={16} color="#10B981" /> Keywords Found
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {result.matchingKeywords.map(k => (
                          <span key={k} style={{ padding: '6px 14px', background: '#FFFFFF', color: '#334155', borderRadius: 10, fontSize: 12, fontWeight: 600, border: '1px solid #E2E8F0' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                    <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 20 }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                         <AlertCircle size={16} color="#F43F5E" /> Missing Keywords
                      </h4>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {result.missingKeywords.map(k => (
                          <span key={k} style={{ padding: '6px 14px', background: '#FFF1F2', color: '#E11D48', borderRadius: 10, fontSize: 12, fontWeight: 600, border: '1px solid #FECDD3' }}>{k}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                     <h4 style={{ fontSize: 13, fontWeight: 700, color: '#475569', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <BarChart size={16} color="#6366F1" /> AI Improvement Suggestions
                     </h4>
                     <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {result.suggestions.map((s, i) => (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: '#F1F5F9', borderRadius: 14, borderLeft: '4px solid #6366F1' }}>
                            <ChevronRight size={14} color="#6366F1" />
                            <p style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{s}</p>
                          </div>
                        ))}
                     </div>
                  </div>

                  <button 
                    onClick={() => { setResult(null); setFile(null); setTargetRole(''); }}
                    className="btn-ghost" 
                    style={{ width: '100%', marginTop: 32, height: 44, color: '#64748B' }}
                  >
                    Start New Analysis
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
