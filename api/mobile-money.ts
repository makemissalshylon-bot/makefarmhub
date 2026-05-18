import type { VercelRequest, VercelResponse } from '@vercel/node';

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
  const { amount, phone, email } = req.body;
  
  if (!amount || !phone) {
    return res.status(400).json({ error: 'Amount and phone number required' });
  }

  return res.status(200).json({
    success: true,
    message: 'Mobile money payment initiated',
    pollUrl: `/api/mobile-money?action=status`,
  });
}

async function handlePayment(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ success: true, message: 'Payment processed' });
}

async function handleStatus(req: VercelRequest, res: VercelResponse) {
  const { pollUrl } = req.query;
  return res.status(200).json({ 
    status: 'completed',
    success: true 
  });
}

async function handleVerify(req: VercelRequest, res: VercelResponse) {
  return res.status(200).json({ verified: true });
}

async function handleWebhook(req: VercelRequest, res: VercelResponse) {
  console.log('[MOBILE-MONEY] Webhook received:', req.body);
  return res.status(200).json({ received: true });
}
