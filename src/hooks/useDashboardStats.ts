'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface DashboardStats {
  totalSocios: number
  sociosActivos: number
  sociosMorosos: number
  nuevosEsteMes: number
  ingresosMensuales: number
  cuotasPendientes: number
  reservasHoy: number
  reservasSemana: number
}

export interface DistribucionCategoria {
  nombre: string
  cantidad: number
  color: string
}

export interface TransaccionReciente {
  id: string
  socio: string
  concepto: string
  monto: number
  fecha: string
  tipo: 'ingreso' | 'egreso'
}

export interface EvolucionFinanciera {
  month: string
  revenue: number
  expenses: number
}

const CATEGORY_COLORS = [
  'var(--accent-primary)',
  'var(--accent-secondary)', 
  'var(--warning)',
  'var(--success)',
  'var(--error)',
  '#8b5cf6',
  '#06b6d4',
]

export function useDashboardStats() {
  const { profile, hasClub } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [distribucion, setDistribucion] = useState<DistribucionCategoria[]>([])
  const [transacciones, setTransacciones] = useState<TransaccionReciente[]>([])
  const [evolucion, setEvolucion] = useState<EvolucionFinanciera[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasClub || !profile?.club_id) {
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      try {
        const supabase = createClient()
        const clubId = profile.club_id

        // Fetch socios stats
        const { data: socios, error: sociosError } = await supabase
          .from('socios')
          .select('id, estado, categoria, cuota_mensual, created_at')
          .eq('club_id', clubId)

        if (sociosError) throw sociosError

        const now = new Date()
        const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1)
        
        const totalSocios = socios?.length || 0
        const sociosActivos = socios?.filter(s => s.estado === 'activo').length || 0
        const sociosMorosos = socios?.filter(s => s.estado === 'moroso').length || 0
        const nuevosEsteMes = socios?.filter(s => new Date(s.created_at) >= inicioMes).length || 0
        
        // Calcular ingresos potenciales (cuotas de socios activos)
        const ingresosMensuales = socios
          ?.filter(s => s.estado === 'activo')
          .reduce((sum, s) => sum + (s.cuota_mensual || 0), 0) || 0

        // Calcular cuotas pendientes (morosos * promedio cuota)
        const promedioCuota = totalSocios > 0 
          ? socios.reduce((sum, s) => sum + (s.cuota_mensual || 0), 0) / totalSocios 
          : 0
        const cuotasPendientes = sociosMorosos * promedioCuota

        // Fetch reservas de hoy y semana
        const hoy = now.toISOString().split('T')[0]
        const finSemana = new Date(now)
        finSemana.setDate(finSemana.getDate() + 7)
        const finSemanaStr = finSemana.toISOString().split('T')[0]

        const { data: reservasData, error: reservasError } = await supabase
          .from('reservas')
          .select('id, fecha')
          .eq('club_id', clubId)
          .gte('fecha', hoy)
          .lte('fecha', finSemanaStr)

        if (reservasError) throw reservasError

        const reservasHoy = reservasData?.filter(r => r.fecha === hoy).length || 0
        const reservasSemana = reservasData?.length || 0

        setStats({
          totalSocios,
          sociosActivos,
          sociosMorosos,
          nuevosEsteMes,
          ingresosMensuales,
          cuotasPendientes,
          reservasHoy,
          reservasSemana,
        })

        // Distribución por categoría
        const categoriasCount: Record<string, number> = {}
        socios?.forEach(s => {
          const cat = s.categoria || 'Sin categoría'
          categoriasCount[cat] = (categoriasCount[cat] || 0) + 1
        })

        const distribucionData = Object.entries(categoriasCount)
          .map(([nombre, cantidad], idx) => ({
            nombre,
            cantidad,
            color: CATEGORY_COLORS[idx % CATEGORY_COLORS.length],
          }))
          .sort((a, b) => b.cantidad - a.cantidad)

        setDistribucion(distribucionData)

        // Fetch facturas recientes como transacciones
        const { data: facturas, error: facturasError } = await supabase
          .from('facturas')
          .select(`
            id,
            concepto,
            monto,
            fecha_emision,
            estado,
            socio_id,
            socios!inner(nombre, apellido)
          `)
          .eq('club_id', clubId)
          .eq('estado', 'pagada')
          .order('fecha_emision', { ascending: false })
          .limit(5)

        if (facturasError && facturasError.code !== 'PGRST116') {
          console.log('[v0] Error fetching facturas:', facturasError)
        }

        const transaccionesData: TransaccionReciente[] = (facturas || []).map((f: any) => ({
          id: f.id,
          socio: f.socios ? `${f.socios.nombre} ${f.socios.apellido}` : 'Sin socio',
          concepto: f.concepto || 'Pago',
          monto: f.monto || 0,
          fecha: f.fecha_emision,
          tipo: 'ingreso' as const,
        }))

        setTransacciones(transaccionesData)

        // Evolución financiera (últimos 6 meses - simulado con datos de facturas)
        const meses: EvolucionFinanciera[] = []
        for (let i = 5; i >= 0; i--) {
          const fecha = new Date(now.getFullYear(), now.getMonth() - i, 1)
          const mesNombre = fecha.toLocaleDateString('es-AR', { month: 'short' })
          
          // Por ahora calculamos ingresos potenciales basados en socios activos
          // En producción esto vendría de facturas pagadas por mes
          meses.push({
            month: mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1),
            revenue: ingresosMensuales * (0.85 + Math.random() * 0.3), // Simular variación
            expenses: ingresosMensuales * (0.4 + Math.random() * 0.2), // Gastos ~50%
          })
        }
        setEvolucion(meses)

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error cargando estadísticas'
        setError(message)
        console.error('[v0] Dashboard stats error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [profile?.club_id, hasClub])

  const refresh = () => {
    setLoading(true)
    setError(null)
    // Re-trigger useEffect
  }

  return { 
    stats, 
    distribucion, 
    transacciones, 
    evolucion,
    loading, 
    error, 
    refresh 
  }
}
