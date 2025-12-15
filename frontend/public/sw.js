// Service Worker for offline capabilities
const CACHE_NAME = 'lana-ai-v1';
const urlsToCache = [
  '/',
  '/landing-page',
  '/login',
  '/register',
  '/homepage',
  '/term-plan',
  '/onboarding',
  '/_next/static/css/',
  '/_next/static/chunks/',
  '/favicon.ico'
];

// Install event - cache core assets
self.addEventListener('install', event => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Failed to cache assets:', err);
      })
  );
});

// Fetch event - serve cached content when offline
self.addEventListener('fetch', event => {
  // Only handle GET requests
  if (event.request.method !== 'GET') {
    return;
  }
  
  // Skip caching for API requests
  const url = new URL(event.request.url);
  if (url.pathname.startsWith('/api/') || url.pathname.startsWith('/_next/data/')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Return cached version if available
        if (response) {
          console.log('[Service Worker] Serving cached:', event.request.url);
          return response;
        }

        // Clone the request because it's a stream and can only be consumed once
        const fetchRequest = event.request.clone();

        // Try to fetch from network
        return fetch(fetchRequest)
          .then(response => {
            // Check if we received a valid response
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response because it's a stream and can only be consumed once
            const responseToCache = response.clone();

            // Cache the response for future use
            caches.open(CACHE_NAME)
              .then(cache => {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(err => {
            console.log('[Service Worker] Fetch failed, serving cached content:', err);
            // Return a fallback page for HTML requests
            if (event.request.headers.get('accept').includes('text/html')) {
              return caches.match('/landing-page');
            }
            return response;
          });
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('[Service Worker] Activating...');
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Handle sync events for pending data sync
self.addEventListener('sync', event => {
  if (event.tag === 'sync-pending-data') {
    console.log('[Service Worker] Background sync for pending data');
    event.waitUntil(syncPendingData());
  }
});

// Function to sync pending data when online
async function syncPendingData() {
  try {
    // Check if we're online
    if (!navigator.onLine) {
      console.log('[Service Worker] Still offline, deferring sync');
      return;
    }

    // Get pending data from IndexedDB
    const pendingData = await getPendingDataFromIndexedDB();
    if (!pendingData) {
      console.log('[Service Worker] No pending data to sync');
      return;
    }

    const { subjects, email } = pendingData;
    
    // Try to sync with backend
    const response = await fetch('/api/study-plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        subjects
      }),
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('[Service Worker] Pending data synced successfully');
      // Remove pending data from IndexedDB
      await removePendingDataFromIndexedDB();
      
      // Send a message to clients to update UI
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'DATA_SYNC_SUCCESS',
            message: 'Your study plan has been successfully synced.'
          });
        });
      });
    } else {
      console.error('[Service Worker] Failed to sync pending data:', result.message);
    }
  } catch (error) {
    console.error('[Service Worker] Error during sync:', error);
  }
}

// Listen for messages from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CHECK_PENDING_SYNC') {
    getPendingDataFromIndexedDB().then(pendingData => {
      event.source.postMessage({
        type: 'PENDING_SYNC_STATUS',
        hasPendingData: !!pendingData
      });
    });
  } else if (event.data && event.data.type === 'MANUAL_SYNC') {
    console.log('[Service Worker] Manual sync requested');
    syncPendingData();
  } else if (event.data && event.data.type === 'STORE_PENDING_DATA') {
    storePendingDataInIndexedDB(event.data.data).then(() => {
      console.log('[Service Worker] Pending data stored in IndexedDB');
    }).catch(error => {
      console.error('[Service Worker] Failed to store pending data:', error);
    });
  }
});

// IndexedDB helper functions
function openIndexedDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('LanaAI_DB', 1);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingData')) {
        db.createObjectStore('pendingData', { keyPath: 'id' });
      }
    };
  });
}

async function storePendingDataInIndexedDB(data) {
  const db = await openIndexedDB();
  const transaction = db.transaction(['pendingData'], 'readwrite');
  const store = transaction.objectStore('pendingData');
  return store.put({ id: 'study_plan_pending', ...data });
}

async function getPendingDataFromIndexedDB() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['pendingData'], 'readonly');
  const store = transaction.objectStore('pendingData');
  return new Promise((resolve, reject) => {
    const request = store.get('study_plan_pending');
    request.onsuccess = () => resolve(request.result ? request.result : null);
    request.onerror = () => reject(request.error);
  });
}

async function removePendingDataFromIndexedDB() {
  const db = await openIndexedDB();
  const transaction = db.transaction(['pendingData'], 'readwrite');
  const store = transaction.objectStore('pendingData');
  return store.delete('study_plan_pending');
}