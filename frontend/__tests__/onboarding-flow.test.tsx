import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import userEvent from '@testing-library/user-event';
import React from 'react';
import TermPlanPage from '../app/term-plan/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock the Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      updateUser: jest.fn(),
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

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
  writable: true,
});

// Mock setTimeout to execute immediately
jest.useFakeTimers();

describe('Onboarding Flow Tests', () => {
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

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Term Plan Page', () => {
    it('should render term plan page for onboarding', () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param) => {
          if (param === 'onboarding') return '1';
          return null;
        }),
      });
      
      // Mock useEnhancedAuth to return authenticated user
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<TermPlanPage />);
      
      expect(screen.getByText('Build Your Study Plan')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter subject name (e.g., Mathematics, Physics)')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Subject' })).toBeInTheDocument();
      
      // Check for onboarding footer buttons
      expect(screen.getByRole('button', { name: 'Skip to homepage' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Save plan and continue' })).toBeInTheDocument();
    });

    it('should handle adding subjects and topics', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param) => {
          if (param === 'onboarding') return '1';
          return null;
        }),
      });
      
      // Mock useEnhancedAuth to return authenticated user
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<TermPlanPage />);
      
      const subjectInput = screen.getByPlaceholderText('Enter subject name (e.g., Mathematics, Physics)');
      const addSubjectButton = screen.getByRole('button', { name: 'Add Subject' });
      
      // Add a subject
      await userEvent.type(subjectInput, 'Mathematics');
      await userEvent.click(addSubjectButton);
      
      // Verify subject is added
      expect(screen.getByText('Mathematics')).toBeInTheDocument();
      
      // Add a topic to the subject
      const topicInput = screen.getByPlaceholderText('Add a topic (e.g., Limits & Continuity)');
      const addTopicButton = screen.getByRole('button', { name: 'Add' });
      
      await userEvent.type(topicInput, 'Algebra');
      await userEvent.click(addTopicButton);
      
      // Verify topic is added
      expect(screen.getByText('Algebra')).toBeInTheDocument();
    });

    it('should handle skipping onboarding', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param) => {
          if (param === 'onboarding') return '1';
          return null;
        }),
      });
      
      // Mock useEnhancedAuth to return authenticated user
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        user: {
          id: 'test-user-id',
          email: 'test@example.com',
        },
        isAuthenticated: true,
        isLoading: false,
      });

      render(<TermPlanPage />);
      
      const skipButton = screen.getByRole('button', { name: 'Skip to homepage' });
      await userEvent.click(skipButton);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/homepage');
      });
    });

    it('should handle saving study plan and completing onboarding', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param) => {
          if (param === 'onboarding') return '1';
          return null;
        }),
      });
      
      // Mock useEnhancedAuth to return authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };
      
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Mock Supabase updateUser
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.updateUser.mockResolvedValue({ error: null });
      
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(() => JSON.stringify([])),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      render(<TermPlanPage />);
      
      // Add a subject first
      const subjectInput = screen.getByPlaceholderText('Enter subject name (e.g., Mathematics, Physics)');
      const addSubjectButton = screen.getByRole('button', { name: 'Add Subject' });
      
      await userEvent.type(subjectInput, 'Mathematics');
      await userEvent.click(addSubjectButton);
      
      const saveButton = screen.getByRole('button', { name: 'Save plan and continue' });
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        // Verify localStorage was called to save the study plan
        expect(localStorageMock.setItem).toHaveBeenCalledWith('lana_study_plan', expect.any(String));
        
        // Verify updateUser was called to mark onboarding as complete
        expect(supabaseMock.auth.updateUser).toHaveBeenCalledWith({
          data: { onboarding_complete: true },
        });
        
        // Verify redirect to homepage
        expect(mockReplace).toHaveBeenCalledWith('/homepage');
      });
    });

    it('should handle onboarding completion errors gracefully', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param) => {
          if (param === 'onboarding') return '1';
          return null;
        }),
      });
      
      // Mock useEnhancedAuth to return authenticated user
      const mockUser = {
        id: 'test-user-id',
        email: 'test@example.com',
      };
      
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        user: mockUser,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Mock Supabase updateUser to return an error
      const supabaseMock = require('@/lib/db').supabase;
      supabaseMock.auth.updateUser.mockResolvedValue({ error: new Error('Failed to update user') });
      
      // Mock localStorage
      const localStorageMock = {
        getItem: jest.fn(() => JSON.stringify([])),
        setItem: jest.fn(),
      };
      Object.defineProperty(window, 'localStorage', {
        value: localStorageMock,
        writable: true,
      });

      render(<TermPlanPage />);
      
      const saveButton = screen.getByRole('button', { name: 'Save plan and continue' });
      await userEvent.click(saveButton);
      
      await waitFor(() => {
        // Verify toast notification for the error
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Notice',
          description: 'Unable to save onboarding status, but continuing anyway.',
          variant: 'default',
        }));
        
        // Still redirect to homepage despite error
        expect(mockReplace).toHaveBeenCalledWith('/homepage');
      });
    });

    it('should redirect unauthenticated users to login', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn((param) => {
          if (param === 'onboarding') return '1';
          return null;
        }),
      });
      
      // Mock useEnhancedAuth to return unauthenticated user
      jest.requireMock('@/hooks/useEnhancedAuth').useEnhancedAuth = () => ({
        isAuthenticated: false,
        isLoading: false,
      });

      render(<TermPlanPage />);
      
      // Fast-forward the timer
      jest.advanceTimersByTime(3000);
      
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/login');
      });
    });
  });
});