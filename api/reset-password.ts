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
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (!profile) {
      // Don't reveal if email exists or not (security)
      return res.status(200).json({
        success: true,
        message: 'If that email is registered, a password reset link has been sent',
      });
    }

    // Generate reset token
    const token = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store token
    await supabase.from('verification_tokens').insert({
      user_id: profile.id,
      token,
      type: 'password_reset',
      expires_at: expiresAt.toISOString(),
    });

    // Send reset email
    const resetLink = `${process.env.VITE_APP_URL || 'https://makefarmhub.vercel.app'}/reset-password?token=${token}`;

    if (process.env.SENDGRID_API_KEY) {
      await sendResetEmail(email, resetLink);
    } else {
      console.log('Password reset link:', resetLink);
    }

    return res.status(200).json({
      success: true,
      message: 'If that email is registered, a password reset link has been sent',
    });
  } catch (error: any) {
    console.error('Password reset error:', error);
    return res.status(500).json({
      error: 'Failed to process password reset',
    });
  }
}

function generateToken(): string {
  return Array.from(crypto.getRandomValues(new Uint8Array(32)))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

async function sendResetEmail(email: string, resetLink: string) {
  const sgMail = await import('@sendgrid/mail');
  sgMail.default.setApiKey(process.env.SENDGRID_API_KEY || '');

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'noreply@makefarmhub.com',
    subject: 'Reset Your Password - MAKEFARMHUB',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2ecc71;">Reset Your Password</h2>
        <p>We received a request to reset your password for your MAKEFARMHUB account.</p>
        <p>
          <a href="${resetLink}" 
             style="display: inline-block; padding: 12px 24px; background-color: #2ecc71; color: white; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Or copy and paste this link into your browser:<br>
          <a href="${resetLink}">${resetLink}</a>
        </p>
        <p style="color: #666; font-size: 12px;">
          This link will expire in 1 hour. If you didn't request a password reset, please ignore this email.
        </p>
      </div>
    `,
  };

  await sgMail.default.send(msg);
}
