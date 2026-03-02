import { supabase } from '../../lib/supabase';

export const adminService = {
  async getStats() {
    const [
      { count: totalUsers },
      { count: totalListings },
      { count: activeListings },
      { count: totalOrders },
      { count: completedOrders },
      { count: pendingDisputes },
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }),
      supabase.from('listings').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase.from('orders').select('*', { count: 'exact', head: true }),
      supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
      supabase.from('disputes').select('*', { count: 'exact', head: true }).in('status', ['open', 'investigating']),
    ]);

    const { data: roleCounts } = await supabase
      .from('profiles')
      .select('role') as { data: { role: string }[] | null };

    const farmers = roleCounts?.filter(u => u.role === 'farmer').length || 0;
    const buyers = roleCounts?.filter(u => u.role === 'buyer').length || 0;
    const transporters = roleCounts?.filter(u => u.role === 'transporter').length || 0;

    // Get revenue from completed orders
    const { data: revenueData } = await supabase
      .from('orders')
      .select('total_price')
      .eq('status', 'completed') as { data: { total_price: number }[] | null };
    const totalRevenue = revenueData?.reduce((sum, o) => sum + (o.total_price || 0), 0) || 0;

    // Get commission from wallet transactions
    const { data: commissionData } = await supabase
      .from('wallet_transactions')
      .select('fee')
      .eq('type', 'payment')
      .eq('status', 'completed') as { data: { fee: number }[] | null };
    const totalCommission = commissionData?.reduce((sum, t) => sum + (t.fee || 0), 0) || 0;

    return {
      totalUsers: totalUsers || 0,
      totalFarmers: farmers,
      totalBuyers: buyers,
      totalTransporters: transporters,
      totalListings: totalListings || 0,
      activeListings: activeListings || 0,
      totalOrders: totalOrders || 0,
      completedOrders: completedOrders || 0,
      totalRevenue,
      totalCommission,
      pendingDisputes: pendingDisputes || 0,
      escrowBalance: 0,
    };
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
