import { useState } from 'react';
import { X, CreditCard, CheckCircle, Smartphone, Copy, Phone, AlertCircle } from 'lucide-react';
import { useToast } from '../UI/Toast';
import { useAuth } from '../../context/AuthContext';
import SmartPayment from './SmartPayment';
import '../../styles/payment-modal.css';

const API_URL = import.meta.env.VITE_API_URL || '/api';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  onPaymentComplete: (paymentDetails: PaymentDetails) => void;
}

export interface PaymentDetails {
  method: 'ecocash' | 'onemoney' | 'innbucks' | 'card';
  transactionRef: string;
  amount: number;
  timestamp: string;
  status?: 'completed' | 'pending_verification';
}

type PaymentStep = 'select' | 'instructions' | 'card' | 'processing' | 'success' | 'pending';

export default function PaymentModal({ isOpen, onClose, amount, orderId, onPaymentComplete }: PaymentModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<PaymentStep>('select');
  const [selectedMethod, setSelectedMethod] = useState<'ecocash' | 'onemoney' | 'innbucks' | 'card'>('ecocash');
  const [transactionRef, setTransactionRef] = useState('');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [pendingMessage, setPendingMessage] = useState('');

  if (!isOpen) return null;

  const paymentMethods = {
    card: {
      name: 'Card (Stripe)',
      icon: CreditCard,
      color: '#635bff',
      dialCode: '',
      merchantCode: '',
      instructions: [] as string[],
    },
    ecocash: {
      name: 'EcoCash',
      icon: Smartphone,
      color: '#e53e3e',
      dialCode: '*151#',
      merchantCode: '400400',
      instructions: [
        'Dial *151# on your mobile phone',
        'Select option 1 (Send Money)',
        'Select option 3 (To Merchant)',
        `Enter merchant code: 400400`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
        'You will receive a confirmation SMS with reference number',
        'Enter the reference number below',
      ],
    },
    onemoney: {
      name: 'OneMoney',
      icon: Smartphone,
      color: '#d97706',
      dialCode: '*111#',
      merchantCode: 'MAKEFARM',
      instructions: [
        'Dial *111# on your mobile phone',
        'Select option 1 (Send Money)',
        'Select option 4 (Pay Merchant)',
        `Enter merchant name: MAKEFARM`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
        'You will receive a confirmation SMS with reference number',
        'Enter the reference number below',
      ],
    },
    innbucks: {
      name: 'InnBucks',
      icon: Smartphone,
      color: '#2563eb',
      dialCode: '*772#',
      merchantCode: 'MAKEFARMHUB',
      instructions: [
        'Dial *772# on your mobile phone',
        'Select option 1 (Send Money)',
        'Select option 5 (Pay Bills)',
        `Enter merchant: MAKEFARMHUB`,
        `Enter amount: $${amount.toFixed(2)}`,
        'Enter your PIN to confirm',
        'You will receive a confirmation SMS with reference number',
        'Enter the reference number below',
      ],
    },
  };

  const currentMethod = paymentMethods[selectedMethod];

  const handleMethodSelect = async (method: 'ecocash' | 'onemoney' | 'innbucks' | 'card') => {
    setSelectedMethod(method);
    if (method === 'card') {
      setStep('card');
      return;
    }

    // Initiate mobile money payment (pending until verified)
    try {
      const res = await fetch(`${API_URL}/mobile-money?action=initiate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          phone: user?.phone || '',
          provider: method,
          email: user?.email,
          orderId,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.paymentId) setPaymentId(data.paymentId);
    } catch {
      // Continue with manual flow even if initiate fails
    }
    setStep('instructions');
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    showToast('success', 'Code copied to clipboard!');
  };

  const handleConfirmPayment = async () => {
    if (!transactionRef.trim()) {
      showToast('error', 'Please enter the transaction reference number');
      return;
    }

    setStep('processing');

    try {
      const res = await fetch(`${API_URL}/mobile-money?action=verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId,
          reference: transactionRef.trim(),
          provider: selectedMethod,
          amount,
          phone: user?.phone,
          orderId,
        }),
      });

      const data = await res.json().catch(() => ({}));

      // Never treat unverified mobile money as completed funds
      if (data.verified === true && data.status === 'completed') {
        setStep('success');
        const paymentDetails: PaymentDetails = {
          method: selectedMethod as 'ecocash' | 'onemoney' | 'innbucks',
          transactionRef: transactionRef.trim(),
          amount,
          timestamp: new Date().toISOString(),
          status: 'completed',
        };
        setTimeout(() => {
          onPaymentComplete(paymentDetails);
          onClose();
          resetModal();
        }, 1500);
        return;
      }

      // Pending verification — order can proceed but payment is not released
      setPendingMessage(
        data.message ||
          'Reference recorded. Payment awaits verification before funds are released.'
      );
      setStep('pending');
      const paymentDetails: PaymentDetails = {
        method: selectedMethod as 'ecocash' | 'onemoney' | 'innbucks',
        transactionRef: transactionRef.trim(),
        amount,
        timestamp: new Date().toISOString(),
        status: 'pending_verification',
      };
      setTimeout(() => {
        onPaymentComplete(paymentDetails);
        onClose();
        resetModal();
      }, 2500);
    } catch {
      setStep('instructions');
      showToast('error', 'Payment verification failed. Please try again.');
    }
  };

  const handleCardSuccess = (paymentIdResult: string) => {
    setStep('success');
    const paymentDetails: PaymentDetails = {
      method: 'card',
      transactionRef: paymentIdResult,
      amount,
      timestamp: new Date().toISOString(),
      status: 'completed',
    };
    setTimeout(() => {
      onPaymentComplete(paymentDetails);
      onClose();
      resetModal();
    }, 1200);
  };

  const resetModal = () => {
    setStep('select');
    setTransactionRef('');
    setPaymentId(null);
    setPendingMessage('');
    setSelectedMethod('ecocash');
  };

  const handleClose = () => {
    if (step === 'processing' || step === 'success' || step === 'pending') return;
    onClose();
    setTimeout(resetModal, 300);
  };

  return (
    <div className="payment-modal-overlay" onClick={handleClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        <div className="payment-modal-header">
          <div>
            <h2>Complete Payment</h2>
            <p className="payment-amount">Amount: <strong>${amount.toFixed(2)}</strong></p>
          </div>
          {step !== 'processing' && step !== 'success' && step !== 'pending' && (
            <button className="close-btn" onClick={handleClose} type="button">
              <X size={20} />
            </button>
          )}
        </div>

        <div className="payment-modal-content">
          {step === 'select' && (
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-method-grid">
                {Object.entries(paymentMethods).map(([key, method]) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={key}
                      type="button"
                      className="payment-method-card"
                      onClick={() => handleMethodSelect(key as any)}
                      style={{ borderColor: method.color }}
                    >
                      <Icon size={32} color={method.color} />
                      <span>{method.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 'card' && (
            <div className="payment-card-flow">
              <button type="button" className="btn-back" onClick={() => setStep('select')}>
                Back
              </button>
              <SmartPayment
                amount={amount}
                orderId={orderId}
                customerEmail={user?.email}
                onSuccess={handleCardSuccess}
                onError={(err) => showToast('error', err)}
                onCancel={() => setStep('select')}
              />
            </div>
          )}

          {step === 'instructions' && selectedMethod !== 'card' && (
            <div className="payment-instructions">
              <div className="payment-method-header">
                <currentMethod.icon size={40} color={currentMethod.color} />
                <div>
                  <h3>{currentMethod.name}</h3>
                  <p>Follow these steps to complete payment</p>
                </div>
              </div>

              <div className="dial-code-box">
                <Phone size={20} />
                <span>Dial: <strong>{currentMethod.dialCode}</strong></span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => handleCopyCode(currentMethod.dialCode)}
                >
                  <Copy size={16} />
                </button>
              </div>

              <div className="merchant-code-box">
                <span>Merchant Code: <strong>{currentMethod.merchantCode}</strong></span>
                <button
                  type="button"
                  className="copy-btn"
                  onClick={() => handleCopyCode(currentMethod.merchantCode)}
                >
                  <Copy size={16} />
                </button>
              </div>

              <div className="instructions-list">
                <h4>Step-by-Step Instructions:</h4>
                <ol>
                  {currentMethod.instructions.map((instruction, index) => (
                    <li key={index}>{instruction}</li>
                  ))}
                </ol>
              </div>

              <div className="form-group">
                <label htmlFor="transactionRef">Transaction Reference Number *</label>
                <input
                  id="transactionRef"
                  type="text"
                  placeholder="e.g., MP123456789"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className="transaction-ref-input"
                />
                <small>Enter the reference number from your confirmation SMS</small>
              </div>

              <div className="payment-actions">
                <button type="button" className="btn-back" onClick={() => setStep('select')}>
                  Back
                </button>
                <button
                  type="button"
                  className="btn-confirm-payment"
                  onClick={handleConfirmPayment}
                  disabled={!transactionRef.trim()}
                >
                  <CheckCircle size={20} />
                  Submit Reference
                </button>
              </div>
            </div>
          )}

          {step === 'processing' && (
            <div className="payment-processing">
              <div className="spinner-large"></div>
              <h3>Verifying Payment...</h3>
              <p>Please wait while we confirm your payment</p>
            </div>
          )}

          {step === 'pending' && (
            <div className="payment-success">
              <div className="success-icon">
                <AlertCircle size={64} color="#d97706" />
              </div>
              <h3>Awaiting Verification</h3>
              <p>{pendingMessage}</p>
              <div className="payment-details">
                <div className="detail-row">
                  <span>Reference:</span>
                  <strong>{transactionRef}</strong>
                </div>
                <div className="detail-row">
                  <span>Amount:</span>
                  <strong>${amount.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}

          {step === 'success' && (
            <div className="payment-success">
              <div className="success-icon">
                <CheckCircle size={64} color="#16a34a" />
              </div>
              <h3>Payment Successful!</h3>
              <p>Your payment has been confirmed</p>
              <div className="payment-details">
                <div className="detail-row">
                  <span>Method:</span>
                  <strong>{currentMethod.name}</strong>
                </div>
                <div className="detail-row">
                  <span>Reference:</span>
                  <strong>{transactionRef || 'Card payment'}</strong>
                </div>
                <div className="detail-row">
                  <span>Amount:</span>
                  <strong>${amount.toFixed(2)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
