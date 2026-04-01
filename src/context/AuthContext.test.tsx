import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Supabase module
vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null } }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn().mockResolvedValue({}),
      verifyOtp: vi.fn(),
    },
    from: vi.fn().mockReturnValue({
      select: vi.fn().mockReturnValue({
        or: vi.fn().mockReturnValue({
          maybeSingle: vi.fn().mockResolvedValue({ data: null }),
        }),
      }),
    }),
  },
  testSupabaseConnection: vi.fn().mockResolvedValue(false),
  isSupabaseReady: vi.fn().mockReturnValue(false),
}));

// Mock profile service
vi.mock('../services/supabase/profileService', () => ({
  profileService: {
    getProfile: vi.fn(),
    updateProfile: vi.fn().mockResolvedValue({}),
  },
}));

// Mock hash utilities — use identity hash for test simplicity
vi.mock('../utils/hash', () => ({
  hashPassword: vi.fn().mockImplementation(async (pw: string) => `hashed_${pw}`),
  verifyPassword: vi.fn().mockImplementation(async (pw: string, hash: string) => hash === `hashed_${pw}`),
}));

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
  return <AuthProvider>{children}</AuthProvider>;
}

describe('AuthContext', () => {
  it('starts unauthenticated with no stored user', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('restores user from localStorage on mount', async () => {
    const storedUser = {
      id: 'user-1',
      name: 'Test',
      email: 'test@test.com',
      phone: '+263 77 111 1111',
      role: 'farmer',
      location: 'Harare',
      verified: true,
      createdAt: '2024-01-01',
    };
    localStorageMock._store['makefarmhub_user'] = JSON.stringify(storedUser);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user?.name).toBe('Test');
  });

  it('loginWithPassword rejects admin email when VITE_ADMIN_PASSWORD is not set', async () => {
    // By default in test env, VITE_ADMIN_PASSWORD is empty so admin login is disabled
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.loginWithPassword('missal@makefarmhub.com', 'anypassword');
    });

    expect(loginResult.success).toBe(false);
    expect(loginResult.error).toBe('Invalid credentials');
  });

  it('loginWithPassword works with hashed localStorage users', async () => {
    const registeredUser = {
      id: 'user-2',
      name: 'Jane Farmer',
      email: 'jane@farm.com',
      phone: '+263 77 222 2222',
      role: 'farmer',
      location: 'Bulawayo',
      verified: true,
      createdAt: '2024-06-01',
      passwordHash: 'hashed_secret123', // matches mock hashPassword
    };
    localStorageMock._store['makefarmhub_registered_users'] = JSON.stringify([registeredUser]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.loginWithPassword('jane@farm.com', 'secret123');
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.user?.name).toBe('Jane Farmer');
    // Neither password nor hash should be on the user object
    expect((result.current.user as any)?.password).toBeUndefined();
    expect((result.current.user as any)?.passwordHash).toBeUndefined();
  });

  it('loginWithPassword still supports legacy plaintext passwords', async () => {
    const legacyUser = {
      id: 'user-3',
      name: 'Legacy User',
      email: 'legacy@farm.com',
      phone: '+263 77 333 3333',
      role: 'buyer',
      location: 'Mutare',
      verified: true,
      createdAt: '2024-01-01',
      password: 'oldpass', // no passwordHash — legacy format
    };
    localStorageMock._store['makefarmhub_registered_users'] = JSON.stringify([legacyUser]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.loginWithPassword('legacy@farm.com', 'oldpass');
    });

    expect(loginResult.success).toBe(true);
    expect(result.current.user?.name).toBe('Legacy User');
  });

  it('loginWithPassword fails with wrong password for hashed user', async () => {
    const registeredUser = {
      id: 'user-2',
      name: 'Jane Farmer',
      email: 'jane@farm.com',
      phone: '+263 77 222 2222',
      role: 'farmer',
      location: 'Bulawayo',
      verified: true,
      createdAt: '2024-06-01',
      passwordHash: 'hashed_secret123',
    };
    localStorageMock._store['makefarmhub_registered_users'] = JSON.stringify([registeredUser]);

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let loginResult: any;
    await act(async () => {
      loginResult = await result.current.loginWithPassword('jane@farm.com', 'wrong');
    });

    expect(loginResult.success).toBe(false);
  });

  it('logout clears user and localStorage', async () => {
    localStorageMock._store['makefarmhub_user'] = JSON.stringify({
      id: 'u1', name: 'X', email: 'x@x.com', phone: '123', role: 'buyer',
      location: 'Harare', verified: true, createdAt: '2024-01-01',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    act(() => { result.current.logout(); });

    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('makefarmhub_user');
  });

  it('switchRole changes the user role', async () => {
    localStorageMock._store['makefarmhub_user'] = JSON.stringify({
      id: 'u1', name: 'X', email: 'x@x.com', phone: '123', role: 'buyer',
      location: 'Harare', verified: true, createdAt: '2024-01-01',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user?.role).toBe('buyer'));

    act(() => { result.current.switchRole('farmer'); });
    expect(result.current.user?.role).toBe('farmer');
  });

  it('updateProfile merges partial updates', async () => {
    localStorageMock._store['makefarmhub_user'] = JSON.stringify({
      id: 'u1', name: 'Old Name', email: 'x@x.com', phone: '123', role: 'buyer',
      location: 'Harare', verified: true, createdAt: '2024-01-01',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => { result.current.updateProfile({ name: 'New Name', location: 'Bulawayo' }); });
    expect(result.current.user?.name).toBe('New Name');
    expect(result.current.user?.location).toBe('Bulawayo');
    expect(result.current.user?.email).toBe('x@x.com'); // unchanged
  });

  it('updateAvatar updates the avatar URL', async () => {
    localStorageMock._store['makefarmhub_user'] = JSON.stringify({
      id: 'u1', name: 'X', email: 'x@x.com', phone: '123', role: 'buyer',
      location: 'Harare', verified: true, createdAt: '2024-01-01',
    });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).not.toBeNull());

    act(() => { result.current.updateAvatar('https://example.com/new-avatar.jpg'); });
    expect(result.current.user?.avatar).toBe('https://example.com/new-avatar.jpg');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
  });
});
