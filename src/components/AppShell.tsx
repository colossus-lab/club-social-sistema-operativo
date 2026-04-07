'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { LayoutDashboard, Users, CreditCard, CalendarDays, Sun, Moon, MessageCircle, LogOut, Building2 } from 'lucide-react'
import { useClubStore } from '@/store/useClubStore'
import { useAuth } from '@/hooks/useAuth'
import { useClub } from '@/hooks/useClub'
import Dashboard from './pages/Dashboard'
import SociosDB from './pages/SociosDB'
import TesoreriaDB from './pages/TesoreriaDB'
import RecursosDB from './pages/RecursosDB'
import ReservasDB from './pages/ReservasDB'
import WhatsAppDB from './pages/WhatsAppDB'

const navItems = [
  { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { id: 'socios', icon: Users, label: 'Socios' },
  { id: 'tesoreria', icon: CreditCard, label: 'Tesoreria' },
  { id: 'recursos', icon: Building2, label: 'Recursos' },
  { id: 'reservas', icon: CalendarDays, label: 'Reservas' },
  { id: 'whatsapp', icon: MessageCircle, label: 'WhatsApp' },
]

function Sidebar({ currentPage, setCurrentPage, clubName, clubLocation }: { 
  currentPage: string
  setCurrentPage: (page: string) => void
  clubName: string
  clubLocation: string 
}) {
  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src="/clubsocialos.ico" alt="Logo" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
        <div style={{ overflow: 'hidden' }}>
          <h2 className="text-base font-bold" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 170 }}>{clubName}</h2>
          <span className="text-xs text-secondary">{clubLocation}</span>
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

function Topbar({ currentPage, onLogout }: { currentPage: string; onLogout: () => void }) {
  const { theme, toggleTheme } = useClubStore()
  const { profile } = useAuth()
  const currentNav = navItems.find(item => item.id === currentPage)

  const getInitials = (profile: any) => {
    if (!profile) return '?'
    const nombre = profile.nombre || ''
    const apellido = profile.apellido || ''
    return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase()
  }

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
          <div className="user-avatar">{getInitials(profile)}</div>
          <div className="flex flex-col items-end">
            <span className="user-name text-sm font-medium">
              {profile?.nombre && profile?.apellido 
                ? `${profile.nombre} ${profile.apellido}`
                : profile?.email?.split('@')[0] ?? 'Usuario'}
            </span>
            <span className="text-xs text-secondary capitalize">{profile?.rol ?? 'viewer'}</span>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="icon-btn ml-2"
          title="Cerrar sesión"
          style={{ background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}
        >
          <LogOut size={20} style={{ color: 'var(--accent-danger, #ef4444)' }} />
        </button>
      </div>
    </header>
  )
}

export default function AppShell() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const router = useRouter()
  const { logout } = useAuth()
  const { displayName, location, loading: clubLoading } = useClub()

  const handleLogout = async () => {
    await logout()
    router.push('/auth/login')
  }

  if (clubLoading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
          <p className="mt-4 font-medium" style={{ color: 'var(--text-primary)' }}>Cargando club...</p>
        </div>
      </div>
    )
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'socios':
        return <SociosDB />
      case 'tesoreria':
        return <TesoreriaDB />
      case 'recursos':
        return <RecursosDB />
      case 'reservas':
        return <ReservasDB />
      case 'whatsapp':
        return <WhatsAppDB />
      default:
        return <Dashboard />
    }
  }

  return (
    <div className="app-container">
      <Sidebar 
        currentPage={currentPage} 
        setCurrentPage={setCurrentPage} 
        clubName={displayName}
        clubLocation={location}
      />
      <main className="main-content">
        <Topbar currentPage={currentPage} onLogout={handleLogout} />
        <div className="page-transition">
          {renderPage()}
        </div>
      </main>
    </div>
  )
}
