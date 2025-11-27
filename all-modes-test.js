/**
 * Test all modes for Lana AI backend
 */

async function testMode(name, message, age = 10) {
  const url = 'https://lana-ai.onrender.com/api/chat';
  
  const testData = {
    user_id: `test_user_${name.toLowerCase()}`,
    message: message,
    age: age
  };

  try {
    console.log(`\n--- Testing ${name} Mode ---`);
    console.log('Message:', message);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log('Detected Mode:', result.mode);
      console.log('Reply Length:', result.reply.length, 'characters');
      
      // Show a brief preview of the reply
      const preview = result.reply.substring(0, 100).replace(/\s+/g, ' ').trim();
      console.log('Reply Preview:', preview + (result.reply.length > 100 ? '...' : ''));
      
      // Check quiz data
      if (result.quiz && Array.isArray(result.quiz) && result.quiz.length > 0) {
        console.log(`✅ Quiz Available: ${result.quiz.length} questions`);
        const firstQuestion = result.quiz[0];
        console.log('  First Q:', firstQuestion.q);
        console.log('  Options:', firstQuestion.options.length);
        console.log('  Has Answer:', !!firstQuestion.answer);
      } else {
        console.log('❌ No Quiz Data');
      }
      
      return { success: true, mode: result.mode, hasQuiz: !!(result.quiz && result.quiz.length > 0) };
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', response.status);
      console.log('Error Details:', errorText.substring(0, 100) + '...');
      return { success: false, mode: null, hasQuiz: false };
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return { success: false, mode: null, hasQuiz: false };
  }
}

async function runAllTests() {
  console.log('=== Testing All Lana AI Modes ===\n');
  
  // Store results
  const results = [];
  
  // Test 1: Default mode (structured lesson)
  const defaultResult = await testMode("Default", "/default Explain the solar system");
  results.push({ mode: "Default", ...defaultResult });
  
  // Test 2: Maths mode
  const mathsResult = await testMode("Maths", "/maths What is 15 + 27?", 12);
  results.push({ mode: "Maths", ...mathsResult });
  
  // Test 3: Chat mode
  const chatResult = await testMode("Chat", "/chat How are you today?", 8);
  results.push({ mode: "Chat", ...chatResult });
  
  // Test 4: Quick mode
  const quickResult = await testMode("Quick", "/quick What is the largest ocean?");
  results.push({ mode: "Quick", ...quickResult });
  
  // Test 5: No explicit mode (should default)
  const noModeResult = await testMode("NoExplicit", "Tell me about dinosaurs");
  results.push({ mode: "NoExplicit", ...noModeResult });
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log('Mode\t\tSuccess\tQuiz\tDetected Mode');
  console.log('----\t\t------\t----\t-------------');
  
  for (const result of results) {
    console.log(
      `${result.mode}\t\t${result.success ? '✅' : '❌'}\t${result.hasQuiz ? '✅' : '❌'}\t${result.mode || 'N/A'}`
    );
  }
  
  // Count successes
  const successfulTests = results.filter(r => r.success).length;
  const quizAvailable = results.filter(r => r.hasQuiz).length;
  
  console.log(`\n✅ ${successfulTests}/${results.length} modes working`);
  console.log(`✅ ${quizAvailable}/${results.length} modes with quiz functionality`);
  
  if (successfulTests === results.length) {
    console.log('\n🎉 All modes are functioning correctly!');
  } else {
    console.log('\n⚠️  Some modes have issues.');
  }
}

runAllTests();