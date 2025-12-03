import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuth } from '@/contexts/AuthContext';
import { AuthProvider } from '@/contexts/AuthContext';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
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
    push: jest.fn()
  })
}));

// Test component that uses the context
const TestComponent = () => {
  const { user, isAuthenticated, isLoading } = useAuth();

  return (
    <div>
      <div data-testid="auth-status">
        {isLoading ? 'loading' : isAuthenticated ? 'authenticated' : 'unauthenticated'}
      </div>
      {user && <div data-testid="user-email">{user.email}</div>}
    </div>
  );
};

describe('Auth Context', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should provide auth state to children', async () => {
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

    await waitFor(() => {
      expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
    });
  });

  test('should throw error when used outside provider', () => {
    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useAuth must be used within an AuthProvider');
    
    consoleErrorSpy.mockRestore();
  });
});