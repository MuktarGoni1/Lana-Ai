import '@testing-library/jest-dom'

// Mock next/server to provide a lightweight NextResponse compatible with our middleware
jest.mock('next/server', () => {
  class SimpleHeaders {
    private map: Map<string, string>
    constructor() { this.map = new Map() }
    set(name: string, value: string) { this.map.set(name.toLowerCase(), value) }
    get(name: string) { return this.map.get(name.toLowerCase()) ?? null }
  }
  class CookieJar {
    private jar: Map<string, { value: string; options?: any }>
    constructor() { this.jar = new Map() }
    set(name: string, value: string, options?: any) { this.jar.set(name, { value, options }) }
    get(name: string) {
      const v = this.jar.get(name)
      return v ? { name, value: v.value, ...v.options } : undefined
    }
    has(name: string) {
      return this.jar.has(name)
    }
  }
  class NextResponse {
    cookies: CookieJar
    headers: SimpleHeaders
    constructor() {
      this.cookies = new CookieJar()
      this.headers = new SimpleHeaders()
    }
    static next() {
      return new NextResponse()
    }
    static redirect(url: string | URL) {
      const res = new NextResponse()
      res.headers.set('location', url.toString())
      return res
    }
  }
  return { NextResponse }
})

// Mock Supabase client
jest.mock('@supabase/ssr', () => {
  const mockCreateServerClient = jest.fn().mockImplementation(() => {
    return {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
      }
    }
  })
  return { createServerClient: mockCreateServerClient }
})

// Import the actual middleware after mocks
const { middleware } = require('../middleware')

describe('middleware guest cookie and error redirect', () => {
  test('sets guest cookie on homepage visit', async () => {
    const req = {
      nextUrl: { pathname: '/homepage' },
      cookies: {
        has: jest.fn().mockReturnValue(false),
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      }
    }
    
    const res = await middleware(req)
    const cookie = res.cookies.get('lana_guest_id')
    expect(cookie).toBeDefined()
    expect(cookie?.value).toMatch(/^guest-/)
  })

  test('redirects to homepage on middleware error', async () => {
    // Mock Supabase to throw an error
    jest.mock('@supabase/ssr', () => {
      const mockCreateServerClient = jest.fn().mockImplementation(() => {
        return {
          auth: {
            getUser: jest.fn().mockRejectedValue(new Error('Test error'))
          }
        }
      })
      return { createServerClient: mockCreateServerClient }
    })
    
    // Re-import middleware with new mock
    jest.resetModules()
    const { middleware } = require('../middleware')
    
    const req = {
      nextUrl: { pathname: '/protected', origin: 'http://localhost:3000' },
      url: 'http://localhost:3000/protected',
      cookies: {
        has: jest.fn().mockReturnValue(false),
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      }
    }
    
    const res = await middleware(req)
    expect(res.headers.get('location')).toBe('http://localhost:3000/landing-page')
  })
})

// Additional middleware tests for authenticated user scenarios
describe('middleware authenticated user scenarios', () => {
  beforeEach(() => {
    // Reset all mocks
    jest.resetAllMocks()
    jest.resetModules()
  })

  test('allows authenticated user to access protected routes', async () => {
    // Mock Supabase to return an authenticated user with completed onboarding
    jest.mock('@supabase/ssr', () => {
      const mockCreateServerClient = jest.fn().mockImplementation(() => {
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({ 
              data: { 
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                  user_metadata: { 
                    role: 'guardian',
                    onboarding_complete: true // User has completed onboarding
                  }
                } 
              }, 
              error: null 
            }),
          }
        }
      })
      return { createServerClient: mockCreateServerClient }
    })
    
    // Re-import middleware with new mock
    jest.resetModules()
    const { middleware } = require('../middleware')
    
    const req = {
      nextUrl: { pathname: '/dashboard', origin: 'http://localhost:3000' },
      url: 'http://localhost:3000/dashboard',
      cookies: {
        has: jest.fn().mockReturnValue(true),
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
        get: jest.fn().mockReturnValue({ name: 'lana_guest_id', value: 'guest-12345' })
      }
    }
    
    const res = await middleware(req)
    // Should allow access (no redirect)
    expect(res.headers.get('location')).toBeNull()
  })

  test('redirects authenticated user from login to landing page', async () => {
    // Mock Supabase to return an authenticated user
    jest.mock('@supabase/ssr', () => {
      const mockCreateServerClient = jest.fn().mockImplementation(() => {
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({ 
              data: { 
                user: {
                  id: 'test-user-id',
                  email: 'test@example.com',
                  user_metadata: { 
                    role: 'guardian',
                    onboarding_complete: true
                  }
                } 
              }, 
              error: null 
            }),
          }
        }
      })
      return { createServerClient: mockCreateServerClient }
    })
    
    // Re-import middleware with new mock
    jest.resetModules()
    const { middleware } = require('../middleware')
    
    const req = {
      nextUrl: { pathname: '/login', origin: 'http://localhost:3000' },
      url: 'http://localhost:3000/login',
      cookies: {
        has: jest.fn().mockReturnValue(true),
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
        get: jest.fn().mockReturnValue({ name: 'lana_guest_id', value: 'guest-12345' })
      }
    }
    
    const res = await middleware(req)
    expect(res.headers.get('location')).toBe('http://localhost:3000/landing-page')
  })

  test('redirects unauthenticated user from protected route to login', async () => {
    // Mock Supabase to return no user (unauthenticated)
    jest.mock('@supabase/ssr', () => {
      const mockCreateServerClient = jest.fn().mockImplementation(() => {
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
          }
        }
      })
      return { createServerClient: mockCreateServerClient }
    })
    
    // Re-import middleware with new mock
    jest.resetModules()
    const { middleware } = require('../middleware')
    
    const req = {
      nextUrl: { pathname: '/dashboard', origin: 'http://localhost:3000' },
      url: 'http://localhost:3000/dashboard',
      cookies: {
        has: jest.fn().mockReturnValue(false),
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      }
    }
    
    const res = await middleware(req)
    // Should redirect to login with redirectedFrom parameter (URL encoded)
    expect(res.headers.get('location')).toBe('http://localhost:3000/login?redirectedFrom=%2Fdashboard')
  })

  test('allows access to public routes for unauthenticated users', async () => {
    // Mock Supabase to return no user (unauthenticated)
    jest.mock('@supabase/ssr', () => {
      const mockCreateServerClient = jest.fn().mockImplementation(() => {
        return {
          auth: {
            getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: null }),
          }
        }
      })
      return { createServerClient: mockCreateServerClient }
    })
    
    // Re-import middleware with new mock
    jest.resetModules()
    const { middleware } = require('../middleware')
    
    const req = {
      nextUrl: { pathname: '/landing-page', origin: 'http://localhost:3000' },
      url: 'http://localhost:3000/landing-page',
      cookies: {
        has: jest.fn().mockReturnValue(false),
        getAll: jest.fn().mockReturnValue([]),
        set: jest.fn(),
        get: jest.fn().mockReturnValue(undefined)
      }
    }
    
    const res = await middleware(req)
    // Should allow access (no redirect)
    expect(res.headers.get('location')).toBeNull()
  })
})