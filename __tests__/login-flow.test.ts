import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';

// Mock the Supabase client
jest.mock('@/lib/db', () => ({
  supabase: {
    auth: {
      signInWithOtp: jest.fn(),
      signUp: jest.fn(),
    },
  },
}));

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch as any;

describe('Login Flow', () => {
  let authService: any;

  beforeEach(async () => {
    const { AuthService } = await import('../lib/services/authService');
    authService = new AuthService();
    mockFetch.mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should verify authenticated email correctly', async () => {
    // Mock successful verification response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        exists: true,
        confirmed: true,
      }),
    }));

    const result = await authService.isEmailAuthenticated('test@example.com');
    
    expect(result).toBe(true);
    expect(mockFetch).toHaveBeenCalledWith('/api/auth/check-user', expect.any(Object));
  });

  it('should reject unauthenticated email', async () => {
    // Mock unsuccessful verification response
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        exists: false,
        confirmed: false,
      }),
    }));

    const result = await authService.isEmailAuthenticated('unauthorized@example.com');
    
    expect(result).toBe(false);
  });

  it('should handle API errors gracefully', async () => {
    // Mock API error
    mockFetch.mockImplementationOnce(() => Promise.reject(new Error('Network error')));

    const result = await authService.isEmailAuthenticated('test@example.com');
    
    expect(result).toBe(false);
  });

  it('should login authenticated user', async () => {
    // Mock successful verification
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        exists: true,
        confirmed: true,
        userId: 'user-123',
      }),
    }));

    const result = await authService.login('test@example.com');
    
    expect(result).toEqual({ success: true, userId: 'user-123' });
  });

  it('should reject login for unconfirmed email', async () => {
    // Mock unconfirmed email
    mockFetch.mockImplementationOnce(() => Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        exists: true,
        confirmed: false,
      }),
    }));

    await expect(authService.login('unconfirmed@example.com')).rejects.toThrow('Email not verified or confirmed');
  });
});