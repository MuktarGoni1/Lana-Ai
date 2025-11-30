// __tests__/load-testing.ts
// Load testing utilities to verify system stability under stress

import { apiClient } from '@/lib/api-client';
import { apiMonitor } from '@/lib/monitoring';

interface LoadTestConfig {
  endpoint: string;
  concurrency: number;
  totalRequests: number;
  requestBody: any;
}

interface LoadTestResult {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  averageResponseTime: number;
  totalTime: number;
  requestsPerSecond: number;
}

/**
 * Run a load test on a specific endpoint
 * @param config Load test configuration
 * @returns Load test results
 */
export async function runLoadTest(config: LoadTestConfig): Promise<LoadTestResult> {
  const { endpoint, concurrency, totalRequests, requestBody } = config;
  
  console.log(`Starting load test for ${endpoint}`);
  console.log(`Concurrency: ${concurrency}, Total Requests: ${totalRequests}`);
  
  const startTime = Date.now();
  let successfulRequests = 0;
  let failedRequests = 0;
  
  // Clear previous metrics
  apiMonitor.clear();
  
  // Create batches of requests based on concurrency
  const batches = Math.ceil(totalRequests / concurrency);
  const results: Promise<any>[] = [];
  
  for (let batch = 0; batch < batches; batch++) {
    const batchSize = Math.min(concurrency, totalRequests - (batch * concurrency));
    const batchPromises: Promise<any>[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      const promise = apiClient.post(endpoint, requestBody)
        .then(() => {
          successfulRequests++;
        })
        .catch((error) => {
          failedRequests++;
          console.warn(`Request failed: ${error.message}`);
        });
      
      batchPromises.push(promise);
    }
    
    // Wait for this batch to complete before starting the next
    await Promise.all(batchPromises);
    
    // Add a small delay between batches to avoid overwhelming the server
    if (batch < batches - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  const endTime = Date.now();
  const totalTime = endTime - startTime;
  
  // Calculate metrics
  const errorRate = totalRequests > 0 ? (failedRequests / totalRequests) * 100 : 0;
  const averageResponseTime = apiMonitor.getAverageResponseTime(endpoint);
  const requestsPerSecond = totalTime > 0 ? (totalRequests / totalTime) * 1000 : 0;
  
  return {
    totalRequests,
    successfulRequests,
    failedRequests,
    errorRate,
    averageResponseTime,
    totalTime,
    requestsPerSecond
  };
}

/**
 * Run load tests on all major endpoints
 */
export async function runComprehensiveLoadTests() {
  console.log('Starting comprehensive load tests...');
  
  // Test structured lesson streaming endpoint
  const lessonTestResult = await runLoadTest({
    endpoint: '/api/structured-lesson/stream',
    concurrency: 3,
    totalRequests: 10,
    requestBody: {
      topic: 'Load Test Topic',
      age: 10
    }
  });
  
  console.log('Structured Lesson Endpoint Results:');
  console.log(formatTestResult(lessonTestResult));
  
  // Test TTS endpoint
  const ttsTestResult = await runLoadTest({
    endpoint: '/api/tts',
    concurrency: 2,
    totalRequests: 5,
    requestBody: {
      text: 'This is a load test for text to speech functionality.'
    }
  });
  
  console.log('TTS Endpoint Results:');
  console.log(formatTestResult(ttsTestResult));
  
  // Summary
  console.log('\n=== LOAD TEST SUMMARY ===');
  console.log(`Total tests run: 2`);
  console.log(`Overall success rate: ${((lessonTestResult.successfulRequests + ttsTestResult.successfulRequests) / (lessonTestResult.totalRequests + ttsTestResult.totalRequests) * 100).toFixed(2)}%`);
  
  return {
    lessonTestResult,
    ttsTestResult
  };
}

/**
 * Format test results for display
 */
function formatTestResult(result: LoadTestResult): string {
  return `
    Total Requests: ${result.totalRequests}
    Successful: ${result.successfulRequests}
    Failed: ${result.failedRequests}
    Error Rate: ${result.errorRate.toFixed(2)}%
    Average Response Time: ${result.averageResponseTime.toFixed(2)}ms
    Total Time: ${result.totalTime}ms
    Requests/Second: ${result.requestsPerSecond.toFixed(2)}
  `.trim();
}

// Example usage:
// runComprehensiveLoadTests().then(results => {
//   console.log('Load testing completed:', results);
// }).catch(error => {
//   console.error('Load testing failed:', error);
// });