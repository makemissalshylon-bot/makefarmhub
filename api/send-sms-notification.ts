import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const africastalking = require('africastalking')({
  apiKey: process.env.AFRICASTALKING_API_KEY,
  username: process.env.AFRICASTALKING_USERNAME,
});

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
    const { phoneNumber, message, type, userId } = req.body;

    if (!phoneNumber || !message) {
      return res.status(400).json({ error: 'Phone number and message required' });
    }

    // Send SMS via Africa's Talking
    const sms = africastalking.SMS;
    const result = await sms.send({
      to: [phoneNumber],
      message,
      from: 'MAKEFARMHUB',
    });

    // Log notification in database
    if (userId) {
      await supabase.from('notifications').insert({
        user_id: userId,
        type: type || 'sms',
        title: 'SMS Notification',
        message,
        metadata: { phoneNumber, smsResult: result },
      });
    }

    return res.status(200).json({
      success: true,
      message: 'SMS sent successfully',
      result: result.SMSMessageData,
    });
  } catch (error: any) {
    console.error('SMS sending error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send SMS',
    });
  }
}
