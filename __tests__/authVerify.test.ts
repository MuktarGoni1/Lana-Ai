import { AuthService } from '@/lib/services/authService'

// Mock supabase client to avoid env requirements during module import
jest.mock('@/lib/db', () => ({ supabase: { auth: { signInWithOtp: jest.fn() }, from: jest.fn() } }))

describe('AuthService.verifyEmailWithSupabaseAuth', () => {
  let service: AuthService
  const originalFetch = global.fetch

  beforeEach(() => {
    service = new AuthService()
    jest.resetAllMocks()
  })

  afterAll(() => {
    global.fetch = originalFetch as any
  })

  test('returns exists+confirmed on success', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, exists: true, confirmed: true, userId: 'uid-123' })
    }) as any

    const res = await service.verifyEmailWithSupabaseAuth('User@Example.com')
    expect(res).toEqual({ exists: true, confirmed: true, userId: 'uid-123' })
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.any(Object))
  })

  test('handles not found email', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, exists: false, confirmed: false })
    }) as any

    const res = await service.verifyEmailWithSupabaseAuth('missing@example.com')
    expect(res.exists).toBe(false)
    expect(res.confirmed).toBe(false)
  })

  test('handles unverified email', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true, exists: true, confirmed: false })
    }) as any

    const res = await service.verifyEmailWithSupabaseAuth('pending@example.com')
    expect(res.exists).toBe(true)
    expect(res.confirmed).toBe(false)
  })

  test('maps rate limit errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({ ok: false, error: 'rate_limited', message: 'Too many verification attempts.' })
    }) as any

    await expect(service.verifyEmailWithSupabaseAuth('user@example.com')).rejects.toThrow(/too many verification attempts/i)
  })

  test('maps invalid email errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ ok: false, error: 'invalid_email', message: 'Please provide a valid email address.' })
    }) as any

    await expect(service.verifyEmailWithSupabaseAuth('not-an-email')).rejects.toThrow(/valid email/i)
  })

  test('maps service unavailable (503) errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({ ok: false, error: 'service_unavailable', message: 'Verification service temporarily unavailable. Please try again later.' })
    }) as any

    await expect(service.verifyEmailWithSupabaseAuth('user@example.com')).rejects.toThrow(/temporarily unavailable/i)
  })

  test('handles offline detection gracefully', async () => {
    const originalNavigator = (globalThis as any).navigator
    Object.defineProperty(globalThis, 'navigator', { value: { onLine: false }, configurable: true })

    await expect(service.verifyEmailWithSupabaseAuth('user@example.com')).rejects.toThrow(/offline/i)

    Object.defineProperty(globalThis, 'navigator', { value: originalNavigator, configurable: true })
  })

  test('handles network/server error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network down')) as any
    await expect(service.verifyEmailWithSupabaseAuth('user@example.com')).rejects.toThrow(/network/i)
  })
})