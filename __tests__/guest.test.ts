import '@testing-library/jest-dom'
import { ensureGuestSession, getGuestId, isGuestClient } from '@/lib/guest'

// Mock supabase client session
jest.mock('@/lib/db', () => {
  let session: any = null
  return {
    supabase: {
      auth: {
        getSession: jest.fn(async () => ({ data: { session } })),
      },
    },
    __setSession: (s: any) => { session = s },
  }
})

describe('guest session utilities', () => {
  const { __setSession } = jest.requireMock('@/lib/db')

  beforeEach(() => {
    // Clear cookie
    document.cookie = 'lana_guest_id=; Max-Age=0; path=/'
    // Clear sessionStorage
    try { sessionStorage.removeItem('lana_guest_id') } catch {}
    __setSession(null)
  })

  test('assigns a guest id when no auth session exists', async () => {
    const gid = await ensureGuestSession()
    expect(gid).toMatch(/^guest-/)
    // Cookie set
    expect(document.cookie).toMatch(/lana_guest_id=/)
    // Helper reflects guest mode
    expect(isGuestClient()).toBe(true)
    expect(getGuestId()).toEqual(gid)
  })

  test('does not assign guest id when auth session exists', async () => {
    __setSession({ user: { id: 'u1' } })
    const gid = await ensureGuestSession()
    expect(gid).toBeNull()
    expect(document.cookie).not.toMatch(/lana_guest_id=/)
    expect(isGuestClient()).toBe(false)
  })
})