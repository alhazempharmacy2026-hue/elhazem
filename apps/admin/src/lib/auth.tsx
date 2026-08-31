import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { authApi, type Profile, type UserRole } from '@elhazem/shared'
import { getSupabaseClient } from './supabaseClient'

// الأدوار المسموح لها بدخول لوحة التحكم دي — أي دور تاني (customer/courier) بيتعامل معاه
// كـ "مش موظف" حتى لو عنده حساب صالح.
export const STAFF_ROLES: UserRole[] = ['pharmacist', 'admin']

export function isStaffRole(role: UserRole | undefined): boolean {
  return !!role && STAFF_ROLES.includes(role)
}

interface AuthState {
  session: Session | null
  profile: Profile | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const client = getSupabaseClient()
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    async function loadProfile() {
      const p = await authApi.getCurrentProfile(client)
      if (active) setProfile(p)
    }

    client.auth.getSession().then(async ({ data }) => {
      if (!active) return
      setSession(data.session)
      if (data.session) await loadProfile()
      if (active) setLoading(false)
    })

    const { data: sub } = client.auth.onAuthStateChange(async (_event, newSession) => {
      if (!active) return
      setSession(newSession)
      if (newSession) {
        await loadProfile()
      } else {
        setProfile(null)
      }
      setLoading(false)
    })

    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `client` ثابت طول عمر التطبيق (singleton)
  }, [])

  async function signOut() {
    await authApi.signOut(client)
  }

  return <AuthContext.Provider value={{ session, profile, loading, signOut }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth لازم يتنادى جوه AuthProvider')
  return ctx
}
