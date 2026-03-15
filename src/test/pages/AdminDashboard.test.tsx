/**
 * Admin Dashboard Render Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '../utils';

// Mock supabase and services before importing the component
vi.mock('../../lib/supabase', () => ({
  supabase: { from: vi.fn() },
  isSupabaseReady: () => false,
}));

vi.mock('../../services/supabase/adminService', () => ({
  adminService: {
    getStats: vi.fn().mockResolvedValue({}),
    getAllTransactions: vi.fn().mockResolvedValue([]),
    getAllDisputes: vi.fn().mockResolvedValue([]),
    getAllUsers: vi.fn().mockResolvedValue([]),
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

import AdminDashboard from '../../pages/Admin/AdminDashboard';

describe('AdminDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard heading', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/admin dashboard/i)).toBeInTheDocument();
  });

  it('renders stat cards with default zero values', () => {
    render(<AdminDashboard />);
    // Check that the stats section renders
    expect(screen.getByText(/total users/i)).toBeInTheDocument();
    expect(screen.getByText(/total orders/i)).toBeInTheDocument();
  });

  it('renders recent transactions section', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/recent transactions/i)).toBeInTheDocument();
  });

  it('renders top selling products section', () => {
    render(<AdminDashboard />);
    expect(screen.getByText(/top selling/i)).toBeInTheDocument();
  });
});
