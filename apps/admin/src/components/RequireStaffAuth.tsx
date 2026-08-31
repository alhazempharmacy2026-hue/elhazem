import { Navigate, Outlet } from 'react-router-dom'
import { Loader2, ShieldAlert } from 'lucide-react'
import { roleLabels } from '@elhazem/shared'
import { isStaffRole, useAuth } from '../lib/auth'

// حارس المسارات: بيتأكد إن فيه جلسة دخول صالحة وإن الملف الشخصي بتاعها دوره
// "صيدلي" أو "مدير" قبل ما يعرض أي شاشة من شاشات لوحة التحكم.
export default function RequireStaffAuth() {
  const { loading, session, profile, signOut } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center gap-2 text-[var(--text-muted)]">
        <Loader2 className="animate-spin" size={20} />
        جاري التحقق من الحساب...
      </div>
    )
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!isStaffRole(profile?.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-white p-6 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-[var(--danger)]">
            <ShieldAlert size={24} />
          </div>
          <h1 className="text-lg font-bold text-[var(--text)]">هذا الحساب مش موظف</h1>
          <p className="mt-2 text-sm text-[var(--text-muted)]">
            الحساب ده {profile ? `دوره "${roleLabels[profile.role]}"` : 'مش موجود ضمن فريق الصيدلية'} — لوحة التحكم دي
            متاحة للصيادلة والمديرين بس. تواصل مع مدير النظام لو ده خطأ.
          </p>
          <button
            onClick={() => void signOut()}
            className="mt-5 w-full rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)]"
          >
            تسجيل خروج
          </button>
        </div>
      </div>
    )
  }

  return <Outlet />
}
