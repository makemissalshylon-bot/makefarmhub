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
    const { email, userId } = req.body;

    if (!email || !userId) {
      return res.status(400).json({ error: 'Email and userId required' });
    }

    // Generate verification token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store token in database
    const { error: dbError } = await supabase
      .from('verification_tokens')
      .insert({
        user_id: userId,
        token,
        type: 'email',
        expires_at: expiresAt.toISOString(),
      });

    if (dbError) throw dbError;

    // Send email via SendGrid or other provider
    const verificationLink = `${process.env.VITE_APP_URL || 'https://makefarmhub.vercel.app'}/verify-email?token=${token}`;

    if (process.env.SENDGRID_API_KEY) {
      await sendEmailViaSendGrid(email, verificationLink);
    } else {
      console.log('Verification link (no email service configured):', verificationLink);
    }

    return res.status(200).json({
      success: true,
      message: 'Verification email sent',
    });
  } catch (error: any) {
    console.error('Send verification email error:', error);
    return res.status(500).json({
      error: error.message || 'Failed to send verification email',
    });
  }
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendEmailViaSendGrid(email: string, verificationLink: string) {
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY || '');

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@makefarmhub.com',
    subject: 'Verify Your Email - MAKEFARMHUB',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71;">Verify Your Email</h2>
        <p>Welcome to MAKEFARMHUB! Please verify your email address to activate your account.</p>
        <p>
          <a href="${verificationLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #2ecc71; color: white; text-decoration: none; border-radius: 4px;">
            Verify Email
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${verificationLink}">${verificationLink}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 24 hours. If you didn't create an account, please ignore this email.
        </p>
      </div>
    `,
  };

  await sgMail.default.send(msg);
}
