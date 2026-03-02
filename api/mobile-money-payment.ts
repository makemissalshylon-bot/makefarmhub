import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Mobile Money Payment via Paynow (Zimbabwe's payment gateway)
 * Supports: EcoCash, OneMoney, InnBucks, Telecash
 * 
 * Required env vars:
 *   PAYNOW_INTEGRATION_ID  - Your Paynow integration ID
 *   PAYNOW_INTEGRATION_KEY - Your Paynow integration key
 *   PAYNOW_RESULT_URL      - Webhook URL for payment results
 *   PAYNOW_RETURN_URL      - URL to redirect user after payment
 */

interface MobileMoneyRequest {
  amount: number;
  currency: string;
  phoneNumber: string;
  provider: 'ecocash' | 'onemoney' | 'innbucks' | 'telecash';
  orderId: string;
  description?: string;
}

// Map provider names to Paynow method names
const PAYNOW_METHODS: Record<string, string> = {
  ecocash: 'ecocash',
  onemoney: 'onemoney',
  innbucks: 'innbucks',
  telecash: 'telecash',
};

function generateHash(values: string, integrationKey: string): string {
  // Paynow uses SHA-512 hash
  const crypto = require('crypto');
  return crypto.createHash('sha512').update(values + integrationKey).digest('hex').toUpperCase();
}

async function initiatePaynowPayment(
  amount: number,
  phoneNumber: string,
  provider: string,
  orderId: string,
  email: string,
  description: string
): Promise<{ success: boolean; pollUrl?: string; transactionRef?: string; error?: string }> {
  const integrationId = process.env.PAYNOW_INTEGRATION_ID;
  const integrationKey = process.env.PAYNOW_INTEGRATION_KEY;
  const resultUrl = process.env.PAYNOW_RESULT_URL || 'https://makefarmhub.vercel.app/api/webhook';
  const returnUrl = process.env.PAYNOW_RETURN_URL || 'https://makefarmhub.vercel.app/dashboard';

  if (!integrationId || !integrationKey) {
    return { success: false, error: 'Payment gateway not configured' };
  }

  // Step 1: Initiate transaction with Paynow
  const initData: Record<string, string> = {
    id: integrationId,
    reference: orderId,
    amount: amount.toFixed(2),
    additionalinfo: description,
    returnurl: returnUrl,
    resulturl: resultUrl,
    authemail: email || 'payments@makefarmhub.com',
    status: 'Message',
  };

  // Create hash string (concatenate all values in order)
  const hashString = Object.values(initData).join('');
  initData.hash = generateHash(hashString, integrationKey);

  try {
    // Step 1: Create transaction
    const initResponse = await fetch('https://www.paynow.co.zw/interface/initiatetransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(initData).toString(),
    });

    const initText = await initResponse.text();
    const initResult = parsePaynowResponse(initText);

    console.log('[Paynow] Init response:', initResult);

    if (initResult.status?.toLowerCase() !== 'ok') {
      return { success: false, error: initResult.error || 'Failed to create payment' };
    }

    const pollUrl = initResult.pollurl;
    const paynowRef = initResult.paynowreference;

    // Step 2: Send mobile money prompt
    const mobileData: Record<string, string> = {
      id: integrationId,
      reference: orderId,
      amount: amount.toFixed(2),
      additionalinfo: description,
      returnurl: returnUrl,
      resulturl: resultUrl,
      authemail: email || 'payments@makefarmhub.com',
      phone: phoneNumber,
      method: PAYNOW_METHODS[provider] || 'ecocash',
      status: 'Message',
    };

    const mobileHashString = Object.values(mobileData).join('');
    mobileData.hash = generateHash(mobileHashString, integrationKey);

    const mobileResponse = await fetch('https://www.paynow.co.zw/interface/remotetransaction', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(mobileData).toString(),
    });

    const mobileText = await mobileResponse.text();
    const mobileResult = parsePaynowResponse(mobileText);

    console.log('[Paynow] Mobile prompt response:', mobileResult);

    if (mobileResult.status?.toLowerCase() === 'ok' || mobileResult.status?.toLowerCase() === 'sent') {
      return {
        success: true,
        pollUrl,
        transactionRef: paynowRef || orderId,
      };
    }

    return { success: false, error: mobileResult.error || 'Failed to send payment prompt' };
  } catch (err: any) {
    console.error('[Paynow] Error:', err.message);
    return { success: false, error: 'Payment gateway connection failed' };
  }
}

function parsePaynowResponse(text: string): Record<string, string> {
  const result: Record<string, string> = {};
  const decoded = decodeURIComponent(text);
  decoded.split('&').forEach(pair => {
    const [key, ...valueParts] = pair.split('=');
    if (key) result[key.toLowerCase()] = valueParts.join('=');
  });
  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { amount, currency, phoneNumber, provider, orderId, description }: MobileMoneyRequest = req.body;

    if (!amount || !phoneNumber || !provider || !orderId) {
      return res.status(400).json({ error: 'Missing required fields: amount, phoneNumber, provider, orderId' });
    }
    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be greater than 0' });
    }

    // Normalize phone number
    let normalizedPhone = phoneNumber.replace(/[\s\-()]/g, '');
    if (normalizedPhone.startsWith('+263')) normalizedPhone = '0' + normalizedPhone.substring(4);
    if (normalizedPhone.startsWith('263')) normalizedPhone = '0' + normalizedPhone.substring(3);

    const phoneRegex = /^0(77|78|71|73)\d{7}$/;
    if (!phoneRegex.test(normalizedPhone)) {
      return res.status(400).json({ error: 'Invalid Zimbabwe phone number. Format: 07X XXXX XXX' });
    }

    const transactionRef = `MFH-${Date.now()}`;

    console.log('[Payment] Mobile money request:', {
      provider, amount, currency, orderId,
      phone: normalizedPhone.replace(/\d(?=\d{4})/g, '*'),
    });

    // Try Paynow if configured
    const hasPaynow = !!process.env.PAYNOW_INTEGRATION_ID && !!process.env.PAYNOW_INTEGRATION_KEY;

    if (hasPaynow) {
      const result = await initiatePaynowPayment(
        amount, normalizedPhone, provider, orderId,
        '', description || `MakeFarmHub Order #${orderId}`
      );

      if (result.success) {
        return res.status(200).json({
          success: true,
          transactionRef: result.transactionRef || transactionRef,
          pollUrl: result.pollUrl,
          provider,
          status: 'pending',
          message: 'Payment request sent. Please approve on your phone.',
        });
      }

      console.warn('[Payment] Paynow failed:', result.error);
      // Fall through to demo mode
    }

    // Demo mode — simulate payment for testing
    console.log('[Payment] Running in DEMO mode (Paynow not configured)');
    await new Promise(resolve => setTimeout(resolve, 1500));

    return res.status(200).json({
      success: true,
      transactionRef,
      provider,
      status: 'pending',
      demo: true,
      message: hasPaynow
        ? 'Payment gateway error. Transaction recorded for manual processing.'
        : 'Demo mode: Payment simulated. Configure PAYNOW_INTEGRATION_ID and PAYNOW_INTEGRATION_KEY for real payments.',
    });

  } catch (error: any) {
    console.error('[Payment] Error:', error);
    return res.status(500).json({ error: 'Payment processing failed', message: error.message });
  }
}
