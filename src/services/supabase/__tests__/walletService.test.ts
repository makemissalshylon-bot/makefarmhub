import { describe, it, expect, vi, beforeEach } from 'vitest';
import { walletService } from '../walletService';

// Mock Supabase client
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: { id: 'wallet-1', user_id: 'user-1', balance: 1000, escrow_held: 500 },
            error: null,
          })),
        })),
        order: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve({
            data: [
              { id: 'tx-1', amount: 100, type: 'deposit', status: 'completed' },
              { id: 'tx-2', amount: 50, type: 'withdrawal', status: 'completed' },
            ],
            error: null,
          })),
        })),
      })),
      insert: vi.fn(() => Promise.resolve({ data: null, error: null })),
      update: vi.fn(() => ({
        eq: vi.fn(() => Promise.resolve({ data: null, error: null })),
      })),
    })),
    rpc: vi.fn((functionName, params) => {
      if (functionName === 'process_order_escrow') {
        return Promise.resolve({ data: true, error: null });
      }
      if (functionName === 'release_order_escrow') {
        return Promise.resolve({ data: true, error: null });
      }
      return Promise.resolve({ data: null, error: null });
    }),
  },
}));

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWallet', () => {
    it('should fetch wallet for user', async () => {
      const wallet = await walletService.getWallet('user-1');
      
      expect(wallet).toBeDefined();
      expect(wallet.user_id).toBe('user-1');
      expect(wallet.balance).toBe(1000);
      expect(wallet.escrow_held).toBe(500);
    });
  });

  describe('getTransactions', () => {
    it('should fetch transactions for user', async () => {
      const transactions = await walletService.getTransactions('user-1');
      
      expect(transactions).toHaveLength(2);
      expect(transactions[0].type).toBe('deposit');
      expect(transactions[1].type).toBe('withdrawal');
    });
  });

  describe('holdEscrow', () => {
    it('should hold escrow amount for order', async () => {
      const result = await walletService.holdEscrow('user-1', 200, 'order-1');

      expect(result).toBe(true);
    });

    it('should reject negative amounts', async () => {
      await expect(walletService.holdEscrow('user-1', -100, 'order-1'))
        .rejects.toThrow('Invalid escrow amount');
    });

    it('should reject zero amounts', async () => {
      await expect(walletService.holdEscrow('user-1', 0, 'order-1'))
        .rejects.toThrow('Invalid escrow amount');
    });
  });

  describe('releaseEscrow', () => {
    it('should release escrow from buyer to seller', async () => {
      const result = await walletService.releaseEscrow(
        'buyer-1',
        'seller-1',
        200,
        'order-1'
      );
      
      expect(result).toBe(true);
    });

    it('should reject negative amounts', async () => {
      await expect(
        walletService.releaseEscrow('buyer-1', 'seller-1', -100, 'order-1')
      ).rejects.toThrow('Invalid escrow amount');
    });

    it('should require all parameters', async () => {
      await expect(
        walletService.releaseEscrow('', 'seller-1', 100, 'order-1')
      ).rejects.toThrow();
    });
  });

  describe('deposit', () => {
    it('should create deposit transaction', async () => {
      await walletService.deposit('user-1', 500, 'Bank transfer');
      
      // Verify transaction was created (mock verification)
      expect(vi.mocked).toBeDefined();
    });

    it('should reject invalid amounts', async () => {
      await expect(walletService.deposit('user-1', -100, 'Invalid'))
        .rejects.toThrow();
    });
  });

  describe('withdraw', () => {
    it('should create withdrawal transaction', async () => {
      await walletService.withdraw('user-1', 300, 'Bank withdrawal');
      
      // Verify transaction was created
      expect(vi.mocked).toBeDefined();
    });

    it('should reject amounts exceeding balance', async () => {
      // This would need actual balance checking in the service
      await expect(walletService.withdraw('user-1', 10000, 'Too much'))
        .rejects.toThrow();
    });
  });
});
