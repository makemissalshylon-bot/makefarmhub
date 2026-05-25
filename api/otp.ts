import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey) : null;

interface OTPRecord {
  identifier: string;
  otp: string;
  expires_at: string;
  token?: string;
}

// In-memory storage fallback when Supabase is not configured
const otpStore = new Map<string, OTPRecord>();

async function sendOTPEmail(email: string, otp: string, name?: string): Promise<{ success: boolean; devOTP?: string }> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  
  if (!sendgridKey) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return { success: true, devOTP: otp };
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email }],
          subject: 'Your MakeFarmHub Verification Code',
        }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@makefarmhub.com',
          name: process.env.SENDGRID_FROM_NAME || 'MakeFarmHub',
        },
        content: [{
          type: 'text/html',
          value: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2>Verify Your Account</h2>
              <p>Hi ${name || 'there'},</p>
              <p>Your verification code is:</p>
              <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #22c55e;">
                ${otp}
              </div>
              <p style="color: #6b7280; font-size: 14px;">This code expires in 10 minutes.</p>
              <p>If you didn't request this code, please ignore this email.</p>
            </div>
          `,
        }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[EMAIL] SendGrid error (${response.status}):`, errBody);
      return { success: false };
    }

    console.log(`[EMAIL] Successfully sent OTP to ${email}`);
    return { success: true };
  } catch (error) {
    console.error('[EMAIL] Error sending:', error);
    return { success: false };
  }
}

async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    console.log(`[DEV] SMS OTP for ${phone}: ${otp}`);
    return false;
  }

  try {
    const africastalking = await import('africastalking');
    const client = africastalking.default({ apiKey, username });
    
    const result = await client.SMS.send({
      to: [phone],
      message: `Your MakeFarmHub verification code is: ${otp}. Valid for 10 minutes.`,
    });

    console.log('[SMS] Sent successfully:', result);
    return true;
  } catch (error) {
    console.error('[SMS] Error sending:', error);
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    switch (action) {
      case 'send':
        return handleSendOTP(req, res);
      case 'verify':
        return handleVerifyOTP(req, res);
      default:
        return handleSendOTP(req, res);
    }
  } catch (error) {
    console.error('[OTP] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSendOTP(req: VercelRequest, res: VercelResponse) {
  const { email, phone, name } = req.body;

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone number is required' });
  }

  const otp = crypto.randomInt(100000, 999999).toString();
  const token = crypto.randomBytes(32).toString('hex');
  const identifier = email || phone;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // Store OTP - use Supabase if available, otherwise use in-memory store
  if (supabase) {
    try {
      const { error } = await supabase
        .from('otp_verifications')
        .upsert({
          identifier,
          otp,
          token,
          expires_at: expiresAt,
          created_at: new Date().toISOString(),
        }, { onConflict: 'identifier' });

      if (error) {
        console.error('[OTP] Database error:', error);
        // Fall back to in-memory
        otpStore.set(token, { identifier, otp, expires_at: expiresAt, token });
      }
    } catch (err) {
      console.error('[OTP] Supabase error:', err);
      // Fall back to in-memory
      otpStore.set(token, { identifier, otp, expires_at: expiresAt, token });
    }
  } else {
    // Use in-memory store
    otpStore.set(token, { identifier, otp, expires_at: expiresAt, token });
    console.log('[OTP] Using in-memory storage (Supabase not configured)');
  }

  let devOTP: string | undefined;

  if (email) {
    const result = await sendOTPEmail(email, otp, name);
    devOTP = result.devOTP;
    // Don't fail if email doesn't send - still return token
  }

  if (phone) {
    const sent = await sendOTPSMS(phone, otp);
    if (!sent) {
      devOTP = otp; // Show OTP if SMS fails
    }
  }

  return res.status(200).json({
    success: true,
    token,
    message: email
      ? `Verification code sent to ${email}`
      : `Verification code sent to ${phone}`,
    ...(devOTP && { devOTP }),
  });
}

async function handleVerifyOTP(req: VercelRequest, res: VercelResponse) {
  const { token, otp } = req.body;

  if (!token || !otp) {
    return res.status(400).json({ error: 'Token and OTP are required' });
  }

  let record: OTPRecord | null = null;

  // Try Supabase first, then fall back to in-memory
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from('otp_verifications')
        .select('*')
        .eq('token', token)
        .single();

      if (!error && data) {
        record = data as OTPRecord;
      }
    } catch (err) {
      console.error('[OTP] Supabase verify error:', err);
    }
  }

  // Fall back to in-memory store
  if (!record) {
    record = otpStore.get(token) || null;
  }

  if (!record) {
    return res.status(400).json({ error: 'Invalid or expired verification code' });
  }

  if (new Date(record.expires_at) < new Date()) {
    // Clean up expired record
    if (supabase) {
      await supabase.from('otp_verifications').delete().eq('token', token).catch(() => {});
    }
    otpStore.delete(token);
    return res.status(400).json({ error: 'Verification code has expired' });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ error: 'Invalid verification code' });
  }

  // Delete used OTP
  if (supabase) {
    await supabase.from('otp_verifications').delete().eq('token', token).catch(() => {});
  }
  otpStore.delete(token);

  return res.status(200).json({
    success: true,
    identifier: record.identifier,
    message: 'Verification successful',
  });
}
