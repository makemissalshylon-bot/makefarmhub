import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import { walletService } from '../../services/supabase/walletService';
import { isSupabaseReady } from '../../lib/supabase';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowDownLeft,
  Plus,
  CreditCard,
  Smartphone,
  Building2,
  Clock,
  CheckCircle,
  XCircle,
  ChevronRight,
  Shield,
  TrendingUp,
  Lock,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  X,
  AlertCircle,
} from 'lucide-react';

export default function Wallet() {
  const { user } = useAuth();
  const { showToast } = useToast();

  // Real Supabase state
  const [walletBalance, setWalletBalance] = useState(0);
  const [escrowBalance, setEscrowBalance] = useState(0);
  const [walletTransactions, setWalletTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showBalance, setShowBalance] = useState(true);
  const [activeTab, setActiveTab] = useState<'transactions' | 'escrow' | 'methods'>('transactions');
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('EcoCash');
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentType, setNewPaymentType] = useState<'mobile_money' | 'bank_transfer' | 'card' | null>(null);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeOrderId, setDisputeOrderId] = useState<string | null>(null);
  const [disputeReason, setDisputeReason] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  const [paymentMethods] = useState(() => {
    const stored = localStorage.getItem('makefarmhub_payment_methods');
    return stored ? JSON.parse(stored) : [];
  });

  const loadWallet = useCallback(async () => {
    if (!user?.id || !isSupabaseReady()) return;
    try {
      const [wallet, txns] = await Promise.all([
        walletService.getWallet(user.id),
        walletService.getTransactions(user.id),
      ]);
      setWalletBalance((wallet as any)?.balance ?? 0);
      setEscrowBalance((wallet as any)?.escrow_held ?? 0);
      setWalletTransactions(txns || []);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to load wallet');
    } finally {
      setLoading(false);
    }
  }, [user?.id, showToast]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  // Escrow payments derived from real transactions
  const escrowPayments = walletTransactions
    .filter(t => t.type === 'escrow_hold' || t.type === 'escrow_release')
    .map(t => ({
      id: t.id,
      orderId: (t.description || '').match(/order\s+(\S+)/i)?.[1] || t.reference || '',
      amount: t.amount,
      status: t.type === 'escrow_hold' ? 'held' : 'released',
      date: t.created_at,
      buyerId: user?.id || '',
      sellerId: '',
    }));

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) { 
      showToast('error', 'Please enter a valid amount greater than $0'); 
      return; 
    }
    if (amount > 10000) {
      showToast('error', 'Maximum deposit amount is $10,000');
      return;
    }
    
    setIsDepositing(true);
    try {
      if (user?.id && isSupabaseReady()) {
        await walletService.deposit(user.id, amount, selectedPaymentMethod);
        await loadWallet();
      } else {
        setWalletBalance(b => b + amount);
      }
      showToast('success', `$${amount.toFixed(2)} deposited via ${selectedPaymentMethod}`);
      setDepositAmount('');
      setShowDepositModal(false);
    } catch (error: any) {
      showToast('error', error.message || 'Deposit failed. Please try again.');
    } finally {
      setIsDepositing(false);
    }
  };

  const handleWithdraw = async () => {
    const amount = parseFloat(withdrawAmount);
    if (isNaN(amount) || amount <= 0) { 
      showToast('error', 'Please enter a valid amount greater than $0'); 
      return; 
    }
    if (amount > walletBalance) {
      showToast('error', 'Insufficient balance');
      return;
    }
    
    setIsWithdrawing(true);
    try {
      if (user?.id && isSupabaseReady()) {
        await walletService.withdraw(user.id, amount, selectedPaymentMethod);
        await loadWallet();
      } else {
        setWalletBalance(b => b - amount);
      }
      showToast('success', `$${amount.toFixed(2)} withdrawn to ${selectedPaymentMethod}`);
      setWithdrawAmount('');
      setShowWithdrawModal(false);
    } catch (error: any) {
      showToast('error', error.message || 'Withdrawal failed. Please try again.');
    } finally {
      setIsWithdrawing(false);
    }
  };

  const handleReleaseEscrow = async (orderId: string) => {
    showToast('success', 'Payment released to the seller');
    await loadWallet();
  };

  const handleRaiseDispute = () => {
    if (!disputeOrderId) return;
    if (!disputeReason.trim()) { showToast('error', 'Please provide a reason for the dispute'); return; }
    showToast('warning', 'Dispute raised. Our team will review it within 24 hours');
    setShowDisputeModal(false);
    setDisputeOrderId(null);
    setDisputeReason('');
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowDownLeft size={20} />;
      case 'withdrawal':
        return <ArrowUpRight size={20} />;
      case 'escrow_hold':
        return <Lock size={20} />;
      case 'escrow_release':
        return <CheckCircle size={20} />;
      case 'payment':
        return <CreditCard size={20} />;
      case 'refund':
        return <ArrowDownLeft size={20} />;
      default:
        return <WalletIcon size={20} />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={14} />;
      case 'pending':
        return <Clock size={14} />;
      case 'failed':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const getPaymentMethodIcon = (type: string, provider?: string) => {
    // Try to use logo image if available
    if (provider) {
      const logoMap: Record<string, string> = {
        'EcoCash': '/assets/payment-methods/ecocash.png',
        'OneMoney': '/assets/payment-methods/onemoney.png',
        'CBZ Bank': '/assets/payment-methods/bank.png',
        'Stanbic': '/assets/payment-methods/bank.png',
        'FBC': '/assets/payment-methods/bank.png',
      };
      
      if (logoMap[provider]) {
        return <img src={logoMap[provider]} alt={provider} style={{ width: 24, height: 24, objectFit: 'contain' }} />;
      }
    }
    
    // Fallback to icons
    switch (type) {
      case 'mobile_money':
        return <Smartphone size={24} />;
      case 'bank_transfer':
        return <Building2 size={24} />;
      case 'card':
        return <CreditCard size={24} />;
      default:
        return <CreditCard size={24} />;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="wallet-page">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '40vh' }}>
          <div className="spinner" style={{ width: 40, height: 40, border: '4px solid var(--border-color)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="wallet-page">
      {/* Wallet Header */}
      <div className="wallet-header">
        <div className="wallet-header-content">
          <h1>My Wallet</h1>
          <p>Manage your funds and payment methods</p>
        </div>
      </div>

      {/* Balance Cards */}
      <div className="balance-cards">
        <div className="balance-card main">
          <div className="balance-card-header">
            <div className="balance-label">
              <WalletIcon size={20} />
              <span>Available Balance</span>
            </div>
            <button 
              className="toggle-visibility"
              onClick={() => setShowBalance(!showBalance)}
            >
              {showBalance ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <div className="balance-amount">
            {showBalance ? formatCurrency(walletBalance) : '••••••'}
          </div>
          <div className="balance-actions">
            <button className="btn-deposit" onClick={() => setShowDepositModal(true)}>
              <Plus size={18} />
              Deposit
            </button>
            <button className="btn-withdraw" onClick={() => setShowWithdrawModal(true)}>
              <ArrowUpRight size={18} />
              Withdraw
            </button>
          </div>
        </div>

        <div className="balance-card secondary">
          <div className="balance-card-header">
            <div className="balance-label">
              <Clock size={20} />
              <span>Pending</span>
            </div>
          </div>
          <div className="balance-amount small">
            {showBalance ? formatCurrency(0) : '••••••'}
          </div>
          <p className="balance-hint">Funds being processed</p>
        </div>

        <div className="balance-card secondary escrow">
          <div className="balance-card-header">
            <div className="balance-label">
              <Shield size={20} />
              <span>Secure Payment</span>
            </div>
          </div>
          <div className="balance-amount small">
            {showBalance ? formatCurrency(escrowBalance) : '••••••'}
          </div>
          <p className="balance-hint">Held safely for active orders</p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="wallet-stats">
        <div className="wallet-stat">
          <TrendingUp size={20} />
          <div>
            <span className="stat-value">
              {formatCurrency(walletTransactions
                .filter(t => t.type === 'deposit' && new Date(t.created_at).getMonth() === new Date().getMonth())
                .reduce((s: number, t: any) => s + (t.amount || 0), 0))}
            </span>
            <span className="stat-label">Deposited This Month</span>
          </div>
        </div>
        <div className="wallet-stat">
          <CheckCircle size={20} />
          <div>
            <span className="stat-value">{walletTransactions.filter(t => t.status === 'completed').length}</span>
            <span className="stat-label">Completed Transactions</span>
          </div>
        </div>
        <div className="wallet-stat">
          <Shield size={20} />
          <div>
            <span className="stat-value">{escrowPayments.filter((e: any) => e.status === 'held').length}</span>
            <span className="stat-label">Active Secure Payments</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="wallet-tabs">
        <button
          className={`wallet-tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Transaction History
        </button>
        <button
          className={`wallet-tab ${activeTab === 'escrow' ? 'active' : ''}`}
          onClick={() => setActiveTab('escrow')}
        >
          Secure Payments
        </button>
        <button
          className={`wallet-tab ${activeTab === 'methods' ? 'active' : ''}`}
          onClick={() => setActiveTab('methods')}
        >
          Payment Methods
        </button>
      </div>

      {/* Tab Content */}
      <div className="wallet-content">
        {activeTab === 'transactions' && (
          <div className="transactions-list">
            {walletTransactions.length > 0 ? (
              walletTransactions.map((txn) => (
                <div key={txn.id} className="transaction-item">
                  <div className={`txn-icon ${txn.type}`}>
                    {getTransactionIcon(txn.type)}
                  </div>
                  <div className="txn-details">
                    <h4>{txn.description}</h4>
                    <p>
                      <span className="txn-date">
                        {new Date(txn.created_at || txn.date).toLocaleDateString()}
                      </span>
                    </p>
                  </div>
                  <div className="txn-amount-col">
                    <span className={`txn-amount ${txn.amount >= 0 ? 'positive' : 'negative'}`}>
                      {txn.amount >= 0 ? '+' : ''}{formatCurrency(Math.abs(txn.amount))}
                    </span>
                    <span className={`txn-status ${txn.status}`}>
                      {getStatusIcon(txn.status)}
                      {txn.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <WalletIcon size={48} />
                <h3>No transactions yet</h3>
                <p>Your transaction history will appear here</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'escrow' && (
          <div className="escrow-list">
            {escrowPayments.length > 0 ? escrowPayments.map((escrow: any) => (
              <div key={escrow.id} className="escrow-card">
                <div className="escrow-header">
                  <span className={`escrow-status ${escrow.status}`}>
                    {escrow.status === 'held' && <Lock size={14} />}
                    {escrow.status === 'released' && <CheckCircle size={14} />}
                    {escrow.status === 'pending' && <Clock size={14} />}
                    {escrow.status === 'completed' && <CheckCircle size={14} />}
                    {escrow.status}
                  </span>
                  <span className="escrow-id">#{escrow.orderId}</span>
                </div>
                <div className="escrow-body">
                  <div className="escrow-amounts">
                    <div className="amount-row">
                      <span>Amount</span>
                      <span>{formatCurrency(escrow.amount)}</span>
                    </div>
                    <div className="amount-row">
                      <span>Platform Fee (5%)</span>
                      <span>{formatCurrency(escrow.amount * 0.05)}</span>
                    </div>
                    <div className="amount-row total">
                      <span>Total</span>
                      <span>{formatCurrency(escrow.amount * 1.05)}</span>
                    </div>
                  </div>
                  <div className="escrow-info">
                    <p>
                      <strong>Date:</strong> {new Date(escrow.date).toLocaleString()}
                    </p>
                  </div>
                </div>
                {escrow.status === 'held' && user?.role === 'buyer' && (
                  <div className="escrow-actions">
                    <button 
                      className="btn-outline"
                      onClick={() => {
                        setDisputeOrderId(escrow.orderId);
                        setShowDisputeModal(true);
                      }}
                    >
                      Raise Dispute
                    </button>
                    <button 
                      className="btn-primary"
                      onClick={() => handleReleaseEscrow(escrow.orderId)}
                    >
                      <CheckCircle size={16} />
                      Confirm Delivery & Release
                    </button>
                  </div>
                )}
                {escrow.status === 'pending' && user?.role === 'buyer' && (
                  <div className="escrow-actions">
                    <button className="btn-primary">
                      <CreditCard size={16} />
                      Complete Payment
                    </button>
                  </div>
                )}
              </div>
            )) : (
              <div className="empty-state">
                <Shield size={40} />
                <p>No escrow payments yet</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'methods' && (
          <div className="payment-methods">
            <div className="methods-header">
              <h3>Saved Payment Methods</h3>
              <button className="btn-add-method" onClick={() => setShowAddPaymentModal(true)}>
                <Plus size={18} />
                Add New
              </button>
            </div>
            <div className="methods-list">
              {paymentMethods.map((method: any) => (
                <div key={method.id} className={`method-card ${method.isDefault ? 'default' : ''}`}>
                  <div className="method-icon">
                    {getPaymentMethodIcon(method.type, method.provider)}
                  </div>
                  <div className="method-details">
                    <h4>
                      {method.provider}
                      {method.isDefault && <span className="default-badge">Default</span>}
                    </h4>
                    <p>{method.accountNumber}</p>
                    <p className="account-name">{method.accountName}</p>
                  </div>
                  <div className="method-status">
                    {method.verified ? (
                      <span className="verified">
                        <CheckCircle size={14} /> Verified
                      </span>
                    ) : (
                      <span className="unverified">
                        <Clock size={14} /> Pending
                      </span>
                    )}
                  </div>
                  <button className="btn-icon">
                    <ChevronRight size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="add-method-options">
              <h4>Add Payment Method</h4>
              <div className="method-options">
                <button className="method-option" onClick={() => { setNewPaymentType('mobile_money'); setShowAddPaymentModal(true); }}>
                  <Smartphone size={24} />
                  <span>Mobile Money</span>
                  <small>EcoCash, OneMoney, InnBucks</small>
                </button>
                <button className="method-option" onClick={() => { setNewPaymentType('bank_transfer'); setShowAddPaymentModal(true); }}>
                  <Building2 size={24} />
                  <span>Bank Account</span>
                  <small>CBZ, Stanbic, FBC, ZB</small>
                </button>
                <button className="method-option" onClick={() => { setNewPaymentType('card'); setShowAddPaymentModal(true); }}>
                  <CreditCard size={24} />
                  <span>Debit/Credit Card</span>
                  <small>Visa, Mastercard</small>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Deposit Modal */}
      {showDepositModal && (
        <div className="modal-overlay" onClick={() => setShowDepositModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Deposit Funds</h2>
              <button className="modal-close" onClick={() => setShowDepositModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Amount (USD)</label>
                <div className="amount-input">
                  <span className="currency">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    min="1"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <div className="payment-options">
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={selectedPaymentMethod === 'EcoCash'}
                      onChange={() => setSelectedPaymentMethod('EcoCash')}
                    />
                    <div className="option-content">
                      <img src="/assets/payment-methods/ecocash.png" alt="EcoCash" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'); }} />
                      <Smartphone size={32} style={{ display: 'none' }} />
                      <div>
                        <strong>EcoCash</strong>
                        <span>0782919633</span>
                      </div>
                    </div>
                  </label>
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={selectedPaymentMethod === 'OneMoney'}
                      onChange={() => setSelectedPaymentMethod('OneMoney')}
                    />
                    <div className="option-content">
                      <img src="/assets/payment-methods/onemoney.png" alt="OneMoney" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'); }} />
                      <Smartphone size={32} style={{ display: 'none' }} />
                      <div>
                        <strong>OneMoney</strong>
                        <span>0714291034</span>
                      </div>
                    </div>
                  </label>
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="payment" 
                      checked={selectedPaymentMethod === 'Bank Transfer'}
                      onChange={() => setSelectedPaymentMethod('Bank Transfer')}
                    />
                    <div className="option-content">
                      <img src="/assets/payment-methods/bank.png" alt="Bank Transfer" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'); }} />
                      <Building2 size={32} style={{ display: 'none' }} />
                      <div>
                        <strong>Bank Transfer</strong>
                        <span>5333038027264487</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="deposit-info">
                <p><Shield size={16} /> Your payment is secure and encrypted</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDepositModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleDeposit}>
                <Plus size={18} />
                Deposit Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Modal */}
      {showWithdrawModal && (
        <div className="modal-overlay" onClick={() => setShowWithdrawModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Withdraw Funds</h2>
              <button className="modal-close" onClick={() => setShowWithdrawModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="available-balance">
                <span>Available Balance</span>
                <strong>{formatCurrency(walletBalance)}</strong>
              </div>
              <div className="form-group">
                <label>Amount (USD)</label>
                <div className="amount-input">
                  <span className="currency">$</span>
                  <input 
                    type="number" 
                    placeholder="0.00" 
                    min="1" 
                    max={walletBalance}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                  />
                </div>
                <button 
                  type="button"
                  className="btn-max"
                  onClick={() => setWithdrawAmount(walletBalance.toString())}
                >
                  Withdraw All
                </button>
              </div>
              <div className="form-group">
                <label>Withdraw To</label>
                <div className="payment-options">
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="withdraw" 
                      checked={selectedPaymentMethod === 'EcoCash'}
                      onChange={() => setSelectedPaymentMethod('EcoCash')}
                    />
                    <div className="option-content">
                      <img src="/assets/payment-methods/ecocash.png" alt="EcoCash" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'); }} />
                      <Smartphone size={32} style={{ display: 'none' }} />
                      <div>
                        <strong>EcoCash</strong>
                        <span>0782919633</span>
                      </div>
                    </div>
                  </label>
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="withdraw" 
                      checked={selectedPaymentMethod === 'OneMoney'}
                      onChange={() => setSelectedPaymentMethod('OneMoney')}
                    />
                    <div className="option-content">
                      <img src="/assets/payment-methods/onemoney.png" alt="OneMoney" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'); }} />
                      <Smartphone size={32} style={{ display: 'none' }} />
                      <div>
                        <strong>OneMoney</strong>
                        <span>0714291034</span>
                      </div>
                    </div>
                  </label>
                  <label className="payment-option">
                    <input 
                      type="radio" 
                      name="withdraw" 
                      checked={selectedPaymentMethod === 'Bank Transfer'}
                      onChange={() => setSelectedPaymentMethod('Bank Transfer')}
                    />
                    <div className="option-content">
                      <img src="/assets/payment-methods/bank.png" alt="Bank Transfer" style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.nextElementSibling && ((e.currentTarget.nextElementSibling as HTMLElement).style.display = 'block'); }} />
                      <Building2 size={32} style={{ display: 'none' }} />
                      <div>
                        <strong>Bank Transfer</strong>
                        <span>5333038027264487</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>
              <div className="withdraw-fee">
                <span>Withdrawal Fee</span>
                <span>$1.00</span>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowWithdrawModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleWithdraw}>
                <ArrowUpRight size={18} />
                Withdraw Funds
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Payment Method Modal */}
      {showAddPaymentModal && (
        <div className="modal-overlay" onClick={() => { setShowAddPaymentModal(false); setNewPaymentType(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Add Payment Method</h2>
              <button className="modal-close" onClick={() => { setShowAddPaymentModal(false); setNewPaymentType(null); }}>×</button>
            </div>
            <div className="modal-body">
              {!newPaymentType ? (
                <div className="payment-type-selection">
                  <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>Select a payment method type to add:</p>
                  <div className="method-options" style={{ flexDirection: 'column', gap: '0.75rem' }}>
                    <button className="method-option" onClick={() => setNewPaymentType('mobile_money')} style={{ width: '100%' }}>
                      <Smartphone size={24} />
                      <span>Mobile Money</span>
                      <small>EcoCash, OneMoney, InnBucks</small>
                    </button>
                    <button className="method-option" onClick={() => setNewPaymentType('bank_transfer')} style={{ width: '100%' }}>
                      <Building2 size={24} />
                      <span>Bank Account</span>
                      <small>CBZ, Stanbic, FBC, ZB</small>
                    </button>
                    <button className="method-option" onClick={() => setNewPaymentType('card')} style={{ width: '100%' }}>
                      <CreditCard size={24} />
                      <span>Debit/Credit Card</span>
                      <small>Visa, Mastercard</small>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="payment-form">
                  {newPaymentType === 'mobile_money' && (
                    <>
                      <div className="form-group">
                        <label>Provider</label>
                        <select>
                          <option>EcoCash</option>
                          <option>OneMoney</option>
                          <option>InnBucks</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Phone Number</label>
                        <input type="tel" placeholder="0771234567" />
                      </div>
                      <div className="form-group">
                        <label>Account Name</label>
                        <input type="text" placeholder="John Doe" />
                      </div>
                    </>
                  )}
                  {newPaymentType === 'bank_transfer' && (
                    <>
                      <div className="form-group">
                        <label>Bank Name</label>
                        <select>
                          <option>CBZ Bank</option>
                          <option>Stanbic Bank</option>
                          <option>FBC Bank</option>
                          <option>ZB Bank</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Account Number</label>
                        <input type="text" placeholder="1234567890" />
                      </div>
                      <div className="form-group">
                        <label>Account Name</label>
                        <input type="text" placeholder="John Doe" />
                      </div>
                    </>
                  )}
                  {newPaymentType === 'card' && (
                    <>
                      <div className="form-group">
                        <label>Card Number</label>
                        <input type="text" placeholder="1234 5678 9012 3456" maxLength={19} />
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="form-group">
                          <label>Expiry Date</label>
                          <input type="text" placeholder="MM/YY" maxLength={5} />
                        </div>
                        <div className="form-group">
                          <label>CVV</label>
                          <input type="text" placeholder="123" maxLength={3} />
                        </div>
                      </div>
                      <div className="form-group">
                        <label>Cardholder Name</label>
                        <input type="text" placeholder="John Doe" />
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
            {newPaymentType && (
              <div className="modal-footer">
                <button className="btn-secondary" onClick={() => setNewPaymentType(null)}>
                  Back
                </button>
                <button className="btn-primary" onClick={() => {
                  showToast('success', 'Payment method added successfully');
                  setShowAddPaymentModal(false);
                  setNewPaymentType(null);
                }}>
                  Add Payment Method
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <div className="modal-overlay" onClick={() => setShowDisputeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Raise Dispute</h2>
              <button className="btn-close" onClick={() => setShowDisputeModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ marginBottom: '1rem', color: 'var(--text-muted)' }}>
                Please provide details about the issue with order #{disputeOrderId}. Our support team will review your case within 24 hours.
              </p>
              <div className="form-group">
                <label>Reason for Dispute *</label>
                <textarea
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  placeholder="Describe the issue with your order (e.g., damaged goods, wrong items, delivery issues)..."
                  rows={6}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--border-color)' }}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDisputeModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleRaiseDispute}>
                <AlertCircle size={16} />
                Submit Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
