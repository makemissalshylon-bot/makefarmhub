/**
 * Real-time Messaging Service
 * Provides WebSocket-based real-time communication for chat,
 * notifications, and live updates.
 * 
 * In production, connect to a WebSocket server (e.g., Pusher, Ably, Socket.io)
 * Currently uses a local event emitter pattern with simulated real-time behavior
 */

type MessageHandler = (data: any) => void;
type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

interface RealtimeMessage {
  id: string;
  channel: string;
  event: string;
  data: any;
  timestamp: number;
}

class RealtimeService {
  private handlers: Map<string, Set<MessageHandler>> = new Map();
  private status: ConnectionStatus = 'disconnected';
  private statusHandlers: Set<(status: ConnectionStatus) => void> = new Set();
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private messageQueue: RealtimeMessage[] = [];

  /**
   * Connect to WebSocket server
   */
  connect(userId?: string): void {
    if (this.status === 'connected' || this.status === 'connecting') return;

    this.setStatus('connecting');

    const wsUrl = import.meta.env.VITE_WS_URL;

    if (wsUrl) {
      // Production: Connect to real WebSocket server
      try {
        this.ws = new WebSocket(`${wsUrl}?userId=${userId || ''}`);

        this.ws.onopen = () => {
          console.log('[RT] WebSocket connected');
          this.setStatus('connected');
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.flushMessageQueue();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: RealtimeMessage = JSON.parse(event.data);
            this.dispatch(message.channel, message.event, message.data);
          } catch (err) {
            console.error('[RT] Failed to parse message:', err);
          }
        };

        this.ws.onclose = () => {
          console.log('[RT] WebSocket disconnected');
          this.setStatus('disconnected');
          this.stopHeartbeat();
          this.attemptReconnect(userId);
        };

        this.ws.onerror = (error) => {
          console.error('[RT] WebSocket error:', error);
          this.setStatus('error');
        };
      } catch (error) {
        console.error('[RT] Failed to connect:', error);
        this.setStatus('error');
      }
    } else {
      // Development: Simulate connected state
      console.log('[RT] No WebSocket URL configured, using local simulation');
      setTimeout(() => {
        this.setStatus('connected');
      }, 500);
    }
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.stopHeartbeat();
    this.setStatus('disconnected');
    this.reconnectAttempts = 0;
  }

  /**
   * Subscribe to a channel/event
   */
  subscribe(channel: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(channel)) {
      this.handlers.set(channel, new Set());
    }
    this.handlers.get(channel)!.add(handler);

    // Return unsubscribe function
    return () => {
      this.handlers.get(channel)?.delete(handler);
      if (this.handlers.get(channel)?.size === 0) {
        this.handlers.delete(channel);
      }
    };
  }

  /**
   * Subscribe to connection status changes
   */
  onStatusChange(handler: (status: ConnectionStatus) => void): () => void {
    this.statusHandlers.add(handler);
    // Immediately call with current status
    handler(this.status);
    return () => {
      this.statusHandlers.delete(handler);
    };
  }

  /**
   * Send a message through WebSocket
   */
  send(channel: string, event: string, data: any): void {
    const message: RealtimeMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      channel,
      event,
      data,
      timestamp: Date.now(),
    };

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      // Queue message for when connection is established
      this.messageQueue.push(message);
    }

    // Also dispatch locally for immediate UI update
    this.dispatch(channel, event, data);
  }

  /**
   * Simulate receiving a message (for development/demo)
   */
  simulateMessage(channel: string, event: string, data: any): void {
    setTimeout(() => {
      this.dispatch(channel, event, data);
    }, Math.random() * 1000 + 500);
  }

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus {
    return this.status;
  }

  // Private methods

  private dispatch(channel: string, event: string, data: any): void {
    // Notify channel-specific handlers
    const channelHandlers = this.handlers.get(channel);
    if (channelHandlers) {
      channelHandlers.forEach((handler) => handler({ event, data }));
    }

    // Notify wildcard handlers
    const wildcardHandlers = this.handlers.get('*');
    if (wildcardHandlers) {
      wildcardHandlers.forEach((handler) => handler({ channel, event, data }));
    }
  }

  private setStatus(status: ConnectionStatus): void {
    this.status = status;
    this.statusHandlers.forEach((handler) => handler(status));
  }

  private attemptReconnect(userId?: string): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[RT] Max reconnect attempts reached');
      this.setStatus('error');
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`[RT] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);
    setTimeout(() => {
      this.connect(userId);
    }, delay);
  }

  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, 30000);
  }

  private stopHeartbeat(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }

  private flushMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      if (message && this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(message));
      }
    }
  }
}

export const realtimeService = new RealtimeService();
export default realtimeService;
