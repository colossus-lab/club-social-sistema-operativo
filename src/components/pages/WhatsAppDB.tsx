'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { MessageCircle, Users, Send, Settings, RefreshCcw, CheckCircle, Clock, AlertTriangle, Phone, Search } from 'lucide-react'

interface Conversacion {
  id: string
  telefono: string
  nombre_contacto: string | null
  socio_id: string | null
  estado_flujo: string | null
  ultimo_mensaje: string | null
  activo: boolean
  created_at: string
  updated_at: string
  socios?: {
    nombre: string
    apellido: string
  }
}

interface Mensaje {
  id: string
  conversacion_id: string
  direccion: string // 'entrante' | 'saliente'
  tipo: string
  contenido: string
  estado: string
  created_at: string
}

interface ConfigBot {
  id: string
  clave: string
  valor: string
  descripcion: string | null
}

const ESTADOS_FLUJO = [
  { value: 'menu_principal', label: 'Menu Principal', color: 'var(--accent-primary)' },
  { value: 'reservas', label: 'Reservas', color: 'var(--success)' },
  { value: 'estado_cuenta', label: 'Estado de Cuenta', color: 'var(--warning)' },
  { value: 'info_club', label: 'Info Club', color: 'var(--accent-secondary)' },
  { value: 'soporte', label: 'Soporte', color: 'var(--error)' },
]

