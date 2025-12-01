/**
 * Simple test to verify frontend can connect to backend and receive LLM-generated content
 */
async function testFrontendConnection() {
  console.log('Testing frontend connection to backend...\n');
  
  try {
    // Test 1: Check if we can connect to the backend
    const { API_BASE } = await import('./lib/api-config.js');
    console.log('API Base URL:', API_BASE);
    
    // Test 2: Check backend health
    console.log('\n1. Testing backend health endpoint...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Backend health check:', healthData.status === 'ok' ? 'PASSED' : 'FAILED');
    console.log('   Response:', healthData);
    
    // Test 3: Test structured lesson API
    console.log('\n2. Testing structured lesson API...');
    const lessonResponse = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'JavaScript',
        age: 15
      })
    });
    
    if (lessonResponse.ok) {
      const lessonData = await lessonResponse.json();
      console.log('✅ Structured lesson API test: PASSED');
      console.log('   Introduction length:', lessonData.introduction?.length || 0, 'characters');
      console.log('   Number of sections:', lessonData.sections?.length || 0);
      console.log('   Number of quiz questions:', lessonData.quiz?.length || 0);
      
      // Check if this is LLM-generated content or stub content
      if (lessonData.introduction && lessonData.introduction.includes('Let\'s learn about')) {
        console.log('   ⚠️  Content appears to be STUB content');
      } else if (lessonData.introduction && lessonData.introduction.length > 50) {
        console.log('   ✅ Content appears to be LLM-generated (substantial content)');
      } else {
        console.log('   ⚠️  Content unclear - may be stub or low-quality LLM response');
      }
      
      // Show a preview of the introduction
      if (lessonData.introduction) {
        console.log('   Introduction preview:', lessonData.introduction.substring(0, 100) + (lessonData.introduction.length > 100 ? '...' : ''));
      }
    } else {
      console.log('❌ Structured lesson API test: FAILED');
      console.log('   Status:', lessonResponse.status);
      console.log('   Status text:', lessonResponse.statusText);
    }
    
    // Test 4: Test streaming endpoint
    console.log('\n3. Testing streaming endpoint...');
    const streamResponse = await fetch(`${API_BASE}/api/structured-lesson/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        topic: 'Python',
        age: 12
      })
    });
    
    if (streamResponse.ok) {
      console.log('✅ Streaming endpoint test: PASSED');
      console.log('   Content-Type:', streamResponse.headers.get('Content-Type'));
      
      // Try to read a small part of the stream
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      
      try {
        // Read a few chunks to see what we get
        for (let i = 0; i < 10; i++) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          if (buffer.includes('\n\n') && buffer.includes('"source": "llm"')) break; // Got a complete message with LLM source
        }
        
        // Parse the SSE message
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data:')) {
            try {
              const jsonData = JSON.parse(line.substring(5));
              console.log('   Stream source:', jsonData.source || 'Unknown');
              if (jsonData.source === 'llm') {
                console.log('   ✅ Stream content is LLM-generated');
              } else if (jsonData.source === 'stub') {
                console.log('   ⚠️  Stream content is STUB');
              }
              
              if (jsonData.lesson) {
                console.log('   Stream lesson sections:', jsonData.lesson.sections?.length || 0);
                console.log('   Stream lesson quiz questions:', jsonData.lesson.quiz?.length || 0);
              }
              break;
            } catch (parseError) {
              // Continue to next line
            }
          }
        }
        
        console.log('   Stream preview:', buffer.substring(0, 200) + (buffer.length > 200 ? '...' : ''));
      } catch (streamError) {
        console.log('   ⚠️  Could not read stream:', streamError.message);
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          // Ignore release errors
        }
      }
    } else {
      console.log('❌ Streaming endpoint test: FAILED');
      console.log('   Status:', streamResponse.status);
      console.log('   Status text:', streamResponse.statusText);
    }
    
    console.log('\n✅ Frontend connection test completed!');
    
  } catch (error) {
    console.error('❌ Frontend connection test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
testFrontendConnection();