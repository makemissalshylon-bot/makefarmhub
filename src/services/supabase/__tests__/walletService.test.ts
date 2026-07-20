import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSupabase = vi.hoisted(() => ({
  from: vi.fn(),
  rpc: vi.fn(),
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
    single: vi.fn().mockResolvedValue({ data: resolvedData, error: resolvedError }),
  };
  const p = Promise.resolve({ data: resolvedData, error: resolvedError });
  chain.then = p.then.bind(p);
  chain.catch = p.catch.bind(p);
  return chain;
}

import { walletService } from '../walletService';

describe('walletService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getWallet', () => {
    it('fetches wallet for user', async () => {
      const wallet = { id: 'wallet-1', user_id: 'user-1', balance: 1000, escrow_held: 500 };
      mockSupabase.from.mockReturnValue(mockChain(wallet));

      const result = await walletService.getWallet('user-1');
      expect(result.user_id).toBe('user-1');
      expect(result.balance).toBe(1000);
    });
  });

  describe('getTransactions', () => {
    it('fetches transactions for user', async () => {
      const txns = [
        { id: 'tx-1', amount: 100, type: 'deposit', status: 'completed' },
        { id: 'tx-2', amount: 50, type: 'withdrawal', status: 'completed' },
      ];
      mockSupabase.from.mockReturnValue(mockChain(txns));

      const result = await walletService.getTransactions('user-1');
      expect(result).toHaveLength(2);
      expect(result[0].type).toBe('deposit');
    });
  });

  describe('holdEscrow', () => {
    it('holds escrow when balance is sufficient', async () => {
      const wallet = { balance: 1000, escrow_held: 0 };
      // getWallet + insert + update
      mockSupabase.from
        .mockReturnValueOnce(mockChain(wallet))
        .mockReturnValueOnce(mockChain(null))
        .mockReturnValueOnce(mockChain(null));

      await expect(walletService.holdEscrow('user-1', 200, 'order-1')).resolves.toBeUndefined();
    });

    it('rejects when balance is insufficient', async () => {
      mockSupabase.from.mockReturnValue(mockChain({ balance: 50, escrow_held: 0 }));
      await expect(walletService.holdEscrow('user-1', 200, 'order-1'))
        .rejects.toThrow('Insufficient balance for escrow');
    });
  });

  describe('releaseEscrow', () => {
    it('releases escrow from buyer to seller', async () => {
      mockSupabase.from
        .mockReturnValueOnce(mockChain({ balance: 0, escrow_held: 200 })) // buyer getWallet
        .mockReturnValueOnce(mockChain(null)) // buyer update
        .mockReturnValueOnce(mockChain({ balance: 100, escrow_held: 0 })) // seller getWallet
        .mockReturnValueOnce(mockChain(null)) // seller update
        .mockReturnValueOnce(mockChain(null)); // insert txs

      await expect(
        walletService.releaseEscrow('buyer-1', 'seller-1', 200, 'order-1')
      ).resolves.toBeUndefined();
    });
  });

  describe('deposit', () => {
    it('records a deposit transaction', async () => {
      const tx = { id: 'tx-dep', amount: 100, type: 'deposit' };
      const wallet = { balance: 500 };
      mockSupabase.from
        .mockReturnValueOnce(mockChain(tx))
        .mockReturnValueOnce(mockChain(wallet))
        .mockReturnValueOnce(mockChain(null));

      const result = await walletService.deposit('user-1', 100, 'ecocash');
      expect(result.id).toBe('tx-dep');
    });
  });
});
