/**
 * Test script to access the new test-auth-list API endpoint
 * This tests the direct Supabase Auth admin API access
 */

async function testApiList() {
  console.log('Testing new test-auth-list API endpoint...');
  
  try {
    // Using the new endpoint we created
    const response = await fetch('http://localhost:3001/api/test-auth-list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
    console.error('Make sure the development server is running on port 3001');
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testApiList().catch(console.error);