/**
 * Single mode test for Lana AI backend
 */

async function testSingleMode() {
  const url = 'https://lana-ai.onrender.com/api/chat';
  
  const testData = {
    user_id: "test_user_single",
    message: "/default Explain photosynthesis",
    age: 10
  };

  try {
    console.log('Testing single mode with message:', testData.message);
    console.log('Sending to:', url);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    console.log('Response Status:', response.status);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success!');
      console.log('Mode:', result.mode);
      console.log('Reply Length:', result.reply.length, 'characters');
      console.log('Reply Preview:', result.reply.substring(0, 150) + '...');
      
      if (result.quiz) {
        console.log(`Quiz: ${result.quiz.length} questions`);
        console.log('First Question:', result.quiz[0].q);
        console.log('Answer Options:', result.quiz[0].options.length);
      } else {
        console.log('No quiz data available');
      }
      
      return result;
    } else {
      const errorText = await response.text();
      console.log('❌ Error Response:', response.status);
      console.log('Error Details:', errorText);
      return null;
    }
  } catch (error) {
    console.log('❌ Network Error:', error.message);
    return null;
  }
}

testSingleMode().then(result => {
  console.log('\nSingle mode test completed');
});