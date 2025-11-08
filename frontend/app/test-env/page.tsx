'use client';

import { useEffect, useState } from 'react';

export default function TestEnvPage() {
  const [envVars, setEnvVars] = useState<Record<string, string | undefined>>({});

  useEffect(() => {
    // Check environment variables on client side
    setEnvVars({
      NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    });
  }, []);

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <h1 className="text-2xl font-bold mb-6">Environment Variables Test</h1>
      <div className="space-y-4">
        {Object.entries(envVars).map(([key, value]) => (
          <div key={key} className="bg-white/10 p-4 rounded-lg">
            <div className="font-mono text-sm text-blue-300">{key}</div>
            <div className="font-mono text-lg break-all mt-2">
              {value || <span className="text-red-400">Not set</span>}
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-8 p-4 bg-yellow-900/30 rounded-lg">
        <h2 className="text-lg font-semibold mb-2">Debug Information</h2>
        <p>If NEXT_PUBLIC_API_BASE shows as &quot;Not set&quot; or shows localhost:8000, the environment variables are not being loaded properly.</p>
        <p className="mt-2">Expected value: https://lana-ai.onrender.com</p>
      </div>
    </div>
  );
}