import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: any) {
  const chunks = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId, platform } = paymentIntent.metadata;

        if (platform !== 'makefarmhub') break;

        // Record successful payment in Supabase
        const amount = paymentIntent.amount / 100; // Convert from cents
        
        // Get order details to find buyer
        const { data: order } = await supabase
          .from('orders')
          .select('buyer_id')
          .eq('id', orderId)
          .single();

        if (order) {
          // Record transaction
          await supabase.from('wallet_transactions').insert({
            user_id: order.buyer_id,
            type: 'deposit',
            amount,
            status: 'completed',
            description: 'Card payment via Stripe',
            reference: paymentIntent.id,
            metadata: {
              orderId,
              paymentMethod: 'card',
              currency: paymentIntent.currency,
            },
          });

          // Update wallet balance
          const { data: wallet } = await supabase
            .from('wallets')
            .select('balance')
            .eq('user_id', order.buyer_id)
            .single();

          if (wallet) {
            await supabase
              .from('wallets')
              .update({ balance: wallet.balance + amount })
              .eq('user_id', order.buyer_id);
          }

          // Update order payment status
          await supabase
            .from('orders')
            .update({ payment_status: 'paid' })
            .eq('id', orderId);

          // Notify user
          await supabase.rpc('create_notification', {
            user_id_param: order.buyer_id,
            type_param: 'payment',
            title_param: 'Payment Successful',
            message_param: `Your card payment of $${amount.toFixed(2)} has been confirmed.`,
            link_param: `/orders/${orderId}`,
          });
        }

        console.log(`Payment succeeded: ${paymentIntent.id}`);
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId } = paymentIntent.metadata;

        // Get order to find buyer
        const { data: order } = await supabase
          .from('orders')
          .select('buyer_id')
          .eq('id', orderId)
          .single();

        if (order) {
          // Record failed transaction
          await supabase.from('wallet_transactions').insert({
            user_id: order.buyer_id,
            type: 'deposit',
            amount: paymentIntent.amount / 100,
            status: 'failed',
            description: 'Failed card payment',
            reference: paymentIntent.id,
            metadata: { orderId, error: paymentIntent.last_payment_error?.message },
          });

          // Notify user
          await supabase.rpc('create_notification', {
            user_id_param: order.buyer_id,
            type_param: 'payment',
            title_param: 'Payment Failed',
            message_param: 'Your card payment could not be processed. Please try again.',
            link_param: `/orders/${orderId}`,
          });
        }

        console.log(`Payment failed: ${paymentIntent.id}`);
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Handle refund logic
        console.log(`Charge refunded: ${charge.id}`);
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message });
  }
}
