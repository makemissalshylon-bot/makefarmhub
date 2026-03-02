/**
 * PWA Service - Progressive Web App functionality
 */

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

class PWAService {
  private deferredPrompt: BeforeInstallPromptEvent | null = null;
  private isInstalled: boolean = false;
  private registration: ServiceWorkerRegistration | null = null;

  constructor() {
    this.checkInstallation();
    this.setupInstallPrompt();
  }

  /**
   * Register service worker
   */
  async registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
    if (!('serviceWorker' in navigator)) {
      console.log('[PWA] Service workers not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      this.registration = registration;

      console.log('[PWA] Service worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New service worker available
              this.onUpdateAvailable();
            }
          });
        }
      });

      return registration;
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
      return null;
    }
  }

  /**
   * Unregister service worker
   */
  async unregisterServiceWorker(): Promise<boolean> {
    if (!this.registration) return false;

    try {
      const success = await this.registration.unregister();
      console.log('[PWA] Service worker unregistered:', success);
      return success;
    } catch (error) {
      console.error('[PWA] Service worker unregistration failed:', error);
      return false;
    }
  }

  /**
   * Check if app is installed
   */
  private checkInstallation(): void {
    // Check if running as standalone PWA
    this.isInstalled = 
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true;

    console.log('[PWA] Is installed:', this.isInstalled);
  }

  /**
   * Setup install prompt listener
   */
  private setupInstallPrompt(): void {
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      this.deferredPrompt = e as BeforeInstallPromptEvent;
      console.log('[PWA] Install prompt ready');
    });

    window.addEventListener('appinstalled', () => {
      console.log('[PWA] App installed');
      this.isInstalled = true;
      this.deferredPrompt = null;
    });
  }

  /**
   * Show install prompt
   */
  async showInstallPrompt(): Promise<boolean> {
    if (!this.deferredPrompt) {
      console.log('[PWA] Install prompt not available');
      return false;
    }

    try {
      await this.deferredPrompt.prompt();
      const { outcome } = await this.deferredPrompt.userChoice;
      
      console.log('[PWA] Install prompt outcome:', outcome);
      
      this.deferredPrompt = null;
      return outcome === 'accepted';
    } catch (error) {
      console.error('[PWA] Install prompt error:', error);
      return false;
    }
  }

  /**
   * Check if install prompt is available
   */
  canInstall(): boolean {
    return !this.isInstalled && this.deferredPrompt !== null;
  }

  /**
   * Check if app is installed
   */
  isAppInstalled(): boolean {
    return this.isInstalled;
  }

  /**
   * Handle service worker update
   */
  private onUpdateAvailable(): void {
    console.log('[PWA] New version available');
    
    // Notify user
    const shouldUpdate = confirm(
      'A new version of MAKEFARMHUB is available. Would you like to update now?'
    );

    if (shouldUpdate) {
      this.updateServiceWorker();
    }
  }

  /**
   * Update service worker
   */
  async updateServiceWorker(): Promise<void> {
    if (!this.registration) return;

    const newWorker = this.registration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      
      // Reload page when new worker takes control
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        window.location.reload();
      });
    }
  }

  /**
   * Cache specific URLs
   */
  async cacheUrls(urls: string[]): Promise<void> {
    if (!this.registration) return;

    this.registration.active?.postMessage({
      type: 'CACHE_URLS',
      urls,
    });
  }

  /**
   * Clear all caches
   */
  async clearCaches(): Promise<void> {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      console.log('[PWA] All caches cleared');
    } catch (error) {
      console.error('[PWA] Cache clear error:', error);
    }
  }

  /**
   * Get cache size
   */
  async getCacheSize(): Promise<number> {
    if (!('caches' in window)) return 0;

    try {
      const cacheNames = await caches.keys();
      let totalSize = 0;

      for (const name of cacheNames) {
        const cache = await caches.open(name);
        const keys = await cache.keys();
        
        for (const request of keys) {
          const response = await cache.match(request);
          if (response) {
            const blob = await response.blob();
            totalSize += blob.size;
          }
        }
      }

      return totalSize;
    } catch (error) {
      console.error('[PWA] Cache size calculation error:', error);
      return 0;
    }
  }

  /**
   * Request background sync
   */
  async requestBackgroundSync(tag: string = 'sync-data'): Promise<void> {
    if (!this.registration) return;

    try {
      await (this.registration as any).sync.register(tag);
      console.log('[PWA] Background sync registered:', tag);
    } catch (error) {
      console.error('[PWA] Background sync error:', error);
    }
  }

  /**
   * Share content (Web Share API)
   */
  async share(data: { title?: string; text?: string; url?: string }): Promise<boolean> {
    if (!('share' in navigator)) {
      console.log('[PWA] Web Share API not supported');
      return false;
    }

    try {
      await navigator.share(data);
      return true;
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        console.error('[PWA] Share error:', error);
      }
      return false;
    }
  }

  /**
   * Check if online
   */
  isOnline(): boolean {
    return navigator.onLine;
  }

  /**
   * Setup online/offline listeners
   */
  setupNetworkListeners(
    onOnline: () => void,
    onOffline: () => void
  ): () => void {
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }
}

// Singleton instance
export const pwaService = new PWAService();

export default pwaService;
