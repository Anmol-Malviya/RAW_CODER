import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, Loader, AlertCircle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAssessment } from '../context/AssessmentContext';
import { submitAssessment } from '../services/api';

const SILENCE_TIMEOUT = 8000;
const SILENCE_THRESHOLD = 10;

const PHASES = {
  INTRO: 'intro',
  AI_SPEAKING: 'ai_speaking',
  LISTENING: 'listening',
  SILENCE_COUNTDOWN: 'countdown',
  SAVING: 'saving',
  DONE: 'done',
};

export default function VoiceInterviewPage() {
  const navigate = useNavigate();
  const context = useAssessment();
  
  // Safety check: if context is missing for some reason
  if (!context) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0F172A', color: 'white' }}>
         <div style={{ textAlign: 'center' }}>
            <AlertCircle size={48} color="#EF4444" style={{ marginBottom: 16 }} />
            <h3>Assessment Error</h3>
            <p>Critical error in assessment session. Please restart.</p>
            <button onClick={() => window.location.href = '/candidate'} style={{ marginTop: 16, padding: '8px 16px', background: '#4F46E5', border: 'none', borderRadius: 8, color: 'white' }}>Return to Dashboard</button>
         </div>
      </div>
    );
  }

  const { state, dispatch } = context;
  const { questions = [], currentQuestion = 0, answers = {}, sessionId, jobRole } = state || {};

  // Redirect if no active session
  if (!sessionId && state?.status !== 'active' && state?.status !== 'loading') {
    return <Navigate to="/candidate" replace />;
  }

  const question = questions?.[currentQuestion];
  const isLastQuestion = currentQuestion === (questions?.length || 0) - 1;

  const [phase, setPhase] = useState(PHASES.INTRO);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [silenceCountdown, setSilenceCountdown] = useState(8);
  const [audioLevel, setAudioLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  const silenceTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const transcriptRef = useRef('');
  const phaseRef = useRef(PHASES.INTRO);
  const currentQuestionRef = useRef(currentQuestion);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  useEffect(() => {
    let active = true;
    
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        if (!active) return;
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) {
          try {
            const ctx = new AudioCtx();
            const analyser = ctx.createAnalyser();
            analyser.fftSize = 256;
            const source = ctx.createMediaStreamSource(stream);
            source.connect(analyser);
            audioContextRef.current = ctx;
            analyserRef.current = analyser;
          } catch (e) {
            console.error("AudioContext initialization failed", e);
          }
        }

        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://raw-coder-backend.onrender.com');
        socketRef.current = socket;
        
        const canvas = document.createElement('canvas');
        const ctx2 = canvas.getContext('2d');
        const interval = setInterval(() => {
          if (videoRef.current?.readyState === 4 && socket.connected) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx2.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            socket.emit('candidate_frame', {
              candidateId: sessionId || 'voice-session',
              name: 'Candidate',
              role: jobRole || 'Interview',
              frame: canvas.toDataURL('image/jpeg', 0.4)
            });
          }
        }, 500);

        return () => clearInterval(interval);
      })
      .catch(err => {
        console.error("Media access failed", err);
      });

    return () => {
      active = false;
      streamRef.current?.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close();
      }
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [sessionId, jobRole]);

  const startAudioMonitor = useCallback(() => {
    if (!analyserRef.current) return;
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);

    const tick = () => {
      if (phaseRef.current !== PHASES.LISTENING && phaseRef.current !== PHASES.SILENCE_COUNTDOWN) {
        setAudioLevel(0);
        return;
      }
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.round(avg));

      if (avg > SILENCE_THRESHOLD) {
        if (phaseRef.current === PHASES.SILENCE_COUNTDOWN) {
          setPhase(PHASES.LISTENING);
          phaseRef.current = PHASES.LISTENING;
          clearTimeout(silenceTimerRef.current);
          clearInterval(countdownIntervalRef.current);
        }
        resetSilenceTimer();
      }

      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
  }, []);

  const resetSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(8);

    silenceTimerRef.current = setTimeout(() => {
      if (phaseRef.current === PHASES.LISTENING || phaseRef.current === PHASES.SILENCE_COUNTDOWN) {
        autoSubmitAnswer();
      }
    }, SILENCE_TIMEOUT);

    let cd = 8;
    countdownIntervalRef.current = setInterval(() => {
      cd--;
      setSilenceCountdown(cd);
      if (cd <= 3 && phaseRef.current === PHASES.LISTENING) {
        setPhase(PHASES.SILENCE_COUNTDOWN);
        phaseRef.current = PHASES.SILENCE_COUNTDOWN;
      }
      if (cd <= 0) clearInterval(countdownIntervalRef.current);
    }, 1000);
  }, []);

  const autoSubmitAnswer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownIntervalRef.current);
    cancelAnimationFrame(animFrameRef.current);
    try { recognitionRef.current?.stop(); } catch (e) {}
    
    setPhase(PHASES.SAVING);
    phaseRef.current = PHASES.SAVING;

    const answer = transcriptRef.current.trim() || '(No spoken answer recorded)';
    const qIdx = currentQuestionRef.current;
    
    dispatch({ type: 'SET_ANSWER', payload: { questionIndex: qIdx, answer } });

    setTimeout(() => {
      if (qIdx >= (questions?.length || 1) - 1) {
        handleFinalSubmit({ ...answers, [qIdx]: answer });
      } else {
        dispatch({ type: 'NEXT_QUESTION' });
        setTranscript('');
        setInterimText('');
        transcriptRef.current = '';
      }
    }, 700);
  }, [answers, questions, dispatch]);

  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (e) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else interim += e.results[i][0].transcript;
      }
      if (final) {
        setTranscript(p => p + final);
        transcriptRef.current = transcriptRef.current + final;
      }
      setInterimText(interim);
    };

    recognition.onend = () => {
      setInterimText('');
      if (phaseRef.current === PHASES.LISTENING || phaseRef.current === PHASES.SILENCE_COUNTDOWN) {
        try { recognition.start(); } catch (err) {}
      }
    };

    recognitionRef.current = recognition;
  }, []);

  const speakQuestion = useCallback((text, onDone) => {
    if (!synthRef.current) return;
    synthRef.current.cancel();
    try { recognitionRef.current?.stop(); } catch (e) {}
    cancelAnimationFrame(animFrameRef.current);
    setPhase(PHASES.AI_SPEAKING);
    setTranscript('');
    setInterimText('');
    transcriptRef.current = '';

    const utt = new SpeechSynthesisUtterance(text);
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google'))
      || voices.find(v => v.lang.startsWith('en'))
      || voices[0];
      
    if (preferred) utt.voice = preferred;
    utt.rate = 0.95;

    utt.onend = () => {
      if (onDone) { onDone(); return; }
      setPhase(PHASES.LISTENING);
      phaseRef.current = PHASES.LISTENING;
      try { recognitionRef.current?.start(); } catch (e) {}
      resetSilenceTimer();
      startAudioMonitor();
    };

    synthRef.current.speak(utt);
  }, [resetSilenceTimer, startAudioMonitor]);

  useEffect(() => {
    if (phase === PHASES.INTRO || !question) return;
    const qText = question?.text || question || '';
    speakQuestion(`Question ${currentQuestion + 1}. ${qText}`);
  }, [currentQuestion]);

  const startInterview = () => {
    speakQuestion(
      `Hello! I will ask you ${questions?.length || 0} questions. After each question, speak your answer clearly. I will detect silence and move to the next question automatically. Let's begin.`,
      () => {
        const q = questions?.[0];
        if (q) {
          const qText = q.text || q;
          speakQuestion(`Question 1. ${qText}`);
        } else {
           setPhase(PHASES.DONE);
           handleFinalSubmit({});
        }
      }
    );
  };

  const handleFinalSubmit = async (finalAnswers) => {
    setPhase(PHASES.DONE);
    setSubmitting(true);
    if (synthRef.current) synthRef.current.cancel();
    
    speakQuestion(
      "The interview is complete. Your responses are being evaluated.",
      async () => {
        try {
          await submitAssessment(sessionId, finalAnswers || answers, 0, elapsed);
        } catch (e) {
          console.error(e);
        } finally {
          streamRef.current?.getTracks().forEach(t => t.stop());
          setSubmitting(false);
          navigate('/results');
        }
      }
    );
  };

  const progress = questions?.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const questionText = question?.text || question || '';

  const bars = Array.from({ length: 12 }, (_, i) => {
    const center = 6;
    const dist = Math.abs(i - center);
    const baseHeight = Math.max(4, audioLevel * (1 - dist / 6) * 0.7);
    return Math.min(baseHeight, 48);
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0F1E 0%, #121827 60%, #0A0F1E 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontSans: "'Inter', sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600 }}>LIVE INTERVIEW</span>
          <span style={{ color: '#334155', fontSize: 13, fontFamily: 'monospace' }}>{formatTime(elapsed)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#475569', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '5px 12px' }}>
          Q {currentQuestion + 1} / {questions?.length || 0}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>
        <div style={{
          background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: 20, border: '1px solid #1E293B',
          minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32
        }}>
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{ width: 96, height: 96, borderRadius: '50%', background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>
              🤖
            </div>
            <div style={{ position: 'absolute', bottom: 4, right: 4, width: 24, height: 24, borderRadius: '50%', background: phase === PHASES.AI_SPEAKING ? '#3B82F6' : (phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) ? '#10B981' : '#475569', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {phase === PHASES.AI_SPEAKING ? <Volume2 size={12} color="white" /> : <Mic size={12} color="white" />}
            </div>
          </div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', border: '1px solid #334155', borderRadius: 999, padding: '5px 14px', marginBottom: 24 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
              {phase === PHASES.INTRO && 'Ready'}
              {phase === PHASES.AI_SPEAKING && 'AI Speaking...'}
              {phase === PHASES.LISTENING && 'Listening...'}
              {phase === PHASES.SILENCE_COUNTDOWN && `Submitting in ${silenceCountdown}s`}
              {phase === PHASES.SAVING && 'Saved'}
              {phase === PHASES.DONE && 'Complete'}
            </span>
          </div>

          {questionText && phase !== PHASES.INTRO && (
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: '16px 20px', width: '100%', maxWidth: 440, textAlign: 'center' }}>
              <p style={{ fontSize: 15, color: '#E2E8F0', lineHeight: 1.7, margin: 0 }}>{questionText}</p>
            </div>
          )}

          {phase === PHASES.INTRO && (
            <button onClick={startInterview} style={{ marginTop: 16, padding: '14px 36px', borderRadius: 14, background: '#4F46E5', color: 'white', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
               Start Interview
            </button>
          )}

          {phase === PHASES.SILENCE_COUNTDOWN && (
            <div style={{ width: '100%', maxWidth: 320, marginTop: 20 }}>
              <div style={{ height: 3, background: '#1E293B', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(silenceCountdown / 8) * 100}%`, background: '#EF4444', transition: 'width 1s linear' }} />
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#0A0F1E', borderRadius: 16, border: '1px solid #1E293B', overflow: 'hidden', aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
          </div>

          {(phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 56, background: '#0F172A', borderRadius: 12 }}>
              {bars.map((h, i) => (
                <div key={i} style={{ width: 4, height: `${h}px`, borderRadius: 99, background: '#10B981', transition: 'height 0.1s ease', minHeight: 4 }} />
              ))}
            </div>
          )}

          <div style={{ background: '#0F172A', borderRadius: 14, padding: 14, border: '1px solid #1E293B', minHeight: 90 }}>
            {transcript || interimText ? (
              <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>
                {transcript} <span style={{ color: '#475569' }}>{interimText}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#1E293B', fontStyle: 'italic', margin: 0 }}>
                 {phase === PHASES.LISTENING ? 'Speak now...' : 'Waiting...'}
              </p>
            )}
          </div>
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ height: 2, background: '#1E293B', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#4F46E5', transition: 'width 0.6s ease' }} />
        </div>
        {submitting && (
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#475569', fontSize: 13 }}>
             <Loader size={14} className="spin" /> Processing...
           </div>
        )}
        <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 12 }}>
          🤖 Fully voice-controlled • No keyboard or mouse needed
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.45;} }
        @keyframes spin { to{ transform:rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
