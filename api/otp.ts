import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Enable body parsing for Vercel serverless function
export const config = {
  api: {
    bodyParser: true,
  },
};

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Only create Supabase client if we have valid credentials
let supabase: any = null;
try {
  if (supabaseUrl && supabaseKey && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'))) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[OTP] Supabase client initialized');
  } else {
    console.log('[OTP] Supabase not configured - using in-memory storage');
  }
} catch (err) {
  console.error('[OTP] Failed to initialize Supabase client:', err);
  supabase = null;
}

interface OTPRecord {
  identifier: string;
  otp: string;
  expires_at: string;
  token?: string;
}

// In-memory storage fallback when Supabase is not configured
const otpStore = new Map<string, OTPRecord>();

async function sendOTPEmail(email: string, otp: string, name?: string): Promise<{ success: boolean; devOTP?: string }> {
  const resendKey = process.env.RESEND_API_KEY;
  
  if (!resendKey) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return { success: true, devOTP: otp };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MakeFarmHub <onboarding@resend.dev>',
        to: [email],
        subject: 'Your MakeFarmHub Verification Code',
        html: `
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
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[EMAIL] Resend error (${response.status}):`, errBody);
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
    // Use Africa's Talking REST API directly instead of SDK to avoid import issues
    const response = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/x-www-form-urlencoded',
        'apiKey': apiKey,
      },
      body: new URLSearchParams({
        username: username,
        to: phone,
        message: `Your MakeFarmHub verification code is: ${otp}. Valid for 10 minutes.`,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[SMS] Africa\'s Talking error:', errText);
      return false;
    }

    const result = await response.json();
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

  // Validate request body exists
  if (!req.body) {
    console.error('[OTP] No request body');
    return res.status(400).json({ error: 'Request body is required' });
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
  } catch (error: any) {
    console.error('[OTP] Handler error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      details: error.message 
    });
  }
}

async function handleSendOTP(req: VercelRequest, res: VercelResponse) {
  try {
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
  } catch (error: any) {
    console.error('[OTP] handleSendOTP error:', error);
    return res.status(500).json({ 
      error: 'Failed to send OTP', 
      details: error.message || 'Unknown error' 
    });
  }
}

async function handleVerifyOTP(req: VercelRequest, res: VercelResponse) {
  try {
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
  } catch (error: any) {
    console.error('[OTP] handleVerifyOTP error:', error);
    return res.status(500).json({ 
      error: 'Failed to verify OTP', 
      details: error.message || 'Unknown error' 
    });
  }
}
