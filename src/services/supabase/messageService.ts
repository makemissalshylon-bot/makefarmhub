import { supabase } from '../../lib/supabase';

export const messageService = {
  async getConversations(userId: string) {
    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', [userId])
      .order('last_message_time', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getMessages(conversationId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async sendMessage(message: {
    conversation_id: string;
    sender_id: string;
    sender_name: string;
    content: string;
  }) {
    const { data, error } = await supabase
      .from('messages')
      .insert(message as any)
      .select()
      .single();
    if (error) throw error;

    // Update conversation last message
    await supabase
      .from('conversations')
      .update({
        last_message: message.content,
        last_message_time: new Date().toISOString(),
      } as any)
      .eq('id', message.conversation_id);

    return data;
  },

  async createConversation(params: {
    participant_ids: string[];
    listing_id?: string;
    listing_title?: string;
    initial_message?: string;
    sender_id: string;
    sender_name: string;
  }) {
    // Check if conversation already exists between these participants
    const { data: existing } = await supabase
      .from('conversations')
      .select('*')
      .contains('participant_ids', params.participant_ids);

    if (existing && existing.length > 0) {
      // Find exact match (same participants)
      const match = existing.find((c: any) =>
        c.participant_ids.length === params.participant_ids.length &&
        params.participant_ids.every((id: string) => c.participant_ids.includes(id))
      );
      if (match) return match;
    }

    const { data, error } = await supabase
      .from('conversations')
      .insert({
        participant_ids: params.participant_ids,
        listing_id: params.listing_id || null,
        listing_title: params.listing_title || null,
        last_message: params.initial_message || '',
        last_message_time: new Date().toISOString(),
      } as any)
      .select()
      .single();
    if (error) throw error;

    // Send initial message if provided
    if (params.initial_message && data) {
      await messageService.sendMessage({
        conversation_id: (data as any).id,
        sender_id: params.sender_id,
        sender_name: params.sender_name,
        content: params.initial_message,
      });
    }

    return data;
  },

  async markAsRead(conversationId: string, userId: string) {
    const { error } = await supabase
      .from('messages')
      .update({ read: true } as any)
      .eq('conversation_id', conversationId)
      .neq('sender_id', userId);
    if (error) throw error;
  },

  subscribeToMessages(conversationId: string, callback: (message: any) => void) {
    return supabase
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => callback(payload.new)
      )
      .subscribe();
  },
};
