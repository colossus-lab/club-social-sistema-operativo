'use client'

import { useState } from 'react'
import { useClubStore } from '@/src/store/useClubStore'
import { 
  MessageCircle, 
  Send, 
  Users, 
  FileText, 
  Settings, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  Bot,
  Smartphone,
  BarChart3,
  RefreshCw
} from 'lucide-react'

interface Conversation {
  id: string
  telefono: string
  nombre: string
  ultimoMensaje: string
  fecha: string
  estado: 'activo' | 'pendiente' | 'cerrado'
  noLeidos: number
}

interface BotStats {
  mensajesHoy: number
  conversacionesActivas: number
  reservasBot: number
  facturasEnviadas: number
}

const mockConversations: Conversation[] = [
  { id: '1', telefono: '+5491133445566', nombre: 'Lionel Messi', ultimoMensaje: 'Quiero reservar la cancha para el sábado', fecha: 'Hace 5 min', estado: 'activo', noLeidos: 2 },
  { id: '2', telefono: '+5491144556677', nombre: 'Diego Maradona', ultimoMensaje: 'Gracias por la información', fecha: 'Hace 1 hora', estado: 'cerrado', noLeidos: 0 },
  { id: '3', telefono: '+5491155667788', nombre: 'Juan Riquelme', ultimoMensaje: 'Cuánto debo de cuota?', fecha: 'Hace 2 horas', estado: 'pendiente', noLeidos: 1 },
]

const mockStats: BotStats = {
  mensajesHoy: 47,
  conversacionesActivas: 12,
  reservasBot: 5,
  facturasEnviadas: 23,
}

