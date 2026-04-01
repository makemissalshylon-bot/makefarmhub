import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AppDataProvider, useAppData } from './AppDataContext';

// Mock all Supabase-related modules
vi.mock('../lib/supabase', () => ({
  supabase: {
    channel: vi.fn().mockReturnValue({
      on: vi.fn().mockReturnThis(),
      subscribe: vi.fn().mockReturnThis(),
    }),
    removeChannel: vi.fn(),
  },
  isSupabaseReady: vi.fn().mockReturnValue(false),
}));

vi.mock('../services/supabase/listingService', () => ({
  listingService: { getAll: vi.fn(), create: vi.fn(), delete: vi.fn(), update: vi.fn() },
}));
vi.mock('../services/supabase/orderService', () => ({
  orderService: { getAll: vi.fn(), create: vi.fn(), updateStatus: vi.fn() },
}));
vi.mock('../services/supabase/messageService', () => ({
  messageService: { getConversations: vi.fn(), sendMessage: vi.fn() },
}));
vi.mock('../services/supabase/walletService', () => ({
  walletService: { getWallet: vi.fn(), getTransactions: vi.fn(), deposit: vi.fn(), withdraw: vi.fn(), releaseEscrow: vi.fn() },
}));
vi.mock('../services/supabase/notificationService', () => ({
  notificationService: { getAll: vi.fn(), create: vi.fn(), markAsRead: vi.fn(), markAllAsRead: vi.fn(), delete: vi.fn(), deleteAll: vi.fn() },
}));
vi.mock('../services/supabase/transportService', () => ({
  transportService: { getVehicles: vi.fn(), getTransportRequests: vi.fn(), createTransportRequest: vi.fn(), updateTransportRequest: vi.fn() },
}));
vi.mock('../services/supabase/reviewService', () => ({
  reviewService: { create: vi.fn() },
}));

// Mock AuthContext — provide a fake authenticated user
// Note: vi.mock is hoisted, so we must inline the data directly
vi.mock('./AuthContext', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user-1',
      name: 'Test Farmer',
      email: 'test@farm.com',
      phone: '+263 77 000 0000',
      role: 'farmer' as const,
      avatar: 'https://example.com/avatar.jpg',
      location: 'Harare, Zimbabwe',
      verified: true,
      createdAt: '2024-01-01',
    },
  }),
}));

// Mock AddressBook type import
vi.mock('../components/Address/AddressBook', () => ({}));

// Real localStorage mock
function createLocalStorageMock() {
  const store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { Object.keys(store).forEach(k => delete store[k]); }),
    get length() { return Object.keys(store).length; },
    key: vi.fn((i: number) => Object.keys(store)[i] ?? null),
    _store: store,
  };
}

let localStorageMock: ReturnType<typeof createLocalStorageMock>;

beforeEach(() => {
  localStorageMock = createLocalStorageMock();
  Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  vi.clearAllMocks();
});

function wrapper({ children }: { children: ReactNode }) {
  return <AppDataProvider>{children}</AppDataProvider>;
}

