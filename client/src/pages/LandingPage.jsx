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
    <div className="min-h-screen relative flex items-center justify-center p-4 md:p-8 overflow-hidden">
      {/* Animated blobs */}
      <div className="blob blob-1" />
      <div className="blob blob-2" />
      <div className="blob blob-3" />

      <div className="relative z-10 w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left — Hero */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          <motion.div variants={itemVariants}>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass text-sm text-indigo-700 mb-4">
              <Sparkles className="w-4 h-4" />
              <span>AI-Powered Assessment Platform</span>
            </div>
            <h1
              className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight text-slate-900"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              Evaluate talent with{' '}
              <span className="gradient-text">AI precision</span>
            </h1>
          </motion.div>

          <motion.p variants={itemVariants} className="text-lg text-slate-600 max-w-md">
            Upload a resume, specify the role, and let AI generate a personalized technical assessment — complete with voice interaction and smart proctoring.
          </motion.p>

          <motion.div variants={containerVariants} className="grid grid-cols-2 gap-4">
            {features.map((feat) => (
              <motion.div
                key={feat.title}
                variants={itemVariants}
                whileHover={{ scale: 1.03, y: -2 }}
                className="glass p-4 rounded-xl flex items-start gap-3"
              >
                <div className="p-2 rounded-lg bg-indigo-100">
                  <feat.icon className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm text-slate-900">{feat.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{feat.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Right — Form Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="glass-strong p-8 md:p-10 w-full max-w-md mx-auto lg:mx-0 lg:ml-auto"
        >
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="form"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div>
                  <h2
                    className="text-2xl font-bold text-slate-900"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Start Assessment
                  </h2>
                  <p className="text-sm text-slate-600 mt-1">Fill in the details to begin</p>
                </div>

                {/* Job Role Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Target Job Role</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <input
                      id="job-role-input"
                      type="text"
                      className="w-full bg-white border border-slate-300 rounded-lg py-3 pl-11 pr-4 text-slate-900 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none placeholder:text-slate-500"
                      placeholder="e.g. Senior React Developer"
                      value={jobRole}
                      onChange={(e) => setJobRole(e.target.value)}
                    />
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Upload Resume (PDF)</label>
                  <div
                    className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer ${
                      dragOver ? 'border-indigo-400 bg-indigo-50' : file ? 'border-indigo-300 bg-indigo-50' : 'border-slate-300 hover:border-slate-400 bg-white/50'
                    }`}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      ref={fileInputRef}
                      id="resume-upload"
                      type="file"
                      className="hidden"
                      accept=".pdf"
                      onChange={handleFileSelect}
                    />
                    {file ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                        <div>
                          <p className="font-medium text-emerald-700">{file.name}</p>
                          <p className="text-sm text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Upload className="w-8 h-8 mx-auto text-slate-400" />
                        <p className="text-sm text-slate-600">
                          Drag & drop or <span className="text-indigo-600 font-medium">browse</span>
                        </p>
                        <p className="text-xs text-slate-500">PDF files only, max 10MB</p>
                      </div>
                    )}
                  </div>
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-rose-700 bg-rose-50 border border-rose-200 px-4 py-2 rounded-lg"
                  >
                    {error}
                  </motion.p>
                )}

                <motion.button
                  id="start-btn"
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Generate Assessment
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="loading"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="flex flex-col items-center justify-center py-12 space-y-6"
              >
                <div className="relative">
                  <div className="spinner" />
                  <Brain size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-violet-400" />
                </div>
                <div className="text-center space-y-2">
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Preparing Your Assessment
                  </h3>
                  <motion.p
                    key={loadingStep}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-slate-600"
                  >
                    {loadingStep}
                  </motion.p>
                </div>
                <div className="w-full max-w-xs">
                  <div className="progress-track">
                    <motion.div
                      className="progress-fill"
                      initial={{ width: '10%' }}
                      animate={{ width: loading ? '85%' : '100%' }}
                      transition={{ duration: loading ? 30 : 0.5, ease: 'linear' }}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="permissions"
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.3 }}
                className="space-y-6 py-4"
              >
                <div className="text-center space-y-2">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 200 }}
                    className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto"
                  >
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </motion.div>
                  <h3
                    className="text-xl font-bold text-slate-900"
                    style={{ fontFamily: 'var(--font-display)' }}
                  >
                    Assessment Ready!
                  </h3>
                  <p className="text-sm text-slate-600">
                    10 tailored questions for <span className="text-indigo-600 font-medium">{jobRole}</span>
                  </p>
                </div>

                <div className="glass p-4 rounded-xl space-y-3">
                  <p className="text-sm font-medium text-slate-900">Before you begin:</p>
                  <ul className="space-y-2 text-sm text-slate-600">
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                      Camera & mic access will be requested for proctoring
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                      Tab switching will be monitored and recorded
                    </li>
                    <li className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 text-cyan-600 mt-0.5 shrink-0" />
                      Use the voice button for hands-free interaction
                    </li>
                  </ul>
                </div>

                <motion.button
                  id="begin-test-btn"
                  className="w-full h-12 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold rounded-lg flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all"
                  onClick={handleStartTest}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  Begin Test
                  <ArrowRight className="w-4 h-4" />
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
}
