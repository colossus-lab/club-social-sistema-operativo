'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Search, Edit2, Trash2, X, Building2, Users, DollarSign, Clock } from 'lucide-react'

interface Recurso {
  id: string
  nombre: string
  tipo: string
  descripcion: string | null
  capacidad: number | null
  precio_hora: number | null
  requiere_sena: boolean
  porcentaje_sena: number | null
  activo: boolean
  created_at: string
}

const TIPOS_RECURSO = [
  { value: 'cancha_futbol', label: 'Cancha de Futbol' },
  { value: 'cancha_tenis', label: 'Cancha de Tenis' },
  { value: 'cancha_paddle', label: 'Cancha de Paddle' },
  { value: 'cancha_basquet', label: 'Cancha de Basquet' },
  { value: 'pileta', label: 'Pileta' },
  { value: 'quincho', label: 'Quincho' },
  { value: 'salon', label: 'Salon de Eventos' },
  { value: 'gimnasio', label: 'Gimnasio' },
  { value: 'otro', label: 'Otro' },
]

const INITIAL_FORM: Partial<Recurso> = {
  nombre: '',
  tipo: 'cancha_futbol',
  descripcion: '',
  capacidad: null,
  precio_hora: null,
  requiere_sena: false,
  porcentaje_sena: 30,
  activo: true,
}

