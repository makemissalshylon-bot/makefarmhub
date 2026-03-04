import { useState, useCallback, useEffect, useRef } from 'react';
import { crashProtectionService } from '../services/crashProtectionService';

/**
 * Safe useState hook that prevents crashes from state updates
 * Handles unmounted component updates and invalid state
 */
export function useSafeState<T>(initialValue: T): [T, (value: T | ((prev: T) => T)) => void] {
  const [state, setState] = useState<T>(initialValue);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const setSafeState = useCallback((value: T | ((prev: T) => T)) => {
    if (isMounted.current) {
      try {
        setState(value);
      } catch (error) {
        console.error('Safe state update error:', error);
      }
    }
  }, []);

  return [state, setSafeState];
}

/**
 * Safe useEffect that catches errors
 */
export function useSafeEffect(
  effect: () => void | (() => void),
  deps?: React.DependencyList
): void {
  useEffect(() => {
    try {
      const cleanup = effect();
      return () => {
        try {
          if (cleanup) cleanup();
        } catch (error) {
          console.error('Safe effect cleanup error:', error);
        }
      };
    } catch (error) {
      console.error('Safe effect error:', error);
    }
  }, deps);
}

/**
 * Safe async operation hook
 */
export function useSafeAsync<T>(
  asyncFn: () => Promise<T>,
  deps: React.DependencyList = []
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [data, setData] = useSafeState<T | null>(null);
  const [loading, setLoading] = useSafeState(true);
  const [error, setError] = useSafeState<Error | null>(null);
  const isMounted = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFn();
      if (isMounted.current) {
        setData(result);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as Error);
        console.error('Safe async error:', err);
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, deps);

  useEffect(() => {
    isMounted.current = true;
    execute();
    return () => {
      isMounted.current = false;
    };
  }, [execute]);

  return { data, loading, error, retry: execute };
}

/**
 * Safe localStorage hook
 */
export function useSafeLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void, () => void] {
  const [storedValue, setStoredValue] = useSafeState<T>(
    crashProtectionService.safeStorageGet(key, initialValue)
  );

  const setValue = useCallback((value: T) => {
    setStoredValue(value);
    crashProtectionService.safeStorageSet(key, value);
  }, [key]);

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to remove from localStorage:', error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Safe callback hook that catches errors
 */
export function useSafeCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  fallbackValue?: ReturnType<T>
): T {
  return useCallback((...args: Parameters<T>) => {
    try {
      return callback(...args);
    } catch (error) {
      console.error('Safe callback error:', error);
      return fallbackValue;
    }
  }, deps) as T;
}

/**
 * Safe fetch hook with retry logic
 */
export function useSafeFetch<T>(
  url: string,
  options?: RequestInit,
  retries: number = 3
): {
  data: T | null;
  loading: boolean;
  error: Error | null;
  retry: () => void;
} {
  const [data, setData] = useSafeState<T | null>(null);
  const [loading, setLoading] = useSafeState(true);
  const [error, setError] = useSafeState<Error | null>(null);
  const attemptRef = useRef(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    attemptRef.current = 0;

    const attemptFetch = async (): Promise<void> => {
      try {
        const response = await fetch(url, options);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setData(result);
      } catch (err) {
        attemptRef.current++;
        if (attemptRef.current < retries) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attemptRef.current));
          return attemptFetch();
        }
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    await attemptFetch();
  }, [url, options, retries]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, retry: fetchData };
}

export default {
  useSafeState,
  useSafeEffect,
  useSafeAsync,
  useSafeLocalStorage,
  useSafeCallback,
  useSafeFetch,
};
