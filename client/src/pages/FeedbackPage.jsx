import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, MessageSquare, Send, SkipForward, CheckCircle2, Loader2 } from 'lucide-react';
import { submitFeedback } from '../services/api';

export default function FeedbackPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const resolvedSessionId = sessionId || location.state?.sessionId;

  useEffect(() => {
    console.log('FeedbackPage loaded for session:', resolvedSessionId);
    if (!resolvedSessionId) {
      console.warn('No sessionId found in params or state');
    }
  }, [resolvedSessionId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0 || !resolvedSessionId) return;

    setIsSubmitting(true);
    try {
      await submitFeedback(resolvedSessionId, rating, comment);
      setIsSubmitted(true);
      setTimeout(() => {
        navigate('/results', { state: { sessionId: resolvedSessionId } });
      }, 2000);
    } catch (error) {
      console.error('Failed to submit feedback', error);
      alert('Failed to submit feedback. Taking you to results...');
      navigate('/results', { state: { sessionId: resolvedSessionId } });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/results', { state: { sessionId: resolvedSessionId } });
  };

  if (isSubmitted) {
    return (
      <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F8FAFC', padding: 20 }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{ textAlign: 'center', background: 'white', padding: 48, borderRadius: 32, boxShadow: '0 20px 50px rgba(0,0,0,0.05)', maxWidth: 480, width: '100%' }}
        >
          <div style={{ width: 80, height: 80, background: '#ECFDF5', borderRadius: 40, display: 'grid', placeItems: 'center', margin: '0 auto 24px' }}>
            <CheckCircle2 size={40} color="#10B981" />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', marginBottom: 12 }}>Thank You!</h1>
          <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.6 }}>Your feedback helps us improve the interview experience for everyone. Redirecting to your results...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #F8FAFC 0%, #EFF6FF 100%)', padding: 20 }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{ width: '100%', maxWidth: 540, background: '#FFFFFF', borderRadius: 32, padding: 48, boxShadow: '0 30px 60px -12px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden' }}
      >
        <div style={{ position: 'absolute', top: -100, right: -100, width: 240, height: 240, background: 'radial-gradient(circle, #EEF2FF 0%, transparent 70%)', zIndex: 0 }} />
        
        <div style={{ position: 'relative', zIndex: 1 }}>
          <header style={{ marginBottom: 40, textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', padding: '8px 16px', background: '#EEF2FF', borderRadius: 99, color: '#4F46E5', fontSize: 12, fontWeight: 700, letterSpacing: '0.05em', marginBottom: 16 }}>
              INTERVIEW COMPLETED
            </div>
            <h1 style={{ fontSize: 32, fontWeight: 850, color: '#0F172A', marginBottom: 12, letterSpacing: '-0.02em' }}>How was it?</h1>
            <p style={{ color: '#64748B', fontSize: 16, lineHeight: 1.6 }}>We'd love to hear about your experience with Raw Coder AI today.</p>
          </header>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 40 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Overall Experience</p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 12 }}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <button
                    key={idx}
                    type="button"
                    onMouseEnter={() => setHovered(idx)}
                    onMouseLeave={() => setHovered(0)}
                    onClick={() => setRating(idx)}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', transition: 'transform 0.15s' }}
                  >
                    <Star 
                      size={40} 
                      fill={(hovered || rating) >= idx ? "#F59E0B" : "none"} 
                      color={(hovered || rating) >= idx ? "#F59E0B" : "#CBD5E1"} 
                      strokeWidth={1.5}
                      style={{ transform: (hovered || rating) === idx ? 'scale(1.2)' : 'scale(1)' }}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 40 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <MessageSquare size={18} color="#64748B" />
                <label style={{ fontSize: 14, fontWeight: 600, color: '#334155' }}>Any specific comments?</label>
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="What did you like? What could be better? (Optional)"
                style={{
                  width: '100%', minHeight: 120, padding: '16px 20px', borderRadius: 16, border: '2px solid #E2E8F0',
                  fontSize: 15, color: '#1E293B', outline: 'none', transition: 'all 0.2s', resize: 'vertical',
                  lineHeight: 1.6, background: '#F8FAFC'
                }}
                onFocus={(e) => { e.target.style.borderColor = '#818CF8'; e.target.style.background = '#FFFFFF'; }}
                onBlur={(e) => { e.target.style.borderColor = '#E2E8F0'; e.target.style.background = '#F8FAFC'; }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <button
                type="submit"
                disabled={rating === 0 || isSubmitting}
                style={{
                  width: '100%', padding: '16px 24px', borderRadius: 16, border: 'none',
                  background: rating === 0 ? '#E2E8F0' : 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',
                  color: rating === 0 ? '#94A3B8' : '#FFFFFF',
                  fontSize: 16, fontWeight: 700, cursor: rating === 0 ? 'not-allowed' : 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  transition: 'all 0.3s', boxShadow: rating === 0 ? 'none' : '0 10px 25px -5px rgba(79, 70, 229, 0.4)'
                }}
                onMouseOver={(e) => { if(rating !== 0) e.currentTarget.style.transform = 'translateY(-2px)'; }}
                onMouseOut={(e) => { if(rating !== 0) e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>

              <button
                type="button"
                onClick={handleSkip}
                style={{
                  width: '100%', padding: '14px 24px', borderRadius: 16, border: '1px solid #E2E8F0',
                  background: '#FFFFFF', color: '#64748B', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s'
                }}
                onMouseOver={(e) => { e.currentTarget.style.background = '#F8FAFC'; e.currentTarget.style.color = '#1E293B'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = '#FFFFFF'; e.currentTarget.style.color = '#64748B'; }}
              >
                <SkipForward size={16} />
                Skip for now
              </button>
            </div>
          </form>
        </div>
      </motion.div>
      <style>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
