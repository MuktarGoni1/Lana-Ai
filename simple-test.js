/**
 * Simple test script for Lana AI backend modes
 */

async function testMode(name, message) {
  const url = 'https://lana-ai.onrender.com/api/chat';
  
  const testData = {
    user_id: `test_${name.toLowerCase()}`,
    message: message,
    age: 10
  };

  try {
    console.log(`\n--- Testing ${name} Mode ---`);
    console.log('Message:', message);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log('Mode:', result.mode);
      console.log('Reply:', result.reply.substring(0, 100) + '...');
      
      if (result.quiz) {
        console.log(`Quiz: ${result.quiz.length} questions`);
      } else {
        console.log('No quiz');
      }
      
      return result;
    } else {
      console.log('❌ Error:', response.status);
      return null;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return null;
  }
}

async function runTests() {
  console.log('=== Lana AI Mode Tests ===');
  
  // Test Default mode
  await testMode("Default", "/default Water cycle");
  
  // Test Maths mode
  await testMode("Maths", "/maths 2+2");
  
  // Test Chat mode
  await testMode("Chat", "/chat Hello");
  
  // Test Quick mode
  await testMode("Quick", "/quick Capital of France");
  
  console.log('\n=== Tests Complete ===');
}

runTests();