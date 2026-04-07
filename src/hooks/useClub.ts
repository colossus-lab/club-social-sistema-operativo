'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

export interface Club {
  id: string
  nombre: string
  nombre_corto: string | null
  fecha_fundacion: string | null
  direccion: string
  ciudad: string
  provincia: string
  codigo_postal: string | null
  telefono: string | null
  email: string | null
  sitio_web: string | null
  logo_url: string | null
  cuit: string | null
  razon_social: string | null
  created_at: string
}

export interface CategoríaSocio {
  id: string
  nombre: string
  cuota_mensual: number
  descripcion: string | null
  activa: boolean
  orden: number
}

export function useClub() {
  const { profile, hasClub } = useAuth()
  const [club, setClub] = useState<Club | null>(null)
  const [categorias, setCategorias] = useState<CategoríaSocio[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!hasClub || !profile?.club_id) {
      setLoading(false)
      return
    }

    const fetchClubData = async () => {
      try {
        const supabase = createClient()

        // Fetch club data
        const { data: clubData, error: clubError } = await supabase
          .from('clubs')
          .select('*')
          .eq('id', profile.club_id)
          .single()

        if (clubError) throw clubError
        setClub(clubData)

        // Fetch categorías
        const { data: categoriasData, error: categoriasError } = await supabase
          .from('categorias_socios')
          .select('*')
          .eq('club_id', profile.club_id)
          .eq('activa', true)
          .order('orden', { ascending: true })

        if (categoriasError) throw categoriasError
        setCategorias(categoriasData ?? [])

      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error loading club'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    fetchClubData()
  }, [profile?.club_id, hasClub])

  const refreshClub = async () => {
    if (!profile?.club_id) return

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('clubs')
        .select('*')
        .eq('id', profile.club_id)
        .single()

      if (error) throw error
      setClub(data)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Error refreshing club'
      setError(message)
    }
  }

  // Helper para mostrar nombre corto o nombre completo
  const displayName = club?.nombre_corto || club?.nombre || 'Mi Club'
  const fullName = club?.nombre || 'Mi Club'
  const location = club ? `${club.ciudad}, ${club.provincia}` : ''

  return { 
    club, 
    categorias, 
    loading, 
    error, 
    refreshClub,
    displayName,
    fullName,
    location
  }
}
