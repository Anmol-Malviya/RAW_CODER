import React from 'react';
import { Settings, BarChart3, Database, BookOpen, User, HelpCircle } from 'lucide-react';

const PageWrapper = ({ title, icon: Icon, description }) => (
  <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 0' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
      <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6' }}>
        <Icon size={24} />
      </div>
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: '#0F172A', marginBottom: 4 }}>{title}</h1>
        <p style={{ color: '#64748B' }}>{description}</p>
      </div>
    </div>
    
    <div className="card" style={{ padding: 40, textAlign: 'center' }}>
      <div style={{ width: 64, height: 64, margin: '0 auto 20px', borderRadius: 32, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={28} color="#94A3B8" />
      </div>
      <h3 style={{ fontSize: 18, fontWeight: 600, color: '#1E293B', marginBottom: 8 }}>Coming Soon</h3>
      <p style={{ color: '#64748B', maxWidth: 400, margin: '0 auto' }}>
        We are working hard to bring you this feature. Check back later for updates to the {title.toLowerCase()} module.
      </p>
    </div>
  </div>
);

export const AdminSettings = () => <PageWrapper title="Platform Settings" icon={Settings} description="Configure platform-wide settings and integrations." />;
export const AdminAnalytics = () => <PageWrapper title="Analytics & Reports" icon={BarChart3} description="View detailed hiring trends and platform usage." />;
export const AdminQuestions = () => <PageWrapper title="Question Bank" icon={Database} description="Manage and curate your interview question library." />;
