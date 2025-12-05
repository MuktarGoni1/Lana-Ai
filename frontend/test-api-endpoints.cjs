const https = require('https');

// Import API base configuration
const { API_BASE } = require('./lib/api-config.js');

// Extract hostname and port from API_BASE
const apiBaseUrl = new URL(API_BASE || 'https://api.lanamind.com');
const hostname = apiBaseUrl.hostname;
const port = apiBaseUrl.port || (apiBaseUrl.protocol === 'https:' ? 443 : 80);

// Function to make HTTP requests
function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: hostname,
      port: port,
      path: path,
      ...options
    };
    
    const req = https.get(requestOptions, (res) => {
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

// Function to make POST requests
function makePostRequest(path, postData, options = {}) {
  return new Promise((resolve, reject) => {
    const requestOptions = {
      hostname: hostname,
      port: port,
      path: path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        ...options.headers
      }
    };
    
    const req = https.request(requestOptions, (res) => {
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
    
    req.write(postData);
    req.end();
  });
}

// Test frontend response handling
async function testFrontendResponses() {
  console.log("Testing frontend API response handling...\n");
  
  try {
    // Test 1: Health endpoint
    console.log("1. Testing health endpoint...");
    const healthResponse = await makeRequest('/health');
    console.log(`   Status: ${healthResponse.statusCode}`);
    console.log(`   Data: ${JSON.stringify(healthResponse.data)}`);
    
    // Test 2: Root endpoint
    console.log("\n2. Testing root endpoint...");
    const rootResponse = await makeRequest('/');
    console.log(`   Status: ${rootResponse.statusCode}`);
    console.log(`   Data: ${JSON.stringify(rootResponse.data)}`);
    
    // Test 3: Cache reset endpoint
    console.log("\n3. Testing cache reset endpoint...");
    const cacheResponse = await makePostRequest('/api/cache/reset', '');
    console.log(`   Status: ${cacheResponse.statusCode}`);
    console.log(`   Data: ${JSON.stringify(cacheResponse.data)}`);
    
    // Test 4: Lessons endpoint
    console.log("\n4. Testing lessons endpoint...");
    const lessonsResponse = await makeRequest('/api/lessons/');
    console.log(`   Status: ${lessonsResponse.statusCode}`);
    console.log(`   Data (first 3 items): ${JSON.stringify(lessonsResponse.data.slice(0, 3))}`);
    
    // Test 5: Structured lesson endpoint
    console.log("\n5. Testing structured lesson endpoint...");
    const lessonData = JSON.stringify({ topic: "photosynthesis", age: 12 });
    
    const lessonResponse = await makePostRequest('/api/structured-lesson', lessonData);
    
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
    
    const mathResponse = await makePostRequest('/api/math-solver/solve', mathData);
    
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