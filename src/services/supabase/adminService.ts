import { supabase } from '../../lib/supabase';

export const adminService = {
  async getStats() {
    // Use RPC function for optimized stats query
    const { data, error } = await supabase.rpc('get_admin_stats');
    
    if (error) {
      console.error('Failed to fetch admin stats:', error);
      // Fallback to empty stats
      return {
        totalUsers: 0,
        totalFarmers: 0,
        totalBuyers: 0,
        totalTransporters: 0,
        verifiedUsers: 0,
        totalListings: 0,
        activeListings: 0,
        totalOrders: 0,
        pendingOrders: 0,
        completedOrders: 0,
        totalRevenue: 0,
        escrowBalance: 0,
        totalDisputes: 0,
        openDisputes: 0,
      };
    }

    return {
      totalUsers: data.total_users || 0,
      totalFarmers: data.total_farmers || 0,
      totalBuyers: data.total_buyers || 0,
      totalTransporters: data.total_transporters || 0,
      verifiedUsers: data.verified_users || 0,
      totalListings: data.total_listings || 0,
      activeListings: data.active_listings || 0,
      totalOrders: data.total_orders || 0,
      pendingOrders: data.pending_orders || 0,
      completedOrders: data.completed_orders || 0,
      totalRevenue: data.total_revenue || 0,
      escrowBalance: data.escrow_balance || 0,
      totalDisputes: data.total_disputes || 0,
      openDisputes: data.open_disputes || 0,
    };
  },

  async getRevenueAnalytics(days: number = 30) {
    const { data, error } = await supabase.rpc('get_revenue_analytics', { days });
    if (error) throw error;
    return data || [];
  },

  async getTopProducts(limit: number = 10) {
    const { data, error } = await supabase.rpc('get_top_products', { limit_count: limit });
    if (error) throw error;
    return data || [];
  },

  async getUserGrowth(days: number = 30) {
    const { data, error } = await supabase.rpc('get_user_growth', { days });
    if (error) throw error;
    return data || [];
  },

  async getAllUsers() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllDisputes() {
    const { data, error } = await supabase
      .from('disputes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async updateDispute(id: string, updates: { status?: string; resolution?: string }) {
    const updateData: Record<string, unknown> = { ...updates };
    if (updates.status === 'resolved') {
      updateData.resolved_at = new Date().toISOString();
    }
    const { data, error } = await supabase
      .from('disputes')
      .update(updateData as any)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async getAllOrders() {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getAllTransactions() {
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async verifyUser(userId: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ verified: true, updated_at: new Date().toISOString() } as any)
      .eq('id', userId);
    if (error) throw error;
  },

  async suspendUser(userId: string) {
    // For now, just mark as unverified
    const { error } = await supabase
      .from('profiles')
      .update({ verified: false, updated_at: new Date().toISOString() } as any)
      .eq('id', userId);
    if (error) throw error;
  },
};
