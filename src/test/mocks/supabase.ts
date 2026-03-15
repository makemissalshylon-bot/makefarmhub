/**
 * Supabase Mock - for unit testing services
 */

import { vi } from 'vitest';

// Chainable query builder mock
function createQueryBuilder(resolvedData: any = [], resolvedError: any = null) {
  const builder: any = {
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: Array.isArray(resolvedData) ? resolvedData[0] : resolvedData, error: resolvedError }),
    then: undefined as any,
  };

  // Make the builder itself thenable (awaitable)
  const resultPromise = Promise.resolve({ data: resolvedData, error: resolvedError });
  builder.then = resultPromise.then.bind(resultPromise);

  return builder;
}

export function createMockSupabase(defaultData: any = [], defaultError: any = null) {
  const queryBuilder = createQueryBuilder(defaultData, defaultError);

  const mockSupabase = {
    from: vi.fn().mockReturnValue(queryBuilder),
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    auth: {
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signUp: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: vi.fn().mockResolvedValue({ error: null }),
        getPublicUrl: vi.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/image.jpg' } }),
      }),
    },
    _queryBuilder: queryBuilder,
  };

  return mockSupabase;
}
