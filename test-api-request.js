const https = require('https');

const data = JSON.stringify({
  email: 'test@example.com'
});

const options = {
  hostname: 'lanamind.onrender.com',
  port: 443,
  path: '/api/auth/verify-email',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, res => {
  console.log(`Status Code: ${res.statusCode}`);
  
  res.on('data', d => {
    process.stdout.write(d);
  });
});

req.on('error', error => {
  console.error('Error:', error);
});

req.write(data);
req.end();