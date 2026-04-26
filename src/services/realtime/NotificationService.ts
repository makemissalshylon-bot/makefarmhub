/**
 * NotificationService - Manages notifications with browser notifications support
 */

import { eventEmitter, EVENTS } from './EventEmitter';
import { storage, STORAGE_KEYS } from '../storage/LocalStorage';
import type { Notification } from '../../types';

class NotificationService {
  private notifications: Notification[] = [];
  private hasPermission: boolean = false;

  constructor() {
    this.checkPermission();
    this.setupEventListeners();
    this.loadFromStorage();
  }

  /**
   * Check and request notification permission
   */
  async checkPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true;
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.hasPermission = permission === 'granted';
      return this.hasPermission;
    }

    return false;
  }

  /**
   * Setup event listeners
   */
  private setupEventListeners(): void {
    eventEmitter.on<Notification>(EVENTS.NOTIFICATION_NEW, (notification) => {
      this.addNotification(notification);
    });

    eventEmitter.on<string>(EVENTS.NOTIFICATION_READ, (id) => {
      this.markAsRead(id);
    });

    eventEmitter.on(EVENTS.NOTIFICATION_CLEAR, () => {
      this.clearAll();
    });
  }

  /**
   * Load notifications from storage
   */
  private loadFromStorage(): void {
    const stored = storage.get<Notification[]>(STORAGE_KEYS.NOTIFICATIONS_READ);
    if (stored) {
      this.notifications = stored;
    }
  }

  /**
   * Save notifications to storage
   */
  private saveToStorage(): void {
    // Only save last 50 notifications
    const toSave = this.notifications.slice(0, 50);
    storage.set(STORAGE_KEYS.NOTIFICATIONS_READ, toSave);
  }

  /**
   * Add a new notification
   */
  addNotification(notification: Notification): void {
    this.notifications.unshift(notification);
    this.saveToStorage();

    // Show browser notification
    this.showBrowserNotification(notification);
  }

  /**
   * Show browser notification
   */
  private showBrowserNotification(notification: Notification): void {
    if (!this.hasPermission) return;

    const icon = this.getNotificationIcon(notification.type);
    
    try {
      const browserNotification = new Notification(notification.title, {
        body: notification.message,
        icon,
        tag: notification.id,
        requireInteraction: false,
      });

      browserNotification.onclick = () => {
        window.focus();
        this.markAsRead(notification.id);
        browserNotification.close();
      };

      // Auto close after 5 seconds
      setTimeout(() => browserNotification.close(), 5000);
    } catch (error) {
      console.error('[Notifications] Failed to show browser notification:', error);
    }
  }

  /**
   * Get icon based on notification type
   */
  private getNotificationIcon(type: Notification['type']): string {
    const icons: Record<string, string> = {
      order: '/icons/order.svg',
      message: '/icons/message.svg',
      payment: '/icons/payment.svg',
      system: '/icons/system.svg',
      success: '/icons/success.svg',
      warning: '/icons/warning.svg',
      info: '/icons/info.svg',
    };
    return icons[type] || '/icons/default.svg';
  }

  /**
   * Get all notifications
   */
  getAll(): Notification[] {
    return this.notifications;
  }

  /**
   * Get unread notifications
   */
  getUnread(): Notification[] {
    return this.notifications.filter(n => !n.read);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    this.notifications.forEach(n => n.read = true);
    this.saveToStorage();
  }

  /**
   * Delete a notification
   */
  delete(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.saveToStorage();
  }

  /**
   * Get notifications by type
   */
  getByType(type: Notification['type']): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }
}

// Singleton instance
export const notificationService = new NotificationService();

export default notificationService;
