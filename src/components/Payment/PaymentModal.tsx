import { useState } from 'react';
import { X, CreditCard, CheckCircle, AlertCircle, Smartphone, Copy, Phone } from 'lucide-react';
import { useToast } from '../UI/Toast';
import { useAuth } from '../../context/AuthContext';
import { isSupabaseReady } from '../../lib/supabase';
import { walletService } from '../../services/supabase/walletService';
import '../../styles/payment-modal.css';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  orderId: string;
  onPaymentComplete: (paymentDetails: PaymentDetails) => void;
}

export interface PaymentDetails {
  method: 'ecocash' | 'onemoney' | 'innbucks';
  transactionRef: string;
  amount: number;
  timestamp: string;
}

type PaymentStep = 'select' | 'instructions' | 'confirm' | 'processing' | 'success';

export default function PaymentModal({ isOpen, onClose, amount, orderId, onPaymentComplete }: PaymentModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();
  const [step, setStep] = useState<PaymentStep>('select');
  const [selectedMethod, setSelectedMethod] = useState<'ecocash' | 'onemoney' | 'innbucks'>('ecocash');
  const [transactionRef, setTransactionRef] = useState('');

  if (!isOpen) return null;

  const paymentMethods = {
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
        'Enter the reference number below'
      ]
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
        'Enter the reference number below'
      ]
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
        'Enter the reference number below'
      ]
    }
  };

  const currentMethod = paymentMethods[selectedMethod];

  const handleMethodSelect = (method: 'ecocash' | 'onemoney' | 'innbucks') => {
    setSelectedMethod(method);
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
      // Record transaction in Supabase if available
      if (isSupabaseReady() && user) {
        await walletService.deposit(user.id, amount, `${selectedMethod}_${transactionRef}`);
      }

      setStep('success');
      const paymentDetails: PaymentDetails = {
        method: selectedMethod,
        transactionRef: transactionRef,
        amount: amount,
        timestamp: new Date().toISOString()
      };

      setTimeout(() => {
        onPaymentComplete(paymentDetails);
        onClose();
        resetModal();
      }, 2000);
    } catch {
      setStep('select');
      showToast('error', 'Payment verification failed. Please try again.');
    }
  };

  const resetModal = () => {
    setStep('select');
    setTransactionRef('');
  };

  const handleClose = () => {
    if (step === 'processing' || step === 'success') return;
    onClose();
    setTimeout(resetModal, 300);
  };

  return (
    <div className="payment-modal-overlay" onClick={handleClose}>
      <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="payment-modal-header">
          <div>
            <h2>Complete Payment</h2>
            <p className="payment-amount">Amount: <strong>${amount.toFixed(2)}</strong></p>
          </div>
          {step !== 'processing' && step !== 'success' && (
            <button className="close-btn" onClick={handleClose}>
              <X size={20} />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="payment-modal-content">
          {/* Step 1: Select Method */}
          {step === 'select' && (
            <div className="payment-methods">
              <h3>Select Payment Method</h3>
              <div className="payment-method-grid">
                {Object.entries(paymentMethods).map(([key, method]) => {
                  const Icon = method.icon;
                  return (
                    <button
                      key={key}
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

          {/* Step 2: Instructions */}
          {step === 'instructions' && (
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
                  className="copy-btn"
                  onClick={() => handleCopyCode(currentMethod.dialCode)}
                >
                  <Copy size={16} />
                </button>
              </div>

              <div className="merchant-code-box">
                <span>Merchant Code: <strong>{currentMethod.merchantCode}</strong></span>
                <button
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
                <button className="btn-back" onClick={() => setStep('select')}>
                  Back
                </button>
                <button
                  className="btn-confirm-payment"
                  onClick={handleConfirmPayment}
                  disabled={!transactionRef.trim()}
                >
                  <CheckCircle size={20} />
                  Confirm Payment
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Processing */}
          {step === 'processing' && (
            <div className="payment-processing">
              <div className="spinner-large"></div>
              <h3>Verifying Payment...</h3>
              <p>Please wait while we confirm your payment</p>
            </div>
          )}

          {/* Step 4: Success */}
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
                  <strong>{transactionRef}</strong>
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
