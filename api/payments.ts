import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  try {
    switch (action) {
      case 'create-intent':
        return handleCreateIntent(req, res);
      case 'confirm':
        return handleConfirm(req, res);
      case 'refund':
        return handleRefund(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action parameter' });
    }
  } catch (error) {
    console.error('[PAYMENTS] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function getStripe() {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) return null;
  const Stripe = (await import('stripe')).default;
  return new Stripe(stripeKey, { apiVersion: '2023-10-16' });
}

async function handleCreateIntent(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { amount, currency = 'usd', orderId, customerEmail, description } = req.body || {};

  if (!amount || amount <= 0) {
    return res.status(400).json({ error: 'Valid amount is required' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(Number(amount) * 100),
      currency: String(currency).toLowerCase(),
      description: description || `MAKEFARMHUB payment${orderId ? ` #${orderId}` : ''}`,
      receipt_email: customerEmail || undefined,
      metadata: {
        platform: 'makefarmhub',
        orderId: orderId || '',
      },
      automatic_payment_methods: { enabled: true },
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.error('[STRIPE] Error creating payment intent:', error);
    return res.status(500).json({ error: 'Failed to create payment intent' });
  }
}

async function handleConfirm(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId } = req.body || {};

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Payment intent ID is required' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({
        success: false,
        status: paymentIntent.status,
        paymentIntentId,
        error: `Payment not completed (status: ${paymentIntent.status})`,
      });
    }

    return res.status(200).json({
      success: true,
      status: paymentIntent.status,
      paymentIntentId: paymentIntent.id,
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency,
      orderId: paymentIntent.metadata?.orderId || null,
    });
  } catch (error) {
    console.error('[STRIPE] Error confirming payment:', error);
    return res.status(500).json({ error: 'Failed to confirm payment' });
  }
}

async function handleRefund(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { paymentIntentId, amount } = req.body || {};

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Payment intent ID is required' });
  }

  const stripe = await getStripe();
  if (!stripe) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(Number(amount) * 100) : undefined,
    });

    return res.status(200).json({
      success: true,
      refundId: refund.id,
      status: refund.status,
    });
  } catch (error) {
    console.error('[STRIPE] Error creating refund:', error);
    return res.status(500).json({ error: 'Failed to create refund' });
  }
}
