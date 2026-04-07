'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Search, Edit2, Trash2, X, DollarSign, FileText, Send, CheckCircle, Clock, AlertTriangle, Download } from 'lucide-react'

interface Socio {
  id: string
  nombre: string
  apellido: string
  telefono: string | null
  email: string | null
  cuota_mensual: number | null
  estado: string
  categoria: string | null
}

interface Factura {
  id: string
  socio_id: string
  numero_factura: string | null
  concepto: string
  monto: number
  fecha_emision: string
  fecha_vencimiento: string | null
  estado: string
  tipo_comprobante: string
  enviada_whatsapp: boolean
  pdf_url: string | null
  created_at: string
  socios?: Socio
}

const ESTADOS_FACTURA = [
  { value: 'pendiente', label: 'Pendiente', color: 'var(--warning)', icon: Clock },
  { value: 'pagada', label: 'Pagada', color: 'var(--success)', icon: CheckCircle },
  { value: 'vencida', label: 'Vencida', color: 'var(--error)', icon: AlertTriangle },
  { value: 'anulada', label: 'Anulada', color: 'var(--text-secondary)', icon: X },
]

const TIPOS_COMPROBANTE = [
  { value: 'recibo', label: 'Recibo' },
  { value: 'factura_a', label: 'Factura A' },
  { value: 'factura_b', label: 'Factura B' },
  { value: 'factura_c', label: 'Factura C' },
]

const CONCEPTOS_COMUNES = [
  'Cuota mensual',
  'Cuota anual',
  'Inscripcion',
  'Reserva de cancha',
  'Alquiler quincho',
  'Evento especial',
  'Otro',
]

