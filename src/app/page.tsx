'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useClubStore } from '@/store/useClubStore'
import { useAuth } from '@/hooks/useAuth'
import Landing from '@/components/Landing'
import AppShell from '@/components/AppShell'

export default function Home() {
  const { theme, isOnboarded } = useClubStore()
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="mb-4">
            <div className="inline-block w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-foreground font-medium">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!isOnboarded) {
    return <Landing />
  }

  return <AppShell />
}
