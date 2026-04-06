'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { 
  Building2, 
  MapPin, 
  Phone, 
  ArrowRight, 
  ArrowLeft, 
  CheckCircle2, 
  Loader2,
  Mail,
  Globe,
  FileText,
  Calendar
} from 'lucide-react'

interface ClubFormData {
  // Paso 1: Datos Básicos
  nombre: string
  nombre_corto: string
  fecha_fundacion: string
  // Paso 2: Ubicación
  direccion: string
  ciudad: string
  provincia: string
  codigo_postal: string
  // Paso 3: Contacto
  telefono: string
  email: string
  sitio_web: string
}

const initialFormData: ClubFormData = {
  nombre: '',
  nombre_corto: '',
  fecha_fundacion: '',
  direccion: '',
  ciudad: '',
  provincia: '',
  codigo_postal: '',
  telefono: '',
  email: '',
  sitio_web: '',
}

const provinciasArgentinas = [
  'Buenos Aires',
  'CABA',
  'Catamarca',
  'Chaco',
  'Chubut',
  'Córdoba',
  'Corrientes',
  'Entre Ríos',
  'Formosa',
  'Jujuy',
  'La Pampa',
  'La Rioja',
  'Mendoza',
  'Misiones',
  'Neuquén',
  'Río Negro',
  'Salta',
  'San Juan',
  'San Luis',
  'Santa Cruz',
  'Santa Fe',
  'Santiago del Estero',
  'Tierra del Fuego',
  'Tucumán',
]

