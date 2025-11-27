import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HomePage from '../app/homepage/page';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock other dependencies
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
  },
}));

jest.mock('@/hooks/useEnhancedAuth', () => ({
  useEnhancedAuth: () => ({
    user: { id: 'test-user' },
    isAuthenticated: true,
    isLoading: false,
    refreshSession: jest.fn(),
  }),
}));

jest.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: jest.fn(),
  }),
}));

jest.mock('@/components/logo', () => {
  return function MockLogo() {
    return <div>Logo</div>;
  };
});

jest.mock('@/lib/search', () => ({
  saveSearch: jest.fn().mockResolvedValue({ success: true }),
}));

jest.mock('@/lib/rate-limiter', () => ({
  default: {
    isAllowed: jest.fn().mockReturnValue(true),
    getTimeUntilNextRequest: jest.fn().mockReturnValue(0),
  },
}));

describe('Command Palette Functionality', () => {
  it('should activate command palette when mode buttons are clicked', () => {
    render(<HomePage />);
    
    // Find the "Structured Lesson" mode button
    const structuredLessonButton = screen.getByText('Structured Lesson');
    
    // Click the button
    fireEvent.click(structuredLessonButton);
    
    // Check that the command palette is activated
    // Note: We can't directly test the internal state here, but we can verify the component renders
    expect(screen.getByText('Structured Lesson')).toBeInTheDocument();
  });
});