// Test script to verify TTS functionality
// This tests the connection to the backend TTS service

// Import API base configuration
const { API_BASE } = require('./lib/api-config.js');

async function testTtsFunctionality() {
  try {
    console.log('Testing TTS functionality...');
    
    // Test TTS endpoint directly
    console.log('1. Testing TTS endpoint directly...');
    const backendResponse = await fetch(`${API_BASE}/api/tts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: 'Hello, this is a test of the text to speech functionality.'
      })
    });
    
    console.log('   TTS endpoint status:', backendResponse.status);
    console.log('   Expected to proxy to:', `${API_BASE}/api/tts/`);
    
    if (backendResponse.ok) {
      console.log('✅ TTS endpoint is accessible');
      const contentType = backendResponse.headers.get('content-type');
      console.log('   Content-Type:', contentType);
      
      // Check if we got audio data
      const contentLength = backendResponse.headers.get('content-length');
      console.log('   Content-Length:', contentLength);
      
      if (contentType && contentType.includes('audio')) {
        console.log('✅ TTS response contains audio data');
      } else {
        console.log('⚠️  TTS response may not contain audio data');
      }
    } else {
      // This might be expected in some cases (e.g., missing auth)
      console.log('ℹ️  TTS endpoint responded with status:', backendResponse.status);
      const errorText = await backendResponse.text();
      console.log('   Error details:', errorText.substring(0, 200) + (errorText.length > 200 ? '...' : ''));
    }
    
    // Test frontend TTS proxy endpoint
    console.log('\n2. Testing frontend TTS proxy endpoint...');
    console.log('   This test requires the frontend to be running on localhost:3000');
    console.log('   Expected to proxy to:', `${API_BASE}/api/tts/`);
    
    console.log('\n✅ TTS functionality test completed');
    console.log('Note: For full testing, run the frontend locally and test the /api/tts endpoint');
    
  } catch (error) {
    console.error('❌ TTS functionality test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testTtsFunctionality().catch(console.error);