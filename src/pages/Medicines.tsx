import { useMemo, useState } from 'react'
import { Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { usePharmacy } from '../lib/storage'
import type { Medicine } from '../types'
import { formatCurrency, daysUntil } from '../lib/format'

const emptyForm = (): Medicine => ({
  id: '',
  name: '',
  category: '',
  unit: 'علبة',
  stock: 0,
  minStock: 15,
  costPrice: 0,
  sellPrice: 0,
  expiryDate: new Date().toISOString().slice(0, 10),
  supplier: '',
})

export default function Medicines() {
  const { data, addMedicine, updateMedicine, deleteMedicine } = usePharmacy()
  const [query, setQuery] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Medicine | null>(null)
  const [form, setForm] = useState<Medicine>(emptyForm())

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return data.medicines
    return data.medicines.filter((m) => m.name.toLowerCase().includes(q) || m.category.toLowerCase().includes(q))
  }, [data.medicines, query])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(m: Medicine) {
    setEditing(m)
    setForm(m)
    setShowForm(true)
  }

  function submit() {
    if (!form.name.trim() || !form.category.trim()) return
    if (editing) {
      updateMedicine(form)
    } else {
      addMedicine({ ...form, id: `med-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })
    }
    setShowForm(false)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">الأدوية والمخزون</h1>
          <p className="text-sm text-[var(--text-muted)]">{data.medicines.length} صنف مسجل</p>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]"
        >
          <Plus size={16} />
          إضافة دواء
        </button>
      </div>

      <div className="relative w-full max-w-sm">
        <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث بالاسم أو الفئة..."
          className="w-full rounded-lg border border-[var(--border)] bg-white py-2 pr-9 pl-3 text-sm outline-none focus:border-[var(--brand)]"
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50 text-right text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">الاسم</th>
              <th className="px-4 py-3 font-medium">الفئة</th>
              <th className="px-4 py-3 font-medium">المخزون</th>
              <th className="px-4 py-3 font-medium">سعر الشراء</th>
              <th className="px-4 py-3 font-medium">سعر البيع</th>
              <th className="px-4 py-3 font-medium">الصلاحية</th>
              <th className="px-4 py-3 font-medium">المورد</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((m) => {
              const low = m.stock <= m.minStock
              const expiryDays = daysUntil(m.expiryDate)
              const nearExpiry = expiryDays <= 30
              return (
                <tr key={m.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{m.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{m.category}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${low ? 'bg-amber-100 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                      {m.stock} {m.unit}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatCurrency(m.costPrice)}</td>
                  <td className="px-4 py-3 font-medium">{formatCurrency(m.sellPrice)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs ${nearExpiry ? 'font-semibold text-red-600' : 'text-[var(--text-muted)]'}`}>
                      {new Date(m.expiryDate).toLocaleDateString('ar-EG')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{m.supplier}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(m)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف "${m.name}"؟`)) deleteMedicine(m.id)
                        }}
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  لا توجد نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">{editing ? 'تعديل الدواء' : 'إضافة دواء جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="اسم الدواء" className="col-span-2">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </Field>
              <Field label="الفئة">
                <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
              </Field>
              <Field label="المورد">
                <input value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} className="input" />
              </Field>
              <Field label="الكمية بالمخزون">
                <input
                  type="number"
                  value={form.stock}
                  onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="حد الطلب الأدنى">
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="سعر الشراء">
                <input
                  type="number"
                  value={form.costPrice}
                  onChange={(e) => setForm({ ...form, costPrice: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="سعر البيع">
                <input
                  type="number"
                  value={form.sellPrice}
                  onChange={(e) => setForm({ ...form, sellPrice: Number(e.target.value) })}
                  className="input"
                />
              </Field>
              <Field label="تاريخ الانتهاء" className="col-span-2">
                <input
                  type="date"
                  value={form.expiryDate}
                  onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                  className="input"
                />
              </Field>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
                إلغاء
              </button>
              <button onClick={submit} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]">
                {editing ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)] ${className ?? ''}`}>
      {label}
      {children}
    </label>
  )
}
