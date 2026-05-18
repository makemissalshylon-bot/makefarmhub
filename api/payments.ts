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

async function handleCreateIntent(req: VercelRequest, res: VercelResponse) {
  const { amount, currency = 'usd' } = req.body;

  if (!amount) {
    return res.status(400).json({ error: 'Amount is required' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency,
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
  const { paymentIntentId } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Payment intent ID is required' });
  }

  return res.status(200).json({
    success: true,
    status: 'confirmed',
    paymentIntentId,
  });
}

async function handleRefund(req: VercelRequest, res: VercelResponse) {
  const { paymentIntentId, amount } = req.body;

  if (!paymentIntentId) {
    return res.status(400).json({ error: 'Payment intent ID is required' });
  }

  const stripeKey = process.env.STRIPE_SECRET_KEY;

  if (!stripeKey) {
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  try {
    const Stripe = (await import('stripe')).default;
    const stripe = new Stripe(stripeKey, { apiVersion: '2024-11-20.acacia' });

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
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
