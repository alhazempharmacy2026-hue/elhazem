import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Check, ImageOff, Loader2, MapPin, Truck, X } from 'lucide-react'
import {
  formatCurrency,
  formatDateTime,
  formatOrderNumber,
  isOrderTerminal,
  ORDER_STATUS_TIMELINE,
  orderStatusLabels,
  orderTimelineIndex,
  ordersApi,
  paymentMethodLabels,
  paymentStatusLabels,
  prescriptionsApi,
  prescriptionStatusLabels,
  type Order,
  type OrderItem,
  type OrderStatus,
} from '@elhazem/shared'
import { getSupabaseClient } from '../lib/supabaseClient'
import StatusBadge, { type BadgeTone } from '../components/StatusBadge'

interface AddressInfo {
  label: string
  governorate: string
  city: string
  street: string
  building: string
  floor: string | null
  apartment: string | null
  landmark: string | null
}

interface PrescriptionInfo {
  id: string
  image_path: string
  status: 'pending' | 'approved' | 'rejected'
  reviewer_notes: string | null
}

interface CourierOption {
  id: string
  full_name: string | null
}

function prescriptionTone(status: PrescriptionInfo['status']): BadgeTone {
  if (status === 'approved') return 'brand'
  if (status === 'rejected') return 'danger'
  return 'warning'
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>()
  const client = getSupabaseClient()

  const [order, setOrder] = useState<Order | null>(null)
  const [items, setItems] = useState<OrderItem[]>([])
  const [medicineNames, setMedicineNames] = useState<Record<string, string>>({})
  const [address, setAddress] = useState<AddressInfo | null>(null)
  const [prescription, setPrescription] = useState<PrescriptionInfo | null>(null)
  const [prescriptionImageUrl, setPrescriptionImageUrl] = useState<string | null>(null)
  const [couriers, setCouriers] = useState<CourierOption[]>([])
  const [selectedCourier, setSelectedCourier] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const loadedOrder = await ordersApi.getOrder(client, id)
      if (!loadedOrder) {
        setError('الطلب غير موجود')
        return
      }
      setOrder(loadedOrder)

      const [loadedItems, addressRes, couriersRes] = await Promise.all([
        ordersApi.getOrderItems(client, id),
        client.from('addresses').select('*').eq('id', loadedOrder.addressId).maybeSingle(),
        client.from('profiles').select('id, full_name').eq('role', 'courier'),
      ])
      setItems(loadedItems)
      if (addressRes.error) throw addressRes.error
      setAddress(addressRes.data)
      if (couriersRes.error) throw couriersRes.error
      setCouriers(couriersRes.data ?? [])
      setSelectedCourier(loadedOrder.courierId ?? '')

      if (loadedItems.length > 0) {
        const medicineIds = [...new Set(loadedItems.map((item) => item.medicineId))]
        const { data: medicines, error: medicinesError } = await client
          .from('medicines')
          .select('id, name_ar')
          .in('id', medicineIds)
        if (medicinesError) throw medicinesError
        const names: Record<string, string> = {}
        for (const m of medicines ?? []) names[m.id] = m.name_ar
        setMedicineNames(names)
      } else {
        setMedicineNames({})
      }

      if (loadedOrder.prescriptionId) {
        const { data: rx, error: rxError } = await client
          .from('prescriptions')
          .select('id, image_path, status, reviewer_notes')
          .eq('id', loadedOrder.prescriptionId)
          .maybeSingle()
        if (rxError) throw rxError
        setPrescription(rx)
        if (rx) {
          const { data: signed } = await prescriptionsApi.getPrescriptionImageUrl(client, rx.image_path)
          setPrescriptionImageUrl(signed?.signedUrl ?? null)
        }
      } else {
        setPrescription(null)
        setPrescriptionImageUrl(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذر تحميل بيانات الطلب')
    } finally {
      setLoading(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `client` singleton ثابت
  }, [id])

  useEffect(() => {
    void load()
  }, [load])

  async function handleSetStatus(status: OrderStatus) {
    if (!order) return
    setActionError(null)
    setBusy(true)
    try {
      const updated = await ordersApi.setOrderStatus(client, order.id, status)
      setOrder(updated)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر تحديث حالة الطلب')
    } finally {
      setBusy(false)
    }
  }

  async function handleReviewPrescription(decision: 'approved' | 'rejected') {
    if (!prescription) return
    setActionError(null)
    setBusy(true)
    try {
      const updated = await prescriptionsApi.reviewPrescription(client, prescription.id, { status: decision })
      setPrescription({ ...prescription, status: updated.status, reviewer_notes: updated.reviewerNotes })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر تحديث حالة الروشتة')
    } finally {
      setBusy(false)
    }
  }

  async function handleAssignCourier() {
    if (!order || !selectedCourier) return
    setActionError(null)
    setBusy(true)
    try {
      await ordersApi.assignCourier(client, order.id, selectedCourier)
      setOrder({ ...order, courierId: selectedCourier })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'تعذر تعيين المندوب')
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 p-16 text-sm text-[var(--text-muted)]">
        <Loader2 className="animate-spin" size={18} />
        جاري التحميل...
      </div>
    )
  }

  if (error || !order) {
    return (
      <div>
        <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--brand-dark)]">
          <ArrowRight size={16} />
          رجوع للطلبات
        </Link>
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-center text-sm text-[var(--danger)] shadow-sm">
          {error ?? 'الطلب غير موجود'}
        </div>
      </div>
    )
  }

  const timelineIndex = orderTimelineIndex(order.status)
  const nextStatus =
    timelineIndex >= 0 && timelineIndex < ORDER_STATUS_TIMELINE.length - 1
      ? ORDER_STATUS_TIMELINE[timelineIndex + 1]
      : null
  const canCancel = !isOrderTerminal(order.status)
  const canReject = order.status === 'pharmacist_review'

  return (
    <div>
      <Link to="/orders" className="mb-4 inline-flex items-center gap-1 text-sm text-[var(--brand-dark)]">
        <ArrowRight size={16} />
        رجوع للطلبات
      </Link>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-mono text-xl font-bold text-[var(--text)]" dir="ltr">
            {formatOrderNumber(order.id)}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">{formatDateTime(order.createdAt)}</p>
        </div>
        <StatusBadge label={orderStatusLabels[order.status]} tone="brand" />
      </div>

      {actionError && (
        <div className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-[var(--danger)]" role="alert">
          {actionError}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-sm font-bold text-[var(--text)]">الأصناف</h2>
            <div className="divide-y divide-[var(--border)]">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <div>
                    <div className="font-medium text-[var(--text)]">{medicineNames[item.medicineId] ?? item.medicineId}</div>
                    <div className="text-xs text-[var(--text-muted)]">
                      {item.quantity} × {formatCurrency(item.unitPrice)}
                    </div>
                  </div>
                  <div className="font-medium text-[var(--text)]">{formatCurrency(item.lineTotal)}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 space-y-1 border-t border-[var(--border)] pt-3 text-sm">
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>المجموع الفرعي</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[var(--text-muted)]">
                <span>رسوم التوصيل</span>
                <span>{formatCurrency(order.deliveryFee)}</span>
              </div>
              <div className="flex justify-between font-bold text-[var(--text)]">
                <span>الإجمالي</span>
                <span>{formatCurrency(order.total)}</span>
              </div>
            </div>
          </section>

          {order.prescriptionId && (
            <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-bold text-[var(--text)]">الروشتة الطبية</h2>
                {prescription && (
                  <StatusBadge
                    label={prescriptionStatusLabels[prescription.status]}
                    tone={prescriptionTone(prescription.status)}
                  />
                )}
              </div>

              {prescriptionImageUrl ? (
                <img
                  src={prescriptionImageUrl}
                  alt="صورة الروشتة"
                  className="mb-4 max-h-96 w-full rounded-lg border border-[var(--border)] object-contain"
                />
              ) : (
                <div className="mb-4 flex h-40 items-center justify-center gap-2 rounded-lg border border-dashed border-[var(--border)] text-sm text-[var(--text-muted)]">
                  <ImageOff size={18} />
                  تعذر تحميل صورة الروشتة
                </div>
              )}

              {prescription?.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => void handleReviewPrescription('approved')}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
                  >
                    <Check size={16} />
                    قبول الروشتة
                  </button>
                  <button
                    onClick={() => void handleReviewPrescription('rejected')}
                    disabled={busy}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-[var(--danger)] px-3 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-red-50 disabled:opacity-60"
                  >
                    <X size={16} />
                    رفض الروشتة
                  </button>
                </div>
              )}
            </section>
          )}
        </div>

        <div className="space-y-5">
          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[var(--text)]">تغيير حالة الطلب</h2>
            <div className="flex flex-col gap-2">
              {nextStatus && (
                <button
                  onClick={() => void handleSetStatus(nextStatus)}
                  disabled={busy}
                  className="rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
                >
                  الانتقال إلى: {orderStatusLabels[nextStatus]}
                </button>
              )}
              {canReject && (
                <button
                  onClick={() => void handleSetStatus('rejected')}
                  disabled={busy}
                  className="rounded-lg border border-[var(--danger)] px-3 py-2 text-sm font-semibold text-[var(--danger)] hover:bg-red-50 disabled:opacity-60"
                >
                  رفض الطلب
                </button>
              )}
              {canCancel && (
                <button
                  onClick={() => void handleSetStatus('cancelled')}
                  disabled={busy}
                  className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-50 disabled:opacity-60"
                >
                  إلغاء الطلب
                </button>
              )}
              {!nextStatus && !canCancel && (
                <p className="text-xs text-[var(--text-muted)]">الطلب في حالة نهائية، مفيش تحديثات ممكنة.</p>
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-3 text-sm font-bold text-[var(--text)]">الدفع</h2>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">طريقة الدفع</span>
                <span className="text-[var(--text)]">{paymentMethodLabels[order.paymentMethod]}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--text-muted)]">حالة الدفع</span>
                <StatusBadge label={paymentStatusLabels[order.paymentStatus]} tone="neutral" />
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
              <MapPin size={16} />
              عنوان التوصيل
            </h2>
            {address ? (
              <div className="space-y-0.5 text-sm text-[var(--text)]">
                <div className="font-medium">{address.label}</div>
                <div className="text-[var(--text-muted)]">
                  {address.governorate} - {address.city}
                </div>
                <div className="text-[var(--text-muted)]">
                  {address.street}، مبنى {address.building}
                  {address.floor ? `، الدور ${address.floor}` : ''}
                  {address.apartment ? `، شقة ${address.apartment}` : ''}
                </div>
                {address.landmark && <div className="text-[var(--text-muted)]">علامة مميزة: {address.landmark}</div>}
              </div>
            ) : (
              <p className="text-sm text-[var(--text-muted)]">تعذر تحميل العنوان</p>
            )}
          </section>

          <section className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm">
            <h2 className="mb-3 flex items-center gap-1.5 text-sm font-bold text-[var(--text)]">
              <Truck size={16} />
              مندوب التوصيل
            </h2>
            <select
              className="input mb-2 w-full"
              value={selectedCourier}
              onChange={(e) => setSelectedCourier(e.target.value)}
            >
              <option value="">اختر مندوب...</option>
              {couriers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.full_name ?? c.id}
                </option>
              ))}
            </select>
            <button
              onClick={() => void handleAssignCourier()}
              disabled={busy || !selectedCourier || selectedCourier === order.courierId}
              className="w-full rounded-lg bg-[var(--brand)] px-3 py-2 text-sm font-semibold text-white hover:bg-[var(--brand-dark)] disabled:opacity-60"
            >
              {order.courierId ? 'تغيير المندوب' : 'تعيين مندوب'}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
