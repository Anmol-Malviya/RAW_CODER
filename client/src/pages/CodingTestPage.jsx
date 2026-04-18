import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAssessment } from '../context/AssessmentContext';
import { Clock, Play, Send, FileCode2, Terminal } from 'lucide-react';

const LANGUAGES = ['JavaScript', 'TypeScript', 'Python', 'Java', 'Go'];

const DEFAULT_CODE = `// Implement the function below
function filterJobs(jobs, keyword) {
  // TODO: return jobs whose title, company, or location
  // contain the keyword (case-insensitive)
}
`;

export default function CodingTestPage() {
  const navigate = useNavigate();
  const { state } = useAssessment();
  const [language, setLanguage] = useState('JavaScript');
  const [code, setCode] = useState(DEFAULT_CODE);
  const [output, setOutput] = useState('');
  const [running, setRunning] = useState(false);
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const editorRef = useRef(null);

  useEffect(() => {
    if (state.status === 'idle') {
      navigate('/candidate');
    }
  }, [state.status, navigate]);

  useEffect(() => {
    const id = setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => clearInterval(id);
  }, []);

  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  const clock = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  const lowTime = timeLeft < 5 * 60;

  const handleRun = () => {
    setRunning(true);
    setOutput('Running test cases…');
    setTimeout(() => {
      setOutput('▶ Test 1: keyword="react" → passed\n▶ Test 2: keyword="Remote" → passed\n▶ Test 3: empty list → passed\n\n3/3 passed · 12ms');
      setRunning(false);
    }, 700);
  };

  const handleTabInEditor = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.target;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.slice(0, start) + '  ' + code.slice(end);
      setCode(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  };

  const handleSubmitResult = () => {
    navigate('/results');
  };

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto', padding: '24px' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Coding challenge</p>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.01em', marginTop: 2 }}>Build a job search filter</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 8, border: '1px solid #E2E8F0', background: '#FFFFFF' }}>
            <FileCode2 size={14} color="#64748B" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              style={{ border: 'none', outline: 'none', background: 'transparent', fontSize: 13, fontWeight: 500, color: '#0F172A', cursor: 'pointer' }}
            >
              {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
            </select>
          </div>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px',
              borderRadius: 8, border: `1px solid ${lowTime ? '#FECDD3' : '#E2E8F0'}`,
              background: lowTime ? '#FFF1F2' : '#FFFFFF',
              color: lowTime ? '#BE123C' : '#0F172A',
              fontFamily: 'ui-monospace, monospace', fontSize: 14, fontWeight: 600,
            }}
          >
            <Clock size={14} />
            {clock}
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 420px) 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left: Problem */}
        <section className="card" style={{ padding: 24, position: 'sticky', top: 80 }}>
          <span className="status-pill pill-indigo">Medium · Arrays</span>

          <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', marginTop: 14, letterSpacing: '-0.01em' }}>
            Job Search Filter
          </h2>

          <div style={{ marginTop: 16 }}>
            <SectionLabel>Description</SectionLabel>
            <p style={{ fontSize: 13, color: '#475569', lineHeight: 1.7, marginTop: 6 }}>
              Implement a function <Code>filterJobs(jobs, keyword)</Code> that returns jobs whose title, company, or location contain the given keyword (case-insensitive). The input order must be preserved.
            </p>
          </div>

          <div style={{ marginTop: 16 }}>
            <SectionLabel>Constraints</SectionLabel>
            <ul style={{ marginTop: 6, paddingLeft: 16, fontSize: 13, color: '#475569', lineHeight: 1.8 }}>
              <li>1 ≤ jobs.length ≤ 10<sup>5</sup></li>
              <li>Expected runtime: O(n)</li>
              <li>Return an array of matches</li>
            </ul>
          </div>

          <div style={{ marginTop: 16 }}>
            <SectionLabel>Example</SectionLabel>
            <pre style={{ marginTop: 6, padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #E2E8F0', fontSize: 12, color: '#334155', lineHeight: 1.6, overflow: 'auto' }}>
{`Input:
jobs = [
  { title: "Frontend Engineer", company: "AI Interviewer", location: "Remote" },
  { title: "Data Analyst", company: "Stripe", location: "NYC" }
]
keyword = "remote"

Output:
[{ title: "Frontend Engineer", ... }]`}
            </pre>
          </div>
        </section>

        {/* Right: Editor + output */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid #0F172A', background: '#0B1120' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: '#0F172A', borderBottom: '1px solid #1E293B' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Dot color="#EF4444" />
                  <Dot color="#F59E0B" />
                  <Dot color="#10B981" />
                </div>
                <span style={{ fontSize: 12, color: '#64748B', fontFamily: 'ui-monospace, monospace' }}>
                  solution.{language === 'Python' ? 'py' : language === 'TypeScript' ? 'ts' : language === 'Java' ? 'java' : language === 'Go' ? 'go' : 'js'}
                </span>
              </div>
              <span style={{ fontSize: 11, color: '#64748B' }}>{language}</span>
            </div>
            <textarea
              ref={editorRef}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              onKeyDown={handleTabInEditor}
              spellCheck={false}
              className="editor-textarea"
              style={{ minHeight: 420, border: 'none', borderRadius: 0, background: '#0B1120', color: '#E2E8F0', padding: '16px', width: '100%', fontFamily: 'ui-monospace, monospace', outline: 'none', resize: 'none' }}
            />
          </div>

          {/* Output */}
          <div className="card" style={{ padding: 16, background: '#FFFFFF' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Terminal size={14} color="#64748B" />
              <span style={{ fontSize: 12, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Output</span>
            </div>
            <pre style={{ fontFamily: 'ui-monospace, monospace', fontSize: 12, color: output ? '#0F172A' : '#94A3B8', lineHeight: 1.6, whiteSpace: 'pre-wrap', minHeight: 60 }}>
              {output || 'Run your code to see the output here…'}
            </pre>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button className="btn-secondary" style={{ padding: '10px 20px' }} onClick={handleRun} disabled={running}>
              <Play size={14} />
              {running ? 'Running…' : 'Run'}
            </button>
            <button 
              className="btn-primary" 
              style={{ padding: '10px 20px' }}
              onClick={handleSubmitResult}
            >
              <Send size={14} />
              Submit solution
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{children}</p>
  );
}

function Code({ children }) {
  return (
    <code style={{ padding: '1px 6px', borderRadius: 4, background: '#F1F5F9', color: '#4338CA', fontSize: 12, fontFamily: 'ui-monospace, monospace' }}>
      {children}
    </code>
  );
}

function Dot({ color }) {
  return <div style={{ width: 10, height: 10, borderRadius: 999, background: color }} />;
}
