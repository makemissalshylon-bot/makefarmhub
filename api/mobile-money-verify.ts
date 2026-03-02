import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * Verify Mobile Money Payment Status
 * Polls Paynow for transaction status, or returns demo status
 */

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
    const { pollUrl, transactionRef } = req.body;

    if (!transactionRef) {
      return res.status(400).json({ error: 'Transaction reference is required' });
    }

    // If we have a Paynow poll URL, check real status
    if (pollUrl) {
      try {
        const pollResponse = await fetch(pollUrl);
        const pollText = await pollResponse.text();
        const pollResult = parsePaynowResponse(pollText);

        console.log('[Verify] Paynow poll result:', pollResult);

        const paynowStatus = (pollResult.status || '').toLowerCase();

        // Map Paynow statuses to our statuses
        let status = 'pending';
        if (paynowStatus === 'paid' || paynowStatus === 'delivered') {
          status = 'paid';
        } else if (paynowStatus === 'cancelled' || paynowStatus === 'refunded' || paynowStatus === 'disputed') {
          status = 'cancelled';
        } else if (paynowStatus === 'failed') {
          status = 'failed';
        }

        return res.status(200).json({
          transactionRef,
          status,
          paynowStatus,
          amount: pollResult.amount,
          timestamp: new Date().toISOString(),
        });
      } catch (err: any) {
        console.warn('[Verify] Poll failed:', err.message);
        return res.status(200).json({
          transactionRef,
          status: 'pending',
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Demo mode — return pending (frontend will eventually time out and treat as success)
    return res.status(200).json({
      transactionRef,
      status: 'pending',
      demo: true,
      timestamp: new Date().toISOString(),
    });

  } catch (error: any) {
    console.error('[Verify] Error:', error);
    return res.status(500).json({ error: 'Verification failed', message: error.message });
  }
}
