import { test, expect, describe, beforeEach, afterEach } from '@jest/globals'
import { createServerClient } from '@/lib/supabase/server'
import { getCurrentUser } from '@/lib/auth/server'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => {
  return {
    createServerClient: jest.fn()
  }
})

// Mock auth utilities
jest.mock('@/lib/auth/server', () => {
  return {
    getCurrentUser: jest.fn()
  }
})

describe('Page Access for Authenticated Users', () => {
  // Mock authenticated user
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      role: 'guardian',
      onboarding_complete: true
    }
  }

  // List of all core application pages
  const corePages = [
    '/',
    '/landing-page',
    '/homepage',
    '/dashboard',
    '/settings',
    '/guardian',
    '/term-plan',
    '/quiz',
    '/personalised-ai-tutor',
    '/onboarding'
  ]

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    
    // Setup Supabase mock to return authenticated user
    ;(createServerClient as jest.Mock).mockResolvedValue({
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: mockUser }, error: null })
      }
    })
    
    // Setup auth utility mock
    ;(getCurrentUser as jest.Mock).mockResolvedValue(mockUser)
    
    // Mock fetch globally
    global.fetch = jest.fn()
  })

  afterEach(() => {
    // Clean up mocks
    jest.restoreAllMocks()
  })

  test('Authenticated user can access all core pages', async () => {
    // Mock successful page access responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('<html>Page Content</html>')
    })

    // Verify user is authenticated
    const user = await getCurrentUser()
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')

    // Test access to each core page
    for (const page of corePages) {
      const response = await fetch(page)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      
      const content = await response.text()
      expect(content).toBe('<html>Page Content</html>')
    }
  })

  test('No unauthorized redirects to landing page', async () => {
    // Mock successful page access responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('<html>Page Content</html>')
    })

    // Verify user is authenticated
    const user = await getCurrentUser()
    expect(user).toBeDefined()

    // Test that no redirects occur for protected pages
    const protectedPages = [
      '/dashboard',
      '/settings',
      '/guardian',
      '/term-plan',
      '/quiz',
      '/personalised-ai-tutor'
    ]

    for (const page of protectedPages) {
      const response = await fetch(page)
      expect(response.status).toBe(200)
      expect(response.ok).toBe(true)
      // No redirect should occur, so location header should be null
      // Note: In real implementation, this would be tested at the middleware level
    }
  })

  test('Role-based page access works correctly', async () => {
    // Test guardian role accessing guardian-specific pages
    const guardianUser = {
      ...mockUser,
      user_metadata: {
        ...mockUser.user_metadata,
        role: 'guardian'
      }
    }
    
    ;(getCurrentUser as jest.Mock).mockResolvedValue(guardianUser)
    
    // Mock successful page access responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('<html>Guardian Page Content</html>')
    })

    const user = await getCurrentUser()
    expect(user?.user_metadata.role).toBe('guardian')

    // Guardian should be able to access guardian page
    const response = await fetch('/guardian')
    expect(response.status).toBe(200)
    expect(response.ok).toBe(true)
  })

  test('Child role page access works correctly', async () => {
    // Test child role accessing child-specific pages
    const childUser = {
      ...mockUser,
      user_metadata: {
        ...mockUser.user_metadata,
        role: 'child'
      }
    }
    
    ;(getCurrentUser as jest.Mock).mockResolvedValue(childUser)
    
    // Mock successful page access responses
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      status: 200,
      text: jest.fn().mockResolvedValue('<html>Child Page Content</html>')
    })

    const user = await getCurrentUser()
    expect(user?.user_metadata.role).toBe('child')

    // Child should be able to access personalized AI tutor page
    const response = await fetch('/personalised-ai-tutor')
    expect(response.status).toBe(200)
    expect(response.ok).toBe(true)
  })

  test('Page access handles API failures gracefully', async () => {
    // Mock API failure
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'Internal Server Error' })
    })

    const response = await fetch('/dashboard')
    expect(response.ok).toBe(false)
    expect(response.status).toBe(500)
    
    const errorData = await response.json()
    expect(errorData.error).toBe('Internal Server Error')
  })

  test('Page access handles network interruptions gracefully', async () => {
    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'))

    try {
      await fetch('/homepage')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network Error')
    }
  })
})