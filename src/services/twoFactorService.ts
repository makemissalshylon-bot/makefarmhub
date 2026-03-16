/**
 * Two-Factor Authentication Service
 * TOTP-based 2FA implementation
 */

import { supabase } from '../lib/supabase';

export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export const twoFactorService = {
  /**
   * Enable 2FA for user
   */
  async enable(userId: string): Promise<TwoFactorSetup> {
    const response = await fetch('/api/enable-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      throw new Error('Failed to enable 2FA');
    }

    return response.json();
  },

  /**
   * Verify 2FA setup with TOTP code
   */
  async verifySetup(userId: string, code: string): Promise<boolean> {
    const response = await fetch('/api/verify-2fa-setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });

    if (!response.ok) {
      return false;
    }

    const { verified } = await response.json();
    return verified;
  },

  /**
   * Disable 2FA for user
   */
  async disable(userId: string, password: string): Promise<boolean> {
    const response = await fetch('/api/disable-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to disable 2FA');
    }

    return true;
  },

  /**
   * Verify 2FA code during login
   */
  async verify(userId: string, code: string): Promise<boolean> {
    const response = await fetch('/api/verify-2fa', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });

    if (!response.ok) {
      return false;
    }

    const { verified } = await response.json();
    return verified;
  },

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId: string, code: string): Promise<boolean> {
    const response = await fetch('/api/verify-backup-code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, code }),
    });

    if (!response.ok) {
      return false;
    }

    const { verified } = await response.json();
    return verified;
  },

  /**
   * Check if user has 2FA enabled
   */
  async isEnabled(userId: string): Promise<boolean> {
    try {
      const { data } = await supabase
        .from('profiles')
        .select('two_factor_enabled')
        .eq('id', userId)
        .single();

      return data?.two_factor_enabled || false;
    } catch {
      return false;
    }
  },

  /**
   * Generate new backup codes
   */
  async regenerateBackupCodes(userId: string, password: string): Promise<string[]> {
    const response = await fetch('/api/regenerate-backup-codes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, password }),
    });

    if (!response.ok) {
      throw new Error('Failed to regenerate backup codes');
    }

    const { backupCodes } = await response.json();
    return backupCodes;
  },
};
