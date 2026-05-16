import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Input Validation Middleware
 * Validates and sanitizes request body
 */
export function withValidation(
  handler: (req: VercelRequest, res: VercelResponse) => Promise<void>,
  schema: Record<string, (value: any) => boolean | string>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    const errors: string[] = [];

    for (const [field, validator] of Object.entries(schema)) {
      const value = req.body?.[field];
      const result = validator(value);

      if (result === false) {
        errors.push(`Invalid field: ${field}`);
      } else if (typeof result === 'string') {
        errors.push(result);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    await handler(req, res);
  };
}

/**
 * Common validators
 */
export const validators = {
  required: (value: any) => value !== undefined && value !== null && value !== '',
  
  email: (value: string) => {
    if (!value) return 'Email is required';
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) || 'Invalid email format';
  },

  phone: (value: string) => {
    if (!value) return 'Phone is required';
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    const phoneRegex = /^(\+?263|0)?[1-9]\d{8,9}$/;
    return phoneRegex.test(cleaned) || 'Invalid phone number (Zimbabwe format)';
  },

  minLength: (min: number) => (value: string) => {
    if (!value) return `Value is required`;
    return value.length >= min || `Minimum length is ${min} characters`;
  },

  maxLength: (max: number) => (value: string) => {
    if (!value) return true;
    return value.length <= max || `Maximum length is ${max} characters`;
  },

  number: (value: any) => {
    const num = Number(value);
    return !isNaN(num) && isFinite(num) || 'Must be a valid number';
  },

  positiveNumber: (value: any) => {
    const num = Number(value);
    return (!isNaN(num) && isFinite(num) && num > 0) || 'Must be a positive number';
  },

  minValue: (min: number) => (value: any) => {
    const num = Number(value);
    return (!isNaN(num) && num >= min) || `Minimum value is ${min}`;
  },

  maxValue: (max: number) => (value: any) => {
    const num = Number(value);
    return (!isNaN(num) && num <= max) || `Maximum value is ${max}`;
  },

  url: (value: string) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return ['http:', 'https:'].includes(url.protocol) || 'Invalid URL';
    } catch {
      return 'Invalid URL format';
    }
  },

  enum: <T extends string>(allowed: T[]) => (value: any) => {
    return allowed.includes(value) || `Must be one of: ${allowed.join(', ')}`;
  },

  array: (value: any) => Array.isArray(value) || 'Must be an array',

  object: (value: any) => 
    typeof value === 'object' && value !== null && !Array.isArray(value) || 'Must be an object',

  boolean: (value: any) => typeof value === 'boolean' || 'Must be a boolean',

  uuid: (value: string) => {
    if (!value) return 'UUID is required';
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value) || 'Invalid UUID format';
  },

  optional: (validator: (value: any) => boolean | string) => (value: any) => {
    if (value === undefined || value === null || value === '') return true;
    return validator(value);
  },
};

/**
 * Sanitize request body
 */
export function sanitizeBody(body: any): any {
  if (typeof body !== 'object' || body === null) {
    return body;
  }

  if (Array.isArray(body)) {
    return body.map(sanitizeBody);
  }

  const sanitized: any = {};
  for (const [key, value] of Object.entries(body)) {
    if (typeof value === 'string') {
      // Remove potential XSS
      sanitized[key] = value
        .replace(/[<>'"]/g, '')
        .trim()
        .substring(0, 10000); // Limit string length
    } else if (typeof value === 'object') {
      sanitized[key] = sanitizeBody(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}
