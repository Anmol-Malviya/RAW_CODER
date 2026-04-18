import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useInView, AnimatePresence } from 'framer-motion';
import {
  Wand2, ScanEye, AudioWaveform, Sparkles, ClipboardCheck, Terminal, UsersRound, Briefcase,
  ArrowRight, ChevronRight, CheckCircle, Star, Zap, Layout, LineChart,
  FileText, Award, Globe, MonitorCheck, Play, Menu, X, ChevronDown
} from 'lucide-react';

/* ─────────────────────── constants ─────────────────────── */

const NAV_LINKS = [
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'For Teams', href: '#for-teams' },
  // { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
];

const FEATURES = [
  {
    icon: Wand2,
    title: 'AI-Generated Assessments',
    desc: 'Upload a resume and job description — our AI crafts personalized technical questions in seconds, perfectly calibrated to the role.',
    color: '#6366F1',
    bg: '#EEF2FF',
  },
  {
    icon: AudioWaveform,
    title: 'Voice-Powered Interviews',
    desc: 'Candidates speak answers naturally using our real-time voice AI. No typing, no friction — just a genuine conversation.',
    color: '#8B5CF6',
    bg: '#F5F3FF',
  },
  {
    icon: ScanEye,
    title: 'Smart Proctoring',
    desc: 'Tab-switch detection, webcam monitoring, and integrity signals keep every session fair and tamper-proof.',
    color: '#0EA5E9',
    bg: '#F0F9FF',
  },
  {
    icon: Terminal,
    title: 'Live Coding Rounds',
    desc: 'Integrated code editor with real-time execution. Test algorithm skills, system design, and problem-solving in one flow.',
    color: '#10B981',
    bg: '#ECFDF5',
  },
  {
    icon: ClipboardCheck,
    title: 'Structured Scorecards',
    desc: 'Consistent AI-graded reports with category breakdowns, flag summaries, and recommendation confidence.',
    color: '#F59E0B',
    bg: '#FFFBEB',
  },
  {
    icon: UsersRound,
    title: 'Team Collaboration',
    desc: 'Admin dashboards with live monitoring, candidate shortlisting, role management, and one-click report exports.',
    color: '#EC4899',
    bg: '#FDF2F8',
  },
];

const STEPS = [
  {
    num: '01',
    title: 'Create a Role',
    desc: 'Define the job title, description, difficulty, and interview type. A unique session code is generated instantly.',
    icon: Briefcase,
  },
  {
    num: '02',
    title: 'Invite Candidates',
    desc: 'Share the 6-digit code. Candidates sign in, run a system check, and enter the assessment — zero scheduling hassle.',
    icon: Globe,
  },
  {
    num: '03',
    title: 'AI Interviews & Scores',
    desc: 'The AI conducts the assessment with voice, MCQs, and coding. Proctoring runs silently in the background.',
    icon: Sparkles,
  },
  {
    num: '04',
    title: 'Review & Decide',
    desc: 'Detailed scorecards appear instantly. Shortlist, compare, download reports — all from one clean dashboard.',
    icon: Award,
  },
];

const TEAM_BENEFITS = [
  { icon: Zap, title: 'Reduce time-to-hire by 70%', desc: 'Automated screening replaces hours of manual review.' },
  { icon: Layout, title: 'Unified workspace', desc: 'Jobs, candidates, analytics, and settings — one tab, zero context-switching.' },
  { icon: LineChart, title: 'Data-driven decisions', desc: 'Score distributions, flag rates, and hiring funnel analytics at a glance.' },
  { icon: MonitorCheck, title: 'Live session monitoring', desc: 'Watch candidates in real-time with tab-switch alerts and AI summaries.' },
];

