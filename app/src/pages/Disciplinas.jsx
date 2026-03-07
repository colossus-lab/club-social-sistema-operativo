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
            // Update local modal state immediately for UX
            setSelectedDisciplina({
                ...selectedDisciplina,
                inscriptos: [...selectedDisciplina.inscriptos, socioId]
            });
        }
    };

    return (
        <div className="page-container animate-fade-in">
            <header className="page-header flex items-center justify-between">
                <div>
                    <h1 className="page-title">Disciplinas Deportivas</h1>
                    <p className="text-secondary text-lg mt-2">Organización de clases, profesores y asistencias.</p>
                </div>
            </header>

            <div className="glass-panel p-6 mb-8">
                <div className="flex gap-md" style={{ flexWrap: 'wrap' }}>
                    <div className="input-group" style={{ flex: 1, minWidth: '300px' }}>
                        <Search className="input-icon" size={20} />
                        <input
                            type="text"
                            className="input-field"
                            placeholder="Buscar deporte o profesor..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md-grid-cols-2 lg-grid-cols-3 gap-xl">
                {filteredDisciplinas.map(disciplina => {
                    const ocupacion = Math.round((disciplina.inscriptos.length / disciplina.cupoMaximo) * 100);
                    const estaLleno = ocupacion >= 100;

                    return (
                        <div key={disciplina.id} className="glass-panel p-6" style={{ display: 'flex', flexDirection: 'column' }}>
                            <div className="flex items-center justify-between mb-4">
                                <div className="icon-container bg-primary-10">
                                    <Trophy size={24} className="text-primary" />
                                </div>
                                {estaLleno ? (
                                    <span className="badge badge-error">Cupo Lleno</span>
                                ) : (
                                    <span className="badge badge-success">Con Vacantes</span>
                                )}
                            </div>

                            <h3 className="text-xl font-bold mb-1">{disciplina.nombre}</h3>
                            <p className="text-secondary mb-6 line-clamp-2">Prof. {disciplina.profesor}</p>

                            <div className="space-y-4 mb-6" style={{ flex: 1 }}>
                                <div className="flex items-center gap-sm text-sm text-secondary">
                                    <Clock size={16} />
                                    <span>{disciplina.horario}</span>
                                </div>
                                <div className="flex items-center gap-sm text-sm text-secondary">
                                    <Users size={16} />
                                    <span>{disciplina.inscriptos.length} / {disciplina.cupoMaximo} Inscriptos</span>
                                </div>

                                {/* Progress bar cupo */}
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
                            >
                                <UserPlus size={18} />
                                Inscripciones
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Inscripcion Modal Overlay (Simplified manually with CSS) */}
            {showInscripcionModal && selectedDisciplina && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
                    <div className="glass-panel w-full" style={{ maxWidth: '600px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
                        <div className="p-6 border-b border-glass flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-bold">{selectedDisciplina.nombre}</h2>
                                <p className="text-secondary">Inscripción de Socios</p>
                            </div>
                            <button className="icon-btn" onClick={() => setShowInscripcionModal(false)} style={{ border: 'none', background: 'transparent' }}>
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                            </button>
                        </div>

                        <div className="p-6 flex-col" style={{ overflowY: 'auto', flex: 1 }}>
                            <div className="input-group mb-6">
                                <Search className="input-icon" size={20} />
                                <input
                                    type="text"
                                    className="input-field"
                                    placeholder="Buscar por Nombre o DNI a inscribir..."
                                    value={socioSearchTerm}
                                    onChange={(e) => setSocioSearchTerm(e.target.value)}
                                />
                            </div>

                            {selectedDisciplina.inscriptos.length >= selectedDisciplina.cupoMaximo ? (
                                <div className="p-4 bg-error-10 text-error rounded-xl mb-4 text-center">
                                    Cupo Lleno. No es posible inscribir más socios.
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Socios Disponibles</h4>
                                    {availableSocios.slice(0, 5).map(socio => (
                                        <div key={socio.id} className="flex items-center justify-between p-3 rounded-lg border border-glass" style={{ background: 'var(--bg-secondary)' }}>
                                            <div className="flex items-center gap-md">
                                                <div className="avatar" style={{ background: 'var(--primary-color)' }}>{socio.avatar}</div>
                                                <div>
                                                    <div className="font-bold">{socio.nombre}</div>
                                                    <div className="text-xs text-secondary">DNI: {socio.dni} • {socio.categoria}</div>
                                                </div>
                                            </div>
                                            <button
                                                className="btn btn-outline flex items-center gap-sm"
                                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.875rem' }}
                                                onClick={() => handleInscribir(socio.id)}
                                            >
                                                <UserPlus size={16} />
                                                Anotar
                                            </button>
                                        </div>
                                    ))}
                                    {availableSocios.length === 0 && <div className="text-center text-muted p-4">No se encontraron socios disponibles.</div>}
                                    {availableSocios.length > 5 && <div className="text-center text-xs text-secondary italic">Mostrando 5 de {availableSocios.length} socios. Refiná la búsqueda.</div>}
                                </div>
                            )}

                            <div className="mt-8">
                                <h4 className="text-sm font-semibold text-secondary uppercase tracking-wider mb-2">Ya Inscriptos ({selectedDisciplina.inscriptos.length})</h4>
                                <div className="flex gap-2" style={{ flexWrap: 'wrap' }}>
                                    {selectedDisciplina.inscriptos.map(socioId => {
                                        const socio = socios.find(s => s.id === socioId);
                                        if (!socio) return null;
                                        return (
                                            <div key={socio.id} className="flex items-center gap-2 px-3 py-1 rounded-full border border-glass text-sm" style={{ background: 'var(--bg-primary)' }}>
                                                <CheckCircle2 size={14} className="text-success" />
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
