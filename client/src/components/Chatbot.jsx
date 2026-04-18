import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Loader2, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your VyorAI assistant. How can I help you today?' }
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-[0_8px_30px_rgb(79,70,229,0.3)] hover:bg-indigo-700 transition-all z-50 flex items-center justify-center border-none cursor-pointer"
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: isOpen ? 0 : 1, scale: isOpen ? 0.5 : 1, pointerEvents: isOpen ? 'none' : 'auto' }}
      >
        <MessageCircle size={26} />
      </motion.button>

      {/* Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed bottom-6 right-6 w-[360px] max-w-[calc(100vw-32px)] h-[540px] max-h-[calc(100vh-32px)] bg-white rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.15)] flex flex-col z-50 overflow-hidden border border-slate-100"
            initial={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: 40, scale: 0.95, filter: 'blur(10px)' }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          >
            {/* Minimal Header */}
            <div className="px-6 py-5 bg-white border-b border-slate-50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
                  <Bot size={22} className="text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-800 text-[15px] m-0 leading-tight">VyorAI Assistant</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
                    <span className="text-[11px] text-slate-400 font-medium tracking-wide first-letter:uppercase">Always active</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all border-none cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages - Clean Minimalist Style */}
            <div className="flex-1 overflow-y-auto px-5 py-6 bg-white space-y-5 scrollbar-thin scrollbar-thumb-slate-200">
              {messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex flex-col gap-1.5 max-w-[85%] ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`px-4 py-3 rounded-2xl text-[14px] leading-[1.6] ${
                        msg.role === 'user'
                          ? 'bg-indigo-600 text-white rounded-tr-none shadow-[0_4px_12px_rgba(79,70,229,0.2)]'
                          : 'bg-slate-50 text-slate-700 rounded-tl-none border border-slate-100'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-50 px-4 py-3 rounded-2xl rounded-tl-none border border-slate-100 flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <div className="w-1.5 h-1.5 bg-indigo-400/40 rounded-full animate-bounce" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Pure White & Minimal */}
            <div className="p-4 bg-white border-t border-slate-50">
              <form
                onSubmit={handleSendMessage}
                className="relative flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 pr-12 text-[14px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-200 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 w-9 h-9 rounded-lg bg-indigo-600 text-white flex items-center justify-center disabled:opacity-30 disabled:grayscale hover:bg-indigo-700 transition-all border-none cursor-pointer"
                >
                  {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={15} />}
                </button>
              </form>
              <div className="mt-3 flex justify-center items-center gap-1.5 opacity-40">
                <Sparkles size={10} className="text-indigo-600" />
                <span className="text-[10px] uppercase tracking-[0.1em] font-bold text-slate-600">Powered by VyorAI</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
