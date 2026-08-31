import { createElhazemClient, type ElhazemClient } from '@elhazem/shared'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// بنتحقق من المتغيرين هنا (بدل ما نسيب `createElhazemClient` ترمي استثناء) عشان
// `App.tsx` يقدر يعرض شاشة إعداد واضحة بدل صفحة بيضا/كراش لو الإعداد ناقص.
export const isSupabaseConfigured = Boolean(url && anonKey)

let cachedClient: ElhazemClient | null = null

// لازم تتنادى بس بعد التأكد من `isSupabaseConfigured` (وده مضمون عمليًا لأن `App.tsx`
// بيعرض `SetupRequired` بدل أي كومبوننت تاني لو الإعداد ناقص).
export function getSupabaseClient(): ElhazemClient {
  if (!cachedClient) {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase URL/anon key مش متوفرين — تأكد من ملف .env (راجع .env.example) وأنك حطيت مفاتيح مشروع Supabase الحقيقي.',
      )
    }
    cachedClient = createElhazemClient({ url, anonKey })
  }
  return cachedClient
}
