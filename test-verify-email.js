const testVerifyEmail = async () => {
  try {
    console.log('Testing /api/auth/verify-email endpoint...');
    
    // Test with a sample email
    const response = await fetch('http://localhost:3001/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com'
      })
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', [...response.headers.entries()]);
    
    const data = await response.json();
    console.log('Response data:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
};

testVerifyEmail();