import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  addressesApi,
  ordersApi,
  paymentsApi,
  prescriptionsApi,
  paymentMethodLabels,
  DEFAULT_DELIVERY_FEE,
  formatCurrency,
  type Address,
  type PaymentMethod,
} from '@elhazem/shared'
import { supabase, isDemoMode } from '../lib/supabaseClient'
import { demoAddress } from '../lib/demoData'
import { placeDemoOrder } from '../lib/demoStore'
import { useAuth } from '../lib/AuthContext'
import { useCart } from '../lib/CartContext'

type Step = 'address' | 'prescription' | 'payment' | 'review'

export default function Checkout() {
  const { profile } = useAuth()
  const { items, subtotal, requiresPrescription, clear } = useCart()
  const navigate = useNavigate()

  const [step, setStep] = useState<Step>('address')
  const [addresses, setAddresses] = useState<Address[]>([])
  const [addressId, setAddressId] = useState<string | null>(null)
  const [prescriptionFile, setPrescriptionFile] = useState<File | null>(null)
  const [prescriptionId, setPrescriptionId] = useState<string | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_delivery')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // بيتفعّل قبل ما نفضي العربة عند تأكيد الطلب، عشان مانرجعش لصفحة الكارت وإحنا أصلاً بنتنقل لصفحة التأكيد
  const [orderPlaced, setOrderPlaced] = useState(false)

  useEffect(() => {
    if (isDemoMode) {
      setAddresses([demoAddress])
      setAddressId(demoAddress.id)
      return
    }
    if (!supabase || !profile) return
    addressesApi.listAddresses(supabase, profile.id).then((list) => {
      setAddresses(list)
      const defaultAddress = list.find((a) => a.isDefault) ?? list[0]
      if (defaultAddress) setAddressId(defaultAddress.id)
    })
  }, [profile])

  useEffect(() => {
    if (items.length === 0 && !orderPlaced) {
      navigate('/cart', { replace: true })
    }
  }, [items.length, orderPlaced, navigate])

  if (items.length === 0) {
    return null
  }

  async function handleUploadPrescription() {
    if (!prescriptionFile) return
    setSubmitting(true)
    setError(null)
    try {
      if (isDemoMode) {
        setPrescriptionId('demo-prescription')
        setStep('payment')
        return
      }
      if (!supabase || !profile) return
      const ext = prescriptionFile.name.split('.').pop() ?? 'jpg'
      const prescription = await prescriptionsApi.uploadPrescriptionImage(supabase, profile.id, prescriptionFile, ext)
      setPrescriptionId(prescription.id)
      setStep('payment')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل رفع الروشتة')
    } finally {
      setSubmitting(false)
    }
  }

  async function handlePlaceOrder() {
    if (!addressId) return
    setSubmitting(true)
    setError(null)
    try {
      if (isDemoMode) {
        // في الوضع التجريبي بنتخطى Paymob بالكامل ونعتبر أي طلب "اتدفع" فورًا
        const order = placeDemoOrder(items, paymentMethod)
        setOrderPlaced(true)
        clear()
        navigate(`/checkout/complete?orderId=${order.id}`, { replace: true })
        return
      }

      if (!supabase) return
      const order = await ordersApi.placeOrder(supabase, {
        addressId,
        paymentMethod,
        items,
        prescriptionId,
        deliveryFee: DEFAULT_DELIVERY_FEE,
      })

      setOrderPlaced(true)

      if (paymentMethod !== 'cash_on_delivery') {
        const { checkoutUrl } = await paymentsApi.createPaymentIntention(supabase, order.id, paymentMethod)
        clear()
        window.location.href = checkoutUrl
        return
      }

      clear()
      navigate(`/checkout/complete?orderId=${order.id}`, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'فشل إنشاء الطلب')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <h1 className="text-lg font-bold">إتمام الطلب</h1>

      {step === 'address' && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">اختار عنوان التوصيل</h2>
          {addresses.length === 0 && (
            <p className="mb-3 text-xs text-[var(--text-muted)]">
              مفيش عناوين محفوظة — روح لصفحة{' '}
              <Link to="/account" className="font-medium text-[var(--brand-dark)]">
                حسابي
              </Link>{' '}
              وضيف عنوان الأول.
            </p>
          )}
          <div className="space-y-2">
            {addresses.map((address) => (
              <label
                key={address.id}
                className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs ${
                  addressId === address.id ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-[var(--border)]'
                }`}
              >
                <input type="radio" checked={addressId === address.id} onChange={() => setAddressId(address.id)} />
                <div>
                  <div className="font-semibold">{address.label}</div>
                  <div className="text-[var(--text-muted)]">
                    {address.governorate}، {address.city}، {address.street}، مبنى {address.building}
                  </div>
                </div>
              </label>
            ))}
          </div>
          <button
            disabled={!addressId}
            onClick={() => setStep(requiresPrescription ? 'prescription' : 'payment')}
            className="btn-primary mt-4 w-full"
          >
            التالي
          </button>
        </div>
      )}

      {step === 'prescription' && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-2 text-sm font-bold">ارفع صورة الروشتة</h2>
          <p className="mb-3 text-xs text-[var(--text-muted)]">
            في عربتك صنف يستلزم وصفة طبية — الصيدلي هيراجع الصورة قبل تجهيز الطلب.
          </p>
          <input
            type="file"
            accept="image/*"
            onChange={(event) => setPrescriptionFile(event.target.files?.[0] ?? null)}
            className="input"
          />
          {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep('address')} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm">
              رجوع
            </button>
            <button disabled={!prescriptionFile || submitting} onClick={handleUploadPrescription} className="btn-primary flex-1">
              {submitting ? 'جاري الرفع...' : 'رفع ومتابعة'}
            </button>
          </div>
        </div>
      )}

      {step === 'payment' && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">طريقة الدفع</h2>
          <div className="space-y-2">
            {(Object.keys(paymentMethodLabels) as PaymentMethod[]).map((method) => (
              <label
                key={method}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border p-3 text-sm ${
                  paymentMethod === method ? 'border-[var(--brand)] bg-[var(--brand)]/5' : 'border-[var(--border)]'
                }`}
              >
                <input type="radio" checked={paymentMethod === method} onChange={() => setPaymentMethod(method)} />
                {paymentMethodLabels[method]}
              </label>
            ))}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setStep(requiresPrescription ? 'prescription' : 'address')}
              className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm"
            >
              رجوع
            </button>
            <button onClick={() => setStep('review')} className="btn-primary flex-1">
              التالي
            </button>
          </div>
        </div>
      )}

      {step === 'review' && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5">
          <h2 className="mb-3 text-sm font-bold">مراجعة الطلب</h2>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">الإجمالي الفرعي</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-muted)]">رسوم التوصيل</span>
              <span>{formatCurrency(DEFAULT_DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between border-t border-[var(--border)] pt-1 font-bold">
              <span>الإجمالي</span>
              <span>{formatCurrency(subtotal + DEFAULT_DELIVERY_FEE)}</span>
            </div>
            <div className="flex justify-between pt-2">
              <span className="text-[var(--text-muted)]">الدفع</span>
              <span>{paymentMethodLabels[paymentMethod]}</span>
            </div>
          </div>
          {error && <p className="mt-2 text-xs text-[var(--danger)]">{error}</p>}
          <div className="mt-4 flex gap-2">
            <button onClick={() => setStep('payment')} className="flex-1 rounded-lg border border-[var(--border)] py-2 text-sm">
              رجوع
            </button>
            <button disabled={submitting} onClick={handlePlaceOrder} className="btn-primary flex-1">
              {submitting ? 'جاري التنفيذ...' : 'تأكيد الطلب'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