export default function RecursosDB() {
  const { profile } = useAuth()
  const [recursos, setRecursos] = useState<Recurso[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [editingRecurso, setEditingRecurso] = useState<Recurso | null>(null)
  const [formData, setFormData] = useState<Partial<Recurso>>(INITIAL_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const clubId = profile?.club_id

  useEffect(() => {
    if (clubId) fetchRecursos()
  }, [clubId])

  const fetchRecursos = async () => {
    if (!clubId) return
    
    try {
      setLoading(true)
      const supabase = createClient()
      const { data, error } = await supabase
        .from('recursos')
        .select('*')
        .eq('club_id', clubId)
        .order('nombre', { ascending: true })

      if (error) throw error
      setRecursos(data || [])
    } catch (err) {
      console.error('[v0] Error fetching recursos:', err)
      setError(err instanceof Error ? err.message : 'Error cargando recursos')
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

      const recursoData = {
        ...formData,
        club_id: clubId,
        capacidad: formData.capacidad || null,
        precio_hora: formData.precio_hora || null,
        porcentaje_sena: formData.requiere_sena ? (formData.porcentaje_sena || 30) : null,
      }

      if (editingRecurso) {
        const { error } = await supabase
          .from('recursos')
          .update(recursoData)
          .eq('id', editingRecurso.id)
          .eq('club_id', clubId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('recursos')
          .insert([recursoData])

        if (error) throw error
      }

      await fetchRecursos()
      closeModal()
    } catch (err) {
      console.error('[v0] Error saving recurso:', err)
      setError(err instanceof Error ? err.message : 'Error guardando recurso')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (recurso: Recurso) => {
    if (!confirm(`Eliminar "${recurso.nombre}"? Esta accion no se puede deshacer.`)) return
    if (!clubId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('recursos')
        .delete()
        .eq('id', recurso.id)
        .eq('club_id', clubId)

      if (error) throw error
      await fetchRecursos()
    } catch (err) {
      console.error('[v0] Error deleting recurso:', err)
      setError(err instanceof Error ? err.message : 'Error eliminando recurso')
    }
  }

  const openModal = (recurso?: Recurso) => {
    if (recurso) {
      setEditingRecurso(recurso)
      setFormData({
        nombre: recurso.nombre,
        tipo: recurso.tipo,
        descripcion: recurso.descripcion || '',
        capacidad: recurso.capacidad,
        precio_hora: recurso.precio_hora,
        requiere_sena: recurso.requiere_sena,
        porcentaje_sena: recurso.porcentaje_sena || 30,
        activo: recurso.activo,
      })
    } else {
      setEditingRecurso(null)
      setFormData(INITIAL_FORM)
    }
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingRecurso(null)
    setFormData(INITIAL_FORM)
    setError(null)
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val)

  const getTipoLabel = (tipo: string) => 
    TIPOS_RECURSO.find(t => t.value === tipo)?.label || tipo

  const filteredRecursos = recursos.filter(r => {
    const matchesSearch = r.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (r.descripcion?.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesTipo = filterTipo === 'todos' || r.tipo === filterTipo
    return matchesSearch && matchesTipo
  })

  const stats = {
    total: recursos.length,
    activos: recursos.filter(r => r.activo).length,
    conSena: recursos.filter(r => r.requiere_sena).length,
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-secondary">Cargando recursos...</p>
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
            <h1 className="page-title">Recursos</h1>
            <p className="text-secondary mt-1">Gestiona canchas, quinchos y espacios del club</p>
          </div>
          <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
            <Plus size={18} />
            <span>Nuevo Recurso</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
            <Building2 size={20} className="text-primary" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-secondary">Total Recursos</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
            <Clock size={20} className="text-success" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.activos}</div>
            <div className="text-sm text-secondary">Activos</div>
          </div>
        </div>
        <div className="glass-panel p-4 flex items-center gap-3">
          <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
            <DollarSign size={20} className="text-warning" />
          </div>
          <div>
            <div className="text-2xl font-bold">{stats.conSena}</div>
            <div className="text-sm text-secondary">Requieren Sena</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-panel p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="text"
                placeholder="Buscar recurso..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>
          </div>
          <select
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
            className="input-glass"
            style={{ minWidth: '180px' }}
          >
            <option value="todos">Todos los tipos</option>
            {TIPOS_RECURSO.map(t => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de recursos */}
      {filteredRecursos.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <Building2 size={48} className="mx-auto mb-4 text-secondary" />
          <h3 className="text-xl font-bold mb-2">
            {recursos.length === 0 ? 'Sin recursos' : 'Sin resultados'}
          </h3>
          <p className="text-secondary mb-4">
            {recursos.length === 0 
              ? 'Agrega tu primera cancha, quincho o salon.'
              : 'No hay recursos que coincidan con tu busqueda.'}
          </p>
          {recursos.length === 0 && (
            <button className="btn-primary" onClick={() => openModal()}>
              <Plus size={18} className="mr-2" />
              Agregar Recurso
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecursos.map(recurso => (
            <div key={recurso.id} className="glass-panel p-4">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-bold text-lg">{recurso.nombre}</h3>
                  <span className="text-xs px-2 py-1 rounded-full" style={{ background: 'var(--table-hover)', color: 'var(--text-secondary)' }}>
                    {getTipoLabel(recurso.tipo)}
                  </span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openModal(recurso)}
                    className="icon-btn"
                    style={{ background: 'var(--table-hover)' }}
                    title="Editar"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(recurso)}
                    className="icon-btn text-error"
                    style={{ background: 'var(--table-hover)' }}
                    title="Eliminar"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {recurso.descripcion && (
                <p className="text-sm text-secondary mb-3 line-clamp-2">{recurso.descripcion}</p>
              )}

              <div className="flex flex-wrap gap-3 text-sm">
                {recurso.capacidad && (
                  <div className="flex items-center gap-1 text-secondary">
                    <Users size={14} />
                    <span>{recurso.capacidad} personas</span>
                  </div>
                )}
                {recurso.precio_hora && (
                  <div className="flex items-center gap-1 text-secondary">
                    <DollarSign size={14} />
                    <span>{formatCurrency(recurso.precio_hora)}/hora</span>
                  </div>
                )}
              </div>

              <div className="flex justify-between items-center mt-4 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${recurso.activo ? 'text-success' : 'text-secondary'}`} style={{ background: recurso.activo ? 'rgba(34, 197, 94, 0.1)' : 'var(--table-hover)' }}>
                  {recurso.activo ? 'Activo' : 'Inactivo'}
                </span>
                {recurso.requiere_sena && (
                  <span className="text-xs text-warning">
                    Sena {recurso.porcentaje_sena}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingRecurso ? 'Editar Recurso' : 'Nuevo Recurso'}
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
                  <label className="form-label">Nombre *</label>
                  <input
                    type="text"
                    value={formData.nombre || ''}
                    onChange={e => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    className="input-glass w-full"
                    placeholder="Ej: Cancha 1, Quincho Principal"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Tipo *</label>
                  <select
                    value={formData.tipo || 'cancha_futbol'}
                    onChange={e => setFormData(prev => ({ ...prev, tipo: e.target.value }))}
                    className="input-glass w-full"
                    required
                  >
                    {TIPOS_RECURSO.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Descripcion</label>
                  <textarea
                    value={formData.descripcion || ''}
                    onChange={e => setFormData(prev => ({ ...prev, descripcion: e.target.value }))}
                    className="input-glass w-full"
                    rows={2}
                    placeholder="Descripcion opcional..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Capacidad</label>
                    <input
                      type="number"
                      value={formData.capacidad || ''}
                      onChange={e => setFormData(prev => ({ ...prev, capacidad: e.target.value ? parseInt(e.target.value) : null }))}
                      className="input-glass w-full"
                      placeholder="Personas"
                      min="1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Precio/Hora</label>
                    <input
                      type="number"
                      value={formData.precio_hora || ''}
                      onChange={e => setFormData(prev => ({ ...prev, precio_hora: e.target.value ? parseInt(e.target.value) : null }))}
                      className="input-glass w-full"
                      placeholder="$"
                      min="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.requiere_sena || false}
                      onChange={e => setFormData(prev => ({ ...prev, requiere_sena: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>Requiere sena para reservar</span>
                  </label>
                </div>

                {formData.requiere_sena && (
                  <div className="form-group">
                    <label className="form-label">Porcentaje de sena</label>
                    <input
                      type="number"
                      value={formData.porcentaje_sena || 30}
                      onChange={e => setFormData(prev => ({ ...prev, porcentaje_sena: parseInt(e.target.value) || 30 }))}
                      className="input-glass w-full"
                      min="1"
                      max="100"
                    />
                  </div>
                )}

                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.activo ?? true}
                      onChange={e => setFormData(prev => ({ ...prev, activo: e.target.checked }))}
                      className="w-4 h-4"
                    />
                    <span>Recurso activo (disponible para reservas)</span>
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingRecurso ? 'Guardar Cambios' : 'Crear Recurso')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
