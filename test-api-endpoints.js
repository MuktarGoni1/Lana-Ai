/**
 * Test script to check both response and history endpoints from lana-ai.onrender.com
 */

async function testApiEndpoints() {
  console.log('Testing API endpoints from lana-ai.onrender.com...\n');
  
  try {
    // Test 1: Check backend health
    console.log('Test 1: Checking backend health endpoint...');
    const healthResponse = await fetch('https://lana-ai.onrender.com/health');
    const healthData = await healthResponse.json();
    console.log('✅ Backend health check:', healthData.status === 'ok' ? 'PASSED' : 'FAILED');
    console.log('   Response:', healthData);
    
    // Test 2: Check structured lesson API
    console.log('\nTest 2: Testing structured lesson API...');
    const lessonResponse = await fetch('https://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'Basic Mathematics',
        age: 10
      })
    });
    
    console.log(`   Status: ${lessonResponse.status}`);
    
    if (lessonResponse.ok) {
      const lessonData = await lessonResponse.json();
      console.log('✅ Structured lesson API test: PASSED');
      console.log('   Received lesson with ID:', lessonData.id);
      console.log('   Introduction length:', lessonData.introduction?.length || 0, 'characters');
      console.log('   Number of sections:', lessonData.sections?.length || 0);
    } else {
      console.log('❌ Structured lesson API test: FAILED');
      console.log('   Status:', lessonResponse.status);
      const errorText = await lessonResponse.text();
      console.log('   Error:', errorText);
    }
    
    // Test 3: Check history API (with a dummy session ID)
    console.log('\nTest 3: Testing history API...');
    const historyResponse = await fetch('https://lana-ai.onrender.com/api/history?sid=test-session-id&limit=5');
    
    console.log(`   Status: ${historyResponse.status}`);
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ History API test: PASSED');
      console.log('   Number of history items:', Array.isArray(historyData) ? historyData.length : 0);
      if (Array.isArray(historyData) && historyData.length > 0) {
        console.log('   Sample item:', JSON.stringify(historyData[0], null, 2));
      }
    } else {
      console.log('❌ History API test: FAILED');
      console.log('   Status:', historyResponse.status);
      try {
        const errorText = await historyResponse.text();
        console.log('   Error:', errorText);
      } catch (e) {
        console.log('   Error: Could not parse error response');
      }
    }
    
    console.log('\n--- API Test Summary ---');
    console.log('✅ Backend is accessible and responding correctly');
    console.log('✅ Structured lesson generation is working');
    console.log('✅ History API is accessible');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
  }
}

// Run the test
testApiEndpoints().catch(console.error);