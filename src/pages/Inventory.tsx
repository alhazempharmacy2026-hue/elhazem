import { useMemo, useRef, useState } from 'react'
import { AlertTriangle, Download, Package, PackageX, Pencil, Plus, Search, Trash2, TriangleAlert, Upload, Wallet, X } from 'lucide-react'
import { useAppData } from '../lib/storage'
import { ITEM_COLUMNS } from '../data/itemColumns'
import { importItemsFromCSV } from '../lib/importItems'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'
import { inventoryValue, STATUS_LABEL, stockStatus, type StockStatus } from '../lib/inventory'
import StatCard from '../components/StatCard'
import type { Item } from '../types'

const STATUS_BADGE: Record<StockStatus, string> = {
  out: 'bg-red-100 text-red-700',
  low: 'bg-amber-100 text-amber-700',
  ok: 'bg-[var(--brand)]/10 text-[var(--brand-dark)]',
}

function emptyForm(): Omit<Item, 'id' | 'updatedAt'> {
  return { name: '', code: '', unit: '', category: '', currentStock: 0, minStock: 0, purchasePrice: undefined, salePrice: undefined, supplierId: undefined }
}

function downloadTemplate() {
  const header = ITEM_COLUMNS.map((c) => c.label).join(',')
  const blob = new Blob(['﻿' + header + '\n'], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'نموذج-الأصناف-والمخزون.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function Inventory() {
  const { data, addItem, updateItem, deleteItem, importItems } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Item | null>(null)
  const [form, setForm] = useState<Omit<Item, 'id' | 'updatedAt'>>(emptyForm())
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | StockStatus>('all')

  const supplierName = (id?: string) => data.suppliers.find((s) => s.id === id)?.name ?? '—'

  const stats = useMemo(() => {
    const out = data.items.filter((i) => stockStatus(i) === 'out').length
    const low = data.items.filter((i) => stockStatus(i) === 'low').length
    return { total: data.items.length, out, low, value: inventoryValue(data.items) }
  }, [data.items])

  const rows = useMemo(() => {
    let list = [...data.items]
    if (statusFilter !== 'all') list = list.filter((i) => stockStatus(i) === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((i) => i.name.toLowerCase().includes(q) || i.code?.toLowerCase().includes(q))
    }
    return list.sort((a, b) => {
      const sa = stockStatus(a)
      const sb = stockStatus(b)
      const order: Record<StockStatus, number> = { out: 0, low: 1, ok: 2 }
      if (order[sa] !== order[sb]) return order[sa] - order[sb]
      return a.name.localeCompare(b.name, 'ar')
    })
  }, [data.items, statusFilter, search])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(item: Item) {
    setEditing(item)
    setForm(item)
    setShowForm(true)
  }

  function submit() {
    if (!form.name.trim()) return
    if (editing) {
      updateItem({ ...editing, ...form })
    } else {
      addItem(form)
    }
    setShowForm(false)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const result = importItemsFromCSV(text)
      if (result.rows.length === 0) {
        setImportMsg('لم يتم العثور على صفوف صالحة. تأكد إن أول صف فيه أسماء الأعمدة وعمود "اسم الصنف" موجود.')
        return
      }
      const { added, updated, newSuppliers } = importItems(result.rows)
      let msg = `تم إضافة ${added} صنف جديد وتحديث ${updated} صنف موجود.`
      if (newSuppliers > 0) msg += ` تم إنشاء ${newSuppliers} مورد جديد تلقائيًا.`
      if (result.unmatchedHeaders.length > 0) msg += ` أعمدة لم يتم التعرف عليها وتم تجاهلها: ${result.unmatchedHeaders.join('، ')}`
      setImportMsg(msg)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">المخزون والأصناف</h1>
          <p className="text-sm text-[var(--text-muted)]">استورد ملف الأصناف من برنامج الصيدلية، وحدد حد الطلب الأدنى لكل صنف عشان تتنبه قبل ما يخلص</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={downloadTemplate}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-50"
          >
            <Download size={16} />
            تنزيل نموذج الأعمدة
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 rounded-lg border border-[var(--brand)] px-3 py-2 text-sm font-medium text-[var(--brand-dark)] hover:bg-[var(--brand)]/10"
          >
            <Upload size={16} />
            استيراد CSV
          </button>
          <input ref={fileInputRef} type="file" accept=".csv,text/csv" onChange={handleFile} className="hidden" />
          <button
            onClick={openAdd}
            className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]"
          >
            <Plus size={16} />
            إضافة صنف يدويًا
          </button>
        </div>
      </div>

      {importMsg && (
        <div className="flex items-start justify-between gap-3 rounded-lg border border-[var(--brand)]/30 bg-[var(--brand)]/5 px-4 py-3 text-sm text-[var(--brand-dark)]">
          <span>{importMsg}</span>
          <button onClick={() => setImportMsg(null)} className="shrink-0 text-[var(--text-muted)] hover:text-[var(--text)]">
            <X size={16} />
          </button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="عدد الأصناف" value={formatNumber(stats.total)} icon={Package} tone="neutral" />
        <StatCard label="أصناف نفدت" value={formatNumber(stats.out)} icon={PackageX} tone={stats.out > 0 ? 'danger' : 'neutral'} />
        <StatCard label="أصناف منخفضة" value={formatNumber(stats.low)} icon={TriangleAlert} tone={stats.low > 0 ? 'warning' : 'neutral'} />
        <StatCard label="قيمة المخزون التقديرية" value={formatCurrency(stats.value)} icon={Wallet} tone="brand" hint="بسعر الشراء" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الكود..."
            className="input w-full pr-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-white p-1">
          {(['all', 'out', 'low', 'ok'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                statusFilter === s ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:bg-gray-100'
              }`}
            >
              {s === 'all' ? 'الكل' : STATUS_LABEL[s]}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50 text-right text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">الصنف</th>
              <th className="px-4 py-3 font-medium">الكود</th>
              <th className="px-4 py-3 font-medium">الكمية الحالية</th>
              <th className="px-4 py-3 font-medium">حد الطلب الأدنى</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">سعر الشراء</th>
              <th className="px-4 py-3 font-medium">سعر البيع</th>
              <th className="px-4 py-3 font-medium">المورد</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((item) => {
              const status = stockStatus(item)
              return (
                <tr key={item.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[var(--text)]">
                    {item.name}
                    {item.category && <div className="text-xs font-normal text-[var(--text-muted)]">{item.category}</div>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{item.code || '—'}</td>
                  <td className="px-4 py-3">{formatNumber(item.currentStock)}</td>
                  <td className="px-4 py-3">{formatNumber(item.minStock)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[status]}`}>
                      {status !== 'ok' && <AlertTriangle size={12} />}
                      {STATUS_LABEL[status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{item.purchasePrice !== undefined ? formatCurrency(item.purchasePrice) : '—'}</td>
                  <td className="px-4 py-3">{item.salePrice !== undefined ? formatCurrency(item.salePrice) : '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{supplierName(item.supplierId)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(item)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف صنف "${item.name}"؟`)) deleteItem(item.id)
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
            {rows.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  {data.items.length === 0 ? 'لا توجد أصناف — استورد ملف CSV من برنامج الصيدلية أو أضف صنف يدويًا' : 'لا توجد نتائج مطابقة'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {data.items.length > 0 && (
        <p className="text-xs text-[var(--text-muted)]">
          آخر تحديث لأول صنف: {rows[0] ? formatDate(rows[0].updatedAt) : '—'} — أعد استيراد الملف بشكل دوري (يوميًا أو أسبوعيًا) لتحديث الكميات
        </p>
      )}

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">{editing ? 'تعديل صنف' : 'إضافة صنف جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                اسم الصنف
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الكود
                <input value={form.code ?? ''} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الوحدة
                <input value={form.unit ?? ''} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="input" />
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                التصنيف
                <input value={form.category ?? ''} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الكمية الحالية
                <input
                  type="number"
                  value={form.currentStock}
                  onChange={(e) => setForm({ ...form, currentStock: Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                حد الطلب الأدنى
                <input
                  type="number"
                  value={form.minStock}
                  onChange={(e) => setForm({ ...form, minStock: Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                سعر الشراء
                <input
                  type="number"
                  value={form.purchasePrice ?? ''}
                  onChange={(e) => setForm({ ...form, purchasePrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                سعر البيع
                <input
                  type="number"
                  value={form.salePrice ?? ''}
                  onChange={(e) => setForm({ ...form, salePrice: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                المورد
                <select
                  value={form.supplierId ?? ''}
                  onChange={(e) => setForm({ ...form, supplierId: e.target.value || undefined })}
                  className="input"
                >
                  <option value="">بدون</option>
                  {data.suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </label>
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
