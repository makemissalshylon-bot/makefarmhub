import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const { phone, userId } = req.body;

    if (!phone || !userId) {
      return res.status(400).json({ error: 'Phone and userId required' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Store OTP in database
    const { error: dbError } = await supabase
      .from('verification_tokens')
      .insert({
        user_id: userId,
        token: otp,
        type: 'phone_otp',
        expires_at: expiresAt.toISOString(),
        metadata: { phone },
      });

    if (dbError) throw dbError;

    // Send SMS via Africa's Talking
    if (process.env.AFRICASTALKING_API_KEY) {
      await sendSMS(phone, otp);
    } else {
      console.log('OTP (no SMS service configured):', otp, 'for phone:', phone);
    }

    return res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // In dev mode, return OTP for testing
      ...(process.env.NODE_ENV === 'development' && { otp }),
    });
  } catch (error: any) {
    console.error('Send OTP error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send OTP',
    });
  }
}

async function sendSMS(phone: string, otp: string) {
  try {
    const AfricasTalking = await import('africastalking');
    const africastalking = AfricasTalking.default({
      apiKey: process.env.AFRICASTALKING_API_KEY || '',
      username: process.env.AFRICASTALKING_USERNAME || 'sandbox',
    });

    const sms = africastalking.SMS;
    const result = await sms.send({
      to: [phone],
      message: `Your MAKEFARMHUB verification code is: ${otp}. Valid for 10 minutes. Do not share this code.`,
      from: 'MAKEFARMHUB',
    });

    console.log('SMS sent:', result);
  } catch (error) {
    console.error('SMS send failed:', error);
    throw error;
  }
}
