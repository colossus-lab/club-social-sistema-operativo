import { useState } from 'react';
import { useClubStore } from '../store/useClubStore';
import { ShieldCheck, MapPin, Building2, CheckCircle2 } from 'lucide-react';

export default function Landing() {
    const { registerClub } = useClubStore();
    const [formData, setFormData] = useState({ name: '', location: '', foundation: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [loadingStep, setLoadingStep] = useState(0);

    const loadingMessages = [
        'Inicializando Base de Datos Social...',
        'Cargando Módulos de Tesorería...',
        'Organizando Disciplinas Deportivas...',
        '¡Tu ecosistema está listo!'
    ];

    const handleSubmit = (e) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulated staggered loading steps
        let step = 0;
        const interval = setInterval(() => {
            step += 1;
            setLoadingStep(step);
            if (step >= loadingMessages.length - 1) {
                clearInterval(interval);
                setTimeout(() => {
                    registerClub({
                        name: formData.name || 'Club Social',
                        location: formData.location || 'Argentina',
                        foundation: formData.foundation || new Date().getFullYear().toString(),
                    });
                }, 1500); // Wait a bit on the final success message before transitioning
            }
        }, 1200);
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center w-full" style={{ minHeight: '100vh', background: 'var(--bg-primary)', position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 999 }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)', opacity: 0.8, zIndex: 0 }}></div>

                <div className="glass-panel text-center animate-fade-in flex flex-col items-center justify-center relative z-10" style={{ padding: '4rem', maxWidth: '600px', width: '90%' }}>

                    <div className="relative mb-16 mt-8" style={{ width: '160px', height: '160px' }}>
                        {/* Animating Sports Icons SVG Premium */}
                        <div className="sports-loader">
                            {/* Glowing Center Core */}
                            <div className="loader-core">
                                <svg viewBox="0 0 24 24" fill="none" className="core-icon text-white" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                                </svg>
                            </div>

                            {/* Premium Soccer Ball SVG Orbiting */}
                            <div className="orbit-track track-1">
                                <div className="orbit-item item-1">
                                    <svg viewBox="0 0 24 24" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="premium-sport-icon">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M12 12l2.5-3.5L18 10l-1.5 4.5z" fill="var(--glass-border)" />
                                        <path d="M12 12l-2.5-3.5L6 10l1.5 4.5z" fill="var(--glass-border)" />
                                        <path d="M12 12v5.5l-3.5 2" />
                                        <path d="M12 17.5l3.5 2" />
                                    </svg>
                                </div>
                            </div>

                            {/* Premium Basketball SVG Orbiting */}
                            <div className="orbit-track track-2">
                                <div className="orbit-item item-2">
                                    <svg viewBox="0 0 24 24" fill="var(--bg-primary)" stroke="var(--warning)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="premium-sport-icon">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M5.4 5.4l13.2 13.2" />
                                        <path d="M18.6 5.4L5.4 18.6" />
                                        <path d="M12 2A15.3 15.3 0 0112 22" />
                                        <path d="M2 12A15.3 15.3 0 0122 12" />
                                    </svg>
                                </div>
                            </div>

                            {/* Premium Tennis Ball SVG Orbiting */}
                            <div className="orbit-track track-3">
                                <div className="orbit-item item-3">
                                    <svg viewBox="0 0 24 24" fill="var(--success)" opacity="0.9" stroke="var(--bg-primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="premium-sport-icon">
                                        <circle cx="12" cy="12" r="10" />
                                        <path d="M6 12c0-3.3 2.7-6 6-6" strokeWidth="2" />
                                        <path d="M18 12c0 3.3-2.7 6-6 6" strokeWidth="2" />
                                        <path d="M12 2v20" stroke="transparent" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
                        {loadingStep === loadingMessages.length - 1 ? (
                            <span className="flex items-center justify-center gap-sm text-success">
                                <CheckCircle2 size={28} /> Completado
                            </span>
                        ) : 'Configurando tu Club...'}
                    </h2>
                    <p className="text-lg text-secondary transition-all" style={{ height: '28px' }}>
                        {loadingMessages[loadingStep]}
                    </p>

                    <div className="mt-10 relative w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--table-hover)' }}>
                        <div
                            style={{
                                position: 'absolute', top: 0, left: 0, height: '100%',
                                background: 'var(--gradient-primary)',
                                width: `${(loadingStep / (loadingMessages.length - 1)) * 100}%`,
                                transition: 'width 1.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 0 10px var(--accent-primary)'
                            }}>
                        </div>
                    </div>
                </div>

                <style>{`
          .sports-loader {
             position: relative;
             width: 100%;
             height: 100%;
             display: flex;
             align-items: center;
             justify-content: center;
          }
          .loader-core {
             width: 56px; height: 56px;
             border-radius: 50%;
             background: var(--gradient-primary);
             box-shadow: 0 0 30px var(--accent-primary);
             display: flex;
             align-items: center;
             justify-content: center;
             z-index: 10;
             animation: core-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          }
          .core-icon {
             width: 28px; height: 28px;
             animation: spin-slow 10s linear infinite;
          }
          .premium-sport-icon {
             width: 36px; height: 36px;
             filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2));
             border-radius: 50%;
             background: var(--glass-bg);
          }
          
          /* Orbital Mechanics */
          .orbit-track {
             position: absolute;
             top: 50%; left: 50%;
             border-radius: 50%;
             border: 1px dashed var(--glass-border);
             transform: translate(-50%, -50%);
          }
          .track-1 { width: 110px; height: 110px; animation: spin 4s linear infinite; }
          .track-2 { width: 160px; height: 160px; animation: spin-reverse 5s linear infinite; border-color: rgba(245, 158, 11, 0.2); }
          .track-3 { width: 220px; height: 220px; animation: spin 7s linear infinite; border-color: rgba(16, 185, 129, 0.2); }

          .orbit-item {
             position: absolute;
             top: -18px; left: 50%;
             margin-left: -18px;
          }
          .item-1 { animation: spin-reverse 4s linear infinite; }
          .item-2 { animation: spin 5s linear infinite; }
          .item-3 { animation: spin-reverse 7s linear infinite; }
          
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes spin-reverse { 100% { transform: rotate(-360deg); } }
          @keyframes spin-slow { 100% { transform: rotate(360deg); } }
          @keyframes core-pulse { 0%, 100% { transform: scale(1); box-shadow: 0 0 20px var(--accent-primary); } 50% { transform: scale(1.1); box-shadow: 0 0 40px var(--accent-primary); } }
        `}</style>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen w-full relative overflow-hidden" style={{ background: 'var(--bg-primary)' }}>
            {/* Background Graphic Elements */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'var(--gradient-bg)', opacity: 0.8, zIndex: 0 }}></div>
            <div style={{ position: 'absolute', top: '-10%', right: '-10%', width: '50vw', height: '50vw', borderRadius: '50%', background: 'var(--accent-primary)', filter: 'blur(120px)', opacity: 0.15, zIndex: 0 }}></div>
            <div style={{ position: 'absolute', bottom: '-10%', left: '-10%', width: '40vw', height: '40vw', borderRadius: '50%', background: 'var(--accent-secondary)', filter: 'blur(120px)', opacity: 0.15, zIndex: 0 }}></div>

            <div className="flex w-full relative z-10 p-10 gap-xl items-center justify-center max-w-[1600px] mx-auto">

                {/* Left Side: Copywriting & Value Prop */}
                <div className="flex-col justify-center max-w-lg" style={{ flex: 1 }}>
                    <div className="mb-6 inline-flex px-4 py-2 rounded-full border border-glass" style={{ background: 'var(--glass-bg)' }}>
                        <span className="text-sm font-bold text-transparent bg-clip-text" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text' }}>
                            PROYECTO SOCIAL DE CÓDIGO ABIERTO
                        </span>
                    </div>
                    <h1 className="text-5xl font-extrabold mb-6 leading-tight">
                        Gestión Premium para <br /><span style={{ color: 'var(--accent-primary)' }}>Clubes de Barrio.</span>
                    </h1>
                    <p className="text-xl text-secondary mb-10 leading-relaxed">
                        Potencia la organización de tu club. Controla ingresos por cuotas, inscribe socios en disciplinas deportivas y administra las finanzas sin costos ocultos.
                    </p>

                    <div className="grid grid-cols-2 gap-md">
                        <div className="glass-panel p-6">
                            <ShieldCheck size={32} className="text-success mb-4" />
                            <h3 className="font-bold text-lg mb-2">Finanzas Activas</h3>
                            <p className="text-sm text-secondary">Identifica deudores de cuotas y lleva el control de tesorería al instante.</p>
                        </div>
                        <div className="glass-panel p-6">
                            <Building2 size={32} className="text-accent-primary mb-4" />
                            <h3 className="font-bold text-lg mb-2">Evolución Deportiva</h3>
                            <p className="text-sm text-secondary">Digitaliza el padrón de socios y organiza a tus profesores.</p>
                        </div>
                    </div>
                </div>

                {/* Right Side: Setup Form */}
                <div className="flex-col items-center justify-center" style={{ flex: 1 }}>
                    <div className="glass-panel shadow-lg w-full max-w-md p-10 relative overflow-hidden">
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', background: 'var(--gradient-primary)' }}></div>

                        <h2 className="text-3xl font-bold mb-2">Setup Inicial</h2>
                        <p className="text-sm text-secondary mb-8">Personaliza tu propio Sistema Operativo en segundos.</p>

                        <form onSubmit={handleSubmit} className="flex-col gap-lg">
                            <div>
                                <label className="block text-sm font-semibold mb-2 text-secondary">Nombre de la Institución</label>
                                <input
                                    type="text"
                                    name="name"
                                    className="input-glass"
                                    placeholder="Ej. Club Atlético San Martín"
                                    style={{ height: '3.5rem', fontSize: '1.1rem' }}
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold mb-2 text-secondary">Ubicación / Ciudad</label>
                                <div className="relative">
                                    <MapPin size={20} className="text-muted absolute" style={{ top: '50%', transform: 'translateY(-50%)', left: '1rem' }} />
                                    <input
                                        type="text"
                                        name="location"
                                        className="input-glass"
                                        placeholder="Ej. Buenos Aires, Argentina"
                                        style={{ height: '3.5rem', fontSize: '1.1rem', paddingLeft: '3rem' }}
                                        value={formData.location}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <button type="submit" className="btn-primary w-full justify-center mt-4" style={{ height: '3.5rem', fontSize: '1.1rem' }}>
                                Crear Entorno Virtual
                            </button>
                        </form>

                        <p className="text-xs text-center text-muted mt-6">
                            Todos los datos sensibles se mantienen anonimizados y locales por diseño.
                        </p>
                    </div>
                </div>

            </div>
        </div>
    );
}
