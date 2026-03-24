/**
 * Mobile Money Payment Service
 * Supports EcoCash, OneMoney, InnBucks, Telecash
 */

export type MobileMoneyProvider = 'ecocash' | 'onemoney' | 'innbucks' | 'telecash';

export interface MobileMoneyPayment {
  provider: MobileMoneyProvider;
  phoneNumber: string;
  amount: number;
  reference?: string;
  orderId?: string;
  userId: string;
}

export interface PaymentStatus {
  status: 'pending' | 'success' | 'failed' | 'timeout';
  transactionRef?: string;
  message?: string;
  timestamp: string;
}

const API_URL = import.meta.env.VITE_API_URL || '/api';

export const mobileMoneyService = {
  /**
   * Initiate mobile money payment
   */
  async initiatePayment(payment: MobileMoneyPayment): Promise<{ transactionRef: string; pollUrl: string }> {
    const response = await fetch(`${API_URL}/mobile-money-initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payment),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Payment initiation failed');
    }

    return response.json();
  },

  /**
   * Check payment status
   */
  async checkPaymentStatus(transactionRef: string, provider: MobileMoneyProvider): Promise<PaymentStatus> {
    const response = await fetch(`${API_URL}/mobile-money-status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionRef, provider }),
    });

    if (!response.ok) {
      throw new Error('Failed to check payment status');
    }

    return response.json();
  },

  /**
   * Poll payment status until completion
   */
  async pollPaymentStatus(
    transactionRef: string,
    provider: MobileMoneyProvider,
    maxAttempts: number = 60,
    interval: number = 5000
  ): Promise<PaymentStatus> {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await this.checkPaymentStatus(transactionRef, provider);

      if (status.status === 'success' || status.status === 'failed') {
        return status;
      }

      await new Promise(resolve => setTimeout(resolve, interval));
    }

    return {
      status: 'timeout',
      message: 'Payment verification timed out',
      timestamp: new Date().toISOString(),
    };
  },

  /**
   * Get provider-specific instructions
   */
  getProviderInstructions(provider: MobileMoneyProvider, phoneNumber: string, amount: number): string[] {
    const instructions: Record<MobileMoneyProvider, string[]> = {
      ecocash: [
        'Dial *151# on your phone',
        'Select "Send Money"',
        'Select "To EcoCash User"',
        `Enter: ${phoneNumber}`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
      ],
      onemoney: [
        'Dial *111# on your phone',
        'Select "Send Money"',
        'Select "To OneMoney"',
        `Enter: ${phoneNumber}`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
      ],
      innbucks: [
        'Dial *242# on your phone',
        'Select "Send Money"',
        `Enter merchant code: ${phoneNumber}`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
      ],
      telecash: [
        'Dial *212# on your phone',
        'Select "Send Money"',
        `Enter: ${phoneNumber}`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
      ],
    };

    return instructions[provider];
  },

  /**
   * Get provider display name
   */
  getProviderName(provider: MobileMoneyProvider): string {
    const names: Record<MobileMoneyProvider, string> = {
      ecocash: 'EcoCash',
      onemoney: 'OneMoney',
      innbucks: 'InnBucks',
      telecash: 'Telecash',
    };
    return names[provider];
  },

  /**
   * Get provider logo
   */
  getProviderLogo(provider: MobileMoneyProvider): string {
    return `/icons/mobile-money/${provider}.svg`;
  },

  /**
   * Validate phone number for provider
   */
  validatePhoneNumber(phoneNumber: string, provider: MobileMoneyProvider): boolean {
    // Remove spaces and special characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');

    // Zimbabwe phone number patterns
    const patterns: Record<MobileMoneyProvider, RegExp> = {
      ecocash: /^(\+?263|0)?7[78]\d{7}$/,      // Econet 077/078
      onemoney: /^(\+?263|0)?71\d{7}$/,       // NetOne
      innbucks: /^(\+?263|0)?(77|71|73)\d{7}$/, // Multi-network
      telecash: /^(\+?263|0)?73\d{7}$/,       // Telecel
    };

    return patterns[provider].test(cleaned);
  },

  /**
   * Format phone number
   */
  formatPhoneNumber(phoneNumber: string): string {
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    if (cleaned.startsWith('263')) {
      return `+${cleaned}`;
    }
    if (cleaned.startsWith('0')) {
      return `+263${cleaned.substring(1)}`;
    }
    if (cleaned.startsWith('+')) {
      return cleaned;
    }
    
    return `+263${cleaned}`;
  },

  /**
   * Get supported providers for phone number
   */
  getSupportedProviders(phoneNumber: string): MobileMoneyProvider[] {
    const providers: MobileMoneyProvider[] = ['ecocash', 'onemoney', 'innbucks', 'telecash'];
    return providers.filter(provider => this.validatePhoneNumber(phoneNumber, provider));
  },

  /**
   * Calculate transaction fee
   */
  calculateFee(amount: number, provider: MobileMoneyProvider): number {
    // Fee structures (approximate)
    const feeStructures: Record<MobileMoneyProvider, (amt: number) => number> = {
      ecocash: (amt) => {
        if (amt <= 50) return 0;
        if (amt <= 500) return 5;
        if (amt <= 2500) return 15;
        return 25;
      },
      onemoney: (amt) => {
        if (amt <= 100) return 0;
        if (amt <= 500) return 5;
        if (amt <= 2500) return 15;
        return 25;
      },
      innbucks: (amt) => Math.max(2, amt * 0.01), // 1% min $2
      telecash: (amt) => {
        if (amt <= 100) return 0;
        if (amt <= 500) return 5;
        return 15;
      },
    };

    return feeStructures[provider](amount);
  },
};
