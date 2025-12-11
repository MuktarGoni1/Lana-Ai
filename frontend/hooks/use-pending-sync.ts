import { useEffect } from 'react';

interface PendingData {
  email: string;
  subjects: any[];
}

export function usePendingSync(pendingData: PendingData | null) {
  useEffect(() => {
    if (pendingData && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'STORE_PENDING_DATA',
        data: pendingData
      });
    }
  }, [pendingData]);
}