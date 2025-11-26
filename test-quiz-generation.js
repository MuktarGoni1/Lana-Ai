const axios = require('axios');

// Test different topics for quiz generation
const testTopics = [
  'Photosynthesis',
  'World War II',
  'Quantum Physics',
  'Renaissance Art',
  'Machine Learning',
  'Ancient Egypt',
  'Stock Market',
  'Human Anatomy'
];

async function testBackendQuizGeneration() {
  console.log('Testing backend quiz generation...\n');
  
  for (const topic of testTopics) {
    try {
      console.log(`Testing topic: ${topic}`);
      
      // Test structured lesson endpoint
      const response = await axios.post('http://localhost:8000/api/structured-lesson', {
        topic: topic,
        age: 15
      });
      
      const lesson = response.data;
      
      console.log(`  Topic: ${topic}`);
      console.log(`  Introduction: ${lesson.introduction?.substring(0, 50)}...`);
      console.log(`  Number of quiz questions: ${lesson.quiz?.length || 0}`);
      
      // Check quiz structure
      if (lesson.quiz && lesson.quiz.length > 0) {
        console.log('  Quiz questions:');
        lesson.quiz.forEach((q, index) => {
          console.log(`    ${index + 1}. ${q.q}`);
          console.log(`       Options: ${q.options.join(', ')}`);
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
        console.log(`     Data: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

async function testFrontendQuizGeneration() {
  console.log('\nTesting frontend quiz generation...\n');
  
  // Note: This would typically be done through the frontend UI
  // For now, we'll simulate what the frontend would do
  
  console.log('Frontend would make requests to the same backend endpoints');
  console.log('The frontend UI should display quizzes for all tested topics');
}

async function runTests() {
  try {
    await testBackendQuizGeneration();
    await testFrontendQuizGeneration();
    
    console.log('\n✅ Test completed. Check results above.');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run the tests
runTests();