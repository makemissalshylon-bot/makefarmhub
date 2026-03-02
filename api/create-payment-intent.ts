import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Check for Stripe key
  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(503).json({
      error: 'Stripe is not configured. Set STRIPE_SECRET_KEY environment variable.',
    });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const { amount, currency = 'usd', orderId, customerEmail, description } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100),
      currency: currency.toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata: { orderId, platform: 'makefarmhub' },
      receipt_email: customerEmail,
      description: description || `MAKEFARMHUB Order #${orderId}`,
    });

    return res.status(200).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error: any) {
    console.error('Stripe Error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to create payment intent',
    });
  }
}
