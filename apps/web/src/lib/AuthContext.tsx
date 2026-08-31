import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { authApi, type Profile } from '@elhazem/shared'
import { supabase, isDemoMode } from './supabaseClient'
import { demoProfile } from './demoData'

interface AuthContextValue {
  loading: boolean
  profile: Profile | null
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: { email: string; password: string; fullName: string; phone: string }) => Promise<void>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true)
  // في الوضع التجريبي المستخدم "مسجل دخول" دايمًا كعميل وهمي — مفيش تسجيل دخول حقيقي بدون Supabase
  const [profile, setProfile] = useState<Profile | null>(isDemoMode ? demoProfile : null)

  async function refreshProfile() {
    if (!supabase) return
    const current = await authApi.getCurrentProfile(supabase)
    setProfile(current)
  }

  useEffect(() => {
    if (!supabase) {
      setLoading(false)
      return
    }

    refreshProfile().finally(() => setLoading(false))

    const { data: subscription } = supabase.auth.onAuthStateChange(() => {
      refreshProfile()
    })

    return () => subscription.subscription.unsubscribe()
  }, [])

  const value: AuthContextValue = {
    loading,
    profile,
    isAuthenticated: profile !== null,
    async signIn(email, password) {
      if (isDemoMode) return
      if (!supabase) throw new Error('الخادم غير مهيأ')
      await authApi.signIn(supabase, { email, password })
      await refreshProfile()
    },
    async signUp(params) {
      if (isDemoMode) return
      if (!supabase) throw new Error('الخادم غير مهيأ')
      await authApi.signUp(supabase, params)
      await refreshProfile()
    },
    async signOut() {
      if (isDemoMode || !supabase) return
      await authApi.signOut(supabase)
      setProfile(null)
    },
    refreshProfile,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth لازم يُستخدم جوه AuthProvider')
  return ctx
}