const PLANS = [
  {
    name: 'Starter',
    price: 'Free',
    period: '',
    desc: 'Perfect for small teams and individual recruiters getting started.',
    features: ['5 active roles', 'AI-generated assessments', 'Basic proctoring', 'Email support', 'Candidate scorecards'],
    cta: 'Get Started Free',
    highlighted: false,
  },
  {
    name: 'Professional',
    price: '$49',
    period: '/month',
    desc: 'For growing teams who need advanced features and higher volume.',
    features: ['Unlimited roles', 'Voice interviews', 'Live coding rounds', 'Advanced proctoring', 'Team collaboration', 'Analytics dashboard', 'Priority support'],
    cta: 'Start Free Trial',
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For organizations with custom requirements and dedicated support needs.',
    features: ['Everything in Pro', 'SSO & SAML', 'Custom branding', 'API access', 'Dedicated CSM', 'SLA & uptime guarantee', 'Onboarding assistance'],
    cta: 'Contact Sales',
    highlighted: false,
  },
];

const FAQS = [
  {
    q: 'How does the AI generate questions?',
    a: 'Our AI analyzes the uploaded resume and job description to create personalized technical questions that match the role requirements and candidate experience level.',
  },
  {
    q: 'Is the proctoring system secure?',
    a: 'Yes. We use multi-layered monitoring including webcam detection, tab-switch tracking, and browser focus analysis. All data is encrypted and processed in compliance with privacy regulations.',
  },
  {
    q: 'Can candidates use voice to answer?',
    a: 'Absolutely. Our voice AI converts speech to text in real-time, letting candidates answer naturally without typing. This is especially useful for behavioral and system design questions.',
  },
  {
    q: 'How do team members collaborate?',
    a: 'Admins can create roles, invite team members, and share candidate pipelines. Shortlisting, status tracking, and report downloads are available from a single dashboard.',
  },
  {
    q: 'What coding languages are supported?',
    a: 'Our integrated code editor supports JavaScript, Python, Java, C++, and more. Candidates can write, run, and test code directly in the browser.',
  },
  {
    q: 'Can I try it before paying?',
    a: 'Yes! Our Starter plan is completely free, and the Professional plan comes with a 14-day free trial. No credit card required.',
  },
];

const STATS = [
  { value: '10,000+', label: 'Interviews Conducted' },
  { value: '95%', label: 'Candidate Satisfaction' },
  { value: '70%', label: 'Faster Hiring' },
  { value: '500+', label: 'Companies Trust Us' },
];

/* ─────────────────────── animation variants ─────────────────────── */
const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
};
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

function AnimatedSection({ children, className, style, id }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  return (
    <motion.section
      ref={ref}
      id={id}
      className={className}
      style={style}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      variants={staggerContainer}
    >
      {children}
    </motion.section>
  );
}

