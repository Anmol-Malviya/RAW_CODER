import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX, Loader, CheckCircle, ChevronRight } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAssessment } from '../context/AssessmentContext';
import { submitAssessment } from '../services/api';

const PHASES = { INTRO: 'intro', SPEAKING: 'speaking', LISTENING: 'listening', THINKING: 'thinking', DONE: 'done' };

export default function VoiceInterviewPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();
  const { questions, currentQuestion, answers, sessionId, jobRole } = state;
  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;

  const [phase, setPhase] = useState(PHASES.INTRO);
  const [transcript, setTranscript] = useState('');
  const [interimText, setInterimText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [answerSaved, setAnswerSaved] = useState(false);

  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const streamRef = useRef(null);

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  // Setup camera
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
      streamRef.current = stream;
      if (videoRef.current) videoRef.current.srcObject = stream;

      // Socket for proctoring
      socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'https://raw-coder-backend.onrender.com');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const interval = setInterval(() => {
        if (videoRef.current?.readyState === 4) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          socketRef.current?.emit('candidate_frame', {
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
    };
  }, []);

  // Setup Speech Recognition
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
      if (final) setTranscript(p => p + final);
      setInterimText(interim);
    };

    recognition.onerror = () => setPhase(p => p === PHASES.LISTENING ? PHASES.THINKING : p);
    recognition.onend = () => setInterimText('');
    recognitionRef.current = recognition;
  }, []);

  // Speak a text and then start listening
  const speakAndListen = useCallback((text, afterSpeak) => {
    setPhase(PHASES.SPEAKING);
    setAiMessage(text);
    synthRef.current.cancel();
    recognitionRef.current?.stop();

    const utt = new SpeechSynthesisUtterance(text);
    // Try to get a good voice
    const voices = synthRef.current.getVoices();
    const preferred = voices.find(v => v.name.includes('Google') && v.lang.startsWith('en')) || voices[0];
    if (preferred) utt.voice = preferred;
    utt.rate = 0.95;
    utt.pitch = 1.0;

    utt.onend = () => {
      if (afterSpeak) afterSpeak();
      else startListening();
    };
    synthRef.current.speak(utt);
  }, []);

  const startListening = useCallback(() => {
    setPhase(PHASES.LISTENING);
    setTranscript('');
    setInterimText('');
    try { recognitionRef.current?.start(); } catch (e) {}
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Start interview after intro
  const startInterview = () => {
    speakAndListen(`Hello! Welcome to your AI interview for the ${jobRole || 'position'}. I will ask you ${questions.length} questions. Please answer each one by speaking clearly. Let's begin with question number 1.`);
  };

  // When question changes, AI speaks it
  useEffect(() => {
    if (phase !== PHASES.INTRO && question) {
      speakAndListen(`Question ${currentQuestion + 1}. ${question.text || question}`);
    }
  }, [currentQuestion]);

  // Save answer for current question and move to next
  const handleNextQuestion = async () => {
    stopListening();
    synthRef.current.cancel();
    const answer = transcript.trim() || '(No spoken answer recorded)';
    dispatch({ type: 'SET_ANSWER', payload: { questionIndex: currentQuestion, answer } });
    setAnswerSaved(true);

    setTimeout(() => {
      setAnswerSaved(false);
      if (isLastQuestion) {
        handleSubmit(answer);
      } else {
        dispatch({ type: 'NEXT_QUESTION' });
        setTranscript('');
        setInterimText('');
      }
    }, 800);
  };

  const handleSubmit = async (lastAnswer) => {
    setPhase(PHASES.DONE);
    setSubmitting(true);
    synthRef.current.cancel();
    speakAndListen("Thank you for your answers! Your interview is now complete. Please wait while I process your results.", async () => {
      try {
        const finalAnswers = { ...answers, [questions.length - 1]: lastAnswer || transcript };
        await submitAssessment(sessionId, finalAnswers, 0, elapsed);
        streamRef.current?.getTracks().forEach(t => t.stop());
        navigate('/results');
      } catch (e) {
        console.error(e);
        navigate('/results');
      } finally {
        setSubmitting(false);
      }
    });
  };

  const toggleMute = () => {
    setIsMuted(m => {
      const newVal = !m;
      if (newVal) { synthRef.current.cancel(); stopListening(); }
      else if (phase === PHASES.LISTENING) { try { recognitionRef.current?.start(); } catch (e) {} }
      return newVal;
    });
  };

  const endInterview = () => {
    synthRef.current.cancel();
    stopListening();
    streamRef.current?.getTracks().forEach(t => t.stop());
    navigate('/candidate');
  };

  const progress = questions.length ? ((currentQuestion + 1) / questions.length) * 100 : 0;

  // Phase indicator details
  const phaseConfig = {
    [PHASES.INTRO]: { label: 'Ready to Begin', color: '#6366F1', pulse: false },
    [PHASES.SPEAKING]: { label: 'AI Speaking...', color: '#3B82F6', pulse: true },
    [PHASES.LISTENING]: { label: '🎤 Listening...', color: '#10B981', pulse: true },
    [PHASES.THINKING]: { label: 'Processing...', color: '#F59E0B', pulse: true },
    [PHASES.DONE]: { label: 'Interview Complete', color: '#10B981', pulse: false },
  };
  const pConf = phaseConfig[phase] || phaseConfig[PHASES.INTRO];

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* Top bar */}
      <div style={{ width: '100%', maxWidth: 900, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#EF4444', animation: 'pulse 1.5s infinite' }} />
          <span style={{ color: '#94A3B8', fontSize: 14, fontWeight: 500 }}>LIVE INTERVIEW</span>
          <span style={{ color: '#475569', fontSize: 14, fontFamily: 'monospace' }}>{formatTime(elapsed)}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#1E293B', border: '1px solid #334155', borderRadius: 8, padding: '6px 12px' }}>
          <span style={{ color: '#64748B', fontSize: 12 }}>Q {currentQuestion + 1} / {questions.length}</span>
        </div>
      </div>

      {/* Main video + AI area */}
      <div style={{ width: '100%', maxWidth: 900, display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, marginBottom: 16 }}>

        {/* AI Interviewer Panel */}
        <div style={{ background: 'linear-gradient(145deg, #1E293B, #0F172A)', borderRadius: 20, border: '1px solid #334155', overflow: 'hidden', position: 'relative', minHeight: 420, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32 }}>

          {/* AI Avatar */}
          <div style={{ position: 'relative', marginBottom: 24 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 40,
              boxShadow: phase === PHASES.SPEAKING ? '0 0 0 12px rgba(79,70,229,0.2), 0 0 0 24px rgba(79,70,229,0.1)' : '0 0 0 4px rgba(79,70,229,0.3)',
              transition: 'box-shadow 0.3s ease'
            }}>
              🤖
            </div>
            {phase === PHASES.SPEAKING && (
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#3B82F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Volume2 size={12} color="white" />
              </div>
            )}
            {phase === PHASES.LISTENING && (
              <div style={{ position: 'absolute', bottom: 4, right: 4, width: 22, height: 22, borderRadius: '50%', background: '#10B981', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'pulse 1s infinite' }}>
                <Mic size={12} color="white" />
              </div>
            )}
          </div>

          <p style={{ fontSize: 13, fontWeight: 600, color: '#94A3B8', marginBottom: 8, letterSpacing: '0.05em', textTransform: 'uppercase' }}>AI Interviewer</p>

          {/* Status badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.05)', border: `1px solid ${pConf.color}40`, borderRadius: 999, padding: '4px 12px', marginBottom: 20 }}>
            {pConf.pulse && <div style={{ width: 6, height: 6, borderRadius: '50%', background: pConf.color, animation: 'pulse 1s infinite' }} />}
            <span style={{ fontSize: 12, color: pConf.color, fontWeight: 600 }}>{pConf.label}</span>
          </div>

          {/* Question text */}
          {question && phase !== PHASES.INTRO && (
            <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid #334155', borderRadius: 12, padding: 16, width: '100%', maxWidth: 420 }}>
              <p style={{ fontSize: 11, color: '#475569', marginBottom: 6, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Question {currentQuestion + 1}</p>
              <p style={{ fontSize: 15, color: '#F1F5F9', lineHeight: 1.6 }}>{question.text || question}</p>
            </div>
          )}

          {phase === PHASES.INTRO && (
            <button
              onClick={startInterview}
              style={{ marginTop: 16, padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', border: 'none', fontSize: 15, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 8px 24px rgba(79,70,229,0.4)', transition: 'transform 0.2s' }}
              onMouseOver={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              🎙️ Start Interview
            </button>
          )}
        </div>

        {/* Candidate Camera */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ background: '#0F172A', borderRadius: 16, border: '1px solid #334155', overflow: 'hidden', position: 'relative', aspectRatio: '4/3' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }} />
            <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', borderRadius: 6, padding: '3px 8px', fontSize: 11, color: 'white', fontWeight: 600 }}>YOU</div>
          </div>

          {/* Live Transcript */}
          <div style={{ flex: 1, background: '#0F172A', borderRadius: 16, border: `1px solid ${phase === PHASES.LISTENING ? '#10B98150' : '#334155'}`, padding: 14, minHeight: 120, transition: 'border-color 0.3s' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#475569', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Your Answer</p>
            {transcript || interimText ? (
              <p style={{ fontSize: 13, color: '#F1F5F9', lineHeight: 1.7 }}>
                {transcript}
                <span style={{ color: '#64748B' }}>{interimText}</span>
              </p>
            ) : (
              <p style={{ fontSize: 13, color: '#334155', fontStyle: 'italic' }}>
                {phase === PHASES.LISTENING ? 'Speak now...' : 'Waiting for your response...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ width: '100%', maxWidth: 900, height: 3, background: '#1E293B', borderRadius: 99, marginBottom: 16, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: 'linear-gradient(90deg, #4F46E5, #7C3AED)', borderRadius: 99, transition: 'width 0.5s ease' }} />
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Mute / Unmute */}
        <button
          onClick={toggleMute}
          style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: isMuted ? '#EF4444' : '#1E293B', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', border: '1px solid #334155' }}
        >
          {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
        </button>

        {/* Next / Submit button */}
        {phase === PHASES.LISTENING && (
          <button
            onClick={handleNextQuestion}
            disabled={answerSaved}
            style={{ padding: '14px 28px', borderRadius: 12, background: answerSaved ? '#10B981' : 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: 'white', border: 'none', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, boxShadow: '0 4px 16px rgba(79,70,229,0.35)', transition: 'all 0.2s' }}
          >
            {answerSaved ? <><CheckCircle size={18} /> Saved!</> : isLastQuestion ? <>Submit Interview</> : <>Next Question <ChevronRight size={18} /></>}
          </button>
        )}

        {submitting && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#94A3B8', fontSize: 14 }}>
            <Loader size={16} style={{ animation: 'spin 1s linear infinite' }} />
            Processing results...
          </div>
        )}

        {/* End call */}
        <button
          onClick={endInterview}
          style={{ width: 52, height: 52, borderRadius: '50%', border: 'none', background: '#EF4444', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}
        >
          <PhoneOff size={20} />
        </button>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
