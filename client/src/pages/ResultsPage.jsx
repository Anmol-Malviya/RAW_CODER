import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  CheckCircle, XCircle, ChevronDown, ChevronUp, RotateCcw, AlertTriangle,
  Download, Sparkles, TrendingUp, TrendingDown, Target, Loader, Star, Send
} from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import { submitFeedback } from '../services/api';

function ScoreRing({ score, total }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const percent = total > 0 ? score / total : 0;
  const offset = circumference * (1 - percent);

  const color = percent >= 0.8 ? '#10B981' : percent >= 0.5 ? '#F59E0B' : '#F43F5E';
  const label = percent >= 0.8 ? 'Excellent' : percent >= 0.6 ? 'Good' : percent >= 0.4 ? 'Average' : 'Needs work';
  const pillClass = percent >= 0.8 ? 'pill-emerald' : percent >= 0.5 ? 'pill-amber' : 'pill-rose';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ position: 'relative' }}>
        <svg width="140" height="140" className="score-ring">
          <circle cx="70" cy="70" r={radius} className="score-ring-bg" />
          <circle
            cx="70" cy="70" r={radius}
            className="score-ring-fill"
            stroke={color}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1.2s ease 0.2s' }}
          />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 36, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.02em' }}>{score}</span>
          <span style={{ fontSize: 12, color: '#64748B' }}>of {total}</span>
        </div>
      </div>
      <span className={`status-pill ${pillClass}`}>{label}</span>
    </div>
  );
}

