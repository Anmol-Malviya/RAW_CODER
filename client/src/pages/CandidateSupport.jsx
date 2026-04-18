import React, { useState } from 'react';
import { HelpCircle, Mail, MessageSquare, Phone, ChevronDown, ChevronUp, Send, CheckCircle } from 'lucide-react';

const faqs = [
  {
    question: "What happens if my internet disconnects during the interview?",
    answer: "Our system automatically saves your progress locally. If you disconnect, try to reconnect within 5 minutes. The timer will pause for minor disruptions, but excessive disconnections may flag your session for review by the recruiter."
  },
  {
    question: "Can I use external tools or IDEs during the coding round?",
    answer: "No. The AI Interviewer platform is equipped with an integrated development environment (IDE). Navigating away to other tabs or opening external applications will trigger proctoring alerts."
  },
  {
    question: "How is my screen and camera recording used?",
    answer: "Your recordings are strictly used for evaluation and proctoring purposes. They are securely shared only with the hiring team responsible for the role you applied for."
  },
  {
    question: "When will I receive my results?",
    answer: "Once you submit your assessment, the AI evaluates it immediately. However, the final decision and communication timeline depend entirely on the recruiter. You can view your baseline score in your profile's 'My Interview Reports' section."
  }
];

export default function CandidateSupport() {
  const [openFaq, setOpenFaq] = useState(null);
  const [formData, setFormData] = useState({ subject: '', message: '' });
  const [status, setStatus] = useState('idle'); // idle, sending, sent

  const toggleFaq = (index) => {
    if (openFaq === index) setOpenFaq(null);
    else setOpenFaq(index);
  };

  const handleSupportSubmit = (e) => {
    e.preventDefault();
    setStatus('sending');
    // Simulate API call to send ticket
    setTimeout(() => {
      setStatus('sent');
      setFormData({ subject: '', message: '' });
      setTimeout(() => setStatus('idle'), 4000);
    }, 1500);
  };

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
          <HelpCircle size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Help & Support</h1>
          <p style={{ color: '#64748B' }}>Get help with technical issues or reach out to recruiters directly.</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32, alignItems: 'start' }}>
        
        {/* Left Column: Contact Form */}
        <div className="card" style={{ padding: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>Contact Technical Support</h2>
            <p style={{ color: '#64748B', fontSize: 13 }}>Facing an issue? Drop us a message and our team will assist you shortly.</p>
          </div>

          <form onSubmit={handleSupportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Issue Category / Subject</label>
              <select 
                className="base-input" 
                style={{ width: '100%', height: 38 }}
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              >
                <option value="" disabled>Select an issue category</option>
                <option value="technical">Technical Glitch / Bug</option>
                <option value="camera_issue">Camera or Mic Permissions</option>
                <option value="job_code">Invalid Job Code</option>
                <option value="other">Other Inquiry</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Detailed Message</label>
              <textarea 
                className="base-input" 
                placeholder="Describe your issue in detail..." 
                style={{ width: '100%', height: 120, resize: 'vertical' }} 
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
            </div>

            <button 
              type="submit" 
              className="btn-primary" 
              disabled={status === 'sending' || status === 'sent'}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, height: 44, marginTop: 8 }}
            >
              {status === 'sending' ? (
                'Sending request...'
              ) : status === 'sent' ? (
                <><CheckCircle size={18} /> Ticket Submitted</>
              ) : (
                <><Send size={18} /> Submit Support Ticket</>
              )}
            </button>
            
            {status === 'sent' && (
              <p style={{ color: '#10B981', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
                We've received your request. A copy has been sent to your email.
              </p>
            )}
          </form>
        </div>

        {/* Right Column: FAQs and Quick contacts */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          
          {/* Quick Contact Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: '#E0E7FF', color: '#4F46E5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <Mail size={18} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>Email Us</h3>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>support@aiinterviewer.com</p>
            </div>
            
            <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 20, background: '#DCFCE7', color: '#16A34A', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                <MessageSquare size={18} />
              </div>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1E293B' }}>Live Chat</h3>
              <p style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>Available 9AM - 6PM</p>
            </div>
          </div>

          {/* FAQs */}
          <div className="card" style={{ padding: 32 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, color: '#0F172A', marginBottom: 20 }}>Frequently Asked Questions</h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {faqs.map((faq, idx) => (
                <div key={idx} style={{ border: '1px solid #E2E8F0', borderRadius: 8, overflow: 'hidden' }}>
                  <button 
                    onClick={() => toggleFaq(idx)}
                    style={{ width: '100%', background: openFaq === idx ? '#F8FAFC' : 'white', border: 'none', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', textAlign: 'left' }}
                  >
                    <span style={{ fontSize: 14, fontWeight: 500, color: '#1E293B', paddingRight: 20 }}>{faq.question}</span>
                    <span style={{ color: '#94A3B8', flexShrink: 0 }}>
                      {openFaq === idx ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </span>
                  </button>
                  {openFaq === idx && (
                    <div style={{ padding: '0 20px 20px 20px', background: '#F8FAFC', fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
                      <div style={{ paddingTop: 8, borderTop: '1px solid #E2E8F0' }}>
                        {faq.answer}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
