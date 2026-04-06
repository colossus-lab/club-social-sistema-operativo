'use client'

import { createClient } from '@/lib/supabase/client'
import { useState } from 'react'

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      })

      if (error) throw error
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al iniciar sesion')
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
              className="badge-error" 
              style={{ 
                padding: '0.75rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                marginBottom: '1.5rem',
                textAlign: 'center',
                display: 'block',
                textTransform: 'none',
                fontSize: '0.875rem'
              }}
            >
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="btn-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              height: '3.25rem',
              fontSize: '1rem',
              gap: '0.75rem',
              opacity: isLoading ? 0.7 : 1,
              cursor: isLoading ? 'not-allowed' : 'pointer'
            }}
          >
            {isLoading ? (
              <span>Conectando...</span>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continuar con Google
              </>
            )}
          </button>

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
