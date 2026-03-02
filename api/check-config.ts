import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const config = {
    sendgrid: {
      apiKey: !!process.env.SENDGRID_API_KEY,
      fromEmail: process.env.SENDGRID_FROM_EMAIL || '(not set)',
      fromName: process.env.SENDGRID_FROM_NAME || '(not set)',
    },
    africastalking: {
      apiKey: !!process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME || '(not set)',
      mode: process.env.AFRICASTALKING_USERNAME?.toLowerCase() === 'sandbox' ? 'SANDBOX' : 'PRODUCTION',
    },
    stripe: {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
    },
    paynow: {
      integrationId: !!process.env.PAYNOW_INTEGRATION_ID,
      integrationKey: !!process.env.PAYNOW_INTEGRATION_KEY,
      mode: process.env.PAYNOW_INTEGRATION_ID ? 'CONFIGURED' : 'NOT_CONFIGURED',
    },
    supabase: {
      url: !!process.env.VITE_SUPABASE_URL,
      anonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
    },
    otpSecret: !!process.env.OTP_SECRET,
  };

  return res.status(200).json({ status: 'ok', config });
}
