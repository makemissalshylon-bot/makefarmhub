import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../components/UI/Toast';
import {
  User,
  Bell,
  Shield,
  Lock,
  Eye,
  Smartphone,
  Mail,
  MapPin,
  Camera,
  Trash2,
  Key,
  Sun,
  Moon,
  Monitor,
  Wallet,
  CreditCard,
  Plus,
  Check,
  Building2,
  Copy,
  Upload,
} from 'lucide-react';
import '../../styles/settings.css';

type SettingsTab = 'account' | 'notifications' | 'privacy' | 'security' | 'payment' | 'appearance';

interface PaymentMethod {
  id: string;
  type: 'ecocash' | 'onemoney' | 'innbucks' | 'bank';
  name: string;
  accountNumber: string;
  accountName: string;
  isDefault: boolean;
}

export default function Settings() {
  const [searchParams] = useSearchParams();
  const { user, updateProfile, updateAvatar, updatePassword } = useAuth();
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  
  // Handle URL tab parameter
  const urlTab = searchParams.get('tab') as SettingsTab | null;
  const [activeTab, setActiveTab] = useState<SettingsTab>(urlTab || 'account');
  
  useEffect(() => {
    if (urlTab && ['account', 'notifications', 'privacy', 'security', 'payment', 'appearance'].includes(urlTab)) {
      setActiveTab(urlTab);
    }
  }, [urlTab]);
  
  // Form states
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
    bio: '',
  });

  const [notifications, setNotifications] = useState({
    orderUpdates: true,
    messages: true,
    promotions: false,
    newsletter: false,
    priceAlerts: true,
    newListings: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const [privacy, setPrivacy] = useState({
    showPhone: true,
    showEmail: false,
    showLocation: true,
    allowMessaging: true,
    showOnlineStatus: true,
    publicProfile: true,
  });

  const paymentStorageKey = user?.id ? `makefarmhub_payment_methods_${user.id}` : null;

  // User-owned payment methods only (never shared platform defaults)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);

  useEffect(() => {
    if (!paymentStorageKey) {
      setPaymentMethods([]);
      return;
    }
    try {
      const stored = localStorage.getItem(paymentStorageKey);
      setPaymentMethods(stored ? JSON.parse(stored) : []);
    } catch {
      setPaymentMethods([]);
    }
  }, [paymentStorageKey]);

  useEffect(() => {
    if (!paymentStorageKey) return;
    localStorage.setItem(paymentStorageKey, JSON.stringify(paymentMethods));
  }, [paymentMethods, paymentStorageKey]);

  useEffect(() => {
    if (!user?.id) return;
    try {
      const n = localStorage.getItem(`makefarmhub_notifications_${user.id}`);
      if (n) setNotifications((prev) => ({ ...prev, ...JSON.parse(n) }));
      const p = localStorage.getItem(`makefarmhub_privacy_${user.id}`);
      if (p) setPrivacy((prev) => ({ ...prev, ...JSON.parse(p) }));
    } catch {
      /* ignore corrupt prefs */
    }
  }, [user?.id]);

  const [showAddPayment, setShowAddPayment] = useState(false);
  const [newPayment, setNewPayment] = useState({
    type: 'ecocash' as PaymentMethod['type'],
    accountNumber: '',
    accountName: '',
  });
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyNumber = (number: string, id: string) => {
    navigator.clipboard.writeText(number);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(methods =>
      methods.map(m => ({ ...m, isDefault: m.id === id }))
    );
  };

  const handleDeletePayment = (id: string) => {
    setPaymentMethods(methods => methods.filter(m => m.id !== id));
  };

  const handleAddPayment = () => {
    if (!newPayment.accountNumber || !newPayment.accountName) return;
    
    const typeNames: Record<PaymentMethod['type'], string> = {
      ecocash: 'EcoCash',
      onemoney: 'OneMoney',
      innbucks: 'InnBucks',
      bank: 'Bank Transfer',
    };

    setPaymentMethods([
      ...paymentMethods,
      {
        id: Date.now().toString(),
        type: newPayment.type,
        name: typeNames[newPayment.type],
        accountNumber: newPayment.accountNumber,
        accountName: newPayment.accountName,
        isDefault: paymentMethods.length === 0,
      },
    ]);
    setNewPayment({ type: 'ecocash', accountNumber: '', accountName: '' });
    setShowAddPayment(false);
  };

  const getPaymentIcon = (type: PaymentMethod['type'], name?: string) => {
    // Try to use logo image if available
    const logoMap: Record<string, string> = {
      'EcoCash': '/assets/payment-methods/ecocash.png',
      'OneMoney': '/assets/payment-methods/onemoney.png',
      'InnBucks': '/assets/payment-methods/innbucks.png',
      'Bank Transfer': '/assets/payment-methods/bank.png',
    };
    
    if (name && logoMap[name]) {
      return <img src={logoMap[name]} alt={name} style={{ width: 32, height: 32, objectFit: 'contain' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />;
    }
    
    // Fallback to icons
    switch (type) {
      case 'bank':
        return <Building2 size={24} />;
      default:
        return <Smartphone size={24} />;
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        showToast('error', 'Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast('error', 'Image must be less than 5MB');
        return;
      }
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        updateAvatar(reader.result as string);
        setIsUploading(false);
        showToast('success', 'Profile picture updated!');
      };
      reader.onerror = () => {
        setIsUploading(false);
        showToast('error', 'Failed to upload image');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveAccount = () => {
    updateProfile(formData);
    showToast('success', 'Account settings saved successfully!');
  };

  const handleCancelAccount = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      location: user?.location || '',
      bio: '',
    });
    showToast('info', 'Changes discarded');
  };

  const handleSaveNotifications = () => {
    if (user?.id) {
      localStorage.setItem(`makefarmhub_notifications_${user.id}`, JSON.stringify(notifications));
    }
    showToast('success', 'Notification preferences saved on this device');
  };

  const handleSavePrivacy = () => {
    if (user?.id) {
      localStorage.setItem(`makefarmhub_privacy_${user.id}`, JSON.stringify(privacy));
    }
    showToast('success', 'Privacy settings saved on this device');
  };

  const tabs = [
    { id: 'account' as const, label: 'Account', icon: User },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Privacy', icon: Eye },
    { id: 'security' as const, label: 'Security', icon: Shield },
    { id: 'payment' as const, label: 'Payment Methods', icon: Wallet },
    { id: 'appearance' as const, label: 'Appearance', icon: Sun },
  ];

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        <p>Manage your account settings and preferences</p>
      </div>

      <div className="settings-layout">
        {/* Navigation */}
        <nav className="settings-nav">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`settings-nav-item ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="settings-content">
          {/* Account Settings */}
          <div className={`settings-section ${activeTab === 'account' ? 'active' : ''}`}>
            <h2>Account Settings</h2>
            <p>Update your personal information and profile details</p>

            {/* Avatar Upload */}
            <div className="avatar-upload">
              <img
                src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0a6b2b&color=fff&size=100`}
                alt="Profile"
                className="avatar-preview"
              />
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <div className="avatar-upload-actions">
                <button 
                  className="btn-upload" 
                  onClick={handleAvatarClick}
                  disabled={isUploading}
                >
                  {isUploading ? <Upload size={16} className="spinning" /> : <Camera size={16} />}
                  {isUploading ? 'Uploading...' : 'Change Photo'}
                </button>
                <button 
                  className="btn-remove"
                  onClick={() => {
                    updateAvatar('');
                    showToast('info', 'Profile picture removed');
                  }}
                >
                  <Trash2 size={16} />
                  Remove
                </button>
              </div>
            </div>

            <div className="form-row">
              <div className="settings-form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="settings-form-group">
                <label htmlFor="phone">Phone Number</label>
                <div style={{ position: 'relative' }}>
                  <Smartphone size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#94a3b8' }} />
                  <input
                    type="tel"
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ paddingLeft: 40 }}
                  />
                </div>
              </div>
            </div>

            <div className="settings-form-group">
              <label htmlFor="email">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#94a3b8' }} />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div className="settings-form-group">
              <label htmlFor="location">Location</label>
              <div style={{ position: 'relative' }}>
                <MapPin size={18} style={{ position: 'absolute', left: 12, top: 14, color: '#94a3b8' }} />
                <input
                  type="text"
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  style={{ paddingLeft: 40 }}
                />
              </div>
            </div>

            <div className="settings-form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                id="bio"
                rows={3}
                placeholder="Tell buyers about yourself and your farm..."
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
              <span className="input-hint">Maximum 200 characters</span>
            </div>

            <div className="settings-actions">
              <button type="button" className="btn-cancel" onClick={handleCancelAccount}>Cancel</button>
              <button className="btn-save" onClick={handleSaveAccount}>
                Save Changes
              </button>
            </div>
          </div>

          {/* Notification Settings */}
          <div className={`settings-section ${activeTab === 'notifications' ? 'active' : ''}`}>
            <h2>Notification Preferences</h2>
            <p>Choose how and when you want to be notified</p>

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '1.5rem 0 1rem' }}>
              Activity Notifications
            </h3>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Order Updates</h4>
                <p>Get notified about order status changes</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.orderUpdates}
                  onChange={(e) => setNotifications({ ...notifications, orderUpdates: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Messages</h4>
                <p>Receive notifications for new messages</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.messages}
                  onChange={(e) => setNotifications({ ...notifications, messages: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Price Alerts</h4>
                <p>Get alerts when prices change for saved items</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.priceAlerts}
                  onChange={(e) => setNotifications({ ...notifications, priceAlerts: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>New Listings</h4>
                <p>Be notified when new products match your interests</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.newListings}
                  onChange={(e) => setNotifications({ ...notifications, newListings: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-divider" />

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '0 0 1rem' }}>
              Delivery Channels
            </h3>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Email Notifications</h4>
                <p>Receive notifications via email</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.emailNotifications}
                  onChange={(e) => setNotifications({ ...notifications, emailNotifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>SMS Notifications</h4>
                <p>Receive important updates via SMS</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.smsNotifications}
                  onChange={(e) => setNotifications({ ...notifications, smsNotifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Push Notifications</h4>
                <p>Receive push notifications on your device</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.pushNotifications}
                  onChange={(e) => setNotifications({ ...notifications, pushNotifications: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-divider" />

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '0 0 1rem' }}>
              Marketing
            </h3>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Promotions & Offers</h4>
                <p>Receive special offers and promotions</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.promotions}
                  onChange={(e) => setNotifications({ ...notifications, promotions: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Newsletter</h4>
                <p>Weekly updates about the agricultural market</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={notifications.newsletter}
                  onChange={(e) => setNotifications({ ...notifications, newsletter: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  if (user?.id) {
                    try {
                      const n = localStorage.getItem(`makefarmhub_notifications_${user.id}`);
                      if (n) setNotifications((prev) => ({ ...prev, ...JSON.parse(n) }));
                    } catch { /* ignore */ }
                  }
                  showToast('info', 'Changes discarded');
                }}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSaveNotifications}>
                Save Preferences
              </button>
            </div>
          </div>

          {/* Privacy Settings */}
          <div className={`settings-section ${activeTab === 'privacy' ? 'active' : ''}`}>
            <h2>Privacy Settings</h2>
            <p>Control what information is visible to others</p>

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '1.5rem 0 1rem' }}>
              Profile Visibility
            </h3>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Public Profile</h4>
                <p>Allow others to view your profile</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.publicProfile}
                  onChange={(e) => setPrivacy({ ...privacy, publicProfile: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Show Phone Number</h4>
                <p>Display your phone number on your profile</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.showPhone}
                  onChange={(e) => setPrivacy({ ...privacy, showPhone: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Show Email Address</h4>
                <p>Display your email on your profile</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.showEmail}
                  onChange={(e) => setPrivacy({ ...privacy, showEmail: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Show Location</h4>
                <p>Display your location on listings and profile</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.showLocation}
                  onChange={(e) => setPrivacy({ ...privacy, showLocation: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-divider" />

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '0 0 1rem' }}>
              Communication
            </h3>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Allow Messaging</h4>
                <p>Allow other users to send you messages</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.allowMessaging}
                  onChange={(e) => setPrivacy({ ...privacy, allowMessaging: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="toggle-group">
              <div className="toggle-info">
                <h4>Show Online Status</h4>
                <p>Let others see when you're online</p>
              </div>
              <label className="toggle-switch">
                <input
                  type="checkbox"
                  checked={privacy.showOnlineStatus}
                  onChange={(e) => setPrivacy({ ...privacy, showOnlineStatus: e.target.checked })}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>

            <div className="settings-divider" />

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '0 0 1rem' }}>
              Legal Documents
            </h3>

            <div className="legal-links">
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="legal-link-item">
                <Shield size={20} />
                <div>
                  <h4>Privacy Policy</h4>
                  <p>How we collect and use your data</p>
                </div>
              </a>
              <a href="/terms" target="_blank" rel="noopener noreferrer" className="legal-link-item">
                <Eye size={20} />
                <div>
                  <h4>Terms & Conditions</h4>
                  <p>Rules and guidelines for using MakeFarmHub</p>
                </div>
              </a>
            </div>

            <div className="settings-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  if (user?.id) {
                    try {
                      const p = localStorage.getItem(`makefarmhub_privacy_${user.id}`);
                      if (p) setPrivacy((prev) => ({ ...prev, ...JSON.parse(p) }));
                    } catch { /* ignore */ }
                  }
                  showToast('info', 'Changes discarded');
                }}
              >
                Cancel
              </button>
              <button className="btn-save" onClick={handleSavePrivacy}>
                Save Settings
              </button>
            </div>
          </div>

          {/* Security Settings */}
          <div className={`settings-section ${activeTab === 'security' ? 'active' : ''}`}>
            <h2>Security Settings</h2>
            <p>Manage your account security and authentication</p>

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '1.5rem 0 1rem' }}>
              Authentication
            </h3>

            <div className="security-item">
              <div className="security-item-info">
                <h4>Change Password</h4>
                <p>Update the password you use to sign in</p>
              </div>
              <button className="btn-action" type="button" onClick={() => setShowPasswordModal(true)}>
                <Key size={16} style={{ marginRight: 6 }} />
                Update
              </button>
            </div>

            {showPasswordModal && (
              <div className="modal-overlay" onClick={() => !passwordSaving && setShowPasswordModal(false)}>
                <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420, padding: 24 }}>
                  <h3 style={{ marginTop: 0 }}>Change password</h3>
                  <p style={{ color: '#64748b', fontSize: '0.9rem' }}>Enter a new password (min 6 characters).</p>
                  <div className="form-group">
                    <label htmlFor="new-password">New password</label>
                    <input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="confirm-password">Confirm password</label>
                    <input
                      id="confirm-password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      autoComplete="new-password"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                    <button
                      type="button"
                      className="btn-action"
                      disabled={passwordSaving}
                      onClick={() => setShowPasswordModal(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      className="btn-primary"
                      disabled={passwordSaving}
                      onClick={async () => {
                        if (newPassword.length < 6) {
                          showToast('error', 'Password must be at least 6 characters');
                          return;
                        }
                        if (newPassword !== confirmPassword) {
                          showToast('error', 'Passwords do not match');
                          return;
                        }
                        setPasswordSaving(true);
                        const result = await updatePassword(newPassword);
                        setPasswordSaving(false);
                        if (result.success) {
                          showToast('success', 'Password updated');
                          setShowPasswordModal(false);
                          setNewPassword('');
                          setConfirmPassword('');
                        } else {
                          showToast('error', result.error || 'Failed to update password');
                        }
                      }}
                    >
                      {passwordSaving ? 'Saving...' : 'Save password'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="security-item">
              <div className="security-item-info">
                <h4>Two-Factor Authentication</h4>
                <p>Coming soon — not available yet</p>
              </div>
              <button
                type="button"
                className="btn-action"
                disabled
                title="Not available yet"
                onClick={() => showToast('info', 'Two-factor authentication is not available yet')}
              >
                <Lock size={16} style={{ marginRight: 6 }} />
                Coming soon
              </button>
            </div>

            <div className="security-item">
              <div className="security-item-info">
                <h4>Phone</h4>
                <p>{user?.phone || 'No phone on file'}</p>
              </div>
              <span className="btn-action" style={{ pointerEvents: 'none', opacity: 0.8 }}>
                {user?.phone ? 'On file' : 'Add in Account'}
              </span>
            </div>

            <div className="settings-divider" />

            <h3 style={{ fontSize: '1rem', color: '#475569', margin: '0 0 1rem' }}>
              Sessions
            </h3>

            <div className="security-item">
              <div className="security-item-info">
                <h4>Active Sessions</h4>
                <p>Session management coming soon. Use Log out from the menu to end this session.</p>
              </div>
              <button
                type="button"
                className="btn-action"
                disabled
                onClick={() => showToast('info', 'Session management is not available yet')}
              >
                Coming soon
              </button>
            </div>

            <div className="settings-divider" />

            <h3 style={{ fontSize: '1rem', color: '#dc2626', margin: '0 0 1rem' }}>
              Danger Zone
            </h3>

            <div className="danger-zone">
              <h4>Delete Account</h4>
              <p>
                To permanently delete your account and data, email support@makefarmhub.com from your registered address.
                Self-serve delete is not available yet.
              </p>
              <button
                type="button"
                className="btn-danger"
                onClick={() =>
                  showToast('info', 'Email support@makefarmhub.com to request account deletion')
                }
              >
                <Trash2 size={16} style={{ marginRight: 6 }} />
                Request deletion
              </button>
            </div>
          </div>

          {/* Payment Methods Settings */}
          <div className={`settings-section ${activeTab === 'payment' ? 'active' : ''}`}>
            <h2>Payment Methods</h2>
            <p>Add your own EcoCash, OneMoney, InnBucks, or bank details for receiving payments</p>

            {paymentMethods.length === 0 && (
              <p style={{ color: '#64748b', marginBottom: '1rem' }}>
                No payment methods yet. Add one so buyers know where to pay you.
              </p>
            )}

            <div className="payment-methods-list">
              {paymentMethods.map((method) => (
                <div key={method.id} className={`payment-method-card ${method.isDefault ? 'default' : ''}`}>
                  <div className="payment-method-icon">
                    {getPaymentIcon(method.type, method.name)}
                  </div>
                  <div className="payment-method-details">
                    <div className="payment-method-header">
                      <h4>{method.name}</h4>
                      {method.isDefault && (
                        <span className="default-badge">Default</span>
                      )}
                    </div>
                    <p className="payment-account-name">{method.accountName}</p>
                    <div className="payment-account-number">
                      <span>{method.accountNumber}</span>
                      <button
                        className="copy-btn"
                        onClick={() => handleCopyNumber(method.accountNumber, method.id)}
                        title="Copy number"
                      >
                        {copiedId === method.id ? <Check size={14} /> : <Copy size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="payment-method-actions">
                    {!method.isDefault && (
                      <button
                        className="btn-set-default"
                        onClick={() => handleSetDefault(method.id)}
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      className="btn-delete-payment"
                      onClick={() => handleDeletePayment(method.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Add Payment Method */}
            {!showAddPayment ? (
              <button
                className="btn-add-payment"
                onClick={() => setShowAddPayment(true)}
              >
                <Plus size={20} />
                Add Payment Method
              </button>
            ) : (
              <div className="add-payment-form">
                <h3>Add New Payment Method</h3>
                
                <div className="form-group">
                  <label>Payment Type</label>
                  <select
                    value={newPayment.type}
                    onChange={(e) => setNewPayment({ ...newPayment, type: e.target.value as PaymentMethod['type'] })}
                  >
                    <option value="ecocash">EcoCash</option>
                    <option value="onemoney">OneMoney</option>
                    <option value="innbucks">InnBucks</option>
                    <option value="bank">Bank Transfer</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>{newPayment.type === 'bank' ? 'Account Number' : 'Phone Number'}</label>
                  <input
                    type="text"
                    placeholder={newPayment.type === 'bank' ? 'Enter account number' : 'e.g., 0782919633'}
                    value={newPayment.accountNumber}
                    onChange={(e) => setNewPayment({ ...newPayment, accountNumber: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label>Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Enter account holder name"
                    value={newPayment.accountName}
                    onChange={(e) => setNewPayment({ ...newPayment, accountName: e.target.value })}
                  />
                </div>

                <div className="add-payment-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => {
                      setShowAddPayment(false);
                      setNewPayment({ type: 'ecocash', accountNumber: '', accountName: '' });
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn-primary"
                    onClick={handleAddPayment}
                    disabled={!newPayment.accountNumber || !newPayment.accountName}
                  >
                    <Plus size={18} />
                    Add Method
                  </button>
                </div>
              </div>
            )}

            <div className="settings-divider" />

            <div className="payment-info-box">
              <CreditCard size={20} />
              <div>
                <h4>Secure Payments</h4>
                <p>Your payment details are securely stored and only shared with buyers when you accept an order.</p>
              </div>
            </div>
          </div>

          {/* Appearance Settings */}
          <div className={`settings-section ${activeTab === 'appearance' ? 'active' : ''}`}>
            <h2>Appearance</h2>
            <p>Customize how MAKEFARMHUB looks on your device</p>

            <div className="theme-selector">
              <h3 style={{ fontSize: '1rem', color: 'var(--text-secondary)', margin: '1.5rem 0 1rem' }}>
                Theme
              </h3>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1rem' }}>
                Choose your preferred theme or match your system settings
              </p>

              <div className="theme-options">
                <button
                  className={`theme-option ${theme === 'light' ? 'active' : ''}`}
                  onClick={() => setTheme('light')}
                >
                  <div className="theme-preview light">
                    <Sun size={32} />
                  </div>
                  <span>Light</span>
                </button>

                <button
                  className={`theme-option ${theme === 'dark' ? 'active' : ''}`}
                  onClick={() => setTheme('dark')}
                >
                  <div className="theme-preview dark">
                    <Moon size={32} />
                  </div>
                  <span>Dark</span>
                </button>
              </div>
            </div>

            <div className="settings-divider" />

            <div className="appearance-info">
              <Monitor size={20} />
              <div>
                <h4>System Theme Detection</h4>
                <p>The theme will be saved to your browser and remembered on your next visit.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
