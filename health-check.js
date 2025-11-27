/**
 * Simple health check for Lana AI backend
 */

async function checkHealth() {
  const url = 'https://lana-ai.onrender.com/health';
  
  try {
    console.log('Checking health endpoint:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Health Check Success!');
      console.log('Status:', result.status);
      if (result.service) {
        console.log('Service:', result.service);
      }
      if (result.error) {
        console.log('Error:', result.error);
      }
      return true;
    } else {
      console.log('❌ Health Check Failed:', response.status);
      const errorText = await response.text();
      console.log('Error Details:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return false;
  }
}

checkHealth().then(success => {
  console.log('\nHealth check ' + (success ? 'passed' : 'failed'));
});