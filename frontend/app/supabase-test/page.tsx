'use client';

import { useState, useEffect } from 'react';

export default function SupabaseTestPage() {
  const [testResult, setTestResult] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [action, setAction] = useState<'test' | 'users' | 'search'>('test');
  const [email, setEmail] = useState<string>('');

  const runTest = async () => {
    setLoading(true);
    setTestResult('Running test...');
    
    try {
      let url = '/api/supabase-test?action=' + action;
      if (action === 'search' && email) {
        url += '&email=' + encodeURIComponent(email);
      }
      
      const response = await fetch(url);
      const result = await response.text();
      setTestResult(result);
    } catch (error: any) {
      setTestResult(`Error: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Supabase Connection Test</h1>
          
          <div className="space-y-4">
            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => setAction('test')}
                className={`px-4 py-2 rounded-md ${
                  action === 'test' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Run Full Test
              </button>
              
              <button
                onClick={() => setAction('users')}
                className={`px-4 py-2 rounded-md ${
                  action === 'users' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Get All Users
              </button>
              
              <button
                onClick={() => setAction('search')}
                className={`px-4 py-2 rounded-md ${
                  action === 'search' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Search Users
              </button>
            </div>
            
            {action === 'search' && (
              <div className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter email to search"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            )}
            
            <button
              onClick={runTest}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Running...
                </>
              ) : (
                'Run Test'
              )}
            </button>
          </div>
          
          {testResult && (
            <div className="mt-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">Test Results</h2>
              <pre className="bg-gray-100 p-4 rounded-md overflow-auto max-h-96 text-sm whitespace-pre-wrap">
                {testResult}
              </pre>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}