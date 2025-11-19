'use client';

import { useState, useEffect } from 'react';

export default function AuthTestPage() {
  const [testResult, setTestResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runAuthTest = async () => {
    setLoading(true);
    setError(null);
    setTestResult(null);
    
    try {
      const response = await fetch('/api/auth-test');
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
    runAuthTest();
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1>Authentication Test</h1>
      
      <button 
        onClick={runAuthTest}
        disabled={loading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#0070f3', 
          color: 'white', 
          border: 'none', 
          borderRadius: '5px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Run Authentication Test'}
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
          <li>Environment variables are properly loaded</li>
          <li>Supabase admin client can be initialized</li>
          <li>User listing functionality works</li>
          <li>Data structure is as expected</li>
        </ul>
      </div>
    </div>
  );
}