import { useState, useEffect, useRef } from 'react';
import { loadStripe, type Stripe, type StripeCardElement } from '@stripe/stripe-js';
import { CreditCard, Lock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import './StripePayment.css';

// API base URL - uses Vercel serverless functions
const API_URL = import.meta.env.VITE_API_URL || '/api';

interface RealStripePaymentProps {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

export default function RealStripePayment({
  amount,
  currency = 'USD',
  orderId,
  customerEmail,
  onSuccess,
  onError,
  onCancel,
}: RealStripePaymentProps) {
  const [stripe, setStripe] = useState<Stripe | null>(null);
  const [cardElement, setCardElement] = useState<StripeCardElement | null>(null);
  const [status, setStatus] = useState<'loading' | 'input' | 'processing' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [isCardComplete, setIsCardComplete] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Initialize Stripe
  useEffect(() => {
    const initStripe = async () => {
      const publishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;
      
      if (!publishableKey) {
        setStatus('error');
        setErrorMessage('Stripe is not configured. Please contact support.');
        return;
      }

      try {
        const stripeInstance = await loadStripe(publishableKey);
        if (stripeInstance) {
          setStripe(stripeInstance);
          setStatus('input');
        } else {
          throw new Error('Failed to load Stripe');
        }
      } catch (err) {
        console.error('Stripe init error:', err);
        setStatus('error');
        setErrorMessage('Failed to initialize payment system.');
      }
    };

    initStripe();
  }, []);

  // Mount Card Element when Stripe is ready
  useEffect(() => {
    if (!stripe || !cardRef.current || cardElement) return;

    const elements = stripe.elements();
    const card = elements.create('card', {
      style: {
        base: {
          color: '#32325d',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
          fontSmoothing: 'antialiased',
          fontSize: '16px',
          '::placeholder': {
            color: '#aab7c4',
          },
        },
        invalid: {
          color: '#fa755a',
          iconColor: '#fa755a',
        },
      },
      hidePostalCode: true,
    });

    card.mount(cardRef.current);
    
    card.on('change', (event) => {
      setIsCardComplete(event.complete);
      if (event.error) {
        setErrorMessage(event.error.message);
      } else {
        setErrorMessage('');
      }
    });

    setCardElement(card);

    return () => {
      card.unmount();
    };
  }, [stripe]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!stripe || !cardElement) {
      setErrorMessage('Payment system not ready. Please refresh.');
      return;
    }

    if (!cardholderName.trim()) {
      setErrorMessage('Please enter cardholder name');
      return;
    }

    setStatus('processing');

    try {
      // Step 1: Create payment intent on backend
      const response = await fetch(`${API_URL}/create-payment-intent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency,
          orderId,
          customerEmail,
          description: `MAKEFARMHUB Order #${orderId}`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create payment');
      }

      const { clientSecret } = await response.json();

      // Step 2: Confirm payment with Stripe
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: cardElement,
          billing_details: {
            name: cardholderName,
            email: customerEmail,
          },
        },
      });

      if (error) {
        throw new Error(error.message || 'Payment failed');
      }

      if (paymentIntent?.status === 'succeeded') {
        setStatus('success');
        setTimeout(() => {
          onSuccess(paymentIntent.id);
        }, 1500);
      } else {
        throw new Error('Payment was not successful');
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      setStatus('input');
      setErrorMessage(error.message || 'Payment failed. Please try again.');
      onError(error.message);
    }
  };

  if (status === 'loading') {
    return (
      <div className="stripe-payment loading">
        <div className="processing-animation">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>
        <p>Loading payment system...</p>
      </div>
    );
  }

  if (status === 'error' && !cardElement) {
    return (
      <div className="stripe-payment error">
        <AlertCircle size={48} />
        <h3>Payment Not Available</h3>
        <p>{errorMessage}</p>
        {onCancel && (
          <button className="cancel-btn" onClick={onCancel}>Go Back</button>
        )}
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="stripe-payment success">
        <CheckCircle size={64} className="success-icon" />
        <h3>Payment Successful!</h3>
        <p>Your payment of {currency} {amount.toFixed(2)} has been processed.</p>
        <p className="success-note">Funds are held in escrow until delivery is confirmed.</p>
      </div>
    );
  }

  if (status === 'processing') {
    return (
      <div className="stripe-payment processing">
        <Loader size={48} className="processing-icon" />
        <h3>Processing Payment...</h3>
        <p>Please wait while we securely process your payment.</p>
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
        <h3><CreditCard size={20} /> Secure Card Payment</h3>
        <div className="card-brands">
          <span className="brand visa">Visa</span>
          <span className="brand mastercard">MC</span>
          <span className="brand amex">Amex</span>
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
            value={cardholderName}
            onChange={e => setCardholderName(e.target.value)}
            placeholder="Name on card"
            required
          />
        </div>

        <div className="form-group">
          <label>Card Details</label>
          <div className="stripe-card-element" ref={cardRef}></div>
        </div>

        {errorMessage && (
          <div className="error-message">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        <div className="security-note">
          <Lock size={14} />
          <span>Secured by Stripe. Your card details are encrypted.</span>
        </div>

        <div className="form-actions">
          {onCancel && (
            <button type="button" className="cancel-btn" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="pay-btn"
            disabled={!stripe || !isCardComplete || !cardholderName.trim()}
          >
            Pay {currency} {amount.toFixed(2)}
          </button>
        </div>
      </form>

      <div className="stripe-badge">
        <span>Powered by</span>
        <strong>Stripe</strong>
      </div>
    </div>
  );
}
