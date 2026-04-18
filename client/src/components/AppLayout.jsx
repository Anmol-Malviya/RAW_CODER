import { useState, useRef, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { LayoutDashboard, Settings, Video, BarChart3, Database, BookOpen, User, HelpCircle, LogOut, Briefcase, ChevronDown } from 'lucide-react';

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
  // Candidate sub-routes (specific before generic)
  { match: '/candidate/practice', title: 'Practice Area' },
  { match: '/candidate/profile', title: 'My Profile' },
  { match: '/candidate/support', title: 'Help & Support' },
  { match: '/candidate', title: 'Dashboard' },
  { match: '/check', title: 'System Check' },
  { match: '/apply', title: 'Apply to role' },
  { match: '/assessment', title: 'Live interview' },
  { match: '/results', title: 'Report' },
  { match: '/coding', title: 'Coding test' },
  { match: '/voice-interview', title: 'Voice Interview' },
  // Admin sub-routes (specific before generic)
  { match: '/admin/roles', title: 'Role Management' },
  { match: '/admin/live', title: 'Live Monitoring' },
  { match: '/admin/questions', title: 'Question Bank' },
  { match: '/admin/sessions', title: 'Interview Sessions' },
  { match: '/admin/analytics', title: 'Analytics' },
  { match: '/admin/settings', title: 'Settings' },
  { match: '/admin', title: 'Dashboard' },
];

function getPageTitle(pathname) {
  const match = titleMap.find((item) => pathname.startsWith(item.match));
  return match ? match.title : 'VyorAI';
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const items = user?.role === 'admin' ? adminNav : candidateNav;
  const pageTitle = getPageTitle(location.pathname);

  const initials = user?.name?.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase() || 'U';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close dropdown on navigation
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [location.pathname]);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div>
          <div className="sidebar-brand">
            <div className="brand-mark" style={{ background: 'linear-gradient(135deg, #6366F1, #4F46E5)', color: 'white', border: 'none' }}>V</div>
            <div>
              <p className="brand-name">VyorAI</p>
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
      </aside>

      <div className="content-layout">
        <header className="topbar">
          <h1 className="topbar-title">{pageTitle}</h1>
          
          <div className="profile-container" ref={dropdownRef}>
            <button 
              className="profile-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="profile-copy">
                <p className="profile-name">{user?.name || 'Your name'}</p>
                <p className="profile-role">{user?.role === 'admin' ? 'Administrator' : 'Candidate'}</p>
              </div>
              <div className="profile-avatar-group">
                <div className="profile-avatar">{initials}</div>
                <ChevronDown size={14} className={`dropdown-arrow ${isDropdownOpen ? 'active' : ''}`} />
              </div>
            </button>

            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="profile-dropdown"
                >
                  <div className="dropdown-header">
                    <p className="dropdown-user-name">{user?.name}</p>
                    <p className="dropdown-user-email">{user?.email}</p>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-stats">
                    <div className="dropdown-stat-item">
                      <span className="stat-label">Power level</span>
                      <span className="stat-value">Elite</span>
                    </div>
                    <div className="dropdown-divider-v" />
                    <div className="dropdown-stat-item">
                      <span className="stat-label">Status</span>
                      <span className="stat-value" style={{ color: '#10B981' }}>Active</span>
                    </div>
                  </div>

                  <div className="dropdown-divider" />

                  <div className="dropdown-menu">
                    <Link to={user?.role === 'admin' ? '/admin/settings' : '/candidate/profile'} className="dropdown-item">
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <button onClick={handleLogout} className="dropdown-item logout">
                      <LogOut size={16} />
                      <span>Sign out</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </header>

        <main className="content-main">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
