import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import ParentFlow from '../app/register/form/page'; // Adjust path as needed
import ChildFlow from '../app/register/form/page'; // Adjust path as needed

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
    },
    from: jest.fn(() => ({
      upsert: jest.fn(),
    })),
  },
}));

describe('Registration Flow Tests', () => {
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

  describe('Parent Registration Flow', () => {
    it('should render parent registration form', () => {
      // Mock useSearchParams to return parent role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('parent'),
      });

      render(<ParentFlow />);
      
      expect(screen.getByText('Parent Registration')).toBeInTheDocument();
      expect(screen.getByLabelText('Email Address')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Send Magic Link' })).toBeInTheDocument();
    });

    it('should validate email input', async () => {
      // Mock useSearchParams to return parent role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('parent'),
      });

      render(<ParentFlow />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      // Try to submit without email
      await userEvent.click(submitButton);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      }));
      
      // Try to submit with invalid email
      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Invalid email',
        description: 'Please enter a valid email address.',
        variant: 'destructive',
      }));
    });

    it('should handle successful parent registration', async () => {
      // Mock Supabase response
      const mockSignInResponse = { error: null };
      const mockUpsertResponse = { error: null };
      
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.signInWithOtp.mockResolvedValue(mockSignInResponse);
      supabaseMock.from().upsert.mockResolvedValue(mockUpsertResponse);
      
      // Mock useSearchParams to return parent role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('parent'),
      });

      render(<ParentFlow />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/register/magic-link-sent?email=parent@example.com');
      });
    });

    it('should handle parent registration errors', async () => {
      // Mock Supabase error response
      const mockError = new Error('Failed to send magic link');
      const mockSignInResponse = { error: mockError };
      
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.signInWithOtp.mockResolvedValue(mockSignInResponse);
      
      // Mock useSearchParams to return parent role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('parent'),
      });

      render(<ParentFlow />);
      
      const emailInput = screen.getByLabelText('Email Address');
      const submitButton = screen.getByRole('button', { name: 'Send Magic Link' });
      
      await userEvent.type(emailInput, 'parent@example.com');
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error',
          description: 'Failed to send magic link. Please try again.',
          variant: 'destructive',
        }));
      });
    });
  });

  describe('Child Registration Flow', () => {
    it('should render child registration form', () => {
      // Mock useSearchParams to return child role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('child'),
      });

      render(<ChildFlow />);
      
      expect(screen.getByText('Student Registration')).toBeInTheDocument();
      expect(screen.getByLabelText('Your Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Parent/Guardian Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Grade')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
    });

    it('should validate child registration form', async () => {
      // Mock useSearchParams to return child role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('child'),
      });

      render(<ChildFlow />);
      
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      
      // Try to submit without filling any fields
      await userEvent.click(submitButton);
      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Missing information',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      }));
    });

    it('should handle successful child registration', async () => {
      // Mock AuthService response
      const mockAuthService = {
        registerChild: jest.fn().mockResolvedValue({ success: true }),
      };
      
      jest.mock('@/lib/services/authService', () => {
        return {
          AuthService: jest.fn().mockImplementation(() => mockAuthService),
        };
      });
      
      // Mock useSearchParams to return child role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('child'),
      });

      render(<ChildFlow />);
      
      const childEmailInput = screen.getByLabelText('Your Email');
      const guardianEmailInput = screen.getByLabelText('Parent/Guardian Email');
      const nicknameInput = screen.getByLabelText('Nickname');
      const ageInput = screen.getByLabelText('Age');
      const gradeSelect = screen.getByLabelText('Grade');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      
      await userEvent.type(childEmailInput, 'child@example.com');
      await userEvent.type(guardianEmailInput, 'parent@example.com');
      await userEvent.type(nicknameInput, 'Test Child');
      await userEvent.type(ageInput, '12');
      fireEvent.change(gradeSelect, { target: { value: '7' } });
      
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/homepage');
      });
    });

    it('should handle child registration errors', async () => {
      // Mock AuthService error response
      const mockAuthService = {
        registerChild: jest.fn().mockRejectedValue(new Error('Failed to create account')),
      };
      
      jest.mock('@/lib/services/authService', () => {
        return {
          AuthService: jest.fn().mockImplementation(() => mockAuthService),
        };
      });
      
      // Mock useSearchParams to return child role
      jest.requireMock('next/navigation').useSearchParams = () => ({
        get: jest.fn().mockReturnValue('child'),
      });

      render(<ChildFlow />);
      
      const childEmailInput = screen.getByLabelText('Your Email');
      const guardianEmailInput = screen.getByLabelText('Parent/Guardian Email');
      const nicknameInput = screen.getByLabelText('Nickname');
      const ageInput = screen.getByLabelText('Age');
      const gradeSelect = screen.getByLabelText('Grade');
      const submitButton = screen.getByRole('button', { name: 'Create Account' });
      
      await userEvent.type(childEmailInput, 'child@example.com');
      await userEvent.type(guardianEmailInput, 'parent@example.com');
      await userEvent.type(nicknameInput, 'Test Child');
      await userEvent.type(ageInput, '12');
      fireEvent.change(gradeSelect, { target: { value: '7' } });
      
      await userEvent.click(submitButton);
      
      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error',
          description: 'Failed to create account. Please try again.',
          variant: 'destructive',
        }));
      });
    });
  });
});