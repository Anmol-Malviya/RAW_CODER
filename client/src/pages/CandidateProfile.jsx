import { useState, useEffect } from 'react';
import { User, Mail, Phone, Link as LinkIcon, Code, Briefcase, CheckCircle } from 'lucide-react';
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
        <title>${formData.name} - AI Interviewer Report</title>
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
        <div class="subtitle">Email: ${formData.email} ${formData.profile.phone ? '| Phone: '+formData.profile.phone : ''}</div>
        
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
          <h2>AI Interviewer Technical Report</h2>
          <p><strong>Role Evaluated For:</strong> ${session.jobId?.title || session.jobRole || 'Technical Candidate'}</p>
          <p><strong>Assessment Date:</strong> ${new Date(session.createdAt).toLocaleDateString()}</p>
          
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
          <p style="font-size: 12px; color: #94A3B8; text-align: center; margin-top: 40px;">Officially Verified & Generated by AI Interviewer</p>
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
    return <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading profile...</div>;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
      {/* Profile Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
          <User size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>My Profile</h1>
          <p style={{ color: '#64748B' }}>Manage your personal details and view your interview reports.</p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        
        {/* Profile Settings Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#0F172A' }}>Personal Information</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Full Name</label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <User size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="base-input" style={{ paddingLeft: 36, width: '100%', height: 38 }} required />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Email Address (Cannot change)</label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Mail size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
                  <input type="email" value={formData.email} disabled className="base-input" style={{ paddingLeft: 36, width: '100%', height: 38, background: '#F8FAFC', color: '#94A3B8' }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Phone Number</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <Phone size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
                <input type="tel" name="phone" value={formData.profile.phone} onChange={handleChange} className="base-input" placeholder="+1 (555) 000-0000" style={{ paddingLeft: 36, width: '100%', height: 38 }} />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>GitHub URL</label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Code size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
                  <input type="url" name="github" value={formData.profile.github} onChange={handleChange} className="base-input" placeholder="https://github.com/username" style={{ paddingLeft: 36, width: '100%', height: 38 }} />
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>LinkedIn URL</label>
                <div className="input-with-icon" style={{ position: 'relative' }}>
                  <Briefcase size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
                  <input type="url" name="linkedin" value={formData.profile.linkedin} onChange={handleChange} className="base-input" placeholder="https://linkedin.com/in/username" style={{ paddingLeft: 36, width: '100%', height: 38 }} />
                </div>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Portfolio Website</label>
              <div className="input-with-icon" style={{ position: 'relative' }}>
                <LinkIcon size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 10 }} />
                <input type="url" name="portfolio" value={formData.profile.portfolio} onChange={handleChange} className="base-input" placeholder="https://mywebsite.com" style={{ paddingLeft: 36, width: '100%', height: 38 }} />
              </div>
            </div>
            
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Top Skills (Comma separated)</label>
              <input type="text" name="skills" value={formData.profile.skills} onChange={handleChange} className="base-input" placeholder="React, Node.js, Python..." style={{ width: '100%', height: 38 }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#334155', marginBottom: 6 }}>Professional Bio</label>
              <textarea name="bio" value={formData.profile.bio} onChange={handleChange} className="base-input" placeholder="Tell us about your experience..." style={{ width: '100%', height: 100, resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 16, marginTop: 10, paddingTop: 20, borderTop: '1px solid #E2E8F0' }}>
              {saveSuccess && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#10B981', fontSize: 14, fontWeight: 500 }}>
                  <CheckCircle size={16} /> Saved Successfully
                </span>
              )}
              <button type="submit" disabled={saving} className="btn-primary" style={{ minWidth: 120 }}>
                {saving ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Interview Reports Card */}
        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20, color: '#0F172A' }}>My Interview Reports</h2>
          {sessions.length === 0 ? (
            <div style={{ background: '#F8FAFC', padding: 30, borderRadius: 8, textAlign: 'center', color: '#64748B' }}>
              You haven't completed any interviews yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {sessions.map(session => (
                <div key={session._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 16, border: '1px solid #E2E8F0', borderRadius: 8 }}>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 600, color: '#1E293B' }}>{session.jobId?.title || session.jobRole || 'Technical Interview'}</h3>
                    <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
                      Taken on {new Date(session.createdAt).toLocaleDateString()} • Score: {session.score != null ? session.score : 0}/{session.questions?.length || 10}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleDownloadResume(session)}
                    className="btn-outline" 
                    style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600 }}
                  >
                    Download Resume PDF
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
