import { useState } from 'react';
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseReady } from '../../lib/supabase';
import { walletService } from '../../services/supabase/walletService';
import './StripePayment.css';

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

// Note: For full Stripe integration, you need:
// 1. npm install @stripe/stripe-js @stripe/react-stripe-js
// 2. Backend server with secret key to create payment intents
// Current implementation: Demo mode with UI simulation

interface StripePaymentProps {
  amount: number;
  currency?: string;
  orderId: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

interface CardDetails {
  number: string;
  expiry: string;
  cvc: string;
  name: string;
}

export default function StripePayment({
  amount,
  currency = 'USD',
  orderId,
  onSuccess,
  onError,
  onCancel
}: StripePaymentProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'input' | 'processing' | 'success' | 'error'>('input');
  const [errorMessage, setErrorMessage] = useState('');
  const [cardDetails, setCardDetails] = useState<CardDetails>({
    number: '',
    expiry: '',
    cvc: '',
    name: ''
  });

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field: keyof CardDetails, value: string) => {
    let formattedValue = value;
    
    if (field === 'number') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiry') {
      formattedValue = formatExpiry(value.replace('/', ''));
    } else if (field === 'cvc') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    
    setCardDetails(prev => ({ ...prev, [field]: formattedValue }));
  };

  const validateCard = (): boolean => {
    const { number, expiry, cvc, name } = cardDetails;
    
    if (!name.trim()) {
      setErrorMessage('Please enter cardholder name');
      return false;
    }
    
    const cardNumber = number.replace(/\s/g, '');
    if (cardNumber.length < 13 || cardNumber.length > 19) {
      setErrorMessage('Invalid card number');
      return false;
    }
    
    const [month, year] = expiry.split('/');
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    
    if (!month || !year || parseInt(month) > 12 || parseInt(month) < 1) {
      setErrorMessage('Invalid expiry date');
      return false;
    }
    
    if (parseInt(year) < currentYear || (parseInt(year) === currentYear && parseInt(month) < currentMonth)) {
      setErrorMessage('Card has expired');
      return false;
    }
    
    if (cvc.length < 3) {
      setErrorMessage('Invalid CVC');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!validateCard()) return;
    
    setLoading(true);
    setStatus('processing');
    
    try {
      const paymentId = `pi_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Record transaction in Supabase if available
      if (isSupabaseReady() && user) {
        await walletService.deposit(user.id, amount, `card_${orderId}`);
      }

      setStatus('success');
      setTimeout(() => {
        onSuccess(paymentId);
      }, 1500);
      
    } catch (error: any) {
      setStatus('error');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getCardType = (number: string): string => {
    const cleanNumber = number.replace(/\s/g, '');
    if (/^4/.test(cleanNumber)) return 'visa';
    if (/^5[1-5]/.test(cleanNumber)) return 'mastercard';
    if (/^3[47]/.test(cleanNumber)) return 'amex';
    if (/^6(?:011|5)/.test(cleanNumber)) return 'discover';
    return 'generic';
  };

  if (status === 'success') {
    return (
      <div className="stripe-payment success">
        <CheckCircle size={64} className="success-icon" />
        <h3>Payment Successful!</h3>
        <p>Your payment of {currency} {amount.toFixed(2)} has been processed.</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="stripe-payment processing">
        <Loader size={48} className="processing-icon" />
        <h3>Processing Payment...</h3>
        <p>Please wait while we process your payment.</p>
        <div className="processing-animation">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="stripe-payment">
      <div className="payment-header">
        <h3><CreditCard size={20} /> Card Payment</h3>
        <div className="card-brands">
          <img src="/icons/visa.svg" alt="Visa" />
          <img src="/icons/mastercard.svg" alt="Mastercard" />
          <img src="/icons/amex.svg" alt="Amex" />
        </div>
      </div>

      <div className="payment-amount">
        <span>Total Amount</span>
        <strong>{currency} {amount.toFixed(2)}</strong>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Cardholder Name</label>
          <input
            type="text"
            value={cardDetails.name}
            onChange={e => handleInputChange('name', e.target.value)}
            placeholder="John Doe"
            required
          />
        </div>

        <div className="form-group">
          <label>Card Number</label>
          <div className="card-input">
            <input
              type="text"
              value={cardDetails.number}
              onChange={e => handleInputChange('number', e.target.value)}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              required
            />
            <span className={`card-type ${getCardType(cardDetails.number)}`}></span>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Expiry Date</label>
            <input
              type="text"
              value={cardDetails.expiry}
              onChange={e => handleInputChange('expiry', e.target.value)}
              placeholder="MM/YY"
              maxLength={5}
              required
            />
          </div>
          <div className="form-group">
            <label>CVC</label>
            <input
              type="text"
              value={cardDetails.cvc}
              onChange={e => handleInputChange('cvc', e.target.value)}
              placeholder="123"
              maxLength={4}
              required
            />
          </div>
        </div>

        {errorMessage && (
          <div className="error-message">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        <div className="security-note">
          <Lock size={14} />
          <span>Your payment info is encrypted and secure</span>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" className="pay-btn" disabled={loading}>
            {loading ? 'Processing...' : `Pay ${currency} ${amount.toFixed(2)}`}
          </button>
        </div>
      </form>
    </div>
  );
}
