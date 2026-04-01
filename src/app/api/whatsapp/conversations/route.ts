import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - List all conversations with messages
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const { data: conversations, error } = await supabase
      .from('conversaciones_whatsapp')
      .select(`
        *,
        socios (id, nombre, dni, categoria, estado),
        mensajes_whatsapp (id, direccion, contenido, tipo, created_at)
      `)
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('[API] Error fetching conversations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Count total
    const { count } = await supabase
      .from('conversaciones_whatsapp')
      .select('*', { count: 'exact', head: true });

    return NextResponse.json({
      data: conversations,
      total: count,
      limit,
      offset,
    });
  } catch (error) {
    console.error('[API] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
