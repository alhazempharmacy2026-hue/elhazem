import { Settings2 } from 'lucide-react'

// بتتعرض بدل صفحة بيضا/كراش لو متغيرات البيئة الخاصة بـ Supabase مش متظبطة.
export default function SetupRequired() {
  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-lg rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-[var(--warning)]">
          <Settings2 size={24} />
        </div>
        <h1 className="text-center text-lg font-bold text-[var(--text)]">الإعداد لسه ناقص</h1>
        <p className="mt-2 text-center text-sm text-[var(--text-muted)]">
          لوحة تحكم الموظفين محتاجة بيانات الاتصال بمشروع Supabase عشان تشتغل.
        </p>

        <div className="mt-6 rounded-xl bg-gray-50 p-4 text-sm text-[var(--text)]">
          <ol className="list-decimal space-y-2 pr-5">
            <li>
              انسخ ملف <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">apps/admin/.env.example</code> إلى{' '}
              <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">apps/admin/.env</code>.
            </li>
            <li>
              روح للوحة تحكم Supabase الخاصة بمشروعك: <span dir="ltr">Settings → API</span>.
            </li>
            <li>
              انسخ <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">Project URL</code> في متغير{' '}
              <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs" dir="ltr">
                VITE_SUPABASE_URL
              </code>
              .
            </li>
            <li>
              انسخ مفتاح <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs">anon public</code> في متغير{' '}
              <code className="rounded bg-gray-200 px-1.5 py-0.5 text-xs" dir="ltr">
                VITE_SUPABASE_ANON_KEY
              </code>
              .
            </li>
            <li>أعد تشغيل خادم التطوير (`npm run dev`).</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
