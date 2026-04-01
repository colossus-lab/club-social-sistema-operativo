import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { whatsappClient } from '@/lib/whatsapp/client';

/**
 * POST - Send invoices to all members with pending payments
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { mes, año } = body;

    // Get all socios with phone numbers who have pending payments
    const { data: socios, error } = await supabase
      .from('socios')
      .select('id, nombre, telefono, cuota_mensual, estado')
      .not('telefono', 'is', null)
      .gt('cuota_mensual', 0);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!socios || socios.length === 0) {
      return NextResponse.json({ 
        success: true, 
        sent: 0, 
        message: 'No hay socios con teléfono registrado' 
      });
    }

    // Get payment info
    const { data: config } = await supabase
      .from('configuracion_bot')
      .select('clave, valor')
      .in('clave', ['cbu_transferencia', 'alias_transferencia']);

    const cbu = config?.find((c) => c.clave === 'cbu_transferencia')?.valor || '';
    const alias = config?.find((c) => c.clave === 'alias_transferencia')?.valor || '';

    const results = {
      sent: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Send to each socio
    for (const socio of socios) {
      if (!socio.telefono) continue;

      // Create factura record
      const { data: factura } = await supabase
        .from('facturas')
        .insert({
          socio_id: socio.id,
          monto: socio.cuota_mensual,
          concepto: `Cuota ${mes || 'mensual'}${año ? ` ${año}` : ''}`,
          estado: 'Pendiente',
          fecha_vencimiento: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        })
        .select()
        .single();

      const mensaje = `Hola ${socio.nombre}!\n\n📋 *Factura Club Social OS*\n\n💰 Monto: $${socio.cuota_mensual.toLocaleString()}\n📝 Concepto: Cuota ${mes || 'mensual'}${año ? ` ${año}` : ''}\n📅 Vencimiento: 15 días\n\n🏦 *Datos para transferencia:*\nCBU: ${cbu}\nAlias: ${alias}\n\nUna vez realizado el pago, enviá el comprobante a este chat.\n\nGracias!`;

      const result = await whatsappClient.sendText({
        to: socio.telefono,
        text: mensaje,
      });

      if (result.success) {
        results.sent++;
        
        // Update factura with message id
        if (factura) {
          await supabase
            .from('facturas')
            .update({ 
              enviada_whatsapp: true, 
              wa_message_id: result.messageId 
            })
            .eq('id', factura.id);
        }
      } else {
        results.failed++;
        results.errors.push(`${socio.nombre}: ${result.error}`);
      }

      // Rate limiting - wait between messages
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error) {
    console.error('[API] Send invoices error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
