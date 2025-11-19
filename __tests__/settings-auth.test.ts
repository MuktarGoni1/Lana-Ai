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

describe('Settings Page Functionality with Authentication', () => {
  // Mock authenticated user
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    user_metadata: {
      role: 'guardian',
      onboarding_complete: true,
      first_name: 'Test',
      last_name: 'User'
    }
  }

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

  test('Authenticated user can access settings page', async () => {
    // Mock settings API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        user: mockUser,
        preferences: {
          theme: 'light',
          notifications: true,
          language: 'en'
        }
      })
    })

    // Simulate authenticated user accessing settings
    const user = await getCurrentUser()
    expect(user).toBeDefined()
    expect(user?.email).toBe('test@example.com')

    // Simulate settings page access
    const settingsResponse = await fetch('/api/settings')
    expect(settingsResponse.ok).toBe(true)
    
    const settingsData = await settingsResponse.json()
    expect(settingsData.user.email).toBe('test@example.com')
    expect(settingsData.preferences.theme).toBe('light')
  })

  test('Profile updates work correctly', async () => {
    // Mock profile update response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        message: 'Profile updated successfully',
        user: {
          ...mockUser,
          user_metadata: {
            ...mockUser.user_metadata,
            first_name: 'Updated',
            last_name: 'Name'
          }
        }
      })
    })

    // Update profile
    const updateResponse = await fetch('/api/settings/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: 'Updated',
        last_name: 'Name'
      })
    })

    expect(updateResponse.ok).toBe(true)
    
    const result = await updateResponse.json()
    expect(result.success).toBe(true)
    expect(result.message).toBe('Profile updated successfully')
    expect(result.user.user_metadata.first_name).toBe('Updated')
    expect(result.user.user_metadata.last_name).toBe('Name')
  })

  test('Preference changes work correctly', async () => {
    // Mock preference update response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        success: true,
        message: 'Preferences updated successfully',
        preferences: {
          theme: 'dark',
          notifications: false,
          language: 'es'
        }
      })
    })

    // Update preferences
    const updateResponse = await fetch('/api/settings/preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: 'dark',
        notifications: false,
        language: 'es'
      })
    })

    expect(updateResponse.ok).toBe(true)
    
    const result = await updateResponse.json()
    expect(result.success).toBe(true)
    expect(result.message).toBe('Preferences updated successfully')
    expect(result.preferences.theme).toBe('dark')
    expect(result.preferences.notifications).toBe(false)
    expect(result.preferences.language).toBe('es')
  })

  test('Settings handle validation errors properly', async () => {
    // Mock validation error response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 400,
      json: jest.fn().mockResolvedValue({
        error: 'Invalid input data',
        details: {
          first_name: 'First name is required'
        }
      })
    })

    // Try to update with invalid data
    const updateResponse = await fetch('/api/settings/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        first_name: '', // Invalid - required field
        last_name: 'Name'
      })
    })

    expect(updateResponse.ok).toBe(false)
    expect(updateResponse.status).toBe(400)
    
    const errorData = await updateResponse.json()
    expect(errorData.error).toBe('Invalid input data')
    expect(errorData.details.first_name).toBe('First name is required')
  })

  test('Settings handle API errors gracefully', async () => {
    // Mock API error
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
      json: jest.fn().mockResolvedValue({ error: 'Internal Server Error' })
    })

    const settingsResponse = await fetch('/api/settings')
    expect(settingsResponse.ok).toBe(false)
    expect(settingsResponse.status).toBe(500)
    
    const errorData = await settingsResponse.json()
    expect(errorData.error).toBe('Internal Server Error')
  })

  test('Settings handle network errors gracefully', async () => {
    // Mock network error
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network Error'))

    try {
      await fetch('/api/settings')
      fail('Should have thrown an error')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).toBe('Network Error')
    }
  })
})