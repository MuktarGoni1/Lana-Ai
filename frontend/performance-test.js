/**
 * Performance Testing for Lana AI Frontend with Live Backend
 * This test measures response times for various API endpoints
 */

async function runPerformanceTest() {
  console.log('⚡ Starting Performance Test with Live Backend...\n');
  
  try {
    const { API_BASE } = await import('./lib/api-config.js');
    console.log('API Base URL:', API_BASE);
    
    // Test configurations
    const tests = [
      {
        name: 'Health Check',
        url: `${API_BASE}/health`,
        method: 'GET'
      },
      {
        name: 'Structured Lesson Generation',
        url: `${API_BASE}/api/structured-lesson`,
        method: 'POST',
        body: {
          topic: 'Performance testing basics',
          age: 15
        }
      },
      {
        name: 'Streaming Endpoint Connection',
        url: `${API_BASE}/api/structured-lesson/stream`,
        method: 'POST',
        body: {
          topic: 'Performance testing with streaming',
          age: 16
        }
      },
      {
        name: 'Math Solver',
        url: `${API_BASE}/api/math-solver/solve`,
        method: 'POST',
        body: {
          problem: 'Calculate 15 * 8',
          show_steps: false
        }
      }
    ];
    
    const results = [];
    
    // Run each test multiple times to get average performance
    for (const test of tests) {
      console.log(`\n📊 Testing: ${test.name}`);
      const times = [];
      
      // Run test 3 times
      for (let i = 0; i < 3; i++) {
        try {
          const startTime = Date.now();
          
          const options = {
            method: test.method,
            headers: {
              'Content-Type': 'application/json',
            }
          };
          
          if (test.body) {
            options.body = JSON.stringify(test.body);
          }
          
          const response = await fetch(test.url, options);
          const endTime = Date.now();
          const duration = endTime - startTime;
          
          times.push(duration);
          
          if (response.ok) {
            // Consume response body to complete the request
            await response.json();
            console.log(`   Run ${i + 1}: ${duration}ms ✅`);
          } else {
            console.log(`   Run ${i + 1}: ${duration}ms ❌ (Status: ${response.status})`);
          }
          
          // Small delay between requests
          await new Promise(resolve => setTimeout(resolve, 500));
        } catch (error) {
          console.log(`   Run ${i + 1}: Error - ${error.message}`);
        }
      }
      
      // Calculate statistics
      if (times.length > 0) {
        const avg = times.reduce((a, b) => a + b, 0) / times.length;
        const min = Math.min(...times);
        const max = Math.max(...times);
        
        results.push({
          name: test.name,
          avg: Math.round(avg),
          min,
          max,
          successRate: times.length / 3 * 100
        });
        
        console.log(`   Average: ${Math.round(avg)}ms | Min: ${min}ms | Max: ${max}ms | Success: ${times.length}/3`);
      }
    }
    
    // Summary
    console.log('\n📈 Performance Test Summary:');
    console.log('================================');
    results.forEach(result => {
      console.log(`${result.name}:`);
      console.log(`   Average Response Time: ${result.avg}ms`);
      console.log(`   Fastest Request: ${result.min}ms`);
      console.log(`   Slowest Request: ${result.max}ms`);
      console.log(`   Success Rate: ${result.successRate}%`);
      console.log('');
    });
    
    // Performance grading
    console.log('🏆 Performance Analysis:');
    console.log('========================');
    
    const overallAvg = results.reduce((sum, r) => sum + r.avg, 0) / results.length;
    
    if (overallAvg < 500) {
      console.log('   Overall Performance: ⭐ Excellent (< 500ms average)');
    } else if (overallAvg < 1000) {
      console.log('   Overall Performance: ✅ Good (500-1000ms average)');
    } else if (overallAvg < 2000) {
      console.log('   Overall Performance: ⚠️  Acceptable (1000-2000ms average)');
    } else {
      console.log('   Overall Performance: ❌ Poor (> 2000ms average)');
    }
    
    console.log(`   Average Response Time Across All Tests: ${Math.round(overallAvg)}ms`);
    
    // Identify slow endpoints
    const slowEndpoints = results.filter(r => r.avg > 1000);
    if (slowEndpoints.length > 0) {
      console.log('\n🐢 Slow Endpoints (> 1000ms):');
      slowEndpoints.forEach(ep => {
        console.log(`   - ${ep.name}: ${ep.avg}ms`);
      });
    }
    
    console.log('\n✅ Performance Test Completed!');
    
  } catch (error) {
    console.error('❌ Performance Test FAILED:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Run the performance test
runPerformanceTest();