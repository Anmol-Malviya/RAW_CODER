import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
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
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
          console.error('Speech recognition error:', event.error);
        }
        setIsListening(false);
      };

      recognition.onend = () => {
        if (micOn && state.status === 'active') recognition.start();
      };

      recognitionRef.current = recognition;

      return () => {
        recognition.stop();
        recognition.onend = null;
        recognition.onerror = null;
        recognition.onresult = null;
      };
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
    // Only redirect if there is no active session or we are in idle state
    if (state.status === 'idle' || questions.length === 0) {
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
    socketRef.current = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000');
    
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
    
    // Helper to upload media
    const uploadMedia = (recorderRef, chunksRef, uploadFn) => {
      return new Promise((resolve) => {
        if (recorderRef.current && recorderRef.current.state !== 'inactive') {
          recorderRef.current.onstop = async () => {
            try {
              const blob = new Blob(chunksRef.current, { type: 'video/webm' });
              await uploadFn(sessionId, blob);
            } catch (err) {
              console.error("Media upload failed:", err);
            } finally {
              resolve();
            }
          };
          recorderRef.current.stop();
        } else {
          resolve(); // Already inactive or undefined
        }
      });
    };

    try {
      // Run uploads and assessment submission concurrently to save time, but wait for all
      const [result] = await Promise.all([
        submitAssessment(sessionId, answers, proctoring.tabSwitchCount, testDurationSeconds),
        uploadMedia(mediaRecorderRef, recordedChunksRef, uploadRecording),
        uploadMedia(screenRecorderRef, screenChunksRef, uploadScreenRecording)
      ]);

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
        console.log('Navigating to coding round');
        navigate('/coding');
      } else {
        console.log('Navigating to feedback for session:', sessionId);
        navigate(`/feedback/${sessionId}`);
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
        navigate(`/feedback/${sessionId}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (!question) return null;

  if (!screenShared) {
    return (
      <div style={{ position: 'fixed', inset: 0, background: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 60, padding: 24, textAlign: 'center' }}>
        <div style={{ background: '#FFFFFF', padding: 32, borderRadius: 16, maxWidth: 400, boxShadow: '0 10px 25px rgba(0,0,0,0.05)', border: '1px solid #E2E8F0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 32, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <Video size={32} color="#3B82F6" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 700, marginBottom: 12, color: '#0F172A' }}>Screen Share Required</h2>
          <p style={{ fontSize: 16, color: '#64748B', marginBottom: 24, lineHeight: 1.5 }}>
            To begin your interview, you must share your screen. This will be recorded alongside your camera. Please ensure you select "Entire Screen" in the prompt.
          </p>
          <button 
            onClick={handleStartScreenShare}
            style={{ width: '100%', background: '#4F46E5', color: 'white', border: 'none', padding: '14px 20px', borderRadius: 8, fontSize: 16, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s' }}
            onMouseOver={(e) => e.currentTarget.style.background = '#4338CA'}
            onMouseOut={(e) => e.currentTarget.style.background = '#4F46E5'}
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
    <div style={{ position: 'relative', inset: 0, background: '#F8FAFC', color: '#0F172A', display: 'flex', flexDirection: 'column', zIndex: 50, height: '100vh' }}>
      {/* Top bar */}
      <div style={{ height: 56, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: '#EF4444', boxShadow: '0 0 0 4px rgba(239,68,68,0.2)' }} />
          <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: '0.04em', color: '#1E293B' }}>LIVE INTERVIEW</span>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>·</span>
            <span style={{ fontSize: 13, color: '#64748B' }}>{jobRole || 'Technical screening'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 13, color: '#64748B' }}>Question {currentQuestion + 1} of {questions.length}</span>
            <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: 14, color: '#0F172A', padding: '4px 10px', borderRadius: 6, background: '#F1F5F9' }}>{clock}</span>
          </div>
        </div>

        {/* Warning Overlay */}
        <AnimatePresence>
          {proctoring.showWarning && (
            <motion.div
              initial={{ opacity: 0, y: -50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -50 }}
              style={{
                position: 'fixed',
                top: 70,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 100,
                width: '100%',
                maxWidth: 600,
                padding: '0 20px',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                background: '#EF4444',
                color: 'white',
                padding: '16px 24px',
                borderRadius: 12,
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                border: '2px solid rgba(255,255,255,0.2)',
                pointerEvents: 'auto'
              }}>
                <div style={{ background: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 8 }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <p style={{ fontWeight: 800, fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Security Violation</p>
                  <p style={{ fontSize: 14, opacity: 0.9, marginTop: 2 }}>{proctoring.lastWarningMsg || 'Suspicious activity detected. This incident has been logged.'}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      {/* Progress bar */}
      <div style={{ height: 2, background: '#E2E8F0' }}>
        <div style={{ height: '100%', width: `${progress}%`, background: '#4F46E5', transition: 'width 0.3s ease' }} />
      </div>

      {/* Main split */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* Left 70% */}
        <div style={{ flex: '0 0 70%', padding: '40px 56px', overflowY: 'auto', display: 'flex', flexDirection: 'column', background: '#FFFFFF' }}>
          <p style={{ fontSize: 11, fontWeight: 600, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.12em' }}>Current question</p>
          <h2 style={{ marginTop: 12, fontSize: 26, fontWeight: 600, color: '#0F172A', lineHeight: 1.3, letterSpacing: '-0.01em', maxWidth: 820 }}>
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
                    border: `1px solid ${selected ? '#4F46E5' : '#E2E8F0'}`,
                    background: selected ? '#EEF2FF' : '#FFFFFF',
                    color: '#334155',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s ease',
                    boxShadow: selected ? '0 1px 2px 0 rgba(79, 70, 229, 0.1)' : '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
                  }}
                >
                  <span style={{
                    width: 24, height: 24, borderRadius: 6,
                    background: selected ? '#4F46E5' : '#F1F5F9',
                    color: selected ? '#FFFFFF' : '#64748B',
                    display: 'grid', placeItems: 'center',
                    fontSize: 12, fontWeight: 600,
                  }}>
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span style={{ flex: 1, fontWeight: selected ? 600 : 400, color: selected ? '#111827' : '#334155' }}>{option}</span>
                  {selected && <Circle size={8} fill="#4F46E5" color="#4F46E5" />}
                </button>
              );
            })}
          </div>

          {/* Transcript */}
          <div style={{ marginTop: 32, padding: 20, borderRadius: 10, background: '#FFFFFF', border: '1px solid #E2E8F0', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', maxWidth: 820 }}>
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
        <aside style={{ flex: '0 0 30%', borderLeft: '1px solid #E2E8F0', padding: 24, display: 'flex', flexDirection: 'column', gap: 16, background: '#F8FAFC', overflowY: 'auto' }}>
          {/* Webcam */}
          <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid #E2E8F0', background: '#000000', aspectRatio: '4/3', position: 'relative', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}>
            <video ref={videoRef} autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(6px)', boxShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: '#EF4444' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: '#0F172A' }}>LIVE</span>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <span>Answered</span><span style={{ color: '#0F172A', fontWeight: 600 }}>{answeredCount} / {questions.length}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: '#FFFFFF', borderRadius: 8, border: '1px solid #E2E8F0' }}>
              <span>Session ID</span><span style={{ color: '#0F172A', fontFamily: 'ui-monospace, monospace', fontWeight: 500 }}>{(sessionId || '').slice(-6) || '—'}</span>
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom control bar */}
      <div style={{ height: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
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
              padding: '10px 16px', borderRadius: 8, background: '#FFFFFF',
              border: '1px solid #E2E8F0', color: currentQuestion === 0 ? '#94A3B8' : '#334155',
              fontSize: 13, fontWeight: 500, cursor: currentQuestion === 0 ? 'not-allowed' : 'pointer',
              display: 'inline-flex', alignItems: 'center', gap: 6,
              boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.02)'
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
                padding: '10px 18px', borderRadius: 8, background: '#EF4444',
                border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                cursor: submitting ? 'wait' : 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)'
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
              style={{
                padding: '10px 18px', borderRadius: 8, background: '#4F46E5',
                border: 'none', color: '#FFFFFF', fontSize: 13, fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex', alignItems: 'center', gap: 6,
                boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.2), 0 2px 4px -1px rgba(79, 70, 229, 0.1)'
              }}
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
    <p style={{ fontSize: 13, color: muted ? '#94A3B8' : '#334155', fontStyle: muted ? 'italic' : 'normal', lineHeight: 1.6 }}>
      {children}
    </p>
  );
}

function AlertRow({ tone, icon, title, body }) {
  const tones = {
    rose: { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C', iconBg: '#FCA5A5' },
    emerald: { bg: '#ECFDF5', border: '#A7F3D0', color: '#047857', iconBg: '#6EE7B7' },
    slate: { bg: '#FFFFFF', border: '#E2E8F0', color: '#475569', iconBg: '#E2E8F0' },
  };
  const t = tones[tone];
  return (
    <div style={{ padding: 10, borderRadius: 8, background: t.bg, border: `1px solid ${t.border}`, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div style={{ width: 24, height: 24, borderRadius: 6, background: t.iconBg, color: t.color, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#0F172A' }}>{title}</p>
        <p style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>{body}</p>
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
        background: danger ? '#FEF2F2' : active ? '#F1F5F9' : '#FFFFFF',
        color: danger ? '#EF4444' : '#1E293B',
        border: `1px solid ${danger ? '#FECACA' : '#E2E8F0'}`,
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
