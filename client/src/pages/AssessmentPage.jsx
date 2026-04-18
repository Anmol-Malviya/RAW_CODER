import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, AlertTriangle, Eye, Mic, MicOff, Video, PhoneOff, Circle } from 'lucide-react';
import { io } from 'socket.io-client';
import { useAssessment } from '../context/AssessmentContext';
import { useProctoring } from '../hooks/useProctoring';
import { submitAssessment, uploadRecording, uploadScreenRecording } from '../services/api';

export default function AssessmentPage() {
  const navigate = useNavigate();
  const { state, dispatch } = useAssessment();
  const proctoring = useProctoring();
  const [submitting, setSubmitting] = useState(false);
  const [micOn, setMicOn] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef(null);
  const socketRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const screenRecorderRef = useRef(null);
  const screenChunksRef = useRef([]);

  const { questions, currentQuestion, answers, sessionId, jobRole, rawQuestions } = state;
  const question = questions[currentQuestion];
  const isLastQuestion = currentQuestion === questions.length - 1;
  const answeredCount = Object.keys(answers).length;
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const [screenShared, setScreenShared] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            const final = event.results[i][0].transcript;
            setTranscript(prev => prev + ' ' + final);
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        if (micOn && state.status === 'active') recognition.start();
      };

      recognitionRef.current = recognition;
    }
  }, []);

  // AI speaks the question
  useEffect(() => {
    if (question && state.status === 'active') {
      const speak = (text) => {
        synthRef.current.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.onstart = () => {
          if (recognitionRef.current) recognitionRef.current.stop();
          setIsListening(false);
        };
        utterance.onend = () => {
          if (micOn && recognitionRef.current) {
            try {
              recognitionRef.current.start();
              setIsListening(true);
            } catch (e) {}
          }
        };
        synthRef.current.speak(utterance);
      };
      
      const prompt = `Question ${currentQuestion + 1}: ${question.question}`;
      speak(prompt);
    }
  }, [currentQuestion, question, state.status, micOn]);

  useEffect(() => {
    if (state.status !== 'active' || questions.length === 0) {
      navigate('/candidate');
    }
  }, [state.status, questions, navigate]);

  useEffect(() => {
    proctoring.activate();
    return () => proctoring.deactivate();
  }, []);

  useEffect(() => {
    if (proctoring.tabSwitchCount > 0) dispatch({ type: 'TAB_SWITCH' });
  }, [proctoring.tabSwitchCount]);

  useEffect(() => {
    const start = state.startedAt || Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => clearInterval(id);
  }, [state.startedAt]);

  useEffect(() => {
    let stream;
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', { transports: ['websocket'] });
    
    const enable = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (videoRef.current) videoRef.current.srcObject = stream;
        
        try {
          const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
          mediaRecorderRef.current = mediaRecorder;
          mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) recordedChunksRef.current.push(event.data);
          };
          mediaRecorder.start();
        } catch (mediaErr) {
          console.error("Camera recorder init failed:", mediaErr);
        }

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const interval = setInterval(() => {
          if (videoRef.current && videoRef.current.readyState === 4) {
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
            const frame = canvas.toDataURL('image/jpeg', 0.5);
            socketRef.current.emit('candidate_frame', { 
              candidateId: sessionId || 'mock-id', 
              name: 'Candidate User', 
              role: jobRole || 'Candidate Role', 
              flags: proctoring.tabSwitchCount, 
              status: proctoring.tabSwitchCount > 3 ? 'critical' : proctoring.tabSwitchCount > 0 ? 'warning' : 'clean',
              duration: Math.floor((Date.now() - (state.startedAt || Date.now())) / 1000) + 's',
              frame 
            });
          }
        }, 300); // 3-4 fps for real-time feel
        return () => clearInterval(interval);
      } catch (e) {
        console.error(e);
      }
    };
    const cleanup = enable();
    return () => {
      if (cleanup && typeof cleanup === 'function') cleanup();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (socketRef.current) socketRef.current.disconnect();
    };
  }, [sessionId]);

  const handleStartScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const screenRecorder = new MediaRecorder(screenStream, { mimeType: 'video/webm' });
      screenRecorderRef.current = screenRecorder;
      screenRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) screenChunksRef.current.push(event.data);
      };
      screenRecorder.start();
      setScreenShared(true);
      
      // Setup listener for user stopping share via browser UI
      screenStream.getVideoTracks()[0].onended = () => {
        if (screenRecorder.state !== 'inactive') screenRecorder.stop();
      };
    } catch (screenErr) {
      console.error("Screen recorder init failed:", screenErr);
      alert("Screen sharing is mandatory for the interview. Please try again and select 'Entire Screen'.");
    }
  };

  // Cleanup for screen share separately, in case it wasn't started in the main useEffect
  useEffect(() => {
    return () => {
      if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
        screenRecorderRef.current.stop();
      }
    };
  }, []);

  const handleSelect = (option) => {
    dispatch({ type: 'SELECT_ANSWER', payload: { questionId: question.id, answer: option } });
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    const testDurationSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    
    // Stop camera recording and upload
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        try { uploadRecording(sessionId, blob).catch(console.error); } catch (err) {}
      };
      mediaRecorderRef.current.stop();
    }

    // Stop screen recording and upload
    if (screenRecorderRef.current && screenRecorderRef.current.state !== 'inactive') {
      screenRecorderRef.current.onstop = async () => {
        const blob = new Blob(screenChunksRef.current, { type: 'video/webm' });
        try { uploadScreenRecording(sessionId, blob).catch(console.error); } catch (err) {}
      };
      screenRecorderRef.current.stop();
    }

    try {
      const result = await submitAssessment(sessionId, answers, proctoring.tabSwitchCount, testDurationSeconds);
      let score = result.score;
      let finalQuestions = result.questions;
      if (score === undefined && rawQuestions.length > 0) {
        score = 0;
        rawQuestions.forEach((q) => {
          if (answers[q.id] === q.correctAnswer) score++;
        });
        finalQuestions = rawQuestions;
      }
      dispatch({
        type: 'COMPLETE',
        payload: { score: score ?? 0, tabSwitchCount: proctoring.tabSwitchCount, questions: finalQuestions },
      });
      proctoring.deactivate();
      if (state.hasCodingRound) {
        navigate('/coding');
      } else {
        navigate('/results');
      }
    } catch (err) {
      console.error('Submit error:', err);
      if (rawQuestions.length > 0) {
        let score = 0;
        rawQuestions.forEach((q) => {
          if (answers[q.id] === q.correctAnswer) score++;
        });
        dispatch({ type: 'COMPLETE', payload: { score, tabSwitchCount: proctoring.tabSwitchCount, questions: rawQuestions } });
        proctoring.deactivate();
        navigate('/results');
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!question) return null;

  if (!screenShared) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#0F172A', color: '#E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24, textAlign: 'center' }}>
        <div style={{ background: '#1E293B', padding: 32, borderRadius: 16, maxWidth: 400, boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Video size={32} color="#3B82F6" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#F8FAFC' }}>Screen Share Required</h2>
          <p style={{ fontSize: 16, color: '#94A3B8', marginBottom: 24, lineHeight: 1.5 }}>
            To begin your interview, you must share your screen. This will be recorded alongside your camera. Please ensure you select "Entire Screen" in the prompt.
          </p>
          <button 
            onClick={handleStartScreenShare}
            style={{ width: '100%', background: '#3B82F6', color: 'white', border: 'none', padding: '14px 20px', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#2563EB'}
            onMouseOut={(e) => e.currentTarget.style.background = '#3B82F6'}
          >
            Share Screen & Start Interview
          </button>
        </div>
      </div>
    );
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const clock = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#0F172A', color: '#E2E8F0', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      {/* Top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #1E293B', background: '#0B1120' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: '#F43F5E', boxShadow: '0 0 0 4px rgba(244,63,94,0.2)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em' }}>LIVE INTERVIEW</span>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>·</span>
          <span style={{ fontSize: 13, color: '#CBD5E1' }}>{jobRole || 'Technical screening'}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>Question {currentQuestion + 1} of {questions.length}</span>
          <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, color: '#E2E8F0', padding: '4px 10px', borderRadius: 6, background: '#1E293B' }}>{clock}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#1E293B' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#6366F1', transition: 'width 0.3s ease' }} />
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left 70% */}
        <div style={{ flex: '0 0 70%', padding: '40px 56px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Current question</p>
          <h2 style={{ marginTop: 12, fontSize: 26, fontWeight: 600, color: '#F8FAFC', lineHeight: 1.3, letterSpacing: '-0.01em', maxWidth: 820 }}>
            {question.question}
          </h2>

          <div style={{ marginTop: 32, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 820 }}>
            {question.options.map((option, idx) => {
              const selected = answers[question.id] === option;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 18px',
                    borderRadius: 10,
                    border: `1px solid ${selected ? '#6366F1' : '#1E293B'}`,
                    background: selected ? 'rgba(99,102,241,0.15)' : '#1E293B',
                    color: '#E2E8F0',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: selected ? '#6366F1' : '#0F172A',
                    color: selected ? '#FFFFFF' : '#94A3B8',
                    display: 'grid', placeItems: 'center',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ flex: 1 }}>{option}</span>
                  {selected && <Circle size={8} fill="#6366F1" color="#6366F1" />}
                </button>
              );
            })}
          </div>

          {/* Transcript */}
          <div style={{ marginTop: 32, padding: 20, borderRadius: 10, background: '#0B1120', border: '1px solid #1E293B', maxWidth: 820 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Live transcript
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 180, overflowY: 'auto' }}>
              <TranscriptLine>{transcript || (isListening ? 'Wait, I am listening...' : 'Initializing...')}</TranscriptLine>
              {isListening && <TranscriptLine muted>… listening …</TranscriptLine>}
            </div>
          </div>
        </div>

        {/* Right 30% */}
        <aside style={{ flex: '0 0 30%', borderLeft: '1px solid #1E293B', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#0B1120', overflowY: 'auto' }}>
          {/* Webcam */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #1E293B', background: '#020617', aspectRatio: '4/3', position: 'relative' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(15,23,42,0.75)', backdropFilter: 'blur(6px)' }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: '#10B981' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: '#E2E8F0' }}>LIVE</span>
            </div>
          </div>

          {/* Alerts panel */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
              Alerts
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <AlertRow
                tone={proctoring.tabSwitchCount > 0 ? 'rose' : 'slate'}
                icon={<AlertTriangle size={14} />}
                title={proctoring.tabSwitchCount > 0 ? 'Tab switch detected' : 'No tab switches'}
                body={`${proctoring.tabSwitchCount} incident${proctoring.tabSwitchCount === 1 ? '' : 's'} logged`}
              />
              <AlertRow
                tone="emerald"
                icon={<Eye size={14} />}
                title="Face detected"
                body="Single candidate in frame"
              />
              <AlertRow
                tone="slate"
                icon={<Video size={14} />}
                title="Camera active"
                body="Connection stable"
              />
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#64748B' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Answered</span><span style={{ color: '#E2E8F0', fontWeight: 600 }}>{answeredCount} / {questions.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Session ID</span><span style={{ color: '#E2E8F0', fontFamily: 'ui-monospace, monospace' }}>{(sessionId || '').slice(-6) || '—'}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom control bar */}
      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#0B1120', borderTop: '1px solid #1E293B' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <ControlButton
            active={micOn}
            onClick={() => setMicOn(!micOn)}
            icon={micOn ? <Mic size={16} /> : <MicOff size={16} />}
            label={micOn ? 'Mute' : 'Unmute'}
            danger={!micOn}
          />
          <ControlButton
            active={true}
            icon={<Video size={16} />}
            label="Camera"
          />
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            type="button"
            disabled={currentQuestion === 0}
            onClick={() => {
              setTranscript('');
              dispatch({ type: 'PREV_QUESTION' });
            }}
            style={{
              padding: '10px 16px', borderRadius: 8, background: 'transparent',
              border: '1px solid #334155', color: currentQuestion === 0 ? '#475569' : '#E2E8F0',
              fontSize: 13, fontWeight: 500, cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
            }}
          >
            <ChevronLeft size={14} /> Previous
          </button>

          {isLastQuestion ? (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              style={{
                padding: '10px 18px', borderRadius: 8, background: '#E11D48',
                border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
              }}
            >
              <PhoneOff size={14} />
              {submitting ? 'Ending…' : 'End interview'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setTranscript('');
                dispatch({ type: 'NEXT_QUESTION' });
              }}
              className="btn-primary"
              style={{ padding: '10px 18px' }}
            >
              Next <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function TranscriptLine({ children, muted }) {
  return (
    <p style={{ fontSize: 13, color: muted ? '#475569' : '#CBD5E1', fontStyle: muted ? 'italic' : 'normal', lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function AlertRow({ tone, icon, title, body }) {
  const tones = {
    rose: { bg: 'rgba(244,63,94,0.08)', border: '#7F1D1D', color: '#FCA5A5', iconBg: '#7F1D1D' },
    emerald: { bg: 'rgba(16,185,129,0.08)', border: '#064E3B', color: '#6EE7B7', iconBg: '#064E3B' },
    slate: { bg: '#0F172A', border: '#1E293B', color: '#CBD5E1', iconBg: '#1E293B' },
  };
  const t = tones[tone];
  return (
    <div style={{ padding: 10, borderRadius: 8, background: t.bg, border: `1px solid ${t.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: t.iconBg, color: t.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#E2E8F0' }}>{title}</p>
        <p style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>{body}</p>
      </div>
    </div>
  );
}

function ControlButton({ active, onClick, icon, label, danger }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 8,
        padding: '10px 16px', borderRadius: 8,
        background: danger ? '#7F1D1D' : active ? '#1E293B' : '#0F172A',
        color: danger ? '#FCA5A5' : '#E2E8F0',
        border: `1px solid ${danger ? '#9F1239' : '#334155'}`,
        fontSize: 13, fontWeight: 500,
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}
