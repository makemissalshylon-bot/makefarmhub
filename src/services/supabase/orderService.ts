import { supabase } from '../../lib/supabase';

export const orderService = {
  async getAll(userId: string, role: 'buyer' | 'seller' | 'transporter') {
    let query = supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (role === 'buyer') query = query.eq('buyer_id', userId);
    else if (role === 'seller') query = query.eq('seller_id', userId);
    else if (role === 'transporter') query = query.eq('transporter_id', userId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return data;
  },

  async create(order: {
    listing_id: string;
    listing_title: string;
    listing_image: string;
    buyer_id: string;
    buyer_name: string;
    seller_id: string;
    seller_name: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    escrow_amount: number;
    delivery_address: string;
    payment_method?: string;
  }) {
    const { data, error } = await supabase
      .from('orders')
      .insert(order as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({ status, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async assignTransporter(id: string, transporterId: string, transporterName: string) {
    const { data, error } = await supabase
      .from('orders')
      .update({
        transporter_id: transporterId,
        transporter_name: transporterName,
        status: 'in_transit',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAllAdmin() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },
};
