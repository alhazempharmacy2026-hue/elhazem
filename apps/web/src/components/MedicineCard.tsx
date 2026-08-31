import { Link } from 'react-router-dom'
import { Pill, Plus } from 'lucide-react'
import { formatCurrency, type Medicine } from '@elhazem/shared'
import { useCart } from '../lib/CartContext'

export default function MedicineCard({ medicine }: { medicine: Medicine }) {
  const { addItem } = useCart()

  return (
    <div className="flex flex-col rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <Link to={`/medicine/${medicine.id}`} className="flex-1">
        <div className="mb-3 flex h-28 items-center justify-center rounded-xl bg-[var(--bg)]">
          {medicine.imageUrl ? (
            <img src={medicine.imageUrl} alt={medicine.nameAr} className="h-full w-full rounded-xl object-cover" />
          ) : (
            <Pill className="text-[var(--brand)]" size={32} />
          )}
        </div>
        <div className="text-sm font-semibold text-[var(--text)]">{medicine.nameAr}</div>
        {medicine.requiresPrescription && (
          <div className="mt-1 inline-block rounded-full bg-[var(--warning)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--warning)]">
            يستلزم روشتة
          </div>
        )}
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-bold text-[var(--brand-dark)]">{formatCurrency(medicine.price)}</span>
        <button
          onClick={() => addItem(medicine, 1)}
          disabled={medicine.stockQuantity <= 0}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--brand)] text-white disabled:opacity-40"
          title="أضف للعربة"
        >
          <Plus size={16} />
        </button>
      </div>
      {medicine.stockQuantity <= 0 && <div className="mt-1 text-[11px] text-[var(--danger)]">غير متوفر حاليًا</div>}
    </div>
  )
}
