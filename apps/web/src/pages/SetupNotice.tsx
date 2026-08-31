import { supabaseConfigError } from '../lib/supabaseClient'

export default function SetupNotice() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] p-6">
      <div className="max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--warning)]/10 text-2xl">
          ⚙️
        </div>
        <h1 className="mb-2 text-lg font-bold text-[var(--text)]">الموقع لسة مش متصل بالخادم</h1>
        <p className="mb-4 text-sm leading-relaxed text-[var(--text-muted)]">
          محتاج تحط بيانات مشروع Supabase في ملف <code dir="ltr">.env</code> (راجع
          <code dir="ltr"> .env.example</code> في مجلد <code dir="ltr">apps/web</code>) وتعيد تشغيل السيرفر.
        </p>
        {supabaseConfigError && (
          <p dir="ltr" className="rounded-lg bg-gray-50 p-3 text-left text-xs text-[var(--danger)]">
            {supabaseConfigError}
          </p>
        )}
      </div>
    </div>
  )
}
