import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from './hash';

describe('hashPassword', () => {
  it('returns a hex string of length 64 (SHA-256)', async () => {
    const hash = await hashPassword('test123');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('produces deterministic output', async () => {
    const a = await hashPassword('hello');
    const b = await hashPassword('hello');
    expect(a).toBe(b);
  });

  it('produces different hashes for different inputs', async () => {
    const a = await hashPassword('password1');
    const b = await hashPassword('password2');
    expect(a).not.toBe(b);
  });

  it('handles empty string', async () => {
    const hash = await hashPassword('');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('handles unicode characters', async () => {
    const hash = await hashPassword('pässwörd🌿');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });
});

describe('verifyPassword', () => {
  it('returns true for matching password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('correct', hash)).toBe(true);
  });

  it('returns false for wrong password', async () => {
    const hash = await hashPassword('correct');
    expect(await verifyPassword('wrong', hash)).toBe(false);
  });

  it('returns false for empty password against real hash', async () => {
    const hash = await hashPassword('notempty');
    expect(await verifyPassword('', hash)).toBe(false);
  });
});
