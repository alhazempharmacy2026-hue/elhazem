import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from './database.types'

export type ElhazemClient = SupabaseClient<Database>

// Storage adapter shape matches both `window.localStorage` (web) and
// `@react-native-async-storage/async-storage` (mobile) — each app passes
// its own so this package stays platform-agnostic.
export interface AuthStorageAdapter {
  getItem(key: string): string | null | Promise<string | null>
  setItem(key: string, value: string): void | Promise<void>
  removeItem(key: string): void | Promise<void>
}

export interface CreateElhazemClientOptions {
  url: string
  anonKey: string
  storage?: AuthStorageAdapter
  autoRefreshToken?: boolean
}

export function createElhazemClient(options: CreateElhazemClientOptions): ElhazemClient {
  const { url, anonKey, storage, autoRefreshToken = true } = options

  if (!url || !anonKey) {
    throw new Error(
      'Supabase URL/anon key مش متوفرين — تأكد من ملف .env (راجع .env.example) وأنك حطيت مفاتيح مشروع Supabase الحقيقي.',
    )
  }

  return createSupabaseClient<Database>(url, anonKey, {
    auth: {
      storage,
      autoRefreshToken,
      persistSession: true,
      detectSessionInUrl: typeof window !== 'undefined' && !storage,
    },
  })
}
