const https = require('https');

// Test health endpoint
console.log('Testing health endpoint...');
const healthReq = https.get('http://lana-ai.onrender.com/health', (res) => {
  console.log(`Health status code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Health response:', data);
    
    // Test structured lesson endpoint
    console.log('\nTesting structured lesson endpoint...');
    const postData = JSON.stringify({
      topic: 'Mahogany',
      age: 10
    });
    
    const options = {
      hostname: 'lana-ai.onrender.com',
      port: 80,
      path: '/api/structured-lesson',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const lessonReq = https.request(options, (res) => {
      console.log(`Lesson status code: ${res.statusCode}`);
      
      let lessonData = '';
      res.on('data', (chunk) => {
        lessonData += chunk;
      });
      
      res.on('end', () => {
        console.log('Lesson response:', lessonData);
        
        try {
          const jsonData = JSON.parse(lessonData);
          if (jsonData.introduction && jsonData.introduction.includes('Unable to generate a detailed lesson')) {
            console.log('✅ SUCCESS: Error response detected instead of hardcoded template');
          } else if (jsonData.introduction && jsonData.introduction.startsWith('Let\'s learn about')) {
            console.log('❌ FAILURE: Still receiving hardcoded template response');
          } else {
            console.log('✅ SUCCESS: Received dynamic content (likely from LLM)');
          }
        } catch (e) {
          console.log('Response is not valid JSON');
        }
      });
    });
    
    lessonReq.on('error', (e) => {
      console.error('Lesson request error:', e.message);
    });
    
    lessonReq.write(postData);
    lessonReq.end();
  });
});

healthReq.on('error', (e) => {
  console.error('Health request error:', e.message);
});

healthReq.end();