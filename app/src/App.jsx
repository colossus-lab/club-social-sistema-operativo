import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, Trophy, CalendarDays, Sun, Moon } from 'lucide-react';
import { useClubStore } from './store/useClubStore';
import './App.css';

import Dashboard from './pages/Dashboard';
import Socios from './pages/Socios';
import Tesoreria from './pages/Tesoreria';
import Disciplinas from './pages/Disciplinas';
import Reservas from './pages/Reservas';
import Landing from './pages/Landing';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { to: '/socios', icon: Users, label: 'Socios' },
  { to: '/tesoreria', icon: CreditCard, label: 'Tesorería' },
  { to: '/disciplinas', icon: Trophy, label: 'Deportes' },
  { to: '/reservas', icon: CalendarDays, label: 'Reservas' },
];

function Sidebar() {
  const { clubInfo } = useClubStore();
  return (
    <aside className="sidebar">
      {/* Header — hidden on mobile via CSS */}
      <div className="sidebar-header">
        <img src="/clubsocialos.ico" alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
        <div style={{ overflow: 'hidden' }}>
          <h2 className="text-base font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{clubInfo.name}</h2>
          <span className="text-xs text-secondary">{clubInfo.location}</span>
        </div>
      </div>

      {/* Nav — NO flex-col class so CSS controls direction on mobile */}
      <nav className="sidebar-nav">
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-link${isActive ? ' active' : ''}`}
          >
            <Icon size={22} />
            <span className="nav-label">{label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Sidebar footer — hidden on mobile via CSS */}
      <div className="sidebar-footer glass-panel">
        <p className="text-xs text-muted mb-2">Sistema Operativo</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado</span>
          <span className="badge badge-success">Óptimo</span>
        </div>
        <div className="mt-3 pt-3 border-t border-glass text-center">
          <p className="text-xs text-secondary font-medium">
            by{' '}
            <a href="https://colossuslab.org" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-primary)' }}>
              ColossusLab.org
            </a>
          </p>
        </div>
      </div>
    </aside>
  );
}

function Topbar() {
  const { theme, toggleTheme } = useClubStore();
  const location = useLocation();

  const currentPage = navItems.find(item =>
    item.exact ? location.pathname === item.to : location.pathname.startsWith(item.to)
  );

  return (
    <header className="topbar">
      <span className="topbar-page-title">{currentPage?.label ?? 'Club Social OS'}</span>
      <div className="topbar-actions">
        <button
          onClick={toggleTheme}
          className="icon-btn"
          title="Cambiar Tema"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          {theme === 'dark-theme'
            ? <Sun size={20} className="text-warning" />
            : <Moon size={20} style={{ color: 'var(--accent-primary)' }} />}
        </button>
        <div className="user-profile">
          <div className="user-avatar">A</div>
          <span className="user-name text-sm font-medium">Admin</span>
        </div>
      </div>
    </header>
  );
}

function App() {
  const { theme, isOnboarded } = useClubStore();

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  if (!isOnboarded) {
    return (
      <Router>
        <Landing />
      </Router>
    );
  }

  return (
    <Router>
      <div className="app-container">
        <Sidebar />
        <main className="main-content">
          <Topbar />
          <div className="page-transition">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/socios" element={<Socios />} />
              <Route path="/tesoreria" element={<Tesoreria />} />
              <Route path="/disciplinas" element={<Disciplinas />} />
              <Route path="/reservas" element={<Reservas />} />
            </Routes>
          </div>
        </main>
      </div>
    </Router>
  );
}

export default App;
