/**
 * Payment Service
 * Handles multiple payment methods, transactions, and invoice generation
 */

export interface PaymentMethod {
  id: string;
  type: 'mobile_money' | 'bank_card' | 'bank_transfer' | 'cash';
  provider: string;
  accountNumber?: string;
  cardLast4?: string;
  isDefault: boolean;
  isVerified: boolean;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'payment' | 'refund' | 'commission';
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  paymentMethod: PaymentMethod;
  reference: string;
  description: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  completedAt?: Date;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  orderId: string;
  sellerId: string;
  buyerId: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  commission: number;
  total: number;
  currency: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  paidDate?: Date;
  notes?: string;
  createdAt: Date;
}

export interface InvoiceItem {
  id: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface RefundRequest {
  id: string;
  transactionId: string;
  orderId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  requestedBy: string;
  requestedAt: Date;
  processedAt?: Date;
}

class PaymentService {
  /**
   * Process payment
   */
  async processPayment(
    amount: number,
    paymentMethod: PaymentMethod,
    orderId: string,
    description: string
  ): Promise<Transaction> {
    // In production, integrate with payment gateway API
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      userId: '', // Would come from auth context
      type: 'payment',
      amount,
      currency: 'USD',
      status: 'processing',
      paymentMethod,
      reference: this.generateReference(),
      description,
      metadata: { orderId },
      createdAt: new Date(),
    };

    // Simulate payment processing
    await this.simulatePaymentProcessing(transaction);

    return transaction;
  }

  /**
   * Process mobile money payment
   */
  async processMobileMoney(
    phoneNumber: string,
    amount: number,
    provider: 'ecocash' | 'onemoney' | 'telecash'
  ): Promise<Transaction> {
    // In production, integrate with mobile money API

    const transaction: Transaction = {
      id: this.generateTransactionId(),
      userId: '',
      type: 'payment',
      amount,
      currency: 'USD',
      status: 'pending',
      paymentMethod: {
        id: this.generateId(),
        type: 'mobile_money',
        provider,
        accountNumber: phoneNumber,
        isDefault: false,
        isVerified: true,
      },
      reference: this.generateReference(),
      description: 'Mobile money payment',
      createdAt: new Date(),
    };

    // Would call mobile money API here
    // Example: await fetch(`/api/payments/mobile-money/${provider}`, { ... });

    return transaction;
  }

  /**
   * Process bank card payment
   */
  async processBankCard(
    cardDetails: {
      number: string;
      expiry: string;
      cvv: string;
      name: string;
    },
    amount: number
  ): Promise<Transaction> {
    // In production, use payment gateway like Stripe, PayStack, etc.

    const transaction: Transaction = {
      id: this.generateTransactionId(),
      userId: '',
      type: 'payment',
      amount,
      currency: 'USD',
      status: 'processing',
      paymentMethod: {
        id: this.generateId(),
        type: 'bank_card',
        provider: 'Visa',
        cardLast4: cardDetails.number.slice(-4),
        isDefault: false,
        isVerified: true,
      },
      reference: this.generateReference(),
      description: 'Card payment',
      createdAt: new Date(),
    };

    // Would call payment gateway API here
    // Example: await stripe.charges.create({ ... });

    return transaction;
  }

  /**
   * Generate invoice
   */
  generateInvoice(
    orderId: string,
    sellerId: string,
    buyerId: string,
    items: InvoiceItem[],
    taxRate: number = 0.15,
    commissionRate: number = 0.05
  ): Invoice {
    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const tax = subtotal * taxRate;
    const commission = subtotal * commissionRate;
    const total = subtotal + tax;

    const invoice: Invoice = {
      id: this.generateId(),
      invoiceNumber: this.generateInvoiceNumber(),
      orderId,
      sellerId,
      buyerId,
      items,
      subtotal,
      tax,
      commission,
      total,
      currency: 'USD',
      status: 'draft',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      createdAt: new Date(),
    };

    return invoice;
  }

  /**
   * Generate invoice PDF (placeholder)
   */
  async generateInvoicePDF(invoice: Invoice): Promise<Blob> {
    // In production, use a PDF generation library
    const html = this.generateInvoiceHTML(invoice);
    
    // Would use library like jsPDF or pdfmake
    // For now, return a simple blob
    const blob = new Blob([html], { type: 'text/html' });
    return blob;
  }

