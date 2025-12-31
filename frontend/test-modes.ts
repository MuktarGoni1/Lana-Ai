async function testModes() {
  const userId = 'test_user_' + Date.now();
  const testCases = [
    { mode: 'chat', message: 'Hello, how are you?', description: 'Chat mode' },
    { mode: 'quick', message: 'What is photosynthesis?', description: 'Quick answer mode' },
    { mode: 'lesson', message: 'Explain photosynthesis', description: 'Lesson mode' },
    { mode: 'maths', message: 'Solve 2x + 5 = 15', description: 'Maths mode' }
  ];

  for (const testCase of testCases) {
    console.log(`\n--- Testing ${testCase.description} (${testCase.mode}) ---`);
    try {
      const response = await fetch('https://api.lanamind.com/api/chat/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: '/' + testCase.mode + ' ' + testCase.message,
          age: 12,
          mode: testCase.mode
        })
      });
      const data = await response.json();
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(data, null, 2));
    } catch (error: any) {
      console.error('Error:', error.message);
    }
  }
}

testModes();