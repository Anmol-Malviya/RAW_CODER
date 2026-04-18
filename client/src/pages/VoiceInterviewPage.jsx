import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, Volume2, Loader, RefreshCw, AlertTriangle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAssessment } from '../context/AssessmentContext';
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
  const [warningMsg, setWarningMsg] = useState('');

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
            socket.emit('candidate_frame', { candidateId: sessionId, name: 'Candidate', role: jobRole || 'Interview', frame: canvas.toDataURL('image/jpeg', 0.4) });
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
    recognition.lang = 'en-US';
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
         setWarningMsg(msg);
         setWarnings(prev => prev + 1);
      } else {
         setWarningMsg('');
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
    utt.lang = 'en-US';

    // Load voices (async on some browsers)
    const voices = synthRef.current.getVoices();
    const pick = voices.find(v => v.lang.startsWith('en') && v.name.toLowerCase().includes('google'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
    if (pick) utt.voice = pick;

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
        await submitAssessment(sessionId, finalAnswers, 0, elapsed);
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

  // ─── Guard: No session → redirect (AFTER all hooks) ───
  if (!sessionId) {
    navigate('/candidate');
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
    <div style={{ minHeight: '100vh', background: '#F8FAFC', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 16px', fontFamily: "'Inter', sans-serif", color: '#0F172A' }}>

      {/* ─── Top Bar ─── */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 0 3px #FEE2E2', animation: 'blink 1.5s infinite' }} />
          <span style={{ color: '#64748B', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em' }}>LIVE INTERVIEW</span>
          <span style={{ color: '#6366F1', fontSize: 13, fontWeight: 600 }}>{formatTime(elapsed)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#4F46E5', background: '#EEF2FF', borderRadius: 8, padding: '5px 14px', fontWeight: 700, border: '1px solid #E0E7FF' }}>
          Q {currentQuestion + 1} / {questions.length}
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, marginBottom: 20 }}>

        {/* AI Panel */}
        <div style={{ background: '#FFFFFF', borderRadius: 24, border: '1px solid #E2E8F0', boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)', padding: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 460 }}>

          {/* Avatar */}
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{
              width: 108, height: 108, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5 0%, #818CF8 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 44,
              boxShadow: phase === PHASES.AI_SPEAKING ? '0 0 0 14px #EEF2FF, 0 0 0 24px #E0E7FF' : '0 4px 16px rgba(79,70,229,0.2)',
              transition: 'box-shadow 0.4s ease'
            }}>🤖</div>
            <div style={{
              position: 'absolute', bottom: 4, right: 4, width: 28, height: 28, borderRadius: '50%',
              background: phase === PHASES.AI_SPEAKING ? '#3B82F6' : (phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) ? '#10B981' : '#CBD5E1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid white', boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
              transition: 'background 0.3s'
            }}>
              {phase === PHASES.AI_SPEAKING ? <Volume2 size={13} color="white" /> : <Mic size={13} color="white" />}
            </div>
          </div>

          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 12 }}>AI Interviewer</p>

          {/* Status Badge */}
          <div style={{ background: sc.bg, border: `1px solid ${sc.border}`, borderRadius: 999, padding: '7px 18px', marginBottom: 28, transition: 'all 0.3s' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: sc.color }}>{sc.label}</span>
          </div>

          {/* Question Box */}
          {questionText && phase !== PHASES.INTRO && (
            <div style={{ background: '#F8FAFC', border: '1px solid #F1F5F9', borderRadius: 16, padding: '20px 28px', width: '100%', maxWidth: 480, textAlign: 'center', boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.03)' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>Question {currentQuestion + 1}</p>
              <p style={{ fontSize: 16, color: '#1E293B', lineHeight: 1.8, fontWeight: 500, margin: 0 }}>{questionText}</p>
            </div>
          )}

          {/* Start Button */}
          {phase === PHASES.INTRO && (
            <button
              onClick={startInterview}
              style={{ marginTop: 8, padding: '16px 48px', borderRadius: 14, background: 'linear-gradient(135deg, #4F46E5, #6366F1)', color: 'white', border: 'none', fontWeight: 700, fontSize: 16, cursor: 'pointer', boxShadow: '0 8px 20px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(79,70,229,0.4)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 20px rgba(79,70,229,0.35)'; }}
            >
              🎙️ Start Interview
            </button>
          )}

          {/* Countdown bar */}
          {phase === PHASES.COUNTDOWN && (
            <div style={{ width: '100%', maxWidth: 360, marginTop: 24 }}>
              <div style={{ height: 4, background: '#FEF3C7', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(silenceCountdown / 4) * 100}%`, background: '#F59E0B', borderRadius: 99, transition: 'width 1s linear' }} />
              </div>
              <p style={{ textAlign: 'center', fontSize: 12, color: '#92400E', marginTop: 8 }}>Silence detected — speak to continue</p>
            </div>
          )}

          {/* Reset mic */}
          {(phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) && (
            <button onClick={resetMic} style={{ marginTop: 20, background: 'none', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '5px 12px', fontSize: 11, color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              <RefreshCw size={12} /> Mic not working? Reset
            </button>
          )}
        </div>

        {/* Camera + Transcript Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Camera */}
          <div style={{ background: '#0F172A', borderRadius: 18, overflow: 'hidden', aspectRatio: '4/3', border: '2px solid #E2E8F0', position: 'relative', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)', display: 'block' }} />
            
            {/* Warning Overlay */}
            {warningMsg && (
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, background: 'rgba(239, 68, 68, 0.95)', color: 'white', fontSize: 11, fontWeight: 700, padding: '8px 6px', textAlign: 'center', zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, boxShadow: '0 2px 10px rgba(0,0,0,0.2)' }}>
                   <AlertTriangle size={14} /> {warningMsg}
                </div>
            )}

            <div style={{ position: 'absolute', top: warningMsg ? 40 : 10, left: 10, background: 'rgba(15,23,42,0.7)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '3px 9px', fontSize: 10, color: 'white', fontWeight: 700, letterSpacing: '0.04em', transition: 'top 0.3s' }}>YOU</div>
            <div style={{ position: 'absolute', bottom: 10, right: 10, display: 'flex', alignItems: 'center', gap: 5, background: (phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) ? 'rgba(16,185,129,0.9)' : 'rgba(15,23,42,0.6)', borderRadius: 6, padding: '4px 9px', transition: 'background 0.3s' }}>
              {(phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) ? <><div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'blink 1s infinite' }} /><span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>MIC ON</span></> : <><Mic size={10} color="#94A3B8" /><span style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600 }}>MIC OFF</span></>}
            </div>
          </div>

          {/* Waveform */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 14, padding: '8px 12px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            {bars.map((h, i) => (
              <div key={i} style={{ width: 4, borderRadius: 99, background: phase === PHASES.COUNTDOWN ? '#F59E0B' : '#4F46E5', height: `${(phase === PHASES.LISTENING || phase === PHASES.COUNTDOWN) ? h : 6}px`, transition: 'height 0.12s ease', opacity: 0.8 }} />
            ))}
          </div>

          {/* Transcript */}
          <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 16, padding: 16, flex: 1, minHeight: 120, overflow: 'hidden' }}>
            <p style={{ fontSize: 10, fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Live Transcript</p>
            {(transcript || interimText) ? (
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.8, margin: 0, wordBreak: 'break-word' }}>
                {transcript}<span style={{ color: '#94A3B8', fontStyle: 'italic' }}>{interimText}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>
                {phase === PHASES.LISTENING ? 'Say something...' : 'Waiting...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ─── Bottom Progress ─── */}
      <div style={{ width: '100%', maxWidth: 960 }}>
        <div style={{ height: 4, background: '#E2E8F0', borderRadius: 99, overflow: 'hidden', marginBottom: 14 }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4F46E5, #818CF8)', transition: 'width 0.8s ease' }} />
        </div>
        {submitting ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#6366F1', fontSize: 13 }}>
            <Loader size={14} style={{ animation: 'spin 1s linear infinite' }} /> Finalizing results...
          </div>
        ) : (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8' }}>
            🤖 Fully voice-controlled • No keyboard needed
          </p>
        )}
      </div>

      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to{ transform:rotate(360deg) } }
      `}</style>
    </div>
  );
}
