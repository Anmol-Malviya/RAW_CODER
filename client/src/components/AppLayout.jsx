import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Settings, Video, BarChart3, Database, BookOpen, User, HelpCircle, LogOut, Briefcase } from 'lucide-react';

const candidateNav = [
  { label: 'Dashboard', href: '/candidate', icon: LayoutDashboard, match: '/candidate' },
  { label: 'Practice Area', href: '/candidate/practice', icon: BookOpen, match: '/candidate/practice' },
  { label: 'My Profile', href: '/candidate/profile', icon: User, match: '/candidate/profile' },
  { label: 'Help & Support', href: '/candidate/support', icon: HelpCircle, match: '/candidate/support' },
];

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, match: '/admin', exact: true },
  { label: 'Manage Roles', href: '/admin/roles', icon: Briefcase, match: '/admin/roles' },
  { label: 'Live Monitoring', href: '/admin/live', icon: Video, match: '/admin/live' },
  { label: 'Question Bank', href: '/admin/questions', icon: Database, match: '/admin/questions' },
  { label: 'Sessions', href: '/admin/sessions', icon: BookOpen, match: '/admin/sessions' },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, match: '/admin/analytics' },
  { label: 'Settings', href: '/admin/settings', icon: Settings, match: '/admin/settings' },
];

const titleMap = [
  { match: '/candidate', title: 'Dashboard' },
  { match: '/apply', title: 'Apply to role' },
  { match: '/assessment', title: 'Live interview' },
  { match: '/results', title: 'Report' },
  { match: '/coding', title: 'Coding test' },
  { match: '/admin', title: 'Admin monitoring' },
  { match: '/admin/live', title: 'Live Monitoring' },
  { match: '/admin/sessions', title: 'Interview Sessions' },
];

function getPageTitle(pathname) {
  const match = titleMap.find((item) => pathname.startsWith(item.match));
  return match ? match.title : 'AI Interviewer';
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const items = user?.role === 'admin' ? adminNav : candidateNav;
  const pageTitle = getPageTitle(location.pathname);

  const initials = user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-mark">A</div>
            <div>
              <p className="brand-name">AI Interviewer</p>
              <p className="brand-subtitle">Interview platform</p>
            </div>
          </div>

          <p className="sidebar-section-label">Workspace</p>
          <nav className="sidebar-nav">
            {items.map((item) => {
              const active = item.exact ? location.pathname === item.match : location.pathname.startsWith(item.match);
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  to={item.href}
                  className={`sidebar-link ${active ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <button
          type="button"
          className="logout-button"
          onClick={() => {
            logout();
            navigate('/');
          }}
        >
          <LogOut size={14} />
          Sign out
        </button>
      </aside>

      <div className="content-layout">
        <header className="topbar">
          <h1 className="topbar-title">{pageTitle}</h1>
          <div className="profile-block">
            <div className="profile-copy">
              <p className="profile-name">{user?.name || 'Your name'}</p>
              <p className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'Candidate'}</p>
            </div>
            <div className="profile-avatar">{initials}</div>
          </div>
        </header>

        <main className="content-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
