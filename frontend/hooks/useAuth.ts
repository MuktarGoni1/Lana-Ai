'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { AuthService } from '@/lib/services/authService';

type AuthContextType = {
  user: User | null
  loading: boolean
  signIn: (email: string) => Promise<void>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get initial session
        const { data: { session } } = await supabase.auth.getSession()
        
        // Use getUser() for secure user data instead of relying on session.user directly
        if (session?.access_token) {
          const { data: { user }, error } = await supabase.auth.getUser()
          if (!error && user) {
            setUser(user)
          } else {
            setUser(null)
          }
        } else {
          setUser(null)
        }
        
        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (_event, session) => {
            if (session?.access_token) {
              // Use getUser() for secure user data
              const { data: { user }, error } = await supabase.auth.getUser()
              if (!error && user) {
                setUser(user)
              } else {
                setUser(null)
              }
            } else {
              setUser(null)
            }
            setLoading(false)
          }
        )
        
        return () => {
          subscription.unsubscribe()
        }
      } catch (error) {
        console.error('Auth initialization error:', error)
        setUser(null)
        setLoading(false)
      }
    }

    initializeAuth()
  }, [])

  const signIn = async (email: string) => {
    setLoading(true);
    try {
      // Instead of just verifying email, use the AuthService login method
      // which will send a magic link to verified users
      const authService = new AuthService();
      await authService.login(email);
      
      // Inform user that a magic link has been sent
      // In a real implementation, you might want to redirect to a "check your email" page
      window.location.href = '/login?magic-link-sent=true';
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      router.push('/login')
      router.refresh()
    } catch (error) {
      console.error('Sign out error:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (!error && user) {
        setUser(user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Refresh user error:', error)
      setUser(null)
    }
  }

  return (
    React.createElement(
      AuthContext.Provider,
      { value: { user, loading, signIn, signOut, refreshUser } },
      children
    )
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}