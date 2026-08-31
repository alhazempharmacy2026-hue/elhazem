import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { ordersApi, formatOrderNumber, orderStatusLabels, type Order } from '@elhazem/shared'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { getDemoOrder } from '../lib/demoStore'

export default function CheckoutComplete() {
  const [params] = useSearchParams()
  const orderId = params.get('orderId')
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    if (!orderId) return
    if (isDemoMode) {
      setOrder(getDemoOrder(orderId))
      return
    }
    if (!supabase) return
    // بنعتمد على حالة الطلب الحقيقية من الداتابيز، مش على أي معلومة راجعة في الرابط
    ordersApi.getOrder(supabase, orderId).then(setOrder)
  }, [orderId])

  return (
    <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-white p-8 text-center">
      <CheckCircle2 className="mx-auto mb-3 text-[var(--brand)]" size={48} />
      <h1 className="mb-2 text-lg font-bold">تم استلام طلبك بنجاح</h1>
      {order && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">
          طلب {formatOrderNumber(order.id)} — الحالة الحالية: {orderStatusLabels[order.status]}
        </p>
      )}
      <div className="flex justify-center gap-2">
        {orderId && (
          <Link to={`/orders/${orderId}`} className="btn-primary">
            تتبع الطلب
          </Link>
        )}
        <Link to="/" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm">
          الرجوع للمتجر
        </Link>
      </div>
    </div>
  )
}
