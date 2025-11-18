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
    const registerResponse = await fetch('http://localhost:3000/api/auth/register-parent', {
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
      console.log('📝 After clicking the magic link, you should be automatically redirected to the term-plan onboarding');
    } else {
      console.error('❌ Parent registration failed:', registerData.message);
    }
  } catch (error) {
    console.error('❌ Error during parent registration:', error.message);
  }
}

// Run the test
testAuthFlow();