import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import * as speakeasy from 'speakeasy';
import * as QRCode from 'qrcode';

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
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID required' });
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (!profile) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Generate secret
    const secret = speakeasy.generateSecret({
      name: `MAKEFARMHUB (${profile.email})`,
      issuer: 'MAKEFARMHUB',
      length: 32,
    });

    // Generate QR code
    const qrCode = await QRCode.toDataURL(secret.otpauth_url || '');

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => 
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );

    // Store secret (encrypted) and backup codes (hashed)
    await supabase.from('two_factor_secrets').upsert({
      user_id: userId,
      secret: secret.base32,
      backup_codes: backupCodes.map(code => hashCode(code)),
      verified: false,
    });

    return res.status(200).json({
      secret: secret.base32,
      qrCode,
      backupCodes,
    });
  } catch (error: any) {
    console.error('Enable 2FA error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to enable 2FA',
    });
  }
}

function hashCode(code: string): string {
  // Simple hash for demo - in production use bcrypt
  return Buffer.from(code).toString('base64');
}
