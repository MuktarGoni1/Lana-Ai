// test-chat-modes.js
// Script to test all chat modes and verify they work correctly

async function testChatModes() {
  console.log('Testing Chat Modes...\n');
  
  const baseUrl = 'https://api.lanamind.com';
  const testUserId = 'test_user_123';
  const testAge = 12;
  
  // Test cases for each mode
  const testCases = [
    {
      mode: 'chat',
      message: 'Hello, how are you?',
      description: 'General chat mode'
    },
    {
      mode: 'quick',
      message: 'What is photosynthesis?',
      description: 'Quick answer mode'
    },
    {
      mode: 'lesson',
      message: 'Explain the water cycle',
      description: 'Structured lesson mode'
    },
    {
      mode: 'maths',
      message: 'Solve 2x + 5 = 15',
      description: 'Maths problem solving mode'
    }
  ];
  
  for (const testCase of testCases) {
    console.log(`Testing ${testCase.mode} mode: ${testCase.description}`);
    console.log(`Message: "${testCase.message}"`);
    
    try {
      const response = await fetch(`${baseUrl}/api/chat/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          user_id: testUserId,
          message: testCase.message,
          age: testAge,
          mode: testCase.mode
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log(`✓ Success - Status: ${response.status}`);
        console.log(`  Response mode: ${data.mode}`);
        console.log(`  Reply type: ${typeof data.reply}`);
        
        // Check if reply is a string or object
        if (typeof data.reply === 'string') {
          console.log(`  Reply preview: ${data.reply.substring(0, 100)}${data.reply.length > 100 ? '...' : ''}`);
        } else if (typeof data.reply === 'object') {
          console.log(`  Reply keys: ${Object.keys(data.reply).join(', ')}`);
        }
        
        // Verify mode consistency
        if (data.mode === testCase.mode) {
          console.log(`  ✓ Mode consistency verified`);
        } else {
          console.log(`  ✗ Mode mismatch: expected ${testCase.mode}, got ${data.mode}`);
        }
      } else {
        const errorText = await response.text();
        console.log(`✗ Error - Status: ${response.status}`);
        console.log(`  Error message: ${errorText}`);
      }
    } catch (error) {
      console.log(`✗ Exception: ${error.message}`);
    }
    
    console.log('---\n');
  }
  
  console.log('Chat modes testing completed.');
}

// Run the test
testChatModes().catch(console.error);