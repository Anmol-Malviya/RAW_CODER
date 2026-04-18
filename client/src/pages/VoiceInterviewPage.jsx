import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, Loader, AlertCircle, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAssessment } from '../context/AssessmentContext';
import { submitAssessment } from '../services/api';

const SILENCE_TIMEOUT = 8000;
const SILENCE_THRESHOLD = 5; // Lowered threshold to be more sensitive

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
  
  if (!context) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#F8FAFC', color: '#0F172A' }}>
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
  const [micError, setMicError] = useState(false);

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
            console.error("AudioContext error", e);
          }
        }

        const socket = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://raw-coder-backend.onrender.com');
        socketRef.current = socket;
        
        const canvas = document.createElement('canvas');
        const ctx2 = canvas.getContext('2d');
        const interval = setInterval(() => {
          if (videoRef.current?.readyState === 4) {
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
        setMicError(true);
        console.error("Mic/Cam access denied", err);
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
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;
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
        // The useEffect for currentQuestion will trigger the next question speech
      }
    }, 800);
  }, [answers, questions, dispatch]);

  const toggleMicManual = () => {
    if (phase === PHASES.LISTENING) {
      try { recognitionRef.current?.stop(); } catch (e) {}
      try { recognitionRef.current?.start(); } catch (e) {}
    }
  };

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
    const preferred = voices.find(v => v.lang.startsWith('en') && v.name.includes('Google')) || voices[0];
      
    if (preferred) utt.voice = preferred;
    utt.rate = 1.0;

    const finalizeSpeech = () => {
      if (onDone) { onDone(); return; }
      setPhase(PHASES.LISTENING);
      phaseRef.current = PHASES.LISTENING;
      try { 
        recognitionRef.current?.start(); 
        setMicError(false);
      } catch (e) {
        console.warn("Mic start failed", e);
      }
      resetSilenceTimer();
      startAudioMonitor();
    };

    utt.onend = finalizeSpeech;
    utt.onerror = finalizeSpeech; // Fallback for speech errors
    
    // Manual fallback if onend never fires (rare browser bug)
    const timeoutId = setTimeout(() => {
      if (phaseRef.current === PHASES.AI_SPEAKING) finalizeSpeech();
    }, (text.length * 100) + 2000);

    synthRef.current.speak(utt);
    return () => clearTimeout(timeoutId);
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

  const bars = Array.from({ length: 14 }, (_, i) => {
    const center = 7;
    const dist = Math.abs(i - center);
    const h = Math.max(4, audioLevel * (1 - dist / 7) * 0.8);
    return Math.min(h, 48);
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F8FAFC', // White Theme Background
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, color: '#0F172A',
      fontFamily: "'Inter', sans-serif"
    }}>
      
      {/* Top Header */}
      <div style={{ width: '100%', maxWidth: 960, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite', boxShadow: '0 0 6px #EF4444' }} />
          <span style={{ color: '#64748B', fontSize: 13, fontWeight: 700, letterSpacing: '0.02em' }}>LIVE INTERVIEW</span>
          <span style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>{formatTime(elapsed)}</span>
        </div>
        <div style={{ fontSize: 13, color: '#4F46E5', background: '#EEF2FF', borderRadius: 8, padding: '6px 14px', fontWeight: 700, border: '1px solid #E0E7FF' }}>
          Question {currentQuestion + 1} of {questions?.length || 0}
        </div>
      </div>

      <div style={{ width: '100%', maxWidth: 960, display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20, marginBottom: 20 }}>
        
        {/* Main AI Viewport */}
        <div style={{
          background: '#FFFFFF',
          borderRadius: 24, border: '1px solid #E2E8F0',
          boxShadow: '0 4px 20px -5px rgba(0,0,0,0.05)',
          minHeight: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 40,
          position: 'relative'
        }}>
          
          {/* AI Character */}
          <div style={{ position: 'relative', marginBottom: 32 }}>
            <div style={{ 
              width: 110, height: 110, borderRadius: '50%', 
              background: 'linear-gradient(135deg, #4F46E5, #818CF8)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontSize: 44,
              boxShadow: phase === PHASES.AI_SPEAKING ? '0 0 0 12px rgba(79,70,229,0.1)' : '0 0 0 0px rgba(0,0,0,0)'
            }}>
              🤖
            </div>
            <div style={{ 
              position: 'absolute', bottom: 4, right: 4, 
              width: 28, height: 28, borderRadius: '50%', 
              background: phase === PHASES.AI_SPEAKING ? '#3B82F6' : (phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) ? '#10B981' : '#CBD5E1', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '3px solid #FFFFFF',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
            }}>
              {phase === PHASES.AI_SPEAKING ? <Volume2 size={14} color="white" /> : <Mic size={14} color="white" />}
            </div>
          </div>

          <div style={{ 
            display: 'inline-flex', alignItems: 'center', gap: 8, 
            background: phase === PHASES.AI_SPEAKING ? '#EFF6FF' : phase === PHASES.LISTENING ? '#ECFDF5' : '#F8FAFC',
            border: `1px solid ${phase === PHASES.AI_SPEAKING ? '#DBEAFE' : phase === PHASES.LISTENING ? '#D1FAE5' : '#E2E8F0'}`, 
            borderRadius: 999, padding: '6px 16px', marginBottom: 24 
          }}>
            <span style={{ 
              fontSize: 13, fontWeight: 700, 
              color: phase === PHASES.AI_SPEAKING ? '#2563EB' : phase === PHASES.LISTENING ? '#059669' : '#64748B' 
            }}>
              {phase === PHASES.INTRO && 'Ready to begin'}
              {phase === PHASES.AI_SPEAKING && 'AI Interviewer Speaking...'}
              {phase === PHASES.LISTENING && '🎤 Listening (Mic Active)'}
              {phase === PHASES.SILENCE_COUNTDOWN && `⏳ No sound? Submitting in ${silenceCountdown}s`}
              {phase === PHASES.SAVING && 'Saving Response...'}
              {phase === PHASES.DONE && 'Interview Finished'}
            </span>
          </div>

          {questionText && phase !== PHASES.INTRO && (
            <div style={{ 
              background: '#F8FAFC', 
              borderRadius: 16, border: '1px solid #F1F5F9',
              padding: '24px 32px', width: '100%', maxWidth: 500, textAlign: 'center' 
            }}>
              <p style={{ fontSize: 17, color: '#1E293B', lineHeight: 1.8, fontWeight: 500, margin: 0 }}>{questionText}</p>
            </div>
          )}

          {phase === PHASES.INTRO && (
            <button 
              onClick={startInterview} 
              style={{ 
                marginTop: 16, padding: '16px 44px', borderRadius: 12, 
                background: '#4F46E5', color: 'white', border: 'none', 
                fontWeight: 700, fontSize: 16, cursor: 'pointer',
                boxShadow: '0 10px 15px -3px rgba(79,70,229,0.3)'
              }}>
               🎙️ Start Interview
            </button>
          )}

          {/* Mic Retry Fallback */}
          {phase === PHASES.LISTENING && audioLevel === 0 && (
            <button 
              onClick={toggleMicManual}
              style={{ position: 'absolute', bottom: 20, right: 20, background: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, color: '#64748B' }}
            >
              <RefreshCw size={12} /> Reset Mic
            </button>
          )}
        </div>

        {/* Sidebar: User Camera + Transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          <div style={{ background: '#0F172A', borderRadius: 20, border: '1px solid #E2E8F0', overflow: 'hidden', aspectRatio: '4/3', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: 'white', fontWeight: 700 }}>YOU</div>
          </div>

          {/* Audio Visualizer */}
          {(phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4, height: 64, background: '#FFFFFF', borderRadius: 16, border: '1px solid #E2E8F0' }}>
              {bars.map((h, i) => (
                <div key={i} style={{ width: 5, height: `${h}px`, borderRadius: 99, background: phase === PHASES.SILENCE_COUNTDOWN ? '#EF4444' : '#4F46E5', transition: 'height 0.1s ease', minHeight: 6 }} />
              ))}
            </div>
          )}

          <div style={{ background: '#FFFFFF', borderRadius: 20, padding: 16, border: '1px solid #E2E8F0', flex: 1, minHeight: 120, boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 12 }}>Transcript</p>
            {transcript || interimText ? (
              <p style={{ fontSize: 13, color: '#334155', lineHeight: 1.7, margin: 0 }}>
                {transcript} <span style={{ color: '#94A3B8' }}>{interimText}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#CBD5E1', fontStyle: 'italic', margin: 0 }}>
                 {phase === PHASES.LISTENING ? 'Voice detected here...' : 'Waiting for AI...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Footer Area */}
      <div style={{ width: '100%', maxWidth: 960 }}>
        <div style={{ height: 4, background: '#E2E8F0', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: '#4F46E5', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }} />
        </div>
        
        {submitting && (
           <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: '#64748B', fontSize: 14 }}>
             <Loader size={16} className="spin" /> Finalizing assessment results...
           </div>
        )}
        
        {!submitting && (
          <p style={{ textAlign: 'center', fontSize: 12, color: '#94A3B8', fontWeight: 500 }}>
            🤖 AI-driven Voice Interview • Professional Experience
          </p>
        )}
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }
        @keyframes spin { to{ transform:rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
    </div>
  );
}
