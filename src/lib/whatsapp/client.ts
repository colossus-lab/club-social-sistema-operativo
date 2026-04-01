/**
 * WhatsApp Cloud API Client
 * Meta Cloud API Integration for sending messages
 */

const WHATSAPP_API_VERSION = 'v18.0';
const WHATSAPP_API_URL = `https://graph.facebook.com/${WHATSAPP_API_VERSION}`;

interface WhatsAppTextMessage {
  to: string;
  text: string;
}

interface WhatsAppInteractiveMessage {
  to: string;
  body: string;
  buttons?: Array<{ id: string; title: string }>;
  sections?: Array<{
    title: string;
    rows: Array<{ id: string; title: string; description?: string }>;
  }>;
}

interface WhatsAppTemplateMessage {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Array<{
    type: string;
    parameters: Array<{ type: string; text?: string }>;
  }>;
}

interface SendMessageResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export class WhatsAppClient {
  private accessToken: string;
  private phoneNumberId: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';

    if (!this.accessToken || !this.phoneNumberId) {
      console.warn('[WhatsApp] Missing credentials - bot will not send messages');
    }
  }

  private async sendRequest(payload: object): Promise<SendMessageResponse> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            ...payload,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('[WhatsApp] API Error:', data);
        return {
          success: false,
          error: data.error?.message || 'Unknown error',
        };
      }

      return {
        success: true,
        messageId: data.messages?.[0]?.id,
      };
    } catch (error) {
      console.error('[WhatsApp] Request failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Request failed',
      };
    }
  }

  /**
   * Send a simple text message
   */
  async sendText({ to, text }: WhatsAppTextMessage): Promise<SendMessageResponse> {
    return this.sendRequest({
      to,
      type: 'text',
      text: { body: text },
    });
  }

  /**
   * Send an interactive message with buttons (max 3 buttons)
   */
  async sendButtons({
    to,
    body,
    buttons,
  }: WhatsAppInteractiveMessage): Promise<SendMessageResponse> {
    if (!buttons || buttons.length === 0) {
      return this.sendText({ to, text: body });
    }

    return this.sendRequest({
      to,
      type: 'interactive',
      interactive: {
        type: 'button',
        body: { text: body },
        action: {
          buttons: buttons.slice(0, 3).map((btn) => ({
            type: 'reply',
            reply: { id: btn.id, title: btn.title.substring(0, 20) },
          })),
        },
      },
    });
  }

  /**
   * Send an interactive list message
   */
  async sendList({
    to,
    body,
    sections,
  }: WhatsAppInteractiveMessage): Promise<SendMessageResponse> {
    if (!sections || sections.length === 0) {
      return this.sendText({ to, text: body });
    }

    return this.sendRequest({
      to,
      type: 'interactive',
      interactive: {
        type: 'list',
        body: { text: body },
        action: {
          button: 'Ver opciones',
          sections: sections.map((section) => ({
            title: section.title.substring(0, 24),
            rows: section.rows.slice(0, 10).map((row) => ({
              id: row.id,
              title: row.title.substring(0, 24),
              description: row.description?.substring(0, 72),
            })),
          })),
        },
      },
    });
  }

  /**
   * Send a template message (for notifications outside 24h window)
   */
  async sendTemplate({
    to,
    templateName,
    languageCode = 'es_AR',
    components,
  }: WhatsAppTemplateMessage): Promise<SendMessageResponse> {
    return this.sendRequest({
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components: components || [],
      },
    });
  }

  /**
   * Mark a message as read
   */
  async markAsRead(messageId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${WHATSAPP_API_URL}/${this.phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            status: 'read',
            message_id: messageId,
          }),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('[WhatsApp] Failed to mark as read:', error);
      return false;
    }
  }
}

// Singleton instance
export const whatsappClient = new WhatsAppClient();
