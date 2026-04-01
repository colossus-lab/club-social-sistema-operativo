'use client'

import { useEffect } from 'react'
import { useClubStore } from '@/store/useClubStore'
import Landing from '@/components/Landing'
import AppShell from '@/components/AppShell'

export default function Home() {
  const { theme, isOnboarded } = useClubStore()

  useEffect(() => {
    document.body.className = theme
  }, [theme])

  if (!isOnboarded) {
    return <Landing />
  }

  return <AppShell />
}
