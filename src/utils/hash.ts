/**
 * Simple password hashing utility using Web Crypto API (SHA-256).
 * This is NOT a substitute for server-side bcrypt/argon2, but it
 * prevents plaintext passwords from sitting in localStorage.
 */

const SALT = 'makefarmhub-v1';

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(SALT + password);
  const buffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const computed = await hashPassword(password);
  return computed === hash;
}
