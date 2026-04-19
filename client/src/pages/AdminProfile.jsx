import { useState, useEffect } from 'react';
import { User, Mail, Phone, Shield, Briefcase, Users, TrendingUp, CheckCircle, Award, Layout, LogOut, Settings, Bell, Zap } from 'lucide-react';
import { getProfile, updateProfile, fetchJobs } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function AdminProfile() {
  const { logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [stats, setStats] = useState({
    totalJobs: 0,
    activeJobs: 0,
    totalCandidates: 0,
  });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    profile: {
      phone: '',
      department: 'Talent Acquisition',
      title: 'Senior HR Administrator',
      bio: '',
    }
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileData, jobsData] = await Promise.all([
        getProfile(),
        fetchJobs()
      ]);
      
      setFormData({
        name: profileData.name || '',
        email: profileData.email || '',
        profile: {
          phone: profileData.profile?.phone || '',
          department: profileData.profile?.department || 'Talent Acquisition',
          title: profileData.profile?.title || 'Senior HR Administrator',
          bio: profileData.profile?.bio || '',
        }
      });

      // Calculate some quick stats
      setStats({
        totalJobs: jobsData.length,
        activeJobs: jobsData.length, // Simplified
        totalCandidates: 0, // We'd need another API call for this normally, but we'll skeleton it
      });

    } catch (error) {
      console.error('Failed to load admin profile', error);
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
      console.error('Failed to save profile', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="skeleton" style={{ height: 200, borderRadius: 24 }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20 }}>
          <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
          <div className="skeleton" style={{ height: 120, borderRadius: 16 }} />
        </div>
        <div className="skeleton" style={{ height: 400, borderRadius: 24 }} />
      </div>
    );
  }

  const initials = formData.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() || 'A';

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 20px' }}>
      
      {/* Premium Header Container */}
      <div style={{ 
        position: 'relative', 
        marginBottom: 40, 
        padding: '60px 48px', 
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)', 
        borderRadius: 32,
        overflow: 'hidden',
        boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.4)'
      }}>
        {/* Abstract shapes for premium feel */}
        <div style={{ position: 'absolute', top: '-10%', right: '-5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)' }} />
        <div style={{ position: 'absolute', bottom: '-20%', left: '-10%', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <div style={{ 
              width: 120, height: 120, borderRadius: 30, 
              background: 'linear-gradient(135deg, #6366F1, #8B5CF6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 44, fontWeight: 900, color: '#FFFFFF',
              boxShadow: '0 20px 40px rgba(99, 102, 241, 0.3)',
              border: '4px solid rgba(255,255,255,0.1)'
            }}>
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <h1 style={{ fontSize: 40, fontWeight: 800, color: '#FFFFFF', margin: 0, letterSpacing: '-0.03em' }}>{formData.name}</h1>
                <span style={{ 
                  background: 'rgba(99, 102, 241, 0.2)', 
                  border: '1px solid rgba(99, 102, 241, 0.3)', 
                  color: '#A5B4FC', 
                  padding: '4px 12px', 
                  borderRadius: 99, 
                  fontSize: 12, 
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  <Shield size={14} /> Super Admin
                </span>
              </div>
              <p style={{ fontSize: 18, color: '#94A3B8', fontWeight: 500 }}>{formData.profile.title} • {formData.profile.department}</p>
              <div style={{ display: 'flex', gap: 20, marginTop: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                  <Mail size={16} /> {formData.email}
                </div>
                {formData.profile.phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'rgba(255,255,255,0.6)', fontSize: 14 }}>
                    <Phone size={16} /> {formData.profile.phone}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <button 
            onClick={logout}
            style={{
              padding: '12px 24px',
              borderRadius: 16,
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#F1F5F9',
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'}
          >
            <LogOut size={18} /> Logout
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 40 }}>
        <AdminStatCard label="Total Roles" value={stats.totalJobs} icon={<Briefcase size={22} />} color="#6366F1" />
        <AdminStatCard label="Live Interviews" value={stats.activeJobs} icon={<Zap size={22} />} color="#F59E0B" />
        <AdminStatCard label="Success Rate" value="94%" icon={<TrendingUp size={22} />} color="#10B981" />
        <AdminStatCard label="Platform Usage" value="High" icon={<Layout size={22} />} color="#EC4899" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 32 }}>
        {/* Main Settings Card */}
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '24px 32px', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: 20, fontWeight: 800, color: '#0F172A' }}>Profile Settings</h2>
              <p style={{ fontSize: 13, color: '#64748B', marginTop: 2 }}>Update your administrative credentials and info.</p>
            </div>
            <Settings size={20} color="#94A3B8" />
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <AdminField label="Full Name" icon={<User size={18} />}>
                  <input type="text" name="name" value={formData.name} onChange={handleChange} className="base-input" style={{ paddingLeft: 44 }} required />
                </AdminField>
                
                <AdminField label="Email Address (Linked)" icon={<Mail size={18} />}>
                  <input type="email" value={formData.email} disabled className="base-input" style={{ paddingLeft: 44, background: '#F8FAFC', color: '#94A3B8' }} />
                </AdminField>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                <AdminField label="Phone Number" icon={<Phone size={18} />}>
                  <input type="tel" name="phone" value={formData.profile.phone} onChange={handleChange} className="base-input" style={{ paddingLeft: 44 }} placeholder="+1 (234) 567-890" />
                </AdminField>
                
                <AdminField label="Job Title" icon={<Award size={18} />}>
                  <input type="text" name="title" value={formData.profile.title} onChange={handleChange} className="base-input" style={{ paddingLeft: 44 }} />
                </AdminField>
              </div>

              <AdminField label="Department" icon={<Users size={18} />}>
                <select name="department" value={formData.profile.department} onChange={handleChange} className="base-input" style={{ paddingLeft: 44 }}>
                  <option value="Talent Acquisition">Talent Acquisition</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Engineering Management">Engineering Management</option>
                  <option value="Operations">Operations</option>
                </select>
              </AdminField>

              <AdminField label="Administrative Bio">
                <textarea 
                  name="bio" 
                  value={formData.profile.bio} 
                  onChange={handleChange} 
                  className="base-input" 
                  style={{ minHeight: 120, padding: 16 }} 
                  placeholder="A brief description of your role and responsibilities..."
                />
              </AdminField>
            </div>

            <div style={{ padding: '24px 40px', background: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 20 }}>
              {saveSuccess && (
                <div style={{ color: '#10B981', fontWeight: 600, fontSize: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle size={18} /> Changes saved successfully
                </div>
              )}
              <button 
                type="submit" 
                disabled={saving}
                className="btn-primary" 
                style={{ 
                  padding: '12px 32px', 
                  fontSize: 14, 
                  fontWeight: 700, 
                  borderRadius: 14,
                  boxShadow: '0 10px 20px -5px rgba(99, 102, 241, 0.4)'
                }}
              >
                {saving ? 'Saving...' : 'Update Records'}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Permissions Card */}
          <div className="card" style={{ padding: 24, background: 'linear-gradient(to bottom right, #FFFFFF, #F8FAFC)' }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Shield size={18} color="#6366F1" /> Administrative Rights
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <PermissionItem label="Full Database Access" active />
              <PermissionItem label="User Management" active />
              <PermissionItem label="Role Deployment" active />
              <PermissionItem label="Analytics Dashboard" active />
              <PermissionItem label="API Configuration" active={false} />
            </div>
          </div>

          {/* Activity Placeholder */}
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Bell size={18} color="#F59E0B" /> Recent Notifications
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <NotificationItem title="Weekly Hiring Digest" time="2h ago" />
              <NotificationItem title="New Candidate Shortlisted" time="5h ago" />
              <NotificationItem title="System Update Completed" time="Yesterday" />
            </div>
            <button style={{ width: '100%', marginTop: 20, padding: 12, borderRadius: 12, border: '1px solid #E2E8F0', background: 'transparent', color: '#64748B', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              View All Activity
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminStatCard({ label, value, icon, color }) {
  return (
    <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 20, transition: 'transform 0.2s', cursor: 'default' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
      <div style={{ 
        width: 56, height: 56, borderRadius: 16, 
        background: `${color}15`, 
        color: color, 
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `inset 0 0 0 1px ${color}20`
      }}>
        {icon}
      </div>
      <div>
        <p style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
        <p style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 2 }}>{value}</p>
      </div>
    </div>
  );
}

function AdminField({ label, icon, children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <label style={{ fontSize: 14, fontWeight: 700, color: '#334155' }}>{label}</label>
      <div style={{ position: 'relative' }}>
        {icon && (
          <div style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {icon}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

function PermissionItem({ label, active }) {
  return (
    <div style={{ 
      display: 'flex', alignItems: 'center', justifyContent: 'space-between', 
      padding: '10px 14px', borderRadius: 12, 
      background: active ? '#F0FDF4' : '#F8FAFC',
      border: `1px solid ${active ? '#DCFCE7' : '#F1F5F9'}`
    }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: active ? '#166534' : '#94A3B8' }}>{label}</span>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: active ? '#10B981' : '#CBD5E1' }} />
    </div>
  );
}

function NotificationItem({ title, time }) {
  return (
    <div style={{ display: 'flex', gap: 14 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366F1', marginTop: 6 }} />
      <div>
        <p style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', margin: 0 }}>{title}</p>
        <p style={{ fontSize: 11, color: '#94A3B8', margin: '2px 0 0 0' }}>{time}</p>
      </div>
    </div>
  );
}
