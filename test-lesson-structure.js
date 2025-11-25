/**
 * Test script to examine the full lesson structure
 */

async function testLessonStructure() {
  console.log('Testing lesson structure...\n');
  
  try {
    // Generate a lesson
    console.log('Generating a lesson...');
    
    const response = await fetch('https://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'basic arithmetic',
        age: 10
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Lesson generated successfully!');
      console.log('\nLesson ID:', data.id);
      
      // Display full lesson structure
      console.log('\nFull lesson structure:');
      console.log(JSON.stringify(data, null, 2));
      
      // Check specific fields
      console.log('\n--- Field Analysis ---');
      console.log('Introduction:', data.introduction ? '✅ Present' : '❌ Missing');
      console.log('Sections:', data.sections ? `✅ Present (${data.sections.length} sections)` : '❌ Missing');
      console.log('Quiz:', data.quiz ? `✅ Present (${data.quiz.length} questions)` : '❌ Missing');
      console.log('Classifications:', data.classifications ? `✅ Present (${data.classifications.length} items)` : '❌ Missing');
      console.log('Diagram:', data.diagram !== undefined ? '✅ Present' : '❌ Missing');
      
      if (data.sections && Array.isArray(data.sections)) {
        console.log('\nSections:');
        data.sections.forEach((section, index) => {
          console.log(`  ${index + 1}. ${section.title || 'Untitled'} (${section.content ? section.content.length : 0} chars)`);
        });
      }
      
      if (data.quiz && Array.isArray(data.quiz)) {
        console.log('\nQuiz Questions:');
        data.quiz.forEach((question, index) => {
          console.log(`  ${index + 1}. ${question.q || question.question || 'Untitled'}`);
          console.log(`     Options: ${Array.isArray(question.options) ? question.options.length : 0} items`);
          console.log(`     Answer: ${question.answer || 'None'}`);
        });
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to generate lesson:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing lesson structure:', error.message);
  }
  
  console.log('\n--- Lesson Structure Test completed ---');
}

// Run the test
testLessonStructure().catch(console.error);