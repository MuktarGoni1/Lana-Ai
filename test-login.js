/**
 * Test script to try the login functionality
 * This tests the same login flow as the frontend
 */

async function testLogin() {
  console.log('Testing login functionality...');
  
  // Test login with an existing user
  const testEmail = 'muktargoni1@gmail.com';
  
  console.log(`\n--- Testing login for: ${testEmail} ---`);
  
  try {
    // Using the same endpoint as the frontend for login
    const response = await fetch('http://localhost:3001/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    console.log(`Verify email Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Verify email Response:', JSON.stringify(data, null, 2));
      
      if (data.exists && data.confirmed) {
        console.log(`✓ User ${testEmail} is authenticated and confirmed`);
        console.log(`  User ID: ${data.userId}`);
      } else if (data.exists) {
        console.log(`⚠ User ${testEmail} exists but is not confirmed`);
      } else {
        console.log(`✗ User ${testEmail} not found`);
      }
    } else {
      const errorText = await response.text();
      console.log('Verify email Error response:', errorText);
    }
  } catch (error) {
    console.error('Verify email Fetch error:', error.message);
  }
  
  // Test login with a non-existent user
  const nonExistentEmail = 'nonexistent@example.com';
  
  console.log(`\n--- Testing login for: ${nonExistentEmail} ---`);
  
  try {
    // Using the same endpoint as the frontend for login
    const response = await fetch('http://localhost:3001/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: nonExistentEmail }),
    });
    
    console.log(`Verify email Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Verify email Response:', JSON.stringify(data, null, 2));
      
      if (data.exists && data.confirmed) {
        console.log(`✓ User ${nonExistentEmail} is authenticated and confirmed`);
      } else if (data.exists) {
        console.log(`⚠ User ${nonExistentEmail} exists but is not confirmed`);
      } else {
        console.log(`✗ User ${nonExistentEmail} not found`);
      }
    } else {
      const errorText = await response.text();
      console.log('Verify email Error response:', errorText);
    }
  } catch (error) {
    console.error('Verify email Fetch error:', error.message);
  }
  
  console.log('\n--- Login test completed ---');
}

// Run the test
testLogin().catch(console.error);