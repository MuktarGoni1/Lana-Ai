import { supabase } from '@/lib/db';

export class DataSyncService {
  private static instance: DataSyncService;
  private syncInterval: NodeJS.Timeout | null = null;
  private isSyncing = false;

  private constructor() {
    // Start periodic sync when the service is initialized
    this.startPeriodicSync();
    
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        console.log('[DataSyncService] Network online, triggering sync');
        this.syncPendingData();
      });
    }
  }

  static getInstance(): DataSyncService {
    if (!DataSyncService.instance) {
      DataSyncService.instance = new DataSyncService();
    }
    return DataSyncService.instance;
  }

  private startPeriodicSync() {
    // Check for pending sync every 5 minutes
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        this.syncPendingData();
      }
    }, 5 * 60 * 1000); // 5 minutes
  }

  async syncPendingData(): Promise<void> {
    // Prevent multiple simultaneous sync operations
    if (this.isSyncing) {
      console.log('[DataSyncService] Sync already in progress, skipping');
      return;
    }

    this.isSyncing = true;
    try {
      console.log('[DataSyncService] Starting sync of pending data');

      // Check for pending study plan data
      const pendingStudyPlan = this.getPendingStudyPlan();
      if (pendingStudyPlan) {
        await this.syncStudyPlan(pendingStudyPlan);
      }

      // Check for other pending data types here if needed
      // ...

      console.log('[DataSyncService] Sync completed successfully');
    } catch (error) {
      console.error('[DataSyncService] Error during sync:', error);
    } finally {
      this.isSyncing = false;
    }
  }

  private getPendingStudyPlan(): { email: string; subjects: any[] } | null {
    try {
      if (typeof window === 'undefined') return null;
      
      const pendingData = localStorage.getItem('lana_study_plan_pending');
      if (!pendingData) return null;
      
      return JSON.parse(pendingData);
    } catch (error) {
      console.error('[DataSyncService] Error reading pending study plan:', error);
      return null;
    }
  }

  private async syncStudyPlan(pendingData: { email: string; subjects: any[] }): Promise<void> {
    try {
      console.log('[DataSyncService] Syncing study plan for:', pendingData.email);
      
      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: pendingData.email,
          subjects: pendingData.subjects
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('[DataSyncService] Study plan synced successfully');
        // Remove pending data after successful sync
        localStorage.removeItem('lana_study_plan_pending');
      } else {
        throw new Error(result.message || 'Failed to sync study plan');
      }
    } catch (error) {
      console.error('[DataSyncService] Error syncing study plan:', error);
      throw error;
    }
  }

  async queueStudyPlanForSync(email: string, subjects: any[]): Promise<void> {
    try {
      if (typeof window === 'undefined') return;
      
      const pendingData = {
        email,
        subjects,
        timestamp: Date.now()
      };
      
      localStorage.setItem('lana_study_plan_pending', JSON.stringify(pendingData));
      console.log('[DataSyncService] Study plan queued for sync');
    } catch (error) {
      console.error('[DataSyncService] Error queuing study plan for sync:', error);
    }
  }

  // Clean up resources
  destroy() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }
  }
}

// Export singleton instance
export const dataSyncService = DataSyncService.getInstance();