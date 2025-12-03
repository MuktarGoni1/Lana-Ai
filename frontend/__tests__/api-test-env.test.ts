import { GET as getTestEnv } from '../app/api/test-env/route'
// @ts-ignore
import { Response as NodeResponse } from 'node-fetch'
;(global as any).Response = NodeResponse

describe('test-env route security', () => {
  const originalEnv = process.env.NODE_ENV
  afterEach(() => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: originalEnv,
      writable: true,
      configurable: true
    })
  })

  it('returns 404 in production', async () => {
    Object.defineProperty(process.env, 'NODE_ENV', {
      value: 'production',
      writable: true,
      configurable: true
    })
    const res = await getTestEnv({} as any)
    expect(res.status).toBe(404)
    const body = await res.text()
    expect(body).toContain('Not available in production')
  })
})

// TTS OPTIONS header behavior is covered by integration tests; omitted here due to Next.js Request polyfills in Jest
