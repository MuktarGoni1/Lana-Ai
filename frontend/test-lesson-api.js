/**
 * Test script to check the structured lesson API endpoint
 */

async function testLessonAPI() {
  console.log('Testing structured lesson API endpoint...');
  
  try {
    // Test the structured lesson endpoint
    const response = await fetch('https://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'Photosynthesis',
        age: 10
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success! Received structured lesson:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      const errorText = await response.text();
      console.log('Error response:', errorText);
    }
  } catch (error) {
    console.error('Fetch error:', error.message);
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testLessonAPI().catch(console.error);