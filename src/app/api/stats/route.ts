import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  
  // Get total socios
  const { count: totalSocios } = await supabase
    .from('socios')
    .select('*', { count: 'exact', head: true })
  
  // Get socios al día
  const { count: sociosAlDia } = await supabase
    .from('socios')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Al día')
  
  // Get socios morosos
  const { count: sociosMorosos } = await supabase
    .from('socios')
    .select('*', { count: 'exact', head: true })
    .eq('estado', 'Moroso')
  
  // Get total reservas de hoy
  const today = new Date().toISOString().split('T')[0]
  const { count: reservasHoy } = await supabase
    .from('reservas')
    .select('*', { count: 'exact', head: true })
    .eq('fecha', today)
  
  // Get conversaciones activas
  const { count: conversacionesActivas } = await supabase
    .from('conversaciones_whatsapp')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)
  
  // Get mensajes de hoy
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const { count: mensajesHoy } = await supabase
    .from('mensajes_whatsapp')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', todayStart.toISOString())
  
  return NextResponse.json({
    totalSocios: totalSocios || 0,
    sociosAlDia: sociosAlDia || 0,
    sociosMorosos: sociosMorosos || 0,
    reservasHoy: reservasHoy || 0,
    conversacionesActivas: conversacionesActivas || 0,
    mensajesHoy: mensajesHoy || 0
  })
}
