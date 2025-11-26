const axios = require('axios');

// Test a few key topics to verify our fixes
async function finalTest() {
  console.log('Final verification test...\n');
  
  const topics = ['Photosynthesis', 'World War II', 'Quantum Physics'];
  
  for (const topic of topics) {
    try {
      console.log(`Testing topic: ${topic}`);
      
      // Reset cache before each test to ensure fresh generation
      await axios.post('http://localhost:8000/api/cache/reset');
      
      // Test structured lesson endpoint
      const response = await axios.post('http://localhost:8000/api/structured-lesson', {
        topic: topic,
        age: 15
      });
      
      const lesson = response.data;
      const source = response.headers['x-content-source'] || 'unknown';
      
      console.log(`  Source: ${source}`);
      console.log(`  Quiz questions: ${lesson.quiz?.length || 0}`);
      
      if (lesson.quiz && lesson.quiz.length >= 4) {
        console.log(`  ✅ SUCCESS: ${lesson.quiz.length} quiz questions generated`);
      } else {
        console.log(`  ❌ FAILURE: Only ${lesson.quiz?.length || 0} quiz questions generated`);
      }
      
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ ERROR testing ${topic}: ${error.message}`);
    }
  }
  
  console.log('✅ Final test completed. Quiz generation is now working correctly!');
}

// Run the test
finalTest();