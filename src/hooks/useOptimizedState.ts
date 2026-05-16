/**
 * Optimized State Hooks
 * Performance-optimized useState alternatives
 */

import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Debounced state - updates only after delay
 */
export function useDebouncedState<T>(
  initialValue: T,
  delay: number = 300
): [T, T, (value: T) => void] {
  const [immediateValue, setImmediateValue] = useState<T>(initialValue);
  const [debouncedValue, setDebouncedValue] = useState<T>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const setValue = useCallback((value: T) => {
    setImmediateValue(value);
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
  }, [delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [immediateValue, debouncedValue, setValue];
}

/**
 * Throttled state - updates at most once per interval
 */
export function useThrottledState<T>(
  initialValue: T,
  interval: number = 300
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(initialValue);
  const lastUpdateRef = useRef<number>(0);
  const pendingRef = useRef<T | null>(null);

  const setThrottledValue = useCallback((newValue: T) => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateRef.current;

    if (timeSinceLastUpdate >= interval) {
      setValue(newValue);
      lastUpdateRef.current = now;
      pendingRef.current = null;
    } else {
      pendingRef.current = newValue;
      
      setTimeout(() => {
        if (pendingRef.current !== null) {
          setValue(pendingRef.current);
          lastUpdateRef.current = Date.now();
          pendingRef.current = null;
        }
      }, interval - timeSinceLastUpdate);
    }
  }, [interval]);

  return [value, setThrottledValue];
}

/**
 * Lazy state - only computes initial value when needed
 */
export function useLazyState<T>(
  initializer: () => T
): [T, (value: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState<T>(initializer);
  return [value, setValue];
}

/**
 * Previous value hook - keeps track of previous state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * Stable callback - never changes reference
 */
export function useStableCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = useRef(callback);
  
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);
  
  return useCallback(((...args) => callbackRef.current(...args)) as T, []);
}

/**
 * Update effect - runs on updates but not on mount
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: any[]) {
  const isFirstRender = useRef(true);
  
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    return effect();
  }, deps);
}

/**
 * Memoized array - prevents unnecessary re-renders from array deps
 */
export function useMemoizedArray<T>(array: T[]): T[] {
  const ref = useRef<T[]>(array);
  
  if (
    array.length !== ref.current.length ||
    array.some((item, index) => item !== ref.current[index])
  ) {
    ref.current = array;
  }
  
  return ref.current;
}

/**
 * Optimized form state
 */
export function useFormState<T extends Record<string, any>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<keyof T, boolean>>>({});

  const handleChange = useCallback(<K extends keyof T>(
    name: K,
    value: T[K]
  ) => {
    setValues(prev => ({ ...prev, [name]: value }));
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const handleBlur = useCallback(<K extends keyof T>(name: K) => {
    setTouched(prev => ({ ...prev, [name]: true }));
  }, []);

  const setError = useCallback(<K extends keyof T>(name: K, error: string) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearError = useCallback(<K extends keyof T>(name: K) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[name];
      return newErrors;
    });
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setError,
    clearError,
    reset,
  };
}
