import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Volume2, Loader } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAssessment } from '../context/AssessmentContext';
import { submitAssessment } from '../services/api';

const SILENCE_TIMEOUT = 8000; // 8 seconds of silence → auto submit
const SILENCE_THRESHOLD = 10; // audio level below this = silence

const PHASES = {
  INTRO: 'intro',
  AI_SPEAKING: 'ai_speaking',
  LISTENING: 'listening',
  SILENCE_COUNTDOWN: 'countdown', // user stopped, counting down
  SAVING: 'saving',
  DONE: 'done',
};

export default function VoiceInterviewPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();
  const { questions, currentQuestion, answers, sessionId, jobRole } = state;
  const question = questions?.[currentQuestion];
  const isLastQuestion = currentQuestion === (questions?.length || 0) - 1;

  const [phase, setPhase] = useState(PHASES.INTRO);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const [silenceCountdown, setSilenceCountdown] = useState(8);
  const [audioLevel, setAudioLevel] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [savedAnswers, setSavedAnswers] = useState({});

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  // Silence detection refs
  const silenceTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animFrameRef = useRef(null);
  const transcriptRef = useRef('');
  const phaseRef = useRef(PHASES.INTRO);
  const currentQuestionRef = useRef(currentQuestion);

  // Keep refs in sync
  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { currentQuestionRef.current = currentQuestion; }, [currentQuestion]);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Setup camera + socket proctoring
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // AudioContext for silence detection
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        const source = ctx.createMediaStreamSource(stream);
        source.connect(analyser);
        audioContextRef.current = ctx;
        analyserRef.current = analyser;
      }

      // Socket proctoring
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
    }).catch(console.error);

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      socketRef.current?.disconnect();
      audioContextRef.current?.close();
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Audio level monitor loop — runs while listening
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
        // User is speaking — reset silence timer
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

  // Reset silence countdown timer
  const resetSilenceTimer = useCallback(() => {
    clearTimeout(silenceTimerRef.current);
    clearInterval(countdownIntervalRef.current);
    setSilenceCountdown(8);

    silenceTimerRef.current = setTimeout(() => {
      // User silent for SILENCE_TIMEOUT — auto submit this answer
      if (phaseRef.current === PHASES.LISTENING || phaseRef.current === PHASES.SILENCE_COUNTDOWN) {
        autoSubmitAnswer();
      }
    }, SILENCE_TIMEOUT);

    // Start countdown visual at 3 seconds before submit
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
    recognitionRef.current?.stop();
    setPhase(PHASES.SAVING);
    phaseRef.current = PHASES.SAVING;

    const answer = transcriptRef.current.trim() || '(No spoken answer recorded)';
    const qIdx = currentQuestionRef.current;
    dispatch({ type: 'SET_ANSWER', payload: { questionIndex: qIdx, answer } });
    setSavedAnswers(prev => ({ ...prev, [qIdx]: answer }));

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
  }, [answers, questions]);

  // Speech Recognition setup
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

    recognition.onerror = (e) => {
      if (e.error !== 'no-speech') console.error('SR Error:', e.error);
    };

    recognition.onend = () => {
      setInterimText('');
      // Auto-restart if still listening
      if (phaseRef.current === PHASES.LISTENING || phaseRef.current === PHASES.SILENCE_COUNTDOWN) {
        try { recognition.start(); } catch (err) {}
      }
    };

    recognitionRef.current = recognition;
  }, []);

  // AI Speaks then auto-starts mic
  const speakQuestion = useCallback((text, onDone) => {
    synthRef.current.cancel();
    recognitionRef.current?.stop();
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
    utt.rate = 0.92;
    utt.pitch = 1.0;

    utt.onend = () => {
      if (onDone) { onDone(); return; }
      // Auto-start mic after AI finishes speaking
      setPhase(PHASES.LISTENING);
      phaseRef.current = PHASES.LISTENING;
      try { recognitionRef.current?.start(); } catch (e) {}
      resetSilenceTimer();
      startAudioMonitor();
    };

    synthRef.current.speak(utt);
  }, [resetSilenceTimer, startAudioMonitor]);

  // When question changes, AI speaks it automatically
  useEffect(() => {
    if (phase === PHASES.INTRO || !question) return;
    const qText = question.text || question;
    const qNum = currentQuestion + 1;
    speakQuestion(`Question ${qNum}. ${qText}`);
  }, [currentQuestion]);

  const startInterview = () => {
    setPhase(PHASES.AI_SPEAKING);
    speakQuestion(
      `Hello! Welcome to your AI interview for ${jobRole || 'this position'}. I will ask you ${questions?.length || 0} questions. After I finish each question, your microphone will automatically turn on. Please answer by speaking clearly. There is no need to press any button — just speak your answer. I will detect when you are done and move to the next question automatically. Let's begin.`,
      () => {
        // After intro, speak first question
        const q = questions?.[0];
        if (q) {
          const qText = q.text || q;
          speakQuestion(`Question 1. ${qText}`);
        }
      }
    );
  };

  const handleFinalSubmit = async (finalAnswers) => {
    setPhase(PHASES.DONE);
    setSubmitting(true);
    synthRef.current.cancel();
    speakQuestion(
      "Thank you for completing the interview. Your responses are being evaluated. Please wait.",
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

  // No end button — interview is purely voice driven

  const progress = questions?.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;
  const questionText = question?.text || question || '';

  // Visual audio bars
  const barCount = 12;
  const bars = Array.from({ length: barCount }, (_, i) => {
    const center = barCount / 2;
    const dist = Math.abs(i - center);
    const baseHeight = Math.max(4, audioLevel * (1 - dist / center) * 0.7);
    return Math.min(baseHeight, 48);
  });

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0A0F1E 0%, #121827 60%, #0A0F1E 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      padding: 24, fontFamily: "'Inter', system-ui, sans-serif"
    }}>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', boxShadow: '0 0 8px #EF4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#64748B', fontSize: 13, fontWeight: 600, letterSpacing: '0.05em' }}>LIVE INTERVIEW</span>
          <span style={{ color: '#334155', fontSize: 13, fontFamily: 'monospace' }}>{formatTime(elapsed)}</span>
        </div>
        <div style={{ fontSize: 12, color: '#475569', background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '5px 12px' }}>
          Q {currentQuestion + 1} / {questions?.length || 0}
        </div>
      </div>

      {/* Main layout */}
      <div style={{ width: '100%', maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, marginBottom: 16 }}>

        {/* Left: AI + Status */}
        <div style={{
          background: 'linear-gradient(160deg, #1E293B 0%, #0F172A 100%)',
          borderRadius: 20, border: '1px solid #1E293B',
          overflow: 'hidden', position: 'relative', minHeight: 420,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32
        }}>

          {/* AI Avatar with audio ring */}
          <div style={{ position: 'relative', marginBottom: 28 }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 38,
              boxShadow: phase === PHASES.AI_SPEAKING
                ? '0 0 0 8px rgba(79,70,229,0.25), 0 0 0 20px rgba(79,70,229,0.1)'
                : '0 0 0 4px rgba(79,70,229,0.2)',
              transition: 'box-shadow 0.4s ease'
            }}>
              🤖
            </div>
            {/* Status dot */}
            <div style={{
              position: 'absolute', bottom: 4, right: 4,
              width: 24, height: 24, borderRadius: '50%',
              background: phase === PHASES.AI_SPEAKING ? '#3B82F6'
                : (phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) ? '#10B981'
                : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 0.3s'
            }}>
              {phase === PHASES.AI_SPEAKING && <Volume2 size={12} color="white" />}
              {(phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) && <Mic size={12} color="white" />}
            </div>
          </div>

          <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 8 }}>AI Interviewer</p>

          {/* Status label */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.04)', border: `1px solid ${phase === PHASES.AI_SPEAKING ? '#3B82F680'
              : phase === PHASES.LISTENING ? '#10B98180'
              : phase === PHASES.SILENCE_COUNTDOWN ? '#EF444480'
              : '#33415580'}`,
            borderRadius: 999, padding: '5px 14px', marginBottom: 24, transition: 'all 0.3s'
          }}>
            {(phase === PHASES.AI_SPEAKING || phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) && (
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: phase === PHASES.AI_SPEAKING ? '#3B82F6'
                  : phase === PHASES.SILENCE_COUNTDOWN ? '#EF4444' : '#10B981',
                animation: 'pulse 1s infinite'
              }} />
            )}
            <span style={{
              fontSize: 12, fontWeight: 600,
              color: phase === PHASES.AI_SPEAKING ? '#60A5FA'
                : phase === PHASES.LISTENING ? '#34D399'
                : phase === PHASES.SILENCE_COUNTDOWN ? '#FCA5A5'
                : '#94A3B8'
            }}>
              {phase === PHASES.INTRO && 'Ready to Begin'}
              {phase === PHASES.AI_SPEAKING && 'AI Speaking...'}
              {phase === PHASES.LISTENING && '🎤 Listening — Speak now'}
              {phase === PHASES.SILENCE_COUNTDOWN && `⏳ Auto-submit in ${silenceCountdown}s`}
              {phase === PHASES.SAVING && '✅ Answer Saved'}
              {phase === PHASES.DONE && 'Interview Complete'}
            </span>
          </div>

          {/* Question text */}
          {questionText && phase !== PHASES.INTRO && (
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid #1E293B',
              borderRadius: 14, padding: '16px 20px',
              width: '100%', maxWidth: 440,
              backdropFilter: 'blur(8px)'
            }}>
              <p style={{ fontSize: 11, color: '#475569', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                Question {currentQuestion + 1} of {questions?.length}
              </p>
              <p style={{ fontSize: 15, color: '#E2E8F0', lineHeight: 1.7, margin: 0 }}>{questionText}</p>
            </div>
          )}

          {/* Start button */}
          {phase === PHASES.INTRO && (
            <button
              onClick={startInterview}
              style={{
                marginTop: 16, padding: '14px 36px',
                borderRadius: 14, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                color: 'white', border: 'none', fontSize: 15, fontWeight: 700,
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
                transition: 'transform 0.2s, box-shadow 0.2s'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'scale(1.04)'; e.currentTarget.style.boxShadow = '0 12px 32px rgba(79,70,229,0.5)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(79,70,229,0.4)'; }}
            >
              🎙️ Start Voice Interview
            </button>
          )}

          {/* Silence countdown progress */}
          {phase === PHASES.SILENCE_COUNTDOWN && (
            <div style={{ width: '100%', maxWidth: 320, marginTop: 20 }}>
              <div style={{ height: 3, background: '#1E293B', borderRadius: 99, overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  width: `${(silenceCountdown / 8) * 100}%`,
                  background: 'linear-gradient(90deg, #EF4444, #F59E0B)',
                  borderRadius: 99, transition: 'width 1s linear'
                }} />
              </div>
              <p style={{ fontSize: 11, color: '#64748B', textAlign: 'center', marginTop: 6 }}>
                Silence detected — auto-submitting in {silenceCountdown}s (speak to continue)
              </p>
            </div>
          )}
        </div>

        {/* Right: Camera + Transcript */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Camera */}
          <div style={{ background: '#0A0F1E', borderRadius: 16, border: '1px solid #1E293B', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'white', fontWeight: 600 }}>YOU</div>

            {/* Mic status indicator on camera */}
            {(phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) && (
              <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(16,185,129,0.9)', borderRadius: 6, padding: '3px 8px' }}>
                <div style={{ width: 5, height: 5, borderRadius: '50%', background: 'white', animation: 'pulse 0.8s infinite' }} />
                <span style={{ fontSize: 10, color: 'white', fontWeight: 700 }}>MIC ON</span>
              </div>
            )}
            {phase === PHASES.AI_SPEAKING && (
              <div style={{ position: 'absolute', bottom: 8, right: 8, display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(0,0,0,0.7)', borderRadius: 6, padding: '3px 8px' }}>
                <MicOff size={10} color="#64748B" />
                <span style={{ fontSize: 10, color: '#64748B', fontWeight: 700 }}>MIC OFF</span>
              </div>
            )}
          </div>

          {/* Audio waveform visualizer */}
          {(phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN) && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, height: 56, background: '#0F172A', borderRadius: 12, border: `1px solid ${phase === PHASES.SILENCE_COUNTDOWN ? '#EF444440' : '#10B98140'}` }}>
              {bars.map((h, i) => (
                <div key={i} style={{
                  width: 4, height: `${h}px`,
                  borderRadius: 99,
                  background: phase === PHASES.SILENCE_COUNTDOWN
                    ? `rgba(239,68,68,${0.4 + (h / 48) * 0.6})`
                    : `rgba(16,185,129,${0.4 + (h / 48) * 0.6})`,
                  transition: 'height 0.1s ease',
                  minHeight: 4
                }} />
              ))}
            </div>
          )}

          {/* Live Transcript */}
          <div style={{
            flex: 1, background: '#0F172A',
            borderRadius: 14, padding: 14,
            border: `1px solid ${phase === PHASES.LISTENING ? '#10B98130' : phase === PHASES.SILENCE_COUNTDOWN ? '#EF444430' : '#1E293B'}`,
            minHeight: 90, transition: 'border-color 0.3s'
          }}>
            <p style={{ fontSize: 10, fontWeight: 700, color: '#334155', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Transcript</p>
            {transcript || interimText ? (
              <p style={{ fontSize: 13, color: '#CBD5E1', lineHeight: 1.7, margin: 0 }}>
                {transcript}
                <span style={{ color: '#475569' }}>{interimText}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#1E293B', fontStyle: 'italic', margin: 0 }}>
                {phase === PHASES.LISTENING || phase === PHASES.SILENCE_COUNTDOWN ? 'Speak to answer...' : 'Waiting...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress + controls */}
      <div style={{ width: '100%', maxWidth: 900 }}>
        <div style={{ height: 2, background: '#1E293B', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', borderRadius: 99, transition: 'width 0.6s ease' }} />
        </div>

        <p style={{ textAlign: 'center', fontSize: 12, color: '#334155', marginTop: 12 }}>
          🤖 Mic auto-activates after each question &nbsp;•&nbsp; Silence for 8s = auto-next
        </p>
      </div>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.45;} }
        @keyframes spin { to{ transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
