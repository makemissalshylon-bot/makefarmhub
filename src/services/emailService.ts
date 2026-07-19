/**
 * Email Notification Service
 * Frontend service for triggering email notifications via /api/notifications
 */

const API_URL = import.meta.env.VITE_API_URL || '/api';

export type EmailTemplate = 'order_confirmation' | 'payment_receipt' | 'delivery_update' | 'message_notification';

interface SendEmailOptions {
  to: string;
  subject: string;
  template: EmailTemplate;
  data: Record<string, any>;
}

function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderTemplate(template: EmailTemplate, data: Record<string, any>): string {
  switch (template) {
    case 'order_confirmation':
      return `
        <h2>Order Confirmed</h2>
        <p>Hi ${escapeHtml(data.customerName)},</p>
        <p>Your order <strong>#${escapeHtml(data.orderId)}</strong> has been confirmed.</p>
        <p>Total: <strong>$${Number(data.total || 0).toFixed(2)}</strong></p>
        <p>Estimated delivery: ${escapeHtml(data.deliveryDate)}</p>
        <p><a href="${escapeHtml(data.trackingUrl)}">Track your order</a></p>
      `;
    case 'payment_receipt':
      return `
        <h2>Payment Receipt</h2>
        <p>Hi ${escapeHtml(data.customerName)},</p>
        <p>We received your payment of <strong>$${Number(data.amount || 0).toFixed(2)}</strong> via ${escapeHtml(data.paymentMethod)}.</p>
        <p>Transaction: ${escapeHtml(data.transactionId)}</p>
        <p>Date: ${escapeHtml(data.date)}</p>
        <p><a href="${escapeHtml(data.receiptUrl)}">View wallet</a></p>
      `;
    case 'delivery_update':
      return `
        <h2>Delivery Update</h2>
        <p>Hi ${escapeHtml(data.customerName)},</p>
        <p>Order <strong>#${escapeHtml(data.orderId)}</strong> status: <strong>${escapeHtml(data.status)}</strong></p>
        <p>${escapeHtml(data.message)}</p>
        ${data.trackingNumber ? `<p>Tracking: ${escapeHtml(data.trackingNumber)}</p>` : ''}
        <p><a href="${escapeHtml(data.trackingUrl)}">View order</a></p>
      `;
    case 'message_notification':
      return `
        <h2>New Message</h2>
        <p>Hi ${escapeHtml(data.recipientName)},</p>
        <p><strong>${escapeHtml(data.senderName)}</strong> sent you a message:</p>
        <blockquote>${escapeHtml(data.messagePreview)}</blockquote>
        <p><a href="${escapeHtml(data.messageUrl)}">Open messages</a></p>
      `;
    default:
      return `<p>${escapeHtml(JSON.stringify(data))}</p>`;
  }
}

class EmailService {
  private async sendEmail(options: SendEmailOptions): Promise<boolean> {
    try {
      const html = renderTemplate(options.template, options.data);
      const response = await fetch(`${API_URL}/notifications?action=email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        console.error('Email send failed:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Email service error:', error);
      return false;
    }
  }

  async sendOrderConfirmation(
    email: string,
    customerName: string,
    orderId: string,
    items: Array<{ name: string; quantity: number; total: number }>,
    total: number,
    deliveryDate: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Order Confirmed - #${orderId}`,
      template: 'order_confirmation',
      data: {
        customerName,
        orderId,
        items,
        total,
        deliveryDate,
        trackingUrl: `https://makefarmhub.vercel.app/orders/${orderId}`,
      },
    });
  }

  async sendPaymentReceipt(
    email: string,
    customerName: string,
    transactionId: string,
    amount: number,
    paymentMethod: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Payment Receipt - ${transactionId}`,
      template: 'payment_receipt',
      data: {
        customerName,
        transactionId,
        amount,
        paymentMethod,
        date: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        receiptUrl: `https://makefarmhub.vercel.app/wallet`,
      },
    });
  }

  async sendDeliveryUpdate(
    email: string,
    customerName: string,
    orderId: string,
    status: string,
    message: string,
    trackingNumber?: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `Delivery Update - Order #${orderId}`,
      template: 'delivery_update',
      data: {
        customerName,
        orderId,
        status,
        message,
        trackingNumber,
        trackingUrl: `https://makefarmhub.vercel.app/orders/${orderId}`,
      },
    });
  }

  async sendMessageNotification(
    email: string,
    recipientName: string,
    senderName: string,
    messagePreview: string
  ): Promise<boolean> {
    return this.sendEmail({
      to: email,
      subject: `New message from ${senderName}`,
      template: 'message_notification',
      data: {
        recipientName,
        senderName,
        messagePreview: messagePreview.substring(0, 200),
        messageUrl: `https://makefarmhub.vercel.app/messages`,
      },
    });
  }
}

export const emailService = new EmailService();
export default emailService;
