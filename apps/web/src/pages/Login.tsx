import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../lib/AuthContext'
import { isDemoMode } from '../lib/supabaseClient'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (isDemoMode) {
    return (
      <div className="mx-auto max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 text-center">
        <h1 className="mb-2 text-lg font-bold">وضع تجريبي</h1>
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          الموقع شغال دلوقتي ببيانات وهمية بدون Supabase — انت مسجل دخول تلقائيًا كـ"عميل تجريبي".
        </p>
        <Link to="/" className="btn-primary inline-block">
          الرجوع للمتجر
        </Link>
      </div>
    )
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await signIn(email, password)
      const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? '/'
      navigate(from, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل تسجيل الدخول')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6">
      <h1 className="mb-4 text-lg font-bold">تسجيل الدخول</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="email"
          required
          className="input"
          placeholder="البريد الإلكتروني"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          type="password"
          required
          className="input"
          placeholder="كلمة المرور"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
        مفيش حساب؟{' '}
        <Link to="/register" className="font-medium text-[var(--brand-dark)]">
          إنشاء حساب جديد
        </Link>
      </p>
    </div>
  )
}
