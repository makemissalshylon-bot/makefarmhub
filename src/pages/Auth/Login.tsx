import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowRight, Loader2, Mail, Phone, Lock } from 'lucide-react';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'identifier' | 'password'>('identifier');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { loginWithPassword, checkUserExists } = useAuth();
  const navigate = useNavigate();

  const isEmail = identifier.includes('@');

  const handleCheckUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier) {
      setError('Please enter your email or phone number');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await checkUserExists(identifier);

    if (result.exists) {
      // User exists, show password field
      setStep('password');
    } else {
      // User doesn't exist, redirect to signup
      setError('No account found. Redirecting to signup...');
      setTimeout(() => {
        navigate('/signup', { state: { identifier } });
      }, 1500);
    }
    setIsLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      setError('Please enter your password');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await loginWithPassword(identifier, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Login failed. Please check your credentials.');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <div className="auth-logo">
            <span>🌾</span>
            MAKEFARMHUB
          </div>
          <h1>Welcome</h1>
          <p>Sign in to access your account</p>
        </div>

        {step === 'identifier' ? (
          <form onSubmit={handleCheckUser} className="auth-form">
            <div className="form-group">
              <label htmlFor="identifier">
                {isEmail ? <Mail size={16} /> : <Phone size={16} />}
                Email or Phone Number
              </label>
              <input
                type="text"
                id="identifier"
                placeholder="email@example.com or +263 77 123 4567"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                autoComplete="email tel"
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Checking...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleLogin} className="auth-form">
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
              />
              <span className="form-hint">Logging in as {identifier}</span>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Signing in...
                </>
              ) : (
                <>
                  Sign In
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="btn-text"
                onClick={() => { setStep('identifier'); setPassword(''); setError(''); }}
              >
                Change {isEmail ? 'email' : 'number'}
              </button>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Don't have an account?{' '}
            <Link to="/signup">Create account</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-side-content">
          <h2>Connect with the agricultural ecosystem</h2>
          <ul>
            <li>✓ Verified farmers and buyers</li>
            <li>✓ Secure escrow payments</li>
            <li>✓ Reliable transport network</li>
            <li>✓ Real-time messaging</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
