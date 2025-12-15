/**
 * CORS Configuration Test Script
 * This script tests the CORS configuration of the Lana AI backend
 */

async function testCorsConfiguration() {
  console.log('🧪 Testing CORS Configuration...\n');
  
  try {
    // Test health endpoint CORS headers
    console.log('1️⃣ Testing Health Endpoint CORS...');
    const healthResponse = await fetch('https://api.lanamind.com/health', {
      method: 'GET',
      headers: {
        'Origin': 'https://lanamind.com'
      }
    });
    
    const allowOrigin = healthResponse.headers.get('access-control-allow-origin');
    const allowMethods = healthResponse.headers.get('access-control-allow-methods');
    const allowHeaders = healthResponse.headers.get('access-control-allow-headers');
    const allowCredentials = healthResponse.headers.get('access-control-allow-credentials');
    
    console.log(`   Access-Control-Allow-Origin: ${allowOrigin || 'NOT SET'}`);
    console.log(`   Access-Control-Allow-Methods: ${allowMethods || 'NOT SET'}`);
    console.log(`   Access-Control-Allow-Headers: ${allowHeaders || 'NOT SET'}`);
    console.log(`   Access-Control-Allow-Credentials: ${allowCredentials || 'NOT SET'}`);
    
    if (allowOrigin && allowMethods && allowHeaders) {
      console.log('   ✅ CORS Headers: PRESENT');
    } else {
      console.log('   ⚠️  CORS Headers: PARTIALLY MISSING');
    }
    
    // Test preflight request
    console.log('\n2️⃣ Testing Preflight Request (OPTIONS)...');
    const optionsResponse = await fetch('https://api.lanamind.com/health', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://lanamind.com',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const optionsAllowOrigin = optionsResponse.headers.get('access-control-allow-origin');
    const optionsStatus = optionsResponse.status;
    
    console.log(`   Preflight Status: ${optionsStatus}`);
    console.log(`   Preflight Allow-Origin: ${optionsAllowOrigin || 'NOT SET'}`);
    
    if (optionsStatus === 200 && optionsAllowOrigin) {
      console.log('   ✅ Preflight Request: SUCCESS');
    } else {
      console.log('   ⚠️  Preflight Request: ISSUE DETECTED');
    }
    
    // Test with localhost origin (development)
    console.log('\n3️⃣ Testing Localhost Origin...');
    const localhostResponse = await fetch('https://api.lanamind.com/health', {
      method: 'GET',
      headers: {
        'Origin': 'http://localhost:3000'
      }
    });
    
    const localhostAllowOrigin = localhostResponse.headers.get('access-control-allow-origin');
    console.log(`   Localhost Allow-Origin: ${localhostAllowOrigin || 'NOT SET'}`);
    
    if (localhostAllowOrigin) {
      console.log('   ✅ Localhost Origin: ALLOWED');
    } else {
      console.log('   ⚠️  Localhost Origin: NOT ALLOWED');
    }
    
    console.log('\n✅ CORS Configuration Test Completed');
    console.log('=====================================');
    console.log('Summary:');
    console.log('- Health endpoint CORS headers checked');
    console.log('- Preflight request tested');
    console.log('- Localhost origin allowance verified');
    
  } catch (error) {
    console.error('❌ CORS Test Failed:', error.message);
  }
}

// Run the test
testCorsConfiguration();