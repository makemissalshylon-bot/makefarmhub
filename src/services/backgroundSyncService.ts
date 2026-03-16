/**
 * Background Sync Service
 * Handles offline data synchronization for PWA
 */

interface SyncTask {
  id: string;
  type: 'message' | 'order' | 'listing' | 'profile';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
}

const SYNC_QUEUE_KEY = 'makefarmhub_sync_queue';

export const backgroundSyncService = {
  /**
   * Register background sync
   */
  async register(tag: string = 'sync-data'): Promise<void> {
    if (!('serviceWorker' in navigator) || !('SyncManager' in window)) {
      console.warn('Background Sync not supported');
      return;
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      await (registration as any).sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Failed to register background sync:', error);
    }
  },

  /**
   * Add task to sync queue
   */
  async addToQueue(task: Omit<SyncTask, 'id' | 'timestamp'>): Promise<void> {
    const queue = this.getQueue();
    const newTask: SyncTask = {
      ...task,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
    };

    queue.push(newTask);
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(queue));

    // Try to sync immediately if online
    if (navigator.onLine) {
      await this.processSyncQueue();
    } else {
      // Register for background sync when connection is restored
      await this.register('sync-offline-data');
    }
  },

  /**
   * Get sync queue from localStorage
   */
  getQueue(): SyncTask[] {
    try {
      const queue = localStorage.getItem(SYNC_QUEUE_KEY);
      return queue ? JSON.parse(queue) : [];
    } catch (error) {
      console.error('Failed to get sync queue:', error);
      return [];
    }
  },

  /**
   * Process all pending sync tasks
   */
  async processSyncQueue(): Promise<void> {
    const queue = this.getQueue();
    
    if (queue.length === 0) return;

    const failedTasks: SyncTask[] = [];

    for (const task of queue) {
      try {
        await this.processTask(task);
      } catch (error) {
        console.error('Failed to process sync task:', task, error);
        failedTasks.push(task);
      }
    }

    // Update queue with failed tasks only
    localStorage.setItem(SYNC_QUEUE_KEY, JSON.stringify(failedTasks));

    if (failedTasks.length === 0) {
      console.log('All sync tasks completed successfully');
    } else {
      console.warn(`${failedTasks.length} sync tasks failed and will retry later`);
    }
  },

  /**
   * Process a single sync task
   */
  async processTask(task: SyncTask): Promise<void> {
    const endpoint = this.getEndpoint(task.type, task.action);
    const method = this.getMethod(task.action);

    const response = await fetch(endpoint, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task.data),
    });

    if (!response.ok) {
      throw new Error(`Failed to sync ${task.type}: ${response.statusText}`);
    }

    console.log(`Synced ${task.type} ${task.action}:`, task.id);
  },

  /**
   * Get API endpoint for task type and action
   */
  getEndpoint(type: string, action: string): string {
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    
    switch (type) {
      case 'message':
        return `${baseUrl}/messages`;
      case 'order':
        return action === 'create' ? `${baseUrl}/orders` : `${baseUrl}/orders/${action}`;
      case 'listing':
        return action === 'create' ? `${baseUrl}/listings` : `${baseUrl}/listings/${action}`;
      case 'profile':
        return `${baseUrl}/profile`;
      default:
        throw new Error(`Unknown sync task type: ${type}`);
    }
  },

  /**
   * Get HTTP method for action
   */
  getMethod(action: string): string {
    switch (action) {
      case 'create':
        return 'POST';
      case 'update':
        return 'PUT';
      case 'delete':
        return 'DELETE';
      default:
        return 'POST';
    }
  },

  /**
   * Clear sync queue
   */
  clearQueue(): void {
    localStorage.removeItem(SYNC_QUEUE_KEY);
  },

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.getQueue().length;
  },

  /**
   * Check if background sync is supported
   */
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'SyncManager' in window;
  },
};

// Auto-process queue when coming online
window.addEventListener('online', () => {
  console.log('Connection restored, processing sync queue...');
  backgroundSyncService.processSyncQueue();
});
