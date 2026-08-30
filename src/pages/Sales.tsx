import { useMemo, useState } from 'react'
import { Plus, Trash2, ShoppingCart } from 'lucide-react'
import { usePharmacy } from '../lib/storage'
import type { SaleItem } from '../types'
import { formatCurrency, formatDateTime } from '../lib/format'

interface DraftLine {
  medicineId: string
  qty: number
}

export default function Sales() {
  const { data, addSale } = usePharmacy()
  const [lines, setLines] = useState<DraftLine[]>([{ medicineId: '', qty: 1 }])

  const availableMedicines = data.medicines.filter((m) => m.stock > 0)

  const total = useMemo(() => {
    return lines.reduce((sum, line) => {
      const med = data.medicines.find((m) => m.id === line.medicineId)
      if (!med) return sum
      return sum + med.sellPrice * line.qty
    }, 0)
  }, [lines, data.medicines])

  function updateLine(i: number, patch: Partial<DraftLine>) {
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...patch } : l)))
  }

  function addLine() {
    setLines((prev) => [...prev, { medicineId: '', qty: 1 }])
  }

  function removeLine(i: number) {
    setLines((prev) => prev.filter((_, idx) => idx !== i))
  }

  function submitSale() {
    const items: SaleItem[] = []
    for (const line of lines) {
      const med = data.medicines.find((m) => m.id === line.medicineId)
      if (!med || line.qty <= 0) continue
      if (line.qty > med.stock) {
        alert(`الكمية المطلوبة من "${med.name}" أكبر من المتاح بالمخزون (${med.stock})`)
        return
      }
      items.push({ medicineId: med.id, name: med.name, qty: line.qty, unitPrice: med.sellPrice, unitCost: med.costPrice })
    }
    if (items.length === 0) {
      alert('اختر صنفًا واحدًا على الأقل')
      return
    }
    const saleTotal = Number(items.reduce((sum, it) => sum + it.qty * it.unitPrice, 0).toFixed(2))
    addSale({ id: `sale-${Date.now()}`, date: new Date().toISOString(), items, total: saleTotal })
    setLines([{ medicineId: '', qty: 1 }])
  }

  const recentSales = [...data.sales].sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 15)

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--text)]">المبيعات</h1>
        <p className="text-sm text-[var(--text-muted)]">تسجيل فاتورة بيع جديدة ومتابعة سجل المبيعات</p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm lg:col-span-1">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <ShoppingCart size={16} />
            فاتورة جديدة
          </h2>

          <div className="flex flex-col gap-3">
            {lines.map((line, i) => {
              const med = data.medicines.find((m) => m.id === line.medicineId)
              return (
                <div key={i} className="flex items-end gap-2">
                  <div className="flex-1">
                    <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الصنف</label>
                    <select value={line.medicineId} onChange={(e) => updateLine(i, { medicineId: e.target.value })} className="input w-full">
                      <option value="">اختر دواء...</option>
                      {availableMedicines.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} ({m.stock} متاح)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="w-20">
                    <label className="mb-1 block text-xs font-medium text-[var(--text-muted)]">الكمية</label>
                    <input
                      type="number"
                      min={1}
                      max={med?.stock ?? 1}
                      value={line.qty}
                      onChange={(e) => updateLine(i, { qty: Number(e.target.value) })}
                      className="input w-full"
                    />
                  </div>
                  <button onClick={() => removeLine(i)} className="mb-0.5 rounded-md p-2 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600">
                    <Trash2 size={16} />
                  </button>
                </div>
              )
            })}

            <button onClick={addLine} className="flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-[var(--border)] py-2 text-xs font-medium text-[var(--text-muted)] hover:border-[var(--brand)] hover:text-[var(--brand-dark)]">
              <Plus size={14} />
              إضافة صنف
            </button>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-4">
            <span className="text-sm font-medium text-[var(--text-muted)]">الإجمالي</span>
            <span className="text-lg font-bold text-[var(--text)]">{formatCurrency(total)}</span>
          </div>

          <button onClick={submitSale} className="mt-4 w-full rounded-lg bg-[var(--brand)] py-2.5 text-sm font-bold text-white hover:bg-[var(--brand-dark)]">
            تأكيد البيع
          </button>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-[var(--border)] p-5 pb-3">
            <h2 className="text-sm font-bold text-[var(--text)]">آخر الفواتير</h2>
          </div>
          <div className="max-h-[560px] overflow-y-auto">
            {recentSales.length === 0 && <div className="p-6 text-center text-sm text-[var(--text-muted)]">لا توجد فواتير بعد</div>}
            <ul className="divide-y divide-[var(--border)]">
              {recentSales.map((sale) => (
                <li key={sale.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">
                      {sale.items.map((it) => `${it.name} ×${it.qty}`).join('، ')}
                    </div>
                    <div className="text-xs text-[var(--text-muted)]">{formatDateTime(sale.date)}</div>
                  </div>
                  <span className="font-bold text-[var(--brand-dark)]">{formatCurrency(sale.total)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
