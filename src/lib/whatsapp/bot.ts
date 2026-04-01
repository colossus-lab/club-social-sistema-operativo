/**
 * WhatsApp Bot - Message Processor
 * Handles conversation flow with predefined menus
 */

import { whatsappClient } from './client';
import { ParsedMessage } from './types';
import { createClient } from '@/lib/supabase/server';

interface ConversationContext {
  estado_flujo: string;
  contexto: Record<string, unknown>;
  socio_id?: string;
}

/**
 * Main message processor
 */
export async function processMessage(message: ParsedMessage): Promise<void> {
  const supabase = await createClient();
  const phone = message.from;

  // Get or create conversation
  let { data: conversation } = await supabase
    .from('conversaciones_whatsapp')
    .select('*, socios(*)')
    .eq('telefono', phone)
    .single();

  if (!conversation) {
    // Try to find socio by phone
    const { data: socio } = await supabase
      .from('socios')
      .select('id, nombre')
      .eq('telefono', phone)
      .single();

    // Create new conversation
    const { data: newConv } = await supabase
      .from('conversaciones_whatsapp')
      .insert({
        telefono: phone,
        nombre_contacto: message.contactName || 'Desconocido',
        socio_id: socio?.id || null,
        estado_flujo: 'menu_principal',
        contexto: {},
      })
      .select('*, socios(*)')
      .single();

    conversation = newConv;
  }

  // Log incoming message
  await supabase.from('mensajes_whatsapp').insert({
    conversacion_id: conversation?.id,
    direccion: 'entrante',
    contenido: message.text || `[${message.type}]`,
    tipo: message.type,
    wa_message_id: message.messageId,
  });

  // Update last message
  await supabase
    .from('conversaciones_whatsapp')
    .update({
      ultimo_mensaje: message.text || `[${message.type}]`,
      nombre_contacto: message.contactName || conversation?.nombre_contacto,
    })
    .eq('id', conversation?.id);

  // Mark message as read
  await whatsappClient.markAsRead(message.messageId);

  // Get current context
  const context: ConversationContext = {
    estado_flujo: conversation?.estado_flujo || 'menu_principal',
    contexto: (conversation?.contexto as Record<string, unknown>) || {},
    socio_id: conversation?.socio_id,
  };

  // Process based on current flow state
  const response = await handleFlowState(
    message,
    context,
    conversation?.socios
  );

  // Send response
  if (response) {
    const result = await sendBotResponse(phone, response);

    // Log outgoing message
    await supabase.from('mensajes_whatsapp').insert({
      conversacion_id: conversation?.id,
      direccion: 'saliente',
      contenido: response.text,
      tipo: response.type || 'text',
      wa_message_id: result.messageId,
      estado: result.success ? 'enviado' : 'error',
    });

    // Update conversation state
    if (response.nextState) {
      await supabase
        .from('conversaciones_whatsapp')
        .update({
          estado_flujo: response.nextState,
          contexto: response.nextContext || context.contexto,
        })
        .eq('id', conversation?.id);
    }
  }
}

interface BotResponse {
  text: string;
  type?: 'text' | 'buttons' | 'list';
  buttons?: Array<{ id: string; title: string }>;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
  nextState?: string;
  nextContext?: Record<string, unknown>;
}

/**
 * Handle flow state and return appropriate response
 */
async function handleFlowState(
  message: ParsedMessage,
  context: ConversationContext,
  socio?: { nombre: string; estado: string; cuota_mensual: number } | null
): Promise<BotResponse | null> {
  const text = message.text?.toLowerCase().trim() || '';
  const buttonId = message.buttonId || message.listId;
  const supabase = await createClient();

  // Check for menu reset commands
  if (text === 'menu' || text === 'inicio' || text === 'hola' || text === '0') {
    return getMainMenu(socio?.nombre);
  }

  switch (context.estado_flujo) {
    case 'menu_principal':
      return handleMainMenu(buttonId || text, socio, supabase);

    case 'reservas_seleccionar_recurso':
      return handleSelectResource(buttonId || text, context, supabase);

    case 'reservas_seleccionar_fecha':
      return handleSelectDate(text, context, supabase);

    case 'reservas_seleccionar_hora':
      return handleSelectTime(buttonId || text, context, supabase);

    case 'reservas_confirmar':
      return handleConfirmReservation(buttonId || text, context, supabase);

    case 'cuenta_estado':
      return handleAccountState(buttonId || text, socio, supabase);

    default:
      return getMainMenu(socio?.nombre);
  }
}

/**
 * Main menu response
 */
