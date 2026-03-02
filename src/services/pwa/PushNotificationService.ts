/**
 * Push Notification Service - Web Push API integration
 */

// VAPID keys (generate with web-push library)
// These are example keys - replace with your own in production
const VAPID_PUBLIC_KEY = 'BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSnfckjBJuBkr3qBr1vEkHUMPfFhBhVPLU';

interface PushSubscriptionOptions {
  userVisibleOnly: boolean;
  applicationServerKey: Uint8Array;
}

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  actions?: Array<{ action: string; title: string; icon?: string }>;
  url?: string;
}

class PushNotificationService {
  private subscription: PushSubscription | null = null;
  private registration: ServiceWorkerRegistration | null = null;

  /**
   * Initialize push notifications
   */
  async init(registration: ServiceWorkerRegistration): Promise<void> {
    this.registration = registration;
    
    // Check for existing subscription
    this.subscription = await registration.pushManager.getSubscription();
    
    if (this.subscription) {
      console.log('[Push] Existing subscription found');
    }
  }

  /**
   * Request notification permission
   */
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.log('[Push] Notifications not supported');
      return 'denied';
    }

    const permission = await Notification.requestPermission();
    console.log('[Push] Permission:', permission);
    return permission;
  }

  /**
   * Subscribe to push notifications
   */
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      console.error('[Push] Service worker not registered');
      return null;
    }

    try {
      // Request permission first
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        console.log('[Push] Permission denied');
        return null;
      }

      // Convert VAPID key
      const applicationServerKey = this.urlBase64ToUint8Array(VAPID_PUBLIC_KEY);

      // Subscribe
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as BufferSource,
      });

      console.log('[Push] Subscribed:', this.subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('[Push] Subscribe error:', error);
      return null;
    }
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      console.log('[Push] No active subscription');
      return false;
    }

    try {
      await this.subscription.unsubscribe();
      
      // Remove from server
      await this.removeSubscriptionFromServer(this.subscription);
      
      this.subscription = null;
      console.log('[Push] Unsubscribed');
      return true;
    } catch (error) {
      console.error('[Push] Unsubscribe error:', error);
      return false;
    }
  }

  /**
   * Check if subscribed
   */
  isSubscribed(): boolean {
    return this.subscription !== null;
  }

  /**
   * Get current subscription
   */
  getSubscription(): PushSubscription | null {
    return this.subscription;
  }

  /**
   * Send test notification
   */
  async sendTestNotification(): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.showNotification('Test Notification', {
        body: 'This is a test notification from MAKEFARMHUB',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        tag: 'test',
        data: { url: '/' },
      } as NotificationOptions);
    } catch (error) {
      console.error('[Push] Test notification error:', error);
    }
  }

  /**
   * Show local notification
   */
  async showNotification(payload: NotificationPayload): Promise<void> {
    if (!this.registration) return;

    try {
      await this.registration.showNotification(payload.title, {
        body: payload.body,
        icon: payload.icon || '/icons/icon-192x192.png',
        badge: payload.badge || '/icons/badge-72x72.png',
        tag: payload.tag || 'default',
        data: { ...payload.data, url: payload.url },
        requireInteraction: false,
      } as NotificationOptions);
    } catch (error) {
      console.error('[Push] Show notification error:', error);
    }
  }

  /**
   * Send subscription to server
   */
  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      // In production, send to your backend
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to send subscription to server');
      }

      console.log('[Push] Subscription sent to server');
    } catch (error) {
      console.error('[Push] Send subscription error:', error);
      // For demo, just log - in production, handle this properly
    }
  }

  /**
   * Remove subscription from server
   */
  private async removeSubscriptionFromServer(subscription: PushSubscription): Promise<void> {
    try {
      // In production, send to your backend
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
      });

      if (!response.ok) {
        throw new Error('Failed to remove subscription from server');
      }

      console.log('[Push] Subscription removed from server');
    } catch (error) {
      console.error('[Push] Remove subscription error:', error);
      // For demo, just log - in production, handle this properly
    }
  }

  /**
   * Convert VAPID key from base64 to Uint8Array
   */
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }

    return outputArray;
  }

  /**
   * Get notification permission status
   */
  getPermissionStatus(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  }

  /**
   * Check if push notifications are supported
   */
  isSupported(): boolean {
    return 'Notification' in window && 
           'serviceWorker' in navigator && 
           'PushManager' in window;
  }
}

// Singleton instance
export const pushNotificationService = new PushNotificationService();

export default pushNotificationService;
