import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  Home,
  ShoppingBag,
  Package,
  MessageSquare,
  Bell,
  Settings,
  Wallet,
  Truck,
  Plus,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Users,
  FileText,
  Star,
  HelpCircle,
  X,
  Heart,
} from 'lucide-react';

interface DashboardSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile: boolean;
}

export default function DashboardSidebar({ isOpen, onClose, isMobile }: DashboardSidebarProps) {
  const { user } = useAuth();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const isActive = (path: string) => 
    location.pathname === path || location.pathname.startsWith(path + '/');

  // Navigation items based on role
  const getNavItems = () => {
    const commonItems = [
      { path: '/dashboard', icon: Home, label: 'Dashboard' },
      { path: '/messages', icon: MessageSquare, label: 'Messages' },
      { path: '/notifications', icon: Bell, label: 'Notifications' },
      { path: '/wallet', icon: Wallet, label: 'Wallet' },
    ];

    switch (user?.role) {
      case 'farmer':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/my-listings', icon: Package, label: 'My Listings' },
          { path: '/orders', icon: ShoppingBag, label: 'Orders' },
          { path: '/messages', icon: MessageSquare, label: 'Messages' },
          { path: '/transport/tracking', icon: Truck, label: 'Transport' },
          { path: '/wallet', icon: Wallet, label: 'Wallet' },
          { path: '/notifications', icon: Bell, label: 'Notifications' },
        ];
      case 'buyer':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/marketplace', icon: ShoppingBag, label: 'Marketplace' },
          { path: '/favorites', icon: Heart, label: 'Favorites' },
          { path: '/orders', icon: Package, label: 'My Orders' },
          { path: '/messages', icon: MessageSquare, label: 'Messages' },
          { path: '/transport/tracking', icon: Truck, label: 'Deliveries' },
          { path: '/wallet', icon: Wallet, label: 'Wallet' },
          { path: '/notifications', icon: Bell, label: 'Notifications' },
        ];
      case 'transporter':
        return [
          { path: '/dashboard', icon: Home, label: 'Dashboard' },
          { path: '/transport/booking', icon: Package, label: 'Requests' },
          { path: '/transport/tracking', icon: Truck, label: 'Active Jobs' },
          { path: '/my-vehicles', icon: Truck, label: 'My Vehicles' },
          { path: '/messages', icon: MessageSquare, label: 'Messages' },
          { path: '/wallet', icon: Wallet, label: 'Earnings' },
          { path: '/notifications', icon: Bell, label: 'Notifications' },
        ];
      case 'admin':
        return [
          { path: '/admin', icon: Home, label: 'Overview' },
          { path: '/admin/users', icon: Users, label: 'Users' },
          { path: '/admin/listings', icon: Package, label: 'Listings' },
          { path: '/admin/transactions', icon: Wallet, label: 'Transactions' },
          { path: '/admin/disputes', icon: FileText, label: 'Disputes' },
          { path: '/admin/reports', icon: BarChart3, label: 'Reports' },
          { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
        ];
      default:
        return commonItems;
    }
  };

  const quickActions = () => {
    switch (user?.role) {
      case 'farmer':
        return [
          { path: '/create-listing', icon: Plus, label: 'New Listing', primary: true },
        ];
      case 'buyer':
        return [
          { path: '/marketplace', icon: ShoppingBag, label: 'Browse Products', primary: true },
        ];
      case 'transporter':
        return [
          { path: '/transport/booking', icon: Truck, label: 'View Requests', primary: true },
        ];
      default:
        return [];
    }
  };

  const navItems = getNavItems();
  const actions = quickActions();

  // For mobile: slide-in drawer
  if (isMobile) {
    return (
      <>
        {/* Overlay */}
        {isOpen && (
          <div className="sidebar-overlay" onClick={onClose} role="button" aria-label="Close sidebar" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClose(); }} />
        )}
        
        {/* Sidebar Drawer */}
        <aside className={`dashboard-sidebar mobile ${isOpen ? 'open' : ''}`}>
          <div className="sidebar-header">
            <Link to="/dashboard" className="sidebar-logo" onClick={onClose}>
              <span className="logo-icon">🌾</span>
              <span className="logo-text">MAKEFARMHUB</span>
            </Link>
            <button className="sidebar-close" onClick={onClose}>
              <X size={24} />
            </button>
          </div>

          {/* Quick Actions */}
          {actions.length > 0 && (
            <div className="sidebar-actions">
              {actions.map((action) => (
                <Link
                  key={action.path}
                  to={action.path}
                  className={`sidebar-action-btn ${action.primary ? 'primary' : ''}`}
                  onClick={onClose}
                >
                  <action.icon size={20} />
                  <span>{action.label}</span>
                </Link>
              ))}
            </div>
          )}

          {/* Navigation */}
          <nav className="sidebar-nav">
            <div className="nav-section">
              <span className="nav-section-title">Menu</span>
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
                  onClick={onClose}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              ))}
            </div>

            <div className="nav-section">
              <span className="nav-section-title">Account</span>
              <Link
                to="/profile"
                className={`sidebar-nav-item ${isActive('/profile') ? 'active' : ''}`}
                onClick={onClose}
              >
                <Star size={20} />
                <span>Profile</span>
              </Link>
              <Link
                to="/settings"
                className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
                onClick={onClose}
              >
                <Settings size={20} />
                <span>Settings</span>
              </Link>
              <Link
                to="/help"
                className={`sidebar-nav-item ${isActive('/help') ? 'active' : ''}`}
                onClick={onClose}
              >
                <HelpCircle size={20} />
                <span>Help & Support</span>
              </Link>
            </div>
          </nav>

          {/* User Info */}
          <div className="sidebar-user">
            <img
              src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0a6b2b&color=fff&size=40`}
              alt={user?.name}
              className="user-avatar"
            />
            <div className="user-details">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role}</span>
            </div>
          </div>
        </aside>
      </>
    );
  }

  // Desktop sidebar
  return (
    <aside className={`dashboard-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <Link to="/dashboard" className="sidebar-logo">
          <span className="logo-icon">🌾</span>
          {!isCollapsed && <span className="logo-text">MAKEFARMHUB</span>}
        </Link>
      </div>

      {/* Collapse Toggle */}
      <button
        className="sidebar-collapse-btn"
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
      </button>

      {/* Quick Actions */}
      {actions.length > 0 && (
        <div className="sidebar-actions">
          {actions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className={`sidebar-action-btn ${action.primary ? 'primary' : ''}`}
              title={isCollapsed ? action.label : undefined}
            >
              <action.icon size={20} />
              {!isCollapsed && <span>{action.label}</span>}
            </Link>
          ))}
        </div>
      )}

      {/* Navigation */}
      <nav className="sidebar-nav">
        <div className="nav-section">
          {!isCollapsed && <span className="nav-section-title">Menu</span>}
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`sidebar-nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={isCollapsed ? item.label : undefined}
            >
              <item.icon size={20} />
              {!isCollapsed && <span>{item.label}</span>}
            </Link>
          ))}
        </div>

        <div className="nav-section">
          {!isCollapsed && <span className="nav-section-title">Account</span>}
          <Link
            to="/profile"
            className={`sidebar-nav-item ${isActive('/profile') ? 'active' : ''}`}
            title={isCollapsed ? 'Profile' : undefined}
          >
            <Star size={20} />
            {!isCollapsed && <span>Profile</span>}
          </Link>
          <Link
            to="/settings"
            className={`sidebar-nav-item ${isActive('/settings') ? 'active' : ''}`}
            title={isCollapsed ? 'Settings' : undefined}
          >
            <Settings size={20} />
            {!isCollapsed && <span>Settings</span>}
          </Link>
        </div>
      </nav>

      {/* User Info */}
      <div className="sidebar-user">
        <img
          src={user?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'User')}&background=0a6b2b&color=fff&size=40`}
          alt={user?.name}
          className="user-avatar"
        />
        {!isCollapsed && (
          <div className="user-details">
            <span className="user-name">{user?.name}</span>
            <span className="user-role">{user?.role}</span>
          </div>
        )}
      </div>
    </aside>
  );
}
