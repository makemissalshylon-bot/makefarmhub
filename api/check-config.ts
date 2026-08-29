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
      fromEmail: process.env.SENDGRID_FROM_EMAIL || null,
      fromName: process.env.SENDGRID_FROM_NAME || null,
    },
    resend: {
      apiKey: !!process.env.RESEND_API_KEY,
    },
    africastalking: {
      apiKey: !!process.env.AFRICASTALKING_API_KEY,
      username: process.env.AFRICASTALKING_USERNAME || null,
      mode: process.env.AFRICASTALKING_USERNAME?.toLowerCase() === 'sandbox' ? 'SANDBOX' : 'PRODUCTION',
    },
    stripe: {
      secretKey: !!process.env.STRIPE_SECRET_KEY?.trim(),
      publishableKey: !!(
        process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ||
        process.env.STRIPE_PUBLISHABLE_KEY?.trim()
      ),
      webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET?.trim(),
    },
    mobileMoney: {
      ecocash: !!process.env.ECOCASH_API_KEY,
      onemoney: !!process.env.ONEMONEY_API_KEY,
      innbucks: !!process.env.INNBUCKS_API_KEY,
      telecash: !!process.env.TELECASH_API_KEY,
      note: 'Paynow not required for soft launch — use Stripe cards + manual EcoCash refs',
    },
    supabase: {
      url: !!(process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL),
      anonKey: !!(
        process.env.VITE_SUPABASE_ANON_KEY?.trim() ||
        process.env.SUPABASE_ANON_KEY?.trim()
      ),
      serviceRole: !!process.env.SUPABASE_SERVICE_ROLE_KEY?.trim(),
    },
    otpSecret: !!process.env.OTP_SECRET,
  };

  const paymentsReady = config.stripe.secretKey && config.stripe.publishableKey;
  const webhooksReady = paymentsReady && config.stripe.webhookSecret;
  const emailReady = config.resend.apiKey || config.sendgrid.apiKey;
  const dbReady = config.supabase.url && config.supabase.anonKey;

  return res.status(200).json({
    status: 'ok',
    // If you do not see this field on live, production is still an old deploy.
    codeVersion: 'mfh-2026-08-29-keys',
    ready: {
      database: dbReady,
      payments: paymentsReady,
      webhooks: webhooksReady,
      email: emailReady,
      sms: config.africastalking.apiKey,
    },
    nextSteps: [
      !config.supabase.anonKey && 'Add VITE_SUPABASE_ANON_KEY in Vercel → Redeploy',
      !config.stripe.secretKey && 'Add STRIPE_SECRET_KEY in Vercel → Redeploy',
      !config.stripe.publishableKey && 'Add VITE_STRIPE_PUBLISHABLE_KEY in Vercel → Redeploy',
      !config.stripe.webhookSecret &&
        'Add Stripe webhook → https://makefarmhub-eosin.vercel.app/api/webhook → STRIPE_WEBHOOK_SECRET',
      !config.sendgrid.fromName && config.sendgrid.apiKey && 'Optional: SENDGRID_FROM_NAME=MakeFarmHub',
    ].filter(Boolean),
    config,
  });
}
