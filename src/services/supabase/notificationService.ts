import { supabase } from '../../lib/supabase';

export const notificationService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async create(notification: {
    user_id: string;
    title: string;
    message: string;
    type: 'order' | 'message' | 'payment' | 'system' | 'success' | 'warning' | 'info';
    action_url?: string;
  }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markAsRead(id: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('id', id);
    if (error) throw error;
  },

  async markAllAsRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true } as any)
      .eq('user_id', userId)
      .eq('read', false);
    if (error) throw error;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteAll(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);
    if (error) throw error;
  },

  subscribeToNotifications(userId: string, callback: (notification: any) => void) {
    return supabase
      .channel(`notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },
};
