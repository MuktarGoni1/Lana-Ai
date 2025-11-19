import { AuthService } from '@/lib/services/authService'

// Mock fetch globally
global.fetch = jest.fn() as jest.Mock

jest.mock('@/lib/db', () => {
  const signInWithOtp = jest.fn().mockResolvedValue({ data: { ok: true }, error: null });
  const from = jest.fn().mockReturnValue({
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    upsert: jest.fn().mockResolvedValue({ data: {}, error: null })
  });
  return { supabase: { auth: { signInWithOtp }, from } };
})

describe('AuthService', () => {
  let service: AuthService
  beforeEach(() => {
    service = new AuthService()
    jest.clearAllMocks()
    // Reset fetch mock
    ;(global.fetch as jest.Mock).mockReset()
  })

  test('login verifies email authentication instead of sending OTP', async () => {
    // Mock the verification response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ exists: true, confirmed: true, userId: 'user-123' })
    })

    const result = await service.login('  user@example.com  ')
    expect(result).toEqual({ success: true, userId: 'user-123' })
    // Ensure signInWithOtp is not called anymore
    const { supabase } = require('@/lib/db')
    expect(supabase.auth.signInWithOtp).not.toHaveBeenCalled()
    // Check that we called our verification endpoint
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.any(Object))
  })

  test('registerParent inserts guardian record', async () => {
    const result = await service.registerParent('guardian@example.com')
    expect(result).toEqual({ ok: true })
    const { supabase } = require('@/lib/db')
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(1)
    // Ensure we redirect guardians to role-specific confirmation page
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ 
        email: 'guardian@example.com', 
        options: expect.objectContaining({ emailRedirectTo: expect.stringContaining('/auth/confirmed/guardian') }) 
      })
    )
    // Check that we also insert into the guardians table
    expect(supabase.from).toHaveBeenCalledWith('guardians')
  })

  test('isEmailAuthenticated returns true when email is authenticated and confirmed', async () => {
    // Mock fetch to return a successful response
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ exists: true, confirmed: true })
    })

    const ok = await service.isEmailAuthenticated('user@example.com')
    expect(ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith('/api/auth/check-user', expect.any(Object))
  })

  test('isEmailAuthenticated returns false when email not found', async () => {
    // Mock fetch to return a successful response with exists: false
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ exists: false, confirmed: false })
    })

    const ok = await service.isEmailAuthenticated('missing@example.com')
    expect(ok).toBe(false)
  })

  test('isEmailAuthenticated returns false when email is not confirmed', async () => {
    // Mock fetch to return a successful response with exists: true but confirmed: false
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValueOnce({ exists: true, confirmed: false })
    })

    const ok = await service.isEmailAuthenticated('unconfirmed@example.com')
    expect(ok).toBe(false)
  })

  test('isEmailAuthenticated falls back to verify-email when check-user fails', async () => {
    // Mock fetch to fail on check-user but succeed on verify-email
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: false }) // check-user fails
      .mockResolvedValueOnce({ // verify-email succeeds
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ exists: true, confirmed: true })
      })

    const ok = await service.isEmailAuthenticated('user@example.com')
    expect(ok).toBe(true)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/auth/check-user', expect.any(Object))
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/auth/verify-email', expect.any(Object))
  })
})