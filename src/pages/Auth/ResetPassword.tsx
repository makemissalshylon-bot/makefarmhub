import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMeta } from '../../hooks/useMeta';
import { supabase } from '../../lib/supabase';
import { ArrowRight, Loader2, Lock, CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  useMeta({
    title: 'Reset Password - MAKEFARMHUB',
    description: 'Choose a new password for your MAKEFARMHUB account.',
    url: '/reset-password',
  });

  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { confirmPasswordReset } = useAuth();

  const tokenFromQuery = searchParams.get('token') || '';
  const emailFromQuery = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [ready, setReady] = useState(!!tokenFromQuery);
  const [checking, setChecking] = useState(!tokenFromQuery);

  useEffect(() => {
    if (tokenFromQuery) {
      setReady(true);
      setChecking(false);
      return;
    }

    let active = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (!active) return;
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
        setReady(true);
        setChecking(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      if (data.session) setReady(true);
      setChecking(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [tokenFromQuery]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirm) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = await confirmPasswordReset({
      password,
      token: tokenFromQuery || undefined,
      email: emailFromQuery || undefined,
    });
    setIsLoading(false);

    if (!result.success) {
      setError(result.error || 'Could not reset password');
      return;
    }

    setDone(true);
    setTimeout(() => navigate('/login'), 2000);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span>MAKEFARMHUB</span>
          </div>
          <h1>Set a new password</h1>
          <p>Choose a password you haven&apos;t used before</p>
        </div>

        {checking ? (
          <div className="auth-form" style={{ textAlign: 'center' }}>
            <Loader2 size={28} className="spinner" />
            <p>Verifying reset link...</p>
          </div>
        ) : done ? (
          <div className="auth-form">
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <CheckCircle size={22} color="#2d6a4f" />
              <div>
                <strong>Password updated</strong>
                <p style={{ margin: '6px 0 0', color: '#475569' }}>Redirecting you to sign in...</p>
              </div>
            </div>
          </div>
        ) : !ready ? (
          <div className="auth-form">
            <div className="form-error" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertCircle size={18} />
              This reset link is missing or expired.
            </div>
            <Link to="/forgot-password" className="btn-primary" style={{ display: 'inline-flex', justifyContent: 'center' }}>
              Request a new link
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">
                <Lock size={16} /> New password
              </label>
              <input
                id="password"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirm">Confirm password</label>
              <input
                id="confirm"
                type="password"
                placeholder="Repeat new password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Saving...
                </>
              ) : (
                <>
                  Save new password
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Remembered it? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-side-content">
          <h2>You&apos;re in control</h2>
          <ul>
            <li>✓ Reset without calling support</li>
            <li>✓ Secure one-time link</li>
            <li>✓ Sign in right after</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
