import { useState } from 'react';
import { useClubStore } from '../store/useClubStore';
import { CreditCard, Receipt, FileText, CheckCircle2, TrendingUp, Download, Star, MessageCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Tesoreria() {
    const { socios, payDue, historicalRevenue, theme, registrarIngresoEvento, transactions } = useClubStore();
    const [selectedSocio, setSelectedSocio] = useState('');
    const [eventoForm, setEventoForm] = useState({ nombre: '', descripcion: '', monto: '' });

    const morosos = socios.filter(s => s.estado === 'Moroso');
    const formatCurrency = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', minimumFractionDigits: 0 }).format(val);

    const isLight = theme === 'light-theme';
    const chartColors = {
        grid: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        text: isLight ? '#64748b' : '#94a3b8',
        tooltipBg: isLight ? '#ffffff' : '#1e293b',
        tooltipBorder: isLight ? '#e2e8f0' : '#334155',
    };

    const handlePayment = (e) => {
        e.preventDefault();
        if (!selectedSocio) return;
        payDue(selectedSocio);
        setSelectedSocio('');
        alert('¡Pago registrado con éxito!');
    };

    const handleEventoSubmit = (e) => {
        e.preventDefault();
        if (!eventoForm.nombre || !eventoForm.monto) return;
        registrarIngresoEvento({
            ...eventoForm,
            monto: Number(eventoForm.monto)
        });
        setEventoForm({ nombre: '', descripcion: '', monto: '' });
        alert('Ingreso extraordinario registrado con éxito en los fondos del Club.');
    };

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div style={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, padding: '0.75rem 1rem', borderRadius: 'var(--radius-md)', boxShadow: 'var(--shadow-base)', fontSize: '0.875rem' }}>
                    <p className="font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{label}</p>
                    {payload.map((entry, index) => (
                        <p key={index} style={{ color: entry.fill, fontWeight: 500 }}>
                            {entry.name}: {formatCurrency(entry.value)}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="page-container" style={{ paddingBottom: '2rem' }}>
            <div className="page-header">
                <h1 className="page-title">Tesorería y Finanzas</h1>
                <p className="text-secondary mt-2 dashboard-subtitle">Gestión de cobros, proyecciones de flujo de caja y facturación electrónica.</p>
            </div>

            {/* Top section: chart + alerts — stack on mobile */}
            <div className="tesoreria-top-grid mb-10">
                <div className="glass-panel tesoreria-chart-panel" style={{ padding: '1.5rem' }}>
                    <div className="flex justify-between items-center mb-6" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                        <h3 className="text-xl font-bold">Flujo de Caja Real vs Proyectado</h3>
                        <button className="btn-secondary text-sm">
                            <Download size={16} /> Exportar
                        </button>
                    </div>
                    <div className="tesoreria-chart-area">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={historicalRevenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }} barGap={4}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 11 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 11 }} tickFormatter={(val) => `$${val / 1000000}M`} dx={-5} />
                                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--table-hover)' }} />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Bar dataKey="revenue" name="Ingreso Real" fill="var(--accent-primary)" radius={[4, 4, 0, 0]} barSize={16} />
                                <Bar dataKey="expenses" name="Proyección" fill="rgba(148, 163, 184, 0.4)" radius={[4, 4, 0, 0]} barSize={16} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-sm">
                        <AlertSquare />
                        Atención Requerida
                    </h3>
                    <div className="flex-col gap-md">
                        <div className="flex justify-between items-center bg-input p-4 rounded-lg border-glass" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <div className="font-bold text-error flex items-center gap-2 mb-1">
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--error)', flexShrink: 0 }}></span>
                                    Morosidad Alta (+10%)
                                </div>
                                <div className="text-sm text-secondary">La tasa superó el límite esperado.</div>
                            </div>
                            <button className="btn-secondary text-xs" style={{ padding: '0.4rem 0.75rem', flexShrink: 0 }}>Detalle</button>
                        </div>
                        <div className="flex justify-between items-center bg-input p-4 rounded-lg border-glass" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                            <div>
                                <div className="font-bold text-warning flex items-center gap-2 mb-1">
                                    <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--warning)', flexShrink: 0 }}></span>
                                    Vencimiento AFIP
                                </div>
                                <div className="text-sm text-secondary">Presentación F.931 próxima.</div>
                            </div>
                            <button className="btn-secondary text-xs" style={{ padding: '0.4rem 0.75rem', flexShrink: 0 }}>Pagar</button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cobro + Informes — stack on mobile */}
            <div className="tesoreria-mid-grid mb-8">
                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <div className="flex items-center gap-md mb-6">
                        <div className="icon-btn" style={{ background: 'rgba(59, 130, 246, 0.15)', width: 44, height: 44 }}>
                            <CreditCard size={22} style={{ color: 'var(--accent-primary)' }} />
                        </div>
                        <h2 className="text-xl font-bold">Terminal de Cobro Rápido</h2>
                    </div>

                    <form onSubmit={handlePayment} className="flex-col gap-lg">
                        <div>
                            <label className="text-sm font-semibold text-secondary mb-3 block">Seleccionar Asociado Pendiente</label>
                            <select
                                className="input-glass"
                                style={{ padding: '0.875rem', fontSize: '1rem' }}
                                value={selectedSocio}
                                onChange={e => setSelectedSocio(e.target.value)}
                                required
                            >
                                <option value="">-- Buscar asociado... --</option>
                                {morosos.map(s => (
                                    <option key={s.id} value={s.id}>{s.nombre} - DNI: {s.dni} - Deuda: {formatCurrency(s.cuota)}</option>
                                ))}
                            </select>
                        </div>

                        {selectedSocio && (
                            <div className="p-4 rounded-lg animate-fade-in" style={{ background: 'var(--input-bg)', border: '1px solid var(--warning)', borderLeft: '4px solid var(--warning)' }}>
                                <div className="flex justify-between items-center mb-2" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
                                    <span className="text-sm text-warning font-semibold">Concepto: Cuota Mensual</span>
                                    <span className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                        {formatCurrency(morosos.find(s => s.id === selectedSocio)?.cuota || 0)}
                                    </span>
                                </div>
                                <p className="text-sm text-secondary">El pago impactará en tiempo real en los estados financieros del Dashboard.</p>
                            </div>
                        )}

                        <div>
                            <label className="text-sm font-semibold text-secondary mb-3 block">Método de Pago Autorizado</label>
                            <select className="input-glass" style={{ padding: '0.875rem', fontSize: '1rem' }} required>
                                <option>Efectivo (Caja Fuerte)</option>
                                <option>Tarjeta de Crédito / Débito (Posnet)</option>
                                <option>Transferencia Bancaria VEP</option>
                                <option>Mercado Pago / QR</option>
                            </select>
                        </div>

                        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem', padding: '1rem' }} disabled={!selectedSocio}>
                            <Receipt size={18} />
                            Procesar Pago e Imprimir Ticket
                        </button>
                    </form>
                </div>

                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                    <h3 className="text-xl font-bold mb-6 flex items-center gap-sm">
                        <FileText size={22} className="text-secondary" />
                        Generación de Informes
                    </h3>
                    <div className="grid grid-cols-2 grid-gap mb-6">
                        <button className="btn-secondary flex-col items-center gap-md" style={{ padding: '1.5rem' }}>
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '0.875rem', borderRadius: '50%' }}>
                                <CheckCircle2 size={28} className="text-success" />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold mb-1">Cierre de Caja Diario</div>
                                <div className="text-xs text-secondary">Exportar XLSX/PDF</div>
                            </div>
                        </button>
                        <button className="btn-secondary flex-col items-center gap-md" style={{ padding: '1.5rem' }}>
                            <div style={{ background: 'rgba(59, 130, 246, 0.1)', padding: '0.875rem', borderRadius: '50%' }}>
                                <TrendingUp size={28} style={{ color: 'var(--accent-primary)' }} />
                            </div>
                            <div className="text-center">
                                <div className="text-sm font-bold mb-1">Balance General</div>
                                <div className="text-xs text-secondary">Proyección de deuda</div>
                            </div>
                        </button>
                    </div>

                    <div className="p-4 rounded-lg" style={{ background: 'var(--input-bg)', border: '1px solid var(--glass-border)' }}>
                        <h4 className="font-semibold mb-4">Últimos Movimientos Extraordinarios</h4>
                        {transactions && transactions.length > 0 ? (
                            <div className="flex-col gap-sm">
                                {transactions.slice(0, 3).map(tx => (
                                    <div key={tx.id} className="flex justify-between items-center py-2 border-b border-glass last:border-0" style={{ flexWrap: 'wrap', gap: '0.25rem' }}>
                                        <div>
                                            <div className="text-sm font-semibold">{tx.description}</div>
                                            <div className="text-xs text-secondary">{tx.date}</div>
                                        </div>
                                        <div className={`font-bold ${tx.type === 'ingreso' ? 'text-success' : 'text-error'}`}>
                                            {tx.type === 'ingreso' ? '+' : '-'}{formatCurrency(tx.amount)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-secondary mb-4">Aún no hay transacciones registradas hoy.</p>
                        )}
                        <button className="text-sm font-medium mt-4" style={{ color: 'var(--accent-primary)' }}>Ver Historial Completo &rarr;</button>
                    </div>
                </div>
            </div>

            {/* Ingresos Extraordinarios */}
            <div className="glass-panel animate-fade-in" style={{ padding: '1.75rem' }}>
                <div className="flex items-center gap-md mb-6">
                    <div className="icon-btn" style={{ background: 'rgba(234, 179, 8, 0.15)', width: 44, height: 44 }}>
                        <Star size={22} className="text-warning" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold">Eventos, Rifas y Donaciones</h2>
                        <p className="text-secondary text-sm">Registrar ingresos no societarios a la tesorería general del club.</p>
                    </div>
                </div>
                <form onSubmit={handleEventoSubmit} className="tesoreria-form-grid">
                    <div>
                        <label className="text-sm font-semibold text-secondary mb-2 block">Categoría del Ingreso</label>
                        <select
                            className="input-glass w-full"
                            style={{ padding: '0.875rem' }}
                            value={eventoForm.nombre}
                            onChange={e => setEventoForm({ ...eventoForm, nombre: e.target.value })}
                            required
                        >
                            <option value="">Seleccionar Categoría...</option>
                            <option value="Rifa Pro-Techo">Rifa / Sorteo</option>
                            <option value="Torneo Relámpago">Inscripción a Torneo</option>
                            <option value="Buffet / Cantina">Recaudación Buffet</option>
                            <option value="Donación">Donación Voluntaria</option>
                            <option value="Subsidio">Subsidio Gubernamental</option>
                            <option value="Otro">Otro Ingreso</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-secondary mb-2 block">Detalles o Referencia (Opcional)</label>
                        <input
                            type="text"
                            className="input-glass w-full"
                            style={{ padding: '0.875rem' }}
                            placeholder="Ej: Venta bufet del domingo infantil"
                            value={eventoForm.descripcion}
                            onChange={e => setEventoForm({ ...eventoForm, descripcion: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="text-sm font-semibold text-secondary mb-2 block">Monto Total Recaudado ($)</label>
                        <input
                            type="number"
                            className="input-glass w-full text-success font-bold"
                            style={{ padding: '0.875rem', fontSize: '1.1rem' }}
                            placeholder="0.00"
                            required
                            min="1"
                            value={eventoForm.monto}
                            onChange={e => setEventoForm({ ...eventoForm, monto: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button type="submit" className="btn-primary w-full justify-center" style={{ padding: '0.875rem', fontSize: '1rem' }}>
                            <Star size={18} />
                            Ingresar Fondos al Tesoro
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function AlertSquare() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--warning)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
    );
}
