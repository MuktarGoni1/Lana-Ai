const axios = require('axios');

// Test specific topics that failed
const failedTopics = [
  'Photosynthesis',
  'Quantum Physics',
  'Renaissance Art',
  'Ancient Egypt',
  'Stock Market',
  'Human Anatomy'
];

async function debugFailedTopics() {
  console.log('Debugging topics that failed to generate quizzes...\n');
  
  for (const topic of failedTopics) {
    try {
      console.log(`Testing topic: ${topic}`);
      
      // Test structured lesson endpoint with more detailed logging
      const response = await axios.post('http://localhost:8000/api/structured-lesson', {
        topic: topic,
        age: 15
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      const lesson = response.data;
      
      console.log(`  Status: ${response.status}`);
      console.log(`  Headers: ${JSON.stringify(response.headers)}`);
      console.log(`  Content Source: ${response.headers['x-content-source'] || 'unknown'}`);
      console.log(`  Sections count: ${lesson.sections?.length || 0}`);
      console.log(`  Quiz questions count: ${lesson.quiz?.length || 0}`);
      
      if (lesson.quiz && lesson.quiz.length > 0) {
        console.log('  Quiz questions:');
        lesson.quiz.forEach((q, index) => {
          console.log(`    ${index + 1}. ${q.q}`);
          console.log(`       Options: ${q.options?.join(', ')}`);
          console.log(`       Answer: ${q.answer}`);
        });
      } else {
        console.log('  ❌ No quiz questions generated');
      }
      
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ Error testing ${topic}: ${error.message}`);
      if (error.response) {
        console.log(`     Status: ${error.response.status}`);
        console.log(`     Headers: ${JSON.stringify(error.response.headers)}`);
        console.log(`     Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

// Run the debug test
debugFailedTopics();