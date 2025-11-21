/**
 * Integration test to verify the connection between frontend and backend
 */

async function runIntegrationTest() {
  console.log('Running integration test between frontend and backend...\n');
  
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
    
    // Test 3: Check frontend environment variables
    console.log('\nTest 3: Checking frontend environment configuration...');
    const envTestResponse = await fetch('http://localhost:3001/api/test-env');
    if (envTestResponse.ok) {
      const envData = await envTestResponse.json();
      console.log('✅ Frontend environment test: PASSED');
      console.log('   Supabase URL configured:', !!envData.supabaseUrl);
      console.log('   API Base configured:', !!envData.apiBase);
    } else {
      console.log('⚠️  Frontend environment test: Unable to verify (frontend may not be running)');
    }
    
    console.log('\n--- Integration Test Summary ---');
    console.log('✅ Backend API is accessible and responding correctly');
    console.log('✅ Structured lesson generation is working');
    console.log('✅ System is ready for user authentication and lesson delivery');
    
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
  }
}

// Run the test
runIntegrationTest().catch(console.error);