import { Link, useNavigate } from 'react-router-dom'
import { Trash2 } from 'lucide-react'
import { DEFAULT_DELIVERY_FEE, formatCurrency } from '@elhazem/shared'
import { useCart } from '../lib/CartContext'

export default function CartPage() {
  const { items, subtotal, setQuantity, removeItem, requiresPrescription } = useCart()
  const navigate = useNavigate()

  if (items.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="mb-4 text-sm text-[var(--text-muted)]">عربتك فاضية</p>
        <Link to="/" className="btn-primary inline-block">
          تصفح المنتجات
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-3 lg:col-span-2">
        {items.map((item) => (
          <div key={item.medicineId} className="flex items-center gap-3 rounded-2xl border border-[var(--border)] bg-white p-3">
            <div className="flex-1">
              <div className="text-sm font-semibold">{item.medicine.nameAr}</div>
              <div className="text-xs text-[var(--text-muted)]">{formatCurrency(item.medicine.price)}</div>
            </div>
            <div className="flex items-center rounded-lg border border-[var(--border)]">
              <button className="px-2 py-1" onClick={() => setQuantity(item.medicineId, item.quantity - 1)}>
                -
              </button>
              <span className="w-6 text-center text-sm">{item.quantity}</span>
              <button
                className="px-2 py-1"
                onClick={() => setQuantity(item.medicineId, Math.min(item.medicine.stockQuantity, item.quantity + 1))}
              >
                +
              </button>
            </div>
            <button onClick={() => removeItem(item.medicineId)} className="p-2 text-[var(--danger)]">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-[var(--border)] bg-white p-5">
        <h2 className="mb-3 text-sm font-bold">ملخص الطلب</h2>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">الإجمالي الفرعي</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[var(--text-muted)]">رسوم التوصيل</span>
          <span>{formatCurrency(DEFAULT_DELIVERY_FEE)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-[var(--border)] pt-2 text-sm font-bold">
          <span>الإجمالي</span>
          <span>{formatCurrency(subtotal + DEFAULT_DELIVERY_FEE)}</span>
        </div>
        {requiresPrescription && (
          <p className="mt-3 rounded-lg bg-[var(--warning)]/10 p-2 text-xs text-[var(--warning)]">
            في العربة صنف يستلزم روشتة — هتحتاج ترفعها في خطوات الطلب
          </p>
        )}
        <button onClick={() => navigate('/checkout')} className="btn-primary mt-4 w-full">
          إتمام الطلب
        </button>
      </div>
    </div>
  )
}
