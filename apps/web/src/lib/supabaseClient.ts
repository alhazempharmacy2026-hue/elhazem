import { createElhazemClient, type ElhazemClient } from '@elhazem/shared'

export let supabase: ElhazemClient | null = null
export let supabaseConfigError: string | null = null

try {
  supabase = createElhazemClient({
    url: import.meta.env.VITE_SUPABASE_URL,
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY,
  })
} catch (err) {
  supabaseConfigError = err instanceof Error ? err.message : 'تعذّر الاتصال بالخادم'
}

// من غير مفاتيح Supabase حقيقية، الموقع بيشتغل في "وضع تجريبي" ببيانات وهمية محلية
// (راجع src/lib/demoData.ts وdemoStore.ts) بدل ما يعرض شاشة إعداد بس.
export const isDemoMode = supabase === null
