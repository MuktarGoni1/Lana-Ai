import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/lib/services/authService';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
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

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: vi.fn(),
  },
});

describe('Onboarding Process Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should correctly format user_metadata as JSON string', async () => {
    const authService = new AuthService();
    
    // Mock successful responses
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-uuid' } },
      error: null,
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: vi.fn().mockImplementation((data) => {
            // Verify that user_metadata is a JSON string, not an object
            const userData = Array.isArray(data) ? data[0] : data;
            expect(typeof userData.user_metadata).toBe('string');
            expect(userData.user_metadata).toBe(JSON.stringify({
              role: "child",
              nickname: "Test Child",
              age: 10,
              grade: "6",
              guardian_email: "parent@test.com"
            }));
            return Promise.resolve({ data: {}, error: null });
          }),
        };
      } else if (table === 'guardians') {
        return {
          insert: () => Promise.resolve({ data: {}, error: null }),
        };
      }
      return mockSupabase;
    });

    await authService.registerChild(
      'Test Child',
      10,
      '6',
      'parent@test.com'
    );

    // Verify user record creation was called
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    
    // Verify guardian linking
    expect(mockSupabase.from).toHaveBeenCalledWith('guardians');
  });

  it('should handle errors gracefully and provide meaningful error messages', async () => {
    const authService = new AuthService();
    
    // Mock successful auth signup but failed guardian linking
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-uuid' } },
      error: null,
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: () => Promise.resolve({ data: {}, error: null }),
        };
      } else if (table === 'guardians') {
        return {
          insert: () => Promise.resolve({ data: null, error: new Error('Linking failed') }),
        };
      }
      return mockSupabase;
    });

    // Should throw an error when guardian linking fails
    await expect(
      authService.registerChild('Test Child', 10, '6', 'parent@test.com')
    ).rejects.toThrow('Linking failed');
  });
});