function BreakdownBar({ label, value }) {
  const color = value >= 80 ? '#10B981' : value >= 50 ? '#F59E0B' : '#F43F5E';
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 600 }}>{value}%</span>
      </div>
      <div style={{ height: 6, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${value}%`, background: color, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

function QuestionReview({ question, index, selectedAnswer, isOpen, onToggle }) {
  const isCorrect = selectedAnswer === question.correctAnswer;
  const wasAnswered = selectedAnswer !== undefined;

  return (
    <div className="panel" style={{ overflow: 'hidden' }}>
      <button
        onClick={onToggle}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px',
          background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left',
          transition: 'background 0.15s ease',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div
          style={{
            width: 26, height: 26, borderRadius: 999, flexShrink: 0,
            display: 'grid', placeItems: 'center',
            background: !wasAnswered ? '#F1F5F9' : isCorrect ? '#ECFDF5' : '#FFF1F2',
            color: !wasAnswered ? '#94A3B8' : isCorrect ? '#059669' : '#E11D48',
          }}
        >
          {!wasAnswered ? <span style={{ fontSize: 11, fontWeight: 600 }}>—</span> : isCorrect ? <CheckCircle size={14} /> : <XCircle size={14} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 11, color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Question {index + 1}</p>
          <p style={{ marginTop: 2, fontSize: 13, color: '#0F172A', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {question.question}
          </p>
        </div>
        {isOpen ? <ChevronUp size={16} color="#64748B" /> : <ChevronDown size={16} color="#64748B" />}
      </button>

      {isOpen && (
        <div style={{ padding: '0 18px 18px', borderTop: '1px solid #F1F5F9' }}>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            {question.options.map((option, idx) => {
              const isCorrectOption = option === question.correctAnswer;
              const isSelectedOption = option === selectedAnswer;
              let className = 'option-card';
              if (isCorrectOption) className += ' correct';
              else if (isSelectedOption && !isCorrectOption) className += ' incorrect';
              return (
                <div key={idx} className={className} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  {isCorrectOption && <CheckCircle size={14} color="#059669" />}
                  {isSelectedOption && !isCorrectOption && <XCircle size={14} color="#E11D48" />}
                  {!isCorrectOption && !isSelectedOption && <div style={{ width: 14 }} />}
                  <span style={{ flex: 1 }}>{option}</span>
                  {isCorrectOption && <span style={{ fontSize: 11, fontWeight: 600, color: '#047857' }}>Correct</span>}
                  {isSelectedOption && !isCorrectOption && <span style={{ fontSize: 11, fontWeight: 600, color: '#BE123C' }}>Your answer</span>}
                </div>
              );
            })}
          </div>

          {question.explanation && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: '#EEF2FF', border: '1px solid #E0E7FF' }}>
              <p style={{ fontSize: 11, fontWeight: 600, color: '#4338CA', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                Explanation
              </p>
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}>{question.explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state: assessmentState, dispatch } = useAssessment();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openQuestions, setOpenQuestions] = useState({});
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    const sessionId = location.state?.sessionId;
    const fromHistory = location.state?.fromHistory;

    if (fromHistory && sessionId) {
      loadSession(sessionId);
    } else if (assessmentState.status === 'completed' && assessmentState.score !== null) {
      setSession(assessmentState);
      // Show feedback modal after 3 seconds of viewing results
      const timer = setTimeout(() => {
        if (!feedbackSubmitted) setShowFeedbackModal(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else {
      navigate('/');
    }
  }, [assessmentState, location.state, navigate, feedbackSubmitted]);

  const loadSession = async (id) => {
    setLoading(true);
    try {
      const data = await import('../services/api').then(m => m.getSession(id));
      if (data) {
        setSession({
          ...data,
          questions: data.questions || [],
          answers: data.answers || {},
          score: data.score
        });
      }
    } catch (e) {
      console.error(e);
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const { questions = [], answers = {}, score = 0, tabSwitchCount = 0 } = session || {};

  const correctCount = useMemo(
    () => questions.filter((q) => answers[q.id] === q.correctAnswer).length,
    [questions, answers]
  );

  const breakdown = useMemo(() => {
    const total = questions.length || 1;
    const accuracy = Math.round((correctCount / total) * 100);
    const integrity = tabSwitchCount === 0 ? 100 : Math.max(40, 100 - tabSwitchCount * 15);
    const communication = Math.round((accuracy + integrity) / 2);
    return { accuracy, integrity, communication };
  }, [correctCount, questions.length, tabSwitchCount]);

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
         <Loader size={48} className="spin" color="#6366F1" />
         <p style={{ fontSize: 16, fontWeight: 700, color: '#64748B' }}>Fetching your report...</p>
         <style>{`@keyframes spin{to{transform:rotate(360deg)}} .spin{animation:spin 1s linear infinite}`}</style>
      </div>
    );
  }

  if (!session) return null;

  const toggle = (idx) => setOpenQuestions((p) => ({ ...p, [idx]: !p[idx] }));
  const expandAll = () => {
    const all = {};
    questions.forEach((_, i) => (all[i] = true));
    setOpenQuestions(all);
  };
  const collapseAll = () => setOpenQuestions({});

  const handleFeedbackSubmit = async () => {
    if (rating === 0) return;
    setSubmittingFeedback(true);
    try {
      const id = session.sessionId || assessmentState.sessionId;
      await submitFeedback(id, rating, comment);
      setFeedbackSubmitted(true);
      setShowFeedbackModal(false);
    } catch (err) {
      console.error('Feedback failed:', err);
      alert('Failed to submit feedback');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const FeedbackModal = () => (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20 }}>
      <div className="card" style={{ width: '100%', maxWidth: 440, padding: 32, textAlign: 'center', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', margin: '0 auto 20px' }}>
          <Sparkles size={32} />
        </div>
        <h3 style={{ fontSize: 20, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>Rate Your Experience</h3>
        <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.5, marginBottom: 24 }}>
          How was your AI interview session? Your feedback helps us improve the experience.
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 24 }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => !rating && setRating(0)} // dummy
              onClick={() => setRating(s)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            >
              <Star
                size={36}
                fill={s <= rating ? '#F59E0B' : 'transparent'}
                color={s <= rating ? '#F59E0B' : '#CBD5E1'}
                strokeWidth={2}
                style={{ transition: 'transform 0.1s' }}
              />
            </button>
          ))}
        </div>

        <textarea
          placeholder="Any additional thoughts? (Optional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          style={{ width: '100%', padding: '12px 16px', borderRadius: 12, border: '1px solid #E2E8F0', background: '#F8FAFC', fontSize: 14, minHeight: 100, marginBottom: 24, outline: 'none', resize: 'none' }}
        />

        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setShowFeedbackModal(false)}
            className="btn-secondary"
            style={{ flex: 1 }}
          >
            Skip
          </button>
          <button
            onClick={handleFeedbackSubmit}
            disabled={rating === 0 || submittingFeedback}
            className="btn-primary"
            style={{ flex: 2, gap: 8 }}
          >
            {submittingFeedback ? 'Submitting...' : 'Submit Review'} <Send size={14} />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      {showFeedbackModal && <FeedbackModal />}
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Assessment report</p>
          <h1 style={{ marginTop: 6, fontSize: 28, fontWeight: 600, color: '#0F172A', letterSpacing: '-0.02em' }}>
            Your performance summary
          </h1>
          <p style={{ marginTop: 6, fontSize: 14, color: '#64748B' }}>
            A detailed breakdown of your responses and AI-generated feedback.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => {
              dispatch({ type: 'RESET' });
              navigate('/');
            }}
            className="btn-secondary"
          >
            <RotateCcw size={14} /> New assessment
          </button>
          <button onClick={() => window.print()} className="btn-primary">
            <Download size={14} /> Download PDF
          </button>
        </div>
      </div>

      {/* Overview */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 320px) 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card" style={{ padding: 28, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ScoreRing score={score} total={questions.length} />
        </div>
        <div className="card" style={{ padding: 28 }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 16 }}>
            Category breakdown
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <BreakdownBar label="Coding & knowledge" value={breakdown.accuracy} />
            <BreakdownBar label="Communication" value={breakdown.communication} />
            <BreakdownBar label="Behavior & integrity" value={breakdown.integrity} />
          </div>

          <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid #F1F5F9', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <MiniStat label="Correct" value={correctCount} tone="emerald" />
            <MiniStat label="Incorrect" value={questions.length - correctCount} tone="rose" />
            <MiniStat label="Tab switches" value={tabSwitchCount} tone={tabSwitchCount > 0 ? 'amber' : 'slate'} />
          </div>
        </div>
      </div>

      {/* Strengths / Weaknesses */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <FeedbackCard
          title="Strengths"
          tone="emerald"
          icon={<TrendingUp size={14} />}
          items={
            breakdown.accuracy >= 70
              ? ['Strong grasp of core concepts', 'Consistent answer accuracy', 'Stayed focused throughout']
              : ['Attempted all questions', 'Engaged with the assessment']
          }
        />
        <FeedbackCard
          title="Areas to improve"
          tone="rose"
          icon={<TrendingDown size={14} />}
          items={
            breakdown.accuracy < 70
              ? ['Review fundamental concepts', 'Practice edge cases', 'Re-read questions before selecting']
              : tabSwitchCount > 0
              ? ['Minimise tab switching during interviews']
              : ['Push yourself on harder problem types']
          }
        />
      </div>

      {/* AI feedback */}
      <div className="card" style={{ padding: 24, marginBottom: 24, display: 'flex', gap: 14, alignItems: 'flex-start' }}>
        <div style={{ width: 36, height: 36, borderRadius: 8, background: '#EEF2FF', color: '#4F46E5', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <Sparkles size={16} />
        </div>
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI feedback</p>
          <p style={{ marginTop: 6, fontSize: 14, color: '#334155', lineHeight: 1.7 }}>
            {breakdown.accuracy >= 80
              ? 'Excellent performance. You demonstrated strong conceptual understanding and consistent reasoning across the assessment. Your integrity signals are clean and you showed good technical depth — a strong candidate for the role.'
              : breakdown.accuracy >= 50
              ? 'Solid performance overall with a few gaps. Consider reviewing the questions you missed and revisiting the underlying concepts. Your communication and engagement were strong indicators.'
              : 'There is room for growth. We recommend revisiting the core topics and taking additional practice assessments to strengthen fundamentals before the next interview round.'}
          </p>
        </div>
      </div>

      {/* Question review */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0F172A' }}>Question review</h2>
        <div style={{ display: 'flex', gap: 8, fontSize: 12 }}>
          <button className="btn-ghost" onClick={expandAll} style={{ padding: '4px 8px', color: '#4F46E5', fontWeight: 600 }}>Expand all</button>
          <button className="btn-ghost" onClick={collapseAll} style={{ padding: '4px 8px', color: '#4F46E5', fontWeight: 600 }}>Collapse all</button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {questions.map((q, idx) => (
          <QuestionReview
            key={q.id || idx}
            question={q}
            index={idx}
            selectedAnswer={answers[q.id]}
            isOpen={openQuestions[idx] || false}
            onToggle={() => toggle(idx)}
          />
        ))}
      </div>
    </div>
  );
}

function FeedbackCard({ title, tone, icon, items }) {
  const tones = {
    emerald: { bg: '#ECFDF5', color: '#047857' },
    rose: { bg: '#FFF1F2', color: '#BE123C' },
  };
  const t = tones[tone];
  return (
    <div className="card" style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: t.bg, color: t.color, display: 'grid', placeItems: 'center' }}>
          {icon}
        </div>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>{title}</h3>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((item, idx) => (
          <li key={idx} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontSize: 13, color: '#334155', lineHeight: 1.6 }}>
            <Target size={12} color={t.color} style={{ marginTop: 4, flexShrink: 0 }} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function MiniStat({ label, value, tone }) {
  const tones = {
    emerald: '#047857',
    rose: '#BE123C',
    amber: '#B45309',
    slate: '#334155',
  };
  return (
    <div>
      <p style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{label}</p>
      <p style={{ marginTop: 2, fontSize: 20, fontWeight: 700, color: tones[tone], letterSpacing: '-0.01em' }}>{value}</p>
    </div>
  );
}
