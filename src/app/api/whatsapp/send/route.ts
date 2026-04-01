import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappClient } from '@/lib/whatsapp/client';

interface SendMessageBody {
  to: string;
  message: string;
  conversationId?: string;
}

/**
 * POST - Send a message to a WhatsApp number
 */
export async function POST(request: NextRequest) {
  try {
    const body: SendMessageBody = await request.json();

    if (!body.to || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: to, message' },
        { status: 400 }
      );
    }

    // Send via WhatsApp
    const result = await whatsappClient.sendText({
      to: body.to,
      text: body.message,
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to send message' },
        { status: 500 }
      );
    }

    // Log in database if conversation exists
    if (body.conversationId) {
      const supabase = await createClient();
      
      await supabase.from('mensajes_whatsapp').insert({
        conversacion_id: body.conversationId,
        direccion: 'saliente',
        contenido: body.message,
        tipo: 'text',
        wa_message_id: result.messageId,
        estado: 'enviado',
      });

      // Update conversation
      await supabase
        .from('conversaciones_whatsapp')
        .update({ ultimo_mensaje: body.message })
        .eq('id', body.conversationId);
    }

    return NextResponse.json({
      success: true,
      messageId: result.messageId,
    });
  } catch (error) {
    console.error('[API] Send error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
