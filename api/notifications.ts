import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { action } = req.query;

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    switch (action) {
      case 'email':
        return handleSendEmail(req, res);
      case 'sms':
        return handleSendSMS(req, res);
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }
  } catch (error) {
    console.error('[NOTIFICATIONS] Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleSendEmail(req: VercelRequest, res: VercelResponse) {
  const { to, subject, html } = req.body;

  if (!to || !subject || !html) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;

  if (!sendgridKey) {
    console.log('[DEV] Email would be sent to:', to);
    return res.status(200).json({ success: true, dev: true });
  }

  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }], subject }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@makefarmhub.com',
          name: process.env.SENDGRID_FROM_NAME || 'MakeFarmHub',
        },
        content: [{ type: 'text/html', value: html }],
      }),
    });

    if (!response.ok) {
      throw new Error(`SendGrid error: ${response.status}`);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[EMAIL] Error:', error);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}

async function handleSendSMS(req: VercelRequest, res: VercelResponse) {
  const { to, message } = req.body;

  if (!to || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const apiKey = process.env.AFRICASTALKING_API_KEY;
  const username = process.env.AFRICASTALKING_USERNAME;

  if (!apiKey || !username) {
    console.log('[DEV] SMS would be sent to:', to);
    return res.status(200).json({ success: true, dev: true });
  }

  try {
    const africastalking = await import('africastalking');
    const client = africastalking.default({ apiKey, username });
    
    await client.SMS.send({ to: [to], message });
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('[SMS] Error:', error);
    return res.status(500).json({ error: 'Failed to send SMS' });
  }
}
