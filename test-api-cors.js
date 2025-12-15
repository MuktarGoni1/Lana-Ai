/**
 * API CORS Test Script
 * This script tests CORS for the actual API endpoints used by the frontend
 */

async function testApiCors() {
  console.log('🧪 Testing API CORS Configuration...\n');
  
  const API_BASE = 'https://api.lanamind.com';
  
  try {
    // Test structured lesson endpoint
    console.log('1️⃣ Testing Structured Lesson Endpoint...');
    const lessonResponse = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://lanamind.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const lessonAllowOrigin = lessonResponse.headers.get('access-control-allow-origin');
    const lessonStatus = lessonResponse.status;
    
    console.log(`   Status: ${lessonStatus}`);
    console.log(`   Allow-Origin: ${lessonAllowOrigin || 'NOT SET'}`);
    
    if (lessonStatus === 200 && lessonAllowOrigin) {
      console.log('   ✅ Structured Lesson CORS: SUCCESS');
    } else {
      console.log('   ⚠️  Structured Lesson CORS: ISSUE DETECTED');
    }
    
    // Test streaming endpoint
    console.log('\n2️⃣ Testing Streaming Endpoint...');
    const streamResponse = await fetch(`${API_BASE}/api/structured-lesson/stream`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://lanamind.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const streamAllowOrigin = streamResponse.headers.get('access-control-allow-origin');
    const streamStatus = streamResponse.status;
    
    console.log(`   Status: ${streamStatus}`);
    console.log(`   Allow-Origin: ${streamAllowOrigin || 'NOT SET'}`);
    
    if (streamStatus === 200 && streamAllowOrigin) {
      console.log('   ✅ Streaming CORS: SUCCESS');
    } else {
      console.log('   ⚠️  Streaming CORS: ISSUE DETECTED');
    }
    
    // Test TTS endpoint
    console.log('\n3️⃣ Testing TTS Endpoint...');
    const ttsResponse = await fetch(`${API_BASE}/api/tts/`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://lanamind.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const ttsAllowOrigin = ttsResponse.headers.get('access-control-allow-origin');
    const ttsStatus = ttsResponse.status;
    
    console.log(`   Status: ${ttsStatus}`);
    console.log(`   Allow-Origin: ${ttsAllowOrigin || 'NOT SET'}`);
    
    if (ttsStatus === 200 && ttsAllowOrigin) {
      console.log('   ✅ TTS CORS: SUCCESS');
    } else {
      console.log('   ⚠️  TTS CORS: ISSUE DETECTED');
    }
    
    // Test with localhost origin
    console.log('\n4️⃣ Testing with Localhost Origin...');
    const localhostResponse = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:3000',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const localhostAllowOrigin = localhostResponse.headers.get('access-control-allow-origin');
    const localhostStatus = localhostResponse.status;
    
    console.log(`   Status: ${localhostStatus}`);
    console.log(`   Allow-Origin: ${localhostAllowOrigin || 'NOT SET'}`);
    
    if (localhostStatus === 200 && localhostAllowOrigin) {
      console.log('   ✅ Localhost CORS: SUCCESS');
    } else {
      console.log('   ⚠️  Localhost CORS: ISSUE DETECTED');
    }
    
    console.log('\n✅ API CORS Test Completed');
    console.log('========================');
    console.log('Summary:');
    console.log('- Structured lesson endpoint CORS tested');
    console.log('- Streaming endpoint CORS tested');
    console.log('- TTS endpoint CORS tested');
    console.log('- Localhost origin CORS tested');
    
  } catch (error) {
    console.error('❌ API CORS Test Failed:', error.message);
  }
}

// Run the test
testApiCors();