export default function WhatsAppDB() {
  const { profile } = useAuth()
  const [conversaciones, setConversaciones] = useState<Conversacion[]>([])
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [config, setConfig] = useState<ConfigBot[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedConversacion, setSelectedConversacion] = useState<Conversacion | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'conversaciones' | 'config'>('conversaciones')
  const [showConfigModal, setShowConfigModal] = useState(false)
  const [configForm, setConfigForm] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const clubId = profile?.club_id

  useEffect(() => {
    if (clubId) {
      fetchData()
    }
  }, [clubId])

  useEffect(() => {
    if (selectedConversacion) {
      fetchMensajes(selectedConversacion.id)
    }
  }, [selectedConversacion])

  const fetchData = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch conversaciones
      const { data: convData, error: convError } = await supabase
        .from('conversaciones_whatsapp')
        .select(`
          *,
          socios:socio_id(nombre, apellido)
        `)
        .eq('club_id', clubId)
        .order('updated_at', { ascending: false })
        .limit(50)

      if (convError) throw convError
      setConversaciones(convData || [])

      // Fetch config
      const { data: configData, error: configError } = await supabase
        .from('configuracion_bot')
        .select('*')
        .eq('club_id', clubId)

      if (configError && configError.code !== 'PGRST116') throw configError
      setConfig(configData || [])

      // Initialize config form
      const formData: Record<string, string> = {}
      configData?.forEach(c => {
        formData[c.clave] = c.valor
      })
      setConfigForm(formData)

    } catch (err) {
      console.error('[v0] Error fetching WhatsApp data:', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMensajes = async (conversacionId: string) => {
    if (!clubId) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('mensajes_whatsapp')
        .select('*')
        .eq('conversacion_id', conversacionId)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error
      setMensajes(data || [])
    } catch (err) {
      console.error('[v0] Error fetching mensajes:', err)
    }
  }

  const handleSaveConfig = async () => {
    if (!clubId) return

    try {
      setSaving(true)
      const supabase = createClient()

      // Upsert config values
      for (const [clave, valor] of Object.entries(configForm)) {
        const { error } = await supabase
          .from('configuracion_bot')
          .upsert({
            club_id: clubId,
            clave,
            valor,
          }, {
            onConflict: 'club_id,clave'
          })

        if (error) throw error
      }

      await fetchData()
      setShowConfigModal(false)
    } catch (err) {
      console.error('[v0] Error saving config:', err)
    } finally {
      setSaving(false)
    }
  }

  const getEstadoFlujoInfo = (estado: string | null) => 
    ESTADOS_FLUJO.find(e => e.value === estado) || { label: estado || 'Desconocido', color: 'var(--text-secondary)' }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const hours = diff / (1000 * 60 * 60)

    if (hours < 24) {
      return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
    } else if (hours < 48) {
      return 'Ayer'
    } else {
      return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })
    }
  }

  const filteredConversaciones = conversaciones.filter(c => {
    const nombre = c.nombre_contacto || c.socios ? `${c.socios?.nombre} ${c.socios?.apellido}` : c.telefono
    return nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.telefono.includes(searchTerm)
  })

  // Stats
  const stats = {
    total: conversaciones.length,
    activas: conversaciones.filter(c => c.activo).length,
    hoy: conversaciones.filter(c => {
      const date = new Date(c.updated_at)
      const today = new Date()
      return date.toDateString() === today.toDateString()
    }).length,
  }

  const isConfigured = config.some(c => c.clave === 'WHATSAPP_PHONE_NUMBER_ID' && c.valor)

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-secondary">Cargando WhatsApp...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="page-title">WhatsApp Bot</h1>
            <p className="text-secondary mt-1">Conversaciones y configuracion del bot</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={fetchData}>
              <RefreshCcw size={18} />
              <span>Actualizar</span>
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => setShowConfigModal(true)}>
              <Settings size={18} />
              <span>Configurar</span>
            </button>
          </div>
        </div>
      </div>

      {/* Status Banner */}
      {!isConfigured && (
        <div className="glass-panel p-4 mb-6 flex items-center gap-3" style={{ background: 'rgba(234, 179, 8, 0.1)', borderColor: 'var(--warning)' }}>
          <AlertTriangle size={24} className="text-warning flex-shrink-0" />
          <div>
            <div className="font-medium">Bot no configurado</div>
            <div className="text-sm text-secondary">
              Configura las credenciales de WhatsApp Business API para activar el bot.
            </div>
          </div>
          <button className="btn-primary ml-auto" onClick={() => setShowConfigModal(true)}>
            Configurar
          </button>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
            <MessageCircle size={20} className="text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-secondary">Conversaciones</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
            <Users size={20} className="text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.activas}</div>
            <div className="text-sm text-secondary">Activas</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
            <Clock size={20} className="text-warning" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.hoy}</div>
            <div className="text-sm text-secondary">Hoy</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lista de conversaciones */}
        <div className="glass-panel overflow-hidden">
          <div className="p-4 border-b" style={{ borderColor: 'var(--glass-border)' }}>
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="Buscar conversacion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>
          </div>

          <div className="max-h-[500px] overflow-y-auto">
            {filteredConversaciones.length === 0 ? (
              <div className="p-8 text-center text-secondary">
                <MessageCircle size={32} className="mx-auto mb-2 opacity-50" />
                <p>Sin conversaciones</p>
              </div>
            ) : (
              filteredConversaciones.map(conv => {
                const estadoInfo = getEstadoFlujoInfo(conv.estado_flujo)
                const nombre = conv.socios 
                  ? `${conv.socios.nombre} ${conv.socios.apellido}`
                  : conv.nombre_contacto || conv.telefono

                return (
                  <div
                    key={conv.id}
                    className={`p-4 cursor-pointer hover:bg-table-hover transition-colors ${selectedConversacion?.id === conv.id ? 'bg-table-hover' : ''}`}
                    style={{ borderBottom: '1px solid var(--glass-border)' }}
                    onClick={() => setSelectedConversacion(conv)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                        {nombre.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <div className="font-medium truncate">{nombre}</div>
                          <span className="text-xs text-secondary flex-shrink-0 ml-2">
                            {formatDate(conv.updated_at)}
                          </span>
                        </div>
                        <div className="text-sm text-secondary truncate">
                          {conv.ultimo_mensaje || 'Sin mensajes'}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span 
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ background: `${estadoInfo.color}20`, color: estadoInfo.color }}
                          >
                            {estadoInfo.label}
                          </span>
                          {conv.activo && (
                            <span className="w-2 h-2 rounded-full bg-success"></span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Detalle de conversacion */}
        <div className="lg:col-span-2 glass-panel overflow-hidden flex flex-col" style={{ minHeight: '500px' }}>
          {selectedConversacion ? (
            <>
              {/* Header */}
              <div className="p-4 border-b flex items-center gap-3" style={{ borderColor: 'var(--glass-border)' }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--accent-primary)', color: '#fff' }}>
                  {(selectedConversacion.socios 
                    ? `${selectedConversacion.socios.nombre} ${selectedConversacion.socios.apellido}`
                    : selectedConversacion.nombre_contacto || selectedConversacion.telefono
                  ).charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-medium">
                    {selectedConversacion.socios 
                      ? `${selectedConversacion.socios.nombre} ${selectedConversacion.socios.apellido}`
                      : selectedConversacion.nombre_contacto || 'Contacto'}
                  </div>
                  <a 
                    href={`https://wa.me/${selectedConversacion.telefono.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm flex items-center gap-1"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    <Phone size={12} />
                    {selectedConversacion.telefono}
                  </a>
                </div>
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {mensajes.length === 0 ? (
                  <div className="text-center text-secondary py-8">
                    Sin mensajes registrados
                  </div>
                ) : (
                  mensajes.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.direccion === 'saliente' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className="max-w-[70%] p-3 rounded-lg"
                        style={{
                          background: msg.direccion === 'saliente' ? 'var(--accent-primary)' : 'var(--table-hover)',
                          color: msg.direccion === 'saliente' ? '#fff' : 'var(--text-primary)',
                        }}
                      >
                        <div className="text-sm whitespace-pre-wrap">{msg.contenido}</div>
                        <div className="text-xs mt-1 opacity-70 text-right">
                          {new Date(msg.created_at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                          {msg.direccion === 'saliente' && (
                            <CheckCircle size={12} className="inline ml-1" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer info */}
              <div className="p-3 border-t text-center text-sm text-secondary" style={{ borderColor: 'var(--glass-border)' }}>
                Las respuestas se envian automaticamente por el bot
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary">
              <div className="text-center">
                <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                <p>Selecciona una conversacion para ver los mensajes</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Configuracion */}
      {showConfigModal && (
        <div className="modal-overlay" onClick={() => setShowConfigModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Configuracion WhatsApp Bot</h2>
              <button onClick={() => setShowConfigModal(false)} className="icon-btn">
                <Settings size={20} />
              </button>
            </div>

            <div className="modal-body">
              <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'var(--table-hover)' }}>
                <p className="font-medium mb-1">Credenciales de Meta Business API</p>
                <p className="text-secondary text-xs">
                  Obtene estas credenciales desde el{' '}
                  <a 
                    href="https://developers.facebook.com/apps" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ color: 'var(--accent-primary)' }}
                  >
                    Meta for Developers
                  </a>
                </p>
              </div>

              <div className="form-group">
                <label className="form-label">Phone Number ID</label>
                <input
                  type="text"
                  value={configForm['WHATSAPP_PHONE_NUMBER_ID'] || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, WHATSAPP_PHONE_NUMBER_ID: e.target.value }))}
                  className="input-glass w-full"
                  placeholder="Ej: 123456789012345"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Access Token</label>
                <input
                  type="password"
                  value={configForm['WHATSAPP_ACCESS_TOKEN'] || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, WHATSAPP_ACCESS_TOKEN: e.target.value }))}
                  className="input-glass w-full"
                  placeholder="Token de acceso"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Verify Token (para webhook)</label>
                <input
                  type="text"
                  value={configForm['WHATSAPP_VERIFY_TOKEN'] || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, WHATSAPP_VERIFY_TOKEN: e.target.value }))}
                  className="input-glass w-full"
                  placeholder="Token de verificacion personalizado"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mensaje de Bienvenida</label>
                <textarea
                  value={configForm['MENSAJE_BIENVENIDA'] || ''}
                  onChange={e => setConfigForm(prev => ({ ...prev, MENSAJE_BIENVENIDA: e.target.value }))}
                  className="input-glass w-full"
                  rows={3}
                  placeholder="Hola! Soy el asistente virtual del club..."
                />
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowConfigModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button onClick={handleSaveConfig} className="btn-primary" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar Configuracion'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
