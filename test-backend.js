/**
 * Comprehensive test script to test all modes of the Lana AI backend
 */

async function testMode(mode, message, userId = "test_user_123", age = 10) {
  const url = 'https://lana-ai.onrender.com/api/chat';
  
  const testData = {
    user_id: userId,
    message: message,
    age: age
  };

  try {
    console.log(`\n--- Testing ${mode} Mode ---`);
    console.log('Request data:', JSON.stringify(testData, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    console.log('Response Status:', response.status);

    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log('Mode:', result.mode);
      console.log('Reply Preview:', result.reply.substring(0, 100) + '...');
      
      if (result.quiz && result.quiz.length > 0) {
        console.log(`Quiz: ${result.quiz.length} questions found`);
        // Show first quiz question as example
        console.log('First Question:', JSON.stringify(result.quiz[0], null, 2));
      } else {
        console.log('No quiz data available');
      }
      
      if (result.error) {
        console.log('Error:', result.error);
      }
      
      return result;
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:');
      console.log(errorText);
      return null;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return null;
  }
}

// Test all modes
async function testAllModes() {
  console.log('=== Testing All Lana AI Modes ===\n');

  // Test 1: Default mode (structured lesson)
  const defaultResult = await testMode(
    "Default", 
    "/default Explain the water cycle", 
    "test_user_default"
  );

  // Test 2: Maths mode
  const mathsResult = await testMode(
    "Maths", 
    "/maths Solve for x: 2x + 5 = 15", 
    "test_user_maths",
    12
  );

  // Test 3: Chat mode
  const chatResult = await testMode(
    "Chat", 
    "/chat What's the weather like today?", 
    "test_user_chat",
    8
  );

  // Test 4: Quick mode
  const quickResult = await testMode(
    "Quick", 
    "/quick What is the capital of Japan?", 
    "test_user_quick",
    10
  );

  // Test 5: No explicit mode (should default)
  const noModeResult = await testMode(
    "No Explicit Mode", 
    "Explain gravity", 
    "test_user_no_mode",
    10
  );

  console.log('\n=== Summary ===');
  console.log('Default Mode:', defaultResult ? '✅ Passed' : '❌ Failed');
  console.log('Maths Mode:', mathsResult ? '✅ Passed' : '❌ Failed');
  console.log('Chat Mode:', chatResult ? '✅ Passed' : '❌ Failed');
  console.log('Quick Mode:', quickResult ? '✅ Passed' : '❌ Failed');
  console.log('No Mode Specified:', noModeResult ? '✅ Passed' : '❌ Failed');

  // Check quiz availability
  console.log('\n=== Quiz Availability ===');
  console.log('Default Mode Quiz:', defaultResult?.quiz ? `✅ Yes (${defaultResult.quiz.length} questions)` : '❌ No');
  console.log('Maths Mode Quiz:', mathsResult?.quiz ? `✅ Yes (${mathsResult.quiz.length} questions)` : '❌ No');
  console.log('Chat Mode Quiz:', chatResult?.quiz ? `✅ Yes (${chatResult.quiz.length} questions)` : '❌ No');
  console.log('Quick Mode Quiz:', quickResult?.quiz ? `✅ Yes (${quickResult.quiz.length} questions)` : '❌ No');
  console.log('No Mode Quiz:', noModeResult?.quiz ? `✅ Yes (${noModeResult.quiz.length} questions)` : '❌ No');
}

// Also test the health endpoint
async function testHealthEndpoint() {
  const healthUrl = 'https://lana-ai.onrender.com/health';
  
  try {
    console.log('\n--- Testing Health Endpoint ---');
    console.log('Sending request to:', healthUrl);
    
    const response = await fetch(healthUrl);
    console.log('Health Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('Health Result:', JSON.stringify(result, null, 2));
      return result.status === 'ok';
    } else {
      const errorText = await response.text();
      console.log('Health Error:', errorText);
      return false;
    }
  } catch (error) {
    console.log('❌ Health Check Network Error:', error.message);
    return false;
  }
}

// Run the tests
async function runAllTests() {
  console.log('=== Lana AI Backend Comprehensive Test ===\n');

  const healthOk = await testHealthEndpoint();
  
  if (healthOk) {
    await testAllModes();
  } else {
    console.log('\n⚠️  Health check failed. Skipping mode tests.');
  }
  
  console.log('\n=== All Tests Completed ===');
}

runAllTests().catch((error) => {
  console.error('Test suite failed with error:', error);
});