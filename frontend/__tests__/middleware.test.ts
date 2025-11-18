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
      const res = new NextResponse()
      return res
    }
    static redirect(url: URL | string) {
      const res = new NextResponse()
      const href = typeof url === 'string' ? url : url.toString()
      res.headers.set('location', href)
      return res
    }
  }
  return { NextResponse }
})

// Import the actual middleware function
import { middleware } from '@/middleware'

// Mock the Supabase client
jest.mock('@supabase/auth-helpers-nextjs', () => {
  return {
    createMiddlewareClient: jest.fn(() => {
      return {
        auth: {
          getSession: jest.fn().mockResolvedValue({ data: { session: null } }),
        },
      }
    }),
  }
})

function makeReq(pathname: string) {
  const url = `http://localhost:3000${pathname}`
  return {
    url,
    nextUrl: { pathname },
    cookies: {
      has: (name: string) => false,
      get: (name: string) => undefined,
    },
  } as any
}

describe('middleware guest cookie and error redirect', () => {

  test('sets guest cookie on homepage visit', async () => {
    const req = makeReq('/homepage')
    const res = await middleware(req)
    const cookie = res.cookies.get('lana_guest_id')
    expect(cookie?.value).toMatch(/^guest-/)
  })

  test('redirects to homepage on middleware error', async () => {
    // Mock the Supabase client to throw an error
    const { createMiddlewareClient } = require('@supabase/auth-helpers-nextjs')
    createMiddlewareClient.mockImplementationOnce(() => {
      return {
        auth: {
          getSession: jest.fn().mockRejectedValue(new Error('boom')),
        },
      }
    })
    
    const req = makeReq('/protected')
    const res = await middleware(req)
    expect(res.headers.get('location')).toContain('/landing-page')
  })
})