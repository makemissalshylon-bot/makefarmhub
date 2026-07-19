import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';

/** In-memory pending payments (serverless-friendly fallback when no provider keys). */
const pendingPayments = new Map<string, {
  id: string;
  amount: number;
  phone: string;
  provider: string;
  status: 'pending' | 'pending_verification' | 'completed' | 'failed';
  reference?: string;
  createdAt: string;
}>();

function getProviderKey(provider?: string): string | undefined {
  const p = (provider || '').toLowerCase();
  if (p.includes('eco')) return process.env.ECOCASH_API_KEY;
  if (p.includes('one')) return process.env.ONEMONEY_API_KEY;
  if (p.includes('inn')) return process.env.INNBUCKS_API_KEY;
  if (p.includes('tele')) return process.env.TELECASH_API_KEY;
  return (
    process.env.ECOCASH_API_KEY ||
    process.env.ONEMONEY_API_KEY ||
    process.env.INNBUCKS_API_KEY ||
    process.env.TELECASH_API_KEY
  );
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'initiate':
        return handleInitiate(req, res);
      case 'payment':
        return handlePayment(req, res);
      case 'status':
        return handleStatus(req, res);
      case 'verify':
        return handleVerify(req, res);
      case 'webhook':
        return handleWebhook(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('[MOBILE-MONEY] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleInitiate(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, phone, provider = 'ecocash', email } = req.body || {};

  if (!amount || !phone) {
    return res.status(400).json({ error: 'Amount and phone number required' });
  }

  const paymentId = randomUUID();
  const record = {
    id: paymentId,
    amount: Number(amount),
    phone: String(phone),
    provider: String(provider),
    status: 'pending' as const,
    createdAt: new Date().toISOString(),
  };
  pendingPayments.set(paymentId, record);

  const providerKey = getProviderKey(provider);
  if (!providerKey) {
    return res.status(200).json({
      success: true,
      paymentId,
      status: 'pending',
      mode: 'manual',
      message:
        'Mobile money provider not configured. Complete payment via USSD, then submit your SMS reference for verification.',
      pollUrl: `/api/mobile-money?action=status&paymentId=${paymentId}`,
      email: email || undefined,
    });
  }

  // Provider keys present but live STK/push APIs are not wired yet.
  // Keep payment pending until webhook or verify confirms.
  return res.status(200).json({
    success: true,
    paymentId,
    status: 'pending',
    mode: 'provider',
    message: 'Payment initiated. Awaiting provider confirmation.',
    pollUrl: `/api/mobile-money?action=status&paymentId=${paymentId}`,
  });
}

async function handlePayment(req: VercelRequest, res: VercelResponse) {
  return res.status(400).json({
    error: 'Use action=initiate then action=verify with a transaction reference',
  });
}

async function handleStatus(req: VercelRequest, res: VercelResponse) {
  const paymentId = (req.query.paymentId || req.query.pollUrl) as string | undefined;

  if (!paymentId || typeof paymentId !== 'string') {
    return res.status(400).json({ error: 'paymentId is required' });
  }

  // Support pollUrl that embeds paymentId
  const id = paymentId.includes('paymentId=')
    ? new URL(paymentId, 'http://localhost').searchParams.get('paymentId') || paymentId
    : paymentId;

  const record = pendingPayments.get(id);
  if (!record) {
    return res.status(404).json({ error: 'Payment not found', status: 'unknown' });
  }

  return res.status(200).json({
    paymentId: record.id,
    status: record.status,
    success: record.status === 'completed',
    reference: record.reference,
  });
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, reference, provider, amount, phone } = req.body || {};

  if (!reference || String(reference).trim().length < 4) {
    return res.status(400).json({
      verified: false,
      error: 'Valid transaction reference is required',
    });
  }

  const providerKey = getProviderKey(provider);

  // Without a live provider API we cannot confirm funds — mark for manual review.
  if (!providerKey) {
    if (paymentId && pendingPayments.has(paymentId)) {
      const existing = pendingPayments.get(paymentId)!;
      existing.status = 'pending_verification';
      existing.reference = String(reference).trim();
      pendingPayments.set(paymentId, existing);
    }

    return res.status(200).json({
      verified: false,
      status: 'pending_verification',
      reference: String(reference).trim(),
      paymentId: paymentId || null,
      message:
        'Reference recorded. Payment will be confirmed after manual or provider verification. Funds are not released yet.',
      amount: amount ?? null,
      phone: phone ?? null,
    });
  }

  // Keys exist but provider verify APIs are not integrated — do not fake success.
  return res.status(501).json({
    verified: false,
    status: 'pending',
    error: 'Provider verification API not yet integrated',
    reference: String(reference).trim(),
  });
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentId, status, reference } = req.body || {};
  console.log('[MOBILE-MONEY] Webhook received:', { paymentId, status, reference });

  if (paymentId && pendingPayments.has(paymentId)) {
    const record = pendingPayments.get(paymentId)!;
    if (status === 'completed' || status === 'success') {
      record.status = 'completed';
    } else if (status === 'failed') {
      record.status = 'failed';
    }
    if (reference) record.reference = String(reference);
    pendingPayments.set(paymentId, record);
  }

  return res.status(200).json({ received: true });
}
