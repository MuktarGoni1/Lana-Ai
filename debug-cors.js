async function debugCORS() {
  try {
    console.log('Testing CORS configuration for https://api.lanamind.com/api/structured-lesson');
    
    // Test preflight request
    const response = await fetch('https://api.lanamind.com/api/structured-lesson', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://lanamind.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:');
    for (const [key, value] of response.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    // Test actual request
    console.log('\nTesting actual POST request...');
    const postResponse = await fetch('https://api.lanamind.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Origin': 'https://lanamind.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'test',
        age: 10
      })
    });
    
    console.log('POST Response status:', postResponse.status);
    console.log('POST Response headers:');
    for (const [key, value] of postResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

debugCORS();