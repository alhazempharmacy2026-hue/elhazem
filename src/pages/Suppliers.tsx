import { useMemo, useState } from 'react'
import { Handshake, Pencil, Plus, Trash2, Wallet, X } from 'lucide-react'
import { useAppData } from '../lib/storage'
import { formatCurrency, formatDate } from '../lib/format'
import { supplierBalance, totalDebt } from '../lib/inventory'
import StatCard from '../components/StatCard'
import type { Supplier, SupplierTransaction } from '../types'

function emptySupplierForm(): Omit<Supplier, 'id'> {
  return { name: '', phone: '', notes: '' }
}

function emptyTxnForm(supplierId: string): Omit<SupplierTransaction, 'id'> {
  return { supplierId, date: new Date().toISOString().slice(0, 10), type: 'purchase', amount: 0, note: '' }
}

export default function Suppliers() {
  const { data, addSupplier, updateSupplier, deleteSupplier, addSupplierTransaction, deleteSupplierTransaction } = useAppData()
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [form, setForm] = useState<Omit<Supplier, 'id'>>(emptySupplierForm())
  const [selected, setSelected] = useState<Supplier | null>(null)
  const [txnForm, setTxnForm] = useState<Omit<SupplierTransaction, 'id'> | null>(null)

  const debt = useMemo(() => totalDebt(data.suppliers, data.supplierTransactions), [data.suppliers, data.supplierTransactions])

  const supplierTxns = useMemo(
    () => (selected ? data.supplierTransactions.filter((t) => t.supplierId === selected.id).sort((a, b) => (a.date < b.date ? 1 : -1)) : []),
    [data.supplierTransactions, selected],
  )

  function openAdd() {
    setEditing(null)
    setForm(emptySupplierForm())
    setShowForm(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm(s)
    setShowForm(true)
  }

  function submit() {
    if (!form.name.trim()) return
    if (editing) updateSupplier({ ...editing, ...form })
    else addSupplier(form)
    setShowForm(false)
  }

  function submitTxn() {
    if (!txnForm || !txnForm.amount) return
    addSupplierTransaction(txnForm)
    setTxnForm(null)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">الموردين والديون</h1>
          <p className="text-sm text-[var(--text-muted)]">سجّل كل مورد وفواتيره بالآجل وسداداته، عشان تعرف احنا مديونين لمين وبكام قبل ما تشتري تاني</p>
        </div>
        <button onClick={openAdd} className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]">
          <Plus size={16} />
          إضافة مورد
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <StatCard label="عدد الموردين" value={String(data.suppliers.length)} icon={Handshake} tone="neutral" />
        <StatCard label="إجمالي المديونية" value={formatCurrency(debt)} icon={Wallet} tone={debt > 0 ? 'danger' : 'neutral'} hint="المتبقي علينا لكل الموردين" />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50 text-right text-xs text-[var(--text-muted)]">
              <th className="px-4 py-3 font-medium">المورد</th>
              <th className="px-4 py-3 font-medium">الهاتف</th>
              <th className="px-4 py-3 font-medium">الرصيد (علينا)</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {data.suppliers.map((s) => {
              const bal = supplierBalance(s.id, data.supplierTransactions)
              return (
                <tr key={s.id} className="cursor-pointer border-b border-[var(--border)] last:border-0 hover:bg-gray-50" onClick={() => setSelected(s)}>
                  <td className="px-4 py-3 font-medium text-[var(--text)]">{s.name}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{s.phone || '—'}</td>
                  <td className={`px-4 py-3 font-medium ${bal > 0 ? 'text-red-600' : 'text-[var(--text)]'}`}>{formatCurrency(bal)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(s)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]">
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف المورد "${s.name}"؟ هيتم حذف كل حركاته المسجلة.`)) deleteSupplier(s.id)
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
            {data.suppliers.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  لا يوجد موردين — أضف مورد يدويًا، أو هيتضاف تلقائيًا لو استوردت أصناف فيها عمود "المورد"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">{editing ? 'تعديل مورد' : 'إضافة مورد جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                اسم المورد
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                رقم الهاتف
                <input value={form.phone ?? ''} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                ملاحظات
                <textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="input" rows={2} />
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

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-[var(--border)] p-5">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">{selected.name}</h2>
                <p className="text-sm text-[var(--text-muted)]">
                  الرصيد الحالي:{' '}
                  <span className={supplierBalance(selected.id, data.supplierTransactions) > 0 ? 'font-bold text-red-600' : 'font-bold text-[var(--text)]'}>
                    {formatCurrency(supplierBalance(selected.id, data.supplierTransactions))}
                  </span>
                </p>
              </div>
              <button
                onClick={() => {
                  setSelected(null)
                  setTxnForm(null)
                }}
                className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text)]">الحركات</h3>
                <button
                  onClick={() => setTxnForm(txnForm ? null : emptyTxnForm(selected.id))}
                  className="flex items-center gap-1.5 rounded-lg border border-[var(--brand)] px-3 py-1.5 text-xs font-medium text-[var(--brand-dark)] hover:bg-[var(--brand)]/10"
                >
                  <Plus size={14} />
                  إضافة حركة
                </button>
              </div>

              {txnForm && (
                <div className="mb-4 grid grid-cols-2 gap-3 rounded-xl border border-[var(--border)] bg-gray-50 p-3">
                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                    النوع
                    <select
                      value={txnForm.type}
                      onChange={(e) => setTxnForm({ ...txnForm, type: e.target.value as 'purchase' | 'payment' })}
                      className="input"
                    >
                      <option value="purchase">شراء بالآجل (يزود الدين)</option>
                      <option value="payment">سداد (يقلل الدين)</option>
                    </select>
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                    التاريخ
                    <input type="date" value={txnForm.date} onChange={(e) => setTxnForm({ ...txnForm, date: e.target.value })} className="input" />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                    المبلغ
                    <input
                      type="number"
                      value={txnForm.amount || ''}
                      onChange={(e) => setTxnForm({ ...txnForm, amount: Number(e.target.value) })}
                      className="input"
                    />
                  </label>
                  <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                    ملاحظة
                    <input value={txnForm.note ?? ''} onChange={(e) => setTxnForm({ ...txnForm, note: e.target.value })} className="input" />
                  </label>
                  <div className="col-span-2 flex justify-end gap-2">
                    <button onClick={() => setTxnForm(null)} className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--text-muted)]">
                      إلغاء
                    </button>
                    <button onClick={submitTxn} className="rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-dark)]">
                      حفظ
                    </button>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2">
                {supplierTxns.map((t) => (
                  <div key={t.id} className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm">
                    <div>
                      <span className={`ml-2 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${t.type === 'purchase' ? 'bg-red-100 text-red-700' : 'bg-[var(--brand)]/10 text-[var(--brand-dark)]'}`}>
                        {t.type === 'purchase' ? 'شراء' : 'سداد'}
                      </span>
                      <span className="text-[var(--text-muted)]">{formatDate(t.date)}</span>
                      {t.note && <span className="mr-2 text-[var(--text-muted)]">— {t.note}</span>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--text)]">{formatCurrency(t.amount)}</span>
                      <button onClick={() => deleteSupplierTransaction(t.id)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
                {supplierTxns.length === 0 && <p className="py-6 text-center text-sm text-[var(--text-muted)]">لا توجد حركات مسجلة لهذا المورد بعد</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
