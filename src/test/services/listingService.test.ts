/**
 * ListingService Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  storage: {
    from: vi.fn().mockReturnValue({
      upload: vi.fn().mockResolvedValue({ error: null }),
      getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/img.jpg' } }),
    }),
  },
}));

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseReady: () => true,
}));

import { listingService } from '../../services/supabase/listingService';

describe('listingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('queries listings with default ordering', async () => {
      const mockListings = [
        { id: '1', title: 'Maize', price: 100 },
        { id: '2', title: 'Tomatoes', price: 50 },
      ];
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: mockListings, error: null }),
          }),
        }),
      });

      const result = await listingService.getAll();
      expect(mockSupabase.from).toHaveBeenCalledWith('listings');
      expect(result).toEqual(mockListings);
    });

    it('applies category filter', async () => {
      const eqMock = vi.fn().mockReturnValue({
        then: (resolve: any) => resolve({ data: [], error: null }),
      });
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            eq: eqMock,
          }),
        }),
      });

      await listingService.getAll({ category: 'crops' });
      expect(eqMock).toHaveBeenCalledWith('category', 'crops');
    });

    it('returns empty array on null data', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: null, error: null }),
          }),
        }),
      });

      const result = await listingService.getAll();
      expect(result).toEqual([]);
    });

    it('throws on error', async () => {
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            then: (resolve: any) => resolve({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      });

      await expect(listingService.getAll()).rejects.toEqual({ message: 'DB error' });
    });
  });

  describe('create', () => {
    it('inserts a new listing', async () => {
      const newListing = {
        seller_id: 'user-1',
        title: 'Fresh Maize',
        category: 'crops',
        price: 150,
      };
      const created = { id: 'new-1', ...newListing };

      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: created, error: null }),
          }),
        }),
      });

      const result = await listingService.create(newListing);
      expect(mockSupabase.from).toHaveBeenCalledWith('listings');
      expect(result).toEqual(created);
    });

    it('throws on insert error', async () => {
      mockSupabase.from.mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Insert failed' } }),
          }),
        }),
      });

      await expect(
        listingService.create({ seller_id: 'x', title: 'T', category: 'c', price: 1 })
      ).rejects.toEqual({ message: 'Insert failed' });
    });
  });

  describe('update', () => {
    it('updates a listing by id', async () => {
      const updated = { id: '1', title: 'Updated Maize', price: 200 };

      mockSupabase.from.mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updated, error: null }),
            }),
          }),
        }),
      });

      const result = await listingService.update('1', { title: 'Updated Maize', price: 200 });
      expect(result).toEqual(updated);
    });
  });

  describe('delete', () => {
    it('deletes a listing by id', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      await expect(listingService.delete('1')).resolves.toBeUndefined();
    });

    it('throws on delete error', async () => {
      mockSupabase.from.mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      });

      await expect(listingService.delete('1')).rejects.toEqual({ message: 'Delete failed' });
    });
  });

  describe('uploadImages', () => {
    it('uploads files and returns public URLs', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({
          data: { publicUrl: 'https://storage.example.com/test.jpg' },
        }),
      });

      const urls = await listingService.uploadImages('user-1', [mockFile]);
      expect(urls).toHaveLength(1);
      expect(urls[0]).toBe('https://storage.example.com/test.jpg');
    });

    it('throws on upload error', async () => {
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

      mockSupabase.storage.from.mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: { message: 'Upload failed' } }),
      });

      await expect(listingService.uploadImages('user-1', [mockFile])).rejects.toEqual({
        message: 'Upload failed',
      });
    });
  });
});
