/**
 * Rate Limiting Service
 * Client-side rate limiting to prevent API abuse
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  count: number;
  resetTime: number;
}

export const rateLimitService = {
  records: new Map<string, RequestRecord>(),

  /**
   * Check if request is allowed
   */
  checkLimit(key: string, config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }): boolean {
    const now = Date.now();
    const record = this.records.get(key);

    if (!record || now > record.resetTime) {
      this.records.set(key, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return true;
    }

    if (record.count >= config.maxRequests) {
      return false;
    }

    record.count++;
    return true;
  },

  /**
   * Get remaining requests
   */
  getRemaining(key: string, config: RateLimitConfig = { maxRequests: 100, windowMs: 60000 }): number {
    const record = this.records.get(key);
    if (!record || Date.now() > record.resetTime) {
      return config.maxRequests;
    }
    return Math.max(0, config.maxRequests - record.count);
  },

  /**
   * Reset limit for key
   */
  reset(key: string) {
    this.records.delete(key);
  },

  /**
   * Clear all limits
   */
  clearAll() {
    this.records.clear();
  },
};
