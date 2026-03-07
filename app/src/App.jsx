import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import { LayoutDashboard, Users, CreditCard, ShieldCheck, Sun, Moon, Trophy, CalendarDays } from 'lucide-react';
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
      <div className="sidebar-header">
        <img src="/clubsocialos.ico" alt="Club Logo" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
        <div>
          <h2 className="text-lg font-bold" style={{ marginBottom: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '180px' }}>{clubInfo.name}</h2>
          <span className="text-xs text-secondary">{clubInfo.location}</span>
        </div>
      </div>

      <nav className="flex-col gap-sm" style={{ flex: 1 }}>
        {navItems.map(({ to, icon: Icon, label, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Icon />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="glass-panel" style={{ padding: '1.25rem', marginTop: 'auto' }}>
        <p className="text-xs text-muted mb-2">Sistema Operativo</p>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Estado del Sistema</span>
          <span className="badge badge-success">Óptimo</span>
        </div>
        <div className="mt-4 pt-3 border-t border-glass text-center">
          <p className="text-xs text-secondary font-medium">
            Powered by <a href="https://colossuslab.org" target="_blank" rel="noopener noreferrer" className="text-primary hover-text-accent transition-colors">ColossusLab.org</a>
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
        <button onClick={toggleTheme} className="icon-btn" title="Alternar Tema" style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
          {theme === 'dark-theme' ? <Sun size={20} className="text-warning" /> : <Moon size={20} className="text-accent-primary" />}
        </button>
        <div className="user-profile">
          <div className="user-avatar">A</div>
          <span className="text-sm font-medium">Administrador</span>
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
          <div className="page-transition" style={{ flex: 1 }}>
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
