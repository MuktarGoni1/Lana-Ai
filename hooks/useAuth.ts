'use client'

import React, { useState, useEffect, createContext, useContext } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

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
      // Instead of sending magic link, verify email and handle authentication directly
      const response = await fetch('/api/auth/check-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to verify email');
      }
      
      const data = await response.json();
      
      if (!data.exists || !data.confirmed) {
        throw new Error(data.message || 'Email not verified or confirmed');
      }
      
      // If we get here, the user is authenticated
      // In a real implementation, you would set up the session here
      // For now, we'll just refresh the user data
      await refreshUser();
      
      // Redirect to homepage
      window.location.href = '/homepage';
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