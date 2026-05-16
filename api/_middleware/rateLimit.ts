import type { VercelRequest, VercelResponse } from '@vercel/node';

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: VercelRequest) => string;
}

// In-memory store for rate limiting (use Redis in production)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

/**
 * Rate Limiting Middleware
 * Prevents abuse by limiting requests per time window
 */
export function withRateLimit(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  config: RateLimitConfig
) {
  const {
    windowMs = 60000, // 1 minute
    maxRequests = 60,
    message = 'Too many requests, please try again later',
    keyGenerator = (req) => {
      // Use IP address or auth token as key
      const forwarded = req.headers['x-forwarded-for'];
      const ip = forwarded
        ? (typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0])
        : req.socket?.remoteAddress || 'unknown';
      return `ratelimit:${ip}`;
    },
  } = config;

  return async (req: VercelRequest, res: VercelResponse) => {
    const key = keyGenerator(req);
    const now = Date.now();
    
    let record = requestCounts.get(key);

    // Reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        count: 0,
        resetTime: now + windowMs,
      };
    }

    // Increment count
    record.count++;
    requestCounts.set(key, record);

    // Check if limit exceeded
    if (record.count > maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', maxRequests.toString());
      res.setHeader('X-RateLimit-Remaining', '0');
      res.setHeader('X-RateLimit-Reset', record.resetTime.toString());
      res.setHeader('Retry-After', retryAfter.toString());

      return res.status(429).json({
        error: message,
        retryAfter,
      });
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', (maxRequests - record.count).toString());
    res.setHeader('X-RateLimit-Reset', record.resetTime.toString());

    await handler(req, res);
  };
}

/**
 * Cleanup old rate limit entries (run periodically)
 */
export function cleanupRateLimits() {
  const now = Date.now();
  for (const [key, record] of requestCounts.entries()) {
    if (now > record.resetTime) {
      requestCounts.delete(key);
    }
  }
}

// Auto-cleanup every 5 minutes
setInterval(cleanupRateLimits, 5 * 60 * 1000);
