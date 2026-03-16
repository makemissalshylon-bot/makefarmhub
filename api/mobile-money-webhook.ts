import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const {
      provider, // 'ecocash', 'onemoney', 'telecash'
      transactionRef,
      amount,
      userId,
      orderId,
      status, // 'success', 'failed', 'pending'
      phoneNumber,
    } = req.body;

    // Validate webhook signature (implement based on provider)
    // const isValid = validateWebhookSignature(req.headers, req.body);
    // if (!isValid) {
    //   return res.status(401).json({ error: 'Invalid signature' });
    // }

    if (!transactionRef || !amount || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Record transaction in Supabase
    if (status === 'success') {
      const { data, error } = await supabase
        .from('wallet_transactions')
        .insert({
          user_id: userId,
          type: 'deposit',
          amount: parseFloat(amount),
          status: 'completed',
          description: `Deposit via ${provider}`,
          reference: transactionRef,
          metadata: {
            provider,
            phoneNumber,
            orderId,
            webhookReceived: new Date().toISOString(),
          },
        })
        .select()
        .single();

      if (error) throw error;

      // Update wallet balance
      await supabase.rpc('transfer_funds', {
        from_user_id: userId,
        to_user_id: userId,
        amount: parseFloat(amount),
        description: `${provider} deposit`,
      });

      // Create notification
      await supabase.rpc('create_notification', {
        user_id_param: userId,
        type_param: 'payment',
        title_param: 'Payment Received',
        message_param: `Your ${provider} payment of $${amount} has been confirmed.`,
        link_param: '/wallet',
      });

      return res.status(200).json({
        success: true,
        transactionId: data.id,
        message: 'Payment processed successfully',
      });
    } else if (status === 'failed') {
      // Record failed transaction
      await supabase.from('wallet_transactions').insert({
        user_id: userId,
        type: 'deposit',
        amount: parseFloat(amount),
        status: 'failed',
        description: `Failed ${provider} deposit`,
        reference: transactionRef,
        metadata: { provider, phoneNumber, orderId },
      });

      // Notify user of failure
      await supabase.rpc('create_notification', {
        user_id_param: userId,
        type_param: 'payment',
        title_param: 'Payment Failed',
        message_param: `Your ${provider} payment could not be processed. Please try again.`,
        link_param: '/wallet',
      });

      return res.status(200).json({
        success: false,
        message: 'Payment failed',
      });
    }

    return res.status(200).json({ success: true, status: 'pending' });
  } catch (error: any) {
    console.error('Mobile Money Webhook Error:', error);
    return res.status(500).json({
      error: error.message || 'Webhook processing failed',
    });
  }
}
