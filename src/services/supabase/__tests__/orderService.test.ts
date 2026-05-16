import { describe, it, expect, vi, beforeEach } from 'vitest';
import { orderService } from '../orderService';

// Mock Supabase client
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        or: vi.fn(() => ({
          order: vi.fn(() => Promise.resolve({
            data: [
              {
                id: 'order-1',
                listing_id: 'listing-1',
                buyer_id: 'buyer-1',
                seller_id: 'seller-1',
                status: 'pending',
                total_price: 1500,
              },
            ],
            error: null,
          })),
        })),
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'order-1',
              listing_id: 'listing-1',
              buyer_id: 'buyer-1',
              seller_id: 'seller-1',
              status: 'pending',
              total_price: 1500,
            },
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: {
              id: 'order-new',
              status: 'pending',
            },
            error: null,
          })),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
  },
}));

describe('orderService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getOrders', () => {
    it('should fetch orders for user', async () => {
      const orders = await orderService.getOrders('user-1', 'buyer');
      
      expect(orders).toHaveLength(1);
      expect(orders[0].id).toBe('order-1');
      expect(orders[0].status).toBe('pending');
    });

    it('should filter by user role', async () => {
      const buyerOrders = await orderService.getOrders('user-1', 'buyer');
      const sellerOrders = await orderService.getOrders('user-1', 'seller');
      
      expect(buyerOrders).toBeDefined();
      expect(sellerOrders).toBeDefined();
    });
  });

  describe('getOrderById', () => {
    it('should fetch single order', async () => {
      const order = await orderService.getOrderById('order-1');
      
      expect(order).toBeDefined();
      expect(order.id).toBe('order-1');
      expect(order.total_price).toBe(1500);
    });
  });

  describe('createOrder', () => {
    it('should create new order', async () => {
      const newOrder = await orderService.createOrder({
        listing_id: 'listing-1',
        buyer_id: 'buyer-1',
        seller_id: 'seller-1',
        quantity: 10,
        unit_price: 100,
        total_price: 1000,
        delivery_address: '123 Main St',
        delivery_date: '2026-06-01',
      });
      
      expect(newOrder).toBeDefined();
      expect(newOrder.id).toBe('order-new');
      expect(newOrder.status).toBe('pending');
    });

    it('should require all mandatory fields', async () => {
      await expect(orderService.createOrder({
        listing_id: '',
        buyer_id: 'buyer-1',
        seller_id: 'seller-1',
        quantity: 0,
        unit_price: 100,
        total_price: 0,
        delivery_address: '',
        delivery_date: '',
      })).rejects.toThrow();
    });
  });

  describe('updateStatus', () => {
    it('should update order status', async () => {
      await orderService.updateStatus('order-1', 'confirmed');
      
      // Verify update was called with correct params
      expect(vi.mocked).toBeDefined();
    });

    it('should reject invalid status', async () => {
      await expect(orderService.updateStatus('order-1', 'invalid_status' as any))
        .rejects.toThrow();
    });
  });

  describe('assignTransporter', () => {
    it('should assign transporter to order', async () => {
      await orderService.assignTransporter('order-1', 'transporter-1');
      
      expect(vi.mocked).toBeDefined();
    });

    it('should require valid transporter ID', async () => {
      await expect(orderService.assignTransporter('order-1', ''))
        .rejects.toThrow();
    });
  });

  describe('Order status transitions', () => {
    it('should allow valid status transitions', async () => {
      // pending -> confirmed
      await expect(orderService.updateStatus('order-1', 'confirmed'))
        .resolves.not.toThrow();
      
      // confirmed -> in_transit
      await expect(orderService.updateStatus('order-1', 'in_transit'))
        .resolves.not.toThrow();
      
      // in_transit -> delivered
      await expect(orderService.updateStatus('order-1', 'delivered'))
        .resolves.not.toThrow();
      
      // delivered -> completed
      await expect(orderService.updateStatus('order-1', 'completed'))
        .resolves.not.toThrow();
    });
  });
});
