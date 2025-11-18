/**
 * Test script to verify login error handling
 * This tests the login process with a non-existent user
 */

async function testLoginError() {
  console.log('Testing login error handling...');
  
  // Test with a non-existent user
  const testEmail = 'nonexistent@example.com';
  
  console.log(`\n--- Testing login for: ${testEmail} ---`);
  
  try {
    // Step 1: Check if user exists and is confirmed using verify-email endpoint
    console.log('Step 1: Verifying email...');
    const verifyResponse = await fetch('http://localhost:3001/api/auth/verify-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    console.log(`Verify email Status: ${verifyResponse.status}`);
    
    if (verifyResponse.ok) {
      const verifyData = await verifyResponse.json();
      console.log('Verify email Response:', JSON.stringify(verifyData, null, 2));
      
      if (verifyData.exists && verifyData.confirmed) {
        console.log(`✓ User ${testEmail} is authenticated and confirmed`);
      } else {
        console.log(`⚠ User ${testEmail} is not authenticated or not confirmed`);
      }
    } else {
      console.log(`❌ Verify email failed with status: ${verifyResponse.status}`);
    }
  } catch (error) {
    console.error('Error during login error test:', error.message);
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testLoginError();