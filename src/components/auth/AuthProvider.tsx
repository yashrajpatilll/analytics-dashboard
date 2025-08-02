'use client'

import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  email: string
  full_name: string
  avatar_url?: string
  role: 'Admin' | 'Analyst' | 'Viewer'
  team_id?: string
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  userProfile: UserProfile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  
  const supabase = createClient()

  const fetchUserProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.error('Error fetching user profile:', error)
        // Create a default profile if user_profiles table doesn't exist or user not found
        const defaultProfile: UserProfile = {
          id: userId,
          email: '',
          full_name: '',
          role: 'Viewer',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        setUserProfile(defaultProfile)
        return
      }

      setUserProfile(data)
    } catch (error) {
      console.error('Error fetching user profile:', error)
      // Fallback to default profile on any error
      const defaultProfile: UserProfile = {
        id: userId,
        email: '',
        full_name: '',
        role: 'Viewer',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      setUserProfile(defaultProfile)
    }
  }, [supabase])

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
        if (session?.user) {
          await fetchUserProfile(session.user.id)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    // Check if we're coming from auth callback with refresh parameter
    const urlParams = new URLSearchParams(window.location.search)
    const shouldRefresh = urlParams.get('refresh') === 'true'
    
    if (shouldRefresh) {
      // Remove the refresh parameter from URL without page reload
      const newUrl = new URL(window.location.href)
      newUrl.searchParams.delete('refresh')
      window.history.replaceState({}, '', newUrl.toString())
      
      // Force a fresh session check with retries for magic link
      console.log('Forcing session refresh after auth callback')
      const refreshWithRetry = async (attempts = 0) => {
        try {
          const { data: { session } } = await supabase.auth.getSession()
          if (session?.user) {
            console.log('Session found after callback:', session.user.email)
            setUser(session.user)
            await fetchUserProfile(session.user.id)
            setLoading(false)
          } else if (attempts < 3) {
            console.log(`No session found, retrying... (attempt ${attempts + 1})`)
            setTimeout(() => refreshWithRetry(attempts + 1), 500)
          } else {
            console.log('No session found after retries, falling back to normal flow')
            getInitialSession()
          }
        } catch (error) {
          console.error('Error during refresh retry:', error)
          if (attempts < 3) {
            setTimeout(() => refreshWithRetry(attempts + 1), 500)
          } else {
            getInitialSession()
          }
        }
      }
      
      setTimeout(() => refreshWithRetry(), 100)
    } else {
      getInitialSession()
    }

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        // Handle different auth events
        if (event === 'SIGNED_IN' && session?.user) {
          console.log('User signed in via:', session.user.email)
          setUser(session.user)
          await fetchUserProfile(session.user.id)
          setLoading(false)
        } else if (event === 'SIGNED_OUT' || !session?.user) {
          console.log('User signed out or no session')
          setUser(null)
          setUserProfile(null)
          setLoading(false)
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          console.log('Token refreshed for:', session.user.email)
          setUser(session.user)
          if (!userProfile || userProfile.id !== session.user.id) {
            await fetchUserProfile(session.user.id)
          }
          setLoading(false)
        } else {
          // For other events, just update the state
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchUserProfile(session.user.id)
          } else {
            setUserProfile(null)
          }
          setLoading(false)
        }
      }
    )

    // Refresh session when window comes back into focus (handles email link clicks)
    const handleFocus = () => {
      console.log('Window focused, refreshing session...')
      getInitialSession()
    }

    window.addEventListener('focus', handleFocus)

    return () => {
      subscription.unsubscribe()
      window.removeEventListener('focus', handleFocus)
    }
  }, [supabase, fetchUserProfile, userProfile])

  const signOut = async () => {
    try {
      setLoading(true)
      await supabase.auth.signOut()
      setUser(null)
      setUserProfile(null)
    } catch (error) {
      console.error('Error signing out:', error)
    } finally {
      setLoading(false)
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}