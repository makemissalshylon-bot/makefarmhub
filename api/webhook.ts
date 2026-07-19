/**
 * Stripe webhook endpoint — canonical URL: /api/webhook
 * Point Stripe Dashboard → Webhooks here.
 */
import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

export const config = {
  api: {
    bodyParser: false,
  },
};

async function buffer(readable: VercelRequest): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of readable) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks);
}

async function notifyUser(
  userId: string,
  title: string,
  message: string,
  link: string
) {
  if (!supabase) return;
  try {
    await supabase.rpc('create_notification', {
      user_id_param: userId,
      type_param: 'payment',
      title_param: title,
      message_param: message,
      link_param: link,
    });
  } catch (err) {
    console.error('[WEBHOOK] Notification failed:', err);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!webhookSecret || !process.env.STRIPE_SECRET_KEY) {
    console.error('[WEBHOOK] Stripe webhook not configured');
    return res.status(500).json({ error: 'Webhook not configured' });
  }

  const buf = await buffer(req);
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(buf, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId, platform } = paymentIntent.metadata || {};

        if (platform && platform !== 'makefarmhub') break;

        const amount = paymentIntent.amount / 100;

        if (supabase && orderId) {
          const { data: order } = await supabase
            .from('orders')
            .select('buyer_id')
            .eq('id', orderId)
            .single();

          if (order?.buyer_id) {
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

            const { data: wallet } = await supabase
              .from('wallets')
              .select('balance')
              .eq('user_id', order.buyer_id)
              .single();

            if (wallet) {
              await supabase
                .from('wallets')
                .update({ balance: Number(wallet.balance) + amount })
                .eq('user_id', order.buyer_id);
            }

            await supabase
              .from('orders')
              .update({ payment_status: 'paid', status: 'confirmed' })
              .eq('id', orderId);

            await notifyUser(
              order.buyer_id,
              'Payment Successful',
              `Your card payment of $${amount.toFixed(2)} has been confirmed.`,
              `/orders/${orderId}`
            );
          }
        } else if (!supabase) {
          console.log(
            `[WEBHOOK] Payment succeeded (no DB): ${paymentIntent.id} order=${orderId} amount=${amount}`
          );
        }

        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { orderId } = paymentIntent.metadata || {};

        if (supabase && orderId) {
          const { data: order } = await supabase
            .from('orders')
            .select('buyer_id')
            .eq('id', orderId)
            .single();

          if (order?.buyer_id) {
            await supabase.from('wallet_transactions').insert({
              user_id: order.buyer_id,
              type: 'deposit',
              amount: paymentIntent.amount / 100,
              status: 'failed',
              description: 'Failed card payment',
              reference: paymentIntent.id,
              metadata: {
                orderId,
                error: paymentIntent.last_payment_error?.message,
              },
            });

            await supabase
              .from('orders')
              .update({ payment_status: 'failed' })
              .eq('id', orderId);

            await notifyUser(
              order.buyer_id,
              'Payment Failed',
              'Your card payment could not be processed. Please try again.',
              `/orders/${orderId}`
            );
          }
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        const paymentIntentId =
          typeof charge.payment_intent === 'string'
            ? charge.payment_intent
            : charge.payment_intent?.id;

        if (supabase && paymentIntentId) {
          const { data: tx } = await supabase
            .from('wallet_transactions')
            .select('user_id, amount, metadata')
            .eq('reference', paymentIntentId)
            .maybeSingle();

          if (tx) {
            const refundAmount = (charge.amount_refunded || 0) / 100;
            await supabase.from('wallet_transactions').insert({
              user_id: tx.user_id,
              type: 'withdrawal',
              amount: refundAmount,
              status: 'completed',
              description: 'Stripe refund',
              reference: `refund_${charge.id}`,
              metadata: { chargeId: charge.id, paymentIntentId },
            });

            const orderId = (tx.metadata as any)?.orderId;
            if (orderId) {
              await supabase
                .from('orders')
                .update({ payment_status: 'refunded' })
                .eq('id', orderId);
            }

            await notifyUser(
              tx.user_id,
              'Refund Processed',
              `A refund of $${refundAmount.toFixed(2)} has been processed.`,
              orderId ? `/orders/${orderId}` : '/wallet'
            );
          }
        }
        console.log(`Charge refunded: ${charge.id}`);
        break;
      }

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute;
        const paymentIntentId =
          typeof dispute.payment_intent === 'string'
            ? dispute.payment_intent
            : dispute.payment_intent?.id;

        if (supabase && paymentIntentId) {
          const { data: tx } = await supabase
            .from('wallet_transactions')
            .select('user_id, metadata')
            .eq('reference', paymentIntentId)
            .maybeSingle();

          const orderId = (tx?.metadata as any)?.orderId;
          if (orderId) {
            await supabase
              .from('orders')
              .update({ payment_status: 'disputed' })
              .eq('id', orderId);
          }

          // Pause escrow-style release by flagging the order; notify admins via log
          console.warn('[WEBHOOK] Dispute created — escrow paused', {
            disputeId: dispute.id,
            orderId,
            amount: dispute.amount / 100,
          });
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('Webhook handler error:', error);
    return res.status(500).json({ error: error.message || 'Webhook handler failed' });
  }
}
