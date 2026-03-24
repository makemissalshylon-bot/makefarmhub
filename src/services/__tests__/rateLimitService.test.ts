import { describe, it, expect, beforeEach } from 'vitest';
import { rateLimitService } from '../rateLimitService';

describe('rateLimitService', () => {
  beforeEach(() => {
    rateLimitService.clearAll();
  });

  describe('checkLimit', () => {
    it('should allow requests within limit', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      
      expect(rateLimitService.checkLimit('test-key', config)).toBe(true);
      expect(rateLimitService.checkLimit('test-key', config)).toBe(true);
      expect(rateLimitService.checkLimit('test-key', config)).toBe(true);
    });

    it('should block requests exceeding limit', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      rateLimitService.checkLimit('test-key', config);
      rateLimitService.checkLimit('test-key', config);
      
      // Third request should be blocked
      expect(rateLimitService.checkLimit('test-key', config)).toBe(false);
    });

    it('should reset after time window', async () => {
      const config = { maxRequests: 2, windowMs: 100 };
      
      rateLimitService.checkLimit('test-key', config);
      rateLimitService.checkLimit('test-key', config);
      expect(rateLimitService.checkLimit('test-key', config)).toBe(false);
      
      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, 150));
      
      // Should be allowed again
      expect(rateLimitService.checkLimit('test-key', config)).toBe(true);
    });

    it('should track different keys separately', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      rateLimitService.checkLimit('key1', config);
      rateLimitService.checkLimit('key1', config);
      
      // key1 is blocked
      expect(rateLimitService.checkLimit('key1', config)).toBe(false);
      
      // key2 should still work
      expect(rateLimitService.checkLimit('key2', config)).toBe(true);
    });
  });

  describe('getRemaining', () => {
    it('should return correct remaining count', () => {
      const config = { maxRequests: 5, windowMs: 60000 };
      
      expect(rateLimitService.getRemaining('test-key', config)).toBe(5);
      
      rateLimitService.checkLimit('test-key', config);
      expect(rateLimitService.getRemaining('test-key', config)).toBe(4);
      
      rateLimitService.checkLimit('test-key', config);
      expect(rateLimitService.getRemaining('test-key', config)).toBe(3);
    });

    it('should return 0 when limit exceeded', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      rateLimitService.checkLimit('test-key', config);
      rateLimitService.checkLimit('test-key', config);
      
      expect(rateLimitService.getRemaining('test-key', config)).toBe(0);
    });
  });

  describe('reset', () => {
    it('should reset limit for specific key', () => {
      const config = { maxRequests: 2, windowMs: 60000 };
      
      rateLimitService.checkLimit('test-key', config);
      rateLimitService.checkLimit('test-key', config);
      expect(rateLimitService.checkLimit('test-key', config)).toBe(false);
      
      rateLimitService.reset('test-key');
      
      expect(rateLimitService.checkLimit('test-key', config)).toBe(true);
    });
  });

  describe('clearAll', () => {
    it('should reset all limits', () => {
      const config = { maxRequests: 1, windowMs: 60000 };
      
      rateLimitService.checkLimit('key1', config);
      rateLimitService.checkLimit('key2', config);
      
      rateLimitService.clearAll();
      
      expect(rateLimitService.checkLimit('key1', config)).toBe(true);
      expect(rateLimitService.checkLimit('key2', config)).toBe(true);
    });
  });
});
