import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2, LogIn } from 'lucide-react'
import { authApi } from '@elhazem/shared'
import { getSupabaseClient } from '../lib/supabaseClient'
import { isStaffRole, useAuth } from '../lib/auth'

export default function Login() {
  const { session, profile, loading } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  // لو أصلاً في جلسة صالحة لموظف، مفيش داعي نعرض شاشة الدخول تاني
  if (!loading && session && isStaffRole(profile?.role)) {
    return <Navigate to="/orders" replace />
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await authApi.signIn(getSupabaseClient(), { email, password })
      navigate('/orders', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حصل خطأ غير متوقع، حاول تاني')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--brand)] text-white text-xl font-bold">
            ص
          </div>
          <h1 className="text-lg font-bold text-[var(--text)]">صيدلية الحازم</h1>
          <p className="mt-1 text-sm text-[var(--text-muted)]">تسجيل دخول الموظفين</p>
        </div>

        <label className="mb-3 block">
          <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">البريد الإلكتروني</span>
          <input
            type="email"
            required
            autoComplete="email"
            className="input w-full"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            dir="ltr"
          />
        </label>

        <label className="mb-5 block">
          <span className="mb-1 block text-xs font-medium text-[var(--text-muted)]">كلمة المرور</span>
          <input
            type="password"
            required
            autoComplete="current-password"
            className="input w-full"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            dir="ltr"
          />
        </label>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-xs text-[var(--danger)]" role="alert">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
        >
          {submitting ? <Loader2 className="animate-spin" size={16} /> : <LogIn size={16} />}
          تسجيل الدخول
        </button>

        <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
          الحساب بيتحدد من قِبل مدير النظام مسبقًا — مفيش تسجيل حساب جديد من هنا.
        </p>
      </form>
    </div>
  )
}
