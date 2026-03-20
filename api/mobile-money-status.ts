import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

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
    const { transactionRef, provider } = req.body;

    if (!transactionRef || !provider) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check status from provider
    let status;
    
    switch (provider) {
      case 'ecocash':
        status = await checkEcoCashStatus(transactionRef);
        break;
      case 'onemoney':
        status = await checkOneMoneyStatus(transactionRef);
        break;
      case 'innbucks':
        status = await checkInnBucksStatus(transactionRef);
        break;
      case 'telecash':
        status = await checkTelecashStatus(transactionRef);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    // Update transaction in database if completed
    if (status.status === 'success' || status.status === 'failed') {
      await supabase
        .from('wallet_transactions')
        .update({
          status: status.status === 'success' ? 'completed' : 'failed',
          metadata: {
            completedAt: new Date().toISOString(),
            providerResponse: status,
          },
        })
        .eq('reference', transactionRef);
    }

    return res.status(200).json(status);
  } catch (error: any) {
    console.error('Mobile money status check error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to check payment status',
    });
  }
}

async function checkEcoCashStatus(ref: string) {
  const apiKey = process.env.ECOCASH_API_KEY;
  
  if (!apiKey) {
    // Demo mode - simulate random success/pending
    const random = Math.random();
    if (random > 0.7) {
      return {
        status: 'success',
        transactionRef: ref,
        message: 'Payment completed successfully',
        timestamp: new Date().toISOString(),
      };
    }
    return {
      status: 'pending',
      message: 'Awaiting user confirmation',
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`https://api.ecocash.co.zw/v1/payments/${ref}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  const data = await response.json();
  
  return {
    status: data.status === 'COMPLETED' ? 'success' : data.status === 'FAILED' ? 'failed' : 'pending',
    transactionRef: ref,
    message: data.message,
    timestamp: new Date().toISOString(),
  };
}

async function checkOneMoneyStatus(ref: string) {
  const apiKey = process.env.ONEMONEY_API_KEY;
  
  if (!apiKey) {
    const random = Math.random();
    return random > 0.7 ? {
      status: 'success',
      transactionRef: ref,
      message: 'Payment completed',
      timestamp: new Date().toISOString(),
    } : {
      status: 'pending',
      message: 'Processing',
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`https://api.onemoney.co.zw/v1/transactions/${ref}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  const data = await response.json();
  
  return {
    status: data.status === 'SUCCESS' ? 'success' : data.status === 'FAILED' ? 'failed' : 'pending',
    transactionRef: ref,
    message: data.description,
    timestamp: new Date().toISOString(),
  };
}

async function checkInnBucksStatus(ref: string) {
  const apiKey = process.env.INNBUCKS_API_KEY;
  
  if (!apiKey) {
    const random = Math.random();
    return random > 0.7 ? {
      status: 'success',
      transactionRef: ref,
      message: 'Transaction successful',
      timestamp: new Date().toISOString(),
    } : {
      status: 'pending',
      message: 'Pending confirmation',
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`https://api.innbucks.co.zw/api/v1/payment/${ref}`, {
    headers: { 'Api-Key': apiKey },
  });

  const data = await response.json();
  
  return {
    status: data.status === 'SUCCESSFUL' ? 'success' : data.status === 'REJECTED' ? 'failed' : 'pending',
    transactionRef: ref,
    message: data.message,
    timestamp: new Date().toISOString(),
  };
}

async function checkTelecashStatus(ref: string) {
  const apiKey = process.env.TELECASH_API_KEY;
  
  if (!apiKey) {
    const random = Math.random();
    return random > 0.7 ? {
      status: 'success',
      transactionRef: ref,
      message: 'Payment received',
      timestamp: new Date().toISOString(),
    } : {
      status: 'pending',
      message: 'Awaiting confirmation',
      timestamp: new Date().toISOString(),
    };
  }

  const response = await fetch(`https://api.telecash.co.zw/v1/payment/status/${ref}`, {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });

  const data = await response.json();
  
  return {
    status: data.paymentStatus === 'COMPLETED' ? 'success' : data.paymentStatus === 'DECLINED' ? 'failed' : 'pending',
    transactionRef: ref,
    message: data.statusMessage,
    timestamp: new Date().toISOString(),
  };
}
