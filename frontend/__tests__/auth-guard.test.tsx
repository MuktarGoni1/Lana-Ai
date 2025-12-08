import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import AuthGuard from '../components/auth-guard';
import GuestGuard from '../components/guest-guard';
import { UnifiedAuthProvider } from '../contexts/UnifiedAuthContext';
import '@testing-library/jest-dom';

// Mock Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
      onAuthStateChange: jest.fn().mockImplementation((callback) => {
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

// Mock the enhanced auth service
jest.mock('@/lib/services/enhancedAuthService', () => {
  return {
    EnhancedAuthService: {
      getInstance: () => ({
        subscribe: jest.fn().mockImplementation((callback) => {
          callback({
            user: { id: '1', email: 'test@example.com' },
            isAuthenticated: true,
            isLoading: false,
            error: null
          });
          return jest.fn(); // unsubscribe function
        }),
        checkAuthStatus: jest.fn().mockResolvedValue({
          user: { id: '1', email: 'test@example.com' },
          isAuthenticated: true,
          isLoading: false,
          error: null
        })
      })
    }
  };
});

describe('Auth Guards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AuthGuard', () => {
    test('should render children when authenticated', async () => {
      const { supabase } = require('@/lib/db');
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      });

      render(
        <UnifiedAuthProvider>
          <AuthGuard>
            <div data-testid="protected-content">Protected Content</div>
          </AuthGuard>
        </UnifiedAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      });
    });

    test('should redirect when not authenticated', async () => {
      const { supabase } = require('@/lib/db');
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      render(
        <UnifiedAuthProvider>
          <AuthGuard>
            <div data-testid="protected-content">Protected Content</div>
          </AuthGuard>
        </UnifiedAuthProvider>
      );

      // Wait for redirect to happen
      await waitFor(() => {
        const { useRouter } = require('next/navigation');
        const mockRouter = useRouter();
        expect(mockRouter.push).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('GuestGuard', () => {
    test('should render children when not authenticated', async () => {
      const { supabase } = require('@/lib/db');
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null
      });

      render(
        <UnifiedAuthProvider>
          <GuestGuard>
            <div data-testid="guest-content">Guest Content</div>
          </GuestGuard>
        </UnifiedAuthProvider>
      );

      await waitFor(() => {
        expect(screen.getByTestId('guest-content')).toBeInTheDocument();
      });
    });

    test('should redirect when authenticated', async () => {
      const { supabase } = require('@/lib/db');
      supabase.auth.getUser.mockResolvedValueOnce({
        data: { user: { id: '1', email: 'test@example.com' } },
        error: null
      });

      render(
        <UnifiedAuthProvider>
          <GuestGuard>
            <div data-testid="guest-content">Guest Content</div>
          </GuestGuard>
        </UnifiedAuthProvider>
      );

      // Wait for redirect to happen
      await waitFor(() => {
        const { useRouter } = require('next/navigation');
        const mockRouter = useRouter();
        expect(mockRouter.push).toHaveBeenCalledWith('/homepage');
      });
    });
  });
});