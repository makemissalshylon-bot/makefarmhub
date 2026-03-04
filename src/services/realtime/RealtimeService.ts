/**
 * RealtimeService - Simulates WebSocket connections for real-time updates
 * Replace with actual WebSocket implementation when backend is ready
 */

import { eventEmitter, EVENTS } from './EventEmitter';
import type { Notification, Order, Message } from '../../types';

interface RealtimeConfig {
  reconnectInterval: number;
  maxReconnectAttempts: number;
  heartbeatInterval: number;
}

const defaultConfig: RealtimeConfig = {
  reconnectInterval: 5000,
  maxReconnectAttempts: 5,
  heartbeatInterval: 30000,
};

class RealtimeService {
  private config: RealtimeConfig;
  private isConnected: boolean = false;
  private reconnectAttempts: number = 0;
  private heartbeatTimer: number | null = null;
  private simulationTimers: number[] = [];
  private userId: string | null = null;

  constructor(config: Partial<RealtimeConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  /**
   * Connect to realtime service
   */
  connect(userId: string): void {
    this.userId = userId;
    this.isConnected = true;
    this.reconnectAttempts = 0;

    // Emit connection status
    eventEmitter.emit(EVENTS.CONNECTION_STATUS, { connected: true });

    // Start heartbeat
    this.startHeartbeat();

    // Start simulations for demo
    this.startSimulations();

  }

  /**
   * Disconnect from realtime service
   */
  disconnect(): void {
    this.isConnected = false;
    this.userId = null;

    // Stop heartbeat
    this.stopHeartbeat();

    // Stop simulations
    this.stopSimulations();

    // Emit connection status
    eventEmitter.emit(EVENTS.CONNECTION_STATUS, { connected: false });

  }

  /**
   * Check connection status
   */
  isOnline(): boolean {
    return this.isConnected;
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = window.setInterval(() => {
      if (this.isConnected) {
        // In real implementation, send ping to server
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Stop heartbeat
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Start demo simulations
   */
  private startSimulations(): void {
    // Simulate random notifications
    const notificationTimer = window.setInterval(() => {
      if (this.isConnected && Math.random() > 0.7) {
        this.simulateNotification();
      }
    }, 30000); // Every 30 seconds with 30% chance
    this.simulationTimers.push(notificationTimer);

    // Simulate order updates
    const orderTimer = window.setInterval(() => {
      if (this.isConnected && Math.random() > 0.8) {
        this.simulateOrderUpdate();
      }
    }, 45000); // Every 45 seconds with 20% chance
    this.simulationTimers.push(orderTimer);
  }

  /**
   * Stop all simulations
   */
  private stopSimulations(): void {
    this.simulationTimers.forEach(timer => clearInterval(timer));
    this.simulationTimers = [];
  }

  /**
   * Simulate a new notification
   */
  private simulateNotification(): void {
    const notifications: Partial<Notification>[] = [
      {
        title: 'New Order Received',
        message: 'You have a new order for Fresh Tomatoes',
        type: 'order',
      },
      {
        title: 'Payment Received',
        message: 'Payment of $125 has been received',
        type: 'payment',
      },
      {
        title: 'New Message',
        message: 'Sarah sent you a message about your listing',
        type: 'message',
      },
      {
        title: 'Price Alert',
        message: 'Maize prices have increased by 5%',
        type: 'system',
      },
    ];

    const randomNotification = notifications[Math.floor(Math.random() * notifications.length)];
    
    const notification: Notification = {
      id: `notif-${Date.now()}`,
      userId: this.userId || '',
      title: randomNotification.title!,
      message: randomNotification.message!,
      type: randomNotification.type as Notification['type'],
      read: false,
      createdAt: new Date().toISOString(),
    };

    eventEmitter.emit(EVENTS.NOTIFICATION_NEW, notification);
  }

  /**
   * Simulate an order status update
   */
  private simulateOrderUpdate(): void {
    const statuses: Order['status'][] = ['accepted', 'in_transit', 'delivered'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];

    eventEmitter.emit(EVENTS.ORDER_STATUS_CHANGED, {
      orderId: 'order-1',
      status: randomStatus,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Send a message (simulated)
   */
  sendMessage(conversationId: string, content: string): void {
    const message: Partial<Message> = {
      id: `msg-${Date.now()}`,
      senderId: this.userId || '',
      senderName: 'You',
      content,
      timestamp: new Date().toISOString(),
      read: false,
    };

    // Emit locally
    eventEmitter.emit(EVENTS.MESSAGE_NEW, {
      conversationId,
      message,
    });

    // Simulate response after delay
    setTimeout(() => {
      if (this.isConnected) {
        const response: Partial<Message> = {
          id: `msg-${Date.now()}`,
          senderId: 'other-user',
          senderName: 'John Moyo',
          content: 'Thanks for your message! I\'ll get back to you shortly.',
          timestamp: new Date().toISOString(),
          read: false,
        };

        eventEmitter.emit(EVENTS.MESSAGE_NEW, {
          conversationId,
          message: response,
        });
      }
    }, 3000 + Math.random() * 5000);
  }

  /**
   * Subscribe to typing indicator
   */
  subscribeToTyping(conversationId: string, callback: (isTyping: boolean) => void): () => void {
    // Simulate typing indicator
    let typingTimeout: number | null = null;

    const handleMessage = () => {
      callback(true);
      if (typingTimeout) clearTimeout(typingTimeout);
      typingTimeout = window.setTimeout(() => callback(false), 3000);
    };

    const subscription = eventEmitter.on(EVENTS.MESSAGE_NEW, handleMessage);

    return () => {
      subscription.unsubscribe();
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }

  /**
   * Request transport location updates
   */
  trackTransport(requestId: string): () => void {
    // Simulate location updates
    const timer = window.setInterval(() => {
      if (this.isConnected) {
        eventEmitter.emit(EVENTS.TRANSPORT_LOCATION_UPDATE, {
          requestId,
          location: {
            lat: -17.8292 + (Math.random() - 0.5) * 0.1,
            lng: 31.0522 + (Math.random() - 0.5) * 0.1,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }, 10000);

    return () => clearInterval(timer);
  }
}

// Singleton instance
export const realtimeService = new RealtimeService();

export default realtimeService;
