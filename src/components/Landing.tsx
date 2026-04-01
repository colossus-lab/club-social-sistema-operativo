'use client'

import { useState, useEffect } from 'react'
import { useClubStore } from '@/store/useClubStore'
import { ShieldCheck, Trophy, Users, ArrowRight, MapPin, CheckCircle2 } from 'lucide-react'

export default function Landing() {
  const { registerClub } = useClubStore()
  const [formData, setFormData] = useState({ name: '', location: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [isInitialLoading, setIsInitialLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => setIsInitialLoading(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  const loadingMessages = [
    'Inicializando Base de Datos Social...',
    'Cargando Módulos de Tesorería...',
    'Organizando Disciplinas Deportivas...',
    '¡Tu ecosistema está listo!',
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    let step = 0
    const interval = setInterval(() => {
      step += 1
      setLoadingStep(step)
      if (step >= loadingMessages.length - 1) {
        clearInterval(interval)
        setTimeout(() => {
          registerClub({
            name: formData.name || 'Club Social OS',
            location: formData.location || 'Argentina',
            foundation: new Date().getFullYear().toString(),
          })
        }, 1500)
      }
    }, 1200)
  }

  if (isInitialLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)', opacity: 0.8 }} />
        <div className="animate-fade-in" style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ position: 'relative', width: 200, height: 200, marginBottom: 32 }}>
            <div className="sports-loader">
              <div className="loader-core" style={{ width: 70, height: 70 }}>
                <svg viewBox="0 0 24 24" fill="none" className="core-icon" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ width: 36, height: 36 }}>
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="orbit-track track-1" style={{ width: 140, height: 140 }}>
                <div className="orbit-item item-1">
                  <svg viewBox="0 0 24 24" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="1.5" className="premium-sport-icon" style={{ width: 40, height: 40 }}><circle cx="12" cy="12" r="10" /><path d="M12 12l2.5-3.5L18 10l-1.5 4.5z" fill="var(--glass-border)" /><path d="M12 12l-2.5-3.5L6 10l1.5 4.5z" fill="var(--glass-border)" /></svg>
                </div>
              </div>
              <div className="orbit-track track-2" style={{ width: 200, height: 200 }}>
                <div className="orbit-item item-2">
                  <svg viewBox="0 0 24 24" fill="var(--bg-primary)" stroke="var(--warning)" strokeWidth="1.5" className="premium-sport-icon" style={{ width: 40, height: 40 }}><circle cx="12" cy="12" r="10" /><path d="M5.4 5.4l13.2 13.2" /><path d="M18.6 5.4L5.4 18.6" /></svg>
                </div>
              </div>
            </div>
          </div>
          <h1 className="text-3xl font-extrabold mb-3 text-center" style={{ background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Club Social OS
          </h1>
          <p className="text-sm font-medium text-secondary tracking-widest uppercase text-center">Optimizando terreno de juego...</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div style={{ position: 'fixed', inset: 0, zIndex: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-primary)' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, var(--bg-secondary) 0%, var(--bg-primary) 100%)', opacity: 0.8 }} />
        <div className="glass-panel animate-fade-in" style={{ position: 'relative', zIndex: 1, width: '90%', maxWidth: 480, padding: '3rem 2.5rem', textAlign: 'center' }}>
          <div style={{ position: 'relative', width: 140, height: 140, margin: '0 auto 2rem' }}>
            <div className="sports-loader">
              <div className="loader-core">
                <svg viewBox="0 0 24 24" fill="none" className="core-icon" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
              </div>
              <div className="orbit-track track-1"><div className="orbit-item item-1"><svg viewBox="0 0 24 24" fill="var(--bg-primary)" stroke="var(--accent-primary)" strokeWidth="1.5" className="premium-sport-icon"><circle cx="12" cy="12" r="10" /></svg></div></div>
              <div className="orbit-track track-2"><div className="orbit-item item-2"><svg viewBox="0 0 24 24" fill="var(--bg-primary)" stroke="var(--warning)" strokeWidth="1.5" className="premium-sport-icon"><circle cx="12" cy="12" r="10" /></svg></div></div>
            </div>
          </div>
          <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>
            {loadingStep === loadingMessages.length - 1
              ? <span style={{ color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><CheckCircle2 size={24} /> Completado</span>
              : 'Configurando tu Club...'}
          </h2>
          <p className="text-secondary mb-6" style={{ minHeight: 28 }}>{loadingMessages[loadingStep]}</p>
          <div style={{ width: '100%', height: 6, borderRadius: 3, background: 'var(--table-hover)', overflow: 'hidden' }}>
            <div style={{ height: '100%', background: 'var(--gradient-primary)', width: `${(loadingStep / (loadingMessages.length - 1)) * 100}%`, transition: 'width 1.2s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 10px var(--accent-primary)' }} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-root">
      <div className="landing-blob landing-blob-tr" />
      <div className="landing-blob landing-blob-bl" />

      <div className="landing-inner">
        <div className="landing-copy">
          <div className="landing-badge">
            <span>PROYECTO DE CÓDIGO ABIERTO</span>
          </div>

          <h1 className="landing-title">
            Gestión Premium<br />
            para <span style={{ color: 'var(--accent-primary)' }}>Clubes de Barrio.</span>
          </h1>

          <p className="landing-desc">
            Controla ingresos por cuotas, inscribe socios en disciplinas deportivas y administra finanzas sin costos ocultos.
          </p>

          <div className="landing-features">
            <div className="landing-feature">
              <ShieldCheck size={22} style={{ color: 'var(--success)', flexShrink: 0 }} />
              <div>
                <div className="font-bold mb-1">Finanzas Activas</div>
                <div className="text-sm text-secondary">Identifica deudores y lleva el control de tesorería.</div>
              </div>
            </div>
            <div className="landing-feature">
              <Trophy size={22} style={{ color: 'var(--accent-primary)', flexShrink: 0 }} />
              <div>
                <div className="font-bold mb-1">Evolución Deportiva</div>
                <div className="text-sm text-secondary">Organiza profesores y disciplinas deportivas.</div>
              </div>
            </div>
            <div className="landing-feature">
              <Users size={22} style={{ color: 'var(--warning)', flexShrink: 0 }} />
              <div>
                <div className="font-bold mb-1">Padrón Digital</div>
                <div className="text-sm text-secondary">Gestiona altas, bajas y categorías de socios.</div>
              </div>
            </div>
          </div>
        </div>

        <div className="landing-form-wrap">
          <div className="glass-panel landing-form-card">
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'var(--gradient-primary)', borderRadius: '12px 12px 0 0' }} />

            <h2 className="text-2xl font-bold mb-1">Setup Inicial</h2>
            <p className="text-secondary text-sm mb-6">Personalizá tu sistema en 30 segundos.</p>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Nombre del Club</label>
                <input
                  type="text"
                  name="name"
                  className="input-glass"
                  placeholder="Ej. Club Atlético San Martín"
                  style={{ height: '3.25rem', fontSize: '1rem' }}
                  value={formData.name}
                  onChange={e => setFormData(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">Ubicación</label>
                <div style={{ position: 'relative' }}>
                  <MapPin size={18} style={{ position: 'absolute', top: '50%', left: '1rem', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                  <input
                    type="text"
                    name="location"
                    className="input-glass"
                    placeholder="Ej. Buenos Aires, Argentina"
                    style={{ height: '3.25rem', fontSize: '1rem', paddingLeft: '3rem' }}
                    value={formData.location}
                    onChange={e => setFormData(p => ({ ...p, location: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', height: '3.25rem', fontSize: '1rem', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: 8 }}
              >
                Crear Entorno Virtual
                <ArrowRight size={18} />
              </button>
            </form>

            <p className="text-xs text-center text-muted mt-5">
              Datos locales y anónimos por diseño.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
