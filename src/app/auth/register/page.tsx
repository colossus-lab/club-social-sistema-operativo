'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [nombre, setNombre] = useState('')
  const [apellido, setApellido] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (password !== confirmPassword) {
      setError('Las contrasenas no coinciden')
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError('La contrasena debe tener al menos 6 caracteres')
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            nombre,
            apellido,
          },
        },
      })

      if (error) throw error
      
      setSuccess(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al registrarse')
    } finally {
      setIsLoading(false)
    }
  }

  if (success) {
    return (
      <div className="landing-root">
        <div className="landing-blob landing-blob-tr" />
        <div className="landing-blob landing-blob-bl" />

        <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '2rem' }}>
          <div className="glass-panel" style={{ padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              height: 4, 
              background: 'linear-gradient(90deg, #10b981, #34d399)', 
              borderRadius: '12px 12px 0 0' 
            }} />

            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
              <div style={{ 
                width: 64, 
                height: 64, 
                borderRadius: '50%', 
                background: 'rgba(16, 185, 129, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-center mb-2">
              Registro exitoso
            </h1>
            <p className="text-secondary text-sm text-center mb-6">
              Te enviamos un email de confirmacion a <strong>{email}</strong>. 
              Por favor revisa tu bandeja de entrada y confirma tu cuenta.
            </p>

            <Link
              href="/auth/login"
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: '3rem',
                fontSize: '1rem',
                display: 'flex',
                alignItems: 'center',
                textDecoration: 'none'
              }}
            >
              Volver al Login
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="landing-root">
      <div className="landing-blob landing-blob-tr" />
      <div className="landing-blob landing-blob-bl" />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            background: 'var(--gradient-primary)', 
            borderRadius: '12px 12px 0 0' 
          }} />

          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img 
              src="/clubsocialos.ico" 
              alt="Club Social OS" 
              style={{ width: 64, height: 64, borderRadius: 16 }} 
            />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Crear Cuenta
          </h1>
          <p className="text-secondary text-sm text-center mb-6">
            Registrate para acceder a Club Social OS
          </p>

          {error && (
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1rem',
                textAlign: 'center',
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#ef4444',
                fontSize: '0.875rem'
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label 
                  htmlFor="nombre" 
                  className="text-sm font-medium text-foreground"
                  style={{ display: 'block', marginBottom: '0.5rem' }}
                >
                  Nombre
                </label>
                <input
                  id="nombre"
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Juan"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)',
                    color: 'var(--foreground)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>

              <div>
                <label 
                  htmlFor="apellido" 
                  className="text-sm font-medium text-foreground"
                  style={{ display: 'block', marginBottom: '0.5rem' }}
                >
                  Apellido
                </label>
                <input
                  id="apellido"
                  type="text"
                  value={apellido}
                  onChange={(e) => setApellido(e.target.value)}
                  placeholder="Perez"
                  required
                  style={{ 
                    width: '100%', 
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--glass-border)',
                    background: 'var(--glass-bg)',
                    color: 'var(--foreground)',
                    fontSize: '0.9375rem'
                  }}
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="email" 
                className="text-sm font-medium text-foreground"
                style={{ display: 'block', marginBottom: '0.5rem' }}
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="password" 
                className="text-sm font-medium text-foreground"
                style={{ display: 'block', marginBottom: '0.5rem' }}
              >
                Contrasena
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimo 6 caracteres"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>

            <div>
              <label 
                htmlFor="confirmPassword" 
                className="text-sm font-medium text-foreground"
                style={{ display: 'block', marginBottom: '0.5rem' }}
              >
                Confirmar Contrasena
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repetir contrasena"
                required
                style={{ 
                  width: '100%', 
                  padding: '0.75rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--glass-border)',
                  background: 'var(--glass-bg)',
                  color: 'var(--foreground)',
                  fontSize: '0.9375rem'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary"
              style={{
                width: '100%',
                justifyContent: 'center',
                height: '3rem',
                fontSize: '1rem',
                marginTop: '0.5rem',
                opacity: isLoading ? 0.7 : 1,
                cursor: isLoading ? 'not-allowed' : 'pointer'
              }}
            >
              {isLoading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p className="text-sm text-secondary">
              Ya tenes cuenta?{' '}
              <Link 
                href="/auth/login" 
                style={{ color: 'var(--accent-primary)', fontWeight: 500 }}
              >
                Iniciar Sesion
              </Link>
            </p>
          </div>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p className="text-xs text-secondary font-medium">
              by{' '}
              <a 
                href="https://colossuslab.org" 
                target="_blank" 
                rel="noopener noreferrer" 
                style={{ color: 'var(--accent-primary)' }}
              >
                ColossusLab.org
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
