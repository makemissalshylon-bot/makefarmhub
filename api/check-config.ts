import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Public readiness probe — booleans only, never secrets.
 * GET /api/check-config
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  const config = {
    sendgrid: {
      apiKey: !!process.env.SENDGRID_API_KEY,
      fromEmail: !!process.env.SENDGRID_FROM_EMAIL,
      fromName: process.env.SENDGRID_FROM_NAME || null,
    },
    resend: {
      apiKey: !!process.env.RESEND_API_KEY,
    },
    africastalking: {
      apiKey: !!process.env.AFRICASTALKING_API_KEY,
      username: !!process.env.AFRICASTALKING_USERNAME,
      mode: process.env.AFRICASTALKING_USERNAME?.toLowerCase() === 'sandbox' ? 'SANDBOX' : 'PRODUCTION',
    },
    stripe: {
      secretKey: !!process.env.STRIPE_SECRET_KEY,
      publishableKey: !!process.env.VITE_STRIPE_PUBLISHABLE_KEY,
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    },
    mobileMoney: {
      ecocash: !!process.env.ECOCASH_API_KEY,
      onemoney: !!process.env.ONEMONEY_API_KEY,
      innbucks: !!process.env.INNBUCKS_API_KEY,
      telecash: !!process.env.TELECASH_API_KEY,
    },
    supabase: {
      url: !!process.env.VITE_SUPABASE_URL,
      anonKey: !!process.env.VITE_SUPABASE_ANON_KEY,
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    },
    otpSecret: !!process.env.OTP_SECRET,
  };

  const paymentsReady = config.stripe.secretKey && config.stripe.publishableKey;
  const webhooksReady = paymentsReady && config.stripe.webhookSecret;
  const emailReady = config.resend.apiKey || config.sendgrid.apiKey;
  const dbReady = config.supabase.url && config.supabase.anonKey;

  return res.status(200).json({
    status: 'ok',
    ready: {
      database: dbReady,
      payments: paymentsReady,
      webhooks: webhooksReady,
      email: emailReady,
      sms: config.africastalking.apiKey,
    },
    config,
  });
}
