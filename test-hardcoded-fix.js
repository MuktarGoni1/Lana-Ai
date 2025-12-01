// Test script to verify the hardcoded response fix
const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000";

async function testStructuredLesson() {
  console.log('Testing structured lesson endpoint...');
  
  try {
    // Test with a topic that might trigger the stub response
    const response = await fetch(`${API_BASE}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'Mahogany',
        age: 10
      })
    });
    
    if (!response.ok) {
      console.error('API request failed:', response.status, response.statusText);
      return;
    }
    
    const data = await response.json();
    console.log('Response received:');
    console.log('Introduction:', data.introduction);
    console.log('Sections count:', data.sections?.length || 0);
    console.log('Quiz questions count:', data.quiz?.length || 0);
    
    // Check if this is an error response
    if (data.introduction && data.introduction.includes('Unable to generate a detailed lesson')) {
      console.log('✅ SUCCESS: Error response detected instead of hardcoded template');
      console.log('✅ Error message:', data.introduction);
    } else if (data.introduction && data.introduction.startsWith('Let\'s learn about')) {
      console.log('❌ FAILURE: Still receiving hardcoded template response');
      console.log('Introduction:', data.introduction);
    } else {
      console.log('✅ SUCCESS: Received dynamic content (likely from LLM)');
      console.log('Introduction preview:', data.introduction?.substring(0, 100) + '...');
    }
  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Run the test
testStructuredLesson();