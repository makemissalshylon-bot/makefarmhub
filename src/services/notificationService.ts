/**
 * Notification Service
 * Handles push notifications, email, and SMS notifications
 */

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: any;
  actions?: NotificationAction[];
  tag?: string;
  requireInteraction?: boolean;
}

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface EmailNotification {
  to: string;
  subject: string;
  body: string;
  template?: string;
  data?: any;
}

export interface SMSNotification {
  to: string;
  message: string;
}

class NotificationService {
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize notification service
   */
  async init(): Promise<void> {
    if ('serviceWorker' in navigator) {
      try {
        this.registration = await navigator.serviceWorker.ready;
      } catch (error) {
        console.error('Service worker not ready:', error);
      }
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return 'denied';
    }

    if (Notification.permission === 'granted') {
      return 'granted';
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  /**
   * Show push notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    const permission = await this.requestPermission();

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    if (this.registration) {
      // Use service worker notification
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        badge: payload.badge || '/badge-72x72.png',
        data: payload.data,
        tag: payload.tag,
        requireInteraction: payload.requireInteraction,
      });
    } else {
      // Fallback to regular notification
      new Notification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icon-192x192.png',
        data: payload.data,
      });
    }
  }

  /**
   * Send notification based on user preferences
   */
  async sendNotification(
    type: 'order' | 'message' | 'payment' | 'listing' | 'system',
    payload: NotificationPayload
  ): Promise<void> {
    // Check user preferences
    const preferences = this.getNotificationPreferences();

    if (!preferences[type]?.enabled) {
      return;
    }

    // Send push notification if enabled
    if (preferences[type]?.push) {
      await this.showNotification(payload);
    }

    // Send email if enabled (would call backend API)
    if (preferences[type]?.email) {
      await this.sendEmail({
        to: preferences.email || '',
        subject: payload.title,
        body: payload.body,
      });
    }

    // Send SMS if enabled (would call backend API)
    if (preferences[type]?.sms) {
      await this.sendSMS({
        to: preferences.phone || '',
        message: `${payload.title}: ${payload.body}`,
      });
    }
  }

  /**
   * Send email notification via consolidated notifications API
   */
  async sendEmail(notification: EmailNotification): Promise<void> {
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const html =
      notification.body ||
      `<p>${notification.subject}</p><pre>${JSON.stringify(notification.data || {}, null, 2)}</pre>`;

    const response = await fetch(`${API_URL}/notifications?action=email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: notification.to,
        subject: notification.subject,
        html,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send email notification');
    }
  }

  /**
   * Send SMS notification via consolidated notifications API
   */
  async sendSMS(notification: SMSNotification): Promise<void> {
    const API_URL = import.meta.env.VITE_API_URL || '/api';
    const response = await fetch(`${API_URL}/notifications?action=sms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: notification.to,
        message: notification.message,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to send SMS notification');
    }
  }

  /**
   * Get notification preferences from storage
   */
  getNotificationPreferences(): any {
    const stored = localStorage.getItem('notification_preferences');
    return stored ? JSON.parse(stored) : this.getDefaultPreferences();
  }

  /**
   * Save notification preferences
   */
  saveNotificationPreferences(preferences: any): void {
    localStorage.setItem('notification_preferences', JSON.stringify(preferences));
  }

  /**
   * Get default notification preferences
   */
  private getDefaultPreferences(): any {
    return {
      email: '',
      phone: '',
      order: { enabled: true, push: true, email: true, sms: false },
      message: { enabled: true, push: true, email: false, sms: false },
      payment: { enabled: true, push: true, email: true, sms: true },
      listing: { enabled: true, push: true, email: false, sms: false },
      system: { enabled: true, push: true, email: true, sms: false },
    };
  }

  /**
   * Subscribe to push notifications
   */
  async subscribeToPush(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.warn('Service worker not registered');
      return null;
    }

    try {
      const subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // In production, use your VAPID public key
          'YOUR_VAPID_PUBLIC_KEY'
        ) as BufferSource,
      });

      // Send subscription to backend
      await this.sendSubscriptionToBackend(subscription);

      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribeFromPush(): Promise<void> {
    if (!this.registration) return;

    try {
      const subscription = await this.registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        // Notify backend
        await this.removeSubscriptionFromBackend(subscription);
      }
    } catch (error) {
      console.error('Failed to unsubscribe from push:', error);
    }
  }

  /**
   * Send subscription to backend (placeholder)
   */
  private async sendSubscriptionToBackend(subscription: PushSubscription): Promise<void> {
    // In production, send to your backend
    
    // Example:
    // await fetch('/api/notifications/subscribe', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(subscription),
    // });
  }

  /**
   * Remove subscription from backend (placeholder)
   */
  private async removeSubscriptionFromBackend(subscription: PushSubscription): Promise<void> {
    // In production, notify your backend
  }

  /**
   * Convert VAPID key
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Schedule notification (for reminders, etc.)
   */
  scheduleNotification(payload: NotificationPayload, delay: number): void {
    setTimeout(() => {
      this.showNotification(payload);
    }, delay);
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications(): Promise<void> {
    if (!this.registration) return;

    try {
      const notifications = await this.registration.getNotifications();
      notifications.forEach(notification => notification.close());
    } catch (error) {
      console.error('Failed to clear notifications:', error);
    }
  }
}

export const notificationService = new NotificationService();

// Auto-initialize
if (typeof window !== 'undefined') {
  notificationService.init();
}

export default notificationService;
