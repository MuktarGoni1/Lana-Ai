// Mock NextRequest and NextResponse
const mockNextRequest = (url: string, cookies: Record<string, string> = {}) => {
  return {
    nextUrl: new URL(url),
    cookies: {
      has: (name: string) => cookies.hasOwnProperty(name),
      get: (name: string) => ({ value: cookies[name] }),
      getAll: () => Object.entries(cookies).map(([name, value]) => ({ name, value })),
      set: jest.fn(),
    },
    headers: {
      get: jest.fn(),
    },
  };
};

const mockNextResponse = () => {
  const cookies: Record<string, { value: string; options: any }> = {};
  return {
    cookies: {
      set: (name: string, value: string, options: any) => {
        cookies[name] = { value, options };
      },
      get: (name: string) => cookies[name],
    },
    next: jest.fn(() => ({
      cookies,
    })),
    redirect: jest.fn((url) => ({
      url: url.toString(),
      type: 'redirect',
    })),
  };
};

// Mock Supabase client
const mockSupabase = {
  auth: {
    getUser: jest.fn(),
  },
};

// Mock environment variables
process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

// Mock the actual middleware
jest.mock('../middleware', () => {
  // We'll test the actual logic by importing and running it
  return {
    __esModule: true,
    ...jest.requireActual('../middleware'),
  };
});

// Import the middleware function
const { middleware } = require('../middleware');

describe('Middleware Navigation Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset mocks
    mockSupabase.auth.getUser.mockReset();
  });

  describe('Public Routes', () => {
    it('should allow access to public routes without authentication', async () => {
      const req = mockNextRequest('http://localhost:3000/login');
      const res = mockNextResponse();
      
      // Mock Supabase to return no user (unauthenticated)
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });

    it('should allow access to static assets', async () => {
      const req = mockNextRequest('http://localhost:3000/_next/static/chunks/main.js');
      const res = mockNextResponse();
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });
  });

  describe('Homepage Access', () => {
    it('should allow access to homepage for authenticated users', async () => {
      const req = mockNextRequest('http://localhost:3000/homepage');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });

    it('should allow access to homepage for unauthenticated users', async () => {
      const req = mockNextRequest('http://localhost:3000/homepage');
      const res = mockNextResponse();
      
      // Mock Supabase to return no user (unauthenticated)
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect unauthenticated users from protected routes to login', async () => {
      const req = mockNextRequest('http://localhost:3000/dashboard');
      const res = mockNextResponse();
      
      // Mock Supabase to return no user (unauthenticated)
      mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
      
      const response = await middleware(req);
      
      // Should redirect to login
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/login?redirectedFrom=/dashboard');
    });

    it('should allow authenticated users to access protected routes', async () => {
      const req = mockNextRequest('http://localhost:3000/dashboard');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });
  });

  describe('Authentication Redirects', () => {
    it('should redirect authenticated users from login page to homepage', async () => {
      const req = mockNextRequest('http://localhost:3000/login');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to homepage
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/homepage');
    });

    it('should redirect authenticated users from register page to homepage', async () => {
      const req = mockNextRequest('http://localhost:3000/register');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to homepage
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/homepage');
    });
  });

  describe('Onboarding Enforcement', () => {
    it('should redirect authenticated users with incomplete onboarding to term-plan', async () => {
      const req = mockNextRequest('http://localhost:3000/dashboard');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user with incomplete onboarding
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: false,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to term-plan for onboarding
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/term-plan?onboarding=1&returnTo=/dashboard');
    });

    it('should allow access to onboarding routes for users with incomplete onboarding', async () => {
      const req = mockNextRequest('http://localhost:3000/term-plan?onboarding=1');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user with incomplete onboarding
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: false,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });
  });

  describe('Onboarding Completion Redirect', () => {
    it('should redirect to homepage when onboarding is completed', async () => {
      const req = mockNextRequest('http://localhost:3000/any-route?onboardingComplete=1');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: false, // Even if not marked in metadata, the query param should trigger redirect
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to homepage
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/homepage');
    });
  });

  describe('Root and Landing Page Redirects', () => {
    it('should redirect authenticated users from root to homepage', async () => {
      const req = mockNextRequest('http://localhost:3000/');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to homepage
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/homepage');
    });

    it('should redirect authenticated users from landing page to homepage', async () => {
      const req = mockNextRequest('http://localhost:3000/landing-page');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'parent',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to homepage
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/homepage');
    });
  });

  describe('Role-based Access Control', () => {
    it('should redirect non-guardian users from guardian routes', async () => {
      const req = mockNextRequest('http://localhost:3000/guardian/dashboard');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user with child role
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'child',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should redirect to landing page
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/landing-page');
    });

    it('should allow guardian users to access guardian routes', async () => {
      const req = mockNextRequest('http://localhost:3000/guardian/dashboard');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authenticated user with guardian role
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { 
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
            user_metadata: {
              role: 'guardian',
              onboarding_complete: true,
            },
          },
        }, 
        error: null,
      });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });
  });

  describe('Error Handling', () => {
    it('should redirect to landing page on authentication errors for protected routes', async () => {
      const req = mockNextRequest('http://localhost:3000/dashboard');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authentication error
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: new Error('Authentication failed'),
      });
      
      const response = await middleware(req);
      
      // Should redirect to landing page
      expect(response).toBeDefined();
      expect(response.type).toBe('redirect');
      expect(response.url).toBe('http://localhost:3000/landing-page');
    });

    it('should allow access to public routes even with authentication errors', async () => {
      const req = mockNextRequest('http://localhost:3000/login');
      const res = mockNextResponse();
      
      // Mock Supabase to return an authentication error
      mockSupabase.auth.getUser.mockResolvedValue({ 
        data: { user: null }, 
        error: new Error('Authentication failed'),
      });
      
      const response = await middleware(req);
      
      // Should allow the request to proceed
      expect(response).toBeDefined();
      expect(response.type).not.toBe('redirect');
    });
  });
});