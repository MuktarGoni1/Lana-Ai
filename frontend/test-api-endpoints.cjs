const https = require('https');

// Function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(data)
          });
        } catch (e) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: data
          });
        }
      });
    });
    
    req.on('error', (e) => {
      reject(e);
    });
    
    req.end();
  });
}

// Test frontend response handling
async function testFrontendResponses() {
  console.log("Testing frontend API response handling...\n");
  
  try {
    // Test 1: Health endpoint
    console.log("1. Testing health endpoint...");
    const healthResponse = await makeRequest('https://api.lanamind.com/health');
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Data: ${JSON.stringify(healthResponse.data)}`);
    
    // Test 2: Root endpoint
    console.log("\n2. Testing root endpoint...");
    const rootResponse = await makeRequest('https://api.lanamind.com/');
    console.log(`   Status: ${rootResponse.statusCode}`);
    console.log(`   Data: ${JSON.stringify(rootResponse.data)}`);
    
    // Test 3: Cache reset endpoint
    console.log("\n3. Testing cache reset endpoint...");
    const cacheResponse = await makeRequest('https://api.lanamind.com/api/cache/reset', {
      method: 'POST'
    });
    console.log(`   Status: ${cacheResponse.statusCode}`);
    console.log(`   Data: ${JSON.stringify(cacheResponse.data)}`);
    
    // Test 4: Lessons endpoint
    console.log("\n4. Testing lessons endpoint...");
    const lessonsResponse = await makeRequest('https://api.lanamind.com/api/lessons/');
    console.log(`   Status: ${lessonsResponse.statusCode}`);
    console.log(`   Data (first 3 items): ${JSON.stringify(lessonsResponse.data.slice(0, 3))}`);
    
    // Test 5: Structured lesson endpoint
    console.log("\n5. Testing structured lesson endpoint...");
    const lessonData = JSON.stringify({ topic: "photosynthesis", age: 12 });
    
    const lessonResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.lanamind.com',
        port: 443,
        path: '/api/structured-lesson',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': lessonData.length
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });
      
      req.on('error', (e) => {
        reject(e);
      });
      
      req.write(lessonData);
      req.end();
    });
    
    console.log(`   Status: ${lessonResponse.statusCode}`);
    if (lessonResponse.statusCode === 200) {
      console.log(`   Data keys: ${Object.keys(lessonResponse.data)}`);
      console.log(`   Introduction preview: ${lessonResponse.data.introduction?.substring(0, 100)}...`);
    } else {
      console.log(`   Error data: ${JSON.stringify(lessonResponse.data)}`);
    }
    
    // Test 6: Math solver endpoint
    console.log("\n6. Testing math solver endpoint...");
    const mathData = JSON.stringify({ problem: "2+2" });
    
    const mathResponse = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: 'api.lanamind.com',
        port: 443,
        path: '/api/math-solver/solve',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': mathData.length
        }
      }, (res) => {
        let data = '';
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          try {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: JSON.parse(data)
            });
          } catch (e) {
            resolve({
              statusCode: res.statusCode,
              headers: res.headers,
              data: data
            });
          }
        });
      });
      
      req.on('error', (e) => {
        reject(e);
      });
      
      req.write(mathData);
      req.end();
    });
    
    console.log(`   Status: ${mathResponse.statusCode}`);
    if (mathResponse.statusCode === 200) {
      console.log(`   Solution: ${mathResponse.data.solution}`);
    } else {
      console.log(`   Error data: ${JSON.stringify(mathResponse.data)}`);
    }
    
    console.log("\n✅ All API response tests completed successfully!");
    
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

// Run the tests
testFrontendResponses();