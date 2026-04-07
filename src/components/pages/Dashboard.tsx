'use client'

import { Wallet, Users, TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react'
import { useClub } from '@/hooks/useClub'
import { useDashboardStats } from '@/hooks/useDashboardStats'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function StatCard({ title, value, icon: Icon, trend, type = 'default' }: { title: string; value: string; icon: React.ElementType; trend?: string; type?: string }) {
  return (
    <div className="glass-panel stat-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-secondary font-medium text-sm" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>{title}</h3>
        <div className={`icon-btn ${type === 'success' ? 'text-success' : type === 'warning' ? 'text-warning' : 'text-primary'}`} style={{ background: 'var(--table-hover)' }}>
          <Icon size={20} />
        </div>
      </div>
      <div>
        <div className="stat-value font-bold mb-3">{value}</div>
        {trend && (
          <div className="flex items-center gap-xs text-xs font-semibold">
            <TrendingUp size={14} className="text-success" />
            <span className="text-success">{trend}</span>
            <span className="text-muted font-normal ml-1">vs mes pasado</span>
          </div>
        )}
      </div>
    </div>
  )
}

function LoadingState() {
  return (
    <div className="page-container">
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
          <p className="text-secondary">Cargando estadisticas...</p>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="page-container">
      <div className="glass-panel p-8 text-center">
        <Users size={48} className="mx-auto mb-4 text-secondary" />
        <h3 className="text-xl font-bold mb-2">Sin datos todavia</h3>
        <p className="text-secondary mb-4">
          Comenza cargando tus socios desde el menu lateral para ver las estadisticas del club.
        </p>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { displayName } = useClub()
  const { stats, distribucion, transacciones, evolucion, loading, error } = useDashboardStats()

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val)

  const chartColors = {
    grid: 'rgba(255,255,255,0.05)',
    text: '#94a3b8',
    tooltipBg: '#1e293b',
    tooltipBorder: '#334155',
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div style={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-base)', fontSize: '0.875rem' }}>
          <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color, fontWeight: 500 }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  if (loading) return <LoadingState />
  
  if (error) {
    return (
      <div className="page-container">
        <div className="glass-panel p-8 text-center">
          <AlertTriangle size={48} className="mx-auto mb-4 text-warning" />
          <h3 className="text-xl font-bold mb-2">Error cargando datos</h3>
          <p className="text-secondary">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats || stats.totalSocios === 0) return <EmptyState />

  const pieData = distribucion.map(d => ({
    name: d.nombre,
    value: d.cantidad,
    color: d.color,
  }))

  return (
    <div className="page-container" style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">{displayName}</h1>
        <p className="text-secondary mt-2 dashboard-subtitle">Vision general del estado operativo e indicadores.</p>
      </div>

      <div className="dashboard-stats-grid mb-10">
        <StatCard 
          title="Socios Activos" 
          value={stats.sociosActivos.toLocaleString()} 
          icon={Users} 
          trend={stats.nuevosEsteMes > 0 ? `+${stats.nuevosEsteMes} nuevos` : undefined}
        />
        <StatCard 
          title="Ingresos Mensuales" 
          value={formatCurrency(stats.ingresosMensuales)} 
          icon={Wallet} 
          type="success" 
        />
        <StatCard 
          title="Cuotas Pendientes" 
          value={formatCurrency(stats.cuotasPendientes)} 
          icon={AlertTriangle} 
          trend={stats.sociosMorosos > 0 ? `${stats.sociosMorosos} morosos` : undefined}
          type="warning" 
        />
        <StatCard 
          title="Reservas Semana" 
          value={stats.reservasSemana.toString()} 
          icon={CalendarDays} 
          trend={stats.reservasHoy > 0 ? `${stats.reservasHoy} hoy` : undefined}
        />
      </div>

      <div className="dashboard-charts-grid mb-10">
        <div className="glass-panel dashboard-chart-main" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="text-xl font-bold">Evolucion Financiera</h3>
            <span className="text-sm text-secondary">Ultimos 6 meses</span>
          </div>
          <div className="dashboard-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={evolucion} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--success)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--error)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--error)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 11 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 11 }} tickFormatter={(val) => `$${Math.round(val / 1000)}k`} dx={-5} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--success)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Gastos" stroke="var(--error)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-xl font-bold mb-4">Distribucion Societaria</h3>
          {pieData.length > 0 ? (
            <>
              <div style={{ height: '220px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 'var(--radius-md)' }} itemStyle={{ fontWeight: 500 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex-col gap-sm mt-4">
                {pieData.map(item => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-xs">
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, flexShrink: 0 }}></div>
                      <span className="text-secondary">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-secondary">
              Sin categorias definidas
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Ingresos Recientes</h3>
          </div>
          <div className="flex-col gap-md">
            {transacciones.length > 0 ? (
              transacciones.map((tx, idx) => (
                <div key={tx.id} className="flex justify-between items-center pb-4" style={{ borderBottom: idx !== transacciones.length - 1 ? `1px solid ${chartColors.grid}` : 'none' }}>
                  <div className="flex items-center gap-md">
                    <div className="user-avatar" style={{ width: 40, height: 40, background: 'var(--table-hover)', color: 'var(--text-primary)' }}>
                      <Wallet size={16} className="text-success" />
                    </div>
                    <div>
                      <div className="font-medium mb-1" style={{ fontSize: '0.9rem' }}>{tx.socio}</div>
                      <div className="text-xs text-secondary">{tx.concepto}</div>
                    </div>
                  </div>
                  <div className="text-right" style={{ flexShrink: 0 }}>
                    <div className="font-bold text-success" style={{ fontSize: '0.9rem' }}>+{formatCurrency(tx.monto)}</div>
                    <div className="text-xs text-muted">{tx.fecha}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-secondary py-8">
                Sin transacciones recientes
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="text-lg font-bold mb-4">Resumen</h3>
          <div className="flex-col gap-md">
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--table-hover)' }}>
              <span className="text-secondary">Total Socios</span>
              <span className="font-bold">{stats.totalSocios}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--table-hover)' }}>
              <span className="text-secondary">Activos</span>
              <span className="font-bold text-success">{stats.sociosActivos}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--table-hover)' }}>
              <span className="text-secondary">Morosos</span>
              <span className="font-bold text-warning">{stats.sociosMorosos}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--table-hover)' }}>
              <span className="text-secondary">Nuevos este mes</span>
              <span className="font-bold text-primary">{stats.nuevosEsteMes}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg" style={{ background: 'var(--table-hover)' }}>
              <span className="text-secondary">Reservas hoy</span>
              <span className="font-bold">{stats.reservasHoy}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
