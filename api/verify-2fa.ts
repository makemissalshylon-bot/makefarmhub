import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as speakeasy from 'speakeasy';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { userId, code } = req.body;

    if (!userId || !code) {
      return res.status(400).json({ error: 'User ID and code required' });
    }

    // Get user's 2FA secret
    const { data: twoFactorData } = await supabase
      .from('two_factor_secrets')
      .select('secret, verified')
      .eq('user_id', userId)
      .single();

    if (!twoFactorData) {
      return res.status(404).json({ error: '2FA not configured' });
    }

    // Verify TOTP code
    const verified = speakeasy.totp.verify({
      secret: twoFactorData.secret,
      encoding: 'base32',
      token: code,
      window: 2, // Allow 1 minute time drift
    });

    if (verified && !twoFactorData.verified) {
      // First time verification - mark as verified and enable 2FA
      await supabase
        .from('two_factor_secrets')
        .update({ verified: true })
        .eq('user_id', userId);

      await supabase
        .from('profiles')
        .update({ two_factor_enabled: true })
        .eq('id', userId);
    }

    return res.status(200).json({ verified });
  } catch (error: any) {
    console.error('Verify 2FA error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to verify 2FA',
    });
  }
}
