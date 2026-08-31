import { authApi, type ElhazemClient, type Profile } from '@elhazem/shared'
import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { supabase } from '../lib/supabaseClient'

interface AuthContextValue {
  client: ElhazemClient
  session: Session | null
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signUp: (params: { email: string; password: string; fullName: string; phone: string }) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

// ملاحظة: المكوّن ده ميترندرش إلا لو supabase متظبط (اتشاف قبل كده في app/_layout.tsx)،
// فآمن هنا نفترض إن supabase مش null.
export function AuthProvider({ children }: PropsWithChildren) {
  const client = supabase as ElhazemClient
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  async function loadProfile() {
    try {
      const current = await authApi.getCurrentProfile(client)
      setProfile(current)
    } catch (error) {
      console.warn('فشل تحميل بيانات الحساب', error)
      setProfile(null)
    }
  }

  useEffect(() => {
    let mounted = true

    client.auth.getSession().then(async ({ data }) => {
      if (!mounted) return
      setSession(data.session)
      if (data.session) await loadProfile()
      setLoading(false)
    })

    const { data: subscription } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      if (nextSession) {
        await loadProfile()
      } else {
        setProfile(null)
      }
    })

    return () => {
      mounted = false
      subscription.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      client,
      session,
      profile,
      loading,
      refreshProfile: loadProfile,
      async signIn(email, password) {
        await authApi.signIn(client, { email, password })
      },
      async signUp(params) {
        await authApi.signUp(client, params)
      },
      async signOut() {
        await authApi.signOut(client)
        setProfile(null)
      },
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [session, profile, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth لازم يتستخدم جوه AuthProvider')
  return ctx
}
