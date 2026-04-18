import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileText, Briefcase, ArrowRight, Sparkles, Brain, ShieldCheck, Mic, CheckCircle } from 'lucide-react';
import { useAssessment } from '../context/AssessmentContext';
import { generateMCQ } from '../services/api';

const features = [
  { icon: Brain, title: 'AI-Powered', desc: 'Questions tailored from your resume' },
  { icon: ShieldCheck, title: 'Proctored', desc: 'Webcam & tab-switch monitoring' },
  { icon: Mic, title: 'Voice Enabled', desc: 'Speak answers naturally' },
  { icon: Sparkles, title: 'Instant Results', desc: 'Detailed score breakdown' },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1, delayChildren: 0.2 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const slideVariants = {
  enter: { x: 50, opacity: 0 },
  center: { x: 0, opacity: 1 },
  exit: { x: -50, opacity: 0 },
};

export default function LandingPage() {
  const navigate = useNavigate();
  const { dispatch } = useAssessment();
  const [step, setStep] = useState(1);
  const [jobRole, setJobRole] = useState('');
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === 'application/pdf') {
      setFile(droppedFile);
      setError('');
    } else {
      setError('Please upload a PDF file');
    }
  };

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async () => {
    if (!jobRole.trim()) {
      setError('Please enter a job role');
      return;
    }
    if (!file) {
      setError('Please upload your resume');
      return;
    }

    setStep(2);
    setLoading(true);
    setError('');

    try {
      setLoadingStep('Parsing your resume...');
      await new Promise((r) => setTimeout(r, 800));

      setLoadingStep('Generating tailored questions with AI...');
      const data = await generateMCQ(file, jobRole);

      setLoadingStep('Preparing your assessment environment...');
      await new Promise((r) => setTimeout(r, 500));

      dispatch({
        type: 'SET_SESSION',
        payload: {
          sessionId: data.sessionId,
          questions: data.questions,
          rawQuestions: data._rawQuestions,
          jobRole,
          resumeSnippet: '',
        },
      });

      setStep(3);
    } catch (err) {
      console.error('Generation error:', err);
      setError(err.response?.data?.error || 'Failed to generate questions. Please check your API key and try again.');
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = () => {
    dispatch({ type: 'START_ASSESSMENT' });
    navigate('/assessment');
  };

  return (
    <div className="min-h-screen bg-slate-50 overflow-hidden">
      {/* Navigation */}
      <nav className="absolute top-0 left-0 right-0 z-50 px-8 py-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">V</div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">VyorAI</span>
        </div>
        <div className="flex items-center gap-8">
          <div className="hidden md:flex gap-6 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-indigo-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-indigo-600 transition-colors">How it works</a>
            <a href="#testimonials" className="hover:text-indigo-600 transition-colors">Trust</a>
          </div>
          <button onClick={() => navigate('/login')} className="px-5 py-2 rounded-full bg-white border border-slate-200 text-sm font-bold text-slate-900 hover:shadow-md transition-all">Sign In</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 md:px-8">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10">
          <div className="absolute top-[10%] left-[10%] w-72 h-72 bg-indigo-200/50 rounded-full blur-[100px]" />
          <div className="absolute bottom-[10%] right-[10%] w-72 h-72 bg-purple-200/50 rounded-full blur-[100px]" />
        </div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-bold text-indigo-700 uppercase tracking-wider mb-6">
              <Sparkles className="w-3 h-3" />
              Next-Gen Recruitment
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 leading-[1.1] mb-8">
              Hire <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">10x faster</span> with AI intelligence.
            </h1>
            <p className="text-xl text-slate-600 leading-relaxed max-w-lg mb-10">
              Transform your recruitment process with automated, AI-driven technical assessments that evaluate skills, culture, and potential with human-like precision.
            </p>
            
            <div className="flex flex-wrap gap-4 items-center mb-12">
              <button 
                onClick={() => {
                  const el = document.getElementById('assessment-trigger');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="px-8 py-4 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 hover:shadow-xl hover:translate-y-[-2px] transition-all flex items-center gap-2"
              >
                Try Direct Assessment <ArrowRight className="w-4 h-4" />
              </button>
              <div className="flex -space-x-3 items-center">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[10px] font-bold text-slate-600">JD</div>
                ))}
                <span className="pl-6 text-sm font-bold text-slate-500">Trusted by 200+ teams</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {features.map((feat, i) => (
                <div key={i} className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-white shadow-sm border border-slate-100 flex items-center justify-center text-indigo-600 flex-shrink-0">
                    <feat.icon size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{feat.title}</h3>
                    <p className="text-sm text-slate-500">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Form Card */}
          <motion.div
            id="assessment-trigger"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="absolute inset-0 bg-indigo-600 rounded-[32px] rotate-2 scale-[1.02] opacity-5 -z-10" />
            <div className="glass-strong p-10 backdrop-blur-3xl shadow-2xl border border-white/50">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="form"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-6"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-black text-slate-900 tracking-tight">Generate Live Assessment</h2>
                      <p className="text-slate-500 text-sm mt-1">Get instant results tailored to your expertise.</p>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Position Name</label>
                        <div className="relative">
                          <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input
                            type="text"
                            className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl py-4 pl-12 pr-4 text-slate-900 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                            placeholder="e.g. Lead DevRel Engineer"
                            value={jobRole}
                            onChange={(e) => setJobRole(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-slate-400">Your Resume</label>
                        <div
                          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer ${
                            dragOver ? 'border-indigo-400 bg-indigo-50' : file ? 'border-emerald-300 bg-emerald-50/30' : 'border-slate-200 hover:border-indigo-300 bg-slate-50/30'
                          }`}
                          onDrop={handleDrop}
                          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                          onDragLeave={() => setDragOver(false)}
                          onClick={() => fileInputRef.current?.click()}
                        >
                          <input ref={fileInputRef} type="file" className="hidden" accept=".pdf" onChange={handleFileSelect} />
                          {file ? (
                            <div className="flex items-center justify-center gap-4">
                              <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-emerald-500">
                                <FileText size={24} />
                              </div>
                              <div className="text-left">
                                <p className="font-bold text-slate-900 text-sm">{file.name}</p>
                                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(1)} KB • Ready to parse</p>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Upload className="w-6 h-6 mx-auto text-indigo-600" />
                              <p className="text-sm font-bold text-slate-900">Drop PDF here or <span className="text-indigo-600 underline">browse</span></p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl text-xs font-bold text-rose-600 flex gap-2 items-center">
                        <AlertTriangle size={14} /> {error}
                      </div>
                    )}

                    <button
                      className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all shadow-lg active:scale-95"
                      onClick={handleSubmit}
                    >
                      Process & Start Assessment
                    </button>
                  </motion.div>
                )}
                {/* ... existing Step 2 and 3 with same style ... */}
                {step === 2 && (
                   <motion.div
                    key="loading"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="flex flex-col items-center justify-center py-10 space-y-8"
                  >
                    <div className="relative">
                      <div className="w-20 h-20 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
                      <Brain size={24} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-indigo-600" />
                    </div>
                    <div className="text-center space-y-2">
                      <h3 className="text-xl font-black text-slate-900">AI is thinking...</h3>
                      <p className="text-sm font-bold text-indigo-600 animate-pulse uppercase tracking-widest">{loadingStep}</p>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div
                    key="ready"
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    className="space-y-8"
                  >
                    <div className="text-center space-y-3">
                      <div className="w-16 h-16 rounded-3xl bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg shadow-emerald-200">
                        <CheckCircle size={32} />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">Assessment Ready!</h3>
                      <p className="text-slate-500 font-medium">We've generated 10 tailored questions for you.</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
                      {[
                        { icon: Mic, hex: '#4F46E5', text: 'Voice-enabled interaction' },
                        { icon: ShieldCheck, hex: '#10B981', text: 'Secure proctored environment' },
                        { icon: Clock, hex: '#F59E0B', text: '~15 minutes duration' }
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 text-sm font-bold text-slate-700">
                          <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shadow-sm" style={{ color: item.hex }}>
                            <item.icon size={16} />
                          </div>
                          {item.text}
                        </div>
                      ))}
                    </div>

                    <button
                      className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200"
                      onClick={handleStartTest}
                    >
                      Begin Assessment <ArrowRight size={18} />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-xs font-black uppercase tracking-widest text-slate-400 mb-12">Designed for the world's most innovative teams</p>
          <div className="flex flex-wrap justify-center items-center gap-12 md:gap-20 opacity-40 grayscale">
            <div className="text-2xl font-black text-slate-900">GOOGLE</div>
            <div className="text-2xl font-black text-slate-900">META</div>
            <div className="text-2xl font-black text-slate-900">STRIPE</div>
            <div className="text-2xl font-black text-slate-900">AIRBNB</div>
            <div className="text-2xl font-black text-slate-900">NETFLIX</div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-32 px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <h2 className="text-4xl font-black text-slate-900 mb-6 tracking-tight">Everything you need to hire at scale</h2>
            <p className="text-lg text-slate-500 font-medium">A complete assessment suite powered by cutting-edge neural models.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              { title: 'Resume intelligence', bg: 'bg-indigo-600', desc: 'Our AI deeply understands technical resumes, mapping skills to job requirements in seconds.' },
              { title: 'Voice-to-JSON engine', bg: 'bg-purple-600', desc: 'Candidates speak, we evaluate. Natural language processing turns speech into structured performance data.' },
              { title: 'Anti-cheat proctoring', bg: 'bg-emerald-600', desc: 'Real-time eye tracking, tab detection, and AI plagiarism checks ensure total integrity.' }
            ].map((f, i) => (
              <div key={i} className="group p-10 bg-white border border-slate-100 rounded-[32px] hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-500">
                <div className={`w-14 h-14 ${f.bg} rounded-2xl mb-8 flex items-center justify-center text-white shadow-lg`}>
                   <Sparkles size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-4">{f.title}</h3>
                <p className="text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="bg-slate-900 py-32 px-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div>
              <h2 className="text-4xl md:text-5xl font-black mb-8 leading-tight">Trusted by engineering leaders worldwide.</h2>
              <div className="flex gap-4 items-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600 flex items-center justify-center font-bold text-2xl">A</div>
                <div>
                  <p className="font-bold text-xl">Arjun Mehta</p>
                  <p className="text-indigo-400 font-bold uppercase tracking-widest text-xs">Head of Engineering at TechGlobal</p>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="text-3xl md:text-4xl font-medium italic leading-relaxed text-slate-300">
                "VyorAI has fundamentally changed how we evaluate talent. We've completely eliminated the initial screening drag and focused solely on the top 2% of candidates."
              </div>
              <Sparkles className="absolute -top-10 -left-10 w-20 h-20 text-indigo-500/20" />
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-8 border-t border-slate-100 bg-white">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-slate-900 rounded flex items-center justify-center text-white text-[10px] font-bold">V</div>
            <span className="font-bold text-slate-900">VyorAI © 2026</span>
          </div>
          <div className="flex gap-8 text-sm font-bold text-slate-500">
             <a href="#" className="hover:text-black">Privacy Policy</a>
             <a href="#" className="hover:text-black">Terms of Service</a>
             <a href="#" className="hover:text-black">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
