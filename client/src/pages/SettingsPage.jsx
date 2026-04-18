import { useState, useEffect } from 'react';
import { fetchSettings, updateSetting } from '../services/api';
import { 
  Settings, Globe, Shield, Zap, Bell, 
  Save, Loader2, Info, CheckCircle, Smartphone
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState(null);
  const [activeTab, setActiveTab] = useState('general');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (key, value) => {
    setSavingKey(key);
    try {
      await updateSetting(key, value);
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
      showToast('Settings saved successfully!');
    } catch (e) {
      alert('Failed to update setting');
    } finally {
      setSavingKey(null);
    }
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getSettingValue = (key) => settings.find(s => s.key === key)?.value || '';

  const SettingRow = ({ itemKey, label, description, type = 'text', options = [] }) => {
    const value = getSettingValue(itemKey);
    const isSaving = savingKey === itemKey;

    return (
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '24px 0', borderBottom: '1px solid #F1F5F9' }}>
        <div style={{ maxWidth: '60%' }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>{label}</p>
          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>{description}</p>
        </div>
        <div style={{ width: 280, display: 'flex', gap: 12, alignItems: 'center' }}>
          {type === 'text' && (
            <input 
              type="text" 
              className="input-soft"
              value={value}
              onChange={(e) => handleUpdate(itemKey, e.target.value)}
              style={{ flex: 1 }}
            />
          )}
          {type === 'select' && (
            <select 
              className="input-soft"
              value={value}
              onChange={(e) => handleUpdate(itemKey, e.target.value)}
              style={{ flex: 1 }}
            >
              {options.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          )}
          {type === 'number' && (
            <input 
              type="number" 
              className="input-soft"
              value={value}
              onChange={(e) => handleUpdate(itemKey, parseInt(e.target.value))}
              style={{ flex: 1 }}
            />
          )}
          {isSaving && <Loader2 className="spin" size={16} color="#4F46E5" />}
        </div>
      </div>
    );
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'interview', label: 'Interviews', icon: Zap },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
  ];

  if (loading) {
     return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}><Loader2 className="spin" size={40} color="#4F46E5" /></div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
            <Settings size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Platform Settings</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>Configure platform-wide behavior, branding, and security.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: 40 }}>
        {/* Navigation Sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
           {tabs.map(tab => {
             const Icon = tab.icon;
             const active = activeTab === tab.id;
             return (
               <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{ 
                  display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderRadius: 10,
                  border: 'none', background: active ? '#EEF2FF' : 'transparent',
                  color: active ? '#4F46E5' : '#64748B', fontWeight: active ? 700 : 500,
                  cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left'
                }}
               >
                 <Icon size={18} /> {tab.label}
               </button>
             );
           })}
        </div>

        {/* Content Area */}
        <div className="card" style={{ padding: '0 32px' }}>
           {activeTab === 'general' && (
             <div>
                <SettingRow 
                  itemKey="company_name" 
                  label="Company Name" 
                  description="This name will appear on candidate emails and the interview portal."
                />
                <SettingRow 
                  itemKey="admin_email" 
                  label="Support Email" 
                  description="The contact address for candidate inquiries."
                />
                <SettingRow 
                  itemKey="timezone" 
                  label="Timezone" 
                  description="Set the default timezone for interview scheduling and reports."
                  type="select"
                  options={[
                    { label: 'UTC', value: 'utc' },
                    { label: 'India (IST)', value: 'ist' },
                    { label: 'US Eastern (EST)', value: 'est' },
                    { label: 'London (GMT)', value: 'gmt' }
                  ]}
                />
             </div>
           )}

           {activeTab === 'interview' && (
             <div>
                <SettingRow 
                  itemKey="interview_timeout" 
                  label="Session Timeout (s)" 
                  description="Automatically terminate interview after this duration (idle or total)."
                  type="number"
                />
                <SettingRow 
                  itemKey="ai_model" 
                  label="Evaluation Engine" 
                  description="Choose the primary AI model used for scoring and conversation."
                  type="select"
                  options={[
                    { label: 'Gemini 1.5 Flash (Fast)', value: 'gemini-1.5-flash' },
                    { label: 'Gemini 1.5 Pro (Accurate)', value: 'gemini-1.5-pro' },
                    { label: 'GPT-4o (Stable)', value: 'gpt-4o' }
                  ]}
                />
                <SettingRow 
                  itemKey="proctoring_strictness" 
                  label="Strictness Level" 
                  description="Sets how sensitive the AI is to anti-cheating flags (tab switches, etc)."
                  type="select"
                  options={[
                    { label: 'Relaxed', value: 'low' },
                    { label: 'Medium (Recommended)', value: 'medium' },
                    { label: 'Strict', value: 'high' }
                  ]}
                />
             </div>
           )}

           {activeTab === 'security' && (
              <div style={{ padding: '32px 0' }}>
                 <div style={{ background: '#F8FAFC', padding: 20, borderRadius: 12, display: 'flex', gap: 16 }}>
                    <Shield color="#6366F1" size={24} />
                    <div>
                       <p style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Advanced Security Portal</p>
                       <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>Security settings including 2FA, API keys, and access logs are managed in a separate secure environment for your protection.</p>
                       <button className="btn-secondary" style={{ marginTop: 16, fontSize: 12 }}>Open Security Center</button>
                    </div>
                 </div>
              </div>
           )}

           {activeTab === 'notifications' && (
             <div>
                <SettingRow 
                  itemKey="email_notifications" 
                  label="Admin Alerts" 
                  description="Receive email summaries when candidates complete critical assessments."
                  type="select"
                  options={[
                    { label: 'Enabled', value: 'on' },
                    { label: 'Disabled', value: 'off' }
                  ]}
                />
             </div>
           )}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 32, right: 32, background: '#0F172A', color: 'white', padding: '12px 24px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.2)', fontSize: 14, fontWeight: 600, zIndex: 1000 }}>
          <CheckCircle color="#10B981" size={20} /> {toast}
        </div>
      )}
    </div>
  );
}
