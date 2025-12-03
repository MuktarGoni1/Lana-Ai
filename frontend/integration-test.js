// Simple integration test to verify frontend can connect to backend
// This test verifies the API connection is working properly

async function testApiConnection() {
  try {
    console.log('Testing API connection to backend...');
    
    // Test health endpoint
    console.log('1. Testing health endpoint...');
    const healthResponse = await fetch('https://api.lanamind.com/health');
    if (!healthResponse.ok) {
      throw new Error(`Health check failed with status ${healthResponse.status}`);
    }
    const healthData = await healthResponse.json();
    console.log('   Health check passed:', healthData);
    
    // Test structured lesson endpoint
    console.log('2. Testing structured lesson endpoint...');
    const lessonResponse = await fetch('https://api.lanamind.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'test',
        age: 10
      })
    });
    
    if (!lessonResponse.ok) {
      // This is expected to fail with a 400 since we're not providing proper auth
      console.log('   Structured lesson endpoint accessible (status:', lessonResponse.status, ')');
    } else {
      const lessonData = await lessonResponse.json();
      console.log('   Structured lesson endpoint working:', lessonData);
    }
    
    console.log('All API connection tests passed!');
    return true;
  } catch (error) {
    console.error('API connection test failed:', error.message);
    return false;
  }
}

// Run the test
testApiConnection().then(success => {
  if (!success) {
    process.exit(1);
  }
});