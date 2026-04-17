import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, Loader2 } from 'lucide-react';
import { useVoice } from '../../hooks/useVoice';
import { voiceChat } from '../../services/api';

export default function VoiceButton({ jobRole, resumeSnippet = '' }) {
  const voice = useVoice();
  const [chatHistory, setChatHistory] = useState([]);
  const [showTooltip, setShowTooltip] = useState(false);

  // When transcript is ready, send to AI
  useEffect(() => {
    if (voice.status === 'processing' && voice.transcript) {
      handleSendToAI(voice.transcript);
    }
  }, [voice.status, voice.transcript]);

  const handleSendToAI = async (transcript) => {
    try {
      const history = [...chatHistory, { role: 'user', content: transcript }];
      const response = await voiceChat(transcript, jobRole, resumeSnippet, history);

      setChatHistory([
        ...history,
        { role: 'assistant', content: response.response },
      ]);

      // Speak the AI response
      voice.speak(response.response);
    } catch (err) {
      console.error('Voice chat error:', err);
      voice.speak("I'm sorry, I couldn't process that. Please try again.");
    }
  };

  const handlePress = () => {
    if (voice.status === 'idle') {
      voice.startListening();
    } else if (voice.status === 'listening') {
      voice.stopListening();
    } else if (voice.status === 'speaking') {
      voice.stopSpeaking();
    }
  };

  if (!voice.isSupported) return null;

  const getIcon = () => {
    switch (voice.status) {
      case 'listening':
        return <Mic size={24} className="text-white" />;
      case 'processing':
        return <Loader2 size={24} className="text-white animate-spin" />;
      case 'speaking':
        return <Volume2 size={24} className="text-white" />;
      default:
        return <Mic size={24} className="text-white" />;
    }
  };

  const getStatusText = () => {
    switch (voice.status) {
      case 'listening':
        return 'Listening...';
      case 'processing':
        return 'Processing...';
      case 'speaking':
        return 'Speaking...';
      default:
        return 'Hold to speak';
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50 flex items-end gap-3">
      <div className="relative">
        <motion.button
          className={`voice-btn ${voice.status}`}
          onClick={handlePress}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {getIcon()}

          {/* Pulsing ring for listening state */}
          {voice.status === 'listening' && (
            <>
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-rose-400"
                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0, 0.5] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-rose-400"
                animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                transition={{ duration: 1.5, repeat: Infinity, delay: 0.3 }}
              />
            </>
          )}
        </motion.button>

        {/* Tooltip */}
        <AnimatePresence>
          {(showTooltip || voice.status !== 'idle') && (
            <motion.div
              initial={{ opacity: 0, y: 5, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5, scale: 0.95 }}
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-3 py-1.5 rounded-lg glass text-xs text-slate-300"
            >
              {getStatusText()}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transcript preview */}
      <AnimatePresence>
        {voice.transcript && voice.status !== 'idle' && (
          <motion.div
            initial={{ opacity: 0, x: -10, width: 0 }}
            animate={{ opacity: 1, x: 0, width: 'auto' }}
            exit={{ opacity: 0, x: -10, width: 0 }}
            className="glass px-4 py-3 rounded-xl max-w-xs overflow-hidden"
          >
            <p className="text-xs text-slate-400 mb-1">You said:</p>
            <p className="text-sm text-white truncate">{voice.transcript}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
