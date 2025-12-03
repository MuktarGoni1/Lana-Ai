import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter, useSearchParams } from 'next/navigation';
import React from 'react';
import '@testing-library/jest-dom';

// Mock Supabase client to prevent initialization errors
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
      getSession: jest.fn(),
      signInWithOtp: jest.fn(),
      signOut: jest.fn(),
      updateUser: jest.fn(),
      refreshSession: jest.fn(),
      signInWithOAuth: jest.fn(),
      getUser: jest.fn(),
    },
  },
}));

// Mock EnhancedAuthService to prevent initialization errors
jest.mock('@/lib/services/enhancedAuthService', () => {
  return {
    EnhancedAuthService: {
      getInstance: jest.fn(() => ({
        subscribe: jest.fn((callback: (state: any) => void) => {
          callback({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
          return jest.fn(); // unsubscribe function
        }),
        loginWithEmail: jest.fn(),
        loginWithGoogle: jest.fn(),
        registerParent: jest.fn(),
        registerChild: jest.fn(),
        logout: jest.fn(),
        refreshSession: jest.fn(),
        completeOnboarding: jest.fn(),
        getUserRole: jest.fn(),
        isOnboardingComplete: jest.fn(),
        getCurrentState: jest.fn().mockReturnValue({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null
        }),
      }))
    }
  };
});

// Mock next/navigation
const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSearchParams = {
  get: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
  useSearchParams: () => mockSearchParams,
}));

// Mock use-toast
const mockToast = jest.fn();

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: mockToast,
    toasts: [],
    dismiss: jest.fn(),
  }),
}));

// Mock useEnhancedAuth hook
jest.mock('@/hooks/useEnhancedAuth', () => ({
  useEnhancedAuth: jest.fn(),
}));

// Mock AuthService
jest.mock('@/lib/services/authService', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: jest.fn(),
    })),
  };
});

// Import components after mocks are set up
const LoginPage = require('@/app/login/page').default;
const ChildLoginPage = require('@/app/child-login/page').default;

describe('Login Flow Tests', () => {
  const mockSignIn = jest.fn();
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup useEnhancedAuth mock
    (require('@/hooks/useEnhancedAuth').useEnhancedAuth as jest.Mock).mockReturnValue({
      loginWithEmail: mockSignIn,
      loginWithGoogle: jest.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
    
    // Reset search params
    mockSearchParams.get.mockReturnValue(null);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Child Login Page', () => {
    it('should render child login form', () => {
      // Mock Supabase getSession to return no session
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });

      render(<ChildLoginPage />);
      
      expect(screen.getByText('Child Login')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();
    });

    it('should validate child email input', async () => {
      // Mock Supabase getSession to return no session
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });

      render(<ChildLoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      // Try to submit without email
      await userEvent.click(submitButton);
      // Look for the error message in the correct way
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      
      // Try to submit with invalid email
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should handle successful child login', async () => {
      // Mock Supabase getSession to return no session
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });

      render(<ChildLoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      await userEvent.type(emailInput, 'child@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Magic link sent',
          description: 'Check your email for the login link.',
        }));
        expect(mockPush).toHaveBeenCalledWith('/login?magic-link-sent=true&email=child%40example.com');
      });
    });

    it('should handle child login errors', async () => {
      // Mock Supabase getSession to return no session
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null } });
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: new Error('Failed to send magic link') });

      render(<ChildLoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      await userEvent.type(emailInput, 'child@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Login failed',
          // Fixed the error message to match what's actually shown
          description: 'Failed to send magic link',
          variant: 'destructive',
        }));
      });
    });

    it('should redirect authenticated child user with completed onboarding to homepage', async () => {
      // Mock Supabase getSession to return authenticated child user with completed onboarding
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { 
          session: {
            user: {
              user_metadata: {
                role: 'child',
                onboarding_complete: true,
              },
            },
          },
        },
      });

      render(<ChildLoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/homepage');
      });
    });

    it('should redirect authenticated child user with incomplete onboarding to term-plan', async () => {
      // Mock Supabase getSession to return authenticated child user with incomplete onboarding
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { 
          session: {
            user: {
              user_metadata: {
                role: 'child',
                onboarding_complete: false,
              },
            },
          },
        },
      });

      render(<ChildLoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/term-plan?onboarding=1');
      });
    });

    it('should redirect authenticated parent user to onboarding', async () => {
      // Mock Supabase getSession to return authenticated parent user
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { 
          session: {
            user: {
              user_metadata: {
                role: 'parent',
              },
            },
          },
        },
      });

      render(<ChildLoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/onboarding');
      });
    });
  });

  describe('Parent Login Flow', () => {
    it('should render parent login form', () => {
      mockSearchParams.get.mockReturnValue('parent');
      
      render(<LoginPage />);
      
      expect(screen.getByText('Parent Login')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });
    
    it('should validate parent email input', async () => {
      mockSearchParams.get.mockReturnValue('parent');
      
      render(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      // Try to submit without email
      await userEvent.click(submitButton);
      // Check for toast notification instead of inline error
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive'
      }));
    });
    
    it('should handle successful parent login', async () => {
      mockSearchParams.get.mockReturnValue('parent');
      
      const mockSupabase = require('@/lib/db').supabase;
      mockSupabase.auth.signInWithOtp.mockResolvedValue({ error: null });
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        // Fix the URL encoding issue - the actual URL will have the email encoded
        expect(mockReplace).toHaveBeenCalledWith('/register/magic-link-sent?email=parent%40example.com');
      });
    });

  });

  describe('Child Login Flow', () => {
    it('should render child login form', () => {
      mockSearchParams.get.mockReturnValue('child');
      
      render(<LoginPage />);
      
      expect(screen.getByText('Child Login')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
    });

    it('should validate child email input', async () => {
      mockSearchParams.get.mockReturnValue('child');
      
      render(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      // Try to submit without filling any fields
      await userEvent.click(submitButton);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      }));
    });

    it('should handle successful child login', async () => {
      mockSearchParams.get.mockReturnValue('child');
      
      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Login' });
      
      await userEvent.type(emailInput, 'child@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/register/magic-link-sent?email=child%40example.com');
      });

    });
  });

});
