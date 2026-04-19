import React, { useState } from 'react';
import {
  HelpCircle, Mail, MessageSquare, ChevronDown, ChevronUp,
  Send, CheckCircle, Zap, Shield, Mic, Camera, Code2,
  FileText, AlertCircle, Clock, BookOpen, ExternalLink,
  Search, ArrowRight, Star, Wifi, MonitorSmartphone
} from 'lucide-react';

const faqs = [
  {
    category: 'Interview Process',
    icon: <Mic size={16} />,
    color: '#6366F1',
    bg: '#EEF2FF',
    items: [
      {
        question: 'What is the difference between Voice Interview and MCQ mode?',
        answer: 'Voice Interview uses an AI that speaks questions aloud and listens to your verbal responses — it\'s like a real phone screen. MCQ mode presents written multiple-choice questions with a time limit per question. You can choose your preferred mode when applying to any role.'
      },
      {
        question: 'What happens if my internet disconnects during the interview?',
        answer: 'Your progress is saved locally in real-time. If disconnected, reconnect within 5 minutes — the timer pauses briefly for minor disruptions. Excessive disconnections are logged and may be flagged for recruiter review. We recommend using a stable wired or 4G+ connection.'
      },
      {
        question: 'Can I pause and resume my interview?',
        answer: 'MCQ interviews cannot be paused once started, as the timer runs continuously per question. Voice interviews allow brief pauses between questions. We recommend completing the assessment in one uninterrupted sitting.'
      },
      {
        question: 'How long does each assessment take?',
        answer: 'Most assessments are designed to take 10–15 minutes for MCQ rounds and 15–25 minutes for full AI voice interviews. Coding rounds add an additional 20–30 minutes depending on the problem complexity.'
      }
    ]
  },
  {
    category: 'Proctoring & Privacy',
    icon: <Shield size={16} />,
    color: '#10B981',
    bg: '#ECFDF5',
    items: [
      {
        question: 'How is my screen and camera recording used?',
        answer: 'Recordings are strictly used for evaluation and integrity verification. They are shared only with the hiring team for the specific role you applied for, and are retained for 30 days post-assessment. No recording is ever used for advertising or third-party purposes.'
      },
      {
        question: 'What triggers a proctoring warning?',
        answer: 'The system detects: (1) switching browser tabs or minimizing the window, (2) multiple faces in camera view, (3) mobile phones or books detected in frame, (4) significant absence from camera. Each event is logged with a timestamp and surfaced to recruiters.'
      },
      {
        question: 'Can I cover or disable my webcam?',
        answer: 'No. Active camera feed is required throughout the interview for integrity purposes. If your camera is blocked or not granted permission, the session will not start. Ensure your browser has camera access before beginning.'
      }
    ]
  },
  {
    category: 'Technical Setup',
    icon: <MonitorSmartphone size={16} />,
    color: '#F59E0B',
    bg: '#FFFBEB',
    items: [
      {
        question: 'What browser and device should I use?',
        answer: 'Use Google Chrome (v110+) or Microsoft Edge on a desktop or laptop for the best experience. Firefox and Safari have limited support for the voice interview features. Mobile browsers are not officially supported for live assessment sessions.'
      },
      {
        question: 'Camera or microphone permission is being denied — how do I fix it?',
        answer: 'Click the camera icon in your browser\'s address bar → Allow microphone and camera. On Chrome: Settings → Privacy and Security → Site Settings → Camera/Microphone → Allow for localhost or the interview URL. Restart the browser after changing permissions.'
      },
      {
        question: 'Can I use external tools or IDEs during the coding round?',
        answer: 'No. The platform includes a built-in code editor. Navigating to external tabs or applications triggers a tab-switch warning. All code must be written within the platform editor. Console logs and test cases are run in a sandboxed environment.'
      }
    ]
  },
  {
    category: 'Results & Reports',
    icon: <FileText size={16} />,
    color: '#8B5CF6',
    bg: '#F5F3FF',
    items: [
      {
        question: 'When will I receive my results?',
        answer: 'AI scoring happens instantly upon submission — you can view your score in "My Reports" within seconds. The hiring team\'s decision and timeline depends on the recruiter. Official results and next steps are communicated by the company.'
      },
      {
        question: 'How do I download my assessment certificate?',
        answer: 'Go to Candidate Dashboard → My Reports → Click on any completed session → Click "Download PDF Report". The certificate includes your score breakdown, per-question analysis, and an official verification stamp.'
      },
      {
        question: 'Can I retake an interview?',
        answer: 'Retake eligibility is determined by the recruiter on a per-role basis. If retakes are enabled, you\'ll see a "Retake Assessment" button on your report page. Practice sessions under "Practice Area" are always unlimited.'
      }
    ]
  }
];