export default function ClubSetupWizard({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<ClubFormData>(initialFormData)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { user, refreshProfile } = useAuth()

  const updateField = (field: keyof ClubFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setError(null)
  }

  const validateStep = (currentStep: number): boolean => {
    switch (currentStep) {
      case 1:
        if (!formData.nombre.trim()) {
          setError('El nombre del club es obligatorio')
          return false
        }
        return true
      case 2:
        if (!formData.direccion.trim() || !formData.ciudad.trim() || !formData.provincia) {
          setError('Completá dirección, ciudad y provincia')
          return false
        }
        return true
      case 3:
        return true // Contacto es opcional
      default:
        return true
    }
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(prev => Math.min(prev + 1, 3))
    }
  }

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1))
    setError(null)
  }

  const handleSubmit = async () => {
    if (!user) {
      setError('No hay usuario autenticado')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      // 1. Crear el club
      const { data: club, error: clubError } = await supabase
        .from('clubs')
        .insert({
          nombre: formData.nombre.trim(),
          nombre_corto: formData.nombre_corto.trim() || null,
          fecha_fundacion: formData.fecha_fundacion || null,
          direccion: formData.direccion.trim(),
          ciudad: formData.ciudad.trim(),
          provincia: formData.provincia,
          codigo_postal: formData.codigo_postal.trim() || null,
          telefono: formData.telefono.trim() || null,
          email: formData.email.trim() || null,
          sitio_web: formData.sitio_web.trim() || null,
          created_by: user.id,
        })
        .select('id')
        .single()

      if (clubError) {
        console.error('[v0] Error creando club:', clubError)
        throw new Error('Error al crear el club: ' + clubError.message)
      }

      // 2. Asignar el club al usuario actual
      const { error: updateUserError } = await supabase
        .from('usuarios_club')
        .update({ 
          club_id: club.id,
          rol: 'admin' // El creador es admin
        })
        .eq('id', user.id)

      if (updateUserError) {
        console.error('[v0] Error asignando club al usuario:', updateUserError)
        throw new Error('Error al asignar el club: ' + updateUserError.message)
      }

      // 3. Generar categorías por defecto
      const { error: categoriasError } = await supabase
        .rpc('generar_categorias_default', { p_club_id: club.id })

      if (categoriasError) {
        console.error('[v0] Error generando categorías:', categoriasError)
        // No es crítico, continuamos
      }

      // 4. Refrescar el perfil del usuario
      await refreshProfile()

      // 5. Completar setup
      onComplete()

    } catch (err) {
      console.error('[v0] Error en setup:', err)
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setIsLoading(false)
    }
  }

  const steps = [
    { number: 1, title: 'Datos Básicos', icon: Building2 },
    { number: 2, title: 'Ubicación', icon: MapPin },
    { number: 3, title: 'Contacto', icon: Phone },
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg-primary)' }}>
      {/* Background blobs */}
      <div className="landing-blob landing-blob-tr" />
      <div className="landing-blob landing-blob-bl" />

      <div className="w-full max-w-2xl relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
            Configurá tu Club
          </h1>
          <p className="text-secondary">
            Completá los datos para empezar a gestionar tu club
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {steps.map((s, index) => (
            <div key={s.number} className="flex items-center">
              <div 
                className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all ${
                  step === s.number 
                    ? 'bg-primary text-primary-foreground' 
                    : step > s.number 
                    ? 'bg-success/20 text-success' 
                    : 'bg-secondary/10 text-secondary'
                }`}
              >
                {step > s.number ? (
                  <CheckCircle2 size={18} />
                ) : (
                  <s.icon size={18} />
                )}
                <span className="text-sm font-medium hidden sm:inline">{s.title}</span>
                <span className="text-sm font-medium sm:hidden">{s.number}</span>
              </div>
              {index < steps.length - 1 && (
                <div 
                  className={`w-8 h-0.5 mx-2 ${
                    step > s.number ? 'bg-success' : 'bg-secondary/20'
                  }`} 
                />
              )}
            </div>
          ))}
        </div>

        {/* Form Card */}
        <div className="glass-panel p-8" style={{ borderRadius: 16 }}>
          {/* Gradient top border */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            background: 'var(--gradient-primary)', 
            borderRadius: '16px 16px 0 0' 
          }} />

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Datos Básicos */}
          {step === 1 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Nombre del Club *
                </label>
                <div className="relative">
                  <Building2 size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    className="input-glass pl-12"
                    placeholder="Ej. Club Atlético San Martín"
                    value={formData.nombre}
                    onChange={e => updateField('nombre', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Nombre Corto (opcional)
                </label>
                <input
                  type="text"
                  className="input-glass"
                  placeholder="Ej. CASM"
                  value={formData.nombre_corto}
                  onChange={e => updateField('nombre_corto', e.target.value)}
                  style={{ height: '3.25rem' }}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Siglas o abreviatura para mostrar en espacios reducidos
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Fecha de Fundación (opcional)
                </label>
                <div className="relative">
                  <Calendar size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="date"
                    className="input-glass pl-12"
                    value={formData.fecha_fundacion}
                    onChange={e => updateField('fecha_fundacion', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Ubicación */}
          {step === 2 && (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Dirección *
                </label>
                <div className="relative">
                  <MapPin size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    className="input-glass pl-12"
                    placeholder="Ej. Av. San Martín 1234"
                    value={formData.direccion}
                    onChange={e => updateField('direccion', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Ciudad *
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Ej. Córdoba"
                    value={formData.ciudad}
                    onChange={e => updateField('ciudad', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-secondary mb-2">
                    Código Postal
                  </label>
                  <input
                    type="text"
                    className="input-glass"
                    placeholder="Ej. 5000"
                    value={formData.codigo_postal}
                    onChange={e => updateField('codigo_postal', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Provincia *
                </label>
                <select
                  className="input-glass"
                  value={formData.provincia}
                  onChange={e => updateField('provincia', e.target.value)}
                  style={{ height: '3.25rem' }}
                >
                  <option value="">Seleccionar provincia</option>
                  {provinciasArgentinas.map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Step 3: Contacto */}
          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-secondary mb-4">
                Estos datos son opcionales. Podés completarlos después.
              </p>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="tel"
                    className="input-glass pl-12"
                    placeholder="Ej. 351 4123456"
                    value={formData.telefono}
                    onChange={e => updateField('telefono', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Email del Club
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="email"
                    className="input-glass pl-12"
                    placeholder="Ej. contacto@miclub.org.ar"
                    value={formData.email}
                    onChange={e => updateField('email', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-secondary mb-2">
                  Sitio Web
                </label>
                <div className="relative">
                  <Globe size={18} className="absolute top-1/2 left-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="url"
                    className="input-glass pl-12"
                    placeholder="Ej. https://www.miclub.org.ar"
                    value={formData.sitio_web}
                    onChange={e => updateField('sitio_web', e.target.value)}
                    style={{ height: '3.25rem' }}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-secondary hover:text-foreground hover:bg-secondary/10 transition-colors"
              >
                <ArrowLeft size={18} />
                Anterior
              </button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-primary flex items-center gap-2"
                style={{ height: '2.75rem' }}
              >
                Siguiente
                <ArrowRight size={18} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isLoading}
                className="btn-primary flex items-center gap-2"
                style={{ height: '2.75rem' }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    Creando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={18} />
                    Crear Club
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <p className="text-xs text-center text-muted-foreground mt-6">
          Podrás modificar estos datos en cualquier momento desde Configuración
        </p>
      </div>
    </div>
  )
}
