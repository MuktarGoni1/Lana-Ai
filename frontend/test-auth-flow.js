// Script to test the authentication flow
// This script generates a random email and tests the registration and login flows

async function testAuthFlow() {
  // Generate a random email
  const randomString = Math.random().toString(36).substring(2, 10);
  const testEmail = `testuser-${randomString}@example.com`;
  
  console.log(`Testing authentication flow with email: ${testEmail}`);
  
  try {
    // Test parent registration
    console.log('Testing parent registration...');
    const registerResponse = await fetch('http://localhost:3001/api/auth/register-parent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: testEmail }),
    });
    
    const registerData = await registerResponse.json();
    console.log('Registration response:', registerData);
    
    if (registerResponse.ok) {
      console.log('✅ Parent registration successful');
      console.log('📝 Please check your email for the magic link and click it to complete registration');
      console.log('🔄 After clicking the link, the user should be automatically redirected to the homepage');
    } else {
      console.log('❌ Parent registration failed:', registerData.message);
      return;
    }
    
    // Note: We can't automatically test the magic link flow as it requires email verification
    // In a real test, you would:
    // 1. Check the email for the magic link
    // 2. Click the magic link
    // 3. Verify that you're redirected to the term-plan onboarding page
    // 4. Verify that you're logged in and don't need another magic link to access protected pages
    
    console.log('\n📋 Manual testing steps:');
    console.log('1. Check the email inbox for the magic link sent to:', testEmail);
    console.log('2. Click the magic link in the email');
    console.log('3. Verify that you are redirected to the term-plan onboarding page');
    console.log('4. After onboarding, verify that you are logged in and can access protected pages without another magic link');
    console.log('5. Try accessing the login page - you should be automatically redirected to the homepage');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error);
  }
}

// Run the test
testAuthFlow();