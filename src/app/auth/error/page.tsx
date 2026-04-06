'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { AlertCircle } from 'lucide-react'
import { Suspense } from 'react'

function ErrorContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message') || 'Ocurrio un error durante la autenticacion'

  return (
    <div className="landing-root">
      <div className="landing-blob landing-blob-tr" />
      <div className="landing-blob landing-blob-bl" />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 440, padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem 2rem', textAlign: 'center' }}>
          <div 
            style={{ 
              width: 64, 
              height: 64, 
              borderRadius: '50%', 
              background: 'rgba(239, 68, 68, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}
          >
            <AlertCircle size={32} style={{ color: 'var(--error)' }} />
          </div>

          <h1 className="text-2xl font-bold mb-2">Error de Autenticacion</h1>
          <p className="text-secondary mb-6">{message}</p>

          <Link 
            href="/auth/login"
            className="btn-primary"
            style={{ 
              width: '100%', 
              justifyContent: 'center', 
              height: '3rem',
              display: 'inline-flex'
            }}
          >
            Volver a intentar
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="landing-root">
        <div style={{ color: 'var(--text-secondary)' }}>Cargando...</div>
      </div>
    }>
      <ErrorContent />
    </Suspense>
  )
}
