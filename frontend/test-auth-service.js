const { verifyUserAuthentication } = require('./lib/services/authVerificationService');

async function testAuthService() {
  try {
    console.log('Testing auth service...');
    
    // Test with a sample email
    const result = await verifyUserAuthentication('test@example.com');
    console.log('Result:', result);
    
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

testAuthService();