const quickActions = [
  {
    icon: <Zap size={20} />,
    color: '#F59E0B',
    bg: '#FFFBEB',
    title: 'System Check',
    desc: 'Test camera, mic & browser compatibility before your interview',
    action: '/check',
    label: 'Run Check'
  },
  {
    icon: <BookOpen size={20} />,
    color: '#6366F1',
    bg: '#EEF2FF',
    title: 'Practice Mode',
    desc: 'Do unlimited AI-driven mock interviews to prepare',
    action: '/candidate/practice',
    label: 'Start Practice'
  },
  {
    icon: <FileText size={20} />,
    color: '#10B981',
    bg: '#ECFDF5',
    title: 'ATS Checker',
    desc: 'Score your resume against ATS filters before applying',
    action: '/candidate/ats',
    label: 'Check Resume'
  }
];

export default function CandidateSupport() {
  const [openFaq, setOpenFaq] = useState({ catIdx: null, itemIdx: null });
  const [formData, setFormData] = useState({ category: '', subject: '', message: '' });
  const [status, setStatus] = useState('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(null);

  const toggleFaq = (catIdx, itemIdx) => {
    if (openFaq.catIdx === catIdx && openFaq.itemIdx === itemIdx) {
      setOpenFaq({ catIdx: null, itemIdx: null });
    } else {
      setOpenFaq({ catIdx, itemIdx });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    setTimeout(() => {
      setStatus('sent');
      setFormData({ category: '', subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 5000);
    }, 1500);
  };

  const filteredFaqs = faqs.map(cat => ({
    ...cat,
    items: cat.items.filter(
      faq =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0);

  const displayFaqs = searchQuery ? filteredFaqs : (activeCategory !== null ? [faqs[activeCategory]] : faqs);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 0 40px' }}>

      {/* ─── Hero Header ─── */}
      <div style={{
        background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 60%, #818CF8 100%)',
        borderRadius: 28, padding: '40px 48px', marginBottom: 40,
        position: 'relative', overflow: 'hidden', color: 'white'
      }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -40, left: 120, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)' }}>
              <HelpCircle size={26} />
            </div>
            <div>
              <h1 style={{ fontSize: 28, fontWeight: 900, letterSpacing: '-0.02em', margin: 0 }}>Help & Support Center</h1>
              <p style={{ margin: '4px 0 0', opacity: 0.85, fontSize: 15, fontWeight: 500 }}>
                We're here to help you succeed. Find answers or reach our team.
              </p>
            </div>
          </div>

          {/* Search */}
          <div style={{ position: 'relative', maxWidth: 560, marginTop: 24 }}>
            <Search size={16} style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.6)' }} />
            <input
              type="text"
              placeholder="Search FAQs — e.g. camera, results, retake..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 14, padding: '14px 16px 14px 44px', color: 'white',
                fontSize: 14, fontWeight: 500, outline: 'none', backdropFilter: 'blur(8px)',
                boxSizing: 'border-box'
              }}
            />
          </div>
        </div>
      </div>

      {/* ─── Quick Action Cards ─── */}
      {!searchQuery && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 40 }}>
          {quickActions.map((qa, i) => (
            <a key={i} href={qa.action} style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, background: qa.bg, color: qa.color, display: 'grid', placeItems: 'center' }}>
                  {qa.icon}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', margin: 0 }}>{qa.title}</p>
                  <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 1.5 }}>{qa.desc}</p>
                </div>
                <span style={{ fontSize: 13, fontWeight: 700, color: qa.color, display: 'flex', alignItems: 'center', gap: 4 }}>
                  {qa.label} <ArrowRight size={13} />
                </span>
              </div>
            </a>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32, alignItems: 'start' }}>

        {/* ─── Left: FAQs ─── */}
        <div>
          {/* Category filter pills */}
          {!searchQuery && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
              <button onClick={() => setActiveCategory(null)}
                style={{ padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                  background: activeCategory === null ? '#6366F1' : 'white', color: activeCategory === null ? 'white' : '#475569', borderColor: activeCategory === null ? '#6366F1' : '#E2E8F0' }}>
                All Topics
              </button>
              {faqs.map((cat, i) => (
                <button key={i} onClick={() => setActiveCategory(i === activeCategory ? null : i)}
                  style={{ padding: '7px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s', display: 'flex', alignItems: 'center', gap: 6,
                    background: activeCategory === i ? cat.bg : 'white', color: activeCategory === i ? cat.color : '#475569', borderColor: activeCategory === i ? cat.color : '#E2E8F0' }}>
                  {cat.icon} {cat.category}
                </button>
              ))}
            </div>
          )}

          {searchQuery && filteredFaqs.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 24px', background: '#F8FAFC', borderRadius: 20, border: '1px dashed #E2E8F0' }}>
              <AlertCircle size={32} style={{ color: '#CBD5E1', marginBottom: 12 }} />
              <p style={{ fontWeight: 700, color: '#64748B' }}>No results for "{searchQuery}"</p>
              <p style={{ fontSize: 13, color: '#94A3B8', marginTop: 4 }}>Try different keywords or contact our support team below.</p>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {displayFaqs.map((cat, catIdx) => (
              <div key={catIdx}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: cat.bg, color: cat.color, display: 'grid', placeItems: 'center' }}>
                    {cat.icon}
                  </div>
                  <h2 style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>{cat.category}</h2>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', background: '#F1F5F9', padding: '2px 8px', borderRadius: 99 }}>{cat.items.length} articles</span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cat.items.map((faq, itemIdx) => {
                    const isOpen = openFaq.catIdx === catIdx && openFaq.itemIdx === itemIdx;
                    return (
                      <div key={itemIdx} style={{ border: `1px solid ${isOpen ? cat.color + '40' : '#E2E8F0'}`, borderRadius: 14, overflow: 'hidden', transition: 'border-color 0.15s' }}>
                        <button
                          onClick={() => toggleFaq(catIdx, itemIdx)}
                          style={{ width: '100%', background: isOpen ? cat.bg : 'white', border: 'none', padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left', transition: 'background 0.15s' }}
                        >
                          <span style={{ fontSize: 14, fontWeight: 600, color: isOpen ? cat.color : '#1E293B', paddingRight: 20, lineHeight: 1.4 }}>
                            {faq.question}
                          </span>
                          <span style={{ color: isOpen ? cat.color : '#CBD5E1', flexShrink: 0, transition: 'color 0.15s' }}>
                            {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </span>
                        </button>
                        {isOpen && (
                          <div style={{ padding: '0 22px 20px', background: cat.bg, fontSize: 14, color: '#475569', lineHeight: 1.7 }}>
                            <div style={{ paddingTop: 14, borderTop: `1px solid ${cat.color}20` }}>
                              {faq.answer}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Right: Contact Panel ─── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Status chips */}
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ flex: 1, background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', animation: 'pulse 2s infinite' }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#065F46', margin: 0 }}>Support Online</p>
                <p style={{ fontSize: 11, color: '#047857', margin: 0 }}>Avg reply: 2 hours</p>
              </div>
            </div>
            <div style={{ flex: 1, background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={14} style={{ color: '#0284C7' }} />
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: '#0369A1', margin: 0 }}>Mon–Sat</p>
                <p style={{ fontSize: 11, color: '#0284C7', margin: 0 }}>9 AM – 6 PM IST</p>
              </div>
            </div>
          </div>

          {/* Contact form */}
          <div className="card" style={{ padding: 28 }}>
            <div style={{ marginBottom: 20 }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.01em' }}>Contact Support</h2>
              <p style={{ color: '#64748B', fontSize: 13, marginTop: 4 }}>Describe your issue and we'll reach out via email.</p>
            </div>

            {status === 'sent' ? (
              <div style={{ textAlign: 'center', padding: '32px 16px' }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#ECFDF5', color: '#10B981', display: 'grid', placeItems: 'center', margin: '0 auto 16px' }}>
                  <CheckCircle size={28} />
                </div>
                <p style={{ fontWeight: 800, color: '#0F172A', fontSize: 16 }}>Ticket Submitted!</p>
                <p style={{ fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 1.5 }}>
                  We've received your request. Our team will reply to your registered email within 2 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Issue Category</label>
                  <select
                    className="base-input"
                    style={{ width: '100%', height: 40 }}
                    value={formData.category}
                    onChange={e => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="" disabled>Select a category</option>
                    <option value="technical">🐛 Technical Bug / Glitch</option>
                    <option value="camera">📷 Camera or Microphone Issue</option>
                    <option value="code">🔑 Invalid or Expired Job Code</option>
                    <option value="results">📊 Missing or Incorrect Results</option>
                    <option value="proctoring">🛡️ Proctoring Flag / False Alert</option>
                    <option value="other">💬 Other Inquiry</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Subject</label>
                  <input
                    type="text"
                    className="base-input"
                    placeholder="Brief description of your issue"
                    value={formData.subject}
                    onChange={e => setFormData({ ...formData, subject: e.target.value })}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Details</label>
                  <textarea
                    className="base-input"
                    placeholder="Include any error messages, browser, or steps to reproduce..."
                    style={{ width: '100%', height: 110, resize: 'vertical', boxSizing: 'border-box' }}
                    value={formData.message}
                    onChange={e => setFormData({ ...formData, message: e.target.value })}
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn-primary"
                  disabled={status === 'sending'}
                  style={{ height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {status === 'sending' ? (
                    <>
                      <span style={{ width: 16, height: 16, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: 'white', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      Sending…
                    </>
                  ) : (
                    <><Send size={16} /> Submit Ticket</>
                  )}
                </button>
              </form>
            )}
          </div>

          {/* Email / chat */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <a href="mailto:support@aiinterviewer.com" style={{ textDecoration: 'none' }}>
              <div className="card card-hover" style={{ padding: 18, textAlign: 'center', cursor: 'pointer' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: '#EEF2FF', color: '#6366F1', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
                  <Mail size={17} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>Email</p>
                <p style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>support@</p>
              </div>
            </a>
            <div className="card card-hover" style={{ padding: 18, textAlign: 'center', cursor: 'pointer' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#ECFDF5', color: '#10B981', display: 'grid', placeItems: 'center', margin: '0 auto 10px' }}>
                <MessageSquare size={17} />
              </div>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', margin: 0 }}>Live Chat</p>
              <p style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>9AM – 6PM</p>
            </div>
          </div>

          {/* Satisfaction rating */}
          <div className="card" style={{ padding: 20, textAlign: 'center' }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Was this page helpful?</p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
              {[1, 2, 3, 4, 5].map(star => (
                <Star key={star} size={22} style={{ color: '#F59E0B', cursor: 'pointer', fill: '#F59E0B' }} />
              ))}
            </div>
            <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 8 }}>4.8 / 5 · 312 reviews</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
