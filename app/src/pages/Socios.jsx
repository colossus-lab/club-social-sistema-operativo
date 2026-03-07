import { useState } from 'react';
import { useClubStore } from '../store/useClubStore';
import { Search, UserPlus, FileEdit, UserCheck, UserMinus, MoreVertical, Mail, MessageCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

export default function Socios() {
    const { socios, addSocio, memberGrowth, theme, updateCategoriaSocio } = useClubStore();
    const [searchTerm, setSearchTerm] = useState('');

    const isLight = theme === 'light-theme';
    const chartColors = {
        grid: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.05)',
        text: isLight ? '#64748b' : '#94a3b8',
        tooltipBg: isLight ? '#ffffff' : '#1e293b',
        tooltipBorder: isLight ? '#e2e8f0' : '#334155',
    };

    const filteredSocios = socios.filter(s =>
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.dni.includes(searchTerm) ||
        s.id.includes(searchTerm)
    );

    return (
        <div className="page-container" style={{ paddingBottom: '4rem' }}>
            <div className="page-header flex justify-between items-center mb-10">
                <div>
                    <h1 className="page-title">Gestión Societaria</h1>
                    <p className="text-secondary mt-2 text-lg">Directorio societario, altas y administración del ciclo de vida.</p>
                </div>
                <button className="btn-primary" onClick={() => {
                    const nombre = prompt('Nombre completo del nuevo socio:');
                    const dni = prompt('DNI:');
                    if (nombre && dni) addSocio({ nombre, dni, categoria: 'Activo', cuota: 5000 });
                }}>
                    <UserPlus size={18} />
                    <span>Alta de Socio</span>
                </button>
            </div>

            <div className="grid grid-cols-3 grid-gap mb-10">
                <div className="glass-panel" style={{ padding: '2rem', gridColumn: 'span 2' }}>
                    <h3 className="text-xl font-bold mb-6">Crecimiento Histórico de Masa Societaria</h3>
                    <div style={{ height: '300px', width: '100%' }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={memberGrowth} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartColors.grid} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: chartColors.text, fontSize: 12 }} dx={-10} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: chartColors.tooltipBg, border: `1px solid ${chartColors.tooltipBorder}`, borderRadius: 'var(--radius-md)', color: 'var(--text-primary)' }}
                                    itemStyle={{ fontWeight: 600 }}
                                />
                                <Legend verticalAlign="top" height={36} iconType="circle" />
                                <Line type="monotone" dataKey="activos" name="Activos" stroke="var(--accent-primary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                                <Line type="monotone" dataKey="vitalicios" name="Vitalicios" stroke="var(--accent-secondary)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                                <Line type="monotone" dataKey="cadetes" name="Cadetes/Inf. " stroke="var(--warning)" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="flex-col gap-lg">
                    <div className="glass-panel" style={{ padding: '2rem', flex: 1 }}>
                        <h3 className="text-lg font-bold mb-4">Acciones Rápidas</h3>
                        <div className="flex-col gap-sm">
                            <button className="btn-secondary w-full justify-start p-4 mb-2">
                                <Mail size={18} className="text-primary mr-2" />
                                Enviar Comunicado Masivo
                            </button>
                            <button className="btn-secondary w-full justify-start p-4">
                                <UserMinus size={18} className="text-warning mr-2" />
                                Gestionar Bajas y Licencias
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="glass-panel mb-8 p-6">
                <div className="flex items-center gap-md">
                    <div className="flex items-center" style={{ flex: 1, position: 'relative' }}>
                        <Search size={20} className="text-muted" style={{ position: 'absolute', left: '1.5rem' }} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre, DNI o número de asociado..."
                            className="input-glass"
                            style={{ paddingLeft: '4rem', paddingRight: '1rem', height: '3.5rem', fontSize: '1.1rem' }}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select className="input-glass" style={{ width: '220px', height: '3.5rem' }}>
                        <option>Todas las categorías</option>
                        <option>Activo</option>
                        <option>Vitalicio</option>
                        <option>Cadete</option>
                        <option>Becado</option>
                    </select>
                    <select className="input-glass" style={{ width: '220px', height: '3.5rem' }}>
                        <option>Cualquier estado</option>
                        <option>Al día</option>
                        <option>Moroso</option>
                    </select>
                </div>
            </div>

            <div className="glass-panel table-responsive">
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '800px' }}>
                    <thead>
                        <tr style={{ background: 'var(--table-hover)', borderBottom: '1px solid var(--glass-border)' }}>
                            <th style={{ padding: '1.25rem 2rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Socio</th>
                            <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>DNI</th>
                            <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Nº Socio</th>
                            <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Categoría</th>
                            <th style={{ padding: '1.25rem 1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>Estado</th>
                            <th style={{ padding: '1.25rem 2rem', textAlign: 'right', fontWeight: 600, color: 'var(--text-secondary)' }}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredSocios.map((socio, idx) => (
                            <tr key={socio.id} style={{ borderBottom: idx !== filteredSocios.length - 1 ? '1px solid var(--glass-border)' : 'none', transition: 'background 0.2s' }} className="hover-table-row">
                                <td style={{ padding: '1.25rem 2rem' }}>
                                    <div className="flex items-center gap-md">
                                        <div className="user-avatar" style={{ width: 44, height: 44, fontSize: '1rem', background: 'var(--gradient-primary)' }}>{socio.avatar}</div>
                                        <div>
                                            <div className="font-bold text-base">{socio.nombre}</div>
                                            <div className="text-xs text-muted">Ingreso: Oct 2021</div>
                                        </div>
                                    </div>
                                </td>
                                <td style={{ padding: '1.25rem 1rem' }} className="font-medium">{socio.dni}</td>
                                <td style={{ padding: '1.25rem 1rem' }} className="font-medium">#{socio.id}</td>
                                <td style={{ padding: '1.25rem 1rem' }}>
                                    <span
                                        className="badge"
                                        style={{
                                            background: socio.categoria === 'Becado' ? 'var(--accent-primary-10)' : 'var(--table-hover)',
                                            color: socio.categoria === 'Becado' ? 'var(--accent-primary)' : 'var(--text-primary)',
                                            border: socio.categoria === 'Becado' ? '1px solid var(--accent-primary)' : 'none'
                                        }}
                                    >
                                        {socio.categoria}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 1rem' }}>
                                    <span className={`badge ${socio.estado === 'Al día' ? 'badge-success' : 'badge-error'}`} style={{ padding: '0.5rem 1rem' }}>
                                        {socio.estado}
                                    </span>
                                </td>
                                <td style={{ padding: '1.25rem 2rem', textAlign: 'right' }}>
                                    <div className="flex justify-end gap-sm">
                                        <button
                                            className="icon-btn"
                                            title="Cambiar Categoría (Ciclar)"
                                            onClick={() => {
                                                const cats = ['Activo', 'Vitalicio', 'Cadete', 'Becado'];
                                                const nextCat = cats[(cats.indexOf(socio.categoria) + 1) % cats.length];
                                                updateCategoriaSocio(socio.id, nextCat);
                                            }}
                                        >
                                            <FileEdit size={18} />
                                        </button>
                                        {socio.estado === 'Al día' ? (
                                            <button className="icon-btn text-success" title="Socio al día"><UserCheck size={18} /></button>
                                        ) : (
                                            <button className="icon-btn text-error" title="Socio moroso"><UserMinus size={18} /></button>
                                        )}
                                        {socio.telefono && (
                                            <button
                                                className="icon-btn text-success"
                                                title="Contactar por WhatsApp"
                                                onClick={() => window.open(`https://wa.me/549${socio.telefono}?text=Hola%20${socio.nombre},%20nos%20comunicamos%20del%20Club%20Social.`)}
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                        <button className="icon-btn" title="Opciones"><MoreVertical size={18} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filteredSocios.length === 0 && (
                            <tr>
                                <td colSpan="6" style={{ padding: '4rem', textAlign: 'center' }} className="text-muted text-lg">
                                    No se encontraron socios con esos criterios de búsqueda.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