describe('AppDataContext', () => {
  // ==================
  // ORDERS
  // ==================
  describe('Orders', () => {
    it('starts with empty orders', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });
      expect(result.current.orders).toEqual([]);
    });

    it('createOrder adds an order and returns an ID', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      let orderId: string = '';
      act(() => {
        orderId = result.current.createOrder({
          listingId: 'l1',
          listingTitle: 'Tomatoes',
          listingImage: 'img.jpg',
          buyerId: 'b1',
          buyerName: 'Buyer',
          sellerId: 's1',
          sellerName: 'Seller',
          quantity: 10,
          unitPrice: 5,
          totalPrice: 50,
          escrowAmount: 50,
          status: 'pending',
          deliveryAddress: '123 St',
          paymentMethod: 'card',
        } as any);
      });

      expect(orderId).toMatch(/^order-/);
      expect(result.current.orders).toHaveLength(1);
      expect(result.current.orders[0].listingTitle).toBe('Tomatoes');
    });

    it('updateOrderStatus changes an order status', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      let orderId: string = '';
      act(() => {
        orderId = result.current.createOrder({
          listingId: 'l1', listingTitle: 'X', listingImage: '', buyerId: 'b1',
          buyerName: 'B', sellerId: 's1', sellerName: 'S', quantity: 1,
          unitPrice: 10, totalPrice: 10, escrowAmount: 10, status: 'pending',
          deliveryAddress: '', paymentMethod: 'card',
        } as any);
      });

      act(() => { result.current.updateOrderStatus(orderId, 'accepted'); });
      expect(result.current.orders[0].status).toBe('accepted');
    });
  });

  // ==================
  // NOTIFICATIONS
  // ==================
  describe('Notifications', () => {
    it('starts with empty notifications', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });
      expect(result.current.notifications).toEqual([]);
    });

    it('createNotification adds a notification', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.createNotification({
          type: 'info',
          title: 'Test',
          message: 'Hello world',
        });
      });

      expect(result.current.notifications).toHaveLength(1);
      expect(result.current.notifications[0].title).toBe('Test');
      expect(result.current.notifications[0].read).toBe(false);
    });

    it('markNotificationRead marks a single notification', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.createNotification({ type: 'info', title: 'N1', message: 'M1' });
      });

      const id = result.current.notifications[0].id;
      act(() => { result.current.markNotificationRead(id); });
      expect(result.current.notifications[0].read).toBe(true);
    });

    it('markAllNotificationsRead marks all', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.createNotification({ type: 'info', title: 'N1', message: 'M1' });
        result.current.createNotification({ type: 'warning', title: 'N2', message: 'M2' });
      });

      act(() => { result.current.markAllNotificationsRead(); });
      expect(result.current.notifications.every(n => n.read)).toBe(true);
    });

    it('deleteNotification removes a notification', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.createNotification({ type: 'info', title: 'N1', message: 'M1' });
      });

      const id = result.current.notifications[0].id;
      act(() => { result.current.deleteNotification(id); });
      expect(result.current.notifications).toHaveLength(0);
    });

    it('clearAllNotifications empties the list', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.createNotification({ type: 'info', title: 'N1', message: 'M1' });
        result.current.createNotification({ type: 'info', title: 'N2', message: 'M2' });
      });

      act(() => { result.current.clearAllNotifications(); });
      expect(result.current.notifications).toHaveLength(0);
    });
  });

  // ==================
  // WALLET
  // ==================
  describe('Wallet', () => {
    it('starts with zero balance', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });
      expect(result.current.walletBalance).toBe(0);
      expect(result.current.escrowBalance).toBe(0);
    });

    it('addFunds increases balance and creates transaction', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => { result.current.addFunds(500, 'EcoCash'); });

      expect(result.current.walletBalance).toBe(500);
      expect(result.current.walletTransactions).toHaveLength(1);
      expect(result.current.walletTransactions[0].type).toBe('deposit');
      expect(result.current.walletTransactions[0].amount).toBe(500);
    });

    it('withdrawFunds decreases balance when sufficient', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => { result.current.addFunds(1000, 'Card'); });
      act(() => { result.current.withdrawFunds(400, 'EcoCash'); });

      expect(result.current.walletBalance).toBe(600);
      expect(result.current.walletTransactions).toHaveLength(2);
    });

    it('withdrawFunds does nothing when insufficient balance', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => { result.current.withdrawFunds(100, 'EcoCash'); });

      expect(result.current.walletBalance).toBe(0);
      expect(result.current.walletTransactions).toHaveLength(0);
    });
  });

  // ==================
  // LISTINGS
  // ==================
  describe('Listings', () => {
    it('starts with empty listings', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });
      expect(result.current.listings).toEqual([]);
    });

    it('addListing adds a listing', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.addListing({
          sellerId: 's1', sellerName: 'S', sellerRating: 5, sellerVerified: true,
          title: 'Maize', description: 'Fresh maize', category: 'crops',
          subcategory: 'Grains', price: 20, unit: 'kg', quantity: 100,
          location: 'Harare', images: [], status: 'active', featured: false,
          createdAt: '2024-01-01', views: 0,
        } as any);
      });

      expect(result.current.listings).toHaveLength(1);
      expect(result.current.listings[0].title).toBe('Maize');
    });

    it('deleteListing removes a listing', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.addListing({
          sellerId: 's1', sellerName: 'S', sellerRating: 5, sellerVerified: true,
          title: 'Maize', description: 'Fresh', category: 'crops', subcategory: 'Grains',
          price: 20, unit: 'kg', quantity: 100, location: 'Harare', images: [],
          status: 'active', featured: false, createdAt: '2024-01-01', views: 0,
        } as any);
      });

      const id = result.current.listings[0].id;
      act(() => { result.current.deleteListing(id); });
      expect(result.current.listings).toHaveLength(0);
    });

    it('updateListingStatus changes listing status', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.addListing({
          sellerId: 's1', sellerName: 'S', sellerRating: 5, sellerVerified: true,
          title: 'Goat', description: 'Healthy goat', category: 'livestock',
          subcategory: 'Goats', price: 200, unit: 'each', quantity: 5,
          location: 'Bulawayo', images: [], status: 'active', featured: false,
          createdAt: '2024-01-01', views: 0,
        } as any);
      });

      const id = result.current.listings[0].id;
      act(() => { result.current.updateListingStatus(id, 'sold'); });
      expect(result.current.listings[0].status).toBe('sold');
    });
  });

  // ==================
  // FAVORITES
  // ==================
  describe('Favorites', () => {
    it('starts with empty favorites', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });
      expect(result.current.favorites).toEqual([]);
    });

    it('toggleFavorite adds and removes', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => { result.current.toggleFavorite('listing-1'); });
      expect(result.current.isFavorite('listing-1')).toBe(true);

      act(() => { result.current.toggleFavorite('listing-1'); });
      expect(result.current.isFavorite('listing-1')).toBe(false);
    });

    it('persists favorites to localStorage', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => { result.current.toggleFavorite('listing-1'); });
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        'makefarmhub_favorites',
        JSON.stringify(['listing-1']),
      );
    });
  });

  // ==================
  // ADDRESSES
  // ==================
  describe('Addresses', () => {
    it('starts with empty addresses', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });
      expect(result.current.addresses).toEqual([]);
    });

    it('addAddress creates an address', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.addAddress({
          label: 'Home',
          fullAddress: '123 Farm Road',
          city: 'Harare',
          province: 'Harare',
          isDefault: true,
        } as any);
      });

      expect(result.current.addresses).toHaveLength(1);
      expect(result.current.addresses[0].label).toBe('Home');
    });

    it('deleteAddress removes an address', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.addAddress({ label: 'Work', fullAddress: '456 St', city: 'Bulawayo', province: 'Bulawayo', isDefault: false } as any);
      });

      const id = result.current.addresses[0].id;
      act(() => { result.current.deleteAddress(id); });
      expect(result.current.addresses).toHaveLength(0);
    });

    it('setDefaultAddress marks one as default', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => {
        result.current.addAddress({ label: 'A', fullAddress: '1', city: 'H', province: 'H', isDefault: false } as any);
      });
      act(() => {
        result.current.addAddress({ label: 'B', fullAddress: '2', city: 'H', province: 'H', isDefault: false } as any);
      });

      const idA = result.current.addresses[0].id;
      const idB = result.current.addresses[1].id;
      act(() => { result.current.setDefaultAddress(idB); });
      expect(result.current.addresses.find(a => a.id === idB)?.isDefault).toBe(true);
      expect(result.current.addresses.find(a => a.id === idA)?.isDefault).toBe(false);
    });
  });

  // ==================
  // MESSAGES
  // ==================
  describe('Messages', () => {
    it('sendMessage adds a message to the conversation', () => {
      const { result } = renderHook(() => useAppData(), { wrapper });

      act(() => { result.current.sendMessage('conv-1', 'Hello!'); });

      expect(result.current.messages['conv-1']).toHaveLength(1);
      expect(result.current.messages['conv-1'][0].content).toBe('Hello!');
      expect(result.current.messages['conv-1'][0].senderName).toBe('Test Farmer');
    });
  });

  // ==================
  // CONTEXT GUARD
  // ==================
  it('throws when useAppData is used outside AppDataProvider', () => {
    expect(() => {
      renderHook(() => useAppData());
    }).toThrow('useAppData must be used within an AppDataProvider');
  });
});
