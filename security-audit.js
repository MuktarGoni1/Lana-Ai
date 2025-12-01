// security-audit.js
// Security audit script for Lana AI application

import http from 'k6/http';
import { check, group } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const securityIssues = new Rate('security_issues');

// Test options
export const options = {
  vus: 1,
  iterations: 1,
  thresholds: {
    security_issues: ['rate<0.01'], // Less than 1% security issues
  },
};

// Base URL for the API
const BASE_URL = 'http://localhost:8000'; // Change to your actual API URL

export default function () {
  // Security tests
  group('Security Audit', function () {
    // Test 1: Check for security headers
    group('Security Headers', function () {
      const res = http.get(BASE_URL);
      
      check(res, {
        'X-Content-Type-Options is set': (r) => r.headers['X-Content-Type-Options'] === 'nosniff',
        'X-Frame-Options is set': (r) => r.headers['X-Frame-Options'] === 'DENY',
        'X-XSS-Protection is set': (r) => r.headers['X-XSS-Protection'] === '1; mode=block',
      }) || securityIssues.add(1);
    });
    
    // Test 2: Check for sensitive information exposure
    group('Sensitive Information Exposure', function () {
      // Test with invalid endpoint
      const res = http.get(`${BASE_URL}/invalid-endpoint`);
      
      check(res, {
        'Does not expose server information': (r) => !r.headers['Server'] || !r.headers['X-Powered-By'],
        'Does not expose framework details': (r) => {
          const body = r.body || '';
          return !body.includes('Django') && 
                 !body.includes('Express') && 
                 !body.includes('Rails') &&
                 !body.includes('Laravel');
        },
      }) || securityIssues.add(1);
    });
    
    // Test 3: Check for SQL injection vulnerabilities
    group('SQL Injection Prevention', function () {
      const payloads = [
        "' OR '1'='1",
        "'; DROP TABLE users; --",
        "' UNION SELECT * FROM users --",
        "admin'--"
      ];
      
      payloads.forEach(payload => {
        const res = http.post(`${BASE_URL}/api/structured-lesson`, JSON.stringify({
          topic: payload,
          age: 12
        }), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        check(res, {
          'Handles SQL injection payloads safely': (r) => r.status !== 500,
        }) || securityIssues.add(1);
      });
    });
    
    // Test 4: Check for XSS vulnerabilities
    group('XSS Prevention', function () {
      const payloads = [
        '<script>alert("XSS")</script>',
        '"><script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src=x onerror=alert("XSS")>'
      ];
      
      payloads.forEach(payload => {
        const res = http.post(`${BASE_URL}/api/structured-lesson`, JSON.stringify({
          topic: payload,
          age: 12
        }), {
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        check(res, {
          'Handles XSS payloads safely': (r) => {
            if (r.status === 200) {
              const body = r.body || '';
              return !body.includes('<script>') && 
                     !body.includes('javascript:') &&
                     !body.includes('onerror=');
            }
            return true; // If not 200, it's handled safely
          },
        }) || securityIssues.add(1);
      });
    });
    
    // Test 5: Check authentication requirements
    group('Authentication Requirements', function () {
      // Try to access protected endpoints without authentication
      const protectedEndpoints = [
        '/api/history',
        '/api/profile'
      ];
      
      protectedEndpoints.forEach(endpoint => {
        const res = http.get(`${BASE_URL}${endpoint}`);
        
        check(res, {
          'Requires authentication for protected endpoints': (r) => r.status === 401 || r.status === 403,
        }) || securityIssues.add(1);
      });
    });
    
    // Test 6: Check rate limiting
    group('Rate Limiting', function () {
      const requests = [];
      
      // Make multiple rapid requests to test rate limiting
      for (let i = 0; i < 10; i++) {
        requests.push(http.post(`${BASE_URL}/api/structured-lesson`, JSON.stringify({
          topic: 'Test Topic',
          age: 12
        }), {
          headers: {
            'Content-Type': 'application/json',
          },
        }));
      }
      
      // Check if any requests were rate limited
      const rateLimited = requests.some(res => res.status === 429);
      
      check(null, {
        'Implements rate limiting': () => rateLimited,
      }) || securityIssues.add(1);
    });
  });
}

export function handleSummary(data) {
  return {
    'stdout': JSON.stringify(data, null, 2),
    'security-audit-results.json': JSON.stringify(data, null, 2),
  };
}