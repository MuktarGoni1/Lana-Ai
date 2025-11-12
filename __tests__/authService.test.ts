import { AuthService } from '@/lib/services/authService'

jest.mock('@/lib/db', () => {
  const signInWithOtp = jest.fn().mockResolvedValue({ data: { ok: true }, error: null })
  const from = jest.fn().mockImplementation((table: string) => ({
    insert: jest.fn().mockResolvedValue({ data: { table }, error: null })
  }))
  return {
    supabase: {
      auth: { signInWithOtp },
      from,
    },
  }
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
      expect.objectContaining({ email: 'user@example.com' })
    )
  })

  test('registerParent inserts guardian record after OTP', async () => {
    const result = await service.registerParent('guardian@example.com')
    expect(result).toEqual({ ok: true })
    const { supabase } = require('@/lib/db')
    expect(supabase.auth.signInWithOtp).toHaveBeenCalledTimes(1)
    expect(supabase.from).toHaveBeenCalledWith('guardians')
  })
})