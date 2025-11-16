import { AuthService } from '@/lib/services/authService'

jest.mock('@/lib/db', () => {
  const signInWithOtp = jest.fn().mockResolvedValue({ data: { ok: true }, error: null });
  const builder = () => {
    const api: any = {
      insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      ilike: jest.fn().mockReturnThis(),
      limit: jest.fn().mockResolvedValue({ data: [], error: null }),
    };
    return api;
  };
  const tableBuilders: Record<string, any> = {};
  const from = jest.fn().mockImplementation((table: string) => {
    if (!tableBuilders[table]) {
      tableBuilders[table] = builder();
    }
    return tableBuilders[table];
  });
  return { supabase: { auth: { signInWithOtp }, from } };
})

describe('AuthService', () => {
  let service: AuthService
  beforeEach(() => {
    service = new AuthService()
    jest.clearAllMocks()
  })

  test('login sends trimmed email via OTP', async () => {
    const result = await service.login('  user@example.com  ')
    expect(result).toEqual({ ok: true })
    const { supabase } = require('@/lib/db')
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@example.com', options: expect.objectContaining({ emailRedirectTo: expect.stringContaining('/') }) })
    )
  })

  test('registerParent inserts guardian record after OTP', async () => {
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
    expect(supabase.from).toHaveBeenCalledWith('guardians')
  })

  test('isEmailAuthenticated returns true when email is found', async () => {
    const { supabase } = require('@/lib/db')
    // Mock guardians.select.eq.limit to resolve with a row
    const fromInstance = supabase.from('guardians')
    fromInstance.limit.mockResolvedValue({ data: [{ email: 'user@example.com' }], error: null })

    const ok = await service.isEmailAuthenticated('user@example.com')
    expect(ok).toBe(true)
  })

  test('isEmailAuthenticated returns false when email not found', async () => {
    const { supabase } = require('@/lib/db')
    const gFrom = supabase.from('guardians')
    const uFrom = supabase.from('users')
    gFrom.limit.mockResolvedValue({ data: [], error: null })
    uFrom.limit.mockResolvedValue({ data: [], error: null })

    const ok = await service.isEmailAuthenticated('missing@example.com')
    expect(ok).toBe(false)
  })
})