export default function WhatsApp() {
  const { socios } = useClubStore()
  const [selectedTab, setSelectedTab] = useState<'conversaciones' | 'facturas' | 'config'>('conversaciones')
  const [isConfigured, setIsConfigured] = useState(false)

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val)

  const morosos = socios.filter(s => s.estado === 'Moroso')

  return (
    <div className="page-container" style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <div className="flex items-center gap-md">
          <div className="icon-btn" style={{ background: 'rgba(37, 211, 102, 0.15)', width: 48, height: 48 }}>
            <MessageCircle size={24} style={{ color: '#25D366' }} />
          </div>
          <div>
            <h1 className="page-title">Bot de WhatsApp</h1>
            <p className="text-secondary mt-1">Gestión de comunicaciones automatizadas con socios</p>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      <div className="glass-panel p-4 mb-8" style={{ borderLeft: isConfigured ? '4px solid var(--success)' : '4px solid var(--warning)' }}>
        <div className="flex items-center justify-between" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="flex items-center gap-md">
            {isConfigured ? (
              <>
                <CheckCircle2 size={24} className="text-success" />
                <div>
                  <div className="font-bold text-success">Bot Activo</div>
                  <div className="text-sm text-secondary">Conectado a Meta Cloud API</div>
                </div>
              </>
            ) : (
              <>
                <AlertTriangle size={24} className="text-warning" />
                <div>
                  <div className="font-bold text-warning">Configuración Requerida</div>
                  <div className="text-sm text-secondary">Configura las credenciales de Meta WhatsApp Business API</div>
                </div>
              </>
            )}
          </div>
          <button 
            className={isConfigured ? 'btn-secondary' : 'btn-primary'}
            onClick={() => setIsConfigured(!isConfigured)}
          >
            <Settings size={18} />
            {isConfigured ? 'Configuración' : 'Configurar Ahora'}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="dashboard-stats-grid mb-8">
        <div className="glass-panel stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-medium text-sm uppercase tracking-wide">Mensajes Hoy</h3>
            <div className="icon-btn" style={{ background: 'rgba(37, 211, 102, 0.1)' }}>
              <MessageCircle size={20} style={{ color: '#25D366' }} />
            </div>
          </div>
          <div className="stat-value font-bold">{mockStats.mensajesHoy}</div>
          <div className="text-xs text-secondary mt-2">+12 vs ayer</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-medium text-sm uppercase tracking-wide">Conversaciones</h3>
            <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <Users size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className="stat-value font-bold">{mockStats.conversacionesActivas}</div>
          <div className="text-xs text-secondary mt-2">activas ahora</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-medium text-sm uppercase tracking-wide">Reservas por Bot</h3>
            <div className="icon-btn" style={{ background: 'rgba(16, 185, 129, 0.1)' }}>
              <Bot size={20} className="text-success" />
            </div>
          </div>
          <div className="stat-value font-bold">{mockStats.reservasBot}</div>
          <div className="text-xs text-secondary mt-2">esta semana</div>
        </div>

        <div className="glass-panel stat-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-secondary font-medium text-sm uppercase tracking-wide">Facturas Enviadas</h3>
            <div className="icon-btn" style={{ background: 'rgba(59, 130, 246, 0.1)' }}>
              <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
            </div>
          </div>
          <div className="stat-value font-bold">{mockStats.facturasEnviadas}</div>
          <div className="text-xs text-secondary mt-2">este mes</div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-sm mb-6" style={{ borderBottom: '1px solid var(--glass-border)', paddingBottom: '1rem' }}>
        <button 
          className={`btn ${selectedTab === 'conversaciones' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('conversaciones')}
        >
          <MessageCircle size={18} />
          Conversaciones
        </button>
        <button 
          className={`btn ${selectedTab === 'facturas' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('facturas')}
        >
          <FileText size={18} />
          Envío de Facturas
        </button>
        <button 
          className={`btn ${selectedTab === 'config' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setSelectedTab('config')}
        >
          <Settings size={18} />
          Configuración
        </button>
      </div>

      {/* Tab Content */}
      {selectedTab === 'conversaciones' && (
        <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
          {/* Conversations List */}
          <div className="glass-panel p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold">Conversaciones Recientes</h3>
              <button className="icon-btn" title="Actualizar">
                <RefreshCw size={18} />
              </button>
            </div>
            <div className="flex-col gap-sm">
              {mockConversations.map(conv => (
                <div 
                  key={conv.id} 
                  className="flex items-center justify-between p-3 rounded-lg cursor-pointer"
                  style={{ background: 'var(--table-hover)', transition: 'background 0.2s' }}
                >
                  <div className="flex items-center gap-md">
                    <div className="user-avatar" style={{ width: 44, height: 44, background: 'var(--gradient-primary)' }}>
                      {conv.nombre.split(' ').map(n => n[0]).join('').substring(0, 2)}
                    </div>
                    <div>
                      <div className="font-bold">{conv.nombre}</div>
                      <div className="text-sm text-secondary" style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {conv.ultimoMensaje}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted">{conv.fecha}</div>
                    {conv.noLeidos > 0 && (
                      <span className="badge badge-success" style={{ marginTop: '0.25rem', padding: '0.15rem 0.5rem' }}>
                        {conv.noLeidos}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-panel p-4">
            <h3 className="text-lg font-bold mb-4">Acciones Rápidas</h3>
            <div className="flex-col gap-md">
              <button className="btn-secondary w-full justify-start p-4">
                <Send size={20} style={{ color: '#25D366' }} />
                <span>Enviar mensaje masivo</span>
              </button>
              <button className="btn-secondary w-full justify-start p-4">
                <FileText size={20} style={{ color: 'var(--accent-primary)' }} />
                <span>Enviar facturas pendientes</span>
              </button>
              <button className="btn-secondary w-full justify-start p-4">
                <BarChart3 size={20} style={{ color: 'var(--warning)' }} />
                <span>Ver estadísticas detalladas</span>
              </button>
            </div>

            <div className="mt-6 p-4 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
              <h4 className="font-semibold mb-3">Flujos Activos del Bot</h4>
              <div className="flex-col gap-sm">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Menu Principal</span>
                  <span className="badge badge-success">Activo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Reserva de Canchas</span>
                  <span className="badge badge-success">Activo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Consulta de Estado</span>
                  <span className="badge badge-success">Activo</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-secondary">Info del Club</span>
                  <span className="badge badge-success">Activo</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'facturas' && (
        <div className="glass-panel p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold">Envío Masivo de Facturas</h3>
              <p className="text-secondary mt-1">Envía las facturas mensuales a todos los socios con cuotas pendientes</p>
            </div>
            <button className="btn-primary">
              <Send size={18} />
              Enviar a Todos ({morosos.length})
            </button>
          </div>

          <div className="table-container">
            <table className="table" style={{ minWidth: '600px' }}>
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Teléfono</th>
                  <th>Deuda</th>
                  <th>Último Envío</th>
                  <th>Estado</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {morosos.map(socio => (
                  <tr key={socio.id}>
                    <td>
                      <div className="flex items-center gap-md">
                        <div className="user-avatar" style={{ width: 36, height: 36 }}>{socio.avatar}</div>
                        <div>
                          <div className="font-bold">{socio.nombre}</div>
                          <div className="text-xs text-muted">#{socio.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="font-mono">{socio.telefono ? `+549${socio.telefono}` : 'Sin teléfono'}</td>
                    <td className="font-bold text-error">{formatCurrency(socio.cuota)}</td>
                    <td className="text-secondary">-</td>
                    <td><span className="badge badge-warning">Pendiente</span></td>
                    <td>
                      <button className="btn btn-outline text-sm" style={{ padding: '0.25rem 0.75rem' }}>
                        <Send size={14} />
                        Enviar
                      </button>
                    </td>
                  </tr>
                ))}
                {morosos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center text-muted py-8">
                      <CheckCircle2 size={32} className="text-success mx-auto mb-2" />
                      Todos los socios están al día
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedTab === 'config' && (
        <div className="glass-panel p-6">
          <h3 className="text-xl font-bold mb-6">Configuración de WhatsApp Business API</h3>
          
          <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: 'var(--spacing-lg)' }}>
            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-sm">
                <Smartphone size={20} style={{ color: 'var(--accent-primary)' }} />
                Credenciales de Meta
              </h4>
              <div className="flex-col gap-md">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Access Token</label>
                  <input 
                    type="password" 
                    className="input-glass" 
                    placeholder="EAAG..." 
                    style={{ padding: '0.875rem' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Phone Number ID</label>
                  <input 
                    type="text" 
                    className="input-glass" 
                    placeholder="123456789012345" 
                    style={{ padding: '0.875rem' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Verify Token (Webhook)</label>
                  <input 
                    type="text" 
                    className="input-glass" 
                    placeholder="mi_token_secreto" 
                    style={{ padding: '0.875rem' }}
                  />
                </div>
                <button className="btn-primary w-full justify-center mt-2">
                  <CheckCircle2 size={18} />
                  Guardar Configuración
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-4 flex items-center gap-sm">
                <Bot size={20} style={{ color: 'var(--success)' }} />
                Mensajes del Bot
              </h4>
              <div className="flex-col gap-md">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Mensaje de Bienvenida</label>
                  <textarea 
                    className="input-glass" 
                    rows={3}
                    placeholder="Hola! Soy el asistente del Club Social OS..."
                    style={{ padding: '0.875rem', resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">Horarios de Atención</label>
                  <input 
                    type="text" 
                    className="input-glass" 
                    placeholder="Lunes a Viernes: 8:00 - 22:00" 
                    style={{ padding: '0.875rem' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-secondary mb-2">CBU para Transferencias</label>
                  <input 
                    type="text" 
                    className="input-glass" 
                    placeholder="0000003100000000000001" 
                    style={{ padding: '0.875rem' }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 p-4 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
            <h4 className="font-semibold mb-3">Webhook URL</h4>
            <p className="text-sm text-secondary mb-2">Configura esta URL en Meta for Developers:</p>
            <code className="block p-3 rounded-md text-sm" style={{ background: 'var(--bg-primary)', color: 'var(--accent-primary)' }}>
              https://tu-dominio.vercel.app/api/whatsapp/webhook
            </code>
          </div>
        </div>
      )}
    </div>
  )
}
