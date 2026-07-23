import { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

const RealStripePayment = import('./RealStripePayment').then(m => m.default);

interface SmartPaymentProps {
  amount: number;
  currency?: string;
  orderId: string;
  customerEmail?: string;
  onSuccess: (paymentId: string) => void;
  onError: (error: string) => void;
  onCancel?: () => void;
}

/**
 * Card checkout — only loads real Stripe Elements when publishable key is set.
 * Never falls back to a fake payment that credits wallets.
 */
export default function SmartPayment(props: SmartPaymentProps) {
  const [PaymentComponent, setPaymentComponent] = useState<React.ComponentType<any> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadPaymentComponent = async () => {
      try {
        const hasStripeKey = !!import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim();

        if (!hasStripeKey) {
          setError(
            'Card payments are not configured yet. Use EcoCash, OneMoney, or InnBucks, or ask the admin to add Stripe keys.'
          );
          return;
        }

        const RealPayment = await RealStripePayment;
        setPaymentComponent(() => RealPayment);
      } catch (err) {
        console.error('Failed to load payment component:', err);
        setError('Payment system unavailable. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadPaymentComponent();
  }, []);

  if (loading) {
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

  if (error || !PaymentComponent) {
    return (
      <div className="stripe-payment error">
        <AlertCircle size={48} />
        <h3>Card Payment Unavailable</h3>
        <p>{error || 'Unable to load payment system.'}</p>
        {props.onCancel && (
          <button className="cancel-btn" onClick={props.onCancel}>
            Choose another method
          </button>
        )}
      </div>
    );
  }

  return <PaymentComponent {...props} />;
}
