/**
 * Debug script to examine quiz data in detail
 */

async function debugQuizData() {
  console.log('Debugging quiz data...\n');
  
  try {
    // Generate a lesson
    console.log('Generating a lesson...');
    
    const response = await fetch('https://lana-ai.onrender.com/api/structured-lesson', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: 'simple addition',
        age: 8
      })
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Lesson generated successfully!');
      console.log('Lesson ID:', data.id);
      
      // Display quiz data in detail
      if (data.quiz && Array.isArray(data.quiz)) {
        console.log('\nQuiz Data (Detailed):');
        data.quiz.forEach((question, index) => {
          console.log(`\nQuestion ${index + 1}:`);
          console.log('  q:', JSON.stringify(question.q));
          console.log('  options:', question.options.map(opt => JSON.stringify(opt)));
          console.log('  answer:', JSON.stringify(question.answer));
          
          // Check if answer is in options
          if (question.options.includes(question.answer)) {
            console.log('  ✅ Answer is in options');
          } else {
            console.log('  ❌ Answer is NOT in options');
            
            // Check for potential whitespace issues
            const trimmedAnswer = question.answer.trim();
            const matchingOption = question.options.find(opt => opt.trim() === trimmedAnswer);
            if (matchingOption) {
              console.log(`  ℹ️  Answer matches option "${matchingOption}" after trimming`);
            }
            
            // Check for case-insensitive matches
            const caseInsensitiveMatch = question.options.find(opt => 
              opt.toLowerCase() === question.answer.toLowerCase());
            if (caseInsensitiveMatch) {
              console.log(`  ℹ️  Answer matches option "${caseInsensitiveMatch}" case-insensitively`);
            }
          }
        });
      } else {
        console.log('No quiz data found');
      }
    } else {
      const errorText = await response.text();
      console.log('❌ Failed to generate lesson:', errorText);
    }
  } catch (error) {
    console.error('❌ Error debugging quiz data:', error.message);
  }
  
  console.log('\n--- Quiz Data Debug completed ---');
}

// Run the debug script
debugQuizData().catch(console.error);