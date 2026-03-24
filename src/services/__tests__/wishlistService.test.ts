import { describe, it, expect, beforeEach, vi } from 'vitest';
import { wishlistService } from '../wishlistService';

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../lib/supabase';

const makeChain = (result: any) => {
  const chain: any = {
    insert: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
    maybeSingle: vi.fn().mockResolvedValue(result),
  };
  return chain;
};

describe('wishlistService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addToWishlist', () => {
    it('should add item to wishlist successfully', async () => {
      const mockData = { id: 'w1', user_id: 'user123', listing_id: 'listing123' };
      const chain = makeChain({ data: mockData, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const result = await wishlistService.addToWishlist('user123', 'listing123');

      expect(result).toEqual(mockData);
      expect(supabase.from).toHaveBeenCalledWith('wishlists');
    });

    it('should throw error when adding fails', async () => {
      const chain = makeChain({ data: null, error: new Error('Duplicate entry') });
      (supabase.from as any).mockReturnValue(chain);

      await expect(
        wishlistService.addToWishlist('user123', 'listing123')
      ).rejects.toThrow();
    });
  });

  describe('removeFromWishlist', () => {
    it('should remove item from wishlist successfully', async () => {
      const chain = makeChain({ error: null });
      (supabase.from as any).mockReturnValue(chain);

      await expect(
        wishlistService.removeFromWishlist('user123', 'listing123')
      ).resolves.not.toThrow();
    });
  });

  describe('getWishlist', () => {
    it('should fetch user wishlist', async () => {
      const mockData = [
        { id: 'w1', listing_id: 'l1', created_at: '2026-03-20T00:00:00Z' },
        { id: 'w2', listing_id: 'l2', created_at: '2026-03-20T00:00:00Z' },
      ];
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const result = await wishlistService.getWishlist('user123');

      expect(result).toHaveLength(2);
    });
  });

  describe('isInWishlist', () => {
    it('should return true when item is in wishlist', async () => {
      const chain = makeChain({ data: { id: 'w1' }, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const result = await wishlistService.isInWishlist('user123', 'listing123');

      expect(result).toBe(true);
    });

    it('should return false when item not in wishlist', async () => {
      const chain = makeChain({ data: null, error: null });
      (supabase.from as any).mockReturnValue(chain);

      const result = await wishlistService.isInWishlist('user123', 'listing123');

      expect(result).toBe(false);
    });
  });

  describe('getWishlistCount', () => {
    it('should return count of wishlist items', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
      };
      (supabase.from as any).mockReturnValue(chain);

      const count = await wishlistService.getWishlistCount('user123');

      expect(count).toBe(3);
    });
  });
});
