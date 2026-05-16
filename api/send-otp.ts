import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

const OTP_SECRET = process.env.OTP_SECRET || 'makefarmhub-otp-secret-key-2025';
const OTP_EXPIRY_MINUTES = 10;

function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

function createToken(identifier: string, otp: string): string {
  const expiry = Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000;
  const payload = `${identifier}:${otp}:${expiry}`;
  const hmac = crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
  // Base64 encode the payload + hmac
  const token = Buffer.from(JSON.stringify({ identifier, expiry, hmac })).toString('base64');
  return token;
}

async function sendOTPEmail(email: string, otp: string, name?: string): Promise<{ success: boolean; devOTP?: string }> {
  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (!sendgridKey) {
    console.log(`[DEV] OTP for ${email}: ${otp}`);
    return { success: true, devOTP: otp }; // Return OTP for dev mode
  }

  // Use verified sender email from env, or fall back to default
  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@makefarmhub.com';
  const fromName = process.env.SENDGRID_FROM_NAME || 'MakeFarmHub';

  console.log(`[EMAIL] Sending OTP to ${email} via SendGrid`);
  console.log(`[EMAIL] From: ${fromName} <${fromEmail}>`);

  try {
    // Add timeout to prevent hanging
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15 second timeout

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
      body: JSON.stringify({
        personalizations: [{ to: [{ email }] }],
        from: { email: fromEmail, name: fromName },
        subject: `MakeFarmHub Code: ${otp}`,
        content: [
          {
            type: 'text/plain',
            value: `Your MakeFarmHub verification code is: ${otp}\n\nThis code expires in ${OTP_EXPIRY_MINUTES} minutes.\n\nDo not share this code with anyone.\n\n- MakeFarmHub Team`
          },
          {
            type: 'text/html',
            value: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#0a6b2b">🌾 MakeFarmHub</h2><p>Hi${name ? ` ${name}` : ''},</p><p>Your verification code is:</p><div style="background:#f0fdf4;border:2px solid #0a6b2b;border-radius:8px;padding:15px;text-align:center;margin:20px 0"><span style="font-size:28px;font-weight:bold;letter-spacing:4px;color:#0a6b2b">${otp}</span></div><p style="color:#666;font-size:13px">Expires in ${OTP_EXPIRY_MINUTES} minutes. Don't share this code.</p></div>`
          },
        ],
      }),
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[EMAIL] SendGrid error (${response.status}):`, errBody);
      return { success: false };
    }
    console.log(`[EMAIL] Successfully sent OTP to ${email}`);
    return { success: true };
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[EMAIL] SendGrid timeout - request took too long');
    } else {
      console.error('[EMAIL] SendGrid error:', error instanceof Error ? error.message : error);
    }
    return { success: false };
  }
}

// Normalize phone number to international format (+263...)
function normalizePhone(phone: string): string {
  let cleaned = phone.replace(/[\s\-()]/g, '');
  // If starts with 0, assume Zimbabwe and replace with +263
  if (cleaned.startsWith('0')) {
    cleaned = '+263' + cleaned.substring(1);
  }
  // If starts with 263 without +, add +
  if (cleaned.startsWith('263') && !cleaned.startsWith('+')) {
    cleaned = '+' + cleaned;
  }
  // If no country code at all (just digits like 7XXXXXXXX), assume Zimbabwe
  if (!cleaned.startsWith('+') && cleaned.length <= 10) {
    cleaned = '+263' + cleaned;
  }
  return cleaned;
}

async function sendOTPSMS(phone: string, otp: string): Promise<boolean> {
  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    console.warn('[SMS] Africa\'s Talking not configured.');
    console.warn('[SMS] AFRICASTALKING_API_KEY present:', !!apiKey);
    console.warn('[SMS] AFRICASTALKING_USERNAME present:', !!username);
    console.log(`[DEV] OTP for ${phone}: ${otp}`);
    return false;
  }

  // Normalize the phone number
  const normalizedPhone = normalizePhone(phone);

  // Use sandbox URL if username is 'sandbox', otherwise use production
  const isSandbox = username.toLowerCase() === 'sandbox';
  const baseUrl = isSandbox
    ? 'https://api.sandbox.africastalking.com/version1/messaging'
    : 'https://api.africastalking.com/version1/messaging';

  try {
    const message = `MakeFarmHub OTP: ${otp}. Valid for ${OTP_EXPIRY_MINUTES} min. Do not share.`;

    console.log(`[SMS] ===== SMS OTP REQUEST =====`);
    console.log(`[SMS] To: ${normalizedPhone} (original: ${phone})`);
    console.log(`[SMS] Username: ${username}`);
    console.log(`[SMS] Mode: ${isSandbox ? 'SANDBOX' : 'PRODUCTION'}`);
    console.log(`[SMS] URL: ${baseUrl}`);
    console.log(`[SMS] API Key: ${apiKey.substring(0, 10)}...`);

    const params = new URLSearchParams({
      username: username,
      to: normalizedPhone,
      message: message,
    });

    // Add timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000); // 20 second timeout

    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'apiKey': apiKey,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      signal: controller.signal,
      body: params.toString(),
    });

    clearTimeout(timeout);

    const responseText = await response.text();
    console.log(`[SMS] Response Status: ${response.status}`);
    console.log(`[SMS] Response Body:`, responseText);

    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      console.error('[SMS] ❌ Failed to parse response as JSON');
      return false;
    }

    if (!response.ok) {
      console.error(`[SMS] ❌ HTTP ${response.status} error:`, JSON.stringify(data, null, 2));
      return false;
    }

    // Check if any recipient was successful
    const recipients = data.SMSMessageData?.Recipients || [];
    if (recipients.length > 0) {
      const recipient = recipients[0];
      console.log(`[SMS] Recipient:`, JSON.stringify(recipient, null, 2));
      const statusCode = recipient?.statusCode;
      const status = recipient?.status;
      
      // 101 = Sent, 100 = Processed, 102 = Queued
      if (statusCode === 101 || statusCode === 100 || statusCode === 102) {
        console.log(`[SMS] ✅ SUCCESS - Status ${statusCode}: ${status}`);
        return true;
      } else {
        console.error(`[SMS] ❌ FAILED - Status ${statusCode}: ${status}`);
      }
    }

    // Check the message field
    const msgStatus = data.SMSMessageData?.Message || '';
    console.log('[SMS] Overall message status:', msgStatus);
    if (msgStatus.includes('Sent to') && !msgStatus.includes('Sent to 0')) {
      console.log('[SMS] ✅ SUCCESS based on message status');
      return true;
    }

    console.error('[SMS] ❌ Message not sent. Full response:', JSON.stringify(data, null, 2));
    return false;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      console.error('[SMS] ❌ Timeout - Africa\'s Talking API took too long');
    } else {
      console.error('[SMS] ❌ Exception:', error instanceof Error ? error.message : error);
    }
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, phone, name } = req.body || {};

  if (!email && !phone) {
    return res.status(400).json({ error: 'Email or phone number is required' });
  }

  const identifier = email || phone;
  const otp = generateOTP();
  const token = createToken(identifier, otp);

  // Send OTP via email if email is provided
  let devOTP: string | undefined;
  if (email) {
    const result = await sendOTPEmail(email, otp, name);
    if (!result.success) {
      return res.status(500).json({ error: 'Failed to send verification email. Please try again.' });
    }
    devOTP = result.devOTP; // Will be set if SendGrid is not configured
  }

  // Send OTP via SMS if phone is provided (using Africa's Talking)
  if (phone) {
    const sent = await sendOTPSMS(phone, otp);
    if (!sent && !email) {
      // Only fail if SMS was the sole delivery method
      return res.status(500).json({ error: 'Failed to send verification SMS. Please try again.' });
    }
    // In dev mode without SMS, show OTP
    if (!sent) {
      devOTP = otp;
    }
  }

  return res.status(200).json({
    success: true,
    token,
    message: email
      ? `Verification code sent to ${email}`
      : `Verification code sent to ${phone}`,
    ...(devOTP && { devOTP }), // Include devOTP in response if available
  });
}