function getMainMenu(nombre?: string): BotResponse {
  const greeting = nombre ? `Hola ${nombre}!` : 'Hola!';
  
  return {
    text: `${greeting} Soy el asistente virtual del Club Social OS.\n\n¿En qué puedo ayudarte?`,
    type: 'buttons',
    buttons: [
      { id: 'reservar', title: 'Reservar cancha' },
      { id: 'cuenta', title: 'Mi cuenta' },
      { id: 'info', title: 'Info del club' },
    ],
    nextState: 'menu_principal',
  };
}

/**
 * Handle main menu selection
 */
async function handleMainMenu(
  selection: string,
  socio: { nombre: string; estado: string; cuota_mensual: number } | null | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BotResponse> {
  switch (selection) {
    case 'reservar':
    case '1':
    case 'reserva':
    case 'cancha': {
      // Get available resources
      const { data: recursos } = await supabase
        .from('recursos')
        .select('id, nombre, tipo, precio_hora')
        .eq('activo', true);

      if (!recursos || recursos.length === 0) {
        return {
          text: 'No hay recursos disponibles en este momento. Intenta más tarde.',
          nextState: 'menu_principal',
        };
      }

      return {
        text: 'Selecciona el recurso que deseas reservar:',
        type: 'list',
        sections: [
          {
            title: 'Recursos disponibles',
            rows: recursos.map((r) => ({
              id: `recurso_${r.id}`,
              title: r.nombre,
              description: `$${r.precio_hora.toLocaleString()}/hora - ${r.tipo}`,
            })),
          },
        ],
        nextState: 'reservas_seleccionar_recurso',
      };
    }

    case 'cuenta':
    case '2':
    case 'estado': {
      if (!socio) {
        return {
          text: 'No encontré tu cuenta asociada a este número.\n\nPor favor, acércate a la secretaría del club para registrar tu número de WhatsApp.',
          type: 'buttons',
          buttons: [{ id: 'menu', title: 'Volver al menú' }],
          nextState: 'menu_principal',
        };
      }

      const estadoEmoji = socio.estado === 'Al día' ? '✅' : '⚠️';
      
      return {
        text: `*Estado de tu cuenta*\n\n👤 Socio: ${socio.nombre}\n${estadoEmoji} Estado: ${socio.estado}\n💰 Cuota mensual: $${socio.cuota_mensual.toLocaleString()}\n\n¿Qué deseas hacer?`,
        type: 'buttons',
        buttons: [
          { id: 'ver_facturas', title: 'Ver facturas' },
          { id: 'datos_pago', title: 'Datos de pago' },
          { id: 'menu', title: 'Volver al menú' },
        ],
        nextState: 'cuenta_estado',
      };
    }

    case 'info':
    case '3':
    case 'informacion': {
      const { data: config } = await supabase
        .from('configuracion_bot')
        .select('clave, valor');

      const horarios = config?.find((c) => c.clave === 'horarios_atencion')?.valor || 'Consultar en secretaría';

      return {
        text: `*Club Social OS*\n\n🕐 *Horarios de atención:*\n${horarios}\n\n📍 *Dirección:*\nAv. Principal 1234, Buenos Aires\n\n📞 *Teléfono:*\n(011) 1234-5678\n\n🌐 *Web:*\nwww.clubsocialos.com`,
        type: 'buttons',
        buttons: [
          { id: 'disciplinas', title: 'Ver disciplinas' },
          { id: 'menu', title: 'Volver al menú' },
        ],
        nextState: 'menu_principal',
      };
    }

    case 'disciplinas': {
      return {
        text: `*Disciplinas del Club*\n\n⚽ Fútbol - Lun/Mié/Vie 18:00\n🎾 Tenis - Mar/Jue 17:00\n🏊 Natación - Todos los días 8:00-20:00\n🏀 Básquet - Sáb 10:00\n🏐 Vóley - Dom 16:00\n\nPara inscribirte, acércate a la secretaría.`,
        type: 'buttons',
        buttons: [{ id: 'menu', title: 'Volver al menú' }],
        nextState: 'menu_principal',
      };
    }

    default:
      return getMainMenu(socio?.nombre);
  }
}

/**
 * Handle resource selection for reservation
 */
async function handleSelectResource(
  selection: string,
  context: ConversationContext,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BotResponse> {
  if (selection === 'menu' || selection === '0') {
    return getMainMenu();
  }

  const recursoId = selection.replace('recurso_', '');
  
  const { data: recurso } = await supabase
    .from('recursos')
    .select('id, nombre, precio_hora')
    .eq('id', recursoId)
    .single();

  if (!recurso) {
    return {
      text: 'No encontré ese recurso. Por favor, selecciona de la lista.',
      nextState: 'reservas_seleccionar_recurso',
    };
  }

  return {
    text: `Has seleccionado: *${recurso.nombre}*\n💰 Precio: $${recurso.precio_hora.toLocaleString()}/hora\n\n¿Para qué fecha deseas reservar?\n\nEscribe la fecha en formato DD/MM (ej: 15/04)`,
    nextState: 'reservas_seleccionar_fecha',
    nextContext: {
      ...context.contexto,
      recurso_id: recurso.id,
      recurso_nombre: recurso.nombre,
      precio_hora: recurso.precio_hora,
    },
  };
}

/**
 * Handle date selection for reservation
 */
async function handleSelectDate(
  text: string,
  context: ConversationContext,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BotResponse> {
  if (text === 'menu' || text === '0') {
    return getMainMenu();
  }

  // Parse date (DD/MM format)
  const dateMatch = text.match(/^(\d{1,2})\/(\d{1,2})$/);
  
  if (!dateMatch) {
    return {
      text: 'Formato de fecha inválido. Por favor, escribe la fecha como DD/MM (ej: 15/04)',
      nextState: 'reservas_seleccionar_fecha',
      nextContext: context.contexto,
    };
  }

  const day = parseInt(dateMatch[1]);
  const month = parseInt(dateMatch[2]);
  const year = new Date().getFullYear();
  const fecha = new Date(year, month - 1, day);

  // Validate date is in the future
  if (fecha < new Date()) {
    return {
      text: 'La fecha debe ser posterior a hoy. Intenta con otra fecha.',
      nextState: 'reservas_seleccionar_fecha',
      nextContext: context.contexto,
    };
  }

  const fechaStr = fecha.toISOString().split('T')[0];

  // Get existing reservations for that date
  const { data: reservasExistentes } = await supabase
    .from('reservas')
    .select('hora_inicio')
    .eq('recurso_id', context.contexto.recurso_id)
    .eq('fecha', fechaStr)
    .neq('estado', 'Cancelada');

  const horasOcupadas = new Set(reservasExistentes?.map((r) => r.hora_inicio) || []);

  // Generate available time slots
  const horasDisponibles = [];
  for (let h = 8; h <= 21; h++) {
    const horaStr = `${h.toString().padStart(2, '0')}:00:00`;
    if (!horasOcupadas.has(horaStr)) {
      horasDisponibles.push({
        id: `hora_${h}`,
        title: `${h}:00 hs`,
      });
    }
  }

  if (horasDisponibles.length === 0) {
    return {
      text: `No hay horarios disponibles para el ${day}/${month}. Elige otra fecha.`,
      nextState: 'reservas_seleccionar_fecha',
      nextContext: context.contexto,
    };
  }

  return {
    text: `Fecha seleccionada: *${day}/${month}*\n\nSelecciona el horario:`,
    type: 'list',
    sections: [
      {
        title: 'Horarios disponibles',
        rows: horasDisponibles.slice(0, 10),
      },
    ],
    nextState: 'reservas_seleccionar_hora',
    nextContext: {
      ...context.contexto,
      fecha: fechaStr,
      fecha_display: `${day}/${month}`,
    },
  };
}

/**
 * Handle time selection for reservation
 */
async function handleSelectTime(
  selection: string,
  context: ConversationContext,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BotResponse> {
  if (selection === 'menu' || selection === '0') {
    return getMainMenu();
  }

  const hora = parseInt(selection.replace('hora_', ''));
  
  if (isNaN(hora) || hora < 8 || hora > 21) {
    return {
      text: 'Horario inválido. Por favor, selecciona de la lista.',
      nextState: 'reservas_seleccionar_hora',
      nextContext: context.contexto,
    };
  }

  const precio = (context.contexto.precio_hora as number) || 0;
  const sena = Math.round(precio * 0.5);

  return {
    text: `*Confirmar reserva*\n\n📍 ${context.contexto.recurso_nombre}\n📅 ${context.contexto.fecha_display}\n🕐 ${hora}:00 hs\n💰 Total: $${precio.toLocaleString()}\n💵 Seña requerida: $${sena.toLocaleString()}\n\n¿Confirmas la reserva?`,
    type: 'buttons',
    buttons: [
      { id: 'confirmar_reserva', title: 'Sí, confirmar' },
      { id: 'cancelar_reserva', title: 'No, cancelar' },
    ],
    nextState: 'reservas_confirmar',
    nextContext: {
      ...context.contexto,
      hora,
      sena,
    },
  };
}

/**
 * Handle reservation confirmation
 */
async function handleConfirmReservation(
  selection: string,
  context: ConversationContext,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BotResponse> {
  if (selection === 'cancelar_reserva' || selection === 'no') {
    return {
      ...getMainMenu(),
      text: 'Reserva cancelada. ¿En qué más puedo ayudarte?',
    };
  }

  if (selection === 'confirmar_reserva' || selection === 'si') {
    // Create the reservation
    const { data: reserva, error } = await supabase
      .from('reservas')
      .insert({
        recurso_id: context.contexto.recurso_id,
        socio_id: context.socio_id || null,
        reservado_por: 'WhatsApp Bot',
        fecha: context.contexto.fecha,
        hora_inicio: `${(context.contexto.hora as number).toString().padStart(2, '0')}:00:00`,
        hora_fin: `${((context.contexto.hora as number) + 1).toString().padStart(2, '0')}:00:00`,
        estado: 'Pendiente Seña',
        monto_total: context.contexto.precio_hora as number,
      })
      .select()
      .single();

    if (error || !reserva) {
      return {
        ...getMainMenu(),
        text: 'Hubo un error al crear la reserva. Por favor, intenta nuevamente o contacta a secretaría.',
      };
    }

    // Get payment info
    const { data: config } = await supabase
      .from('configuracion_bot')
      .select('clave, valor')
      .in('clave', ['cbu_transferencia', 'alias_transferencia']);

    const cbu = config?.find((c) => c.clave === 'cbu_transferencia')?.valor || '';
    const alias = config?.find((c) => c.clave === 'alias_transferencia')?.valor || '';

    return {
      text: `✅ *Reserva creada exitosamente*\n\n📍 ${context.contexto.recurso_nombre}\n📅 ${context.contexto.fecha_display}\n🕐 ${context.contexto.hora}:00 hs\n\n💵 *Para confirmar, transferí la seña de $${(context.contexto.sena as number)?.toLocaleString()}*\n\n🏦 CBU: ${cbu}\n📝 Alias: ${alias}\n\nEnviá el comprobante a este chat.\n\n⚠️ Tu reserva se confirmará una vez verificado el pago.`,
      type: 'buttons',
      buttons: [{ id: 'menu', title: 'Volver al menú' }],
      nextState: 'menu_principal',
      nextContext: {},
    };
  }

  return getMainMenu();
}

/**
 * Handle account state menu
 */
async function handleAccountState(
  selection: string,
  socio: { nombre: string; estado: string; cuota_mensual: number } | null | undefined,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<BotResponse> {
  if (selection === 'menu' || selection === '0') {
    return getMainMenu(socio?.nombre);
  }

  if (selection === 'ver_facturas') {
    // This would need socio_id to be properly implemented
    return {
      text: 'Para ver tus facturas detalladas, ingresá a nuestra web o acércate a secretaría.\n\n🌐 www.clubsocialos.com/socios',
      type: 'buttons',
      buttons: [{ id: 'menu', title: 'Volver al menú' }],
      nextState: 'menu_principal',
    };
  }

  if (selection === 'datos_pago') {
    const { data: config } = await supabase
      .from('configuracion_bot')
      .select('clave, valor')
      .in('clave', ['cbu_transferencia', 'alias_transferencia']);

    const cbu = config?.find((c) => c.clave === 'cbu_transferencia')?.valor || '';
    const alias = config?.find((c) => c.clave === 'alias_transferencia')?.valor || '';

    return {
      text: `*Datos para transferencia*\n\n🏦 CBU: ${cbu}\n📝 Alias: ${alias}\n\nUna vez realizada la transferencia, enviá el comprobante a este chat o a tesoreria@clubsocialos.com`,
      type: 'buttons',
      buttons: [{ id: 'menu', title: 'Volver al menú' }],
      nextState: 'menu_principal',
    };
  }

  return getMainMenu(socio?.nombre);
}

/**
 * Send bot response via WhatsApp
 */
async function sendBotResponse(
  to: string,
  response: BotResponse
): Promise<{ success: boolean; messageId?: string }> {
  switch (response.type) {
    case 'buttons':
      return whatsappClient.sendButtons({
        to,
        body: response.text,
        buttons: response.buttons,
      });

    case 'list':
      return whatsappClient.sendList({
        to,
        body: response.text,
        sections: response.sections,
      });

    default:
      return whatsappClient.sendText({ to, text: response.text });
  }
}
