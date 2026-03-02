import { supabase } from '../../lib/supabase';

export const listingService = {
  async getAll(filters?: {
    category?: string;
    status?: string;
    sellerId?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }) {
    let query = supabase
      .from('listings')
      .select('*, profiles:seller_id(name, avatar, verified, location, rating)')
      .order('created_at', { ascending: false });

    if (filters?.category) query = query.eq('category', filters.category);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.sellerId) query = query.eq('seller_id', filters.sellerId);
    if (filters?.search) query = query.ilike('title', `%${filters.search}%`);
    if (filters?.limit) query = query.limit(filters.limit);
    if (filters?.offset) query = query.range(filters.offset, filters.offset + (filters.limit || 20) - 1);

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('listings')
      .select('*, profiles:seller_id(name, avatar, verified, location, rating)')
      .eq('id', id)
      .single();
    if (error) throw error;

    // Increment views
    try {
      const { error: rpcError } = await supabase.rpc('increment_views', { listing_id: id });
      if (rpcError) {
        // Fallback: direct update if RPC not set up
        await supabase.from('listings').update({ views: ((data as any).views || 0) + 1 }).eq('id', id);
      }
    } catch {
      // Silently fail view increment
    }

    return data;
  },

  async create(listing: {
    seller_id: string;
    title: string;
    description?: string;
    category: string;
    subcategory?: string;
    price: number;
    unit?: string;
    quantity?: number;
    location?: string;
    images?: string[];
    ready_to_sell?: boolean;
    delivery_terms?: string;
    delivery_options?: string[];
    payment_options?: string[];
    organic?: boolean;
    tags?: string[];
  }) {
    const { data, error } = await supabase
      .from('listings')
      .insert(listing as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: Record<string, unknown>) {
    const { data, error } = await supabase
      .from('listings')
      .update({ ...updates, updated_at: new Date().toISOString() } as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async uploadImages(sellerId: string, files: File[]): Promise<string[]> {
    const urls: string[] = [];
    for (const file of files) {
      const fileExt = file.name.split('.').pop();
      const filePath = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

      const { error } = await supabase.storage
        .from('listing-images')
        .upload(filePath, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('listing-images')
        .getPublicUrl(filePath);

      urls.push(publicUrl);
    }
    return urls;
  },
};
