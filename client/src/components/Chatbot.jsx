import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI Interviewer. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    const updatedMessages = [...messages, userMessage];

    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await axios.post(`${apiUrl}/chat`, {
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content }))
      });

      if (response.data && response.data.content) {
        setMessages([...updatedMessages, { role: 'assistant', content: response.data.content }]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage = 'I encountered a small issue. Please try again.';
      setMessages([...updatedMessages, { role: 'assistant', content: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Trigger */}
      <motion.button
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-[0_10px_40px_-10px_rgba(79,70,229,0.8)] hover:shadow-[0_10px_40px_-5px_rgba(79,70,229,1)] hover:bg-indigo-700 transition-all z-50 flex items-center justify-center border-none cursor-pointer"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.5 : 1, pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <MessageCircle size={26} strokeWidth={2.2} />
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 w-[380px] max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-2rem)] bg-white rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.2)] flex flex-col z-50 overflow-hidden border border-slate-200/60"
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          >
            {/* Header */}
            <div className="px-5 py-4 bg-white border-b border-slate-100 flex items-center justify-between z-10 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-full flex items-center justify-center">
                  <Bot size={20} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-[15px] m-0 leading-tight">AI Interviewer</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                    <span className="text-[11px] text-slate-500 font-medium tracking-wide uppercase">Online & Ready</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none cursor-pointer"
              >
                <X size={18} strokeWidth={2.5} />
              </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-white space-y-4 scrollbar-thin scrollbar-thumb-slate-200">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[82%] px-4 py-3 text-[14px] leading-[1.6] ${msg.role === 'user'
                        ? 'bg-indigo-600 text-white rounded-2xl rounded-tr-sm shadow-sm'
                        : 'bg-slate-100 text-slate-800 rounded-2xl rounded-tl-sm'
                      }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-100 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5 h-[46px]">
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} className="h-1" />
            </div>

            {/* Input Area */}
            <div className="p-4 bg-white border-t border-slate-100 z-10">
              <form
                onSubmit={handleSendMessage}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full bg-slate-100 border-none rounded-full px-5 py-3 pr-[50px] text-[14px] text-slate-800 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-1 w-9 h-9 rounded-full flex items-center justify-center transition-all border-none cursor-pointer disabled:bg-transparent disabled:text-slate-400 bg-indigo-600 text-white hover:bg-indigo-700"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin text-slate-400" /> : <Send size={15} className={`ml-0.5 ${!input.trim() ? 'text-slate-400' : 'text-white'}`} />}
                </button>
              </form>
              <div className="mt-3 flex justify-center items-center gap-1">
                <Sparkles size={11} className="text-indigo-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  AI Interviewer
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
