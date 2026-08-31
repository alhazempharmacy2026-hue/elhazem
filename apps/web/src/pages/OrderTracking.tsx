import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Circle } from 'lucide-react'
import {
  ordersApi,
  deliveryApi,
  ORDER_STATUS_TIMELINE,
  orderTimelineIndex,
  orderStatusLabels,
  paymentStatusLabels,
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
  type Order,
  type OrderItem,
  type CourierLocation,
} from '@elhazem/shared'
import { supabase } from '../lib/supabaseClient'
import TrackingMap from '../components/TrackingMap'

export default function OrderTracking() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [courierLocation, setCourierLocation] = useState<CourierLocation | null>(null)

  useEffect(() => {
    if (!supabase || !id) return

    ordersApi.getOrder(supabase, id).then(setOrder)
    ordersApi.getOrderItems(supabase, id).then(setItems)

    const unsubscribeOrder = ordersApi.subscribeToOrder(supabase, id, setOrder)
    return unsubscribeOrder
  }, [id])

  useEffect(() => {
    if (!supabase || !order?.courierId || order.status !== 'out_for_delivery') {
      setCourierLocation(null)
      return
    }

    deliveryApi.getCourierLocation(supabase, order.courierId).then(setCourierLocation)
    const unsubscribe = deliveryApi.subscribeToCourierLocation(supabase, order.courierId, setCourierLocation)
    return unsubscribe
  }, [order?.courierId, order?.status])

  if (!order) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">جاري التحميل...</div>

  const currentIndex = orderTimelineIndex(order.status)
  const isFailedState = order.status === 'cancelled' || order.status === 'rejected'

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">{formatOrderNumber(order.id)}</h1>
          <span className="text-xs text-[var(--text-muted)]">{formatDateTime(order.createdAt)}</span>
        </div>
        <div className="mt-1 text-sm text-[var(--text-muted)]">
          {formatCurrency(order.total)} — {paymentStatusLabels[order.paymentStatus]}
        </div>
      </div>

      {isFailedState ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 text-center text-sm text-[var(--danger)]">
          {orderStatusLabels[order.status]}
        </div>
      ) : (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">حالة الطلب</h2>
          <ol className="space-y-3">
            {ORDER_STATUS_TIMELINE.map((status, index) => {
              const done = index <= currentIndex
              return (
                <li key={status} className="flex items-center gap-2 text-sm">
                  {done ? (
                    <CheckCircle2 size={18} className="text-[var(--brand)]" />
                  ) : (
                    <Circle size={18} className="text-[var(--border)]" />
                  )}
                  <span className={done ? 'text-[var(--text)]' : 'text-[var(--text-muted)]'}>
                    {orderStatusLabels[status]}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      )}

      {courierLocation && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">موقع المندوب</h2>
          <TrackingMap lat={courierLocation.lat} lng={courierLocation.lng} />
        </div>
      )}

      <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-bold">محتويات الطلب</h2>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>
                {item.quantity} × {formatCurrency(item.unitPrice)}
              </span>
              <span className="font-medium">{formatCurrency(item.lineTotal)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
