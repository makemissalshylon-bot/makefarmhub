/**
 * Wishlist Service
 * Manage user wishlists and saved items
 */

import { supabase } from './supabase/client';

export interface WishlistItem {
  id: string;
  userId: string;
  listingId: string;
  addedAt: string;
  listing?: any;
}

export const wishlistService = {
  /**
   * Add item to wishlist
   */
  async addToWishlist(userId: string, listingId: string): Promise<WishlistItem> {
    const { data, error } = await supabase
      .from('wishlists')
      .insert({
        user_id: userId,
        listing_id: listingId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove from wishlist
   */
  async removeFromWishlist(userId: string, listingId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId)
      .eq('listing_id', listingId);

    if (error) throw error;
  },

  /**
   * Get user's wishlist
   */
  async getWishlist(userId: string): Promise<WishlistItem[]> {
    const { data, error } = await supabase
      .from('wishlists')
      .select(`
        id,
        user_id,
        listing_id,
        created_at,
        listings (*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Check if item is in wishlist
   */
  async isInWishlist(userId: string, listingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', userId)
      .eq('listing_id', listingId)
      .maybeSingle();

    if (error) return false;
    return !!data;
  },

  /**
   * Get wishlist count
   */
  async getWishlistCount(userId: string): Promise<number> {
    const { count, error } = await supabase
      .from('wishlists')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (error) return 0;
    return count || 0;
  },

  /**
   * Clear entire wishlist
   */
  async clearWishlist(userId: string): Promise<void> {
    const { error } = await supabase
      .from('wishlists')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },
};
