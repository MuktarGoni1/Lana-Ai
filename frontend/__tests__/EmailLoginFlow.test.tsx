import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import React from 'react';
import LoginPage from '@/app/login/page';
import '@testing-library/jest-dom';

// Mock Supabase client to prevent initialization errors
jest.mock('@/lib/db', () => {
  const mockAuth = {
    onAuthStateChange: jest.fn((callback) => {
      // Simulate the callback being called immediately
      // Return a mock subscription object
      return { 
        data: { 
          subscription: { 
            unsubscribe: jest.fn() 
          } 
        } 
      };
    }),
    getUser: jest.fn(),
    signInWithOtp: jest.fn(),
    signOut: jest.fn(),
    updateUser: jest.fn(),
    refreshSession: jest.fn(),
    signInWithOAuth: jest.fn(),
  };

  const mockSupabase = {
    auth: mockAuth,
  };

  return {
    supabase: mockSupabase,
  };
});

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
      }))
    }
  };
});

// Mock next/navigation
const mockRouter = {
  push: jest.fn(),
  replace: jest.fn(),
};

jest.mock('next/navigation', () => ({
  useRouter: () => mockRouter,
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock useEnhancedAuth hook
jest.mock('@/hooks/useEnhancedAuth', () => ({
  useEnhancedAuth: jest.fn(),
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
    toasts: [],
    dismiss: jest.fn(),
  }),
}));

// Mock AuthService
jest.mock('@/lib/services/authService', () => {
  return {
    AuthService: jest.fn().mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: jest.fn(),
    })),
  };
});

describe('EmailLoginFlow', () => {
  const mockSignIn = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Setup router mock
    mockRouter.push.mockClear();
    mockRouter.replace.mockClear();
    
    // Setup useEnhancedAuth mock
    (require('@/hooks/useEnhancedAuth').useEnhancedAuth as jest.Mock).mockReturnValue({
      loginWithEmail: mockSignIn,
      loginWithGoogle: jest.fn(),
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome Back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue your learning journey')).toBeInTheDocument();
    expect(screen.getByText('Sign in as Parent')).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    render(<LoginPage />);
    
    // Click on parent login button to show the form
    const parentLoginButton = screen.getByText('Sign in as Parent');
    fireEvent.click(parentLoginButton);
    
    const emailInput = screen.getByPlaceholderText('parent@example.com');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should show validation error in real-time', async () => {
    render(<LoginPage />);
    
    // Click on parent login button to show the form
    const parentLoginButton = screen.getByText('Sign in as Parent');
    fireEvent.click(parentLoginButton);
    
    const emailInput = screen.getByPlaceholderText('parent@example.com');
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
    
    fireEvent.change(emailInput, { target: { value: 'valid@example.com' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Please enter a valid email address')).not.toBeInTheDocument();
    });
  });

  it('should handle successful login for verified users', async () => {
    const mockVerifyEmail: any = jest.fn();
    mockVerifyEmail.mockResolvedValue({
      exists: true,
      confirmed: true,
      userId: 'user-123',
    });
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    // Click on parent login button to show the form
    const parentLoginButton = screen.getByText('Sign in as Parent');
    fireEvent.click(parentLoginButton);
    
    const emailInput = screen.getByPlaceholderText('parent@example.com');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'verified@example.com' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('verified@example.com');
      expect(mockSignIn).toHaveBeenCalledWith('verified@example.com');
    });
  });

  it('should show error message for unverified users', async () => {
    const mockVerifyEmail: any = jest.fn();
    mockVerifyEmail.mockResolvedValue({
      exists: true,
      confirmed: false,
      userId: null,
    });
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    // Click on parent login button to show the form
    const parentLoginButton = screen.getByText('Sign in as Parent');
    fireEvent.click(parentLoginButton);
    
    const emailInput = screen.getByPlaceholderText('parent@example.com');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'unverified@example.com' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Email not yet authenticated",
        description: "This email is not yet authenticated. Please check your email for verification instructions.",
        variant: "destructive",
      });
    });
  });

  it('should show error message for non-existent users', async () => {
    const mockVerifyEmail: any = jest.fn();
    mockVerifyEmail.mockResolvedValue({
      exists: false,
      confirmed: false,
      userId: null,
    });
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    // Click on parent login button to show the form
    const parentLoginButton = screen.getByText('Sign in as Parent');
    fireEvent.click(parentLoginButton);
    
    const emailInput = screen.getByPlaceholderText('parent@example.com');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Email not authenticated",
        description: "This email is not yet authenticated. Please register first.",
        variant: "destructive",
      });
    });
  });

  it('should handle API errors gracefully', async () => {
    const mockVerifyEmail: any = jest.fn();
    mockVerifyEmail.mockRejectedValue(new Error('API Error'));
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    // Click on parent login button to show the form
    const parentLoginButton = screen.getByText('Sign in as Parent');
    fireEvent.click(parentLoginButton);
    
    const emailInput = screen.getByPlaceholderText('parent@example.com');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'error@example.com' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Authentication Error",
        description: "Unable to verify email. Please try again later.",
        variant: "destructive",
      });
    });
  });
});