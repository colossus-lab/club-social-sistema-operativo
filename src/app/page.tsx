'use client'

import { useEffect } from 'react'
import { useClubStore } from '@/src/store/useClubStore'
import Landing from '@/src/components/Landing'
import AppShell from '@/src/components/AppShell'

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
