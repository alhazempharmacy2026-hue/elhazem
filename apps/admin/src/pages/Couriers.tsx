import { useEffect, useState } from 'react'
import { Loader2, Phone, User } from 'lucide-react'
import { formatDate } from '@elhazem/shared'
import { getSupabaseClient } from '../lib/supabaseClient'

interface CourierRow {
  id: string
  full_name: string | null
  phone: string | null
  created_at: string
}

export default function Couriers() {
  const [couriers, setCouriers] = useState<CourierRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const client = getSupabaseClient()
    client
      .from('profiles')
      .select('id, full_name, phone, created_at')
      .eq('role', 'courier')
      .order('created_at', { ascending: false })
      .then(({ data, error: loadError }) => {
        if (!active) return
        if (loadError) setError(loadError.message)
        else setCouriers(data ?? [])
        setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[var(--text)]">مناديب التوصيل</h1>
      <p className="mb-5 text-sm text-[var(--text-muted)]">
        قائمة بحسابات المناديب المسجلين — إضافة مندوب جديد بتتم عن طريق مدير النظام (لازم يظبط دور الحساب `courier` يدويًا).
      </p>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--text-muted)]">
            <Loader2 className="animate-spin" size={18} />
            جاري التحميل...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-[var(--danger)]">{error}</div>
        ) : couriers.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">مفيش مناديب مسجلين لسه</div>
        ) : (
          <ul className="divide-y divide-[var(--border)]">
            {couriers.map((courier) => (
              <li key={courier.id} className="flex items-center justify-between gap-3 px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)]/10 text-[var(--brand-dark)]">
                    <User size={16} />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">{courier.full_name ?? 'بدون اسم'}</div>
                    <div className="text-xs text-[var(--text-muted)]">انضم في {formatDate(courier.created_at)}</div>
                  </div>
                </div>
                {courier.phone && (
                  <div className="flex items-center gap-1.5 text-sm text-[var(--text-muted)]" dir="ltr">
                    <Phone size={14} />
                    {courier.phone}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
