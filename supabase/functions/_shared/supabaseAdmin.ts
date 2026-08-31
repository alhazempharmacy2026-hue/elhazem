import { createClient } from 'jsr:@supabase/supabase-js@2'

// SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY بيتحقنوا تلقائيًا في بيئة تشغيل Edge Functions —
// مفيش داعي تحطهم يدوي في `supabase secrets set`. العميل ده بيتخطى RLS بالكامل، استخدمه بحرص.
export function createSupabaseAdminClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !serviceRoleKey) {
    throw new Error('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY غير متوفرين في بيئة الـ Edge Function')
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } })
}
