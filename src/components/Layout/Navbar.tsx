import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import {
  Home,
  ShoppingBag,
  MessageSquare,
  User,
  Bell,
  LogOut,
  Menu,
  X,
  Plus,
  Search,
  Users,
  DollarSign,
  AlertTriangle,
  LayoutDashboard,
  Wallet,
  CreditCard,
  Send,
  Settings,
  FileText,
  Truck,
  Moon,
  Sun,
} from 'lucide-react';
import { useState } from 'react';
import LanguageSwitcher from '../Language/LanguageSwitcher';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  const navItems: Record<string, { path: string; icon: typeof Home; label: string }[]> = {
    farmer: [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/my-listings', icon: ShoppingBag, label: 'My Listings' },
      { path: '/orders', icon: ShoppingBag, label: 'Orders' },
      { path: '/transport/booking', icon: Truck, label: 'Transport' },
      { path: '/wallet', icon: Wallet, label: 'Wallet' },
      { path: '/messages', icon: MessageSquare, label: 'Messages' },
    ],
    buyer: [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/marketplace', icon: Search, label: 'Marketplace' },
      { path: '/orders', icon: ShoppingBag, label: 'My Orders' },
      { path: '/transport/booking', icon: Truck, label: 'Transport' },
      { path: '/wallet', icon: Wallet, label: 'Wallet' },
      { path: '/messages', icon: MessageSquare, label: 'Messages' },
    ],
    transporter: [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/transport/booking', icon: Truck, label: 'Requests' },
      { path: '/transport/tracking', icon: Truck, label: 'Tracking' },
      { path: '/wallet', icon: Wallet, label: 'Earnings' },
      { path: '/messages', icon: MessageSquare, label: 'Messages' },
    ],
    admin: [
      { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { path: '/admin/transactions', icon: DollarSign, label: 'Revenue' },
      { path: '/admin/users', icon: Users, label: 'Users' },
      { path: '/admin/listings', icon: ShoppingBag, label: 'Listings' },
      { path: '/admin/payments', icon: CreditCard, label: 'Payments' },
      { path: '/admin/disputes', icon: AlertTriangle, label: 'Disputes' },
      { path: '/admin/notifications', icon: Send, label: 'Notifications' },
      { path: '/admin/settings', icon: Settings, label: 'Categories' },
      { path: '/admin/reports', icon: FileText, label: 'Reports' },
    ],
  };

  const currentNavItems = user?.role ? navItems[user.role] || [] : [];

  return (
    <nav className="navbar">
      <div className="navbar__container">
        <Link to="/dashboard" className="navbar__logo">
          <span className="logo-icon">🌾</span>
          MAKEFARMHUB
        </Link>

        {/* Desktop Navigation */}
        <div className="navbar__links">
          {currentNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`navbar__link ${isActive(item.path) ? 'active' : ''}`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
        </div>

        <div className="navbar__actions">
          {user?.role === 'farmer' && (
            <Link to="/create-listing" className="btn-create">
              <Plus size={18} />
              <span>New Listing</span>
            </Link>
          )}

          {user?.role === 'buyer' && (
            <Link to="/marketplace" className="btn-search">
              <Search size={18} />
            </Link>
          )}

          <LanguageSwitcher />

          <button
            className="navbar__icon-btn theme-toggle"
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          <button
            className="navbar__icon-btn"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="notification-badge">3</span>
          </button>

          {showNotifications && (
            <div className="notifications-dropdown">
              <div className="notifications-header">
                <h4>Notifications</h4>
                <button>Mark all read</button>
              </div>
              <div className="notification-item unread">
                <div className="notification-icon order">📦</div>
                <div>
                  <p><strong>New Order Received</strong></p>
                  <p>Sarah Ndlovu placed an order for 50kg tomatoes</p>
                  <span>2 hours ago</span>
                </div>
              </div>
              <div className="notification-item">
                <div className="notification-icon payment">💰</div>
                <div>
                  <p><strong>Payment Released</strong></p>
                  <p>$400 has been released to your account</p>
                  <span>Yesterday</span>
                </div>
              </div>
              <Link to="/notifications" className="view-all">View all notifications</Link>
            </div>
          )}

          <div className="navbar__user">
            <Link to="/profile" className="user-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} />
              ) : (
                <User size={20} />
              )}
            </Link>
            <div className="user-dropdown">
              <div className="user-info">
                <strong>{user?.name}</strong>
                <span className="user-role">{user?.role}</span>
              </div>
              <Link to="/profile">
                <User size={16} /> Profile
              </Link>
              <Link to="/settings">
                <Settings size={16} /> Settings
              </Link>
              <button onClick={logout}>
                <LogOut size={16} /> Logout
              </button>
            </div>
          </div>

          <button
            className="navbar__mobile-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="navbar__mobile-menu">
          {currentNavItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`mobile-link ${isActive(item.path) ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </Link>
          ))}
          <hr />
          <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
            <User size={20} /> Profile
          </Link>
          <button onClick={() => { logout(); setMobileMenuOpen(false); }}>
            <LogOut size={20} /> Logout
          </button>
        </div>
      )}
    </nav>
  );
}
