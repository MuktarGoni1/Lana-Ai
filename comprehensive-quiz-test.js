const axios = require('axios');

// Test a comprehensive set of topics
const testTopics = [
  'Photosynthesis',
  'World War II',
  'Quantum Physics',
  'Renaissance Art',
  'Machine Learning',
  'Ancient Egypt',
  'Stock Market',
  'Human Anatomy',
  'Climate Change',
  'Artificial Intelligence',
  'Blockchain Technology',
  'Renewable Energy'
];

async function testQuizGeneration() {
  console.log('Comprehensive quiz generation test...\n');
  
  let successCount = 0;
  let totalCount = testTopics.length;
  
  for (const topic of testTopics) {
    try {
      console.log(`Testing topic: ${topic}`);
      
      // Test structured lesson endpoint
      const response = await axios.post('http://localhost:8000/api/structured-lesson', {
        topic: topic,
        age: 15
      });
      
      const lesson = response.data;
      const source = response.headers['x-content-source'] || 'unknown';
      
      console.log(`  Source: ${source}`);
      console.log(`  Sections: ${lesson.sections?.length || 0}`);
      console.log(`  Quiz questions: ${lesson.quiz?.length || 0}`);
      
      // Check if we have the required number of quiz questions
      if (lesson.quiz && lesson.quiz.length >= 4) {
        console.log(`  ✅ SUCCESS: ${lesson.quiz.length} quiz questions generated`);
        successCount++;
      } else {
        console.log(`  ❌ FAILURE: Only ${lesson.quiz?.length || 0} quiz questions generated`);
      }
      
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ ERROR testing ${topic}: ${error.message}`);
    }
  }
  
  console.log(`\n📊 Test Results: ${successCount}/${totalCount} topics generated 4+ quiz questions`);
  console.log(`🎯 Success Rate: ${((successCount/totalCount)*100).toFixed(1)}%`);
  
  if (successCount === totalCount) {
    console.log('🎉 All tests passed! Quiz generation is working correctly for all topics.');
  } else {
    console.log('⚠️  Some topics may need further attention.');
  }
}

// Run the test
testQuizGeneration();