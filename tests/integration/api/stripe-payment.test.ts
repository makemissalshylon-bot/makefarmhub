import { describe, it, expect, beforeAll } from 'vitest';

/**
 * Integration Tests for Stripe Payment API
 * Tests the /api/create-payment-intent endpoint
 */

const API_URL = process.env.VITE_APP_URL || 'http://localhost:5173';

describe('Stripe Payment API Integration', () => {
  beforeAll(() => {
    // Ensure we're in test mode
    if (!process.env.STRIPE_SECRET_KEY) {
      console.warn('STRIPE_SECRET_KEY not set - tests will be skipped');
    }
  });

  it('should create payment intent with valid data', async () => {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1500,
        currency: 'usd',
        orderId: 'order-test-123',
        customerEmail: 'test@example.com',
        description: 'Test order',
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    
    expect(data).toHaveProperty('clientSecret');
    expect(data).toHaveProperty('paymentIntentId');
    expect(data.clientSecret).toMatch(/^pi_/);
  });

  it('should reject invalid amount', async () => {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: -100,
        orderId: 'order-test-123',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data).toHaveProperty('error');
  });

  it('should reject missing orderId', async () => {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 1500,
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('orderId');
  });

  it('should enforce rate limiting', async () => {
    const requests = Array.from({ length: 15 }, () =>
      fetch(`${API_URL}/api/create-payment-intent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 100,
          orderId: 'rate-limit-test',
        }),
      })
    );

    const responses = await Promise.all(requests);
    const rateLimited = responses.some(r => r.status === 429);
    
    expect(rateLimited).toBe(true);
  });

  it('should include security headers', async () => {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100,
        orderId: 'security-test',
      }),
    });

    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(response.headers.get('X-Frame-Options')).toBe('DENY');
    expect(response.headers.get('X-XSS-Protection')).toBe('1; mode=block');
  });

  it('should validate email format', async () => {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100,
        orderId: 'email-test',
        customerEmail: 'invalid-email',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.details).toContain('Invalid field: customerEmail');
  });

  it('should handle missing Stripe credentials gracefully', async () => {
    // This test assumes Stripe is not configured
    if (process.env.STRIPE_SECRET_KEY) {
      console.log('Skipping - Stripe is configured');
      return;
    }

    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100,
        orderId: 'no-stripe-test',
      }),
    });

    expect(response.status).toBe(503);
    const data = await response.json();
    expect(data.error).toContain('Stripe is not configured');
  });

  it('should handle OPTIONS preflight requests', async () => {
    const response = await fetch(`${API_URL}/api/create-payment-intent`, {
      method: 'OPTIONS',
    });

    expect(response.status).toBe(200);
  });
});

describe('Mobile Money API Integration', () => {
  it('should initiate EcoCash payment', async () => {
    const response = await fetch(`${API_URL}/api/mobile-money-initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'ecocash',
        phoneNumber: '+263771234567',
        amount: 50,
        userId: '00000000-0000-0000-0000-000000000001',
        orderId: 'test-order-123',
      }),
    });

    expect([200, 503]).toContain(response.status);
    const data = await response.json();
    
    if (response.status === 200) {
      expect(data).toHaveProperty('transactionRef');
      expect(data.transactionRef).toMatch(/^MM-ECOCASH-/);
    }
  });

  it('should validate phone number format', async () => {
    const response = await fetch(`${API_URL}/api/mobile-money-initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'ecocash',
        phoneNumber: 'invalid',
        amount: 50,
        userId: '00000000-0000-0000-0000-000000000001',
      }),
    });

    expect(response.status).toBe(400);
  });

  it('should validate provider enum', async () => {
    const response = await fetch(`${API_URL}/api/mobile-money-initiate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        provider: 'invalid-provider',
        phoneNumber: '+263771234567',
        amount: 50,
        userId: '00000000-0000-0000-0000-000000000001',
      }),
    });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.details[0]).toContain('provider');
  });
});

describe('Email API Integration', () => {
  it('should send order confirmation email', async () => {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Order Confirmation',
        template: 'order_confirmation',
        data: {
          customerName: 'John Doe',
          orderId: 'ORDER-123',
          items: [
            { name: 'Tomatoes', quantity: 10, total: 50 },
          ],
          total: 50,
          deliveryDate: '2026-06-01',
          trackingUrl: 'https://makefarmhub.vercel.app/orders/123',
        },
      }),
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });

  it('should validate email address', async () => {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'not-an-email',
        subject: 'Test',
        template: 'order_confirmation',
        data: {},
      }),
    });

    expect(response.status).toBe(400);
  });

  it('should validate template enum', async () => {
    const response = await fetch(`${API_URL}/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        subject: 'Test',
        template: 'invalid_template',
        data: {},
      }),
    });

    expect(response.status).toBe(400);
  });
});
