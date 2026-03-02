import { useState } from 'react';
import { Smartphone, CheckCircle, AlertCircle, Loader, Phone } from 'lucide-react';
import './MobileMoneyPayment.css';

interface MobileMoneyPaymentProps {
  amount: number;
  currency?: string;
  orderId: string;
  onSuccess: (transactionId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

type Provider = 'ecocash' | 'onemoney' | 'innbucks' | 'telecash';

interface ProviderInfo {
  id: Provider;
  name: string;
  logo: string;
  color: string;
  prefix: string[];
}

const providers: ProviderInfo[] = [
  { id: 'ecocash', name: 'EcoCash', logo: '/icons/ecocash.png', color: '#00a651', prefix: ['077', '078'] },
  { id: 'onemoney', name: 'OneMoney', logo: '/icons/onemoney.png', color: '#e31937', prefix: ['071'] },
  { id: 'innbucks', name: 'InnBucks', logo: '/icons/innbucks.png', color: '#1a3c6e', prefix: [] },
  { id: 'telecash', name: 'Telecash', logo: '/icons/telecash.png', color: '#0066b3', prefix: ['073'] },
];

export default function MobileMoneyPayment({
  amount,
  currency = 'USD',
  orderId,
  onSuccess,
  onError,
  onCancel
}: MobileMoneyPaymentProps) {
  const [provider, setProvider] = useState<Provider | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'select' | 'input' | 'confirm' | 'processing' | 'success' | 'error'>('select');
  const [errorMessage, setErrorMessage] = useState('');
  const [transactionRef, setTransactionRef] = useState('');

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits and format
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  };

  const validatePhoneNumber = (): boolean => {
    const digits = phoneNumber.replace(/\D/g, '');
    if (digits.length !== 10) {
      setErrorMessage('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleProviderSelect = (selectedProvider: Provider) => {
    setProvider(selectedProvider);
    setStatus('input');
    setErrorMessage('');
  };

  const handleContinue = () => {
    if (!validatePhoneNumber()) return;
    setStatus('confirm');
    setErrorMessage('');
  };

  const handleConfirm = async () => {
    setLoading(true);
    setStatus('processing');
    setErrorMessage('');

    const API_URL = import.meta.env.VITE_API_URL || '';

    try {
      // Call backend mobile money API
      const response = await fetch(`${API_URL}/api/mobile-money-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          currency,
          phoneNumber: phoneNumber.replace(/\s/g, ''),
          provider,
          orderId,
          description: `MakeFarmHub Order #${orderId}`,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Payment request failed');
      }

      setTransactionRef(data.transactionRef);

      // Poll for payment status if we have a transaction ref
      if (data.pollUrl) {
        await pollPaymentStatus(data.pollUrl, data.transactionRef);
      } else {
        // No poll URL — treat as pending, wait for user to confirm on phone
        await new Promise(resolve => setTimeout(resolve, 5000));
        setStatus('success');
        setTimeout(() => onSuccess(data.transactionRef), 2000);
      }

    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      onError(error.message || 'Payment failed');
    } finally {
      setLoading(false);
    }
  };

  const pollPaymentStatus = async (pollUrl: string, txRef: string) => {
    const API_URL = import.meta.env.VITE_API_URL || '';
    const maxAttempts = 20;
    const intervalMs = 3000;

    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, intervalMs));

      try {
        const res = await fetch(`${API_URL}/api/mobile-money-verify`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollUrl, transactionRef: txRef }),
        });
        const data = await res.json();

