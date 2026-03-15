/**
 * WalletService Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

// Chainable mock helpers
function mockChain(resolvedData: any, resolvedError: any = null) {
  const chain: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
  };
  // Make the chain itself thenable
  const p = Promise.resolve({ data: resolvedData, error: resolvedError });
  chain.then = p.then.bind(p);
  chain.catch = p.catch.bind(p);
  return chain;
}

const mockSupabase = {
  from: vi.fn(),
};

vi.mock('../../lib/supabase', () => ({
  supabase: mockSupabase,
  isSupabaseReady: () => true,
}));

import { walletService } from '../../services/supabase/walletService';

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWallet', () => {
    it('returns existing wallet', async () => {
      const wallet = { id: 'w1', user_id: 'u1', balance: 500, escrow_held: 100 };
      mockSupabase.from.mockReturnValue(mockChain(wallet));

      const result = await walletService.getWallet('u1');
      expect(mockSupabase.from).toHaveBeenCalledWith('wallets');
      expect(result).toEqual(wallet);
    });

    it('creates wallet if not found (PGRST116)', async () => {
      const newWallet = { id: 'w2', user_id: 'u2', balance: 0 };

      // First call: wallet not found
      const notFoundChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'No rows' } }),
      };

      // Second call: insert new wallet
      const insertChain: any = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: newWallet, error: null }),
          }),
        }),
      };

      mockSupabase.from
        .mockReturnValueOnce(notFoundChain)
        .mockReturnValueOnce(insertChain);

      const result = await walletService.getWallet('u2');
      expect(result).toEqual(newWallet);
    });

    it('throws on non-PGRST116 error', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: null, error: { code: 'OTHER', message: 'DB error' } }),
      };
      mockSupabase.from.mockReturnValue(chain);

      await expect(walletService.getWallet('u1')).rejects.toEqual({ code: 'OTHER', message: 'DB error' });
    });
  });

  describe('getTransactions', () => {
    it('returns user transactions', async () => {
      const txs = [
        { id: 't1', type: 'deposit', amount: 100 },
        { id: 't2', type: 'withdrawal', amount: 50 },
      ];
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      const p = Promise.resolve({ data: txs, error: null });
      chain.then = p.then.bind(p);
      chain.catch = p.catch.bind(p);

      mockSupabase.from.mockReturnValue(chain);

      const result = await walletService.getTransactions('u1');
      expect(result).toEqual(txs);
    });

    it('returns empty array on null data', async () => {
      const chain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
      };
      const p = Promise.resolve({ data: null, error: null });
      chain.then = p.then.bind(p);
      chain.catch = p.catch.bind(p);

      mockSupabase.from.mockReturnValue(chain);

      const result = await walletService.getTransactions('u1');
      expect(result).toEqual([]);
    });
  });

  describe('withdraw', () => {
    it('throws on insufficient balance', async () => {
      // getWallet returns wallet with low balance
      const walletChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { balance: 10, escrow_held: 0 }, error: null }),
      };
      mockSupabase.from.mockReturnValue(walletChain);

      await expect(walletService.withdraw('u1', 100, 'ecocash')).rejects.toThrow('Insufficient balance');
    });
  });

  describe('holdEscrow', () => {
    it('throws on insufficient balance for escrow', async () => {
      const walletChain: any = {
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({ data: { balance: 5, escrow_held: 0 }, error: null }),
      };
      mockSupabase.from.mockReturnValue(walletChain);

      await expect(walletService.holdEscrow('u1', 100, 'order-1')).rejects.toThrow('Insufficient balance for escrow');
    });
  });
});
