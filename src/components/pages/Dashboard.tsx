'use client'

import { Wallet, Users, TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react'
import { useClubStore } from '@/src/store/useClubStore'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function StatCard({ title, value, icon: Icon, trend, type = 'default' }: { title: string; value: string; icon: React.ElementType; trend: string; type?: string }) {
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
        <div className="flex items-center gap-xs text-xs font-semibold">
          <TrendingUp size={14} className="text-success" />
          <span className="text-success">{trend}</span>
          <span className="text-muted font-normal ml-1">vs mes pasado</span>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const { clubInfo, transactions, historicalRevenue, theme } = useClubStore()

  const formatCurrency = (val: number) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val)
  const isLight = theme === 'light-theme'

  const chartColors = {
    grid: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
    text: isLight ? '#64748b' : '#94a3b8',
    tooltipBg: isLight ? '#ffffff' : '#1e293b',
    tooltipBorder: isLight ? '#e2e8f0' : '#334155',
  }

  const pieData = [
    { name: 'Activos', value: 980, color: 'var(--accent-primary)' },
    { name: 'Vitalicios', value: 220, color: 'var(--accent-secondary)' },
    { name: 'Cadetes', value: 250, color: 'var(--warning)' },
  ]

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

  return (
    <div className="page-container" style={{ paddingBottom: '2rem' }}>
      <div className="page-header">
        <h1 className="page-title">{clubInfo.name}</h1>
        <p className="text-secondary mt-2 dashboard-subtitle">Visión general del estado operativo e indicadores financieros.</p>
      </div>

      <div className="dashboard-stats-grid mb-10">
        <StatCard title="Socios Activos" value={clubInfo.activeMembers.toLocaleString()} icon={Users} trend="+12%" />
        <StatCard title="Ingresos Mensuales" value={formatCurrency(clubInfo.monthlyRevenue)} icon={Wallet} trend="+5.4%" type="success" />
        <StatCard title="Cuotas Pendientes" value={formatCurrency(clubInfo.pendingDues)} icon={AlertTriangle} trend="-2.1%" type="warning" />
        <StatCard title="Nuevas Altas" value="142" icon={TrendingUp} trend="+18%" />
      </div>

      <div className="dashboard-charts-grid mb-10">
        <div className="glass-panel dashboard-chart-main" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <h3 className="text-xl font-bold">Evolución Financiera</h3>
            <select className="input-glass text-sm" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
              <option>Últimos 6 meses</option>
              <option>Último año</option>
            </select>
          </div>
          <div className="dashboard-chart-area">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 11 }} tickFormatter={(val) => `$${val / 1000000}M`} dx={-5} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--success)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                <Area type="monotone" dataKey="expenses" name="Gastos" stroke="var(--error)" strokeWidth={2.5} fillOpacity={1} fill="url(#colorExp)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
          <h3 className="text-xl font-bold mb-4">Distribución Societaria</h3>
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
        </div>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold">Ingresos Recientes</h3>
            <button className="text-sm font-medium" style={{ color: 'var(--accent-primary)' }}>Ver todos</button>
          </div>
          <div className="flex-col gap-md">
            {transactions.slice(0, 5).map((tx, idx) => (
              <div key={tx.id} className="flex justify-between items-center pb-4" style={{ borderBottom: idx !== 4 ? `1px solid ${chartColors.grid}` : 'none' }}>
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
                  <div className="font-bold text-success" style={{ fontSize: '0.9rem' }}>+{formatCurrency(tx.monto || 0)}</div>
                  <div className="text-xs text-muted">{tx.fecha}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <h3 className="text-lg font-bold mb-4">Próximos Eventos</h3>
          <div className="flex-col gap-md">
            {[
              { date: '15 Mar', title: 'Vencimiento Cuota General', type: 'warning' },
              { date: '18 Mar', title: 'Torneo Interclubes Tenis', type: 'primary' },
              { date: '22 Mar', title: 'Asamblea Anual Ordinaria', type: 'secondary' },
              { date: '30 Mar', title: 'Cierre Contable Mensual', type: 'success' },
            ].map((evt, idx) => (
              <div key={idx} className="flex gap-md p-3 rounded-lg" style={{ background: 'var(--table-hover)' }}>
                <div className="flex-col items-center justify-center p-2 rounded-md" style={{ background: 'var(--input-bg)', minWidth: '60px' }}>
                  <CalendarDays size={16} className={`text-${evt.type} mb-1`} />
                  <span className="text-xs font-bold text-center">{evt.date}</span>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="font-semibold mb-1" style={{ fontSize: '0.9rem' }}>{evt.title}</div>
                  <div className="text-sm text-secondary">Sistema Operativo</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
