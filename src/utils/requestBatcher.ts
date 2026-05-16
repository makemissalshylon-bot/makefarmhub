/**
 * Request Batcher
 * Batches multiple API requests into single calls to reduce network overhead
 */

interface BatchRequest<T> {
  id: string;
  resolve: (value: T) => void;
  reject: (error: any) => void;
}

class RequestBatcher {
  private batches: Map<string, BatchRequest<any>[]> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private batchDelay: number = 50; // ms

  /**
   * Add request to batch
   */
  batch<T>(
    key: string,
    requestId: string,
    executor: (ids: string[]) => Promise<Map<string, T>>
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const batch = this.batches.get(key) || [];
      batch.push({ id: requestId, resolve, reject });
      this.batches.set(key, batch);

      // Clear existing timeout
      const existingTimeout = this.timeouts.get(key);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }

      // Set new timeout
      const timeout = setTimeout(() => {
        this.executeBatch(key, executor);
      }, this.batchDelay);
      
      this.timeouts.set(key, timeout);
    });
  }

  /**
   * Execute batched requests
   */
  private async executeBatch<T>(
    key: string,
    executor: (ids: string[]) => Promise<Map<string, T>>
  ): Promise<void> {
    const batch = this.batches.get(key);
    if (!batch || batch.length === 0) return;

    this.batches.delete(key);
    this.timeouts.delete(key);

    const ids = batch.map(req => req.id);

    try {
      const results = await executor(ids);

      batch.forEach(req => {
        const result = results.get(req.id);
        if (result !== undefined) {
          req.resolve(result);
        } else {
          req.reject(new Error(`No result for ID: ${req.id}`));
        }
      });
    } catch (error) {
      batch.forEach(req => req.reject(error));
    }
  }

  /**
   * Flush all pending batches immediately
   */
  async flush(): Promise<void> {
    const keys = Array.from(this.batches.keys());
    for (const key of keys) {
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
      }
    }
  }
}

export const requestBatcher = new RequestBatcher();

/**
 * Request Deduplication
 * Prevents duplicate in-flight requests
 */

class RequestDeduplicator {
  private inFlight: Map<string, Promise<any>> = new Map();

  /**
   * Deduplicate request by key
   */
  async dedupe<T>(key: string, executor: () => Promise<T>): Promise<T> {
    const existing = this.inFlight.get(key);
    if (existing) {
      return existing;
    }

    const promise = executor()
      .finally(() => {
        this.inFlight.delete(key);
      });

    this.inFlight.set(key, promise);
    return promise;
  }

  /**
   * Clear all in-flight requests
   */
  clear(): void {
    this.inFlight.clear();
  }

  /**
   * Check if request is in flight
   */
  has(key: string): boolean {
    return this.inFlight.has(key);
  }
}

export const requestDeduplicator = new RequestDeduplicator();

/**
 * Example usage:
 * 
 * // Batching
 * const user = await requestBatcher.batch('users', userId, async (ids) => {
 *   const users = await fetchMultipleUsers(ids);
 *   return new Map(users.map(u => [u.id, u]));
 * });
 * 
 * // Deduplication
 * const data = await requestDeduplicator.dedupe('listings', () => 
 *   listingService.getListings()
 * );
 */
