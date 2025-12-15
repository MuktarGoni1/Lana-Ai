/**
 * API Monitoring Script
 * Tracks API response times and success rates
 */

class ApiMonitor {
  constructor() {
    this.metrics = {
      health: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
      structuredLesson: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
      mathSolver: { calls: 0, successes: 0, failures: 0, totalTime: 0 },
      tts: { calls: 0, successes: 0, failures: 0, totalTime: 0 }
    };
  }

  recordCall(endpoint, startTime, success, errorCode = null) {
    const duration = Date.now() - startTime;
    const metric = this.metrics[endpoint];
    
    if (metric) {
      metric.calls++;
      if (success) {
        metric.successes++;
      } else {
        metric.failures++;
        if (errorCode) {
          console.log(`⚠️  ${endpoint} failed with error code: ${errorCode}`);
        }
      }
      metric.totalTime += duration;
    }
  }

  getStats() {
    const stats = {};
    for (const [endpoint, data] of Object.entries(this.metrics)) {
      const avgTime = data.calls > 0 ? (data.totalTime / data.calls).toFixed(2) : 0;
      const successRate = data.calls > 0 ? ((data.successes / data.calls) * 100).toFixed(2) : 0;
      
      stats[endpoint] = {
        calls: data.calls,
        successRate: `${successRate}%`,
        averageResponseTime: `${avgTime}ms`
      };
    }
    return stats;
  }

  printReport() {
    console.log('\n📊 API Monitoring Report');
    console.log('=====================');
    
    const stats = this.getStats();
    for (const [endpoint, data] of Object.entries(stats)) {
      console.log(`\n${endpoint}:`);
      console.log(`  Calls: ${data.calls}`);
      console.log(`  Success Rate: ${data.successRate}`);
      console.log(`  Average Response Time: ${data.averageResponseTime}`);
    }
  }
}

// Initialize monitor
const apiMonitor = new ApiMonitor();

// Test function with monitoring
async function monitoredApiCall(endpoint, url, options = {}) {
  const startTime = Date.now();
  let success = false;
  let errorCode = null;

  try {
    const response = await fetch(url, options);
    success = response.ok;
    if (!success) {
      errorCode = response.status;
    }
    apiMonitor.recordCall(endpoint, startTime, success, errorCode);
    return response;
  } catch (error) {
    errorCode = 'NETWORK_ERROR';
    apiMonitor.recordCall(endpoint, startTime, false, errorCode);
    throw error;
  }
}

// Example usage
async function runMonitoredTests() {
  console.log('🔍 Running Monitored API Tests...\n');
  
  const API_BASE = 'https://api.lanamind.com';
  const TEST_TOPIC = 'Photosynthesis';
  const TEST_AGE = 12;
  const TEST_MATH_PROBLEM = 'Solve for x: 2x + 5 = 15';

  try {
    // Test Health endpoint
    console.log('1️⃣ Testing Health Endpoint...');
    const healthResponse = await monitoredApiCall('health', `${API_BASE}/health`);
    console.log(`   Status: ${healthResponse.status} ${healthResponse.ok ? '✅' : '❌'}`);

    // Test Structured Lesson endpoint
    console.log('\n2️⃣ Testing Structured Lesson Endpoint...');
    const lessonResponse = await monitoredApiCall('structuredLesson', `${API_BASE}/api/structured-lesson`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topic: TEST_TOPIC,
        age: TEST_AGE
      })
    });
    console.log(`   Status: ${lessonResponse.status} ${lessonResponse.ok ? '✅' : '❌'}`);

    // Test Math Solver endpoint
    console.log('\n3️⃣ Testing Math Solver Endpoint...');
    const mathResponse = await monitoredApiCall('mathSolver', `${API_BASE}/api/math-solver/solve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        problem: TEST_MATH_PROBLEM,
        show_steps: true
      })
    });
    console.log(`   Status: ${mathResponse.status} ${mathResponse.ok ? '✅' : '❌'}`);

    // Test TTS endpoint
    console.log('\n4️⃣ Testing TTS Endpoint...');
    const ttsResponse = await monitoredApiCall('tts', `${API_BASE}/api/tts/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: `This is a test of the text to speech service.`
      })
    });
    console.log(`   Status: ${ttsResponse.status} ${ttsResponse.ok ? '✅' : '❌'}`);

    // Print final report
    apiMonitor.printReport();

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the monitored tests
runMonitoredTests();

// Export for use in other modules
module.exports = { ApiMonitor, monitoredApiCall };