// Simple test to verify frontend API response handling
async function testApiResponses() {
  console.log("Testing frontend API response handling...");
  
  // Import API base configuration
  const { API_BASE } = await import('./lib/api-config.js');
  
  try {
    // Test successful response
    console.log("\n1. Testing successful response...");
    const healthResponse = await fetch(`${API_BASE}/health`);
    console.log(`Health endpoint status: ${healthResponse.status}`);
    const healthData = await healthResponse.json();
    console.log(`Health endpoint data:`, healthData);
    
    // Test error response handling
    console.log("\n2. Testing error response handling...");
    
    // Test 404 error
    try {
      const notFoundResponse = await fetch(`${API_BASE}/nonexistent`);
      console.log(`404 error status: ${notFoundResponse.status}`);
      const errorData = await notFoundResponse.json();
      console.log(`404 error data:`, errorData);
    } catch (error) {
      console.log(`404 error caught: ${error.message}`);
    }
    
    // Test structured lesson endpoint
    console.log("\n3. Testing structured lesson endpoint...");
    const lessonResponse = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topic: 'science',
        age: 12
      })
    });
    
    console.log(`Lesson endpoint status: ${lessonResponse.status}`);
    if (lessonResponse.ok) {
      const lessonData = await lessonResponse.json();
      console.log(`Lesson data keys:`, Object.keys(lessonData));
      console.log(`Introduction preview:`, lessonData.introduction?.substring(0, 100) + '...');
    } else {
      console.log(`Lesson endpoint error: ${lessonResponse.status}`);
      try {
        const errorData = await lessonResponse.json();
        console.log(`Error data:`, errorData);
      } catch {
        console.log(`Error text:`, await lessonResponse.text());
      }
    }
    
    console.log("\n✅ All tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testApiResponses();