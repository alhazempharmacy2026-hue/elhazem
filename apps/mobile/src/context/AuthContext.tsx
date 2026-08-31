import { authApi, type ElhazemClient, type Profile } from '@elhazem/shared'
import type { Session } from '@supabase/supabase-js'
import { createContext, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react'
import { demoProfile } from '../lib/demoData'
import { isDemoMode, supabase } from '../lib/supabaseClient'

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

// جلسة وهمية بس عشان أي كود (زي app/index.tsx) بيتحقق من `session` كـ "فيه مستخدم داخل"
// يشتغل عادي في الوضع التجريبي من غير ما يحتاج يعرف حاجة عن Supabase أصلاً.
const demoSession = { access_token: 'demo', user: { id: demoProfile.id } } as unknown as Session

export function AuthProvider({ children }: PropsWithChildren) {
  // في الوضع التجريبي `supabase` بيبقى null عمدًا — أي شاشة بتستخدم `client` لازم تتأكد
  // من isDemoMode الأول قبل ما تنادي عليه (نفس الانضباط المتبع في apps/web).
  const client = supabase as ElhazemClient
  const [session, setSession] = useState<Session | null>(isDemoMode ? demoSession : null)
  const [profile, setProfile] = useState<Profile | null>(isDemoMode ? demoProfile : null)
  const [loading, setLoading] = useState(!isDemoMode)

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
    if (isDemoMode) return
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
        if (isDemoMode) return
        await authApi.signIn(client, { email, password })
      },
      async signUp(params) {
        if (isDemoMode) return
        await authApi.signUp(client, params)
      },
      async signOut() {
        if (isDemoMode) return
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
