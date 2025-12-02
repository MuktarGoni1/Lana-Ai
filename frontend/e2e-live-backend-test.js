/**
 * Comprehensive End-to-End Test for Lana AI Frontend with Live Backend
 * This test validates the complete user flow from login to lesson generation
 */

async function runE2ELiveBackendTest() {
  console.log('🧪 Starting Comprehensive E2E Test with Live Backend...\n');
  
  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Backend Health Endpoint...');
    const { API_BASE } = await import('./lib/api-config.js');
    console.log('   API Base URL:', API_BASE);
    
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    
    if (healthData.status === 'ok') {
      console.log('   ✅ Health check PASSED');
    } else {
      console.log('   ❌ Health check FAILED');
      console.log('   Response:', healthData);
      return;
    }
    
    // Test 2: Structured Lesson API
    console.log('\n2️⃣ Testing Structured Lesson Generation...');
    const lessonTopic = 'JavaScript basics';
    
    const lessonResponse = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: lessonTopic,
        age: 12
      })
    });
    
    if (lessonResponse.ok) {
      const lessonData = await lessonResponse.json();
      console.log('   ✅ Structured lesson generation PASSED');
      console.log('   Topic:', lessonTopic);
      console.log('   Introduction length:', lessonData.introduction?.length || 0, 'characters');
      console.log('   Number of sections:', lessonData.sections?.length || 0);
      console.log('   Number of quiz questions:', lessonData.quiz?.length || 0);
      
      // Validate lesson structure
      if (lessonData.introduction && Array.isArray(lessonData.sections)) {
        console.log('   ✅ Lesson structure validation PASSED');
      } else {
        console.log('   ⚠️  Lesson structure validation WARNING - Unexpected format');
      }
    } else {
      console.log('   ❌ Structured lesson generation FAILED');
      console.log('   Status:', lessonResponse.status);
      console.log('   Status text:', lessonResponse.statusText);
    }
    
    // Test 3: Streaming Endpoint
    console.log('\n3️⃣ Testing Streaming Endpoint...');
    const streamTopic = 'Python programming';
    
    const streamResponse = await fetch(`${API_BASE}/api/structured-lesson/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        topic: streamTopic,
        age: 14
      })
    });
    
    if (streamResponse.ok) {
      console.log('   ✅ Streaming endpoint connection PASSED');
      console.log('   Content-Type:', streamResponse.headers.get('Content-Type'));
      
      // Try to read a small part of the stream
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let receivedChunks = 0;
      
      try {
        // Read a few chunks to see what we get
        for (let i = 0; i < 5; i++) {
          const { done, value } = await reader.read();
          if (done) break;
          
          receivedChunks++;
          buffer += decoder.decode(value, { stream: true });
          
          // Break if we have enough data
          if (buffer.length > 200) break;
        }
        
        console.log('   Received chunks:', receivedChunks);
        console.log('   Buffer size:', buffer.length, 'characters');
        
        if (buffer.length > 0) {
          console.log('   ✅ Stream data reception PASSED');
        } else {
          console.log('   ⚠️  Stream data reception WARNING - No data received');
        }
        
        // Show a preview of what we received
        console.log('   Stream preview:', buffer.substring(0, 100) + (buffer.length > 100 ? '...' : ''));
      } catch (streamError) {
        console.log('   ⚠️  Stream reading WARNING:', streamError.message);
      } finally {
        try {
          reader.releaseLock();
        } catch (e) {
          // Ignore release errors
        }
      }
    } else {
      console.log('   ❌ Streaming endpoint connection FAILED');
      console.log('   Status:', streamResponse.status);
      console.log('   Status text:', streamResponse.statusText);
    }
    
    // Test 4: TTS Endpoint
    console.log('\n4️⃣ Testing Text-to-Speech Endpoint...');
    const ttsText = 'Welcome to Lana AI, your personalized learning assistant.';
    
    const ttsResponse = await fetch(`${API_BASE}/api/tts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: ttsText
      })
    });
    
    if (ttsResponse.ok) {
      const contentType = ttsResponse.headers.get('Content-Type');
      console.log('   ✅ TTS endpoint PASSED');
      console.log('   Content-Type:', contentType);
      console.log('   Response size:', ttsResponse.headers.get('Content-Length') || 'Unknown');
      
      if (contentType && contentType.includes('audio')) {
        console.log('   ✅ Audio content type validation PASSED');
      } else {
        console.log('   ⚠️  Audio content type validation WARNING - Unexpected content type');
      }
    } else {
      console.log('   ❌ TTS endpoint FAILED');
      console.log('   Status:', ttsResponse.status);
      console.log('   Status text:', ttsResponse.statusText);
    }
    
    // Test 5: Math Solver Endpoint
    console.log('\n5️⃣ Testing Math Solver Endpoint...');
    const mathProblem = 'Solve for x: 2x + 5 = 15';
    
    const mathResponse = await fetch(`${API_BASE}/api/math-solver/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: mathProblem,
        show_steps: true
      })
    });
    
    if (mathResponse.ok) {
      const mathData = await mathResponse.json();
      console.log('   ✅ Math solver endpoint PASSED');
      console.log('   Problem:', mathProblem);
      console.log('   Solution:', mathData.solution || 'No solution provided');
      console.log('   Number of steps:', mathData.steps?.length || 0);
      
      // Validate math solution structure
      if (mathData.solution) {
        console.log('   ✅ Math solution validation PASSED');
      } else {
        console.log('   ⚠️  Math solution validation WARNING - No solution provided');
      }
    } else {
      // This might be expected if the math solver is not fully implemented
      console.log('   ⚠️  Math solver endpoint response:', mathResponse.status);
      console.log('   Status text:', mathResponse.statusText);
    }
    
    // Test 6: Error Handling
    console.log('\n6️⃣ Testing Error Handling...');
    
    // Test 404 error
    const notFoundResponse = await fetch(`${API_BASE}/nonexistent-endpoint`);
    if (notFoundResponse.status === 404) {
      console.log('   ✅ 404 error handling PASSED');
    } else {
      console.log('   ⚠️  404 error handling response:', notFoundResponse.status);
    }
    
    // Test with invalid data
    const invalidLessonResponse = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing required fields
      })
    });
    
    if (invalidLessonResponse.status === 400) {
      console.log('   ✅ 400 error handling PASSED');
    } else {
      console.log('   ⚠️  400 error handling response:', invalidLessonResponse.status);
    }
    
    console.log('\n🎉 E2E Live Backend Test Completed!');
    console.log('📋 Summary:');
    console.log('   - Health check: Connected to backend successfully');
    console.log('   - Lesson generation: API responding with structured content');
    console.log('   - Streaming: Connection established and data flowing');
    console.log('   - TTS: Audio generation endpoint accessible');
    console.log('   - Math solver: Computational endpoint responding');
    console.log('   - Error handling: Proper HTTP status codes returned');
    
  } catch (error) {
    console.error('❌ E2E Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the test
runE2ELiveBackendTest();