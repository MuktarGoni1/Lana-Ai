// Test script to verify authentication functionality
async function testAuth() {
  try {
    // Test authenticated user
    const response1 = await fetch('http://localhost:3001/api/verify-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'muktargoni1@gmail.com' })
    });
    
    const result1 = await response1.json();
    console.log('Authenticated user test:', result1);
    
    // Test unauthenticated user
    const response2 = await fetch('http://localhost:3001/api/verify-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'bukarabubakar@gmail.com' })
    });
    
    const result2 = await response2.json();
    console.log('Unauthenticated user test:', result2);
    
  } catch (error) {
    console.error('Test error:', error);
  }
}

testAuth();