const twilio = require('twilio');

class WhatsAppService {
  constructor() {
    this.client = twilio(
      process.env.WHATSAPP_ACCOUNT_SID,
      process.env.WHATSAPP_AUTH_TOKEN
    );
  }

  async sendInvoiceMessage(phoneNumber, invoice) {
    try {
      // Format phone number for WhatsApp (must include country code)
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      
      // Create invoice message
      const message = this.createInvoiceMessage(invoice);
      
      // Send message via Twilio WhatsApp API
      const result = await this.client.messages.create({
        from: 'whatsapp:+14155238886', // Twilio Sandbox number
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  formatPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Add country code if not present (assuming US +1 for demo)
    if (!cleaned.startsWith('1') && cleaned.length === 10) {
      cleaned = '1' + cleaned;
    }
    
    return '+' + cleaned;
  }

  createInvoiceMessage(invoice) {
    const dueDate = invoice.due_at 
      ? new Date(invoice.due_at).toLocaleDateString() 
      : 'Not specified';

    return `🧾 *Invoice ${invoice.invoice_number}*

📋 *Customer:* ${invoice.customer_name}
💰 *Amount:* $${parseFloat(invoice.total).toFixed(2)}
📅 *Due Date:* ${dueDate}
📊 *Status:* ${invoice.sync_status}

Thank you for your business! 

_Sent via WhatsApp Invoicing App_`;
  }

  async sendQuote(phoneNumber, quote) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = this.createQuoteMessage(quote);
      
      const result = await this.client.messages.create({
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('WhatsApp quote send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  createQuoteMessage(quote) {
    return `📋 *Quote ${quote.quote_number}*

📋 *Customer:* ${quote.customer_name}
💰 *Amount:* $${parseFloat(quote.total).toFixed(2)}
📅 *Created:* ${new Date(quote.created_at).toLocaleDateString()}

This quote is valid for 30 days.

_Sent via WhatsApp Invoicing App_`;
  }

  async sendPaymentReminder(phoneNumber, invoice) {
    try {
      const formattedPhone = this.formatPhoneNumber(phoneNumber);
      const message = this.createReminderMessage(invoice);
      
      const result = await this.client.messages.create({
        from: 'whatsapp:+14155238886',
        to: `whatsapp:${formattedPhone}`,
        body: message
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      console.error('WhatsApp reminder send error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  createReminderMessage(invoice) {
    const dueDate = new Date(invoice.due_at);
    const today = new Date();
    const isOverdue = dueDate < today;
    
    return `⏰ *Payment ${isOverdue ? 'Overdue' : 'Reminder'}*

🧾 *Invoice:* ${invoice.invoice_number}
📋 *Customer:* ${invoice.customer_name}
💰 *Amount:* $${parseFloat(invoice.total).toFixed(2)}
📅 *Due Date:* ${dueDate.toLocaleDateString()}

${isOverdue 
  ? '⚠️ This payment is overdue. Please settle as soon as possible.' 
  : '📝 Friendly reminder that this payment is due soon.'}

Thank you for your prompt attention.

_Sent via WhatsApp Invoicing App_`;
  }
}

module.exports = WhatsAppService;

