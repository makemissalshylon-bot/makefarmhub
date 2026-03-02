import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../components/UI/Toast';
import '../../styles/notifications.css';
import {
  Bell,
  ShoppingBag,
  DollarSign,
  MessageSquare,
  Info,
  Clock,
  Truck,
  Settings,
  Trash2,
  AlertCircle,
  CheckCircle,
  X,
  BellRing,
  BellOff,
  Volume2,
  Mail,
  Smartphone,
  Filter,
  Calendar,
  Star,
  Zap,
} from 'lucide-react';

type FilterType = 'all' | 'order' | 'payment' | 'message' | 'transport' | 'system';

export default function Notifications() {
  const { 
    notifications, 
    markNotificationRead, 
    markAllNotificationsRead, 
    deleteNotification,
    clearAllNotifications 
  } = useAppData();
  const { showToast } = useToast();
  const [filter, setFilter] = useState<FilterType>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showPreferences, setShowPreferences] = useState(false);
  const [groupByDate, setGroupByDate] = useState(true);
  
  // Notification preferences state
  const [preferences, setPreferences] = useState({
    pushEnabled: true,
    emailEnabled: true,
    smsEnabled: false,
    soundEnabled: true,
    orderUpdates: true,
    paymentAlerts: true,
    messageNotifs: true,
    transportUpdates: true,
    systemAlerts: true,
    marketingEmails: false,
  });

  const unreadCount = notifications.filter(n => !n.read).length;
  const totalCount = notifications.length;

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    showToast('success', 'All notifications marked as read');
  };

  const handleMarkRead = (id: string) => {
    markNotificationRead(id);
  };

  const handleDelete = (id: string) => {
    deleteNotification(id);
    setShowDeleteConfirm(null);
    showToast('info', 'Notification deleted');
  };

  const handleClearAll = () => {
    clearAllNotifications();
    showToast('info', 'All notifications cleared');
  };

  const filteredNotifications = notifications.filter(n => 
    filter === 'all' ? true : n.type === filter
  );

  // Group notifications by date
  const groupedNotifications = useMemo(() => {
    if (!groupByDate) return { 'All': filteredNotifications };
    
    const groups: Record<string, typeof filteredNotifications> = {};
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    filteredNotifications.forEach(notif => {
      const notifDate = new Date(notif.createdAt || notif.timestamp || Date.now());
      let groupKey: string;
      
      if (notifDate.toDateString() === today.toDateString()) {
        groupKey = 'Today';
      } else if (notifDate.toDateString() === yesterday.toDateString()) {
        groupKey = 'Yesterday';
      } else if (notifDate > new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)) {
        groupKey = 'This Week';
      } else {
        groupKey = 'Earlier';
      }
      
      if (!groups[groupKey]) groups[groupKey] = [];
      groups[groupKey].push(notif);
    });
    
    return groups;
  }, [filteredNotifications, groupByDate]);

  const togglePreference = (key: keyof typeof preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const savePreferences = () => {
    showToast('success', 'Notification preferences saved');
    setShowPreferences(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'order': return <ShoppingBag size={24} />;
      case 'payment': return <DollarSign size={24} />;
      case 'message': return <MessageSquare size={24} />;
      case 'transport': return <Truck size={24} />;
      case 'system': return <AlertCircle size={24} />;
      default: return <Info size={24} />;
    }
  };

  const getFilterCount = (type: FilterType) => {
    if (type === 'all') return notifications.length;
    return notifications.filter(n => n.type === type).length;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 60) return `${minutes} mins ago`;
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-left">
          <h1>
            <Bell size={28} />
            Notifications
            {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
          </h1>
          <p className="header-subtitle">{totalCount} total notifications</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn-settings"
            onClick={() => setShowPreferences(true)}
          >
            <Settings size={18} />
            Preferences
          </button>
          <button 
            className={`btn-group-toggle ${groupByDate ? 'active' : ''}`}
            onClick={() => setGroupByDate(!groupByDate)}
            title="Group by date"
          >
            <Calendar size={18} />
          </button>
          {unreadCount > 0 && (
            <button className="btn-mark-read" onClick={handleMarkAllRead}>
              <CheckCircle size={18} />
              Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button className="btn-clear" onClick={handleClearAll}>
              <Trash2 size={18} />
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="notification-stats">
        <div className="stat-card">
          <Zap size={20} />
          <div>
            <span className="stat-value">{unreadCount}</span>
            <span className="stat-label">Unread</span>
          </div>
        </div>
        <div className="stat-card">
          <ShoppingBag size={20} />
          <div>
            <span className="stat-value">{getFilterCount('order')}</span>
            <span className="stat-label">Orders</span>
          </div>
        </div>
        <div className="stat-card">
          <DollarSign size={20} />
          <div>
            <span className="stat-value">{getFilterCount('payment')}</span>
            <span className="stat-label">Payments</span>
          </div>
        </div>
        <div className="stat-card">
          <MessageSquare size={20} />
          <div>
            <span className="stat-value">{getFilterCount('message')}</span>
            <span className="stat-label">Messages</span>
          </div>
        </div>
      </div>

      <div className="notifications-filters">
        <button 
          className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All
          <span className="filter-count">{getFilterCount('all')}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'order' ? 'active' : ''}`}
          onClick={() => setFilter('order')}
        >
          <ShoppingBag size={16} />
          Orders
          <span className="filter-count">{getFilterCount('order')}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'payment' ? 'active' : ''}`}
          onClick={() => setFilter('payment')}
        >
          <DollarSign size={16} />
          Payments
          <span className="filter-count">{getFilterCount('payment')}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'transport' ? 'active' : ''}`}
          onClick={() => setFilter('transport')}
        >
          <Truck size={16} />
          Transport
          <span className="filter-count">{getFilterCount('transport')}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'message' ? 'active' : ''}`}
          onClick={() => setFilter('message')}
        >
          <MessageSquare size={16} />
          Messages
          <span className="filter-count">{getFilterCount('message')}</span>
        </button>
        <button 
          className={`filter-btn ${filter === 'system' ? 'active' : ''}`}
          onClick={() => setFilter('system')}
        >
          <AlertCircle size={16} />
          System
          <span className="filter-count">{getFilterCount('system')}</span>
        </button>
      </div>

      <div className="notifications-list">
        {Object.keys(groupedNotifications).length > 0 ? (
          Object.entries(groupedNotifications).map(([dateGroup, notifs]) => (
            <div key={dateGroup} className="notification-group">
              {groupByDate && dateGroup !== 'All' && (
                <div className="group-header">
                  <Calendar size={16} />
                  <span>{dateGroup}</span>
                  <span className="group-count">{notifs.length}</span>
                </div>
              )}
              {notifs.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`notification-card ${!notification.read ? 'unread' : ''}`}
                >
                  <div className={`notification-icon ${notification.type}`}>
                    {getIcon(notification.type)}
                  </div>
                  <div className="notification-content" onClick={() => handleMarkRead(notification.id)}>
                    <div className="notification-top">
                      <h3>{notification.title}</h3>
                      <span className="notification-time">
                        <Clock size={14} />
                        {formatTime(notification.createdAt || notification.timestamp || '')}
                      </span>
                    </div>
                    <p>{notification.message}</p>
                  </div>
                  <div className="notification-actions">
                    {!notification.read && <div className="unread-dot" />}
                    {showDeleteConfirm === notification.id ? (
                      <div className="delete-confirm">
                        <button 
                          className="btn-confirm-delete"
                          onClick={() => handleDelete(notification.id)}
                        >
                          Delete
                        </button>
                        <button 
                          className="btn-cancel-delete"
                          onClick={() => setShowDeleteConfirm(null)}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <button 
                        className="btn-delete"
                        onClick={() => setShowDeleteConfirm(notification.id)}
                        title="Delete notification"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))
        ) : (
          <div className="empty-state">
            <div className="empty-state-icon">
              <Bell size={48} />
            </div>
            <h3>No notifications</h3>
            <p>
              {filter === 'all' 
                ? "You're all caught up! Check back later for updates."
                : `No ${filter} notifications at the moment.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Notification Preferences Modal */}
      {showPreferences && (
        <div className="modal-overlay" onClick={() => setShowPreferences(false)}>
          <div className="modal-content preferences-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>
                <Settings size={24} />
                Notification Preferences
              </h2>
              <button className="modal-close" onClick={() => setShowPreferences(false)}>
                <X size={24} />
              </button>
            </div>
            <div className="modal-body">
              {/* Delivery Methods */}
              <div className="pref-section">
                <h3>Delivery Methods</h3>
                <div className="pref-options">
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <BellRing size={20} />
                      <div>
                        <span>Push Notifications</span>
                        <small>Receive alerts on your device</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.pushEnabled}
                      onChange={() => togglePreference('pushEnabled')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <Mail size={20} />
                      <div>
                        <span>Email Notifications</span>
                        <small>Get updates in your inbox</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.emailEnabled}
                      onChange={() => togglePreference('emailEnabled')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <Smartphone size={20} />
                      <div>
                        <span>SMS Notifications</span>
                        <small>Receive text messages</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.smsEnabled}
                      onChange={() => togglePreference('smsEnabled')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <Volume2 size={20} />
                      <div>
                        <span>Sound Effects</span>
                        <small>Play sounds for notifications</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.soundEnabled}
                      onChange={() => togglePreference('soundEnabled')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Notification Types */}
              <div className="pref-section">
                <h3>Notification Types</h3>
                <div className="pref-options">
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <ShoppingBag size={20} />
                      <div>
                        <span>Order Updates</span>
                        <small>New orders, status changes</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.orderUpdates}
                      onChange={() => togglePreference('orderUpdates')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <DollarSign size={20} />
                      <div>
                        <span>Payment Alerts</span>
                        <small>Payments, escrow, withdrawals</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.paymentAlerts}
                      onChange={() => togglePreference('paymentAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <MessageSquare size={20} />
                      <div>
                        <span>Messages</span>
                        <small>New messages from users</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.messageNotifs}
                      onChange={() => togglePreference('messageNotifs')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <Truck size={20} />
                      <div>
                        <span>Transport Updates</span>
                        <small>Delivery status, tracking</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.transportUpdates}
                      onChange={() => togglePreference('transportUpdates')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <AlertCircle size={20} />
                      <div>
                        <span>System Alerts</span>
                        <small>Important platform updates</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.systemAlerts}
                      onChange={() => togglePreference('systemAlerts')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              {/* Marketing */}
              <div className="pref-section">
                <h3>Marketing & Promotions</h3>
                <div className="pref-options">
                  <label className="pref-toggle">
                    <div className="pref-info">
                      <Star size={20} />
                      <div>
                        <span>Marketing Emails</span>
                        <small>Tips, promotions, and news</small>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={preferences.marketingEmails}
                      onChange={() => togglePreference('marketingEmails')}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPreferences(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={savePreferences}>
                <CheckCircle size={18} />
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
