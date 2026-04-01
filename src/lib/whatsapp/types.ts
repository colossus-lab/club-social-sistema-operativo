/**
 * WhatsApp Cloud API Webhook Types
 */

export interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: WhatsAppWebhookValue;
      field: string;
    }>;
  }>;
}

export interface WhatsAppWebhookValue {
  messaging_product: string;
  metadata: {
    display_phone_number: string;
    phone_number_id: string;
  };
  contacts?: Array<{
    profile: { name: string };
    wa_id: string;
  }>;
  messages?: Array<WhatsAppIncomingMessage>;
  statuses?: Array<WhatsAppMessageStatus>;
}

export interface WhatsAppIncomingMessage {
  from: string;
  id: string;
  timestamp: string;
  type: 'text' | 'interactive' | 'button' | 'image' | 'document' | 'audio' | 'video' | 'location';
  text?: { body: string };
  interactive?: {
    type: 'button_reply' | 'list_reply';
    button_reply?: { id: string; title: string };
    list_reply?: { id: string; title: string; description?: string };
  };
  button?: { text: string; payload: string };
  image?: { id: string; mime_type: string; sha256: string };
  document?: { id: string; mime_type: string; sha256: string; filename: string };
  location?: { latitude: number; longitude: number; name?: string; address?: string };
}

export interface WhatsAppMessageStatus {
  id: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipient_id: string;
  errors?: Array<{ code: number; title: string; message: string }>;
}

export interface ParsedMessage {
  from: string;
  messageId: string;
  timestamp: Date;
  type: string;
  text?: string;
  buttonId?: string;
  listId?: string;
  contactName?: string;
}

/**
 * Parse incoming webhook message to a simpler format
 */
export function parseIncomingMessage(
  message: WhatsAppIncomingMessage,
  contactName?: string
): ParsedMessage {
  const parsed: ParsedMessage = {
    from: message.from,
    messageId: message.id,
    timestamp: new Date(parseInt(message.timestamp) * 1000),
    type: message.type,
    contactName,
  };

  switch (message.type) {
    case 'text':
      parsed.text = message.text?.body;
      break;
    case 'interactive':
      if (message.interactive?.type === 'button_reply') {
        parsed.buttonId = message.interactive.button_reply?.id;
        parsed.text = message.interactive.button_reply?.title;
      } else if (message.interactive?.type === 'list_reply') {
        parsed.listId = message.interactive.list_reply?.id;
        parsed.text = message.interactive.list_reply?.title;
      }
      break;
    case 'button':
      parsed.buttonId = message.button?.payload;
      parsed.text = message.button?.text;
      break;
  }

  return parsed;
}
