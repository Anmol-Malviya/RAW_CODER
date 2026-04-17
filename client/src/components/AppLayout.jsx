import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Video, FileBarChart2, Code2, LogOut } from 'lucide-react';

const candidateNav = [
  { label: 'Dashboard', href: '/candidate', icon: LayoutDashboard, match: '/candidate' },
  { label: 'Interviews', href: '/assessment', icon: Video, match: '/assessment' },
  { label: 'Coding', href: '/coding', icon: Code2, match: '/coding' },
  { label: 'Reports', href: '/results', icon: FileBarChart2, match: '/results' },
];

const adminNav = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard, match: '/admin' },
  { label: 'Interviews', href: '/admin', icon: Video, match: '/interviews' },
  { label: 'Reports', href: '/results', icon: FileBarChart2, match: '/results' },
];

const titleMap = [
  { match: '/candidate', title: 'Dashboard' },
  { match: '/apply', title: 'Apply to role' },
  { match: '/assessment', title: 'Live interview' },
  { match: '/results', title: 'Report' },
  { match: '/coding', title: 'Coding test' },
  { match: '/admin', title: 'Admin monitoring' },
];

function getPageTitle(pathname) {
  const match = titleMap.find((item) => pathname.startsWith(item.match));
  return match ? match.title : 'VyorAI';
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
            <div className="brand-mark">V</div>
            <div>
              <p className="brand-name">VyorAI</p>
              <p className="brand-subtitle">Interview platform</p>
            </div>
          </div>

          <p className="sidebar-section-label">Workspace</p>
          <nav className="sidebar-nav">
            {items.map((item) => {
              const active = location.pathname.startsWith(item.match);
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
