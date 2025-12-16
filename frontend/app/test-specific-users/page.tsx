'use client';

import { useState, useEffect } from 'react';

export default function TestSpecificUsersPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  const runTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-specific-users');
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  const testSpecificUser = async () => {
    if (!email.trim()) {
      alert('Please enter an email address');
      return;
    }
    
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/test-specific-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() })
      });
      
      const data = await response.json();
      setTestResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Auto-run the test when the page loads
    runTest();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Test Specific Users</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Test Specific Email</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email to test"
            style={{ 
              padding: '10px', 
              flex: 1, 
              border: '1px solid #ccc', 
              borderRadius: '5px' 
            }}
          />
          <button 
            onClick={testSpecificUser}
            disabled={loading}
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#0070f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            Test Email
          </button>
        </div>
      </div>
      
      <button 
        onClick={runTest}
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#28a745', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Run Full Test'}
      </button>
      
      {error && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: '#ffebee', 
          border: '1px solid #ff5252', 
          borderRadius: '5px',
          marginBottom: '20px'
        }}>
          <h2>Error</h2>
          <pre>{error}</pre>
        </div>
      )}
      
      {testResult && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: testResult.success ? '#e8f5e8' : '#ffebee', 
          border: `1px solid ${testResult.success ? '#4caf50' : '#ff5252'}`, 
          borderRadius: '5px'
        }}>
          <h2>Test Result</h2>
          <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
            {JSON.stringify(testResult, null, 2)}
          </pre>
        </div>
      )}
      
      <div style={{ marginTop: '30px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '5px' }}>
        <h3>Test Information</h3>
        <p>This test verifies:</p>
        <ul>
          <li>Specific user authentication status</li>
          <li>Email confirmation status</li>
          <li>User existence in Supabase Auth</li>
        </ul>
      </div>
    </div>
  );
}