  /**
   * Generate invoice HTML
   */
  private generateInvoiceHTML(invoice: Invoice): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Invoice ${invoice.invoiceNumber}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          .header { text-align: center; margin-bottom: 40px; }
          .invoice-details { margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          .total { font-weight: bold; font-size: 1.2em; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>MAKEFARMHUB</h1>
          <p>Invoice #${invoice.invoiceNumber}</p>
        </div>
        <div class="invoice-details">
          <p><strong>Date:</strong> ${invoice.createdAt.toLocaleDateString()}</p>
          <p><strong>Due Date:</strong> ${invoice.dueDate.toLocaleDateString()}</p>
          <p><strong>Order ID:</strong> ${invoice.orderId}</p>
        </div>
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            ${invoice.items.map(item => `
              <tr>
                <td>${item.name}</td>
                <td>${item.quantity}</td>
                <td>$${item.unitPrice.toFixed(2)}</td>
                <td>$${item.total.toFixed(2)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr>
              <td colspan="3">Subtotal</td>
              <td>$${invoice.subtotal.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="3">Tax</td>
              <td>$${invoice.tax.toFixed(2)}</td>
            </tr>
            <tr class="total">
              <td colspan="3">Total</td>
              <td>$${invoice.total.toFixed(2)}</td>
            </tr>
          </tfoot>
        </table>
      </body>
      </html>
    `;
  }

  /**
   * Request refund
   */
  async requestRefund(
    transactionId: string,
    orderId: string,
    amount: number,
    reason: string
  ): Promise<RefundRequest> {
    const refundRequest: RefundRequest = {
      id: this.generateId(),
      transactionId,
      orderId,
      amount,
      reason,
      status: 'pending',
      requestedBy: '', // Would come from auth context
      requestedAt: new Date(),
    };

    // In production, save to backend
    // await fetch('/api/refunds', { method: 'POST', body: JSON.stringify(refundRequest) });

    return refundRequest;
  }

  /**
   * Process refund
   */
  async processRefund(refundRequest: RefundRequest): Promise<Transaction> {
    const transaction: Transaction = {
      id: this.generateTransactionId(),
      userId: refundRequest.requestedBy,
      type: 'refund',
      amount: refundRequest.amount,
      currency: 'USD',
      status: 'processing',
      paymentMethod: {} as PaymentMethod, // Would get from original transaction
      reference: this.generateReference(),
      description: `Refund for order ${refundRequest.orderId}`,
      metadata: { refundRequestId: refundRequest.id },
      createdAt: new Date(),
    };

    // In production, process through payment gateway
    // await paymentGateway.refund(transaction);

    return transaction;
  }

  /**
   * Get payment methods for user
   */
  getPaymentMethods(userId: string): PaymentMethod[] {
    // In production, fetch from backend
    const stored = localStorage.getItem(`payment_methods_${userId}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * Add payment method
   */
  async addPaymentMethod(userId: string, method: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> {
    const paymentMethod: PaymentMethod = {
      ...method,
      id: this.generateId(),
    };

    const methods = this.getPaymentMethods(userId);
    methods.push(paymentMethod);
    localStorage.setItem(`payment_methods_${userId}`, JSON.stringify(methods));

    return paymentMethod;
  }

  /**
   * Remove payment method
   */
  async removePaymentMethod(userId: string, methodId: string): Promise<void> {
    const methods = this.getPaymentMethods(userId);
    const filtered = methods.filter(m => m.id !== methodId);
    localStorage.setItem(`payment_methods_${userId}`, JSON.stringify(filtered));
  }

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, methodId: string): Promise<void> {
    const methods = this.getPaymentMethods(userId);
    const updated = methods.map(m => ({
      ...m,
      isDefault: m.id === methodId,
    }));
    localStorage.setItem(`payment_methods_${userId}`, JSON.stringify(updated));
  }

  /**
   * Simulate payment processing
   */
  private async simulatePaymentProcessing(transaction: Transaction): Promise<void> {
    // Simulate async payment processing
    await new Promise(resolve => setTimeout(resolve, 2000));
    transaction.status = 'completed';
    transaction.completedAt = new Date();
  }

  /**
   * Generate transaction ID
   */
  private generateTransactionId(): string {
    return `TXN${Date.now()}${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
  }

  /**
   * Generate reference number
   */
  private generateReference(): string {
    return `REF${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
  }

  /**
   * Generate invoice number
   */
  private generateInvoiceNumber(): string {
    const year = new Date().getFullYear();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `INV-${year}-${random}`;
  }

  /**
   * Generate ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Verify payment
   */
  async verifyPayment(transactionId: string): Promise<boolean> {
    // In production, verify with payment gateway
    // const result = await paymentGateway.verify(transactionId);
    // return result.status === 'success';
    return true;
  }

  /**
   * Get transaction history
   */
  getTransactionHistory(userId: string, limit: number = 50): Transaction[] {
    // In production, fetch from backend
    const stored = localStorage.getItem(`transactions_${userId}`);
    const transactions = stored ? JSON.parse(stored) : [];
    return transactions.slice(0, limit);
  }
}

export const paymentService = new PaymentService();
export default paymentService;
