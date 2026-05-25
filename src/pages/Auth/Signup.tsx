import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useMeta } from '../../hooks/useMeta';
import type { UserRole } from '../../types';
import {
  ArrowRight,
  ArrowLeft,
  Loader2,
  Tractor,
  ShoppingCart,
  Check,
  RefreshCw,
} from 'lucide-react';

const roles: { id: UserRole; title: string; description: string; icon: typeof Tractor }[] = [
  {
    id: 'farmer',
    title: 'Farmer / Seller',
    description: 'List and sell your crops, livestock, and farm products',
    icon: Tractor,
  },
  {
    id: 'buyer',
    title: 'Buyer',
    description: 'Browse and purchase agricultural products',
    icon: ShoppingCart,
  },
];

export default function Signup() {
  useMeta({
    title: 'Sign Up - MAKEFARMHUB',
    description: 'Create your MAKEFARMHUB account. Join as a farmer, buyer, or transporter on Zimbabwe\'s leading agricultural marketplace.',
    url: '/signup',
  });

  const [step, setStep] = useState<'role' | 'details' | 'otp'>('role');
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    location: '',
    password: '',
  });
  const [otpMethod, setOtpMethod] = useState<'email' | 'sms'>('sms');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [devOTP, setDevOTP] = useState<string | undefined>();
  const [resendCooldown, setResendCooldown] = useState(0);
  const { signup, sendOTP } = useAuth();
  const navigate = useNavigate();

  const handleRoleSelect = (role: UserRole) => {
    setSelectedRole(role);
    setStep('details');
  };

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleDetailsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone || !formData.password) {
      setError('Please fill in all required fields');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    // Validate based on chosen OTP method
    if (otpMethod === 'email' && !formData.email) {
      setError('Email is required when using Email verification');
      return;
    }
    if (otpMethod === 'sms' && !formData.phone) {
      setError('Phone number is required when using SMS verification');
      return;
    }
    
    setIsLoading(true);
    setError('');

    // Send OTP to selected method (email or phone)
    const identifier = otpMethod === 'email' ? formData.email : formData.phone;
    const result = await sendOTP(identifier, formData.name);

    if (result.success && result.token) {
      setOtpToken(result.token);
      setDevOTP(result.devOTP);
      setStep('otp');
      startResendCooldown();
    } else {
      setError(result.error || 'Failed to send verification code');
    }
    setIsLoading(false);
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setIsLoading(true);

    const identifier = otpMethod === 'email' ? formData.email : formData.phone;
    const result = await sendOTP(identifier, formData.name);

    if (result.success && result.token) {
      setOtpToken(result.token);
      setDevOTP(result.devOTP);
      startResendCooldown();
    } else {
      setError(result.error || 'Failed to resend code');
    }
    setIsLoading(false);
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) {
      setError('Please enter the verification code');
      return;
    }
    setIsLoading(true);
    setError('');

    const result = await signup(
      formData.name,
      formData.phone,
      formData.email,
      selectedRole!,
      formData.location,
      otp,
      otpToken,
      formData.password
    );
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Signup failed. Please try again.');
    }
    setIsLoading(false);
  };

  return (
    <div className="auth-page">
      <div className="auth-container signup">
        <div className="auth-header">
          <div className="auth-logo">
            <span>🌾</span>
            MAKEFARMHUB
          </div>
          <h1>Create your account</h1>
          <p>Join the agricultural marketplace</p>
        </div>

        {/* Progress Steps */}
        <div className="signup-progress">
          <div className={`progress-step ${step === 'role' ? 'active' : 'completed'}`}>
            <div className="step-number">{step !== 'role' ? <Check size={16} /> : '1'}</div>
            <span>Select Role</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step === 'details' ? 'active' : step === 'otp' ? 'completed' : ''}`}>
            <div className="step-number">{step === 'otp' ? <Check size={16} /> : '2'}</div>
            <span>Your Details</span>
          </div>
          <div className="progress-line" />
          <div className={`progress-step ${step === 'otp' ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Verify</span>
          </div>
        </div>

        {step === 'role' && (
          <div className="role-selection">
            <h3>I want to join as a...</h3>
            <div className="role-cards">
              {roles.map((role) => (
                <button
                  key={role.id}
                  className={`role-card ${selectedRole === role.id ? 'selected' : ''}`}
                  onClick={() => handleRoleSelect(role.id)}
                >
                  <role.icon size={32} />
                  <h4>{role.title}</h4>
                  <p>{role.description}</p>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleDetailsSubmit} className="auth-form">
            <button
              type="button"
              className="btn-back"
              onClick={() => setStep('role')}
            >
              <ArrowLeft size={18} />
              Back to role selection
            </button>

            <div className="selected-role-badge">
              {roles.find(r => r.id === selectedRole)?.title}
            </div>

            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                placeholder="Enter your full name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">Phone Number *</label>
              <input
                type="tel"
                id="phone"
                placeholder="+263 77 123 4567"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email {otpMethod === 'email' ? '*' : '(Optional)'}</label>
              <input
                type="email"
                id="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required={otpMethod === 'email'}
              />
            </div>

            <div className="form-group">
              <label>Verification Method *</label>
              <div style={{ display: 'flex', gap: '15px', marginTop: '8px' }}>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, padding: '12px', border: '2px solid', borderColor: otpMethod === 'sms' ? '#10b981' : '#e5e7eb', borderRadius: '8px', background: otpMethod === 'sms' ? '#f0fdf4' : 'transparent' }}>
                  <input
                    type="radio"
                    name="otpMethod"
                    value="sms"
                    checked={otpMethod === 'sms'}
                    onChange={(e) => setOtpMethod(e.target.value as 'sms')}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontWeight: otpMethod === 'sms' ? '600' : '400' }}>📱 SMS (Phone)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', flex: 1, padding: '12px', border: '2px solid', borderColor: otpMethod === 'email' ? '#10b981' : '#e5e7eb', borderRadius: '8px', background: otpMethod === 'email' ? '#f0fdf4' : 'transparent' }}>
                  <input
                    type="radio"
                    name="otpMethod"
                    value="email"
                    checked={otpMethod === 'email'}
                    onChange={(e) => setOtpMethod(e.target.value as 'email')}
                    style={{ marginRight: '8px' }}
                  />
                  <span style={{ fontWeight: otpMethod === 'email' ? '600' : '400' }}>✉️ Email</span>
                </label>
              </div>
              <span className="form-hint">Choose how you want to receive your verification code</span>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password *</label>
              <input
                type="password"
                id="password"
                placeholder="Create a password (min. 6 characters)"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
                minLength={6}
              />
              <span className="form-hint">You'll use this to login next time</span>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location *</label>
              <input
                type="text"
                id="location"
                placeholder="City, Country"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                required
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Sending OTP...
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOTP} className="auth-form">
            <button
              type="button"
              className="btn-back"
              onClick={() => setStep('details')}
            >
              <ArrowLeft size={18} />
              Back to details
            </button>

            <div className="otp-message">
              <p>We've sent a verification code via {otpMethod === 'email' ? 'Email' : 'SMS'} to</p>
              <strong>{otpMethod === 'email' ? formData.email : formData.phone}</strong>
            </div>

            {devOTP && (
              <div style={{
                background: '#fef3c7',
                border: '2px solid #f59e0b',
                borderRadius: '8px',
                padding: '15px',
                margin: '15px 0',
                textAlign: 'center'
              }}>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#92400e' }}>
                  🔓 <strong>Development Mode</strong>
                </p>
                <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#78350f' }}>
                  Your verification code:
                </p>
                <div style={{
                  background: '#fff',
                  padding: '12px',
                  borderRadius: '6px',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  letterSpacing: '4px',
                  color: '#f59e0b',
                  fontFamily: 'monospace'
                }}>
                  {devOTP}
                </div>
                <p style={{ margin: '8px 0 0 0', fontSize: '11px', color: '#92400e' }}>
                  Email service not configured - code shown for testing
                </p>
              </div>
            )}

            <div className="form-group">
              <label htmlFor="otp">Enter Verification Code</label>
              <input
                type="text"
                id="otp"
                className="otp-input"
                placeholder="• • • • • •"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                maxLength={6}
                autoComplete="one-time-code"
                inputMode="numeric"
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="btn-primary" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={20} className="spinner" />
                  Creating account...
                </>
              ) : (
                <>
                  Create Account
                  <ArrowRight size={20} />
                </>
              )}
            </button>

            <div className="otp-actions">
              <button
                type="button"
                className="btn-text"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || isLoading}
              >
                <RefreshCw size={16} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend Code'}
              </button>
            </div>

            <div className="terms-agreement">
              <p>
                By creating an account, you agree to our{' '}
                <Link to="/terms" target="_blank">Terms & Conditions</Link>
                {' '}and{' '}
                <Link to="/privacy" target="_blank">Privacy Policy</Link>
              </p>
            </div>
          </form>
        )}

        <div className="auth-footer">
          <p>
            Already have an account?{' '}
            <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>

      <div className="auth-side">
        <div className="auth-side-content">
          <h2>Join thousands of farmers and buyers</h2>
          <ul>
            <li>✓ Free to join</li>
            <li>✓ Verified community</li>
            <li>✓ Secure transactions</li>
            <li>✓ 24/7 support</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
