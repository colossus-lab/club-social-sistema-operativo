import { Wallet, Users, TrendingUp, AlertTriangle, CalendarDays } from 'lucide-react';
import { useClubStore } from '../store/useClubStore';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function StatCard({ title, value, icon: Icon, trend, type = 'default' }) {
    return (
        <div className="glass-panel" style={{ padding: '1.75rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%' }}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-secondary font-medium text-sm text-uppercase tracking-wide">{title}</h3>
                <div className={`icon-btn ${type === 'success' ? 'text-success' : type === 'warning' ? 'text-warning' : 'text-primary'}`} style={{ background: 'var(--table-hover)' }}>
                    <Icon size={20} />
                </div>
            </div>
            <div>
                <div className="text-3xl font-bold mb-3">{value}</div>
                <div className="flex items-center gap-xs text-xs font-semibold">
                    <TrendingUp size={14} className="text-success" />
                    <span className="text-success">{trend}</span>
                    <span className="text-muted font-normal ml-1">vs mes pasado</span>
                </div>
            </div>
        </div>
    );
}

export default function Dashboard() {
    const { clubInfo, transactions, historicalRevenue, theme } = useClubStore();

    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);
    const isLight = theme === 'light-theme';

    // Custom colors for charts based on theme
    const chartColors = {
        grid: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        text: isLight ? '#64748b' : '#94a3b8',
        tooltipBg: isLight ? '#ffffff' : '#1e293b',
        tooltipBorder: isLight ? '#e2e8f0' : '#334155',
    };

    const pieData = [
        { name: 'Activos', value: 980, color: 'var(--accent-primary)' },
        { name: 'Vitalicios', value: 220, color: 'var(--accent-secondary)' },
        { name: 'Cadetes/Infantiles', value: 250, color: 'var(--warning)' },
    ];

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, padding: '1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-base)' }}>
                    <p className="font-bold mb-2 text-primary" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.color, fontSize: '0.875rem', fontWeight: 500 }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="page-container" style={{ paddingBottom: '4rem' }}>
            <div className="page-header mb-10">
                <h1 className="page-title">{clubInfo.name} - Centro de Comando</h1>
                <p className="text-secondary mt-2 text-lg">Visión general del estado operativo e indicadores financieros.</p>
            </div>

            <div className="grid grid-cols-4 grid-gap mb-10">
                <StatCard title="Socios Activos" value={clubInfo.activeMembers.toLocaleString()} icon={Users} trend="+12%" />
                <StatCard title="Ingresos Mensuales" value={formatCurrency(clubInfo.monthlyRevenue)} icon={Wallet} trend="+5.4%" type="success" />
                <StatCard title="Cuotas Pendientes" value={formatCurrency(clubInfo.pendingDues)} icon={AlertTriangle} trend="-2.1%" type="warning" />
                <StatCard title="Nuevas Altas" value="142" icon={TrendingUp} trend="+18%" />
            </div>

            <div className="grid grid-cols-3 grid-gap mb-10">
                <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 2' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold">Evolución Financiera</h3>
                        <select className="input-glass text-sm" style={{ width: 'auto', padding: '0.5rem 1rem' }}>
                            <option>Últimos 6 meses</option>
                            <option>Último año</option>
                        </select>
                    </div>
                    <div style={{ height: '350px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={historicalRevenue} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
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
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} tickFormatter={(val) => `$${val / 1000000}M`} dx={-10} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="revenue" name="Ingresos" stroke="var(--success)" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                                <Area type="monotone" dataKey="expenses" name="Gastos" stroke="var(--error)" strokeWidth={3} fillOpacity={1} fill="url(#colorExp)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem', display: 'flex', flexDirection: 'column' }}>
                    <h3 className="text-xl font-bold mb-6">Distribución Societaria</h3>
                    <div style={{ height: '250px', width: '100%', flex: 1 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                >
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
                                    <div style={{ width: 12, height: 12, borderRadius: '50%', background: item.color }}></div>
                                    <span className="text-secondary">{item.name}</span>
                                </div>
                                <span className="font-bold">{item.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 grid-gap">
                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold">Ingresos Recientes</h3>
                        <button className="text-sm font-medium text-accent-primary hover:text-accent-primary-hover">Ver todos</button>
                    </div>
                    <div className="flex-col gap-md">
                        {transactions.slice(0, 5).map((tx, idx) => (
                            <div key={tx.id} className="flex justify-between items-center pb-4" style={{ borderBottom: idx !== 4 ? `1px solid ${chartColors.grid}` : 'none' }}>
                                <div className="flex items-center gap-md">
                                    <div className="user-avatar" style={{ width: 40, height: 40, background: 'var(--table-hover)', color: 'var(--text-primary)' }}>
                                        <Wallet size={18} className="text-success" />
                                    </div>
                                    <div>
                                        <div className="font-medium text-base mb-1">{tx.socio}</div>
                                        <div className="text-xs text-secondary">{tx.concepto}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-success text-base mb-1">+{formatCurrency(tx.monto)}</div>
                                    <div className="text-xs text-muted">{tx.fecha}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '2rem' }}>
                    <h3 className="text-lg font-bold mb-6">Próximos Eventos & Tareas</h3>
                    <div className="flex-col gap-md">
                        {[
                            { date: '15 Mar', title: 'Vencimiento Cuota General', type: 'warning' },
                            { date: '18 Mar', title: 'Torneo Interclubes Tenis', type: 'primary' },
                            { date: '22 Mar', title: 'Asamblea Anual Ordinaria', type: 'secondary' },
                            { date: '30 Mar', title: 'Cierre Contable Mensual', type: 'success' },
                        ].map((evt, idx) => (
                            <div key={idx} className="flex gap-md p-4 rounded-lg" style={{ background: 'var(--table-hover)' }}>
                                <div className="flex-col items-center justify-center p-3 rounded-md" style={{ background: 'var(--input-bg)', minWidth: '70px' }}>
                                    <CalendarDays size={18} className={`text-${evt.type} mb-1`} />
                                    <span className="text-xs font-bold text-center">{evt.date}</span>
                                </div>
                                <div className="flex flex-col justify-center">
                                    <div className="font-semibold text-base mb-1">{evt.title}</div>
                                    <div className="text-sm text-secondary">Sistema Operativo</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
