'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Search, Edit2, Trash2, X, CalendarDays, Clock, ChevronLeft, ChevronRight, User, DollarSign } from 'lucide-react'

interface Recurso {
  id: string
  nombre: string
  tipo: string
  precio_hora: number | null
  requiere_sena: boolean
  porcentaje_sena: number | null
}

interface Socio {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
}

interface Reserva {
  id: string
  recurso_id: string
  socio_id: string | null
  fecha: string
  hora_inicio: string
  hora_fin: string
  reservado_por: string
  monto_total: number | null
  sena_pagada: number | null
  estado: string
  notas: string | null
  created_at: string
  recursos?: Recurso
  socios?: Socio
}

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente', color: 'var(--warning)' },
  { value: 'confirmada', label: 'Confirmada', color: 'var(--success)' },
  { value: 'cancelada', label: 'Cancelada', color: 'var(--error)' },
  { value: 'completada', label: 'Completada', color: 'var(--accent-primary)' },
]

const HORAS = Array.from({ length: 15 }, (_, i) => {
  const hora = i + 8 // 8:00 a 22:00
  return `${hora.toString().padStart(2, '0')}:00`
})

export default function ReservasDB() {
  const { profile } = useAuth()
  const [reservas, setReservas] = useState<Reserva[]>([])
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [showModal, setShowModal] = useState(false)
  const [editingReserva, setEditingReserva] = useState<Reserva | null>(null)
  const [formData, setFormData] = useState<Partial<Reserva>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filterRecurso, setFilterRecurso] = useState<string>('todos')

  const clubId = profile?.club_id

  useEffect(() => {
    if (clubId) {
      fetchData()
    }
  }, [clubId])

  useEffect(() => {
    if (clubId) {
      fetchReservas()
    }
  }, [clubId, selectedDate])

  const fetchData = async () => {
    if (!clubId) return

    try {
      const supabase = createClient()

      // Fetch recursos
      const { data: recursosData, error: recursosError } = await supabase
        .from('recursos')
        .select('id, nombre, tipo, precio_hora, requiere_sena, porcentaje_sena')
        .eq('club_id', clubId)
        .eq('activo', true)
        .order('nombre')

      if (recursosError) throw recursosError
      setRecursos(recursosData || [])

      // Fetch socios
      const { data: sociosData, error: sociosError } = await supabase
        .from('socios')
        .select('id, nombre, apellido, telefono')
        .eq('club_id', clubId)
        .eq('estado', 'activo')
        .order('apellido')

      if (sociosError) throw sociosError
      setSocios(sociosData || [])

    } catch (err) {
      console.error('[v0] Error fetching data:', err)
    }
  }

  const fetchReservas = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Get week range
      const startOfWeek = new Date(selectedDate)
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(endOfWeek.getDate() + 6)

      const { data, error } = await supabase
        .from('reservas')
        .select(`
          *,
          recursos:recurso_id(id, nombre, tipo, precio_hora),
          socios:socio_id(id, nombre, apellido, telefono)
        `)
        .eq('club_id', clubId)
        .gte('fecha', startOfWeek.toISOString().split('T')[0])
        .lte('fecha', endOfWeek.toISOString().split('T')[0])
        .order('fecha')
        .order('hora_inicio')

      if (error) throw error
      setReservas(data || [])
    } catch (err) {
      console.error('[v0] Error fetching reservas:', err)
      setError(err instanceof Error ? err.message : 'Error cargando reservas')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!clubId) return

    try {
      setSaving(true)
      setError(null)
      const supabase = createClient()

      const reservaData = {
        ...formData,
        club_id: clubId,
        created_by: profile?.id,
        socio_id: formData.socio_id || null,
        monto_total: formData.monto_total || null,
        sena_pagada: formData.sena_pagada || null,
      }

      if (editingReserva) {
        const { error } = await supabase
          .from('reservas')
          .update(reservaData)
          .eq('id', editingReserva.id)
          .eq('club_id', clubId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('reservas')
          .insert([reservaData])

        if (error) throw error
      }

      await fetchReservas()
      closeModal()
    } catch (err) {
      console.error('[v0] Error saving reserva:', err)
      setError(err instanceof Error ? err.message : 'Error guardando reserva')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (reserva: Reserva) => {
    if (!confirm('Eliminar esta reserva? Esta accion no se puede deshacer.')) return
    if (!clubId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('reservas')
        .delete()
        .eq('id', reserva.id)
        .eq('club_id', clubId)

      if (error) throw error
      await fetchReservas()
    } catch (err) {
      console.error('[v0] Error deleting reserva:', err)
      setError(err instanceof Error ? err.message : 'Error eliminando reserva')
    }
  }

  const openModal = (reserva?: Reserva, fecha?: string, hora?: string) => {
    if (reserva) {
      setEditingReserva(reserva)
      setFormData({
        recurso_id: reserva.recurso_id,
        socio_id: reserva.socio_id || undefined,
        fecha: reserva.fecha,
        hora_inicio: reserva.hora_inicio,
        hora_fin: reserva.hora_fin,
        reservado_por: reserva.reservado_por,
        monto_total: reserva.monto_total,
        sena_pagada: reserva.sena_pagada,
        estado: reserva.estado,
        notas: reserva.notas || '',
      })
    } else {
      setEditingReserva(null)
      const recursoDefault = recursos[0]
      setFormData({
        recurso_id: recursoDefault?.id,
        fecha: fecha || selectedDate.toISOString().split('T')[0],
        hora_inicio: hora || '09:00',
        hora_fin: hora ? `${parseInt(hora) + 1}:00`.padStart(5, '0') : '10:00',
        reservado_por: '',
        estado: 'pendiente',
        monto_total: recursoDefault?.precio_hora || null,
        notas: '',
      })
    }
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingReserva(null)
    setFormData({})
    setError(null)
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val)

  const getEstadoStyle = (estado: string) => {
    const est = ESTADOS.find(e => e.value === estado)
    return { color: est?.color || 'var(--text-secondary)' }
  }

  // Week navigation
  const goToWeek = (direction: number) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + (direction * 7))
    setSelectedDate(newDate)
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  // Generate week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(selectedDate)
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay())
    
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(startOfWeek)
      date.setDate(date.getDate() + i)
      return {
        date,
        dateStr: date.toISOString().split('T')[0],
        dayName: date.toLocaleDateString('es-AR', { weekday: 'short' }),
        dayNum: date.getDate(),
        isToday: date.toDateString() === new Date().toDateString(),
      }
    })
  }, [selectedDate])

  // Filter reservas by recurso
  const filteredReservas = filterRecurso === 'todos' 
    ? reservas 
    : reservas.filter(r => r.recurso_id === filterRecurso)

  // Get reservas for a specific day and hour
  const getReservasForSlot = (dateStr: string, hora: string) => {
    return filteredReservas.filter(r => 
      r.fecha === dateStr && 
      r.hora_inicio <= hora && 
      r.hora_fin > hora
    )
  }

  if (loading && reservas.length === 0) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-secondary">Cargando reservas...</p>
          </div>
        </div>
      </div>
    )
  }

  if (recursos.length === 0) {
    return (
      <div className="page-container">
        <div className="glass-panel p-8 text-center">
          <CalendarDays size={48} className="mx-auto mb-4 text-secondary" />
          <h3 className="text-xl font-bold mb-2">Sin recursos configurados</h3>
          <p className="text-secondary mb-4">
            Primero debes crear recursos (canchas, quinchos, etc.) para poder gestionar reservas.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div>
            <h1 className="page-title">Reservas</h1>
            <p className="text-secondary mt-1">Calendario semanal de reservas</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Nueva Reserva</span>
          </button>
        </div>
      </div>

      {/* Week Navigation */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => goToWeek(-1)} className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <ChevronLeft size={20} />
            </button>
            <button onClick={goToToday} className="btn-secondary text-sm">
              Hoy
            </button>
            <button onClick={() => goToWeek(1)} className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <ChevronRight size={20} />
            </button>
            <span className="font-medium ml-2">
              {weekDays[0].date.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <select
            value={filterRecurso}
            onChange={(e) => setFilterRecurso(e.target.value)}
            className="input-glass"
            style={{ minWidth: '180px' }}
          >
            <option value="todos">Todos los recursos</option>
            {recursos.map(r => (
              <option key={r.id} value={r.id}>{r.nombre}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="glass-panel overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header with days */}
            <div className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--glass-border)' }}>
              <div className="p-3 text-center text-sm font-medium text-secondary">
                <Clock size={16} className="mx-auto" />
              </div>
              {weekDays.map(day => (
                <div 
                  key={day.dateStr} 
                  className={`p-3 text-center ${day.isToday ? 'bg-primary/10' : ''}`}
                  style={{ borderLeft: '1px solid var(--glass-border)' }}
                >
                  <div className="text-xs text-secondary uppercase">{day.dayName}</div>
                  <div className={`text-lg font-bold ${day.isToday ? 'text-primary' : ''}`}>{day.dayNum}</div>
                </div>
              ))}
            </div>

            {/* Time slots */}
            {HORAS.map(hora => (
              <div key={hora} className="grid grid-cols-8 border-b" style={{ borderColor: 'var(--glass-border)', minHeight: '60px' }}>
                <div className="p-2 text-center text-sm text-secondary flex items-center justify-center">
                  {hora}
                </div>
                {weekDays.map(day => {
                  const slotReservas = getReservasForSlot(day.dateStr, hora)
                  return (
                    <div 
                      key={`${day.dateStr}-${hora}`} 
                      className="p-1 relative cursor-pointer hover:bg-table-hover transition-colors"
                      style={{ borderLeft: '1px solid var(--glass-border)' }}
                      onClick={() => slotReservas.length === 0 && openModal(undefined, day.dateStr, hora)}
                    >
                      {slotReservas.map(reserva => (
                        <div
                          key={reserva.id}
                          className="text-xs p-1 rounded mb-1 cursor-pointer hover:opacity-80"
                          style={{ 
                            background: getEstadoStyle(reserva.estado).color,
                            color: '#fff',
                          }}
                          onClick={(e) => {
                            e.stopPropagation()
                            openModal(reserva)
                          }}
                        >
                          <div className="font-medium truncate">{reserva.recursos?.nombre}</div>
                          <div className="truncate opacity-80">{reserva.reservado_por}</div>
                        </div>
                      ))}
                    </div>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Leyenda */}
      <div className="flex flex-wrap gap-4 mt-4 text-sm">
        {ESTADOS.map(estado => (
          <div key={estado.value} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded" style={{ background: estado.color }}></div>
            <span className="text-secondary">{estado.label}</span>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingReserva ? 'Editar Reserva' : 'Nueva Reserva'}
              </h2>
              <button onClick={closeModal} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {error && (
                  <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                    {error}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Recurso *</label>
                  <select
                    value={formData.recurso_id || ''}
                    onChange={e => {
                      const recurso = recursos.find(r => r.id === e.target.value)
                      setFormData(prev => ({ 
                        ...prev, 
                        recurso_id: e.target.value,
                        monto_total: recurso?.precio_hora || prev.monto_total,
                      }))
                    }}
                    className="input-glass w-full"
                    required
                  >
                    <option value="">Seleccionar recurso</option>
                    {recursos.map(r => (
                      <option key={r.id} value={r.id}>{r.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Fecha *</label>
                  <input
                    type="date"
                    value={formData.fecha || ''}
                    onChange={e => setFormData(prev => ({ ...prev, fecha: e.target.value }))}
                    className="input-glass w-full"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Hora Inicio *</label>
                    <select
                      value={formData.hora_inicio || ''}
                      onChange={e => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                      className="input-glass w-full"
                      required
                    >
                      {HORAS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Hora Fin *</label>
                    <select
                      value={formData.hora_fin || ''}
                      onChange={e => setFormData(prev => ({ ...prev, hora_fin: e.target.value }))}
                      className="input-glass w-full"
                      required
                    >
                      {HORAS.map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Reservado por *</label>
                  <input
                    type="text"
                    value={formData.reservado_por || ''}
                    onChange={e => setFormData(prev => ({ ...prev, reservado_por: e.target.value }))}
                    className="input-glass w-full"
                    placeholder="Nombre de quien reserva"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Socio (opcional)</label>
                  <select
                    value={formData.socio_id || ''}
                    onChange={e => setFormData(prev => ({ ...prev, socio_id: e.target.value || undefined }))}
                    className="input-glass w-full"
                  >
                    <option value="">No es socio / Externo</option>
                    {socios.map(s => (
                      <option key={s.id} value={s.id}>{s.apellido}, {s.nombre}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Monto Total</label>
                    <input
                      type="number"
                      value={formData.monto_total || ''}
                      onChange={e => setFormData(prev => ({ ...prev, monto_total: e.target.value ? parseInt(e.target.value) : null }))}
                      className="input-glass w-full"
                      placeholder="$"
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Sena Pagada</label>
                    <input
                      type="number"
                      value={formData.sena_pagada || ''}
                      onChange={e => setFormData(prev => ({ ...prev, sena_pagada: e.target.value ? parseInt(e.target.value) : null }))}
                      className="input-glass w-full"
                      placeholder="$"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Estado</label>
                  <select
                    value={formData.estado || 'pendiente'}
                    onChange={e => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                    className="input-glass w-full"
                  >
                    {ESTADOS.map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Notas</label>
                  <textarea
                    value={formData.notas || ''}
                    onChange={e => setFormData(prev => ({ ...prev, notas: e.target.value }))}
                    className="input-glass w-full"
                    rows={2}
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                {editingReserva && (
                  <button 
                    type="button" 
                    onClick={() => handleDelete(editingReserva)} 
                    className="btn-secondary text-error mr-auto"
                  >
                    Eliminar
                  </button>
                )}
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingReserva ? 'Guardar Cambios' : 'Crear Reserva')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
