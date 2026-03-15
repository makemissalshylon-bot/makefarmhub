/**
 * Admin Users Page Render Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils';

vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
  isSupabaseReady: () => false,
}));

vi.mock('../../services/supabase/adminService', () => ({
  adminService: {
    getAllUsers: vi.fn().mockResolvedValue([]),
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

import AdminUsers from '../../pages/Admin/AdminUsers';

describe('AdminUsers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the users management heading', () => {
    render(<AdminUsers />);
    expect(screen.getByText(/user management/i)).toBeInTheDocument();
  });

  it('renders search input', () => {
    render(<AdminUsers />);
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('renders role filter options', () => {
    render(<AdminUsers />);
    expect(screen.getByText('All Roles')).toBeInTheDocument();
    expect(screen.getByText('Farmers')).toBeInTheDocument();
  });
});
