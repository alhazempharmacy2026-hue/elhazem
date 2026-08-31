import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signUpSchema } from '@elhazem/shared'
import { useAuth } from '../lib/AuthContext'
import { isDemoMode } from '../lib/supabaseClient'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' })
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

    const parsed = signUpSchema.safeParse(form)
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة')
      return
    }

    setLoading(true)
    try {
      await signUp(parsed.data)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الحساب')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6">
      <h1 className="mb-4 text-lg font-bold">إنشاء حساب جديد</h1>
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          className="input"
          placeholder="الاسم بالكامل"
          value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })}
        />
        <input
          type="email"
          className="input"
          placeholder="البريد الإلكتروني"
          value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })}
        />
        <input
          className="input"
          dir="ltr"
          placeholder="رقم الموبايل (01xxxxxxxxx)"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
        <input
          type="password"
          className="input"
          placeholder="كلمة المرور"
          value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })}
        />
        {error && <p className="text-xs text-[var(--danger)]">{error}</p>}
        <button type="submit" disabled={loading} className="btn-primary w-full">
          {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
        </button>
      </form>
      <p className="mt-4 text-center text-xs text-[var(--text-muted)]">
        عندك حساب؟{' '}
        <Link to="/login" className="font-medium text-[var(--brand-dark)]">
          تسجيل الدخول
        </Link>
      </p>
    </div>
  )
}