/* ─────────────────────── COMPONENT ─────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const goLogin = () => navigate('/login');
  const goSignup = () => navigate('/login?mode=signup');

  return (
    <div style={{ background: '#F8FAFC', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* ─────────── NAVBAR ─────────── */}
      <nav
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          height: 72,
          background: scrolled ? 'rgba(255,255,255,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px) saturate(180%)' : 'none',
          borderBottom: scrolled ? '1px solid #E2E8F0' : '1px solid transparent',
          transition: 'all 0.3s ease',
        }}
      >
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%)',
              color: '#FFFFFF', display: 'grid', placeItems: 'center',
              fontWeight: 800, fontSize: 15, boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
            }}>
              A
            </div>
            <div>
              <span style={{ fontSize: 17, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>AI Interviewer</span>
            </div>
          </div>

          {/* Desktop Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }} className="homepage-nav-links">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                style={{
                  padding: '8px 16px', borderRadius: 8, textDecoration: 'none',
                  fontSize: 14, fontWeight: 500, color: '#475569',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#F1F5F9'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent'; }}
              >
                {link.label}
              </a>
            ))}
          </div>

          {/* Desktop CTA */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }} className="homepage-nav-cta">
            <button
              onClick={goLogin}
              style={{
                padding: '9px 20px', borderRadius: 8, border: '1px solid #E2E8F0',
                background: '#FFFFFF', color: '#334155', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s',
              }}
              onMouseOver={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.color = '#0F172A'; }}
              onMouseOut={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.color = '#334155'; }}
            >
              Sign In
            </button>
            <button
              onClick={goSignup}
              style={{
                padding: '9px 20px', borderRadius: 8, border: 'none',
                background: '#6366F1', color: '#FFFFFF', fontWeight: 600, fontSize: 14,
                cursor: 'pointer', transition: 'all 0.2s',
                boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
              }}
              onMouseOver={(e) => { e.currentTarget.style.background = '#4F46E5'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(99,102,241,0.35)'; }}
              onMouseOut={(e) => { e.currentTarget.style.background = '#6366F1'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(99,102,241,0.25)'; }}
            >
              Get Started
            </button>
          </div>

          {/* Mobile Hamburger */}
          <button
            className="homepage-mobile-menu-btn"
            onClick={() => setMobileMenu(!mobileMenu)}
            style={{ display: 'none', background: 'none', border: 'none', padding: 8, cursor: 'pointer', color: '#334155' }}
          >
            {mobileMenu ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenu && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              style={{
                background: '#FFFFFF', borderTop: '1px solid #E2E8F0',
                padding: '16px 32px 24px', display: 'flex', flexDirection: 'column', gap: 4,
                boxShadow: '0 20px 40px rgba(15,23,42,0.1)',
              }}
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenu(false)}
                  style={{
                    padding: '12px 16px', borderRadius: 8, textDecoration: 'none',
                    fontSize: 15, fontWeight: 500, color: '#334155',
                  }}
                >
                  {link.label}
                </a>
              ))}
              <div style={{ marginTop: 12, display: 'flex', gap: 12 }}>
                <button onClick={() => { setMobileMenu(false); goLogin(); }} className="btn-secondary" style={{ flex: 1, height: 44 }}>Sign in</button>
                <button onClick={() => { setMobileMenu(false); goSignup(); }} className="btn-primary" style={{ flex: 1, height: 44 }}>Get Started</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─────────── HERO ─────────── */}
      <section style={{ position: 'relative', paddingTop: 160, paddingBottom: 100, overflow: 'hidden' }}>
        {/* Gradient Orbs */}
        <div style={{
          position: 'absolute', top: -200, right: -200, width: 600, height: 600,
          background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />
        <div style={{
          position: 'absolute', bottom: -100, left: -200, width: 500, height: 500,
          background: 'radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)',
          borderRadius: '50%', pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            style={{ textAlign: 'center', maxWidth: 800, margin: '0 auto' }}
          >
            {/* Badge */}
            <motion.div variants={fadeUp} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 999, background: '#EEF2FF', border: '1px solid #C7D2FE', marginBottom: 28 }}>
              <Sparkles size={14} color="#6366F1" />
              <span style={{ fontSize: 13, fontWeight: 600, color: '#4338CA' }}>AI-Powered Hiring Platform</span>
            </motion.div>

            {/* Heading */}
            <motion.h1 variants={fadeUp} style={{
              fontSize: 'clamp(36px, 5.5vw, 68px)',
              fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.035em',
              color: '#0F172A', marginBottom: 24,
            }}>
              Hire smarter with{' '}
              <span style={{
                background: 'linear-gradient(135deg, #6366F1, #8B5CF6, #A855F7)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              }}>
                AI-driven
              </span>
              {' '}interviews
            </motion.h1>

            {/* Subtitle */}
            <motion.p variants={fadeUp} style={{
              fontSize: 'clamp(16px, 1.6vw, 20px)',
              color: '#64748B', lineHeight: 1.65, maxWidth: 620, margin: '0 auto 40px',
            }}>
              Resume-aware assessments, voice-powered interviews, live coding, and smart proctoring — all in one beautiful workspace built for modern hiring teams.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div variants={fadeUp} style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={goSignup}
                style={{
                  padding: '16px 36px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)',
                  color: '#FFFFFF', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(99,102,241,0.35)',
                  transition: 'box-shadow 0.3s',
                }}
              >
                Start Free Trial
                <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })}
                style={{
                  padding: '16px 36px', borderRadius: 12,
                  border: '1.5px solid #E2E8F0', background: '#FFFFFF',
                  color: '#334155', fontWeight: 600, fontSize: 16, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 10,
                  transition: 'all 0.3s',
                }}
              >
                <Play size={16} fill="#6366F1" color="#6366F1" />
                See How It Works
              </motion.button>
            </motion.div>
          </motion.div>

          {/* Mock Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: 80, borderRadius: 20, overflow: 'hidden',
              border: '1px solid #E2E8F0',
              boxShadow: '0 40px 80px -20px rgba(15,23,42,0.12), 0 0 0 1px rgba(0,0,0,0.02)',
              background: '#FFFFFF',
            }}
          >
            {/* Fake browser bar */}
            <div style={{ height: 44, background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 999, background: '#FCA5A5' }} />
              <div style={{ width: 12, height: 12, borderRadius: 999, background: '#FDE68A' }} />
              <div style={{ width: 12, height: 12, borderRadius: 999, background: '#86EFAC' }} />
              <div style={{ flex: 1, marginLeft: 12, height: 26, background: '#FFFFFF', borderRadius: 6, border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', padding: '0 12px' }}>
                <span style={{ fontSize: 12, color: '#94A3B8' }}>ai-interviewer.app/admin</span>
              </div>
            </div>
            {/* Dashboard mockup content */}
            <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 16 }}>
              {[
                { label: 'Active Roles', val: '12', color: '#6366F1', bg: '#EEF2FF' },
                { label: 'Total Candidates', val: '284', color: '#10B981', bg: '#ECFDF5' },
                { label: 'Avg. Score', val: '7.4/10', color: '#F59E0B', bg: '#FFFBEB' },
                { label: 'Flagged', val: '3', color: '#EF4444', bg: '#FEF2F2' },
              ].map((item) => (
                <div key={item.label} style={{ padding: '20px', borderRadius: 14, border: '1px solid #F1F5F9', background: '#FFFFFF' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                  <p style={{ marginTop: 6, fontSize: 28, fontWeight: 800, color: item.color, letterSpacing: '-0.02em' }}>{item.val}</p>
                </div>
              ))}
            </div>
            <div style={{ padding: '0 32px 32px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16 }}>
              {/* Fake table */}
              <div style={{ borderRadius: 14, border: '1px solid #F1F5F9', overflow: 'hidden' }}>
                <div style={{ padding: '14px 20px', background: '#F8FAFC', borderBottom: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>Recent Candidates</span>
                  <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>View all →</span>
                </div>
                {['Sarah Chen', 'Alex Rodriguez', 'Priya Sharma', 'James Wilson'].map((name, i) => (
                  <div key={name} style={{ padding: '12px 20px', borderBottom: i < 3 ? '1px solid #F8FAFC' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 999, background: '#EEF2FF', color: '#4338CA', display: 'grid', placeItems: 'center', fontSize: 11, fontWeight: 700 }}>
                        {name.split(' ').map(p => p[0]).join('')}
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#334155' }}>{name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 40, height: 5, background: '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ width: `${[85, 72, 91, 64][i]}%`, height: '100%', background: [85, 72, 91, 64][i] >= 70 ? '#10B981' : '#F59E0B', borderRadius: 999 }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: [85, 72, 91, 64][i] >= 70 ? '#047857' : '#B45309' }}>{[85, 72, 91, 64][i]}%</span>
                    </div>
                  </div>
                ))}
              </div>
              {/* Fake chart placeholder */}
              <div style={{ borderRadius: 14, border: '1px solid #F1F5F9', padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 16 }}>Score Distribution</p>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                  {[35, 55, 80, 65, 90, 70, 45].map((h, i) => (
                    <div key={i} style={{ flex: 1, height: `${h}%`, background: `linear-gradient(180deg, #6366F1 0%, #818CF8 100%)`, borderRadius: '6px 6px 0 0', opacity: 0.6 + (i * 0.05) }} />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─────────── STATS BAR ─────────── */}
      <section style={{ borderTop: '1px solid #E2E8F0', borderBottom: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 32px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 32 }} className="homepage-stats-grid">
          {STATS.map((s) => (
            <div key={s.label} style={{ textAlign: 'center' }}>
              <p style={{ fontSize: 'clamp(28px, 3vw, 40px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>{s.value}</p>
              <p style={{ marginTop: 4, fontSize: 14, color: '#64748B', fontWeight: 500 }}>{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────── FEATURES ─────────── */}
      <AnimatedSection id="features" style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 32px' }}>
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Features</span>
          <h2 style={{ marginTop: 12, fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
            Everything you need to hire with confidence
          </h2>
          <p style={{ marginTop: 16, fontSize: 17, color: '#64748B', maxWidth: 560, margin: '16px auto 0', lineHeight: 1.6 }}>
            A comprehensive toolkit that replaces fragmented tools with one intelligent platform.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 24 }} className="homepage-features-grid">
          {FEATURES.map((feat) => (
            <motion.div
              key={feat.title}
              variants={fadeUp}
              whileHover={{ y: -6, boxShadow: '0 20px 40px rgba(15,23,42,0.08)' }}
              style={{
                padding: 32, borderRadius: 20, background: '#FFFFFF',
                border: '1px solid #E2E8F0', transition: 'all 0.3s ease',
                cursor: 'default',
              }}
            >
              <div style={{
                width: 52, height: 52, borderRadius: 14, background: feat.bg,
                display: 'grid', placeItems: 'center', marginBottom: 20,
              }}>
                <feat.icon size={24} color={feat.color} />
              </div>
              <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', letterSpacing: '-0.01em' }}>{feat.title}</h3>
              <p style={{ marginTop: 10, fontSize: 14, color: '#64748B', lineHeight: 1.65 }}>{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ─────────── HOW IT WORKS ─────────── */}
      <AnimatedSection id="how-it-works" style={{ background: '#FFFFFF', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 32px' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>How It Works</span>
            <h2 style={{ marginTop: 12, fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
              From role creation to hiring decision in minutes
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 32 }} className="homepage-steps-grid">
            {STEPS.map((step, i) => (
              <motion.div
                key={step.num}
                variants={fadeUp}
                style={{ position: 'relative', padding: 32, borderRadius: 20, background: '#F8FAFC', border: '1px solid #F1F5F9' }}
              >
                <div style={{
                  fontSize: 48, fontWeight: 900, color: '#EEF2FF',
                  position: 'absolute', top: 16, right: 24,
                  lineHeight: 1, letterSpacing: '-0.04em',
                }}>
                  {step.num}
                </div>
                <div style={{
                  width: 48, height: 48, borderRadius: 14,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  display: 'grid', placeItems: 'center', marginBottom: 20,
                  boxShadow: '0 6px 16px rgba(99,102,241,0.25)',
                }}>
                  <step.icon size={22} color="#FFFFFF" />
                </div>
                <h3 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6 }}>{step.desc}</p>
                {i < STEPS.length - 1 && (
                  <ChevronRight
                    size={20}
                    color="#CBD5E1"
                    style={{ position: 'absolute', right: -26, top: '50%', transform: 'translateY(-50%)' }}
                    className="homepage-step-arrow"
                  />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* ─────────── FOR TEAMS ─────────── */}
      <AnimatedSection id="for-teams" style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 32px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }} className="homepage-teams-grid">
          <motion.div variants={fadeUp}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>For Teams</span>
            <h2 style={{ marginTop: 12, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
              Built for hiring teams who demand efficiency
            </h2>
            <p style={{ marginTop: 16, fontSize: 16, color: '#64748B', lineHeight: 1.65 }}>
              Stop juggling spreadsheets, email threads, and scheduling tools. AI Interviewer gives your team a single source of truth for every candidate interaction.
            </p>

            <div style={{ marginTop: 36, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {TEAM_BENEFITS.map((b) => (
                <motion.div key={b.title} variants={fadeUp} style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{
                    width: 40, height: 40, borderRadius: 12, background: '#EEF2FF',
                    display: 'grid', placeItems: 'center', flexShrink: 0,
                  }}>
                    <b.icon size={18} color="#6366F1" />
                  </div>
                  <div>
                    <h4 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A' }}>{b.title}</h4>
                    <p style={{ marginTop: 4, fontSize: 14, color: '#64748B', lineHeight: 1.5 }}>{b.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Visual panel */}
          <motion.div
            variants={fadeUp}
            style={{
              borderRadius: 24, padding: 40, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
              color: '#FFFFFF', position: 'relative', overflow: 'hidden',
            }}
          >
            <div style={{
              position: 'absolute', top: -60, right: -60, width: 200, height: 200,
              background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, transparent 70%)',
              borderRadius: '50%',
            }} />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#818CF8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16 }}>Admin Dashboard</p>
              <h3 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
                Command center for your entire hiring pipeline
              </h3>
              <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Roles deployed', val: '12' },
                  { label: 'Shortlisted', val: '34' },
                  { label: 'Avg. score', val: '7.8' },
                  { label: 'This week', val: '+18' },
                ].map((item) => (
                  <div key={item.label} style={{ padding: 16, background: 'rgba(255,255,255,0.06)', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <p style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{item.label}</p>
                    <p style={{ marginTop: 4, fontSize: 24, fontWeight: 800, color: '#FFFFFF' }}>{item.val}</p>
                  </div>
                ))}
              </div>
              <button
                onClick={goSignup}
                style={{
                  marginTop: 28, padding: '12px 24px', borderRadius: 10, border: 'none',
                  background: '#6366F1', color: '#FFFFFF', fontWeight: 700, fontSize: 14,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8,
                }}
              >
                Try the Dashboard <ArrowRight size={16} />
              </button>
            </div>
          </motion.div>
        </div>
      </AnimatedSection>

      {/* ─────────── PRICING (commented out) ───────────
      <AnimatedSection id="pricing" style={{ background: '#FFFFFF', borderTop: '1px solid #F1F5F9', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '120px 32px' }}>
          <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 64 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Pricing</span>
            <h2 style={{ marginTop: 12, fontSize: 'clamp(28px, 3.5vw, 44px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Plans that scale with your team
            </h2>
            <p style={{ marginTop: 16, fontSize: 17, color: '#64748B', maxWidth: 480, margin: '16px auto 0', lineHeight: 1.6 }}>
              Start free. Upgrade when you're ready. No credit card required.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, alignItems: 'stretch' }} className="homepage-pricing-grid">
            {PLANS.map((plan) => (
              <motion.div
                key={plan.name}
                variants={fadeUp}
                whileHover={{ y: -6 }}
                style={{
                  padding: 36, borderRadius: 24,
                  background: plan.highlighted ? 'linear-gradient(135deg, #6366F1, #7C3AED)' : '#FFFFFF',
                  border: plan.highlighted ? 'none' : '1px solid #E2E8F0',
                  color: plan.highlighted ? '#FFFFFF' : '#0F172A',
                  position: 'relative', overflow: 'hidden',
                  boxShadow: plan.highlighted ? '0 20px 40px rgba(99,102,241,0.25)' : '0 4px 12px rgba(0,0,0,0.03)',
                  display: 'flex', flexDirection: 'column',
                }}
              >
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute', top: 16, right: -30, transform: 'rotate(45deg)',
                    background: '#FBBF24', color: '#78350F', padding: '4px 40px',
                    fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    Popular
                  </div>
                )}
                <h3 style={{ fontSize: 20, fontWeight: 700 }}>{plan.name}</h3>
                <div style={{ marginTop: 16, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 44, fontWeight: 800, letterSpacing: '-0.03em' }}>{plan.price}</span>
                  {plan.period && <span style={{ fontSize: 16, opacity: 0.7 }}>{plan.period}</span>}
                </div>
                <p style={{ marginTop: 12, fontSize: 14, opacity: 0.75, lineHeight: 1.5 }}>{plan.desc}</p>

                <div style={{ marginTop: 28, flex: 1 }}>
                  {plan.features.map((f) => (
                    <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
                      <CheckCircle size={16} color={plan.highlighted ? '#FFFFFF' : '#10B981'} style={{ opacity: plan.highlighted ? 0.9 : 1, flexShrink: 0 }} />
                      <span style={{ fontSize: 14, fontWeight: 500 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <button
                  onClick={goSignup}
                  style={{
                    marginTop: 28, width: '100%', padding: '14px 24px', borderRadius: 12,
                    border: plan.highlighted ? '2px solid rgba(255,255,255,0.3)' : '1.5px solid #E2E8F0',
                    background: plan.highlighted ? 'rgba(255,255,255,0.15)' : '#FFFFFF',
                    color: plan.highlighted ? '#FFFFFF' : '#334155',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseOver={(e) => {
                    if (plan.highlighted) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                    } else {
                      e.currentTarget.style.borderColor = '#6366F1';
                      e.currentTarget.style.color = '#6366F1';
                    }
                  }}
                  onMouseOut={(e) => {
                    if (plan.highlighted) {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    } else {
                      e.currentTarget.style.borderColor = '#E2E8F0';
                      e.currentTarget.style.color = '#334155';
                    }
                  }}
                >
                  {plan.cta}
                </button>
              </motion.div>
            ))}
          </div>
        </div>
      </AnimatedSection>
      ─────────── END PRICING ─────────── */}

      {/* ─────────── FAQ ─────────── */}
      <AnimatedSection id="faq" style={{ maxWidth: 800, margin: '0 auto', padding: '120px 32px' }}>
        <motion.div variants={fadeUp} style={{ textAlign: 'center', marginBottom: 56 }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#6366F1', textTransform: 'uppercase', letterSpacing: '0.1em' }}>FAQ</span>
          <h2 style={{ marginTop: 12, fontSize: 'clamp(28px, 3.5vw, 40px)', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.03em' }}>
            Frequently asked questions
          </h2>
        </motion.div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              style={{
                borderRadius: 16, border: '1px solid #E2E8F0', background: '#FFFFFF',
                overflow: 'hidden', transition: 'border-color 0.2s',
                borderColor: openFaq === i ? '#C7D2FE' : '#E2E8F0',
              }}
            >
              <button
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                style={{
                  width: '100%', padding: '20px 24px', border: 'none', background: 'transparent',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  gap: 16, textAlign: 'left',
                }}
              >
                <span style={{ fontSize: 15, fontWeight: 600, color: '#0F172A' }}>{faq.q}</span>
                <ChevronDown
                  size={18}
                  color="#94A3B8"
                  style={{
                    transition: 'transform 0.3s',
                    transform: openFaq === i ? 'rotate(180deg)' : 'rotate(0deg)',
                    flexShrink: 0,
                  }}
                />
              </button>
              <AnimatePresence>
                {openFaq === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: 'hidden' }}
                  >
                    <p style={{ padding: '0 24px 20px', fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
                      {faq.a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </AnimatedSection>

      {/* ─────────── CTA BANNER ─────────── */}
      <section style={{ padding: '0 32px 120px' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto', borderRadius: 28, overflow: 'hidden',
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #312E81 100%)',
          padding: '80px 60px', textAlign: 'center', position: 'relative',
        }}>
          <div style={{
            position: 'absolute', top: -100, left: '50%', transform: 'translateX(-50%)',
            width: 600, height: 600,
            background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 50%)',
            borderRadius: '50%', pointerEvents: 'none',
          }} />
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h2 style={{
              fontSize: 'clamp(28px, 3.5vw, 48px)', fontWeight: 800,
              color: '#FFFFFF', letterSpacing: '-0.03em', lineHeight: 1.15,
              maxWidth: 640, margin: '0 auto',
            }}>
              Ready to transform your hiring process?
            </h2>
            <p style={{ marginTop: 20, fontSize: 17, color: '#94A3B8', maxWidth: 500, margin: '20px auto 0', lineHeight: 1.6 }}>
              Join hundreds of teams already using AI Interviewer to hire smarter, faster, and fairer.
            </p>
            <div style={{ marginTop: 36, display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={goSignup}
                style={{
                  padding: '16px 36px', borderRadius: 12, border: 'none',
                  background: '#6366F1', color: '#FFFFFF', fontWeight: 700, fontSize: 16,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                  boxShadow: '0 8px 24px rgba(99,102,241,0.4)',
                }}
              >
                Get Started Free <ArrowRight size={18} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={goLogin}
                style={{
                  padding: '16px 36px', borderRadius: 12,
                  border: '1.5px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)',
                  color: '#FFFFFF', fontWeight: 600, fontSize: 16, cursor: 'pointer',
                }}
              >
                Sign In
              </motion.button>
            </div>
          </div>
        </div>
      </section>

      {/* ─────────── FOOTER ─────────── */}
      <footer style={{ borderTop: '1px solid #E2E8F0', background: '#FFFFFF' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 32px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48 }} className="homepage-footer-grid">
            {/* Brand */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
                  color: '#FFFFFF', display: 'grid', placeItems: 'center',
                  fontWeight: 800, fontSize: 14,
                }}>
                  A
                </div>
                <span style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>AI Interviewer</span>
              </div>
              <p style={{ fontSize: 14, color: '#64748B', lineHeight: 1.6, maxWidth: 280 }}>
                The intelligent hiring platform that helps teams evaluate talent with AI-powered assessments, voice interviews, and smart proctoring.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Product</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Features', 'Pricing', 'How It Works', 'Security'].map((l) => (
                  <a key={l} href={`#${l.toLowerCase().replace(/\s+/g, '-')}`} style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
                     onMouseOver={(e) => e.currentTarget.style.color = '#0F172A'}
                     onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Company</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['About', 'Blog', 'Careers', 'Contact'].map((l) => (
                  <a key={l} href="#" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
                     onMouseOver={(e) => e.currentTarget.style.color = '#0F172A'}
                     onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 16 }}>Legal</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {['Privacy Policy', 'Terms of Service', 'Cookie Policy'].map((l) => (
                  <a key={l} href="#" style={{ fontSize: 14, color: '#64748B', textDecoration: 'none', transition: 'color 0.2s' }}
                     onMouseOver={(e) => e.currentTarget.style.color = '#0F172A'}
                     onMouseOut={(e) => e.currentTarget.style.color = '#64748B'}
                  >
                    {l}
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
            <p style={{ fontSize: 13, color: '#94A3B8' }}>© 2026 AI Interviewer. All rights reserved.</p>
            <div style={{ display: 'flex', gap: 20 }}>
              {['Twitter', 'LinkedIn', 'GitHub'].map((s) => (
                <a key={s} href="#" style={{ fontSize: 13, color: '#94A3B8', textDecoration: 'none', transition: 'color 0.2s' }}
                   onMouseOver={(e) => e.currentTarget.style.color = '#6366F1'}
                   onMouseOut={(e) => e.currentTarget.style.color = '#94A3B8'}
                >
                  {s}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>

      {/* ─────────── RESPONSIVE STYLES ─────────── */}
      <style>{`
        .homepage-nav-links, .homepage-nav-cta { display: flex !important; }
        .homepage-mobile-menu-btn { display: none !important; }

        @media (max-width: 900px) {
          .homepage-nav-links, .homepage-nav-cta { display: none !important; }
          .homepage-mobile-menu-btn { display: flex !important; }
          .homepage-stats-grid { grid-template-columns: repeat(2, 1fr) !important; gap: 20px !important; }
          .homepage-features-grid { grid-template-columns: 1fr !important; }
          .homepage-steps-grid { grid-template-columns: 1fr 1fr !important; }
          .homepage-step-arrow { display: none !important; }
          .homepage-teams-grid { grid-template-columns: 1fr !important; gap: 48px !important; }
          .homepage-pricing-grid { grid-template-columns: 1fr !important; }
          .homepage-footer-grid { grid-template-columns: 1fr 1fr !important; gap: 32px !important; }
        }

        @media (max-width: 600px) {
          .homepage-stats-grid { grid-template-columns: 1fr 1fr !important; }
          .homepage-steps-grid { grid-template-columns: 1fr !important; }
          .homepage-footer-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
