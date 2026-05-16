import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { withSecurityHeaders } from './_middleware/securityHeaders';
import { withRateLimit } from './_middleware/rateLimit';
import { withValidation, validators } from './_middleware/validateInput';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const handler = async (req: VercelRequest, res: VercelResponse) => {
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { provider, phoneNumber, amount, userId, orderId, reference } = req.body;

    if (!provider || !phoneNumber || !amount || !userId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const transactionRef = `MM-${provider.toUpperCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Call provider API based on provider type
    let apiResponse;
    
    switch (provider) {
      case 'ecocash':
        apiResponse = await initiateEcoCash(phoneNumber, amount, transactionRef);
        break;
      case 'onemoney':
        apiResponse = await initiateOneMoney(phoneNumber, amount, transactionRef);
        break;
      case 'innbucks':
        apiResponse = await initiateInnBucks(phoneNumber, amount, transactionRef);
        break;
      case 'telecash':
        apiResponse = await initiateTelecash(phoneNumber, amount, transactionRef);
        break;
      default:
        return res.status(400).json({ error: 'Unsupported provider' });
    }

    // Store transaction in database
    await supabase.from('wallet_transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount,
      status: 'pending',
      description: `${provider} payment`,
      reference: transactionRef,
      metadata: {
        provider,
        phoneNumber,
        orderId,
        initiatedAt: new Date().toISOString(),
      },
    });

    return res.status(200).json({
      transactionRef,
      pollUrl: `/api/mobile-money-status`,
      message: 'Payment initiated successfully',
      providerResponse: apiResponse,
    });
  } catch (error: any) {
    console.error('Mobile money initiation error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to initiate payment',
    });
  }
}

// Provider-specific implementations
async function initiateEcoCash(phone: string, amount: number, ref: string) {
  const apiKey = process.env.ECOCASH_API_KEY;
  
  if (!apiKey) {
    // Demo mode - return mock response
    return { status: 'pending', message: 'Awaiting user confirmation' };
  }

  // Real EcoCash API integration
  const response = await fetch('https://api.ecocash.co.zw/v1/payments', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      phone,
      reference: ref,
      description: 'MAKEFARMHUB payment',
    }),
  });

  return response.json();
}

async function initiateOneMoney(phone: string, amount: number, ref: string) {
  const apiKey = process.env.ONEMONEY_API_KEY;
  
  if (!apiKey) {
    return { status: 'pending', message: 'Awaiting user confirmation' };
  }

  const response = await fetch('https://api.onemoney.co.zw/v1/transactions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      msisdn: phone,
      externalId: ref,
      narration: 'MAKEFARMHUB payment',
    }),
  });

  return response.json();
}

async function initiateInnBucks(phone: string, amount: number, ref: string) {
  const apiKey = process.env.INNBUCKS_API_KEY;
  
  if (!apiKey) {
    return { status: 'pending', message: 'Awaiting user confirmation' };
  }

  const response = await fetch('https://api.innbucks.co.zw/api/v1/payment', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      mobile: phone,
      reference: ref,
      description: 'MAKEFARMHUB payment',
    }),
  });

  return response.json();
}

async function initiateTelecash(phone: string, amount: number, ref: string) {
  const apiKey = process.env.TELECASH_API_KEY;
  
  if (!apiKey) {
    return { status: 'pending', message: 'Awaiting user confirmation' };
  }

  const response = await fetch('https://api.telecash.co.zw/v1/payment/request', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      amount,
      phoneNumber: phone,
      transactionRef: ref,
      description: 'MAKEFARMHUB payment',
    }),
  });

  return response.json();
}

// Apply middleware: rate limiting (5 requests/minute), validation, security headers
export default withSecurityHeaders(
  withRateLimit(
    withValidation(handler, {
      provider: validators.enum(['ecocash', 'onemoney', 'innbucks', 'telecash']),
      phoneNumber: validators.phone,
      amount: validators.positiveNumber,
      userId: validators.uuid,
    }),
    { windowMs: 60000, maxRequests: 5 }
  )
);
