import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Security Headers Middleware
 * Adds security headers to all API responses
 */
export function withSecurityHeaders(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    // Content Security Policy
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://maps.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://api.stripe.com; frame-src 'self' https://js.stripe.com;"
    );

    // Prevent clickjacking
    res.setHeader('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    res.setHeader('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    res.setHeader('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Permissions policy
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(self), microphone=(), camera=(), payment=(self)'
    );

    // HSTS (force HTTPS)
    res.setHeader(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    );

    // Remove server header
    res.removeHeader('X-Powered-By');

    await handler(req, res);
  };
}

/**
 * CORS Headers Middleware
 */
export function withCORS(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  options: {
    origin?: string | string[];
    methods?: string[];
    credentials?: boolean;
  } = {}
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const {
      origin = '*',
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials = true,
    } = options;

    // Set CORS headers
    if (typeof origin === 'string') {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else {
      const requestOrigin = req.headers.origin || '';
      if (origin.includes(requestOrigin)) {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin);
      }
    }

    res.setHeader('Access-Control-Allow-Methods', methods.join(', '));
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Handle preflight
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    await handler(req, res);
  };
}
