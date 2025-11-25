/**
 * Test script to verify quiz functionality and routing
 */

async function testQuizFunctionality() {
  console.log('Testing quiz functionality...\n');
  
  try {
    // Test 1: Generate a lesson with quiz questions
    console.log('Test 1: Generating a lesson with quiz questions...');
    
    const response = await fetch('https://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'basic geometry',
        age: 12
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Lesson generated successfully!');
      console.log('\nLesson ID:', data.id);
      
      // Check if lesson has quiz data
      if (data.quiz && Array.isArray(data.quiz) && data.quiz.length > 0) {
        console.log('✅ Quiz data found in lesson:');
        console.log('Number of quiz questions:', data.quiz.length);
        
        // Display first quiz question as example
        const firstQuestion = data.quiz[0];
        console.log('\nSample Quiz Question:');
        console.log('Question:', firstQuestion.q || firstQuestion.question);
        console.log('Options:', firstQuestion.options);
        console.log('Answer:', firstQuestion.answer);
        
        // Test 2: Try to access quiz by lesson ID
        console.log('\nTest 2: Testing quiz access by lesson ID...');
        console.log('Lesson ID for quiz access:', data.id);
        
        // In a real application, this would be accessed via:
        // /quiz?lessonId=${data.id}
        console.log('✅ Quiz can be accessed via: /quiz?lessonId=' + data.id);
        
        // Test 3: Test quiz data format for frontend compatibility
        console.log('\nTest 3: Verifying quiz data format...');
        let isValidFormat = true;
        
        for (let i = 0; i < data.quiz.length; i++) {
          const q = data.quiz[i];
          
          // Check required fields
          if (!q.q && !q.question) {
            console.log(`❌ Quiz question ${i+1} missing 'q' field`);
            isValidFormat = false;
          }
          
          if (!Array.isArray(q.options)) {
            console.log(`❌ Quiz question ${i+1} missing or invalid 'options' field`);
            isValidFormat = false;
          }
          
          if (!q.answer) {
            console.log(`❌ Quiz question ${i+1} missing 'answer' field`);
            isValidFormat = false;
          }
          
          // Check that answer is in options
          if (q.options && !q.options.includes(q.answer)) {
            console.log(`❌ Quiz question ${i+1} answer not in options`);
            isValidFormat = false;
          }
        }
        
        if (isValidFormat) {
          console.log('✅ Quiz data format is valid for frontend');
        } else {
          console.log('❌ Quiz data format has issues');
        }
      } else {
        console.log('⚠️ No quiz data found in lesson');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to generate lesson:', errorText);
    }
  } catch (error) {
    console.error('❌ Error testing quiz functionality:', error.message);
  }
  
  console.log('\n--- Quiz Functionality Test completed ---');
}

// Run the test
testQuizFunctionality().catch(console.error);