export default function TesoreriaDB() {
  const { profile } = useAuth()
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [socios, setSocios] = useState<Socio[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterEstado, setFilterEstado] = useState<string>('todos')
  const [showModal, setShowModal] = useState(false)
  const [showCobrarModal, setShowCobrarModal] = useState(false)
  const [editingFactura, setEditingFactura] = useState<Factura | null>(null)
  const [formData, setFormData] = useState<Partial<Factura>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Para cobro masivo
  const [selectedSocios, setSelectedSocios] = useState<string[]>([])
  const [cobrarConcepto, setCobrarConcepto] = useState('Cuota mensual')

  const clubId = profile?.club_id

  useEffect(() => {
    if (clubId) {
      fetchData()
    }
  }, [clubId])

  const fetchData = async () => {
    if (!clubId) return

    try {
      setLoading(true)
      const supabase = createClient()

      // Fetch facturas
      const { data: facturasData, error: facturasError } = await supabase
        .from('facturas')
        .select(`
          *,
          socios:socio_id(id, nombre, apellido, telefono, email, cuota_mensual, estado, categoria)
        `)
        .eq('club_id', clubId)
        .order('fecha_emision', { ascending: false })
        .limit(100)

      if (facturasError) throw facturasError
      setFacturas(facturasData || [])

      // Fetch socios activos
      const { data: sociosData, error: sociosError } = await supabase
        .from('socios')
        .select('id, nombre, apellido, telefono, email, cuota_mensual, estado, categoria')
        .eq('club_id', clubId)
        .eq('estado', 'activo')
        .order('apellido')

      if (sociosError) throw sociosError
      setSocios(sociosData || [])

    } catch (err) {
      console.error('[v0] Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Error cargando datos')
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

      const facturaData = {
        ...formData,
        club_id: clubId,
        created_by: profile?.id,
      }

      if (editingFactura) {
        const { error } = await supabase
          .from('facturas')
          .update(facturaData)
          .eq('id', editingFactura.id)
          .eq('club_id', clubId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('facturas')
          .insert([facturaData])

        if (error) throw error
      }

      await fetchData()
      closeModal()
    } catch (err) {
      console.error('[v0] Error saving factura:', err)
      setError(err instanceof Error ? err.message : 'Error guardando factura')
    } finally {
      setSaving(false)
    }
  }

  const handleCobrarMasivo = async () => {
    if (!clubId || selectedSocios.length === 0) return

    try {
      setSaving(true)
      setError(null)
      const supabase = createClient()

      const hoy = new Date().toISOString().split('T')[0]
      const vencimiento = new Date()
      vencimiento.setDate(vencimiento.getDate() + 15)
      const vencimientoStr = vencimiento.toISOString().split('T')[0]

      const facturasToInsert = selectedSocios.map(socioId => {
        const socio = socios.find(s => s.id === socioId)
        return {
          club_id: clubId,
          socio_id: socioId,
          concepto: cobrarConcepto,
          monto: socio?.cuota_mensual || 0,
          fecha_emision: hoy,
          fecha_vencimiento: vencimientoStr,
          estado: 'pendiente',
          tipo_comprobante: 'recibo',
          created_by: profile?.id,
        }
      })

      const { error } = await supabase
        .from('facturas')
        .insert(facturasToInsert)

      if (error) throw error

      await fetchData()
      setShowCobrarModal(false)
      setSelectedSocios([])
    } catch (err) {
      console.error('[v0] Error en cobro masivo:', err)
      setError(err instanceof Error ? err.message : 'Error generando facturas')
    } finally {
      setSaving(false)
    }
  }

  const handleMarcarPagada = async (factura: Factura) => {
    if (!clubId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('facturas')
        .update({ estado: 'pagada' })
        .eq('id', factura.id)
        .eq('club_id', clubId)

      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('[v0] Error marcando pagada:', err)
    }
  }

  const handleDelete = async (factura: Factura) => {
    if (!confirm('Eliminar esta factura? Esta accion no se puede deshacer.')) return
    if (!clubId) return

    try {
      const supabase = createClient()
      const { error } = await supabase
        .from('facturas')
        .delete()
        .eq('id', factura.id)
        .eq('club_id', clubId)

      if (error) throw error
      await fetchData()
    } catch (err) {
      console.error('[v0] Error deleting factura:', err)
    }
  }

  const openModal = (factura?: Factura) => {
    if (factura) {
      setEditingFactura(factura)
      setFormData({
        socio_id: factura.socio_id,
        concepto: factura.concepto,
        monto: factura.monto,
        fecha_emision: factura.fecha_emision,
        fecha_vencimiento: factura.fecha_vencimiento || undefined,
        estado: factura.estado,
        tipo_comprobante: factura.tipo_comprobante,
      })
    } else {
      setEditingFactura(null)
      const hoy = new Date().toISOString().split('T')[0]
      setFormData({
        concepto: 'Cuota mensual',
        fecha_emision: hoy,
        estado: 'pendiente',
        tipo_comprobante: 'recibo',
      })
    }
    setShowModal(true)
    setError(null)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditingFactura(null)
    setFormData({})
    setError(null)
  }

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val)

  const getEstadoInfo = (estado: string) => 
    ESTADOS_FACTURA.find(e => e.value === estado) || ESTADOS_FACTURA[0]

  const filteredFacturas = facturas.filter(f => {
    const socioNombre = f.socios ? `${f.socios.nombre} ${f.socios.apellido}`.toLowerCase() : ''
    const matchesSearch = socioNombre.includes(searchTerm.toLowerCase()) ||
      f.concepto.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesEstado = filterEstado === 'todos' || f.estado === filterEstado
    return matchesSearch && matchesEstado
  })

  // Stats
  const stats = {
    total: facturas.length,
    pendientes: facturas.filter(f => f.estado === 'pendiente').length,
    pagadas: facturas.filter(f => f.estado === 'pagada').length,
    montoPendiente: facturas.filter(f => f.estado === 'pendiente').reduce((sum, f) => sum + f.monto, 0),
    montoCobrado: facturas.filter(f => f.estado === 'pagada').reduce((sum, f) => sum + f.monto, 0),
  }

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
            <p className="text-secondary">Cargando tesoreria...</p>
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
            <h1 className="page-title">Tesoreria</h1>
            <p className="text-secondary mt-1">Gestion de cobros y facturas</p>
          </div>
          <div className="flex gap-2">
            <button className="btn-secondary flex items-center gap-2" onClick={() => setShowCobrarModal(true)}>
              <DollarSign size={18} />
              <span>Cobro Masivo</span>
            </button>
            <button className="btn-primary flex items-center gap-2" onClick={() => openModal()}>
              <Plus size={18} />
              <span>Nueva Factura</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <FileText size={20} className="text-primary" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.total}</div>
              <div className="text-sm text-secondary">Total Facturas</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <Clock size={20} className="text-warning" />
            </div>
            <div>
              <div className="text-2xl font-bold">{stats.pendientes}</div>
              <div className="text-sm text-secondary">Pendientes</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <AlertTriangle size={20} className="text-error" />
            </div>
            <div>
              <div className="text-2xl font-bold text-warning">{formatCurrency(stats.montoPendiente)}</div>
              <div className="text-sm text-secondary">Por Cobrar</div>
            </div>
          </div>
        </div>
        <div className="glass-panel p-4">
          <div className="flex items-center gap-3">
            <div className="icon-btn" style={{ background: 'var(--table-hover)' }}>
              <CheckCircle size={20} className="text-success" />
            </div>
            <div>
              <div className="text-2xl font-bold text-success">{formatCurrency(stats.montoCobrado)}</div>
              <div className="text-sm text-secondary">Cobrado</div>
            </div>
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
                placeholder="Buscar por socio o concepto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-glass w-full pl-10"
              />
            </div>
          </div>
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="input-glass"
            style={{ minWidth: '150px' }}
          >
            <option value="todos">Todos los estados</option>
            {ESTADOS_FACTURA.map(e => (
              <option key={e.value} value={e.value}>{e.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Lista de facturas */}
      {filteredFacturas.length === 0 ? (
        <div className="glass-panel p-8 text-center">
          <FileText size={48} className="mx-auto mb-4 text-secondary" />
          <h3 className="text-xl font-bold mb-2">
            {facturas.length === 0 ? 'Sin facturas' : 'Sin resultados'}
          </h3>
          <p className="text-secondary mb-4">
            {facturas.length === 0 
              ? 'Crea tu primera factura o usa el cobro masivo para generar cuotas.'
              : 'No hay facturas que coincidan con tu busqueda.'}
          </p>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Socio</th>
                  <th>Concepto</th>
                  <th>Monto</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredFacturas.map(factura => {
                  const estadoInfo = getEstadoInfo(factura.estado)
                  const EstadoIcon = estadoInfo.icon
                  return (
                    <tr key={factura.id}>
                      <td>
                        <div className="font-medium">
                          {factura.socios ? `${factura.socios.apellido}, ${factura.socios.nombre}` : 'Sin socio'}
                        </div>
                        {factura.socios?.categoria && (
                          <div className="text-xs text-secondary">{factura.socios.categoria}</div>
                        )}
                      </td>
                      <td>{factura.concepto}</td>
                      <td className="font-bold">{formatCurrency(factura.monto)}</td>
                      <td>
                        <div className="text-sm">{factura.fecha_emision}</div>
                        {factura.fecha_vencimiento && (
                          <div className="text-xs text-secondary">Vence: {factura.fecha_vencimiento}</div>
                        )}
                      </td>
                      <td>
                        <span 
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                          style={{ background: `${estadoInfo.color}20`, color: estadoInfo.color }}
                        >
                          <EstadoIcon size={12} />
                          {estadoInfo.label}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {factura.estado === 'pendiente' && (
                            <button
                              onClick={() => handleMarcarPagada(factura)}
                              className="icon-btn text-success"
                              style={{ background: 'var(--table-hover)' }}
                              title="Marcar como pagada"
                            >
                              <CheckCircle size={16} />
                            </button>
                          )}
                          <button
                            onClick={() => openModal(factura)}
                            className="icon-btn"
                            style={{ background: 'var(--table-hover)' }}
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => handleDelete(factura)}
                            className="icon-btn text-error"
                            style={{ background: 'var(--table-hover)' }}
                            title="Eliminar"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Nueva/Editar Factura */}
      {showModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingFactura ? 'Editar Factura' : 'Nueva Factura'}
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
                  <label className="form-label">Socio *</label>
                  <select
                    value={formData.socio_id || ''}
                    onChange={e => {
                      const socio = socios.find(s => s.id === e.target.value)
                      setFormData(prev => ({ 
                        ...prev, 
                        socio_id: e.target.value,
                        monto: socio?.cuota_mensual || prev.monto,
                      }))
                    }}
                    className="input-glass w-full"
                    required
                  >
                    <option value="">Seleccionar socio</option>
                    {socios.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.apellido}, {s.nombre} - {formatCurrency(s.cuota_mensual || 0)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Concepto *</label>
                  <select
                    value={formData.concepto || ''}
                    onChange={e => setFormData(prev => ({ ...prev, concepto: e.target.value }))}
                    className="input-glass w-full"
                    required
                  >
                    {CONCEPTOS_COMUNES.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Monto *</label>
                    <input
                      type="number"
                      value={formData.monto || ''}
                      onChange={e => setFormData(prev => ({ ...prev, monto: parseInt(e.target.value) || 0 }))}
                      className="input-glass w-full"
                      placeholder="$"
                      min="0"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Tipo</label>
                    <select
                      value={formData.tipo_comprobante || 'recibo'}
                      onChange={e => setFormData(prev => ({ ...prev, tipo_comprobante: e.target.value }))}
                      className="input-glass w-full"
                    >
                      {TIPOS_COMPROBANTE.map(t => (
                        <option key={t.value} value={t.value}>{t.label}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="form-group">
                    <label className="form-label">Fecha Emision</label>
                    <input
                      type="date"
                      value={formData.fecha_emision || ''}
                      onChange={e => setFormData(prev => ({ ...prev, fecha_emision: e.target.value }))}
                      className="input-glass w-full"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Vencimiento</label>
                    <input
                      type="date"
                      value={formData.fecha_vencimiento || ''}
                      onChange={e => setFormData(prev => ({ ...prev, fecha_vencimiento: e.target.value }))}
                      className="input-glass w-full"
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
                    {ESTADOS_FACTURA.map(e => (
                      <option key={e.value} value={e.value}>{e.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal} className="btn-secondary">
                  Cancelar
                </button>
                <button type="submit" className="btn-primary" disabled={saving}>
                  {saving ? 'Guardando...' : (editingFactura ? 'Guardar' : 'Crear Factura')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cobro Masivo */}
      {showCobrarModal && (
        <div className="modal-overlay" onClick={() => setShowCobrarModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2 className="modal-title">Cobro Masivo de Cuotas</h2>
              <button onClick={() => setShowCobrarModal(false)} className="icon-btn">
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              {error && (
                <div className="mb-4 p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)' }}>
                  {error}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Concepto</label>
                <select
                  value={cobrarConcepto}
                  onChange={e => setCobrarConcepto(e.target.value)}
                  className="input-glass w-full"
                >
                  {CONCEPTOS_COMUNES.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Seleccionar Socios ({selectedSocios.length} seleccionados)</label>
                <div className="flex gap-2 mb-2">
                  <button 
                    type="button" 
                    className="btn-secondary text-sm"
                    onClick={() => setSelectedSocios(socios.map(s => s.id))}
                  >
                    Seleccionar todos
                  </button>
                  <button 
                    type="button" 
                    className="btn-secondary text-sm"
                    onClick={() => setSelectedSocios([])}
                  >
                    Deseleccionar todos
                  </button>
                </div>
                <div className="max-h-64 overflow-y-auto border rounded-lg" style={{ borderColor: 'var(--glass-border)' }}>
                  {socios.map(socio => (
                    <label 
                      key={socio.id} 
                      className="flex items-center gap-3 p-3 cursor-pointer hover:bg-table-hover"
                      style={{ borderBottom: '1px solid var(--glass-border)' }}
                    >
                      <input
                        type="checkbox"
                        checked={selectedSocios.includes(socio.id)}
                        onChange={e => {
                          if (e.target.checked) {
                            setSelectedSocios(prev => [...prev, socio.id])
                          } else {
                            setSelectedSocios(prev => prev.filter(id => id !== socio.id))
                          }
                        }}
                        className="w-4 h-4"
                      />
                      <div className="flex-1">
                        <div className="font-medium">{socio.apellido}, {socio.nombre}</div>
                        <div className="text-xs text-secondary">{socio.categoria}</div>
                      </div>
                      <div className="font-bold">{formatCurrency(socio.cuota_mensual || 0)}</div>
                    </label>
                  ))}
                </div>
              </div>

              {selectedSocios.length > 0 && (
                <div className="p-4 rounded-lg mt-4" style={{ background: 'var(--table-hover)' }}>
                  <div className="flex justify-between items-center">
                    <span className="text-secondary">Total a generar:</span>
                    <span className="text-xl font-bold">
                      {formatCurrency(
                        selectedSocios.reduce((sum, id) => {
                          const socio = socios.find(s => s.id === id)
                          return sum + (socio?.cuota_mensual || 0)
                        }, 0)
                      )}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" onClick={() => setShowCobrarModal(false)} className="btn-secondary">
                Cancelar
              </button>
              <button 
                onClick={handleCobrarMasivo} 
                className="btn-primary" 
                disabled={saving || selectedSocios.length === 0}
              >
                {saving ? 'Generando...' : `Generar ${selectedSocios.length} Facturas`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
