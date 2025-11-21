import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/db';
import OnboardingPage from '@/app/onboarding/page';
import GuardianDashboard from '@/app/guardian/page';
import TermPlanPage from '@/app/term-plan/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
}));

// Mock useToast hook
jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

describe('Onboarding Flow', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    jest.clearAllMocks();
  });

  describe('Guardian Onboarding Process', () => {
    it('should successfully add a child manually', async () => {
      // Mock session data
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              email: 'parent@example.com',
            },
          },
        },
      });

      // Mock successful database operations
      const mockInsert = jest.fn().mockResolvedValue({ error: null });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Render the onboarding page
      render(<OnboardingPage />);

      // Fill in child information
      fireEvent.change(screen.getByLabelText(/Nickname/i), {
        target: { value: 'Test Child' },
      });
      
      fireEvent.change(screen.getByLabelText(/Age/i), {
        target: { value: '12' },
      });
      
      fireEvent.change(screen.getByLabelText(/Grade/i), {
        target: { value: '7' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /Finish setup/i }));

      // Wait for the operations to complete
      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledTimes(2); // Once for users, once for guardians
      });

      // Verify redirect to term-plan for onboarding completion
      expect(mockRouter.push).toHaveBeenCalledWith('/term-plan?onboarding=1');
    });

    it('should handle validation errors', async () => {
      // Mock session data
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              email: 'parent@example.com',
            },
          },
        },
      });

      // Render the onboarding page
      render(<OnboardingPage />);

      // Try to submit without filling in fields
      fireEvent.click(screen.getByRole('button', { name: /Finish setup/i }));

      // Wait for validation error
      await waitFor(() => {
        expect(mockRouter.push).not.toHaveBeenCalled();
      });
    });

    it('should handle database errors gracefully', async () => {
      // Mock session data
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              email: 'parent@example.com',
            },
          },
        },
      });

      // Mock database error
      const mockInsert = jest.fn().mockResolvedValue({ 
        error: new Error('Database error') 
      });
      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      // Render the onboarding page
      render(<OnboardingPage />);

      // Fill in child information
      fireEvent.change(screen.getByLabelText(/Nickname/i), {
        target: { value: 'Test Child' },
      });
      
      fireEvent.change(screen.getByLabelText(/Age/i), {
        target: { value: '12' },
      });
      
      fireEvent.change(screen.getByLabelText(/Grade/i), {
        target: { value: '7' },
      });

      // Submit the form
      fireEvent.click(screen.getByRole('button', { name: /Finish setup/i }));

      // Wait for error handling
      await waitFor(() => {
        // Should still redirect to term-plan even with errors
        expect(mockRouter.push).toHaveBeenCalledWith('/term-plan?onboarding=1');
      });
    });
  });

  describe('Term Plan Onboarding Completion', () => {
    it('should complete onboarding and redirect to homepage', async () => {
      // Mock session data
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              email: 'parent@example.com',
            },
          },
        },
      });

      // Mock successful update
      (supabase.auth.updateUser as jest.Mock).mockResolvedValue({
        error: null,
      });

      // Mock search params
      (require('next/navigation').useSearchParams as jest.Mock).mockReturnValue({
        get: (param: string) => {
          if (param === 'onboarding') return '1';
          return null;
        },
      });

      // Render the term plan page
      render(<TermPlanPage />);

      // Click the complete onboarding button
      await waitFor(() => {
        const completeButton = screen.getByRole('button', { name: /Save plan and continue/i });
        fireEvent.click(completeButton);
      });

      // Verify redirect to homepage
      expect(mockRouter.replace).toHaveBeenCalledWith('/homepage');
    });
  });

  describe('Guardian Dashboard Navigation', () => {
    it('should navigate to homepage when home button is clicked', async () => {
      // Mock session data
      (supabase.auth.getSession as jest.Mock).mockResolvedValue({
        data: {
          session: {
            user: {
              email: 'parent@example.com',
            },
          },
        },
      });

      // Mock children data
      (supabase.from as jest.Mock).mockReturnValue({
        select: jest.fn(() => ({
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        })),
      });

      // Render the guardian dashboard
      render(<GuardianDashboard />);

      // Click the home button
      await waitFor(() => {
        const homeButton = screen.getByRole('button', { name: /Home/i });
        fireEvent.click(homeButton);
      });

      // Verify redirect to homepage
      expect(mockRouter.push).toHaveBeenCalledWith('/homepage');
    });
  });
});