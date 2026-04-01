import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import { LanguageProvider, useLanguage } from './LanguageContext';

// Create a real localStorage mock with actual storage behavior
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
});

function wrapper({ children }: { children: ReactNode }) {
  return <LanguageProvider>{children}</LanguageProvider>;
}

describe('LanguageContext', () => {
  it('defaults to English language and USD currency', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('en');
    expect(result.current.currency).toBe('USD');
  });

  it('reads saved language from localStorage', () => {
    localStorageMock._store['mfh_language'] = 'sn';
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.language).toBe('sn');
  });

  it('reads saved currency from localStorage', () => {
    localStorageMock._store['mfh_currency'] = 'ZWL';
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.currency).toBe('ZWL');
  });

  it('setLanguage updates the language and persists', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => { result.current.setLanguage('nd'); });
    expect(result.current.language).toBe('nd');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mfh_language', 'nd');
  });

  it('setCurrency updates the currency and persists', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });

    act(() => { result.current.setCurrency('ZWL'); });
    expect(result.current.currency).toBe('ZWL');
    expect(localStorageMock.setItem).toHaveBeenCalledWith('mfh_currency', 'ZWL');
  });

  it('t() returns translated string for known key', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    // 'nav.home' is a known key in en translations
    expect(result.current.t('nav.home')).toBe('Home');
  });

  it('t() returns the key itself for unknown keys', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.t('this.key.does.not.exist')).toBe('this.key.does.not.exist');
  });

  it('formatPrice formats USD correctly', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    const formatted = result.current.formatPrice(100);
    expect(formatted).toBe('$100.00');
  });

  it('formatPrice converts and formats ZWL correctly', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    act(() => { result.current.setCurrency('ZWL'); });

    const formatted = result.current.formatPrice(1);
    // 1 USD * 28000 = ZWL28,000.00
    expect(formatted).toBe('ZWL28,000.00');
  });

  it('formatPrice handles zero', () => {
    const { result } = renderHook(() => useLanguage(), { wrapper });
    expect(result.current.formatPrice(0)).toBe('$0.00');
  });

  it('throws when useLanguage is used outside LanguageProvider', () => {
    expect(() => {
      renderHook(() => useLanguage());
    }).toThrow('useLanguage must be used within LanguageProvider');
  });
});
