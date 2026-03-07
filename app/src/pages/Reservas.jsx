import { useState } from 'react';
import { useClubStore } from '../store/useClubStore';
import { CalendarDays, Plus, Clock, CheckCircle2, DollarSign, MapPin } from 'lucide-react';

export default function Reservas() {
    const { recursos, reservas, registrarReserva, pagarSena } = useClubStore();
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        recursoId: '',
        reservadoPor: '',
        fecha: '',
        hora: '',
        señaPagada: ''
    });

    const getRecursoNombre = (id) => {
        const r = recursos.find(rec => rec.id === id);
        return r ? r.nombre : 'Recurso Desconocido';
    };

    const handleCreateReserva = (e) => {
        e.preventDefault();
        if (formData.recursoId && formData.fecha && formData.hora && formData.reservadoPor) {
            registrarReserva({
                ...formData,
                señaPagada: Number(formData.señaPagada) || 0
            });
            setShowModal(false);
            setFormData({ recursoId: '', reservadoPor: '', fecha: '', hora: '', señaPagada: '' });
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Reservas y Alquileres</h1>
                    <p className="text-secondary text-lg mt-2">Gestión de quinchos, canchas y salones.</p>
                </div>
                <button className="btn btn-primary flex items-center gap-sm" onClick={() => setShowModal(true)}>
                    <Plus size={20} />
                    <span>Nueva Reserva</span>
                </button>
            </header>

            {/* Stats/Summary Row */}
            <div className="grid grid-cols-1 md-grid-cols-2 gap-xl mb-8">
                {recursos.map(rec => (
                    <div key={rec.id} className="glass-panel p-6 flex items-center justify-between">
                        <div className="flex items-center gap-md">
                            <div className="icon-container bg-primary-10">
                                <MapPin size={24} className="text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg">{rec.nombre}</h3>
                                <p className="text-sm text-secondary">{rec.tipo} • ${rec.precioHora}/hr</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="glass-panel p-6">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-sm">
                    <CalendarDays size={20} className="text-primary" />
                    Agenda de Reservas
                </h2>

                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Recurso</th>
                                <th>Reservado Por</th>
                                <th>Fecha y Hora</th>
                                <th>Estado</th>
                                <th>Seña Pagada</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {reservas.map(res => (
                                <tr key={res.id}>
                                    <td>
                                        <span className="font-semibold">{getRecursoNombre(res.recursoId)}</span>
                                    </td>
                                    <td>{res.reservadoPor}</td>
                                    <td>
                                        <div className="flex items-center gap-sm">
                                            <CalendarDays size={14} className="text-secondary" />
                                            <span>{res.fecha}</span>
                                            <span className="text-secondary">|</span>
                                            <Clock size={14} className="text-secondary" />
                                            <span>{res.hora} hs</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`badge ${res.estado === 'Confirmada' ? 'badge-success' : 'badge-warning'}`}>
                                            {res.estado === 'Confirmada' ? <CheckCircle2 size={14} /> : <Clock size={14} />}
                                            {res.estado}
                                        </span>
                                    </td>
                                    <td className="font-mono text-success">
                                        ${res.señaPagada.toLocaleString()}
                                    </td>
                                    <td>
                                        {res.estado === 'Pendiente Seña' && (
                                            <button
                                                className="btn btn-outline flex items-center gap-1 text-xs"
                                                style={{ padding: '0.25rem 0.5rem' }}
                                                onClick={() => pagarSena(res.id, 5000)}
                                            >
                                                <DollarSign size={14} />
                                                Reg. Seña ($5000)
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {reservas.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="text-center text-muted py-8">No hay reservas registradas.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel w-full" style={{ maxWidth: '500px' }}>
                        <div className="p-6 border-b border-glass flex items-center justify-between">
                            <h2 className="text-2xl font-bold">Nueva Reserva</h2>
                            <button className="icon-btn" onClick={() => setShowModal(false)} style={{ border: 'none', background: 'transparent' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <form onSubmit={handleCreateReserva} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-1">Recurso/Espacio</label>
                                <select
                                    className="input-field w-full"
                                    required
                                    value={formData.recursoId}
                                    onChange={(e) => setFormData({ ...formData, recursoId: e.target.value })}
                                    style={{ background: 'var(--bg-secondary)' }}
                                >
                                    <option value="">Seleccione un espacio...</option>
                                    {recursos.map(r => (
                                        <option key={r.id} value={r.id}>{r.nombre} (${r.precioHora}/hr)</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Responsable (Socio o Externo)</label>
                                <input
                                    type="text"
                                    className="input-field w-full"
                                    placeholder="Ej: Marcelo Gallardo (Socio 1002)"
                                    required
                                    value={formData.reservadoPor}
                                    onChange={(e) => setFormData({ ...formData, reservadoPor: e.target.value })}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Fecha</label>
                                    <input
                                        type="date"
                                        className="input-field w-full"
                                        required
                                        value={formData.fecha}
                                        onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Hora Inicio</label>
                                    <input
                                        type="time"
                                        className="input-field w-full"
                                        required
                                        value={formData.hora}
                                        onChange={(e) => setFormData({ ...formData, hora: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-1">Seña Adelantada ($)</label>
                                <input
                                    type="number"
                                    className="input-field w-full"
                                    placeholder="Monto de la seña (Opcional)"
                                    value={formData.señaPagada}
                                    onChange={(e) => setFormData({ ...formData, señaPagada: e.target.value })}
                                />
                                <p className="text-xs text-secondary mt-1">Si no se deja seña, la reserva quedará "Pendiente".</p>
                            </div>

                            <div className="pt-4 flex gap-4">
                                <button type="button" className="btn btn-outline flex-1" onClick={() => setShowModal(false)}>Cancelar</button>
                                <button type="submit" className="btn btn-primary flex-1">Confirmar Reserva</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
