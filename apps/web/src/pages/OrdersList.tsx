import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ordersApi, formatCurrency, formatDateTime, formatOrderNumber, orderStatusLabels, type Order } from '@elhazem/shared'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { listDemoOrders } from '../lib/demoStore'
import { useAuth } from '../lib/AuthContext'

export default function OrdersList() {
  const { profile } = useAuth()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isDemoMode) {
      setOrders(listDemoOrders())
      setLoading(false)
      // بنحدّث كل شوية عشان يبان تقدّم حالة الطلبات (محاكاة) وهي مفتوحة الصفحة
      const interval = setInterval(() => setOrders(listDemoOrders()), 2000)
      return () => clearInterval(interval)
    }
    if (!supabase || !profile) return
    ordersApi
      .listMyOrders(supabase, profile.id)
      .then(setOrders)
      .finally(() => setLoading(false))
  }, [profile])

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">جاري التحميل...</div>
  if (orders.length === 0) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">مفيش طلبات لسة</div>

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <Link
          key={order.id}
          to={`/orders/${order.id}`}
          className="flex items-center justify-between rounded-2xl border border-[var(--border)] bg-white p-4 hover:border-[var(--brand)]"
        >
          <div>
            <div className="text-sm font-semibold">{formatOrderNumber(order.id)}</div>
            <div className="text-xs text-[var(--text-muted)]">{formatDateTime(order.createdAt)}</div>
          </div>
          <div className="text-left">
            <div className="text-sm font-bold">{formatCurrency(order.total)}</div>
            <div className="text-xs text-[var(--brand-dark)]">{orderStatusLabels[order.status]}</div>
          </div>
        </Link>
      ))}
    </div>
  )
}
