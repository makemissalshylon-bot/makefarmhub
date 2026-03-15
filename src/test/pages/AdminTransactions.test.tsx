/**
 * Admin Transactions Page Render Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils';

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
  isSupabaseReady: () => false,
}));

vi.mock('../../services/supabase/adminService', () => ({
  adminService: {
    getAllTransactions: vi.fn().mockResolvedValue([]),
    getStats: vi.fn().mockResolvedValue({}),
  },
}));

vi.mock('../../context/AppDataContext', () => ({
  useAppData: () => ({
    orders: [],
    listings: [],
    escrowBalance: 0,
    walletBalance: 0,
    conversations: [],
    notifications: [],
    vehicles: [],
    transportRequests: [],
    addresses: [],
    refreshData: vi.fn(),
  }),
}));

import AdminTransactions from '../../pages/Admin/AdminTransactions';

describe('AdminTransactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the transactions heading', () => {
    render(<AdminTransactions />);
    expect(screen.getByText(/transactions/i)).toBeInTheDocument();
  });

  it('renders the page description', () => {
    render(<AdminTransactions />);
    expect(screen.getByText(/monitor all financial transactions/i)).toBeInTheDocument();
  });
});
