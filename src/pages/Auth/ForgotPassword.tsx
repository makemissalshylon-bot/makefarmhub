import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMeta } from '../../hooks/useMeta';
import { ArrowLeft, ArrowRight, Loader2, Mail, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  useMeta({
    title: 'Forgot Password - MAKEFARMHUB',
    description: 'Reset your MAKEFARMHUB account password.',
    url: '/forgot-password',
  });

  const location = useLocation();
  const prefill = (location.state as { identifier?: string } | null)?.identifier || '';
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(prefill.includes('@') ? prefill : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [message, setMessage] = useState('');
  const [devLink, setDevLink] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await requestPasswordReset(email);
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Could not send reset email');
      return;
    }

    setSent(true);
    setMessage(result.message || 'Check your email for a reset link.');
    if (result.resetToken) {
      setDevLink(`/reset-password?token=${result.resetToken}&email=${encodeURIComponent(email.trim())}`);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span>MAKEFARMHUB</span>
          </div>
          <h1>Forgot password</h1>
          <p>Enter your account email and we will send a reset link</p>
        </div>

        {sent ? (
          <div className="auth-form">
            <div className="form-success" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 16 }}>
              <CheckCircle size={22} color="#2d6a4f" />
              <div>
                <strong>Check your email</strong>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>{message}</p>
              </div>
            </div>
            {devLink && import.meta.env.DEV && (
              <p className="form-hint">
                Dev only:{' '}
                <Link to={devLink}>Open reset link</Link>
              </p>
            )}
            <Link to="/login" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Back to sign in
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} /> Email address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Sending...
                </>
              ) : (
                <>
                  Send reset link
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="otp-actions">
              <Link to="/login" className="btn-text" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <ArrowLeft size={16} /> Back to sign in
              </Link>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Don&apos;t have an account? <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-side-content">
          <h2>Regain access in a few minutes</h2>
          <ul>
            <li>✓ Secure email reset link</li>
            <li>✓ Link expires in 1 hour</li>
            <li>✓ Choose a new password yourself</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
