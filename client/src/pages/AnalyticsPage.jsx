import { useState, useEffect } from 'react';
import { fetchAnalytics } from '../services/api';
import { 
  BarChart3, Users, Target, Briefcase, 
  TrendingUp, ArrowUpRight, ArrowDownRight,
  Filter, Download, Calendar, Loader2
} from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await fetchAnalytics();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <Loader2 className="spin" size={40} color="#4F46E5" />
      </div>
    );
  }

  const StatCard = ({ title, value, icon: Icon, trend, color }) => (
    <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: '#64748B', marginBottom: 8 }}>{title}</p>
          <h3 style={{ fontSize: 28, fontWeight: 700, color: '#0F172A', margin: 0 }}>{value}</h3>
          {trend && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 8 }}>
              <span style={{ 
                fontSize: 12, fontWeight: 700, 
                color: trend > 0 ? '#10B981' : '#EF4444',
                display: 'flex', alignItems: 'center'
              }}>
                {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                {Math.abs(trend)}%
              </span>
              <span style={{ fontSize: 11, color: '#94A3B8' }}>vs last period</span>
            </div>
          )}
        </div>
        <div style={{ padding: 10, borderRadius: 12, background: `${color}15`, color: color }}>
          <Icon size={20} />
        </div>
      </div>
      {/* Decorative accent */}
      <div style={{ position: 'absolute', bottom: -10, right: -10, width: 60, height: 60, borderRadius: '50%', background: `${color}08`, zIndex: 0 }} />
    </div>
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 0' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, borderRadius: 12, background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
            <BarChart3 size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: '#0F172A', marginBottom: 4 }}>Analytics & Reports</h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>Real-time overview of hiring performance and candidate trends.</p>
          </div>
        </div>
        
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ display: 'flex', background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
             {['7d', '30d', '90d'].map(r => (
               <button 
                key={r}
                onClick={() => setTimeRange(r)}
                style={{ 
                  padding: '6px 12px', border: 'none', borderRadius: 8, fontSize: 12, fontWeight: 600, 
                  cursor: 'pointer', background: timeRange === r ? 'white' : 'transparent',
                  color: timeRange === r ? '#0F172A' : '#64748B',
                  boxShadow: timeRange === r ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                  transition: 'all 0.2s'
                }}
               >
                 {r.toUpperCase()}
               </button>
             ))}
          </div>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px' }}>
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24, marginBottom: 32 }}>
        <StatCard title="Total Candidates" value={data.totalCandidates} icon={Users} trend={12} color="#4F46E5" />
        <StatCard title="Average Score" value={`${data.avgScore}/10`} icon={Target} trend={5} color="#10B981" />
        <StatCard title="Active Roles" value={data.activeRoles} icon={Briefcase} trend={-2} color="#F59E0B" />
        <StatCard title="Submission Rate" value="78.4%" icon={TrendingUp} trend={8} color="#7C3AED" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 24 }}>
        
        {/* Hiring Funnel */}
        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8 }}>
            Hiring Funnel <ArrowUpRight size={16} color="#94A3B8" />
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { label: 'Applied', count: data.hiringFunnel.applied, color: '#4F46E5', width: '100%' },
              { label: 'Screened', count: data.hiringFunnel.screened, color: '#6366F1', width: '80%' },
              { label: 'Interviewed', count: data.hiringFunnel.interviewed, color: '#818CF8', width: '45%' },
              { label: 'Shortlisted', count: data.hiringFunnel.shortlisted, color: '#A5B4FC', width: '15%' }
            ].map((step, idx) => (
              <div key={idx} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ fontWeight: 600, color: '#475569' }}>{step.label}</span>
                  <span style={{ fontWeight: 700, color: '#1E293B' }}>{step.count}</span>
                </div>
                <div style={{ height: 32, background: '#F8FAFC', borderRadius: 8, overflow: 'hidden' }}>
                    <div style={{ 
                      height: '100%', width: step.width, background: step.color,
                      transition: 'width 1s cubic-bezier(0.4, 0, 0.2, 1)',
                      display: 'flex', alignItems: 'center', paddingLeft: 12, color: 'white', fontSize: 11, fontWeight: 700
                    }}>
                      {Math.round(parseInt(step.width))}%
                    </div>
                </div>
              </div>
            ))}
          </div>
          <p style={{ marginTop: 24, fontSize: 12, color: '#94A3B8', textAlign: 'center' }}>
            Showing candidate conversion through the current hiring workflow.
          </p>
        </div>

        {/* Score Distribution */}
        <div className="card" style={{ padding: 24 }}>
          <h4 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>Score Distribution</h4>
          <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 8, padding: '0 10px' }}>
            {data.scoreDistribution.map((count, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                <div 
                  style={{ 
                    width: '100%', 
                    height: `${(count / Math.max(...data.scoreDistribution)) * 100}%`, 
                    background: i >= 7 ? '#10B981' : i >= 4 ? '#F59E0B' : '#EF4444',
                    borderRadius: '4px 4px 0 0',
                    minHeight: count > 0 ? 4 : 0,
                    transition: 'all 0.5s ease'
                  }} 
                  title={`${count} candidates scored ${i}`}
                />
                <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8' }}>{i}</span>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 20, paddingTop: 20, display: 'flex', justifyContent: 'space-around' }}>
             <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Top Performers</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#10B981' }}>{data.scoreDistribution.slice(7).reduce((a,b)=>a+b,0)}</p>
             </div>
             <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: 12, color: '#94A3B8', marginBottom: 4 }}>Needs Review</p>
                <p style={{ fontSize: 18, fontWeight: 700, color: '#EF4444' }}>{data.scoreDistribution.slice(0, 4).reduce((a,b)=>a+b,0)}</p>
             </div>
          </div>
        </div>
      </div>

      {/* Chart Section - Weekly Activity */}
      <div className="card" style={{ marginTop: 24, padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
           <h4 style={{ fontSize: 16, fontWeight: 700 }}>Weekly Assessment Activity</h4>
           <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                 <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#4F46E5' }} />
                 <span style={{ fontSize: 12, color: '#64748B' }}>Completed AI Interviews</span>
              </div>
           </div>
        </div>
        <div style={{ height: 180, display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20, padding: '0 20px' }}>
           {data.dailySubmissions.map((val, i) => (
             <div key={i} style={{ flex: 1, position: 'relative', height: '100%', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
               {/* Grid Line */}
               <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 1, background: '#F1F5F9', zIndex: 0 }} />
               
               <div style={{ 
                 width: '40%', height: `${(val / Math.max(...data.dailySubmissions)) * 100}%`, 
                 background: 'linear-gradient(to top, #4F46E5, #818CF8)', borderRadius: 6,
                 zIndex: 1, position: 'relative'
               }}>
                 <div style={{ position: 'absolute', top: -25, left: '50%', transform: 'translateX(-50%)', fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>{val}</div>
               </div>
               
               <div style={{ position: 'absolute', bottom: -30, fontSize: 12, fontWeight: 600, color: '#94A3B8' }}>
                 {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
               </div>
             </div>
           ))}
        </div>
        <div style={{ marginBottom: 20 }} /> {/* Spacer for labels */}
      </div>
    </div>
  );
}
