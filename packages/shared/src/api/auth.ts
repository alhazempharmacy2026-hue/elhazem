import type { ElhazemClient } from '../supabase/createClient'
import { mapProfile } from '../supabase/mappers'
import type { Profile } from '../types'

export async function signUp(
  client: ElhazemClient,
  params: { email: string; password: string; fullName: string; phone: string },
) {
  const { data, error } = await client.auth.signUp({
    email: params.email,
    password: params.password,
    options: { data: { full_name: params.fullName, phone: params.phone } },
  })
  if (error) throw error
  return data
}

export async function signIn(client: ElhazemClient, params: { email: string; password: string }) {
  const { data, error } = await client.auth.signInWithPassword(params)
  if (error) throw error
  return data
}

export async function signOut(client: ElhazemClient) {
  const { error } = await client.auth.signOut()
  if (error) throw error
}

export async function getCurrentProfile(client: ElhazemClient): Promise<Profile | null> {
  const { data: auth } = await client.auth.getUser()
  if (!auth.user) return null
  const { data, error } = await client.from('profiles').select('*').eq('id', auth.user.id).maybeSingle()
  if (error) throw error
  return data ? mapProfile(data) : null
}

export async function updateProfile(
  client: ElhazemClient,
  userId: string,
  patch: { fullName?: string; phone?: string; expoPushToken?: string | null },
): Promise<Profile> {
  const { data, error } = await client
    .from('profiles')
    .update({
      ...(patch.fullName !== undefined ? { full_name: patch.fullName } : {}),
      ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
      ...(patch.expoPushToken !== undefined ? { expo_push_token: patch.expoPushToken } : {}),
    })
    .eq('id', userId)
    .select('*')
    .single()
  if (error) throw error
  return mapProfile(data)
}
