// Script to reset the backend cache
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function resetCache() {
  console.log('Resetting backend cache...');
  
  try {
    const response = await fetch(`${API_BASE}/api/cache/reset`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    if (!response.ok) {
      console.error('Cache reset failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Cache reset result:', data);
    
    if (data.ok) {
      console.log('✅ Cache successfully reset');
    } else {
      console.log('❌ Cache reset failed:', data.error);
    }
  } catch (error) {
    console.error('Cache reset failed with error:', error);
  }
}

// Run the cache reset
resetCache();