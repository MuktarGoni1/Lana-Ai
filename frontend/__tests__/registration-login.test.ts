import { test, expect, describe } from '@jest/globals'
import { AuthService } from '@/lib/services/authService'

// Mock Supabase client
jest.mock('@/lib/db', () => {
  const signInWithOtp = jest.fn().mockResolvedValue({ data: { ok: true }, error: null })
  const signUp = jest.fn().mockResolvedValue({ data: { user: { id: 'test-user-id' } }, error: null })
  const from = jest.fn().mockReturnValue({
    insert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    upsert: jest.fn().mockResolvedValue({ data: {}, error: null }),
    delete: jest.fn().mockResolvedValue({ data: {}, error: null })
  })
  return { supabase: { auth: { signInWithOtp, signUp }, from } }
})

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    setItem: jest.fn(),
    getItem: jest.fn(),
    removeItem: jest.fn()
  },
  writable: true
})

describe('Registration and Login Flows', () => {
  let service: AuthService
  
  beforeEach(() => {
    service = new AuthService()
    jest.clearAllMocks()
  })
  
  // Test parent registration flow
  describe('Parent Registration', () => {
    test('registers parent with valid email', async () => {
      const email = 'parent@example.com'
      const result = await service.registerParent(email)
      
      expect(result).toEqual({ ok: true })
      
      const { supabase } = require('@/lib/db')
      // Check that we create a guardian record first
      expect(supabase.from).toHaveBeenCalledWith('guardians')
      expect(supabase.from('guardians').upsert).toHaveBeenCalledWith(
        { email: 'parent@example.com', weekly_report: true, monthly_report: false },
        { onConflict: 'email' }
      )
      
      // Check that we send the magic link
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({ 
          email: 'parent@example.com',
          options: expect.objectContaining({ 
            emailRedirectTo: expect.stringContaining('/auth/confirmed/guardian') 
          })
        })
      )
    })
    
    test('handles parent registration with invalid email', async () => {
      const { supabase } = require('@/lib/db')
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Invalid email format') 
      })
      
      await expect(service.registerParent('invalid-email')).rejects.toThrow('Invalid email format')
    })
  })
  
  // Test child registration flow
  describe('Child Registration', () => {
    test('registers child with valid information', async () => {
      const nickname = 'TestChild'
      const age = 10
      const grade = '5'
      const guardianEmail = 'parent@example.com'
      
      const result = await service.registerChild(nickname, age, grade, guardianEmail)
      
      expect(result).toEqual({ user: { id: 'test-user-id' } })
      
      const { supabase } = require('@/lib/db')
      // Check that we create the auth user
      expect(supabase.auth.signUp).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringMatching(/^[a-z0-9-]+@child\.lana$/),
          password: expect.any(String),
          options: expect.objectContaining({
            data: { 
              role: 'child', 
              nickname, 
              age, 
              grade, 
              guardian_email: guardianEmail 
            },
            emailRedirectTo: expect.stringContaining('/auth/confirmed/child')
          })
        })
      )
      
      // Check that we create a user record
      expect(supabase.from).toHaveBeenCalledWith('users')
      expect(supabase.from('users').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: expect.stringMatching(/^[a-z0-9-]+@child\.lana$/),
          user_metadata: expect.any(String)
        })
      )
      
      // Check that we link the child to the guardian
      expect(supabase.from).toHaveBeenCalledWith('guardians')
      expect(supabase.from('guardians').insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: guardianEmail,
          child_uid: expect.any(String),
          weekly_report: true,
          monthly_report: false
        })
      )
      
      // Check that we set localStorage
      expect(window.localStorage.setItem).toHaveBeenCalledWith('lana_sid', expect.any(String))
    })
    
    test('handles child registration with missing information', async () => {
      const { supabase } = require('@/lib/db')
      supabase.auth.signUp.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Missing required fields') 
      })
      
      await expect(service.registerChild('', 0, '', '')).rejects.toThrow('Missing required fields')
    })
  })
  
  // Test login flow
  describe('Login Flow', () => {
    test('sends magic link for valid email', async () => {
      const email = 'user@example.com'
      const result = await service.login(email)
      
      expect(result).toEqual({ ok: true })
      
      const { supabase } = require('@/lib/db')
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith(
        expect.objectContaining({ 
          email: 'user@example.com',
          options: expect.objectContaining({ 
            emailRedirectTo: expect.stringContaining('/term-plan?onboarding=1') 
          })
        })
      )
    })
    
    test('handles login with invalid email', async () => {
      const { supabase } = require('@/lib/db')
      supabase.auth.signInWithOtp.mockResolvedValueOnce({ 
        data: null, 
        error: new Error('Invalid email format') 
      })
      
      await expect(service.login('invalid-email')).rejects.toThrow('Invalid email format')
    })
  })
  
  // Test email verification
  describe('Email Verification', () => {
    test('verifies existing authenticated email', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ exists: true, confirmed: true })
      }) as jest.Mock
      
      const result = await service.verifyEmailWithSupabaseAuth('user@example.com')
      expect(result).toEqual({ exists: true, confirmed: true, userId: null })
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/verify-email', expect.any(Object))
    })
    
    test('returns false for non-existent email', async () => {
      global.fetch = jest.fn().mockResolvedValueOnce({
        ok: true,
        json: jest.fn().mockResolvedValueOnce({ exists: false })
      }) as jest.Mock
      
      const result = await service.isEmailAuthenticated('nonexistent@example.com')
      expect(result).toBe(false)
    })
  })
})