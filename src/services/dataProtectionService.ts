/**
 * Data Protection Service - Backup & Recovery
 * Automatically saves all progress and enables data recovery
 */

export interface BackupData {
  id: string;
  timestamp: Date;
  type: 'auto' | 'manual';
  data: {
    users?: any[];
    listings?: any[];
    orders?: any[];
    messages?: any[];
    settings?: any;
    analytics?: any;
  };
  size: number;
  compressed: boolean;
}

export interface RecoveryPoint {
  id: string;
  timestamp: Date;
  description: string;
  dataKeys: string[];
}

class DataProtectionService {
  private backupInterval: number = 5 * 60 * 1000; // 5 minutes
  private maxBackups: number = 50;
  private autoBackupEnabled: boolean = true;
  private backupTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.initializeAutoBackup();
    this.loadBackupSettings();
  }

  /**
   * Initialize automatic backup system
   */
  initializeAutoBackup(): void {
    if (this.autoBackupEnabled) {
      this.startAutoBackup();
    }

    // Save data before page unload
    window.addEventListener('beforeunload', () => {
      this.createBackup('auto', 'Before page unload');
    });

    // Save data periodically when tab is visible
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        this.createBackup('auto', 'Tab became visible');
      }
    });
  }

  /**
   * Start automatic backup
   */
  startAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
    }

    this.backupTimer = setInterval(() => {
      this.createBackup('auto', 'Scheduled auto-backup');
    }, this.backupInterval);

  }

  /**
   * Stop automatic backup
   */
  stopAutoBackup(): void {
    if (this.backupTimer) {
      clearInterval(this.backupTimer);
      this.backupTimer = null;
    }
  }

  /**
   * Create backup of all data
   */
  createBackup(type: 'auto' | 'manual' = 'manual', description?: string): BackupData {
    const backup: BackupData = {
      id: this.generateBackupId(),
      timestamp: new Date(),
      type,
      data: this.collectAllData(),
      size: 0,
      compressed: false,
    };

    // Calculate size
    const dataString = JSON.stringify(backup.data);
    backup.size = new Blob([dataString]).size;

    // Save backup
    this.saveBackup(backup);

    // Create recovery point
    this.createRecoveryPoint(backup.id, description || `${type} backup`);

    // Clean old backups
    this.cleanOldBackups();


    return backup;
  }

  /**
   * Collect all data from localStorage
   */
  private collectAllData(): BackupData['data'] {
    const data: BackupData['data'] = {};

    // Collect all localStorage data
    const keys = [
      'auth_user',
      'app_listings',
      'app_orders',
      'app_messages',
      'app_notifications',
      'user_settings',
      'recent_searches',
      'saved_searches',
      'user_behavior_view',
      'user_behavior_search',
      'notification_preferences',
      'payment_methods',
      'analytics_events',
      'security_logs',
    ];

    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          data[key as keyof BackupData['data']] = JSON.parse(value);
        } catch {
          // Store as string if not JSON
          data[key as keyof BackupData['data']] = value;
        }
      }
    });

    return data;
  }

  /**
   * Save backup to localStorage
   */
  private saveBackup(backup: BackupData): void {
    try {
      const backups = this.getAllBackups();
      backups.push(backup);

      // Keep only last maxBackups
      const trimmed = backups.slice(-this.maxBackups);

      localStorage.setItem('data_backups', JSON.stringify(trimmed));
    } catch (error) {
      console.error('Failed to save backup:', error);
      // Try to save to IndexedDB as fallback
      this.saveToIndexedDB(backup);
    }
  }

  /**
   * Get all backups
   */
  getAllBackups(): BackupData[] {
    try {
      const stored = localStorage.getItem('data_backups');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load backups:', error);
    }
    return [];
  }

  /**
   * Restore from backup
   */
  restoreFromBackup(backupId: string): boolean {
    const backups = this.getAllBackups();
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      console.error('Backup not found:', backupId);
      return false;
    }

    try {
      // Restore all data
      Object.entries(backup.data).forEach(([key, value]) => {
        if (value !== undefined) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });

      
      // Create recovery point
      this.createRecoveryPoint(
        this.generateBackupId(),
        `Restored from backup ${backupId}`
      );

      return true;
    } catch (error) {
      console.error('Failed to restore backup:', error);
      return false;
    }
  }

  /**
   * Delete backup
   */
  deleteBackup(backupId: string): void {
    const backups = this.getAllBackups();
    const filtered = backups.filter(b => b.id !== backupId);
    localStorage.setItem('data_backups', JSON.stringify(filtered));
  }

  /**
   * Export backup to file
   */
  exportBackup(backupId: string): void {
    const backups = this.getAllBackups();
    const backup = backups.find(b => b.id === backupId);

    if (!backup) {
      console.error('Backup not found:', backupId);
      return;
    }

    const dataStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `makefarmhub_backup_${backup.id}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

  }

  /**
   * Import backup from file
   */
  async importBackup(file: File): Promise<boolean> {
    try {
      const text = await file.text();
      const backup: BackupData = JSON.parse(text);

      // Validate backup structure
      if (!backup.id || !backup.data) {
        throw new Error('Invalid backup file');
      }

      // Save imported backup
      this.saveBackup(backup);

      return true;
    } catch (error) {
      console.error('Failed to import backup:', error);
      return false;
    }
  }

  /**
   * Create recovery point
   */
  createRecoveryPoint(backupId: string, description: string): void {
    const recoveryPoint: RecoveryPoint = {
      id: this.generateBackupId(),
      timestamp: new Date(),
      description,
      dataKeys: Object.keys(this.collectAllData()),
    };

    const points = this.getRecoveryPoints();
    points.push(recoveryPoint);

    // Keep only last 20 recovery points
    const trimmed = points.slice(-20);
    localStorage.setItem('recovery_points', JSON.stringify(trimmed));
  }

  /**
   * Get recovery points
   */
  getRecoveryPoints(): RecoveryPoint[] {
    try {
      const stored = localStorage.getItem('recovery_points');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load recovery points:', error);
    }
    return [];
  }

  /**
   * Clean old backups
   */
  private cleanOldBackups(): void {
    const backups = this.getAllBackups();
    
    if (backups.length > this.maxBackups) {
      const toKeep = backups.slice(-this.maxBackups);
      localStorage.setItem('data_backups', JSON.stringify(toKeep));
    }
  }

  /**
   * Save to IndexedDB as fallback
   */
  private async saveToIndexedDB(backup: BackupData): Promise<void> {
    try {
      const db = await this.openIndexedDB();
      const transaction = db.transaction(['backups'], 'readwrite');
      const store = transaction.objectStore('backups');
      store.add(backup);
    } catch (error) {
      console.error('Failed to save to IndexedDB:', error);
    }
  }

  /**
   * Open IndexedDB
   */
  private openIndexedDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('MakeFarmHubBackups', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('backups')) {
          db.createObjectStore('backups', { keyPath: 'id' });
        }
      };
    });
  }

  /**
   * Generate backup ID
   */
  private generateBackupId(): string {
    return `backup_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format bytes to human readable
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Load backup settings
   */
  private loadBackupSettings(): void {
    try {
      const stored = localStorage.getItem('backup_settings');
      if (stored) {
        const settings = JSON.parse(stored);
        this.autoBackupEnabled = settings.autoBackupEnabled ?? true;
        this.backupInterval = settings.backupInterval ?? 5 * 60 * 1000;
        this.maxBackups = settings.maxBackups ?? 50;
      }
    } catch (error) {
      console.error('Failed to load backup settings');
    }
  }

  /**
   * Save backup settings
   */
  saveBackupSettings(settings: {
    autoBackupEnabled?: boolean;
    backupInterval?: number;
    maxBackups?: number;
  }): void {
    if (settings.autoBackupEnabled !== undefined) {
      this.autoBackupEnabled = settings.autoBackupEnabled;
      if (this.autoBackupEnabled) {
        this.startAutoBackup();
      } else {
        this.stopAutoBackup();
      }
    }

    if (settings.backupInterval !== undefined) {
      this.backupInterval = settings.backupInterval;
      if (this.autoBackupEnabled) {
        this.startAutoBackup();
      }
    }

    if (settings.maxBackups !== undefined) {
      this.maxBackups = settings.maxBackups;
    }

    localStorage.setItem('backup_settings', JSON.stringify({
      autoBackupEnabled: this.autoBackupEnabled,
      backupInterval: this.backupInterval,
      maxBackups: this.maxBackups,
    }));
  }

  /**
   * Get backup statistics
   */
  getBackupStats(): {
    totalBackups: number;
    totalSize: number;
    oldestBackup?: Date;
    newestBackup?: Date;
    autoBackupEnabled: boolean;
  } {
    const backups = this.getAllBackups();
    const totalSize = backups.reduce((sum, b) => sum + b.size, 0);

    return {
      totalBackups: backups.length,
      totalSize,
      oldestBackup: backups.length > 0 ? backups[0].timestamp : undefined,
      newestBackup: backups.length > 0 ? backups[backups.length - 1].timestamp : undefined,
      autoBackupEnabled: this.autoBackupEnabled,
    };
  }

  /**
   * Verify backup integrity
   */
  verifyBackup(backupId: string): { valid: boolean; errors: string[] } {
    const backups = this.getAllBackups();
    const backup = backups.find(b => b.id === backupId);
    const errors: string[] = [];

    if (!backup) {
      errors.push('Backup not found');
      return { valid: false, errors };
    }

    if (!backup.data || typeof backup.data !== 'object') {
      errors.push('Invalid backup data structure');
    }

    if (!backup.timestamp || !(backup.timestamp instanceof Date)) {
      errors.push('Invalid timestamp');
    }

    return { valid: errors.length === 0, errors };
  }
}

export const dataProtectionService = new DataProtectionService();

// Auto-initialize
if (typeof window !== 'undefined') {
}

export default dataProtectionService;
