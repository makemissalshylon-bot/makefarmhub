import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mobileMoneyService } from '../mobileMoneyService';

describe('mobileMoneyService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn() as any;
  });

  describe('validatePhoneNumber', () => {
    it('should validate EcoCash numbers correctly', () => {
      expect(mobileMoneyService.validatePhoneNumber('0771234567', 'ecocash')).toBe(true);
      expect(mobileMoneyService.validatePhoneNumber('0781234567', 'ecocash')).toBe(true);
      expect(mobileMoneyService.validatePhoneNumber('0711234567', 'ecocash')).toBe(false);
      expect(mobileMoneyService.validatePhoneNumber('+263771234567', 'ecocash')).toBe(true);
    });

    it('should validate OneMoney numbers correctly', () => {
      expect(mobileMoneyService.validatePhoneNumber('0711234567', 'onemoney')).toBe(true);
      expect(mobileMoneyService.validatePhoneNumber('0771234567', 'onemoney')).toBe(false);
      expect(mobileMoneyService.validatePhoneNumber('+263711234567', 'onemoney')).toBe(true);
    });

    it('should validate Telecash numbers correctly', () => {
      expect(mobileMoneyService.validatePhoneNumber('0731234567', 'telecash')).toBe(true);
      expect(mobileMoneyService.validatePhoneNumber('0771234567', 'telecash')).toBe(false);
    });

    it('should validate InnBucks numbers for all networks', () => {
      expect(mobileMoneyService.validatePhoneNumber('0771234567', 'innbucks')).toBe(true);
      expect(mobileMoneyService.validatePhoneNumber('0711234567', 'innbucks')).toBe(true);
      expect(mobileMoneyService.validatePhoneNumber('0731234567', 'innbucks')).toBe(true);
    });

    it('should reject invalid phone numbers', () => {
      expect(mobileMoneyService.validatePhoneNumber('123456', 'ecocash')).toBe(false);
      expect(mobileMoneyService.validatePhoneNumber('', 'ecocash')).toBe(false);
      expect(mobileMoneyService.validatePhoneNumber('07712345', 'ecocash')).toBe(false);
    });
  });

  describe('calculateFee', () => {
    it('should calculate EcoCash fees correctly (flat tiers)', () => {
      expect(mobileMoneyService.calculateFee(50, 'ecocash')).toBe(0);
      expect(mobileMoneyService.calculateFee(100, 'ecocash')).toBe(5);
      expect(mobileMoneyService.calculateFee(600, 'ecocash')).toBe(15);
    });

    it('should calculate OneMoney fees correctly (flat tiers)', () => {
      expect(mobileMoneyService.calculateFee(50, 'onemoney')).toBe(0);
      expect(mobileMoneyService.calculateFee(100, 'onemoney')).toBe(0);
      expect(mobileMoneyService.calculateFee(200, 'onemoney')).toBe(5);
    });

    it('should calculate InnBucks fees correctly (1% min $2)', () => {
      expect(mobileMoneyService.calculateFee(50, 'innbucks')).toBe(2);
      expect(mobileMoneyService.calculateFee(300, 'innbucks')).toBe(3);
    });

    it('should calculate Telecash fees correctly (flat tiers)', () => {
      expect(mobileMoneyService.calculateFee(50, 'telecash')).toBe(0);
      expect(mobileMoneyService.calculateFee(200, 'telecash')).toBe(5);
    });
  });

  describe('initiatePayment', () => {
    it('should initiate payment successfully', async () => {
      const mockResponse = {
        transactionRef: 'MM-ECOCASH-123',
        pollUrl: '/api/mobile-money-status',
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mobileMoneyService.initiatePayment({
        provider: 'ecocash',
        phoneNumber: '0771234567',
        amount: 50,
        userId: 'user123',
        orderId: 'order123',
      });

      expect(result.transactionRef).toBe('MM-ECOCASH-123');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        '/api/mobile-money-initiate',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        })
      );
    });

    it('should throw error on failed payment initiation', async () => {
      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: false,
        json: async () => ({ message: 'Payment failed' }),
      });

      await expect(
        mobileMoneyService.initiatePayment({
          provider: 'ecocash',
          phoneNumber: '0771234567',
          amount: 50,
          userId: 'user123',
        })
      ).rejects.toThrow('Payment failed');
    });
  });

  describe('checkPaymentStatus', () => {
    it('should check payment status successfully', async () => {
      const mockResponse = {
        status: 'success',
        transactionRef: 'MM-ECOCASH-123',
      };

      (globalThis.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await mobileMoneyService.checkPaymentStatus(
        'MM-ECOCASH-123',
        'ecocash'
      );

      expect(result.status).toBe('success');
    });
  });

  describe('formatPhoneNumber', () => {
    it('should format phone numbers to international format', () => {
      expect(mobileMoneyService.formatPhoneNumber('0771234567')).toBe('+263771234567');
      expect(mobileMoneyService.formatPhoneNumber('771234567')).toBe('+263771234567');
      expect(mobileMoneyService.formatPhoneNumber('+263771234567')).toBe('+263771234567');
    });
  });
});
