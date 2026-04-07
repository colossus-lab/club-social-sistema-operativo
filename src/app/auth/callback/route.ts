import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (!error) {
      // Redirigir al usuario autenticado a la página principal
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si hay error, redirigir a la página de error
  return NextResponse.redirect(`${origin}/auth/error?message=Error durante autenticacion`)
}
