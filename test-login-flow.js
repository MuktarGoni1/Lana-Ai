/**
 * Test script to verify the complete login flow
 * This tests the same login process as used in the frontend
 */

async function testLoginFlow() {
  console.log('Testing complete login flow...');
  
  // Test with an existing user
  const testEmail = 'muktargoni1@gmail.com';
  
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
        
        // Step 2: Check user using the check-user endpoint (new approach)
        console.log('\nStep 2: Checking user with check-user endpoint...');
        const checkResponse = await fetch('http://localhost:3001/api/auth/check-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ email: testEmail }),
        });
        
        console.log(`Check user Status: ${checkResponse.status}`);
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          console.log('Check user Response:', JSON.stringify(checkData, null, 2));
          
          if (checkData.exists) {
            console.log(`✓ User ${testEmail} verified through check-user endpoint`);
            console.log('\n✅ Login flow completed successfully!');
          } else {
            console.log(`⚠ User not found through check-user endpoint`);
          }
        } else {
          console.log(`❌ Check user failed with status: ${checkResponse.status}`);
        }
      } else {
        console.log(`⚠ User ${testEmail} is not authenticated or not confirmed`);
      }
    } else {
      console.log(`❌ Verify email failed with status: ${verifyResponse.status}`);
    }
  } catch (error) {
    console.error('Error during login flow test:', error.message);
    console.error('Make sure the development server is running on port 3001');
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testLoginFlow();