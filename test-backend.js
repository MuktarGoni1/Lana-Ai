const https = require('https');

// Test the backend health endpoint
const options = {
  hostname: 'lana-ai.onrender.com',
  port: 443,
  path: '/health',
  method: 'GET'
};

const req = https.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  let data = '';
  res.on('data', chunk => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const jsonData = JSON.parse(data);
      console.log('Response:', jsonData);
    } catch (error) {
      console.log('Response (raw):', data);
    }
  });
});

req.on('error', error => {
  console.error('Error:', error.message);
});

req.end();