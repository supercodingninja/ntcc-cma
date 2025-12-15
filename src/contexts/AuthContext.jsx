import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext({})

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [dbError, setDbError] = useState(null)

  const fetchProfile = async (userId) => {
    try {
      setDbError(null)
      const { data, error } = await supabase
        .from('users_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Error fetching profile:', error)
        setDbError(error.message)
        throw error
      }

      if (data) {
        await supabase
          .from('users_profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId)
      }

      setProfile(data)
      return data
    } catch (error) {
      console.error('Error fetching profile:', error)
      setDbError(error.message)
      throw error
    }
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (error) {
        console.error('Session error, clearing:', error)
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      if (!session) {
        setUser(null)
        setProfile(null)
        setLoading(false)
        return
      }

      setUser(session.user)
      try {
        await fetchProfile(session.user.id)
        setLoading(false)
      } catch (err) {
        console.error('Failed to fetch profile, signing out:', err)
        await supabase.auth.signOut()
        setUser(null)
        setProfile(null)
        setLoading(false)
      }
    }).catch(err => {
      console.error('Session initialization error:', err)
      setUser(null)
      setProfile(null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_OUT') {
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }

        setUser(session?.user ?? null)
        if (session?.user) {
          try {
            await fetchProfile(session.user.id)
          } catch (err) {
            console.error('Failed to fetch profile during auth state change:', err)
            await supabase.auth.signOut()
            setUser(null)
            setProfile(null)
          }
        } else {
          setProfile(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, fullName) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })

      if (authError) throw authError

      if (authData.user) {
        await fetchProfile(authData.user.id)
      }

      return { data: authData, error: null }
    } catch (error) {
      console.error('Sign up error:', error)
      return { data: null, error }
    }
  }

  const signIn = async (email, password) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        await fetchProfile(data.user.id)
      }

      return { data, error: null }
    } catch (error) {
      console.error('Sign in error:', error)
      return { data: null, error }
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      setUser(null)
      setProfile(null)
      return { error: null }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error }
    }
  }

  const isAdmin = () => profile?.role === 'admin'
  const isEditor = () => profile?.role === 'editor' || profile?.role === 'admin'
  const isViewer = () => !!profile

  const value = {
    user,
    profile,
    loading,
    dbError,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isEditor,
    isViewer,
    refreshProfile: () => user && fetchProfile(user.id),
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
