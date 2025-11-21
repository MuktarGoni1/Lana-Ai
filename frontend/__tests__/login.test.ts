// Mock environment variables before importing any modules
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-anon-key';

import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '@/lib/services/authService';

// Mock the Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      signUp: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      upsert: jest.fn(),
      insert: jest.fn(),
    })),
  },
}));

// Mock window and localStorage
Object.defineProperty(window, 'location', {
  value: {
    origin: 'http://localhost:3000',
    href: 'http://localhost:3000/login',
    assign: jest.fn(),
  },
  writable: true,
});

const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Type-safe fetch mock
const mockFetch = jest.fn() as jest.MockedFunction<typeof fetch>;

describe('Login Functionality', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    jest.clearAllMocks();
    
    // Reset global.fetch mock
    global.fetch = mockFetch;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Email Validation', () => {
    it('should validate correct email format', async () => {
      const validEmail = 'user@example.com';
      const result = await authService.isEmailAuthenticated(validEmail);
      // Implementation will depend on actual API response
      expect(typeof result).toBe('boolean');
    });

    it('should reject invalid email format', async () => {
      const invalidEmail = 'invalid-email';
      await expect(authService.isEmailAuthenticated(invalidEmail))
        .resolves
        .toBe(false);
    });
  });

  describe('Authenticated Users', () => {
    it('should automatically login verified users', async () => {
      // Mock the API response for a verified user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          exists: true,
          confirmed: true,
          userId: 'user-123',
        }),
      } as any);

      const email = 'verified@example.com';
      const result = await authService.login(email);
      
      expect(result.success).toBe(true);
      expect(result.userId).toBe('user-123');
    });
  });

  describe('Unverified Users', () => {
    it('should show appropriate message for unverified users', async () => {
      // Mock the API response for an unverified user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          exists: true,
          confirmed: false,
        }),
      } as any);

      const email = 'unverified@example.com';
      
      await expect(authService.login(email))
        .rejects
        .toThrow('Email not yet authenticated. Please check your email for verification instructions.');
    });
  });

  describe('Non-Existent Users', () => {
    it('should show appropriate message for non-existent users', async () => {
      // Mock the API response for a non-existent user
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({
          exists: false,
          confirmed: false,
        }),
      } as any);

      const email = 'nonexistent@example.com';
      
      await expect(authService.login(email))
        .rejects
        .toThrow('Email not authenticated. Please register first.');
    });
  });

  describe('Network Errors', () => {
    it('should handle network errors gracefully', async () => {
      // Mock a network error
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const email = 'user@example.com';
      
      await expect(authService.login(email))
        .rejects
        .toThrow('Network error');
    });
  });
});