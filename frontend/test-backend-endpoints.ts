async function testBackendEndpoints() {
  console.log('Testing backend endpoints...\n');

  // Test structured lesson endpoint
  console.log('--- Testing Structured Lesson Endpoint ---');
  try {
    const lessonResponse = await fetch('https://api.lanamind.com/api/structured-lesson', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        topic: 'photosynthesis',
        age: 12
      })
    });
    const lessonData = await lessonResponse.json();
    console.log('Status:', lessonResponse.status);
    console.log('Response keys:', Object.keys(lessonData));
    console.log('Has introduction:', 'introduction' in lessonData);
    console.log('Has sections:', 'sections' in lessonData);
    console.log('Has quiz:', 'quiz' in lessonData);
    console.log('');
  } catch (error) {
    console.error('Lesson endpoint error:', error);
  }

  // Test chat endpoint
  console.log('--- Testing Chat Endpoint ---');
  try {
    const chatResponse = await fetch('https://api.lanamind.com/api/chat/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id: 'test_user',
        message: '/chat Hello, how are you?',
        age: 12,
        mode: 'chat'
      })
    });
    const chatData = await chatResponse.json();
    console.log('Status:', chatResponse.status);
    console.log('Response keys:', Object.keys(chatData));
    console.log('Mode:', chatData.mode);
    console.log('Has reply:', 'reply' in chatData);
    console.log('Reply type:', typeof chatData.reply);
    console.log('');
  } catch (error) {
    console.error('Chat endpoint error:', error);
  }

  // Test math solver endpoint
  console.log('--- Testing Math Solver Endpoint ---');
  try {
    const mathResponse = await fetch('https://api.lanamind.com/api/math-solver/solve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        problem: '2x + 5 = 15',
        show_steps: true
      })
    });
    const mathData = await mathResponse.json();
    console.log('Status:', mathResponse.status);
    console.log('Response keys:', Object.keys(mathData));
    console.log('Has problem:', 'problem' in mathData);
    console.log('Has solution:', 'solution' in mathData);
    console.log('Has steps:', 'steps' in mathData);
    console.log('');
  } catch (error) {
    console.error('Math solver endpoint error:', error);
  }
}

testBackendEndpoints();