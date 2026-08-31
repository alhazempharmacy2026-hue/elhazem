import { useMemo, useState } from 'react'
import { AlertTriangle, Flame, Plus, Trash2, TrendingDown, X } from 'lucide-react'
import { useAppData } from '../lib/storage'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'
import { emergencyExtraCost, isThisMonth } from '../lib/inventory'
import StatCard from '../components/StatCard'
import type { EmergencyPurchase } from '../types'

function emptyForm(): Omit<EmergencyPurchase, 'id'> {
  return { date: new Date().toISOString().slice(0, 10), itemId: undefined, itemName: '', sourcePharmacy: '', quantity: undefined, publicPrice: undefined, costPrice: undefined, note: '' }
}

export default function EmergencyPurchases() {
  const { data, addEmergencyPurchase, deleteEmergencyPurchase } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<EmergencyPurchase, 'id'>>(emptyForm())

  const rows = useMemo(() => [...data.emergencyPurchases].sort((a, b) => (a.date < b.date ? 1 : -1)), [data.emergencyPurchases])

  const monthRows = useMemo(() => rows.filter((r) => isThisMonth(r.date)), [rows])
  const monthCost = useMemo(() => monthRows.reduce((sum, r) => sum + (r.costPrice ?? 0) * (r.quantity ?? 1), 0), [monthRows])
  const monthExtraCost = useMemo(() => monthRows.reduce((sum, r) => sum + emergencyExtraCost(r, data.items), 0), [monthRows, data.items])

  const topOffenders = useMemo(() => {
    const byName = new Map<string, { name: string; count: number; totalCost: number }>()
    for (const r of rows) {
      const key = r.itemName.trim().toLowerCase()
      const entry = byName.get(key) ?? { name: r.itemName, count: 0, totalCost: 0 }
      entry.count += 1
      entry.totalCost += (r.costPrice ?? 0) * (r.quantity ?? 1)
      byName.set(key, entry)
    }
    return [...byName.values()].sort((a, b) => b.count - a.count).slice(0, 5)
  }, [rows])

  function itemNameFor(id: string) {
    return data.items.find((i) => i.id === id)?.name ?? ''
  }

  function submit() {
    if (!form.itemName.trim()) return
    addEmergencyPurchase(form)
    setForm(emptyForm())
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">الشراء الاضطراري من برا</h1>
          <p className="text-sm text-[var(--text-muted)]">سجّل كل مرة اضطريت تشتري صنف من صيدلية تانية عشان خلص، عشان تعرف الأصناف اللي بتتكرر معاك وتزود مخزونها</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]">
          <Plus size={16} />
          تسجيل عملية شراء اضطراري
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="عدد المرات هذا الشهر" value={formatNumber(monthRows.length)} icon={AlertTriangle} tone={monthRows.length > 0 ? 'warning' : 'neutral'} />
        <StatCard label="التكلفة هذا الشهر" value={formatCurrency(monthCost)} icon={Flame} tone="neutral" />
        <StatCard label="خسارة إضافية تقديرية" value={formatCurrency(monthExtraCost)} icon={TrendingDown} tone={monthExtraCost > 0 ? 'danger' : 'neutral'} hint="فرق السعر عن الشراء العادي" />
      </div>

      {topOffenders.length > 0 && (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">الأصناف الأكتر تكرارًا (زوّد حد الطلب الأدنى ليها في المخزون)</h2>
          <div className="flex flex-col gap-2">
            {topOffenders.map((o) => (
              <div key={o.name} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                <span className="font-medium text-[var(--text)]">{o.name}</span>
                <div className="flex items-center gap-3 text-xs text-[var(--text-muted)]">
                  <span>{o.count} مرة</span>
                  <span>{formatCurrency(o.totalCost)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50 text-right text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">التاريخ</th>
              <th className="px-4 py-3 font-medium">الصنف</th>
              <th className="px-4 py-3 font-medium">من فين</th>
              <th className="px-4 py-3 font-medium">الكمية</th>
              <th className="px-4 py-3 font-medium">سعر الشراء</th>
              <th className="px-4 py-3 font-medium">سعر الجمهور</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                <td className="px-4 py-3">{formatDate(r.date)}</td>
                <td className="px-4 py-3 font-medium text-[var(--text)]">{r.itemName}</td>
                <td className="px-4 py-3 text-[var(--text-muted)]">{r.sourcePharmacy || '—'}</td>
                <td className="px-4 py-3">{r.quantity !== undefined ? formatNumber(r.quantity) : '—'}</td>
                <td className="px-4 py-3">{r.costPrice !== undefined ? formatCurrency(r.costPrice) : '—'}</td>
                <td className="px-4 py-3">{r.publicPrice !== undefined ? formatCurrency(r.publicPrice) : '—'}</td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => {
                      if (confirm('حذف هذا السجل؟')) deleteEmergencyPurchase(r.id)
                    }}
                    className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  لا توجد عمليات مسجلة بعد
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">تسجيل عملية شراء اضطراري</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                التاريخ
                <input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                صنف موجود في المخزون؟
                <select
                  value={form.itemId ?? ''}
                  onChange={(e) => {
                    const id = e.target.value || undefined
                    setForm({ ...form, itemId: id, itemName: id ? itemNameFor(id) : form.itemName })
                  }}
                  className="input"
                >
                  <option value="">صنف جديد (اكتب الاسم)</option>
                  {data.items.map((i) => (
                    <option key={i.id} value={i.id}>
                      {i.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                اسم الصنف
                <input
                  value={form.itemName}
                  disabled={!!form.itemId}
                  onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                  className="input disabled:bg-gray-100"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                اتشرى منين (اسم الصيدلية)
                <input value={form.sourcePharmacy ?? ''} onChange={(e) => setForm({ ...form, sourcePharmacy: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الكمية
                <input
                  type="number"
                  value={form.quantity ?? ''}
                  onChange={(e) => setForm({ ...form, quantity: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                سعر الشراء الفعلي
                <input
                  type="number"
                  value={form.costPrice ?? ''}
                  onChange={(e) => setForm({ ...form, costPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                سعر الجمهور
                <input
                  type="number"
                  value={form.publicPrice ?? ''}
                  onChange={(e) => setForm({ ...form, publicPrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                ملاحظة
                <input value={form.note ?? ''} onChange={(e) => setForm({ ...form, note: e.target.value })} className="input" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
                إلغاء
              </button>
              <button onClick={submit} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]">
                حفظ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
