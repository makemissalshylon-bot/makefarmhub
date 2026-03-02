import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/UI/Toast';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Edit,
  Camera,
  Shield,
  Star,
  Package,
  Truck,
  Settings,
  LogOut,
  Check,
  ChevronRight,
  Upload,
} from 'lucide-react';

export default function Profile() {
  const navigate = useNavigate();
  const { user, logout, switchRole, updateProfile, updateAvatar } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    location: user?.location || '',
  });

  const handleSave = () => {
    updateProfile(formData);
    showToast('success', 'Profile updated successfully!');
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      try {
        const { uploadAvatar } = await import('../../services/imageUploadService');
        const result = await uploadAvatar(file, user?.id || 'anonymous');
        if (result.success && result.url) {
          updateAvatar(result.url);
          showToast('success', 'Profile picture updated!');
        } else {
          showToast('error', result.error || 'Failed to upload image');
        }
      } catch {
        showToast('error', 'Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleLogout = () => {
    logout();
    showToast('info', 'You have been logged out');
    navigate('/');
  };

  const stats: Record<string, { label: string; value: string | number; icon: typeof Package }[]> = {
    farmer: [
      { label: 'Listings', value: 12, icon: Package },
      { label: 'Sales', value: 45, icon: Package },
      { label: 'Rating', value: '4.8', icon: Star },
    ],
    buyer: [
      { label: 'Orders', value: 23, icon: Package },
      { label: 'Spent', value: '$3.2k', icon: Package },
      { label: 'Rating', value: '4.9', icon: Star },
    ],
    transporter: [
      { label: 'Trips', value: 156, icon: Truck },
      { label: 'Earned', value: '$12.5k', icon: Package },
      { label: 'Rating', value: '4.8', icon: Star },
    ],
    admin: [
      { label: 'Users', value: '1.2k', icon: Package },
      { label: 'Revenue', value: '$485k', icon: Package },
      { label: 'Disputes', value: 8, icon: Package },
    ],
  };

  const currentStats = user?.role ? stats[user.role] || [] : [];

  return (
    <div className="profile-page">
      <div className="profile-header-card">
        <div className="profile-cover" />
        <div className="profile-main">
          <div className="profile-avatar">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} />
            ) : (
              <div className="avatar-placeholder">
                <User size={40} />
              </div>
            )}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              style={{ display: 'none' }}
            />
            <button 
              className="avatar-edit" 
              onClick={handleAvatarClick}
              disabled={isUploading}
              title="Change profile picture"
            >
              {isUploading ? <Upload size={16} className="spinning" /> : <Camera size={16} />}
            </button>
          </div>
          <div className="profile-info">
            <h1>{user?.name}</h1>
            <div className="profile-badges">
              <span className={`role-badge ${user?.role}`}>
                {user?.role === 'farmer' && '🌾'}
                {user?.role === 'buyer' && '🛒'}
                {user?.role === 'transporter' && '🚚'}
                {user?.role === 'admin' && '👑'}
                {user?.role}
              </span>
              {user?.verified && (
                <span className="verified-badge">
                  <Shield size={14} />
                  Verified
                </span>
              )}
            </div>
            <p className="profile-location">
              <MapPin size={16} />
              {user?.location}
            </p>
          </div>
          <button className="btn-edit" onClick={() => setIsEditing(!isEditing)}>
            <Edit size={18} />
            {isEditing ? 'Cancel' : 'Edit Profile'}
          </button>
        </div>

        <div className="profile-stats">
          {currentStats.map((stat) => (
            <div key={stat.label} className="stat-item">
              <stat.icon size={20} />
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="profile-content">
        {/* Profile Details */}
        <section className="profile-section">
          <h2>Profile Information</h2>
          {isEditing ? (
            <div className="profile-form">
              <div className="form-group">
                <label>
                  <User size={18} />
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <Mail size={18} />
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <Phone size={18} />
                  Phone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>
                  <MapPin size={18} />
                  Location
                </label>
                <input
                  type="text"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <button className="btn-primary" onClick={handleSave}>
                <Check size={18} />
                Save Changes
              </button>
            </div>
          ) : (
            <div className="profile-details">
              <div className="detail-item">
                <User size={18} />
                <div>
                  <span className="detail-label">Full Name</span>
                  <span className="detail-value">{user?.name}</span>
                </div>
              </div>
              <div className="detail-item">
                <Mail size={18} />
                <div>
                  <span className="detail-label">Email</span>
                  <span className="detail-value">{user?.email || 'Not set'}</span>
                </div>
              </div>
              <div className="detail-item">
                <Phone size={18} />
                <div>
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{user?.phone}</span>
                </div>
              </div>
              <div className="detail-item">
                <MapPin size={18} />
                <div>
                  <span className="detail-label">Location</span>
                  <span className="detail-value">{user?.location}</span>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Switch Role (Demo) */}
        <section className="profile-section">
          <h2>Switch Role (Demo)</h2>
          <p className="section-hint">For demo purposes, you can switch between different user roles</p>
          <div className="role-switcher">
            {(['farmer', 'buyer', 'transporter', 'admin'] as const).map((role) => (
              <button
                key={role}
                className={`role-option ${user?.role === role ? 'active' : ''}`}
                onClick={() => switchRole(role)}
              >
                {role === 'farmer' && '🌾'}
                {role === 'buyer' && '🛒'}
                {role === 'transporter' && '🚚'}
                {role === 'admin' && '👑'}
                <span>{role.charAt(0).toUpperCase() + role.slice(1)}</span>
                {user?.role === role && <Check size={16} />}
              </button>
            ))}
          </div>
        </section>

        {/* Quick Links */}
        <section className="profile-section">
          <h2>Settings</h2>
          <div className="settings-links">
            <button className="settings-link" onClick={() => navigate('/settings')}>
              <Settings size={20} />
              <span>Account Settings</span>
              <ChevronRight size={18} />
            </button>
            <button className="settings-link" onClick={() => navigate('/settings?tab=privacy')}>
              <Shield size={20} />
              <span>Privacy & Security</span>
              <ChevronRight size={18} />
            </button>
            <button className="settings-link" onClick={() => navigate('/settings?tab=payment')}>
              <Package size={20} />
              <span>Payment Methods</span>
              <ChevronRight size={18} />
            </button>
            <button className="settings-link logout" onClick={handleLogout}>
              <LogOut size={20} />
              <span>Logout</span>
              <ChevronRight size={18} />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
