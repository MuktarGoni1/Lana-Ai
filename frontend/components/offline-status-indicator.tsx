"use client";

import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, RotateCcw } from 'lucide-react';

// Extend ServiceWorkerRegistration to include the sync API
interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}

interface SyncManager {
  register(tag: string): Promise<void>;
}

export function OfflineStatusIndicator() {
  const [isOnline, setIsOnline] = useState(true);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check initial online status
    setIsOnline(navigator.onLine);
    
    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "Back Online",
        description: "Connection restored. Syncing pending data...",
      });
      
      // Try to sync pending data
      syncPendingData();
    };
    
    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "Offline Mode",
        description: "Working offline. Data will sync when connection is restored.",
        variant: "destructive",
      });
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Check for pending sync data
    checkPendingSync();
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);
  
  // Check for service worker messages
  useEffect(() => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      const handleMessage = (event: MessageEvent) => {
        if (event.data && event.data.type === 'DATA_SYNC_SUCCESS') {
          toast({
            title: "Sync Complete",
            description: event.data.message,
          });
        } else if (event.data && event.data.type === 'PENDING_SYNC_STATUS') {
          setHasPendingSync(event.data.hasPendingData);
        }
      };
      
      navigator.serviceWorker.addEventListener('message', handleMessage);
      
      return () => {
        navigator.serviceWorker.removeEventListener('message', handleMessage);
      };
    }
  }, [toast]);
  
  const checkPendingSync = () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CHECK_PENDING_SYNC' });
    }
  };
  
  const syncPendingData = () => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      navigator.serviceWorker.ready.then(registration => {
        // Use the properly typed interface for ServiceWorkerRegistration with sync API
        (registration as ServiceWorkerRegistrationWithSync).sync.register('sync-pending-data')
          .then(() => {
            console.log('[OfflineStatusIndicator] Background sync registered');
          })
          .catch((error: Error) => {
            console.error('[OfflineStatusIndicator] Background sync registration failed:', error);
            // Fallback to manual sync
            manualSync();
          });
      });
    } else {
      // Fallback for browsers that don't support background sync
      manualSync();
    }
  };
  
  const manualSync = () => {
    // Manually trigger sync by sending message to service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'MANUAL_SYNC' });
    }
  };
  
  if (isOnline && !hasPendingSync) {
    return null;
  }
  
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
        isOnline 
          ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
          : 'bg-red-500/10 text-red-500 border border-red-500/20'
      }`}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" />
            <span>Online</span>
            {hasPendingSync && (
              <>
                <span className="mx-1">•</span>
                <span>Pending sync</span>
                <button 
                  onClick={syncPendingData}
                  className="ml-1 p-1 rounded hover:bg-white/10 transition-colors"
                  aria-label="Sync now"
                >
                  <RotateCcw className="w-3 h-3" />
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" />
            <span>Offline</span>
          </>        )}
      </div>
    </div>
  );
}
