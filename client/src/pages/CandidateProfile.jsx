import { useState, useEffect } from 'react';
import { User, Mail, Phone, Link as LinkIcon, Code, Briefcase, CheckCircle, Download, Sparkles, Mic } from 'lucide-react';
import { getProfile, updateProfile, getUserSessions } from '../services/api';

export default function CandidateProfile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profile: {
      phone: '',
      github: '',
      linkedin: '',
      portfolio: '',
      bio: '',
      skills: ''
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileData, sessionsData] = await Promise.all([
        getProfile(),
        getUserSessions()
      ]);
      setSessions(sessionsData);
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        profile: {
          phone: profileData.profile?.phone || '',
          github: profileData.profile?.github || '',
          linkedin: profileData.profile?.linkedin || '',
          portfolio: profileData.profile?.portfolio || '',
          bio: profileData.profile?.bio || '',
          skills: profileData.profile?.skills || ''
        }
      });
    } catch (error) {
      console.error('Failed to load profile data', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['name'].includes(name)) {
      setFormData(p => ({ ...p, [name]: value }));
    } else {
      setFormData(p => ({
        ...p,
        profile: { ...p.profile, [name]: value }
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({ name: formData.name, profile: formData.profile });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save', error);
      alert('Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadResume = (session) => {
    const printWindow = window.open('', '_blank');
    const accuracy = session.score != null ? Math.round((session.score / Math.max(1, session.questions?.length)) * 100) : 0;
    
    printWindow.document.write(`
      <html>
      <head>
        <title>${formData.name} - AI Interviewer Assessment Report</title>
        <style>
          body { font-family: 'Inter', system-ui, sans-serif; color: #0F172A; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
          h1 { margin-bottom: 0px; font-size: 28px; }
          .subtitle { color: #64748B; margin-top: 5px; font-size: 14px; }
          .contact, .links { font-size: 13px; color: #475569; margin-bottom: 20px; }
          .contact span, .links a { margin-right: 15px; color: #3B82F6; text-decoration: none; }
          .section { margin-top: 30px; border-top: 2px solid #E2E8F0; padding-top: 20px; }
          h2 { font-size: 18px; margin-bottom: 10px; color: #1E293B; }
          .stats { display: flex; gap: 30px; margin-bottom: 20px; }
          .stat-box { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 15px 20px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #4F46E5; }
          .stat-label { font-size: 12px; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
          .bio { background: #EEF2FF; padding: 15px; border-radius: 8px; font-style: italic; color: #4338CA; border-left: 4px solid #4F46E5; }
        </style>
      </head>
      <body>
        <h1>${formData.name}</h1>
        <div class="subtitle">Email: ${formData.email} ${formData.profile.phone ? `| Phone: ${formData.profile.phone}` : ''}</div>
        
        <div class="links">
          ${formData.profile.github ? `<a href="${formData.profile.github}">GitHub</a>` : ''}
          ${formData.profile.linkedin ? `<a href="${formData.profile.linkedin}">LinkedIn</a>` : ''}
          ${formData.profile.portfolio ? `<a href="${formData.profile.portfolio}">Portfolio</a>` : ''}
        </div>

        ${formData.profile.bio ? `
        <div class="section">
          <h2>Professional Bio</h2>
          <div class="bio">${formData.profile.bio}</div>
        </div>
        ` : ''}

        ${formData.profile.skills ? `
        <div class="section">
          <h2>Top Skills</h2>
          <p>${formData.profile.skills}</p>
        </div>
        ` : ''}

        <div class="section">
          <h2>Technical Assessment Breakdown</h2>
          <p><strong>Role Evaluated For:</strong> ${session.jobId?.title || session.jobRole || 'Technical Candidate'}</p>
          <div class="stats">
            <div class="stat-box">
              <div class="stat-value">${session.score != null ? session.score : 0} / ${session.questions?.length || 10}</div>
              <div class="stat-label">MCQ Score</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${accuracy}%</div>
              <div class="stat-label">Accuracy</div>
            </div>
            <div class="stat-box">
              <div class="stat-value">${session.tabSwitchCount}</div>
              <div class="stat-label">Proctor Flags</div>
            </div>
          </div>
        </div>

        <div class="section">
          <h2>Question Analysis & Best Approach</h2>
          <div style="display: flex; flex-direction: column; gap: 20px;">
            ${(session.questions || []).map((q, i) => {
              const candidateAnswer = (session.answers || {})[q.id];
              const isCorrect = candidateAnswer === q.correctAnswer;
              return `
              <div style="border: 1px solid #E2E8F0; padding: 15px; border-radius: 8px; page-break-inside: avoid;">
                <p style="font-weight: 800; font-size: 14px; margin: 0 0 10px 0; color: #1E293B;">Q${i+1}: ${q.question}</p>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 5px;">
                  <div style="background: ${isCorrect ? '#ECFDF5' : '#FFF1F2'}; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                    <strong style="color: ${isCorrect ? '#065F46' : '#991B1B'}">Candidate Choice:</strong><br/>
                    ${candidateAnswer || 'Not Answered'}
                  </div>
                  <div style="background: #F0FDF4; padding: 8px 12px; border-radius: 6px; font-size: 13px;">
                    <strong style="color: #166534">Best Approach:</strong><br/>
                    ${q.correctAnswer}
                  </div>
                </div>
                ${q.explanation ? `
                <div style="margin-top: 10px; font-size: 12px; color: #64748B; border-top: 1px dashed #E2E8F0; padding-top: 10px;">
                  <strong>AI Explanation:</strong> ${q.explanation}
                </div>
                ` : ''}
              </div>
              `;
            }).join('')}
          </div>
        </div>

        <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center;">
          <p style="font-size: 12px; color: #94A3B8;">Assessment Date: ${new Date(session.createdAt).toLocaleDateString()}</p>
          <p style="font-size: 12px; color: #94A3B8; font-weight: bold;">Officially Verified & Generated by AI Interviewer</p>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Wait a brief moment for resources to load before triggering print
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: 20 }}>
        <div className="skeleton" style={{ width: 100, height: 100, borderRadius: '50%' }} />
        <div className="skeleton" style={{ width: 200, height: 20 }} />
        <div className="skeleton" style={{ width: 300, height: 15 }} />
      </div>
    );
  }

  const initials = formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'U';
  const totalInterviews = sessions.length;
  const avgScore = sessions.length > 0 
    ? Math.round((sessions.reduce((acc, s) => acc + (s.score || 0), 0) / (sessions.length * 10)) * 100) 
    : 0;
  const skillsArray = formData.profile.skills ? formData.profile.skills.split(',').map(s => s.trim()).filter(Boolean) : [];
  const topSkill = skillsArray[0] || 'N/A';

  const achievements = [
    { title: 'Fast Learner', icon: <Sparkles size={14} />, color: '#6366F1', unlocked: totalInterviews >= 3 },
    { title: 'High Accuracy', icon: <CheckCircle size={14} />, color: '#10B981', unlocked: avgScore >= 70 },
    { title: 'Voice Expert', icon: <Mic size={14} />, color: '#F59E0B', unlocked: sessions.some(s => s.interviewType === 'voice') },
  ];

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '32px 0' }}>
      {/* Profile Header Block */}
      <div className="card" style={{ padding: 32, marginBottom: 32, position: 'relative', overflow: 'hidden', border: 'none', background: 'linear-gradient(135deg, #4338CA 0%, #6366F1 100%)', boxShadow: '0 20px 25px -5px rgba(67, 56, 202, 0.2)' }}>
        {/* Background Decoration */}
        <div style={{ position: 'absolute', top: -100, right: -100, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -50, left: -50, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.03)' }} />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: 32, position: 'relative', zIndex: 1 }}>
          <div style={{ 
            width: 100, height: 100, borderRadius: 24, 
            background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 32, fontWeight: 800, color: '#FFFFFF',
            border: '1px solid rgba(255,255,255,0.2)',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'
          }}>
            {initials}
          </div>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.02em', marginBottom: 8 }}>{formData.name}</h1>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                <Mail size={16} /> {formData.email}
              </div>
              {formData.profile.phone && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'rgba(255,255,255,0.8)', fontSize: 14 }}>
                  <Phone size={16} /> {formData.profile.phone}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <StatCard label="Interviews" value={totalInterviews} icon={<Briefcase size={18} />} color="#6366F1" />
        <StatCard label="Accuracy" value={`${avgScore}%`} icon={<CheckCircle size={18} />} color="#10B981" />
        <StatCard label="Top Skill" value={topSkill} icon={<Code size={18} />} color="#F59E0B" />
        <div className="card" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 6 }}>Resume Health</p>
          <div style={{ height: 6, background: '#F1F5F9', borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: formData.profile.bio && formData.profile.skills ? '100%' : '50%', background: '#10B981', borderRadius: 10 }} />
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 32 }}>
        {/* Left: Settings */}
        <div className="card" style={{ padding: 0 }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9' }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F172A' }}>Account Settings</h2>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ padding: '28px 36px 8px', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Name & Email row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ProfileField
                  label="Full Name"
                  icon={<User size={16} />}
                  iconBg="#EEF2FF"
                  iconColor="#6366F1"
                >
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="base-input" style={{ paddingLeft: 42 }} placeholder="Your full name" required />
                </ProfileField>

                <ProfileField
                  label="Email Address"
                  hint="Cannot change"
                  icon={<Mail size={16} />}
                  iconBg="#F1F5F9"
                  iconColor="#94A3B8"
                >
                  <input type="email" value={formData.email} disabled className="base-input" style={{ paddingLeft: 42 }} />
                </ProfileField>
              </div>

              {/* Phone */}
              <ProfileField
                label="Phone Number"
                icon={<Phone size={16} />}
                iconBg="#F0FDF4"
                iconColor="#10B981"
              >
                <input type="tel" name="phone" value={formData.profile.phone} onChange={handleChange} className="base-input" style={{ paddingLeft: 42 }} placeholder="+1 (555) 000-0000" />
              </ProfileField>

              {/* Section divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ height: 1, flex: 1, background: '#F1F5F9' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Links & Social</span>
                <div style={{ height: 1, flex: 1, background: '#F1F5F9' }} />
              </div>

              {/* GitHub & LinkedIn row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <ProfileField
                  label="GitHub URL"
                  icon={<Code size={16} />}
                  iconBg="#F5F3FF"
                  iconColor="#7C3AED"
                >
                  <input type="url" name="github" value={formData.profile.github} onChange={handleChange} className="base-input" style={{ paddingLeft: 42 }} placeholder="https://github.com/username" />
                </ProfileField>

                <ProfileField
                  label="LinkedIn URL"
                  icon={<Briefcase size={16} />}
                  iconBg="#EFF6FF"
                  iconColor="#3B82F6"
                >
                  <input type="url" name="linkedin" value={formData.profile.linkedin} onChange={handleChange} className="base-input" style={{ paddingLeft: 42 }} placeholder="https://linkedin.com/in/username" />
                </ProfileField>
              </div>

              {/* Portfolio */}
              <ProfileField
                label="Portfolio Website"
                icon={<LinkIcon size={16} />}
                iconBg="#FEF3C7"
                iconColor="#D97706"
              >
                <input type="url" name="portfolio" value={formData.profile.portfolio} onChange={handleChange} className="base-input" style={{ paddingLeft: 42 }} placeholder="https://mywebsite.com" />
              </ProfileField>

              {/* Section divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ height: 1, flex: 1, background: '#F1F5F9' }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Skills & Bio</span>
                <div style={{ height: 1, flex: 1, background: '#F1F5F9' }} />
              </div>

              {/* Skills */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>Expertise & Skills</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {skillsArray.length > 0 ? skillsArray.map((s, i) => (
                    <span key={i} style={{ padding: '4px 12px', background: '#F5F3FF', color: '#6366F1', borderRadius: 8, fontSize: 12, fontWeight: 700, border: '1px solid #E0E7FF' }}>{s}</span>
                  )) : (
                    <span style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>No skills added yet</span>
                  )}
                </div>
                <input type="text" name="skills" value={formData.profile.skills} onChange={handleChange} className="base-input" placeholder="e.g. React, Node.js, AWS..." />
                <p style={{ fontSize: 12, color: '#94A3B8', marginTop: 6, fontWeight: 500 }}>Use commas to separate skills.</p>
              </div>

              {/* Achievements Mock */}
              <div>
                 <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 12 }}>Candidate Badges</label>
                 <div style={{ display: 'flex', gap: 12 }}>
                   {achievements.map((ach, i) => (
                     <div key={i} title={ach.unlocked ? 'Unlocked!' : 'Keep practicing to unlock'} style={{ 
                       width: 44, height: 44, borderRadius: 14, 
                       background: ach.unlocked ? '#F8FAFC' : '#F1F5F9',
                       border: `2px solid ${ach.unlocked ? ach.color : '#E2E8F0'}`,
                       color: ach.unlocked ? ach.color : '#94A3B8',
                       display: 'grid', placeItems: 'center',
                       opacity: ach.unlocked ? 1 : 0.5,
                       transition: 'all 0.3s'
                     }}>
                       {ach.icon}
                     </div>
                   ))}
                 </div>
              </div>

              {/* Bio */}
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 8 }}>About You</label>
                <textarea name="bio" value={formData.profile.bio} onChange={handleChange} className="base-input" placeholder="Summarize your professional journey..." style={{ minHeight: 120 }} />
              </div>
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, padding: '20px 36px', borderTop: '1px solid #F1F5F9', background: '#FAFBFC' }}>
              {saveSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 14, fontWeight: 600 }}>
                  <CheckCircle size={16} /> Saved successfully
                </span>
              )}
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: '12px 28px',
                  borderRadius: 14,
                  border: 'none',
                  background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: 14,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  boxShadow: '0 8px 24px -6px rgba(99, 102, 241, 0.35)',
                  transition: 'all 0.25s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                }}
                onMouseEnter={e => { if (!saving) { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 12px 32px -6px rgba(99, 102, 241, 0.45)'; }}}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 24px -6px rgba(99, 102, 241, 0.35)'; }}
              >
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Right: Reports & History */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card" style={{ padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A' }}>Recent Interviews</h2>
              <span className="status-pill pill-slate">{sessions.length} sessions</span>
            </div>
            
            {sessions.length === 0 ? (
              <div style={{ background: '#F8FAFC', padding: 24, borderRadius: 12, textAlign: 'center', color: '#64748B', fontSize: 13, border: '1px dashed #E2E8F0' }}>
                No interview data available yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {sessions.map(session => (
                  <div key={session._id} style={{ 
                    padding: 16, borderRadius: 12, border: '1px solid #F1F5F9', background: '#FAFBFC',
                    transition: 'all 0.2s ease'
                  }} className="card-hover">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>{session.jobId?.title || session.jobRole || 'Interview'}</h3>
                        <p style={{ fontSize: 12, color: '#94A3B8' }}>{new Date(session.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: '#4338CA' }}>{`${session.score || 0} / 10`}</span>
                        <p style={{ fontSize: 10, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Score</p>
                      </div>
                    </div>
                    
                    <button 
                      onClick={() => handleDownloadResume(session)}
                      className="btn-secondary" 
                      style={{ width: '100%', padding: '8px', fontSize: 12, fontWeight: 600, background: '#FFFFFF', borderRadius: 8 }}
                    >
                      <Download size={14} /> Download Report
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card" style={{ padding: 24, background: 'linear-gradient(to bottom right, #FFFFFF, #F8FAFC)' }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#0F172A', marginBottom: 12 }}>Pro Tip</h2>
            <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
              Keep your bio and top skills updated. AI Interviewer uses this information to personalize your practice sessions and provide more relevant feedback.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 12, background: `${color}10`, color: color, display: 'grid', placeItems: 'center' }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{label}</p>
        <p style={{ fontSize: 20, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{value}</p>
      </div>
    </div>
  );
}

/* ─── Reusable field wrapper with icon badge ─── */
function ProfileField({ label, hint, icon, iconBg, iconColor, children }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</label>
        {hint && (
          <span style={{
            fontSize: 11, fontWeight: 600, color: '#94A3B8',
            background: '#F8FAFC', padding: '2px 8px', borderRadius: 6,
          }}>
            {hint}
          </span>
        )}
      </div>
      <div style={{ position: 'relative' }}>
        {/* Icon badge */}
        <div style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          width: 26, height: 26, borderRadius: 8,
          background: iconBg || '#F1F5F9',
          color: iconColor || '#94A3B8',
          display: 'grid', placeItems: 'center',
          zIndex: 1, pointerEvents: 'none',
        }}>
          {icon}
        </div>
        {children}
      </div>
    </div>
  );
}
