import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
}));

vi.mock('../../../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseReady: () => true,
}));

function mockChain(resolvedData: any, resolvedError: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    or: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
  };
  const p = Promise.resolve({ data: Array.isArray(resolvedData) ? resolvedData : resolvedData, error: resolvedError });
  // For list queries that await the builder directly
  chain.then = p.then.bind(p);
  chain.catch = p.catch.bind(p);
  return chain;
}

import { orderService } from '../orderService';

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('fetches orders for buyer', async () => {
      const orders = [{ id: 'order-1', status: 'pending', total_price: 1500 }];
      mockSupabase.from.mockReturnValue(mockChain(orders));

      const result = await orderService.getAll('user-1', 'buyer');
      expect(mockSupabase.from).toHaveBeenCalledWith('orders');
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('order-1');
    });

    it('fetches orders for seller', async () => {
      mockSupabase.from.mockReturnValue(mockChain([]));
      const result = await orderService.getAll('user-1', 'seller');
      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('fetches a single order', async () => {
      const order = { id: 'order-1', total_price: 1500 };
      mockSupabase.from.mockReturnValue(mockChain(order));

      const result = await orderService.getById('order-1');
      expect(result.id).toBe('order-1');
      expect(result.total_price).toBe(1500);
    });
  });

  describe('create', () => {
    it('creates an order', async () => {
      const created = { id: 'order-new', status: 'pending' };
      mockSupabase.from.mockReturnValue(mockChain(created));

      const result = await orderService.create({
        listing_id: 'listing-1',
        listing_title: 'Maize',
        listing_image: '/img.jpg',
        buyer_id: 'buyer-1',
        buyer_name: 'Buyer',
        seller_id: 'seller-1',
        seller_name: 'Seller',
        quantity: 10,
        unit_price: 100,
        total_price: 1000,
        escrow_amount: 1000,
        delivery_address: 'Harare',
      });

      expect(result.id).toBe('order-new');
    });
  });

  describe('updateStatus', () => {
    it('updates order status', async () => {
      mockSupabase.from.mockReturnValue(mockChain({ id: 'order-1', status: 'confirmed' }));
      const result = await orderService.updateStatus('order-1', 'confirmed');
      expect(result.status).toBe('confirmed');
    });
  });

  describe('assignTransporter', () => {
    it('assigns transporter with name', async () => {
      mockSupabase.from.mockReturnValue(
        mockChain({ id: 'order-1', transporter_id: 't1', status: 'in_transit' })
      );
      const result = await orderService.assignTransporter('order-1', 't1', 'Mike');
      expect(result.transporter_id).toBe('t1');
      expect(result.status).toBe('in_transit');
    });
  });
});
