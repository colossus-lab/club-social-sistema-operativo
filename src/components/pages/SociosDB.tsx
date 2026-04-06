'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useClub } from '@/hooks/useClub'
import { Search, UserPlus, FileEdit, UserCheck, UserMinus, MoreVertical, MessageCircle, Download, Upload, Trash2, Edit2 } from 'lucide-react'

interface Socio {
  id: string
  club_id: string
  nombre: string
  apellido?: string
  dni: string
  email?: string
  telefono?: string
  categoria: string
  estado: 'activo' | 'moroso' | 'baja'
  cuota_mes: number
  fecha_ingreso: string
  created_at: string
}

export default function SociosDB() {
  const { profile } = useAuth()
  const { id: clubId } = useClub()
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [categories, setCategories] = useState<any[]>([])
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Socio>>({})

  const supabase = createClient()

  // Cargar socios
  useEffect(() => {
    if (!clubId) return
    loadSocios()
    loadCategories()
  }, [clubId])

  const loadSocios = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('socios')
        .select('*')
        .eq('club_id', clubId)
        .order('nombre', { ascending: true })

      if (error) throw error
      setSocios(data || [])
    } catch (err) {
      console.error('Error loading socios:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorias_socios')
        .select('*')
        .eq('club_id', clubId)
        .order('nombre', { ascending: true })

      if (error) throw error
      setCategories(data || [])
    } catch (err) {
      console.error('Error loading categories:', err)
    }
  }

  // Agregar socio
  const handleAddSocio = async () => {
    const nombre = prompt('Nombre:')
    const apellido = prompt('Apellido:')
    const dni = prompt('DNI:')
    const telefono = prompt('Teléfono (incluir 9 después del código de área, ej: 2216123456):')
    const email = prompt('Email (opcional):')

    if (!nombre || !apellido || !dni) {
      alert('Nombre, apellido y DNI son obligatorios')
      return
    }

    try {
      const { error } = await supabase.from('socios').insert([
        {
          club_id: clubId,
          nombre,
          apellido,
          dni,
          telefono: telefono || null,
          email: email || null,
          categoria: categories[0]?.id || 'activo',
          estado: 'activo',
          cuota_mes: 0,
          fecha_ingreso: new Date().toISOString().split('T')[0],
        },
      ])

      if (error) throw error
      await loadSocios()
      alert('Socio agregado correctamente')
    } catch (err) {
      console.error('Error adding socio:', err)
      alert('Error al agregar el socio')
    }
  }

  // Editar socio
  const startEdit = (socio: Socio) => {
    setEditingId(socio.id)
    setEditForm(socio)
  }

  const saveEdit = async () => {
    if (!editingId) return

    try {
      const { error } = await supabase
        .from('socios')
        .update(editForm)
        .eq('id', editingId)
        .eq('club_id', clubId)

      if (error) throw error
      setEditingId(null)
      await loadSocios()
      alert('Socio actualizado correctamente')
    } catch (err) {
      console.error('Error updating socio:', err)
      alert('Error al actualizar el socio')
    }
  }

  // Eliminar socio
  const deleteSocio = async (id: string) => {
    if (!confirm('¿Estás seguro? Esta acción no se puede deshacer.')) return

    try {
      const { error } = await supabase
        .from('socios')
        .delete()
        .eq('id', id)
        .eq('club_id', clubId)

      if (error) throw error
      await loadSocios()
      alert('Socio eliminado correctamente')
    } catch (err) {
      console.error('Error deleting socio:', err)
      alert('Error al eliminar el socio')
    }
  }

  // Filtrar socios
  const filteredSocios = socios.filter(s => {
    const matchesSearch =
      s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.apellido?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.dni.includes(searchTerm)

    const matchesCategory = categoryFilter === 'todos' || s.categoria === categoryFilter
    const matchesStatus = statusFilter === 'todos' || s.estado === statusFilter

    return matchesSearch && matchesCategory && matchesStatus
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" style={{ color: 'var(--text-primary)' }}>
        <div>Cargando socios...</div>
      </div>
    )
  }

  return (
    <div className="page-container" style={{ paddingBottom: '4rem' }}>
      <div className="page-header flex justify-between items-center mb-10">
        <div>
          <h1 className="page-title">Directorio de Socios</h1>
          <p className="text-secondary mt-2 text-lg">
            Carga, edita y administra el listado de socios del club. Los socios interactúan con el club vía WhatsApp.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn-secondary" title="Descargar CSV">
            <Download size={18} />
            <span>Descargar</span>
          </button>
          <button className="btn-secondary" title="Importar CSV">
            <Upload size={18} />
            <span>Importar</span>
          </button>
          <button className="btn-primary" onClick={handleAddSocio}>
            <UserPlus size={18} />
            <span>Nuevo Socio</span>
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="glass-panel mb-8 p-4">
        <div className="socios-search-bar">
          <div className="socios-search-input">
            <Search size={18} className="text-muted" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            <input
              type="text"
              placeholder="Buscar por nombre, apellido o DNI..."
              className="input-glass"
              style={{ paddingLeft: '3rem', paddingRight: '1rem', height: '3rem', fontSize: '1rem', width: '100%' }}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <select
            className="input-glass socios-search-select"
            style={{ height: '3rem' }}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="todos">Todas las categorías</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nombre}
              </option>
            ))}
          </select>
          <select
            className="input-glass socios-search-select"
            style={{ height: '3rem' }}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="todos">Cualquier estado</option>
            <option value="activo">Activo</option>
            <option value="moroso">Moroso</option>
            <option value="baja">Baja</option>
          </select>
        </div>
      </div>

      {/* Tabla de socios */}
      <div className="glass-panel table-responsive">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
          <thead>
            <tr style={{ background: 'var(--table-hover)', borderBottom: '1px solid var(--glass-border)' }}>
              <th style={{ padding: '1.25rem 2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Socio</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DNI</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Teléfono</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categoría</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
              <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)', textAlign: 'right' }}>Cuota Mes</th>
              <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredSocios.map((socio, idx) => (
              <tr
                key={socio.id}
                style={{ borderBottom: idx !== filteredSocios.length - 1 ? '1px solid var(--glass-border)' : 'none' }}
                className="hover-table-row"
              >
                {editingId === socio.id ? (
                  <>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={editForm.nombre || ''}
                          onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                          className="input-glass"
                          placeholder="Nombre"
                          style={{ flex: 1, padding: '0.5rem' }}
                        />
                        <input
                          type="text"
                          value={editForm.apellido || ''}
                          onChange={(e) => setEditForm({ ...editForm, apellido: e.target.value })}
                          className="input-glass"
                          placeholder="Apellido"
                          style={{ flex: 1, padding: '0.5rem' }}
                        />
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <input
                        type="text"
                        value={editForm.dni || ''}
                        onChange={(e) => setEditForm({ ...editForm, dni: e.target.value })}
                        className="input-glass"
                        placeholder="DNI"
                        style={{ width: '100%', padding: '0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <input
                        type="text"
                        value={editForm.telefono || ''}
                        onChange={(e) => setEditForm({ ...editForm, telefono: e.target.value })}
                        className="input-glass"
                        placeholder="Teléfono"
                        style={{ width: '100%', padding: '0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <select
                        value={editForm.categoria || ''}
                        onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                        className="input-glass"
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>
                            {cat.nombre}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <select
                        value={editForm.estado || ''}
                        onChange={(e) => setEditForm({ ...editForm, estado: e.target.value as any })}
                        className="input-glass"
                        style={{ width: '100%', padding: '0.5rem' }}
                      >
                        <option value="activo">Activo</option>
                        <option value="moroso">Moroso</option>
                        <option value="baja">Baja</option>
                      </select>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                      <input
                        type="number"
                        value={editForm.cuota_mes || 0}
                        onChange={(e) => setEditForm({ ...editForm, cuota_mes: parseFloat(e.target.value) })}
                        className="input-glass"
                        placeholder="0"
                        style={{ width: '100%', padding: '0.5rem' }}
                      />
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div className="flex justify-end gap-sm">
                        <button className="btn-primary" onClick={saveEdit} style={{ padding: '0.5rem 1rem' }}>
                          Guardar
                        </button>
                        <button
                          className="btn-secondary"
                          onClick={() => setEditingId(null)}
                          style={{ padding: '0.5rem 1rem' }}
                        >
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  <>
                    <td style={{ padding: '1.25rem 2rem' }}>
                      <div className="flex items-center gap-md">
                        <div
                          className="user-avatar"
                          style={{ width: 40, height: 40, fontSize: '0.875rem', background: 'var(--gradient-primary)' }}
                        >
                          {socio.nombre.charAt(0)}
                          {socio.apellido?.charAt(0)}
                        </div>
                        <div>
                          <div className="font-bold text-base">
                            {socio.nombre} {socio.apellido}
                          </div>
                          {socio.email && <div className="text-xs text-muted">{socio.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }} className="font-medium">
                      {socio.dni}
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      {socio.telefono ? (
                        <a
                          href={`https://wa.me/549${socio.telefono}?text=Hola%20${socio.nombre},%20nos%20comunicamos%20del%20club.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-success hover:underline"
                        >
                          <MessageCircle size={16} />
                          {socio.telefono}
                        </a>
                      ) : (
                        <span className="text-muted text-sm">Sin teléfono</span>
                      )}
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span className="badge" style={{ background: 'var(--table-hover)' }}>
                        {categories.find((c) => c.id === socio.categoria)?.nombre || socio.categoria}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem' }}>
                      <span
                        className={`badge ${
                          socio.estado === 'activo'
                            ? 'badge-success'
                            : socio.estado === 'moroso'
                              ? 'badge-warning'
                              : 'badge-error'
                        }`}
                      >
                        {socio.estado.charAt(0).toUpperCase() + socio.estado.slice(1)}
                      </span>
                    </td>
                    <td style={{ padding: '1.25rem 1rem', textAlign: 'right' }}>
                      ${socio.cuota_mes.toFixed(2)}
                    </td>
                    <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                      <div className="flex justify-end gap-sm">
                        <button
                          className="icon-btn"
                          title="Editar"
                          onClick={() => startEdit(socio)}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          className="icon-btn text-error"
                          title="Eliminar"
                          onClick={() => deleteSocio(socio.id)}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
            {filteredSocios.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{ padding: '4rem', textAlign: 'center' }}
                  className="text-muted text-lg"
                >
                  {socios.length === 0 ? 'No hay socios cargados. ¡Comienza agregando uno!' : 'No se encontraron socios con esos criterios.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-primary)' }}>
            {socios.length}
          </div>
          <div className="text-sm text-secondary mt-2">Total de Socios</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-success)' }}>
            {socios.filter((s) => s.estado === 'activo').length}
          </div>
          <div className="text-sm text-secondary mt-2">Socios Activos</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold" style={{ color: 'var(--accent-warning)' }}>
            {socios.filter((s) => s.estado === 'moroso').length}
          </div>
          <div className="text-sm text-secondary mt-2">Socios Morosos</div>
        </div>
        <div className="glass-panel p-4 text-center">
          <div className="text-2xl font-bold">
            ${socios.reduce((sum, s) => sum + s.cuota_mes, 0).toFixed(2)}
          </div>
          <div className="text-sm text-secondary mt-2">Ingresos Mensuales</div>
        </div>
      </div>
    </div>
  )
}
