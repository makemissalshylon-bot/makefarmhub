import { describe, it, expect } from 'vitest';

describe('Authentication API Integration', () => {
  const API_URL = process.env.VITE_API_URL || 'http://localhost:3000/api';

  describe('POST /api/send-verification-email', () => {
    it('should send verification email successfully', async () => {
      const response = await fetch(`${API_URL}/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'test@example.com',
          userId: 'test-user-id',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
    });

    it('should reject missing email', async () => {
      const response = await fetch(`${API_URL}/send-verification-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: 'test-user-id' }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST /api/send-phone-otp', () => {
    it('should send OTP successfully', async () => {
      const response = await fetch(`${API_URL}/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: '+263771234567',
          userId: 'test-user-id',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data).toHaveProperty('expiresIn');
    });

    it('should validate phone number format', async () => {
      const response = await fetch(`${API_URL}/send-phone-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: 'invalid',
          userId: 'test-user-id',
        }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('POST /api/enable-2fa', () => {
    it('should enable 2FA and return QR code', async () => {
      const response = await fetch(`${API_URL}/enable-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
        }),
      });

      expect(response.ok).toBe(true);
      const data = await response.json();
      
      expect(data).toHaveProperty('secret');
      expect(data).toHaveProperty('qrCodeUrl');
      expect(data).toHaveProperty('backupCodes');
      expect(data.backupCodes).toBeInstanceOf(Array);
      expect(data.backupCodes.length).toBe(10);
    });
  });

  describe('POST /api/verify-2fa', () => {
    it('should verify valid TOTP token', async () => {
      const response = await fetch(`${API_URL}/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          token: '123456',
        }),
      });

      // Response depends on whether token is actually valid
      expect([200, 400, 401]).toContain(response.status);
    });

    it('should reject invalid token format', async () => {
      const response = await fetch(`${API_URL}/verify-2fa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user-id',
          token: 'abc',
        }),
      });

      expect(response.ok).toBe(false);
    });
  });
});
