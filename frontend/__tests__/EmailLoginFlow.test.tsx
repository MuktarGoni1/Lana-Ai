import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import LoginPage from '@/app/login/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => ({
    get: jest.fn().mockReturnValue(null),
  }),
}));

// Mock useAuth hook
jest.mock('@/hooks/useAuth', () => ({
  useAuth: jest.fn(),
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: jest.fn(),
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
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  const mockSignIn = jest.fn();
  const mockToast = jest.fn();

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      user: null,
    });
    (useToast as jest.Mock).mockReturnValue({ toast: mockToast });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should render the login form', () => {
    render(<LoginPage />);
    
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Sign in to continue learning')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });
  });

  it('should show validation error in real-time', async () => {
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    
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
    const mockVerifyEmail = jest.fn().mockResolvedValue({
      exists: true,
      confirmed: true,
      userId: 'user-123',
    });
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'verified@example.com' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockVerifyEmail).toHaveBeenCalledWith('verified@example.com');
      expect(mockSignIn).toHaveBeenCalledWith('verified@example.com');
    });
  });

  it('should show error message for unverified users', async () => {
    const mockVerifyEmail = jest.fn().mockResolvedValue({
      exists: true,
      confirmed: false,
    });
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
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
    const mockVerifyEmail = jest.fn().mockResolvedValue({
      exists: false,
      confirmed: false,
    });
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
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
    const mockVerifyEmail = jest.fn().mockRejectedValue(new Error('API Error'));
    
    const AuthServiceMock = require('@/lib/services/authService').AuthService;
    AuthServiceMock.mockImplementation(() => ({
      verifyEmailWithSupabaseAuth: mockVerifyEmail,
    }));
    
    render(<LoginPage />);
    
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const loginButton = screen.getByText('Login');
    
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.click(loginButton);
    
    await waitFor(() => {
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error",
        description: "API Error",
        variant: "destructive",
      });
    });
  });
});