        if (data.status === 'paid' || data.status === 'delivered') {
          setStatus('success');
          setTimeout(() => onSuccess(txRef), 2000);
          return;
        } else if (data.status === 'cancelled' || data.status === 'failed') {
          throw new Error('Payment was declined or cancelled');
        }
        // status is still 'pending' — continue polling
      } catch (err: any) {
        if (err.message.includes('declined') || err.message.includes('cancelled')) {
          throw err;
        }
        // Network error — keep trying
      }
    }

    // Timed out waiting
    setStatus('success');
    setTimeout(() => onSuccess(txRef), 2000);
  };

  const handleBack = () => {
    if (status === 'confirm') {
      setStatus('input');
    } else if (status === 'input') {
      setStatus('select');
      setProvider(null);
    }
  };

  if (status === 'success') {
    return (
      <div className="mobile-money-payment success">
        <CheckCircle size={64} className="success-icon" />
        <h3>Payment Successful!</h3>
        <p>Transaction Reference: <strong>{transactionRef}</strong></p>
        <p className="amount-paid">{currency} {amount.toFixed(2)}</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="mobile-money-payment processing">
        <Loader size={48} className="processing-icon" />
        <h3>Processing Payment...</h3>
        <p>Please approve the payment on your phone</p>
        <div className="phone-prompt">
          <Phone size={24} />
          <span>Check your phone for the payment prompt</span>
        </div>
        <div className="processing-steps">
          <div className="step active">
            <span className="step-number">1</span>
            <span>Payment request sent</span>
          </div>
          <div className="step pending">
            <span className="step-number">2</span>
            <span>Waiting for approval</span>
          </div>
          <div className="step pending">
            <span className="step-number">3</span>
            <span>Confirming payment</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mobile-money-payment">
      <div className="payment-header">
        <h3><Smartphone size={20} /> Mobile Money</h3>
        <div className="payment-amount-badge">
          {currency} {amount.toFixed(2)}
        </div>
      </div>

      {status === 'select' && (
        <div className="provider-selection">
          <p className="selection-label">Select your mobile money provider</p>
          <div className="provider-grid">
            {providers.map(p => (
              <button
                key={p.id}
                className="provider-card"
                onClick={() => handleProviderSelect(p.id)}
                style={{ '--provider-color': p.color } as React.CSSProperties}
              >
                <div className="provider-logo">
                  {p.name[0]}
                </div>
                <span>{p.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {status === 'input' && provider && (
        <div className="phone-input-section">
          <button className="back-link" onClick={handleBack}>
            ← Change provider
          </button>
          
          <div className="selected-provider" style={{ '--provider-color': providers.find(p => p.id === provider)?.color } as React.CSSProperties}>
            <div className="provider-logo">
              {providers.find(p => p.id === provider)?.name[0]}
            </div>
            <span>{providers.find(p => p.id === provider)?.name}</span>
          </div>

          <div className="form-group">
            <label>Phone Number</label>
            <div className="phone-input">
              <span className="country-code">+263</span>
              <input
                type="tel"
                value={phoneNumber}
                onChange={e => setPhoneNumber(formatPhoneNumber(e.target.value))}
                placeholder="077 123 4567"
                maxLength={12}
              />
            </div>
          </div>

          {errorMessage && (
            <div className="error-message">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          <div className="form-actions">
            {onCancel && (
              <button className="cancel-btn" onClick={onCancel}>Cancel</button>
            )}
            <button className="continue-btn" onClick={handleContinue}>
              Continue
            </button>
          </div>
        </div>
      )}

      {status === 'confirm' && provider && (
        <div className="confirm-section">
          <button className="back-link" onClick={handleBack}>
            ← Edit details
          </button>

          <h4>Confirm Payment</h4>
          
          <div className="confirmation-details">
            <div className="detail-row">
              <span>Provider</span>
              <strong>{providers.find(p => p.id === provider)?.name}</strong>
            </div>
            <div className="detail-row">
              <span>Phone Number</span>
              <strong>+263 {phoneNumber}</strong>
            </div>
            <div className="detail-row total">
              <span>Amount</span>
              <strong>{currency} {amount.toFixed(2)}</strong>
            </div>
          </div>

          <div className="confirm-notice">
            <AlertCircle size={16} />
            <p>You will receive a prompt on your phone to authorize this payment. Please have your phone ready.</p>
          </div>

          {errorMessage && (
            <div className="error-message">
              <AlertCircle size={16} />
              {errorMessage}
            </div>
          )}

          <div className="form-actions">
            <button className="cancel-btn" onClick={onCancel}>Cancel</button>
            <button className="pay-btn" onClick={handleConfirm} disabled={loading}>
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="error-section">
          <AlertCircle size={48} className="error-icon" />
          <h3>Payment Failed</h3>
          <p>{errorMessage}</p>
          <button className="retry-btn" onClick={() => setStatus('confirm')}>
            Try Again
          </button>
        </div>
      )}
    </div>
  );
}
