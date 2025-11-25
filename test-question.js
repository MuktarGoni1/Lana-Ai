/**
 * Test script to simulate asking a question to the Lana AI system
 */

async function testQuestion() {
  console.log('Testing question asking functionality...\n');
  
  try {
    // Test asking a question about a specific topic
    console.log('Asking: "What is photosynthesis?"');
    
    const response = await fetch('https://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'photosynthesis',
        age: 12
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Question answered successfully!');
      console.log('\nLesson ID:', data.id);
      console.log('\nIntroduction:');
      console.log(data.introduction);
      
      if (data.sections && data.sections.length > 0) {
        console.log('\nSections:');
        data.sections.forEach((section, index) => {
          console.log(`\n${index + 1}. ${section.title || 'Untitled Section'}`);
          console.log(section.content);
        });
      }
      
      if (data.quiz && data.quiz.length > 0) {
        console.log('\nQuiz Questions:');
        data.quiz.forEach((question, index) => {
          console.log(`\nQ${index + 1}: ${question.question}`);
          console.log('Options:', question.options);
          console.log('Answer:', question.answer);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to get response:', errorText);
    }
  } catch (error) {
    console.error('❌ Error asking question:', error.message);
  }
  
  console.log('\n--- Test completed ---');
}

// Run the test
testQuestion().catch(console.error);