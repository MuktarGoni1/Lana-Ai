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
      return v ? { name, value: v.value } : undefined
    }
  }
  class NextResponse {
    cookies: CookieJar
    headers: SimpleHeaders
    constructor() {
      this.cookies = new CookieJar()
      this.headers = new SimpleHeaders()
    }
    static next() { return new NextResponse() }
    static redirect(url: URL | string) {
      const res = new NextResponse()
      const href = typeof url === 'string' ? url : url.toString()
      res.headers.set('location', href)
      return res
    }
  }
  return { NextResponse }
})

// Mock proxy to control behavior
jest.mock('@/proxy', () => {
  const { NextResponse } = require('next/server')
  return {
    proxy: jest.fn(async () => NextResponse.next()),
  }
})

// Import middleware after mocks
import { middleware } from '@/middleware'

function makeReq(pathname: string) {
  const url = `http://localhost:3000${pathname}`
  return {
    url,
    nextUrl: { pathname },
    cookies: {
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

  test('redirects to homepage on proxy error', async () => {
    const { proxy } = jest.requireMock('@/proxy')
    proxy.mockImplementationOnce(async () => { throw new Error('boom') })
    const req = makeReq('/protected')
    const res = await middleware(req)
    expect(res.headers.get('location')).toContain('/homepage')
  })
})