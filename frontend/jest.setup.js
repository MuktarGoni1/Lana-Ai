import '@testing-library/jest-dom';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    };
  },
  useSearchParams() {
    return {
      get: jest.fn(),
    };
  },
}));

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
    signInWithOtp: jest.fn(),
    getSession: jest.fn(),
    updateUser: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
  },
  from: jest.fn(() => ({
    upsert: jest.fn(),
  })),
};

jest.mock('@/lib/db', () => ({
  supabase: mockSupabase,
}));

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    clear: jest.fn(),
  },
  writable: true,
});