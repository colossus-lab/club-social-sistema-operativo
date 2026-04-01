'use client'

import { useState } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Users, CreditCard, Trophy, CalendarDays, Sun, Moon, MessageCircle } from 'lucide-react'
import { useClubStore } from '@/src/store/useClubStore'
import Dashboard from './pages/Dashboard'
import Socios from './pages/Socios'
import Tesoreria from './pages/Tesoreria'
import Disciplinas from './pages/Disciplinas'
import Reservas from './pages/Reservas'
import WhatsApp from './pages/WhatsApp'

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'socios', icon: Users, label: 'Socios' },
  { id: 'tesoreria', icon: CreditCard, label: 'Tesorería' },
  { id: 'disciplinas', icon: Trophy, label: 'Deportes' },
  { id: 'reservas', icon: CalendarDays, label: 'Reservas' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
]

function Sidebar({ currentPage, setCurrentPage }: { currentPage: string; setCurrentPage: (page: string) => void }) {
  const { clubInfo } = useClubStore()
  
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/clubsocialos.ico" alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
        <div style={{ overflow: 'hidden' }}>
          <h2 className="text-base font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{clubInfo.name}</h2>
          <span className="text-xs text-secondary">{clubInfo.location}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {navItems.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setCurrentPage(id)}
            className={`nav-link${currentPage === id ? ' active' : ''}`}
          >
            <Icon size={22} />
            <span className="nav-label">{label}</span>
          </button>
        ))}
      </nav>

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
  )
}

function Topbar({ currentPage }: { currentPage: string }) {
  const { theme, toggleTheme } = useClubStore()
  const currentNav = navItems.find(item => item.id === currentPage)

  return (
    <header className="topbar">
      <span className="topbar-page-title">{currentNav?.label ?? 'Club Social OS'}</span>
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
  )
}

export default function AppShell() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'socios':
        return <Socios />
      case 'tesoreria':
        return <Tesoreria />
      case 'disciplinas':
        return <Disciplinas />
      case 'reservas':
        return <Reservas />
      case 'whatsapp':
        return <WhatsApp />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app-container">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} />
      <main className="main-content">
        <Topbar currentPage={currentPage} />
        <div className="page-transition">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
