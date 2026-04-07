'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useClubStore } from '@/store/useClubStore'
import { useAuth } from '@/hooks/useAuth'
import ClubSetupWizard from '@/components/ClubSetupWizard'
import AppShell from '@/components/AppShell'

export default function Home() {
  const { theme } = useClubStore()
  const { user, profile, loading, hasClub, refreshProfile } = useAuth()
  const router = useRouter()
  const [setupComplete, setSetupComplete] = useState(false)

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--accent-primary)', borderTopColor: 'transparent' }}></div>
          </div>
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>Cargando...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return null
  }

  // User authenticated but no club configured - show wizard
  if (!hasClub && !setupComplete) {
    return (
      <ClubSetupWizard 
        onComplete={() => {
          setSetupComplete(true)
          refreshProfile()
        }} 
      />
    )
  }

  // User authenticated and has club - show main app
  return <AppShell />
}
