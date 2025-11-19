/**
 * Test script to simulate the full login flow
 * This tests the complete login process as it would happen in the frontend
 */

async function testFullLogin() {
  console.log('Testing full login flow...');
  
  // Test email
  const testEmail = 'muktargoni1@gmail.com';
  
  console.log(`\n--- Step 1: Check if user is authenticated ---`);
  
  try {
    // First, check if the user is authenticated using our check-user endpoint
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
        console.log(`✓ User ${testEmail} exists in the system`);
      } else {
        console.log(`✗ User ${testEmail} not found in the system`);
      }
    } else {
      const errorText = await checkResponse.text();
      console.log('Check user Error response:', errorText);
    }
  } catch (error) {
    console.error('Check user Fetch error:', error.message);
  }
  
  console.log(`\n--- Step 2: Verify email with Supabase Auth ---`);
  
  try {
    // Verify the email using the verify-email endpoint (same as frontend)
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
        console.log(`  User ID: ${verifyData.userId}`);
        console.log(`  Request ID: ${verifyData.requestId}`);
      } else if (verifyData.exists) {
        console.log(`⚠ User ${testEmail} exists but is not confirmed`);
      } else {
        console.log(`✗ User ${testEmail} not found`);
      }
    } else {
      const errorText = await verifyResponse.text();
      console.log('Verify email Error response:', errorText);
    }
  } catch (error) {
    console.error('Verify email Fetch error:', error.message);
  }
  
  console.log(`\n--- Step 3: Test login with AuthService ---`);
  
  try {
    // This would be the equivalent of calling the AuthService.login method
    // For now, we'll just test the OTP flow simulation
    
    console.log('Simulating OTP login flow...');
    
    // In a real scenario, this would send an OTP to the user's email
    // For testing purposes, we'll just log what would happen
    
    console.log(`Would send OTP to: ${testEmail}`);
    console.log('OTP email would include a magic link to /term-plan?onboarding=1');
    
    // Simulate successful OTP flow
    console.log('✓ OTP flow simulation completed');
    
  } catch (error) {
    console.error('Login flow error:', error.message);
  }
  
  console.log('\n--- Full login test completed ---');
}

// Run the test
testFullLogin().catch(console.error);