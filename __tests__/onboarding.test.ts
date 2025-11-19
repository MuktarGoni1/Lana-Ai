import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthService } from '@/lib/services/authService';

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: vi.fn(),
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

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: vi.fn(),
  },
});

describe('Onboarding Process', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should successfully register a child and link to guardian', async () => {
    const authService = new AuthService();
    
    // Mock successful responses
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-uuid' } },
      error: null,
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: () => ({
            select: () => ({
              single: () => Promise.resolve({ data: {}, error: null }),
            }),
          }),
        };
      } else if (table === 'guardians') {
        return {
          insert: () => Promise.resolve({ data: {}, error: null }),
        };
      }
      return mockSupabase;
    });

    const result = await authService.registerChild(
      'Test Child',
      10,
      '6',
      'parent@test.com'
    );

    expect(result).toBeDefined();
    expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
      email: 'test-uuid@child.lana',
      password: expect.any(String),
      options: {
        data: {
          role: 'child',
          nickname: 'Test Child',
          age: 10,
          grade: '6',
          guardian_email: 'parent@test.com',
        },
        emailRedirectTo: 'http://localhost:3000/auth/confirmed/child',
      },
    });

    // Verify user record creation
    expect(mockSupabase.from).toHaveBeenCalledWith('users');
    
    // Verify guardian linking
    expect(mockSupabase.from).toHaveBeenCalledWith('guardians');
  });

  it('should handle user table creation failure gracefully', async () => {
    const authService = new AuthService();
    
    // Mock successful auth signup but failed user table insert
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-uuid' } },
      error: null,
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: () => Promise.resolve({ data: null, error: new Error('Table does not exist') }),
        };
      } else if (table === 'guardians') {
        return {
          insert: () => Promise.resolve({ data: {}, error: null }),
        };
      }
      return mockSupabase;
    });

    // Should not throw an error even if user table insert fails
    await expect(
      authService.registerChild('Test Child', 10, '6', 'parent@test.com')
    ).resolves.toBeDefined();
  });

  it('should handle guardian linking failure and cleanup user record', async () => {
    const authService = new AuthService();
    
    // Mock successful auth signup
    mockSupabase.auth.signUp.mockResolvedValueOnce({
      data: { user: { id: 'test-uuid' } },
      error: null,
    });
    
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'users') {
        return {
          insert: () => Promise.resolve({ data: {}, error: null }),
          delete: () => ({
            eq: () => Promise.resolve({ data: {}, error: null }),
          }),
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