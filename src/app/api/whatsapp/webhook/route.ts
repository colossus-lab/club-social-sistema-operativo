import { NextRequest, NextResponse } from 'next/server';
import { WhatsAppWebhookPayload, parseIncomingMessage } from '@/lib/whatsapp/types';
import { processMessage } from '@/lib/whatsapp/bot';
import { createClient } from '@/lib/supabase/server';

/**
 * GET - Webhook Verification (Meta requires this for setup)
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('[Webhook] Verification successful');
    return new NextResponse(challenge, { status: 200 });
  }

  console.log('[Webhook] Verification failed');
  return new NextResponse('Forbidden', { status: 403 });
}

/**
 * POST - Receive incoming messages
 */
export async function POST(request: NextRequest) {
  try {
    const payload: WhatsAppWebhookPayload = await request.json();

    // Validate payload structure
    if (payload.object !== 'whatsapp_business_account') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Process each entry
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.field !== 'messages') continue;

        const value = change.value;
        
        // Handle incoming messages
        if (value.messages && value.messages.length > 0) {
          const contact = value.contacts?.[0];
          
          for (const message of value.messages) {
            const parsed = parseIncomingMessage(message, contact?.profile?.name);
            
            // Log the incoming message
            console.log('[Webhook] Incoming message:', {
              from: parsed.from,
              type: parsed.type,
              text: parsed.text,
            });

            // Process the message asynchronously (don't await to respond quickly)
            processMessage(parsed).catch((error) => {
              console.error('[Webhook] Error processing message:', error);
            });
          }
        }

        // Handle message status updates
        if (value.statuses && value.statuses.length > 0) {
          const supabase = await createClient();
          
          for (const status of value.statuses) {
            // Update message status in database
            await supabase
              .from('mensajes_whatsapp')
              .update({ estado: status.status })
              .eq('wa_message_id', status.id);
          }
        }
      }
    }

    // Always respond quickly to avoid timeouts
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('[Webhook] Error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
