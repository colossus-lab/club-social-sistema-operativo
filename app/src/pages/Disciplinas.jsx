import { useState } from 'react';
import { useClubStore } from '../store/useClubStore';
import { Trophy, Clock, Users, UserPlus, Search, CheckCircle2 } from 'lucide-react';

export default function Disciplinas() {
    const { disciplinas, socios, inscribirSocioADisciplina } = useClubStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedDisciplina, setSelectedDisciplina] = useState(null);
    const [socioSearchTerm, setSocioSearchTerm] = useState('');
    const [showInscripcionModal, setShowInscripcionModal] = useState(false);

    const filteredDisciplinas = disciplinas.filter(d =>
        d.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.profesor.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenInscripcion = (disciplina) => {
        setSelectedDisciplina(disciplina);
        setShowInscripcionModal(true);
        setSocioSearchTerm('');
    };

    const currentInscriptosIds = selectedDisciplina ? selectedDisciplina.inscriptos : [];
    const availableSocios = socios.filter(s =>
        !currentInscriptosIds.includes(s.id) &&
        (s.nombre.toLowerCase().includes(socioSearchTerm.toLowerCase()) || s.dni.includes(socioSearchTerm))
    );

    const handleInscribir = (socioId) => {
        if (selectedDisciplina) {
            inscribirSocioADisciplina(socioId, selectedDisciplina.id);
            setSelectedDisciplina({
                ...selectedDisciplina,
                inscriptos: [...selectedDisciplina.inscriptos, socioId]
            });
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header">
                <h1 className="page-title">Disciplinas Deportivas</h1>
                <p className="text-secondary dashboard-subtitle mt-2">Organización de clases, profesores y asistencias.</p>
            </header>

            {/* Search bar — full width, no min-width */}
            <div className="glass-panel p-4 mb-8">
                <div className="input-group" style={{ width: '100%' }}>
                    <Search className="input-icon" size={18} />
                    <input
                        type="text"
                        className="input-field"
                        placeholder="Buscar deporte o profesor..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Disciplinas grid — 1 col mobile, 2 tablet, 3 desktop */}
            <div className="disciplinas-grid">
                {filteredDisciplinas.map(disciplina => {
                    const ocupacion = Math.round((disciplina.inscriptos.length / disciplina.cupoMaximo) * 100);
                    const estaLleno = ocupacion >= 100;

                    return (
                        <div key={disciplina.id} className="glass-panel p-5" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="icon-btn" style={{ background: 'rgba(59,130,246,0.1)' }}>
                                    <Trophy size={22} style={{ color: 'var(--accent-primary)' }} />
                                </div>
                                {estaLleno ? (
                                    <span className="badge badge-error">Cupo Lleno</span>
                                ) : (
                                    <span className="badge badge-success">Con Vacantes</span>
                                )}
                            </div>

                            <h3 className="text-lg font-bold mb-1">{disciplina.nombre}</h3>
                            <p className="text-secondary mb-4">Prof. {disciplina.profesor}</p>

                            <div className="flex-col gap-sm mb-5" style={{ flex: 1 }}>
                                <div className="flex items-center gap-sm text-sm text-secondary">
                                    <Clock size={15} />
                                    <span>{disciplina.horario}</span>
                                </div>
                                <div className="flex items-center gap-sm text-sm text-secondary">
                                    <Users size={15} />
                                    <span>{disciplina.inscriptos.length} / {disciplina.cupoMaximo} Inscriptos</span>
                                </div>

                                <div style={{ marginTop: '0.5rem' }}>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Ocupación</span>
                                        <span>{ocupacion}%</span>
                                    </div>
                                    <div style={{ width: '100%', height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                                        <div
                                            style={{
                                                height: '100%',
                                                width: `${ocupacion}%`,
                                                background: estaLleno ? 'var(--error-color)' : 'var(--accent-primary)',
                                                transition: 'width 0.5s ease-out'
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <button
                                className="btn btn-primary w-full flex items-center justify-center gap-sm"
                                onClick={() => handleOpenInscripcion(disciplina)}
                                style={{ touchAction: 'manipulation' }}
                            >
                                <UserPlus size={16} />
                                Inscripciones
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Inscripcion Modal — mobile friendly */}
            {showInscripcionModal && selectedDisciplina && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel w-full" style={{ maxHeight: '90vh', display: 'flex', flexDirection: 'column', borderBottomLeftRadius: 0, borderBottomRightRadius: 0, borderRadius: '1.5rem 1.5rem 0 0' }}>
                        {/* Drag handle visual cue */}
                        <div style={{ width: 40, height: 4, background: 'var(--glass-border)', borderRadius: 2, margin: '12px auto 0' }}></div>

                        <div className="p-5 border-b border-glass flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold">{selectedDisciplina.nombre}</h2>
                                <p className="text-secondary text-sm">Inscripción de Socios</p>
                            </div>
                            <button className="icon-btn" onClick={() => setShowInscripcionModal(false)} style={{ border: 'none', background: 'transparent' }}>
                                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-5" style={{ overflowY: 'auto', flex: 1 }}>
                            <div className="input-group mb-5">
                                <Search className="input-icon" size={18} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Buscar por Nombre o DNI..."
                                    value={socioSearchTerm}
                                    onChange={(e) => setSocioSearchTerm(e.target.value)}
                                />
                            </div>

                            {selectedDisciplina.inscriptos.length >= selectedDisciplina.cupoMaximo ? (
                                <div className="p-4 rounded-xl mb-4 text-center" style={{ background: 'rgba(239,68,68,0.1)', color: 'var(--error)' }}>
                                    Cupo Lleno. No es posible inscribir más socios.
                                </div>
                            ) : (
                                <div className="flex-col gap-sm">
                                    <h4 className="text-sm font-semibold text-secondary mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Socios Disponibles</h4>
                                    {availableSocios.slice(0, 5).map(socio => (
                                        <div key={socio.id} className="flex items-center justify-between p-3 rounded-lg border border-glass" style={{ background: 'var(--bg-secondary)', gap: '0.75rem' }}>
                                            <div className="flex items-center gap-md" style={{ overflow: 'hidden' }}>
                                                <div className="avatar" style={{ background: 'var(--primary-color)', flexShrink: 0 }}>{socio.avatar}</div>
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div className="font-bold" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{socio.nombre}</div>
                                                    <div className="text-xs text-secondary">DNI: {socio.dni} • {socio.categoria}</div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-outline flex items-center gap-sm"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem', flexShrink: 0, touchAction: 'manipulation' }}
                                                onClick={() => handleInscribir(socio.id)}
                                            >
                                                <UserPlus size={15} />
                                                Anotar
                                            </button>
                                        </div>
                                    ))}
                                    {availableSocios.length === 0 && <div className="text-center text-muted p-4">No se encontraron socios disponibles.</div>}
                                    {availableSocios.length > 5 && <div className="text-center text-xs text-secondary italic">Mostrando 5 de {availableSocios.length}. Refiná la búsqueda.</div>}
                                </div>
                            )}

                            <div className="mt-6">
                                <h4 className="text-sm font-semibold text-secondary mb-3" style={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ya Inscriptos ({selectedDisciplina.inscriptos.length})</h4>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {selectedDisciplina.inscriptos.map(socioId => {
                                        const socio = socios.find(s => s.id === socioId);
                                        if (!socio) return null;
                                        return (
                                            <div key={socio.id} className="flex items-center gap-2 px-3 py-1 rounded-full border border-glass text-sm" style={{ background: 'var(--bg-primary)' }}>
                                                <CheckCircle2 size={13} className="text-success" />
                                                {socio.nombre}
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
