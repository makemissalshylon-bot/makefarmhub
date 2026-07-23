import type { VercelRequest, VercelResponse } from '@vercel/node';
// @ts-ignore - speakeasy ships no type declarations
import speakeasy from 'speakeasy';
// @ts-ignore - qrcode ships no type declarations
import QRCode from 'qrcode';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    switch (action) {
      case 'enable':
        return handleEnable2FA(req, res);
      case 'verify':
        return handleVerify2FA(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('[2FA] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleEnable2FA(req: VercelRequest, res: VercelResponse) {
  const { userId, email } = req.body;

  if (!userId || !email) {
    return res.status(400).json({ error: 'User ID and email required' });
  }

  const secret = speakeasy.generateSecret({
    name: `MakeFarmHub (${email})`,
    issuer: 'MakeFarmHub',
  });

  const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url || '');

  return res.status(200).json({
    success: true,
    secret: secret.base32,
    qrCode: qrCodeUrl,
  });
}

async function handleVerify2FA(req: VercelRequest, res: VercelResponse) {
  const { secret, token } = req.body;

  if (!secret || !token) {
    return res.status(400).json({ error: 'Secret and token required' });
  }

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2,
  });

  if (!verified) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  return res.status(200).json({
    success: true,
    message: '2FA verified successfully',
  });
}
