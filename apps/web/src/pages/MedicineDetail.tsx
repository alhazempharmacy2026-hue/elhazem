import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Pill, ShieldAlert } from 'lucide-react'
import { catalogApi, formatCurrency, type Medicine } from '@elhazem/shared'
import { supabase } from '../lib/supabaseClient'
import { useCart } from '../lib/CartContext'

export default function MedicineDetail() {
  const { id } = useParams<{ id: string }>()
  const [medicine, setMedicine] = useState<Medicine | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const { addItem } = useCart()

  useEffect(() => {
    if (!supabase || !id) return
    setLoading(true)
    catalogApi
      .getMedicine(supabase, id)
      .then(setMedicine)
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div className="py-10 text-center text-sm text-[var(--text-muted)]">جاري التحميل...</div>
  if (!medicine) return <div className="py-10 text-center text-sm text-[var(--danger)]">المنتج غير موجود</div>

  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-[var(--border)]">
        {medicine.imageUrl ? (
          <img src={medicine.imageUrl} alt={medicine.nameAr} className="h-full w-full rounded-2xl object-cover" />
        ) : (
          <Pill size={64} className="text-[var(--brand)]" />
        )}
      </div>

      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">{medicine.nameAr}</h1>
        {medicine.manufacturer && <div className="mt-1 text-sm text-[var(--text-muted)]">{medicine.manufacturer}</div>}
        {medicine.descriptionAr && <p className="mt-3 text-sm leading-relaxed text-[var(--text)]">{medicine.descriptionAr}</p>}

        {medicine.requiresPrescription && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-[var(--warning)]/10 px-3 py-2 text-xs font-medium text-[var(--warning)]">
            <ShieldAlert size={16} />
            الصنف ده يستلزم رفع روشتة عند إتمام الطلب
          </div>
        )}

        <div className="mt-6 text-2xl font-bold text-[var(--brand-dark)]">{formatCurrency(medicine.price)}</div>

        {medicine.stockQuantity > 0 ? (
          <div className="mt-4 flex items-center gap-3">
            <div className="flex items-center rounded-lg border border-[var(--border)]">
              <button
                className="px-3 py-2 text-lg"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="نقص الكمية"
              >
                -
              </button>
              <span className="w-8 text-center text-sm font-medium">{quantity}</span>
              <button
                className="px-3 py-2 text-lg"
                onClick={() => setQuantity((q) => Math.min(medicine.stockQuantity, q + 1))}
                aria-label="زود الكمية"
              >
                +
              </button>
            </div>
            <button className="btn-primary flex-1" onClick={() => addItem(medicine, quantity)}>
              أضف للعربة
            </button>
          </div>
        ) : (
          <div className="mt-4 rounded-lg bg-gray-50 px-4 py-3 text-sm text-[var(--danger)]">غير متوفر حاليًا</div>
        )}

        <Link to="/cart" className="mt-4 block text-center text-sm font-medium text-[var(--brand-dark)] underline">
          الذهاب للعربة
        </Link>
      </div>
    </div>
  )
}
