'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error
      
      router.push('/')
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="landing-root">
      <div className="landing-blob landing-blob-tr" />
      <div className="landing-blob landing-blob-bl" />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
          {/* Accent bar */}
          <div style={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            right: 0, 
            height: 4, 
            background: 'var(--gradient-primary)', 
            borderRadius: '12px 12px 0 0' 
          }} />

          {/* Logo */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1.5rem' }}>
            <img 
              src="/clubsocialos.ico" 
              alt="Club Social OS" 
              style={{ width: 64, height: 64, borderRadius: 16 }} 
            />
          </div>

          <h1 className="text-2xl font-bold text-center mb-2">
            Bienvenido a Club Social OS
          </h1>
          <p className="text-secondary text-sm text-center mb-8">
            Sistema de gestion integral para clubes sociales y deportivos
          </p>

          {error && (
            <div 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1.5rem',
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

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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
                className="form-input"
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
                placeholder="••••••••"
                required
                className="form-input"
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
              {isLoading ? 'Ingresando...' : 'Iniciar Sesion'}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center' }}>
            <p className="text-sm text-secondary">
              No tenes cuenta?{' '}
              <Link 
                href="/auth/register" 
                style={{ color: 'var(--accent-primary)', fontWeight: 500 }}
              >
                Registrate
              </Link>
            </p>
          </div>

          <div style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid var(--glass-border)' }}>
            <p className="text-xs text-center text-muted">
              Al continuar, aceptas los terminos de servicio y politica de privacidad.
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
