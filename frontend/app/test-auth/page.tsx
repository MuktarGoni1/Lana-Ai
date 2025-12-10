"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUnifiedAuth } from "@/contexts/UnifiedAuthContext";

export default function TestAuthPage() {
  const [testEmail, setTestEmail] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const router = useRouter();
  const { user, loginWithEmail, logout } = useUnifiedAuth();

  const handleRegisterParent = async () => {
    if (!testEmail) return;
    
    setIsRegistering(true);
    try {
      const response = await fetch('/api/auth/register-parent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testEmail }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to send magic link');
      }
      
      alert(`Magic link sent to ${testEmail}. Check your email and click the link to complete registration.`);
    } catch (error) {
      console.error('Registration error:', error);
      alert('Failed to register. Please try again.');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleLogin = async () => {
    if (!testEmail) return;
    
    setIsLoggingIn(true);
    try {
      const result = await loginWithEmail(testEmail);
      if (result.success) {
        alert(`Magic link sent to ${testEmail}. Check your email and click the link to login.`);
      } else {
        throw new Error(result.error || 'Failed to send magic link');
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Failed to login. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      alert('Logged out successfully.');
    } catch (error) {
      console.error('Logout error:', error);
      alert('Failed to logout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Authentication Test</h1>
        
        {user ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Authenticated User</h2>
            <p className="mb-2">Email: {user.email}</p>
            <p className="mb-2">User ID: {user.id}</p>
            <p className="mb-4">Role: {user.user_metadata?.role || 'Not set'}</p>
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>
        ) : (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 mb-8">
            <h2 className="text-2xl font-semibold mb-4">Not Authenticated</h2>
            <p className="mb-4">Please register or login to continue.</p>
          </div>
        )}
        
        <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6">
          <h2 className="text-2xl font-semibold mb-4">Test Authentication Flow</h2>
          
          <div className="mb-4">
            <label htmlFor="testEmail" className="block text-sm font-medium mb-2">
              Test Email
            </label>
            <input
              id="testEmail"
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
              className="w-full px-4 py-2 rounded-lg bg-white/[0.03] border border-white/[0.05] text-white"
            />
          </div>
          
          <div className="flex gap-4">
            <button
              onClick={handleRegisterParent}
              disabled={isRegistering || !testEmail}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 rounded-lg transition-colors"
            >
              {isRegistering ? 'Sending...' : 'Register Parent'}
            </button>
            
            <button
              onClick={handleLogin}
              disabled={isLoggingIn || !testEmail}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:bg-green-500/50 rounded-lg transition-colors"
            >
              {isLoggingIn ? 'Sending...' : 'Login'}
            </button>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 rounded-lg transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
}