import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader, RefreshCw, AlertTriangle, PhoneOff, CheckCircle, ChevronRight, Check, Bot } from 'lucide-react';
import { io } from 'socket.io-client';
import IndianAvatarInterviewer from '../components/IndianAvatarInterviewer';
import { useAssessment } from '../context/AssessmentContext';
import { useProctoring } from '../hooks/useProctoring';
import { submitAssessment } from '../services/api';
import '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

const SILENCE_TIMEOUT = 4000;
const SILENCE_THRESHOLD = 5;

const PHASES = {
  INTRO: 'intro',
  AI_SPEAKING: 'ai_speaking',
  LISTENING: 'listening',
  COUNTDOWN: 'countdown',
  SAVING: 'saving',
  DONE: 'done',
};

// ─── ALL HOOKS MUST BE AT TOP — NO CONDITIONAL RETURNS BEFORE HOOKS ───
export default function VoiceInterviewPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();
  const proctoring = useProctoring();

  // ── State ──
  const [phase, setPhase] = useState(PHASES.INTRO);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [silenceCountdown, setSilenceCountdown] = useState(4);
  const [audioLevel, setAudioLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false); // camera/mic ready
  const [warnings, setWarnings] = useState(0);
  const [currentWord, setCurrentWord] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [visualWarningMsg, setVisualWarningMsg] = useState('');
  const [proctoringWarningMsg, setProctoringWarningMsg] = useState('');

  // ── Refs ──
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);
  const silenceTimerRef = useRef(null);
  const countdownRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const animRef = useRef(null);
  const transcriptRef = useRef('');
  const phaseRef = useRef(PHASES.INTRO);
  const qIdxRef = useRef(0);
  const answersRef = useRef({});
  const questionsRef = useRef([]);
  const resetTimerRef = useRef(null);
  const modelRef = useRef(null);

  // Load Model
  useEffect(() => {
    cocoSsd.load().then(model => {
      modelRef.current = model;
    }).catch(console.error);
  }, []);

  // Sync refs
  useEffect(() => { synthRef.current = window.speechSynthesis; }, []);
  useEffect(() => { phaseRef.current = phase; }, [phase]);

  // Sync from state → refs (avoids stale closures in callbacks)
  const { questions = [], currentQuestion = 0, answers = {}, sessionId, jobRole } = state || {};
  useEffect(() => { qIdxRef.current = currentQuestion; }, [currentQuestion]);
  useEffect(() => { answersRef.current = answers; }, [answers]);
  useEffect(() => { questionsRef.current = questions; }, [questions]);

  // ── Timer ──
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Activate Proctoring
  useEffect(() => {
    proctoring.activate();
    return () => proctoring.deactivate();
  }, []);

  // Sync tab switch warnings
  useEffect(() => {
    if (proctoring.showWarning) {
      setProctoringWarningMsg(proctoring.lastWarningMsg);
      setWarnings(prev => prev + 1);
      dispatch({ type: 'TAB_SWITCH' });
    } else {
      setProctoringWarningMsg('');
    }
  }, [proctoring.showWarning]);

  const warningMsg = proctoringWarningMsg || visualWarningMsg;

  const formatTime = s => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // ── Setup Camera/Mic/Socket ──
  useEffect(() => {
    if (!sessionId) return;
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // AudioContext for level monitoring
        try {
          const AC = window.AudioContext || window.webkitAudioContext;
          if (AC) {
            const ctx = new AC();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 512;
            ctx.createMediaStreamSource(stream).connect(analyser);
            audioCtxRef.current = ctx;
            analyserRef.current = analyser;
          }
        } catch (e) { console.warn('AudioContext:', e); }

        // Socket proctoring
        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://raw-coder-backend.onrender.com', { transports: ['websocket'] });
        socketRef.current = socket;
        const canvas = document.createElement('canvas');
        const ctx2d = canvas.getContext('2d');
        const iv = setInterval(() => {
          const vid = videoRef.current;
          if (vid?.readyState === 4) {
            canvas.width = vid.videoWidth;
            canvas.height = vid.videoHeight;
            ctx2d.drawImage(vid, 0, 0);
            socket.emit('candidate_frame', { 
              candidateId: sessionId, 
              name: 'Candidate User', 
              role: jobRole || 'Voice Interview', 
              flags: warnings,
              status: warnings > 5 ? 'critical' : warnings > 0 ? 'warning' : 'clean',
              duration: formatTime(elapsed),
              frame: canvas.toDataURL('image/jpeg', 0.4) 
            });
          }
        }, 600);

        setReady(true);
        return () => clearInterval(iv);
      })
      .catch(err => {
        console.error('Media error:', err);
        setReady(true); // still show UI even if camera denied
      });

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
      if (audioCtxRef.current?.state !== 'closed') audioCtxRef.current?.close();
      cancelAnimationFrame(animRef.current);
    };
  }, [sessionId]);

  // ── Speech Recognition ──
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.warn('SpeechRecognition not supported'); return; }

    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-IN'; // Prioritize Indian English for recognition too
    recognition.maxAlternatives = 1;

    recognition.onresult = e => {
      let fin = '', tmp = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else tmp += e.results[i][0].transcript;
      }
      if (fin) {
        transcriptRef.current += fin + ' ';
        setTranscript(p => p + fin + ' ');
        
        // Filler Word Detection (Low Confidence & Fluency Check)
        const fillerMatch = fin.match(/\b(um+|uh+|hm+|hmm+|ah+|ha+|like)\b/gi);
        if (fillerMatch && fillerMatch.length > 0) {
           setVisualWarningMsg('⚠️ LOW CONFIDENCE: Avoid filler words (' + fillerMatch[0].toLowerCase() + '). Keep a fluent, anchor-like flow!');
           setWarnings(prev => prev + 1);
           setTimeout(() => setVisualWarningMsg(''), 3500);
        }
      }
      setInterimText(tmp);
      
      // Reset timer on actual speech (best detection)
      if (phaseRef.current === PHASES.LISTENING || phaseRef.current === PHASES.COUNTDOWN) {
        if (phaseRef.current === PHASES.COUNTDOWN) {
          setPhase(PHASES.LISTENING);
          phaseRef.current = PHASES.LISTENING;
        }
        if (resetTimerRef.current) resetTimerRef.current();
      }
    };

    recognition.onend = () => {
      setInterimText('');
      const p = phaseRef.current;
      if (p === PHASES.LISTENING || p === PHASES.COUNTDOWN) {
        try { recognition.start(); } catch (_) {}
      }
    };

    recognition.onerror = e => {
      if (e.error !== 'no-speech' && e.error !== 'aborted') console.warn('SR error:', e.error);
    };

    recognitionRef.current = recognition;
  }, []);

  // ── Audio Level Monitor ──
  const startAudioMonitor = useCallback(() => {
    if (!analyserRef.current) return;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount);

    const tick = () => {
      const p = phaseRef.current;
      if (p !== PHASES.LISTENING && p !== PHASES.COUNTDOWN) { setAudioLevel(0); return; }

      analyserRef.current.getByteFrequencyData(data);
      const avg = data.reduce((s, v) => s + v, 0) / data.length;
      setAudioLevel(Math.round(avg));

      if (avg > 15 && (p === PHASES.COUNTDOWN || p === PHASES.LISTENING)) {
        // User made a loud sound (fallback to raw volume)
        clearTimeout(silenceTimerRef.current);
        clearInterval(countdownRef.current);
        if (p === PHASES.COUNTDOWN) {
           setPhase(PHASES.LISTENING);
           phaseRef.current = PHASES.LISTENING;
        }
        setSilenceCountdown(4);
        if (resetTimerRef.current) resetTimerRef.current();
      }

      animRef.current = requestAnimationFrame(tick);
    };
    animRef.current = requestAnimationFrame(tick);
  }, []);

  // ── Silence Timer ──
  const startSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownRef.current);
    setSilenceCountdown(4);

    let cd = 4;
    countdownRef.current = setInterval(() => {
      cd -= 1;
      setSilenceCountdown(cd);
      if (cd <= 4 && phaseRef.current === PHASES.LISTENING) {
        setPhase(PHASES.COUNTDOWN);
        phaseRef.current = PHASES.COUNTDOWN;
      }
      if (cd <= 0) clearInterval(countdownRef.current);
    }, 1000);

    silenceTimerRef.current = setTimeout(() => {
      const p = phaseRef.current;
      if (p === PHASES.LISTENING || p === PHASES.COUNTDOWN) {
        submitCurrentAnswer();
      }
    }, SILENCE_TIMEOUT);
  }, []);

  useEffect(() => {
    resetTimerRef.current = startSilenceTimer;
  }, [startSilenceTimer]);

  // ── Anti-Cheat Detection ──
  const runDetection = useCallback(async () => {
    if (!modelRef.current || !videoRef.current || videoRef.current.readyState !== 4) return;
    try {
      const predictions = await modelRef.current.detect(videoRef.current);
      let personCount = 0;
      let hasPhone = false;
      let hasBookOrPaper = false;
      
      predictions.forEach(p => {
        if (p.class === 'person') personCount++;
        if (p.class === 'cell phone' || p.class === 'remote') hasPhone = true;
        if (p.class === 'book') hasBookOrPaper = true;
      });

      let msg = '';
      if (personCount === 0) msg = '⚠️ FACE NOT DETECTED (Please look at camera)';
      else if (personCount > 1) msg = '⚠️ MULTIPLE PERSONS DETECTED';
      else if (hasPhone) msg = '⚠️ MOBILE PHONE DETECTED';
      else if (hasBookOrPaper) msg = '⚠️ BOOK OR PAPER DETECTED';

      if (msg) {
         setVisualWarningMsg(msg);
         setWarnings(prev => prev + 1);
      } else {
         setVisualWarningMsg('');
      }
    } catch (e) {
      console.warn('Detection skipped');
    }
  }, []);

  useEffect(() => {
    const id = setInterval(runDetection, 2000); // Check every 2 seconds
    return () => clearInterval(id);
  }, [runDetection]);

  // ── Submit Current Answer ──
  const submitCurrentAnswer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownRef.current);
    cancelAnimationFrame(animRef.current);
    try { recognitionRef.current?.stop(); } catch (_) {}

    const answer = transcriptRef.current.trim() || '(No spoken answer)';
    const idx = qIdxRef.current;
    const allQ = questionsRef.current;
    const prevAnswers = answersRef.current;

    setPhase(PHASES.SAVING);
    phaseRef.current = PHASES.SAVING;
    dispatch({ type: 'SET_ANSWER', payload: { questionIndex: idx, answer } });

    const updatedAnswers = { ...prevAnswers, [idx]: answer };
    answersRef.current = updatedAnswers;

    setTimeout(() => {
      if (idx >= allQ.length - 1) {
        // Last question → submit
        finishInterview(updatedAnswers);
      } else {
        dispatch({ type: 'NEXT_QUESTION' });
        setTranscript('');
        setInterimText('');
        transcriptRef.current = '';
        // The useEffect on currentQuestion will speak the next question
      }
    }, 600);
  }, [dispatch]);

  // ── Speak Helper ──
  const speak = useCallback((text, onDone) => {
    if (!synthRef.current) { if (onDone) onDone(); return; }
    synthRef.current.cancel();
    try { recognitionRef.current?.stop(); } catch (_) {}
    cancelAnimationFrame(animRef.current);

    setPhase(PHASES.AI_SPEAKING);
    phaseRef.current = PHASES.AI_SPEAKING;
    transcriptRef.current = '';
    setTranscript('');
    setInterimText('');

    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.0;
    utt.lang = 'en-IN';

    // Load voices (async on some browsers)
    const voices = synthRef.current.getVoices();
    const pick = voices.find(v => v.lang.startsWith('en-IN'))
      || voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (pick) utt.voice = pick;

    // ── Lip-sync: word boundary → phoneme detection ───────────────────
    utt.onboundary = (e) => {
      if (e.name === 'word') {
        const word = text.substring(e.charIndex, e.charIndex + e.charLength);
        setCurrentWord(word);
        // Reset to closed after ~130ms (one phoneme duration)
        setTimeout(() => setCurrentWord(''), 130);
      }
    };

    const afterSpeak = () => {
      if (onDone) { onDone(); return; }
      // Auto-activate mic
      setPhase(PHASES.LISTENING);
      phaseRef.current = PHASES.LISTENING;
      try { recognitionRef.current?.start(); } catch (_) {}
      startSilenceTimer();
      startAudioMonitor();
    };

    utt.onend = afterSpeak;
    utt.onerror = () => afterSpeak(); // Fallback

    // Safety timeout — some browsers never fire onend
    const safeguard = setTimeout(() => {
      if (phaseRef.current === PHASES.AI_SPEAKING) afterSpeak();
    }, text.length * 80 + 3000);

    utt.onend = () => { clearTimeout(safeguard); afterSpeak(); };

    synthRef.current.speak(utt);
    // Reset lip state when speech ends (handled by afterSpeak above via phase change)
  }, [startSilenceTimer, startAudioMonitor]);

  // Ask next question when currentQuestion changes
  useEffect(() => {
    if (phase === PHASES.INTRO) return;
    const q = questions[currentQuestion];
    if (!q) return;
    const text = q.text || q.question || (typeof q === 'string' ? q : '');
    speak(`Question ${currentQuestion + 1}. ${text}`);
  }, [currentQuestion]); // Only re-run when question number changes

  // ── Start Interview ──
  const startInterview = () => {
    const intro = `Hello! I will ask you ${questions.length} questions. After each question, your microphone will automatically activate. Please speak your answer clearly. I will detect silence and move to the next question automatically. Let's begin.`;
    speak(intro, () => {
      const q = questions[0];
      if (q) speak(`Question 1. ${q.text || q.question || (typeof q === 'string' ? q : '')}`);
    });
  };

  // ── Finish Interview ──
  const finishInterview = useCallback((finalAnswers) => {
    setPhase(PHASES.DONE);
    setSubmitting(true);
    if (synthRef.current) synthRef.current.cancel();

    const done = async () => {
      try {
        await submitAssessment(sessionId, finalAnswers, warnings, elapsed);
      } catch (e) {
        console.error('Submit error:', e);
      } finally {
        streamRef.current?.getTracks().forEach(t => t.stop());
        setSubmitting(false);
        navigate('/results');
      }
    };

    const utt = new SpeechSynthesisUtterance('Thank you! Your interview is complete. Results are being processed.');
    utt.onend = done;
    utt.onerror = done;
    setTimeout(done, 5000); // Fallback
    try { synthRef.current?.speak(utt); } catch (_) { done(); }
  }, [sessionId, elapsed, navigate]);

  // ── Reset Mic ──
  const resetMic = () => {
    try { recognitionRef.current?.stop(); } catch (_) {}
    setTimeout(() => {
      try { recognitionRef.current?.start(); } catch (_) {}
    }, 300);
  };

  const toggleMute = () => {
    if (!streamRef.current) return;
    const audioTrack = streamRef.current.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      setIsMuted(!audioTrack.enabled);
    }
  };

  const handleNextQuestion = () => {
    if (phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) {
      submitCurrentAnswer();
    }
  };

  const endInterview = () => {
    if (window.confirm('Are you sure you want to end the interview early? Your current responses will be submitted.')) {
      finishInterview(answersRef.current);
    }
  };

  const isLastQuestion = currentQuestion >= questions.length - 1;

  // ─── Guard: No session → redirect (AFTER all hooks) ───
  useEffect(() => {
    if (!sessionId) {
      navigate('/candidate');
    }
  }, [sessionId, navigate]);

  if (!sessionId) {
    return null;
  }

  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const currentQObj = questions[currentQuestion];
  const questionText = currentQObj?.text || currentQObj?.question || (typeof currentQObj === 'string' ? currentQObj : '');

  const bars = Array.from({ length: 16 }, (_, i) => {
    const dist = Math.abs(i - 8);
    return Math.min(Math.max(4, audioLevel * (1 - dist / 8) * 0.9), 52);
  });

  const statusConfig = {
    [PHASES.INTRO]:      { label: 'Ready to Begin',             color: '#64748B', bg: '#F8FAFC',  border: '#E2E8F0'  },
    [PHASES.AI_SPEAKING]:{ label: 'AI Interviewer Speaking...',  color: '#2563EB', bg: '#EFF6FF',  border: '#BFDBFE'  },
    [PHASES.LISTENING]:  { label: '🎤 Listening — Speak Now',    color: '#059669', bg: '#ECFDF5',  border: '#A7F3D0'  },
    [PHASES.COUNTDOWN]:  { label: `⏳ Auto-next in ${silenceCountdown}s`, color: '#D97706', bg: '#FFFBEB', border: '#FDE68A' },
    [PHASES.SAVING]:     { label: '✅ Response Saved',            color: '#059669', bg: '#ECFDF5',  border: '#A7F3D0'  },
    [PHASES.DONE]:       { label: 'Interview Complete',           color: '#7C3AED', bg: '#F5F3FF',  border: '#DDD6FE'  },
  };
  const sc = statusConfig[phase] || statusConfig[PHASES.INTRO];

  return (
    <div style={{ minHeight: '100vh', background: '#FAFAFA', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter', sans-serif", color: '#1A1A1A' }}>

      {/* ─── Minimal Header ─── */}
      <div style={{ width: '100%', maxWidth: 1000, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'linear-gradient(135deg, #6366F1, #4F46E5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot color="white" size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 16, fontWeight: 800, margin: 0, tracking: '-0.02em', color: '#1A1A1A' }}>AI Interviewer <span style={{ color: '#6366F1' }}>Pro</span></h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#EF4444', animation: 'blink 1.5s infinite' }} />
              <span style={{ color: '#64748B', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em' }}>LIVE SESSION • {formatTime(elapsed)}</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 11, color: warnings > 5 ? '#EF4444' : '#64748B', background: warnings > 5 ? '#FEE2E2' : '#F8FAFC', borderRadius: 10, padding: '7px 14px', fontWeight: 800, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.3s' }}>
             <AlertTriangle size={12} /> {warnings} Warnings
          </div>
          <div style={{ fontSize: 11, color: '#4F46E5', background: '#FFFFFF', borderRadius: 10, padding: '7px 16px', fontWeight: 800, border: '1px solid #E0E7FF', boxShadow: '0 1px 2px rgba(0,0,0,0.04)' }}>
            Step {currentQuestion + 1} of {questions.length}
          </div>
        </div>
      </div>

      {/* ─── Immersive Main Stage ─── */}
      <div style={{ width: '100%', maxWidth: 1000, display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 32, marginBottom: 40 }}>

        {/* AI Focus Panel */}
        <div style={{ background: '#FFFFFF', borderRadius: 32, border: '1px solid #F1F5F9', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.04)', padding: '48px 40px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 560, position: 'relative', overflow: 'hidden' }}>
          
          {/* Subtle Background Accent */}
          <div style={{ position: 'absolute', top: -100, left: -100, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.05) 0%, rgba(255,255,255,0) 70%)', zIndex: 0 }} />

          {/* Avatar Area */}
          <div style={{ position: 'relative', marginBottom: 32, zIndex: 1 }}>
            <div style={{
              padding: 10, borderRadius: '50%', background: phase === PHASES.AI_SPEAKING ? 'rgba(99, 102, 241, 0.08)' : 'transparent',
              transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
            }}>
              <IndianAvatarInterviewer
                isSpeaking={phase === PHASES.AI_SPEAKING}
                currentWord={currentWord}
                size={220}
              />
            </div>
            {/* Minimal Status Indicator */}
            <div style={{
              position: 'absolute', bottom: 20, right: 10,
              background: phase === PHASES.AI_SPEAKING ? '#4F46E5' : (phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) ? '#10B981' : '#E2E8F0',
              borderRadius: '50%', width: 34, height: 34,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '4px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              transition: 'background 0.4s ease',
            }}>
              {phase === PHASES.AI_SPEAKING ? <Volume2 size={16} color="white" /> : <Mic size={16} color="white" />}
            </div>
          </div>

          <div style={{ textAlign: 'center', maxWidth: 460, zIndex: 1 }}>
            <span style={{ fontSize: 11, fontWeight: 800, color: sc.color, letterSpacing: '0.12em', textTransform: 'uppercase', background: sc.bg, padding: '4px 12px', borderRadius: 8, border: `1px solid ${sc.border}` }}>{sc.label}</span>
            
            {/* Question Display */}
            <div style={{ marginTop: 24 }}>
              {questionText && phase !== PHASES.INTRO ? (
                <p style={{ fontSize: 19, color: '#1E293B', lineHeight: 1.6, fontWeight: 600, margin: 0, tracking: '-0.01em' }}>"{questionText}"</p>
              ) : phase === PHASES.INTRO ? (
                <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.7, margin: 0 }}>Welcome to your AI-guided interview. Focus on the screen and speak naturally when the indicator turns green.</p>
              ) : null}
            </div>
          </div>

          {/* Start Button */}
          {phase === PHASES.INTRO && (
            <button
              onClick={startInterview}
              style={{ marginTop: 40, padding: '18px 44px', borderRadius: 16, background: '#1A1A1A', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.2)', transition: 'all 0.3s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.background = '#000000'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = '#1A1A1A'; }}
            >
              Start Session
            </button>
          )}

          {/* Countdown indicator */}
          {phase === PHASES.COUNTDOWN && (
            <div style={{ position: 'absolute', bottom: 40, width: '100%', padding: '0 40px', boxSizing: 'border-box' }}>
               <div style={{ height: 4, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
                 <div style={{ height: '100%', width: `${(silenceCountdown / 4) * 100}%`, background: '#F59E0B', borderRadius: 99, transition: 'width 1s linear' }} />
               </div>
               <p style={{ textAlign: 'center', fontSize: 11, color: '#94A3B8', marginTop: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Moving forward automatically...</p>
            </div>
          )}
        </div>

        {/* Candidate Feed & Analytics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Video Container - Minimalist Edge */}
          <div style={{ background: '#000', borderRadius: 32, overflow: 'hidden', aspectRatio: '4/3', border: '1px solid #F1F5F9', position: 'relative', boxShadow: '0 10px 40px -10px rgba(0,0,0,0.06)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            
            {/* Warning System - Overlaying Video */}
            <AnimatePresence>
              {warningMsg && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239, 68, 68, 0.9)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 12, fontWeight: 700, padding: '12px 16px', zIndex: 10, display: 'flex', alignItems: 'center', gap: 10 }}
                >
                  <AlertTriangle size={16} /> {warningMsg}
                </motion.div>
              )}
            </AnimatePresence>

            <div style={{ position: 'absolute', bottom: 16, left: 16, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.2)', padding: '6px 14px', fontSize: 11, color: 'white', fontWeight: 800, letterSpacing: '0.04em' }}>CANDIDATE FEED</div>
          </div>

          {/* Voice Visualizer + Transcript Card */}
          <div style={{ background: '#FFFFFF', borderRadius: 32, border: '1px solid #F1F5F9', padding: 28, flex: 1, display: 'flex', flexDirection: 'column', gap: 20, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.02)' }}>
            
            {/* Modern Waveform */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, height: 40, justifyContent: 'center' }}>
              {bars.map((h, i) => (
                <div key={i} style={{ width: 3, borderRadius: 99, background: phase === PHASES.AI_SPEAKING ? '#E2E8F0' : '#6366F1', height: `${(phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) ? h : 4}px`, transition: 'height 0.12s ease', opacity: (i < 4 || i > 11) ? 0.3 : 1 }} />
              ))}
            </div>

            <div style={{ borderTop: '1px solid #F8FAFC', paddingTop: 20 }}>
              <p style={{ fontSize: 10, fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Live Transcript</p>
              <div style={{ minHeight: 80 }}>
                {(transcript || interimText) ? (
                  <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.7, margin: 0, fontWeight: 500 }}>
                    {transcript}<span style={{ color: '#94A3B8' }}>{interimText}</span>
                  </p>
                ) : (
                  <p style={{ fontSize: 14, color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>{phase === PHASES.LISTENING ? 'Please speak now...' : 'Awaiting speech input...'}</p>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* ─── Control Center ─── */}
      <div style={{ width: '100%', maxWidth: 1000, display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', padding: '16px 24px', borderRadius: 24, border: '1px solid #F1F5F9', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
        
        {/* Progress Info */}
        <div style={{ width: 180 }}>
           <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
             <span style={{ fontSize: 11, fontWeight: 800, color: '#94A3B8' }}>PROGRESS</span>
             <span style={{ fontSize: 11, fontWeight: 800, color: '#6366F1' }}>{Math.round(progress)}%</span>
           </div>
           <div style={{ height: 4, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden' }}>
             <div style={{ height: '100%', width: `${progress}%`, background: '#6366F1', transition: 'width 0.8s' }} />
           </div>
        </div>

        {/* Central Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={toggleMute}
            style={{ width: 48, height: 48, borderRadius: 16, border: '1px solid #F1F5F9', background: isMuted ? '#EF4444' : '#FFFFFF', color: isMuted ? 'white' : '#64748B', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}
          >
            {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
          </button>

          {phase !== PHASES.INTRO && phase !== PHASES.DONE && (
            <button
              onClick={handleNextQuestion}
              disabled={phase === PHASES.SAVING || phase === PHASES.AI_SPEAKING}
              style={{ height: 48, padding: '0 28px', borderRadius: 16, background: '#6366F1', color: 'white', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)', transition: 'all 0.2s', opacity: (phase === PHASES.SAVING || phase === PHASES.AI_SPEAKING) ? 0.6 : 1 }}
            >
              {phase === PHASES.SAVING ? 'Saving...' : isLastQuestion ? 'Submit Session' : 'Next Step'} <ChevronRight size={16} />
            </button>
          )}

          <button
            onClick={endInterview}
            style={{ width: 48, height: 48, borderRadius: 16, border: '1px solid #FEE2E2', background: '#FFFFFF', color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}
          >
            <PhoneOff size={20} />
          </button>
        </div>

        {/* Settings / Reset */}
        <div style={{ width: 180, textAlign: 'right' }}>
           <button onClick={resetMic} style={{ background: 'none', border: 'none', color: '#94A3B8', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6, opacity: 0.7 }}>
             <RefreshCw size={12} /> SYNC MIC
           </button>
        </div>
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
        @keyframes spin { to{ transform:rotate(360deg) } }
        body { background-color: #FAFAFA !important; }
      `}</style>
    </div>
  );
}
