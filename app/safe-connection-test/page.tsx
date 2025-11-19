'use client';

import { useState } from 'react';

export default function SafeConnectionTestPage() {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runTest = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      const response = await fetch('/api/safe-connection-test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      setResult(data);
    } catch (error) {
      setResult({ error: 'Failed to fetch', details: error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-800">Safe Connection Test</h1>
        <p className="mb-6 text-gray-600">
          This test checks Supabase connections without triggering rate limits.
        </p>
        
        <button
          onClick={runTest}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg disabled:opacity-50 transition-colors duration-200"
        >
          {loading ? 'Testing...' : 'Run Safe Connection Test'}
        </button>
        
        {result && (
          <div className="mt-6 p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Test Result:</h2>
            <pre className="whitespace-pre-wrap bg-gray-100 p-4 rounded-lg text-sm">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}