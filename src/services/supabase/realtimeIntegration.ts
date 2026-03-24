/**
 * Supabase Realtime Integration
 * Live updates for messages, orders, notifications
 */

import { supabase } from '../../lib/supabase';
import { realtimeService } from '../realtimeService';

let messageChannel: any = null;
let notificationChannel: any = null;
let orderChannel: any = null;

export const supabaseRealtime = {
  /**
   * Subscribe to user-specific messages
   */
  subscribeToMessages(userId: string) {
    if (messageChannel) return;

    messageChannel = supabase
      .channel(`messages:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `receiver_id=eq.${userId}`,
        },
        (payload: any) => {
          realtimeService.send('messages', 'new_message', payload.new);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to user notifications
   */
  subscribeToNotifications(userId: string) {
    if (notificationChannel) return;

    notificationChannel = supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload: any) => {
          realtimeService.send('notifications', 'new_notification', payload.new);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to order updates
   */
  subscribeToOrders(userId: string) {
    if (orderChannel) return;

    orderChannel = supabase
      .channel(`orders:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${userId}`,
        },
        (payload: any) => {
          realtimeService.send('orders', 'order_updated', payload.new);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `seller_id=eq.${userId}`,
        },
        (payload: any) => {
          realtimeService.send('orders', 'order_updated', payload.new);
        }
      )
      .subscribe();
  },

  /**
   * Subscribe to all user channels
   */
  subscribeAll(userId: string) {
    this.subscribeToMessages(userId);
    this.subscribeToNotifications(userId);
    this.subscribeToOrders(userId);
  },

  /**
   * Unsubscribe from all channels
   */
  unsubscribeAll() {
    if (messageChannel) {
      supabase.removeChannel(messageChannel);
      messageChannel = null;
    }
    if (notificationChannel) {
      supabase.removeChannel(notificationChannel);
      notificationChannel = null;
    }
    if (orderChannel) {
      supabase.removeChannel(orderChannel);
      orderChannel = null;
    }
  },
};
