import { supabase } from '../../lib/supabase';

export const transportService = {
  async getVehicles(ownerId?: string) {
    let query = supabase
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false });

    if (ownerId) query = query.eq('owner_id', ownerId);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getAvailableVehicles() {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('available', true)
      .order('rating', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async createVehicle(vehicle: {
    owner_id: string;
    owner_name: string;
    type: string;
    name: string;
    capacity?: string;
    price_per_km?: number;
    location?: string;
    image?: string;
  }) {
    const { data, error } = await supabase
      .from('vehicles')
      .insert(vehicle as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateVehicle(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('vehicles')
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteVehicle(id: string) {
    const { error } = await supabase
      .from('vehicles')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async getTransportRequests(filters?: { orderId?: string; vehicleId?: string; status?: string }) {
    let query = supabase
      .from('transport_requests')
      .select('*, vehicles(*)')
      .order('created_at', { ascending: false });

    if (filters?.orderId) query = query.eq('order_id', filters.orderId);
    if (filters?.vehicleId) query = query.eq('vehicle_id', filters.vehicleId);
    if (filters?.status) query = query.eq('status', filters.status);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async createTransportRequest(request: {
    order_id: string;
    pickup_location: string;
    delivery_location: string;
    distance?: number;
    estimated_price?: number;
    vehicle_id?: string;
    scheduled_date?: string;
  }) {
    const { data, error } = await supabase
      .from('transport_requests')
      .insert(request as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTransportRequest(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('transport_requests')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
