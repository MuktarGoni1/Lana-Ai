import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEnhancedAuth } from '@/hooks/useEnhancedAuth';
import { EnhancedAuthService } from '@/lib/services/enhancedAuthService';
import { AuthProvider } from '@/contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn(),
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
        // Simulate auth state changes
        callback('SIGNED_IN', { user: { id: '1', email: 'test@example.com' } });
        return { data: { subscription: { unsubscribe: jest.fn() } } };
      })
    }
  }
}));

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn()
  }),
  useSearchParams: () => ({
    get: jest.fn()
  })
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn()
  },
  writable: true
});

// Test component that uses the hook
const TestComponent = () => {
  const {
    user,
    isAuthenticated,
    isLoading,
    loginWithEmail,
    registerParent,
    logout
  } = useEnhancedAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
      <button onClick={() => loginWithEmail('test@example.com')} data-testid="login-button">
        Login
      </button>
      <button onClick={() => registerParent('parent@example.com')} data-testid="register-button">
        Register Parent
      </button>
      <button onClick={() => logout()} data-testid="logout-button">
        Logout
      </button>
    </div>
  );
};

describe('Enhanced Authentication System', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should initialize with loading state', async () => {
    const { supabase } = require('@/lib/db');
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('auth-status')).toHaveTextContent('loading');
  });

  test('should show authenticated state when user is logged in', async () => {
    const { supabase } = require('@/lib/db');
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: { id: '1', email: 'test@example.com' } },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Wait for the auth state to be updated
    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
    });
    
    // Check that the user email is displayed
    expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
  });

  test('should show unauthenticated state when no user', async () => {
    const { supabase } = require('@/lib/db');
    supabase.auth.getUser.mockResolvedValueOnce({
      data: { user: null },
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('unauthenticated');
    });
  });

  test('should handle login', async () => {
    const { supabase } = require('@/lib/db');
    supabase.auth.signInWithOtp.mockResolvedValueOnce({
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('login-button'));

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
      email: 'test@example.com',
      options: {
        emailRedirectTo: expect.any(String)
      }
    });
  });

  test('should handle login error', async () => {
    const { supabase } = require('@/lib/db');
    supabase.auth.signInWithOtp.mockResolvedValueOnce({
      error: new Error('Login failed')
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const user = userEvent.setup();
    
    // Mock console.error to avoid test noise
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    await user.click(screen.getByTestId('login-button'));
    
    // Wait for async operations
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0));
    });
    
    expect(supabase.auth.signInWithOtp).toHaveBeenCalled();
    consoleErrorSpy.mockRestore();
  });

  test('should handle logout', async () => {
    const { supabase } = require('@/lib/db');
    supabase.auth.signOut.mockResolvedValueOnce({
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('logout-button'));

    expect(supabase.auth.signOut).toHaveBeenCalled();
  });

  test('should handle registration', async () => {
    // Mock the fetch API for child registration
    global.fetch = jest.fn().mockResolvedValueOnce({
      json: jest.fn().mockResolvedValueOnce({ success: true })
    });

    const { supabase } = require('@/lib/db');
    supabase.auth.signInWithOtp.mockResolvedValueOnce({
      error: null
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    const user = userEvent.setup();
    await user.click(screen.getByTestId('register-button'));

    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'parent@example.com',
        options: expect.objectContaining({
          data: { role: 'guardian' }
        })
      })
    );
  });

  test('EnhancedAuthService should be a singleton', () => {
    const instance1 = EnhancedAuthService.getInstance();
    const instance2 = EnhancedAuthService.getInstance();
    
    expect(instance1).toBe(instance2);
  });
});