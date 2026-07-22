import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase =
  supabaseUrl && serviceKey ? createClient(supabaseUrl, serviceKey) : null;

/** Fallback when verification_tokens table is missing */
const memoryResets = new Map<string, { userId: string; email: string; expiresAt: number }>();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = (req.query.action as string) || 'request';

  try {
    if (action === 'confirm') return await handleConfirm(req, res);
    return await handleRequest(req, res);
  } catch (error: any) {
    console.error('Password reset error:', error);
    return res.status(500).json({ error: 'Failed to process password reset' });
  }
}

async function handleRequest(req: VercelRequest, res: VercelResponse) {
  const email = String(req.body?.email || '')
    .trim()
    .toLowerCase();

  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const generic = {
    success: true,
    message: 'If that email is registered, a password reset link has been sent. Check your inbox and spam folder.',
  };

  if (!supabase) {
    console.log('[DEV] Password reset requested for', email, '(no service role)');
    return res.status(200).json(generic);
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, name')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    // Also try Auth users list by email via admin API
    try {
      const { data: listed } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
      const authUser = listed?.users?.find((u) => u.email?.toLowerCase() === email);
      if (!authUser) return res.status(200).json(generic);

      const token = generateToken();
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
      await supabase.from('verification_tokens').insert({
        user_id: authUser.id,
        token,
        type: 'password_reset',
        expires_at: expiresAt.toISOString(),
      });

      const resetLink = `${process.env.VITE_APP_URL || 'https://makefarmhub.vercel.app'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
      await sendResetEmail(email, resetLink, authUser.user_metadata?.name || 'there');

      // Trigger Supabase recovery email as well when possible
      try {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${process.env.VITE_APP_URL || 'https://makefarmhub.vercel.app'}/reset-password`,
        });
      } catch { /* optional */ }

      return res.status(200).json({
        ...generic,
        ...(process.env.NODE_ENV !== 'production' ? { resetToken: token } : {}),
      });
    } catch {
      return res.status(200).json(generic);
    }
  }

  const token = generateToken();
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  try {
    await supabase.from('verification_tokens').insert({
      user_id: profile.id,
      token,
      type: 'password_reset',
      expires_at: expiresAt.toISOString(),
    });
  } catch (err) {
    console.warn('verification_tokens insert failed, using memory:', err);
    memoryResets.set(token, { userId: profile.id, email, expiresAt: expiresAt.getTime() });
  }
  memoryResets.set(token, { userId: profile.id, email, expiresAt: expiresAt.getTime() });

  const resetLink = `${process.env.VITE_APP_URL || 'https://makefarmhub.vercel.app'}/reset-password?token=${token}&email=${encodeURIComponent(email)}`;
  await sendResetEmail(email, resetLink, profile.name || 'there');

  try {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.VITE_APP_URL || 'https://makefarmhub.vercel.app'}/reset-password`,
    });
  } catch { /* optional */ }

  return res.status(200).json({
    ...generic,
    ...(process.env.VERCEL_ENV !== 'production' ? { resetToken: token } : {}),
  });
}

async function handleConfirm(req: VercelRequest, res: VercelResponse) {
  const { token, password, email } = req.body || {};

  if (!password || String(password).length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters' });
  }

  if (!token) {
    return res.status(400).json({ error: 'Reset token is required' });
  }

  if (!supabase) {
    return res.status(500).json({ error: 'Password reset is not configured on the server' });
  }

  let userId: string | null = null;

  const { data: row, error } = await supabase
    .from('verification_tokens')
    .select('*')
    .eq('token', token)
    .eq('type', 'password_reset')
    .maybeSingle();

  if (row && !error) {
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      await supabase.from('verification_tokens').delete().eq('token', token);
      memoryResets.delete(token);
      return res.status(400).json({ error: 'This reset link has expired. Request a new one.' });
    }
    userId = row.user_id;
  } else {
    const mem = memoryResets.get(token);
    if (!mem || mem.expiresAt < Date.now()) {
      return res.status(400).json({ error: 'Invalid or expired reset link. Request a new one.' });
    }
    userId = mem.userId;
  }

  const { error: updateError } = await supabase.auth.admin.updateUserById(userId!, {
    password: String(password),
  });

  if (updateError) {
    console.error('admin.updateUserById failed:', updateError);
    return res.status(500).json({ error: 'Could not update password. Please try again.' });
  }

  await supabase.from('verification_tokens').delete().eq('token', token);
  memoryResets.delete(token);

  return res.status(200).json({
    success: true,
    message: 'Password updated. You can sign in with your new password.',
    email: email || null,
  });
}

function generateToken(): string {
  return randomBytes(32).toString('hex');
}

async function sendResetEmail(email: string, resetLink: string, name: string) {
  const html = `
    <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; color: #1a2e1a;">
      <h2 style="color: #2d6a4f;">Reset your MAKEFARMHUB password</h2>
      <p>Hi ${escapeHtml(name)},</p>
      <p>We received a request to reset your password. Click the button below to choose a new one:</p>
      <p style="margin: 28px 0;">
        <a href="${resetLink}"
           style="display:inline-block;padding:12px 22px;background:#2d6a4f;color:#fff;text-decoration:none;border-radius:6px;">
          Reset password
        </a>
      </p>
      <p style="font-size:14px;color:#555;">Or paste this link into your browser:<br/>
        <a href="${resetLink}">${resetLink}</a>
      </p>
      <p style="font-size:12px;color:#777;">This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    </div>
  `;

  const resendKey = process.env.RESEND_API_KEY;
  if (resendKey) {
    const from = process.env.RESEND_FROM_EMAIL || process.env.SENDGRID_FROM_EMAIL || 'MAKEFARMHUB <onboarding@resend.dev>';
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'Reset your MAKEFARMHUB password',
        html,
      }),
    });
    if (!response.ok) {
      console.error('Resend error:', await response.text());
    }
    return;
  }

  const sendgridKey = process.env.SENDGRID_API_KEY;
  if (sendgridKey) {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sendgridKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email }], subject: 'Reset your MAKEFARMHUB password' }],
        from: {
          email: process.env.SENDGRID_FROM_EMAIL || 'noreply@makefarmhub.com',
          name: process.env.SENDGRID_FROM_NAME || 'MakeFarmHub',
        },
        content: [{ type: 'text/html', value: html }],
      }),
    });
    if (!response.ok) {
      console.error('SendGrid error:', await response.text());
    }
    return;
  }

  console.log('[DEV] Password reset link for', email, ':', resetLink);
}

function escapeHtml(value: string) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
