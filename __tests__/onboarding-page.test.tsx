import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import OnboardingPage from '@/app/onboarding/page';
import { useToast } from '@/hooks/use-toast';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock useToast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: vi.fn(),
}));

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
};

// Mock the supabase import
vi.mock('@/lib/db', () => ({
  supabase: mockSupabase,
}));

// Mock window.crypto
Object.defineProperty(globalThis, 'crypto', {
  value: {
    randomUUID: () => 'test-uuid',
  },
});

describe('OnboardingPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  const mockToast = {
    toast: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useToast as any).mockReturnValue(mockToast);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render the onboarding form', () => {
    render(<OnboardingPage />);
    
    expect(screen.getByText('Set up your child')).toBeInTheDocument();
    expect(screen.getByLabelText('Nickname')).toBeInTheDocument();
    expect(screen.getByLabelText('Age')).toBeInTheDocument();
    expect(screen.getByLabelText('Grade')).toBeInTheDocument();
    expect(screen.getByText('Finish setup')).toBeInTheDocument();
  });

  it('should show validation error when fields are empty', async () => {
    render(<OnboardingPage />);
    
    const submitButton = screen.getByText('Finish setup');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Please fill all fields",
        variant: "destructive",
      });
    });
  });

  it('should show authentication error when no session exists', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: null },
    });

    render(<OnboardingPage />);
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText('Nickname'), { target: { value: 'Test Child' } });
    fireEvent.input(screen.getByLabelText('Age'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '6' } });
    
    const submitButton = screen.getByText('Finish setup');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Authentication error",
        description: "Please log in again",
        variant: "destructive",
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/login");
    });
  });

  it('should successfully submit child information', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { email: 'parent@test.com' } } },
    });

    mockSupabase.from.mockImplementation((table) => {
      return {
        insert: () => Promise.resolve({ data: {}, error: null }),
      };
    });

    render(<OnboardingPage />);
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText('Nickname'), { target: { value: 'Test Child' } });
    fireEvent.input(screen.getByLabelText('Age'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '6' } });
    
    const submitButton = screen.getByText('Finish setup');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Success",
        description: "Child linked to your account successfully!"
      });
      expect(mockRouter.push).toHaveBeenCalledWith("/guardian");
    });
  });

  it('should handle submission errors gracefully', async () => {
    mockSupabase.auth.getSession.mockResolvedValueOnce({
      data: { session: { user: { email: 'parent@test.com' } } },
    });

    mockSupabase.from.mockImplementation((table) => {
      if (table === 'guardians') {
        return {
          insert: () => Promise.resolve({ data: null, error: new Error('Database error') }),
        };
      }
      return {
        insert: () => Promise.resolve({ data: {}, error: null }),
        delete: () => ({
          eq: () => Promise.resolve({ data: {}, error: null }),
        }),
      };
    });

    render(<OnboardingPage />);
    
    // Fill in the form
    fireEvent.input(screen.getByLabelText('Nickname'), { target: { value: 'Test Child' } });
    fireEvent.input(screen.getByLabelText('Age'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Grade'), { target: { value: '6' } });
    
    const submitButton = screen.getByText('Finish setup');
    fireEvent.click(submitButton);
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith({
        title: "Error",
        description: "Database error",
        variant: "destructive",
      });
    });
  });
});