import { describe, it, expect, beforeAll } from 'vitest';

describe('Mobile Money API Integration', () => {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

  describe('POST /api/mobile-money-initiate', () => {
    it('should initiate EcoCash payment successfully', async () => {
      const response = await fetch(`${API_URL}/mobile-money-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ecocash',
          phoneNumber: '+263771234567',
          amount: 50,
          userId: 'test-user-id',
          orderId: 'test-order-id',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data).toHaveProperty('transactionRef');
      expect(data.transactionRef).toMatch(/^MM-ECOCASH-/);
      expect(data).toHaveProperty('pollUrl');
    });

    it('should reject invalid phone number', async () => {
      const response = await fetch(`${API_URL}/mobile-money-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ecocash',
          phoneNumber: 'invalid',
          amount: 50,
          userId: 'test-user-id',
        }),
      });

      expect(response.ok).toBe(false);
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should reject missing required fields', async () => {
      const response = await fetch(`${API_URL}/mobile-money-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ecocash',
        }),
      });

      expect(response.ok).toBe(false);
    });

    it('should handle OneMoney payments', async () => {
      const response = await fetch(`${API_URL}/mobile-money-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'onemoney',
          phoneNumber: '+263711234567',
          amount: 100,
          userId: 'test-user-id',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.transactionRef).toMatch(/^MM-ONEMONEY-/);
    });
  });

  describe('POST /api/mobile-money-status', () => {
    it('should check payment status', async () => {
      // First initiate a payment
      const initResponse = await fetch(`${API_URL}/mobile-money-initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'ecocash',
          phoneNumber: '+263771234567',
          amount: 50,
          userId: 'test-user-id',
        }),
      });

      const { transactionRef } = await initResponse.json();

      // Then check status
      const statusResponse = await fetch(`${API_URL}/mobile-money-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionRef,
          provider: 'ecocash',
        }),
      });

      expect(statusResponse.ok).toBe(true);
      const data = await statusResponse.json();
      
      expect(data).toHaveProperty('status');
      expect(['pending', 'success', 'failed', 'timeout']).toContain(data.status);
      expect(data.transactionRef).toBe(transactionRef);
    });

    it('should handle invalid transaction reference', async () => {
      const response = await fetch(`${API_URL}/mobile-money-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transactionRef: 'INVALID-REF',
          provider: 'ecocash',
        }),
      });

      const data = await response.json();
      expect(data.status).toBe('failed');
    });
  });
});
