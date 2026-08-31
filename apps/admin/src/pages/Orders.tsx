import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import {
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
  ordersApi,
  orderStatusLabels,
  paymentStatusLabels,
  type Order,
  type OrderStatus,
} from '@elhazem/shared'
import { getSupabaseClient } from '../lib/supabaseClient'
import StatusBadge, { type BadgeTone } from '../components/StatusBadge'

const STATUS_TABS: { key: OrderStatus | 'all'; label: string }[] = [
  { key: 'all', label: 'الكل' },
  ...(Object.keys(orderStatusLabels) as OrderStatus[]).map((key) => ({ key, label: orderStatusLabels[key] })),
]

function orderStatusTone(status: OrderStatus): BadgeTone {
  if (status === 'delivered') return 'brand'
  if (status === 'cancelled' || status === 'rejected') return 'danger'
  if (status === 'pending_payment' || status === 'pharmacist_review') return 'warning'
  return 'neutral'
}

function paymentStatusTone(status: Order['paymentStatus']): BadgeTone {
  if (status === 'paid') return 'brand'
  if (status === 'failed') return 'danger'
  if (status === 'pending') return 'warning'
  return 'neutral'
}

export default function Orders() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<OrderStatus | 'all'>('all')
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    setLoading(true)
    setError(null)

    ordersApi
      .listOrderQueue(getSupabaseClient(), tab === 'all' ? undefined : [tab])
      .then((data) => {
        if (active) setOrders(data)
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : 'تعذر تحميل الطلبات')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [tab])

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-[var(--text)]">الطلبات</h1>
      <p className="mb-5 text-sm text-[var(--text-muted)]">متابعة وإدارة طلبات العملاء الواردة</p>

      <div className="mb-5 flex flex-wrap gap-1.5">
        {STATUS_TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === key
                ? 'bg-[var(--brand)] text-white'
                : 'border border-[var(--border)] bg-white text-[var(--text-muted)] hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center gap-2 p-10 text-sm text-[var(--text-muted)]">
            <Loader2 className="animate-spin" size={18} />
            جاري التحميل...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-sm text-[var(--danger)]">{error}</div>
        ) : orders.length === 0 ? (
          <div className="p-10 text-center text-sm text-[var(--text-muted)]">مفيش طلبات في القائمة دي</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-right text-xs text-[var(--text-muted)]">
                  <th className="px-4 py-3 font-medium">رقم الطلب</th>
                  <th className="px-4 py-3 font-medium">وقت الطلب</th>
                  <th className="px-4 py-3 font-medium">الإجمالي</th>
                  <th className="px-4 py-3 font-medium">حالة الدفع</th>
                  <th className="px-4 py-3 font-medium">حالة الطلب</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-gray-50"
                  >
                    <td className="px-4 py-3 font-mono text-xs font-medium text-[var(--text)]" dir="ltr">
                      {formatOrderNumber(order.id)}
                    </td>
                    <td className="px-4 py-3 text-[var(--text-muted)]">{formatDateTime(order.createdAt)}</td>
                    <td className="px-4 py-3 font-medium text-[var(--text)]">{formatCurrency(order.total)}</td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        label={paymentStatusLabels[order.paymentStatus]}
                        tone={paymentStatusTone(order.paymentStatus)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge label={orderStatusLabels[order.status]} tone={orderStatusTone(order.status)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
