import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import LoginPage from '../app/login/page';
import ChildLoginPage from '../app/child-login/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      getSession: jest.fn(),
    },
  },
}));

// Mock useEnhancedAuth hook
jest.mock('@/hooks/useEnhancedAuth', () => ({
  useEnhancedAuth: jest.fn(),
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Login Flow Tests', () => {
  const mockPush = jest.fn();
  const mockReplace = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
      replace: mockReplace,
    });
    
    // Mock useToast
    jest.mock('@/hooks/use-toast', () => ({
      useToast: () => ({
        toast: mockToast,
      }),
    }));
  });

  describe('Main Login Page', () => {
    it('should render login options', () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });
      
      // Mock useEnhancedAuth to return loading state
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<LoginPage />);
      
      expect(screen.getByText('Welcome Back')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in as Parent' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Sign in as Child' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('should navigate to parent login flow', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });
      
      // Mock useEnhancedAuth to return loading state
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<LoginPage />);
      
      const parentButton = screen.getByRole('button', { name: 'Sign in as Parent' });
      await userEvent.click(parentButton);
      
      expect(mockPush).toHaveBeenCalledWith('/login?flow=parent');
    });

    it('should navigate to child login flow', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });
      
      // Mock useEnhancedAuth to return loading state
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<LoginPage />);
      
      const childButton = screen.getByRole('button', { name: 'Sign in as Child' });
      await userEvent.click(childButton);
      
      expect(mockPush).toHaveBeenCalledWith('/login?flow=child');
    });

    it('should redirect authenticated users to homepage', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });
      
      // Mock useEnhancedAuth to return authenticated state
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: true,
        isLoading: false,
      });

      render(<LoginPage />);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/homepage');
      });
    });
  });

  describe('Parent Login Flow', () => {
    it('should render parent login form', () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('parent'),
      });
      
      // Mock useEnhancedAuth to return loading state
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<LoginPage />);
      
      expect(screen.getByText('Parent Registration')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    it('should validate parent email input', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('parent'),
      });
      
      // Mock useEnhancedAuth
      const mockRegisterParent = jest.fn().mockResolvedValue({ success: false, error: 'Invalid email' });
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        registerParent: mockRegisterParent,
      });

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      // Try to submit without email
      await userEvent.click(submitButton);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Email required',
        description: 'Please enter your email address.',
        variant: 'destructive',
      }));
      
      // Try to submit with invalid email
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      // The validation happens in the AuthService, so we need to check if it was called
      expect(mockRegisterParent).toHaveBeenCalledWith('invalid-email');
    });

    it('should handle successful parent login', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('parent'),
      });
      
      // Mock useEnhancedAuth
      const mockRegisterParent = jest.fn().mockResolvedValue({ success: true });
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        registerParent: mockRegisterParent,
      });

      render(<LoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockReplace).toHaveBeenCalledWith('/register/magic-link-sent?email=parent@example.com');
      });
    });
  });

  describe('Child Login Flow', () => {
    it('should render child login form', () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('child'),
      });
      
      // Mock useEnhancedAuth to return loading state
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<LoginPage />);
      
      expect(screen.getByText('Child Registration')).toBeInTheDocument();
      expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Grade')).toBeInTheDocument();
      expect(screen.getByLabelText('Guardian\'s Email')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Register' })).toBeInTheDocument();
    });

    it('should validate child registration form', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('child'),
      });
      
      // Mock useEnhancedAuth
      const mockRegisterChild = jest.fn().mockResolvedValue({ success: false, error: 'Missing information' });
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        registerChild: mockRegisterChild,
      });

      render(<LoginPage />);
      
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      // Try to submit without filling any fields
      await userEvent.click(submitButton);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Nickname required',
        description: 'Please enter your nickname.',
        variant: 'destructive',
      }));
    });

    it('should handle successful child registration', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue('child'),
      });
      
      // Mock useEnhancedAuth
      const mockRegisterChild = jest.fn().mockResolvedValue({ success: true });
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
        registerChild: mockRegisterChild,
      });

      render(<LoginPage />);
      
      const nicknameInput = screen.getByLabelText('Nickname');
      const ageInput = screen.getByLabelText('Age');
      const gradeSelect = screen.getByLabelText('Grade');
      const guardianEmailInput = screen.getByLabelText('Guardian\'s Email');
      const submitButton = screen.getByRole('button', { name: 'Register' });
      
      await userEvent.type(nicknameInput, 'Test Child');
      await userEvent.type(ageInput, '12');
      fireEvent.change(gradeSelect, { target: { value: '6th Grade' } });
      await userEvent.type(guardianEmailInput, 'parent@example.com');
      
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/child-login');
      });
    });
  });

  describe('Child Login Page', () => {
    it('should render child login form', () => {
      // Mock Supabase getSession to return no session
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });

      render(<ChildLoginPage />);
      
      expect(screen.getByText('Child Login')).toBeInTheDocument();
      expect(screen.getByLabelText('Email address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();
    });

    it('should validate child email input', async () => {
      // Mock Supabase getSession to return no session
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });

      render(<ChildLoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      // Try to submit without email
      await userEvent.click(submitButton);
      expect(screen.getByText('Email is required')).toBeInTheDocument();
      
      // Try to submit with invalid email
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    it('should handle successful child login', async () => {
      // Mock Supabase getSession to return no session
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });
      supabaseMock.auth.signInWithOtp.mockResolvedValue({ error: null });

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
        expect(mockPush).toHaveBeenCalledWith('/login?magic-link-sent=true&email=child@example.com');
      });
    });

    it('should handle child login errors', async () => {
      // Mock Supabase getSession to return no session
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ data: { session: null } });
      supabaseMock.auth.signInWithOtp.mockResolvedValue({ error: new Error('Failed to send magic link') });

      render(<ChildLoginPage />);
      
      const emailInput = screen.getByLabelText('Email address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      await userEvent.type(emailInput, 'child@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Login failed',
          description: 'Failed to send magic link. Please try again.',
          variant: 'destructive',
        }));
      });
    });

    it('should redirect authenticated child user with completed onboarding to homepage', async () => {
      // Mock Supabase getSession to return authenticated child user with completed onboarding
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ 
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
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ 
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
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.getSession.mockResolvedValue({ 
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
});