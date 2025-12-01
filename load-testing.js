// load-testing.js
// Load testing script for Lana AI application

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const requestsPerSecond = new Counter('requests_per_second');

// Test options
export const options = {
  stages: [
    // Ramp up to 50 users over 1 minute
    { duration: '1m', target: 50 },
    // Stay at 50 users for 3 minutes
    { duration: '3m', target: 50 },
    // Ramp down to 0 users over 1 minute
    { duration: '1m', target: 0 },
  ],
  thresholds: {
    // 95% of requests should be below 2 seconds
    http_req_duration: ['p(95)<2000'],
    // Error rate should be less than 1%
    errors: ['rate<0.01'],
  },
};

// Base URL for the API
const BASE_URL = 'http://localhost:8000'; // Change to your actual API URL

// Test data
const testTopics = [
  'Photosynthesis',
  'Cellular Respiration',
  'Newton\'s Laws',
  'World War II',
  'Shakespeare',
  'Algebra',
  'Geometry',
  'Chemical Reactions',
  'Electricity',
  'Climate Change'
];

export default function () {
  // Simulate user behavior with different API calls
  
  // 1. Health check (10% of requests)
  if (Math.random() < 0.1) {
    const res = http.get(`${BASE_URL}/health`);
    check(res, {
      'health check status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    requestsPerSecond.add(1);
  }
  // 2. Structured lesson generation (70% of requests)
  else if (Math.random() < 0.8) {
    const topic = testTopics[Math.floor(Math.random() * testTopics.length)];
    const age = Math.floor(Math.random() * 10) + 8; // Ages 8-17
    
    const payload = JSON.stringify({
      topic: topic,
      age: age
    });
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const res = http.post(`${BASE_URL}/api/structured-lesson`, payload, params);
    check(res, {
      'structured lesson status is 200': (r) => r.status === 200,
      'structured lesson has introduction': (r) => {
        if (r.status === 200) {
          const body = JSON.parse(r.body);
          return body.introduction && body.introduction.length > 0;
        }
        return false;
      },
    });
    errorRate.add(res.status !== 200);
    requestsPerSecond.add(1);
  }
  // 3. Math problem solving (15% of requests)
  else if (Math.random() < 0.95) {
    const problems = [
      'Solve for x: 2x + 5 = 15',
      'What is the area of a circle with radius 5?',
      'Simplify: (x^2 + 2x + 1) / (x + 1)',
      'Find the derivative of f(x) = x^2',
      'Solve the quadratic equation: x^2 - 5x + 6 = 0'
    ];
    
    const problem = problems[Math.floor(Math.random() * problems.length)];
    const age = Math.floor(Math.random() * 10) + 8; // Ages 8-17
    
    const payload = JSON.stringify({
      problem: problem,
      age: age
    });
    
    const params = {
      headers: {
        'Content-Type': 'application/json',
      },
    };
    
    const res = http.post(`${BASE_URL}/api/solve-math`, payload, params);
    check(res, {
      'math solve status is 200': (r) => r.status === 200,
      'math solve has solution': (r) => {
        if (r.status === 200) {
          const body = JSON.parse(r.body);
          return body.solution && body.solution.length > 0;
        }
        return false;
      },
    });
    errorRate.add(res.status !== 200);
    requestsPerSecond.add(1);
  }
  // 4. Cache stats (5% of requests)
  else {
    const res = http.get(`${BASE_URL}/api/cache/stats`);
    check(res, {
      'cache stats status is 200': (r) => r.status === 200,
    });
    errorRate.add(res.status !== 200);
    requestsPerSecond.add(1);
  }
  
  // Add a small delay to simulate real user behavior
  sleep(Math.random() * 2 + 1); // 1-3 seconds
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'load-test-results.json': JSON.stringify(data, null, 2),
  };
}