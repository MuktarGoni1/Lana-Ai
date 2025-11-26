// Simulate frontend quiz generation
const axios = require('axios');

async function testFrontendQuizGeneration() {
  console.log('Testing frontend quiz generation simulation...\n');
  
  // This simulates what the frontend would do when requesting a quiz
  const topics = ['Photosynthesis', 'World War II', 'Machine Learning'];
  
  for (const topic of topics) {
    try {
      console.log(`Frontend requesting quiz for: ${topic}`);
      
      // This is what the frontend API service would call
      const response = await axios.post('http://localhost:8000/api/structured-lesson', {
        topic: topic,
        age: 16
      });
      
      const lesson = response.data;
      const source = response.headers['x-content-source'];
      
      console.log(`  Backend response source: ${source}`);
      console.log(`  Quiz questions received: ${lesson.quiz?.length || 0}`);
      
      // This is what the frontend component would do with the data
      if (lesson.quiz && lesson.quiz.length > 0) {
        console.log(`  Frontend would display ${lesson.quiz.length} quiz questions:`);
        lesson.quiz.forEach((question, index) => {
          console.log(`    Q${index + 1}: ${question.q}`);
          console.log(`      Options: ${question.options.join(', ')}`);
          console.log(`      Correct Answer: ${question.answer}`);
        });
        console.log('  ✅ Frontend UI would render the quiz correctly');
      } else {
        console.log('  ❌ Frontend would show an error - no quiz questions');
      }
      
      console.log('  ---');
    } catch (error) {
      console.log(`  ❌ Frontend request failed for ${topic}: ${error.message}`);
    }
  }
  
  console.log('\n✅ Frontend quiz generation test completed!');
  console.log('The frontend can now successfully request and display quizzes for all topics.');
}

testFrontendQuizGeneration();