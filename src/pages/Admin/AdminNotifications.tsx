import { useState } from 'react';
import {
  Bell,
  Send,
  Users,
  UserCheck,
  Filter,
  Plus,
  Calendar,
  Clock,
} from 'lucide-react';

interface NotificationHistory {
  id: string;
  title: string;
  message: string;
  targetAudience: string;
  sentTo: number;
  sentAt: string;
  status: 'sent' | 'scheduled' | 'draft';
}

export default function AdminNotifications() {
  const [showComposer, setShowComposer] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduleDate: '',
    scheduleTime: '',
  });

  const [notificationHistory] = useState<NotificationHistory[]>([
    {
      id: 'notif-1',
      title: 'New Feature: Reviews & Ratings',
      message: 'You can now rate sellers and leave reviews after completing orders!',
      targetAudience: 'All Users',
      sentTo: 1250,
      sentAt: '2024-11-28T10:00:00Z',
      status: 'sent',
    },
    {
      id: 'notif-2',
      title: 'Price Alert: Maize Prices Up 15%',
      message: 'Market alert: Maize prices have increased by 15% this week.',
      targetAudience: 'Buyers',
      sentTo: 450,
      sentAt: '2024-11-27T14:30:00Z',
      status: 'sent',
    },
    {
      id: 'notif-3',
      title: 'Verification Reminder',
      message: 'Complete your verification to unlock all features.',
      targetAudience: 'Unverified Users',
      sentTo: 85,
      sentAt: '2024-11-26T09:00:00Z',
      status: 'sent',
    },
  ]);

  const handleSendNotification = () => {
    // API call to send push notification
    setShowComposer(false);
    setNotificationData({
      title: '',
      message: '',
      targetAudience: 'all',
      scheduleDate: '',
      scheduleTime: '',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <div>
          <h1>Push Notifications</h1>
          <p>Send notifications to your users</p>
        </div>
        <button className="btn-primary" onClick={() => setShowComposer(true)}>
          <Plus size={18} /> Create Notification
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid">
        <div className="admin-stat-card primary">
          <Bell size={24} />
          <div>
            <span className="stat-value">1,250</span>
            <span className="stat-label">Total Users</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <Users size={24} />
          <div>
            <span className="stat-value">450</span>
            <span className="stat-label">Active Buyers</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <UserCheck size={24} />
          <div>
            <span className="stat-value">800</span>
            <span className="stat-label">Verified Farmers</span>
          </div>
        </div>
        <div className="admin-stat-card success">
          <Send size={24} />
          <div>
            <span className="stat-value">{notificationHistory.length}</span>
            <span className="stat-label">Sent This Month</span>
          </div>
        </div>
      </div>

      {/* Notification Composer Modal */}
      {showComposer && (
        <div className="modal-overlay" onClick={() => setShowComposer(false)}>
          <div className="modal-content notification-composer" onClick={(e) => e.stopPropagation()}>
            <h2>Create Push Notification</h2>

            <div className="form-group">
              <label>Notification Title *</label>
              <input
                type="text"
                placeholder="Enter notification title"
                value={notificationData.title}
                onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label>Message *</label>
              <textarea
                rows={4}
                placeholder="Enter notification message"
                value={notificationData.message}
                onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
              />
              <span className="char-count">{notificationData.message.length}/200</span>
            </div>

            <div className="form-group">
              <label>Target Audience *</label>
              <select
                value={notificationData.targetAudience}
                onChange={(e) => setNotificationData({ ...notificationData, targetAudience: e.target.value })}
              >
                <option value="all">All Users (1,250)</option>
                <option value="farmers">Farmers (800)</option>
                <option value="buyers">Buyers (450)</option>
                <option value="verified">Verified Users Only (1,165)</option>
                <option value="unverified">Unverified Users (85)</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Schedule Date (Optional)</label>
                <input
                  type="date"
                  value={notificationData.scheduleDate}
                  onChange={(e) => setNotificationData({ ...notificationData, scheduleDate: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Schedule Time (Optional)</label>
                <input
                  type="time"
                  value={notificationData.scheduleTime}
                  onChange={(e) => setNotificationData({ ...notificationData, scheduleTime: e.target.value })}
                />
              </div>
            </div>

            <div className="notification-preview">
              <h4>Preview</h4>
              <div className="preview-card">
                <div className="preview-icon">
                  <Bell size={20} />
                </div>
                <div className="preview-content">
                  <strong>{notificationData.title || 'Notification Title'}</strong>
                  <p>{notificationData.message || 'Notification message will appear here...'}</p>
                </div>
              </div>
            </div>

            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowComposer(false)}>
                Cancel
              </button>
              <button
                className="btn-send"
                onClick={handleSendNotification}
                disabled={!notificationData.title || !notificationData.message}
              >
                <Send size={18} />
                {notificationData.scheduleDate ? 'Schedule' : 'Send Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notification History */}
      <div className="admin-card">
        <div className="card-header">
          <h2>Notification History</h2>
        </div>

        <div className="notification-history-list">
          {notificationHistory.map((notif) => (
            <div key={notif.id} className="notification-history-item">
              <div className="notif-header">
                <div className="notif-icon">
                  <Bell size={20} />
                </div>
                <div className="notif-info">
                  <h4>{notif.title}</h4>
                  <p>{notif.message}</p>
                </div>
                <span className={`notif-status ${notif.status}`}>{notif.status}</span>
              </div>
              <div className="notif-meta">
                <span className="audience">
                  <Users size={14} /> {notif.targetAudience}
                </span>
                <span className="sent-count">
                  <Send size={14} /> Sent to {notif.sentTo} users
                </span>
                <span className="sent-time">
                  <Clock size={14} /> {formatDate(notif.sentAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
