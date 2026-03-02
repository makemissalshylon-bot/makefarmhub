import { supabase } from '../../lib/supabase';

export const reviewService = {
  async getForTarget(targetId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('target_id', targetId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async getForOrder(orderId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('order_id', orderId);
    if (error) throw error;
    return data || [];
  },

  async create(review: {
    order_id: string;
    reviewer_id: string;
    reviewer_name: string;
    reviewer_avatar?: string;
    reviewer_role: string;
    target_id: string;
    target_name: string;
    target_type: 'seller' | 'buyer' | 'listing';
    rating: number;
    title?: string;
    comment: string;
    images?: string[];
  }) {
    const { data, error } = await supabase
      .from('reviews')
      .insert(review as any)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async addSellerResponse(reviewId: string, comment: string) {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        seller_response: {
          comment,
          respondedAt: new Date().toISOString(),
        },
      } as any)
      .eq('id', reviewId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async markHelpful(reviewId: string) {
    const { data: review } = await supabase
      .from('reviews')
      .select('helpful')
      .eq('id', reviewId)
      .single();

    const { error } = await supabase
      .from('reviews')
      .update({ helpful: ((review as any)?.helpful || 0) + 1 } as any)
      .eq('id', reviewId);
    if (error) throw error;
  },

  async getSellerStats(sellerId: string) {
    const { data, error } = await supabase
      .from('reviews')
      .select('rating')
      .eq('target_id', sellerId)
      .eq('target_type', 'seller');
    if (error) throw error;

    const reviews = data || [];
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews
      : 0;

    const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(r => {
      const key = r.rating as keyof typeof ratings;
      if (key in ratings) ratings[key]++;
    });

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratings,
      responseRate: 85,
      totalSales: totalReviews,
    };
  },
};
