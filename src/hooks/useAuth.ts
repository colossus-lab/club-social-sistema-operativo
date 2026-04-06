'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  nombre: string
  apellido: string
  rol: 'admin' | 'tesorero' | 'secretario' | 'viewer'
  club_id: string | null
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()

    const getSession = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) throw sessionError

        setUser(session?.user ?? null)

        if (session?.user) {
          const { data: profileData, error: profileError } = await supabase
            .from('usuarios_club')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (profileError && profileError.code !== 'PGRST116') {
            throw profileError
          }

          setProfile(profileData ?? null)
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading auth'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    getSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user ?? null)

      if (session?.user) {
        const { data: profileData } = await supabase
          .from('usuarios_club')
          .select('*')
          .eq('id', session.user.id)
          .single()

        setProfile(profileData ?? null)
      } else {
        setProfile(null)
      }
    })

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  const logout = async () => {
    try {
      const supabase = createClient()
      await supabase.auth.signOut()
      setUser(null)
      setProfile(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error signing out'
      setError(message)
    }
  }

  const refreshProfile = async () => {
    if (!user) return

    try {
      const supabase = createClient()
      const { data: profileData, error: profileError } = await supabase
        .from('usuarios_club')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError
      }

      setProfile(profileData ?? null)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error refreshing profile'
      setError(message)
    }
  }

  const hasClub = profile?.club_id !== null && profile?.club_id !== undefined

  return { user, profile, loading, error, logout, refreshProfile, hasClub }
}
