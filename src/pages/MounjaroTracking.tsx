import { useMemo, useState } from 'react'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Clock,
  Download,
  History,
  Pencil,
  Plus,
  Search,
  Syringe,
  Trash2,
  TrendingDown,
  Users,
  Wallet,
  X,
} from 'lucide-react'
import { useAppData } from '../lib/storage'
import { formatCurrency, formatDate, formatNumber } from '../lib/format'
import {
  DOSE_LEVELS,
  DUE_STATUS_LABEL,
  STATUS_LABEL,
  currentWeight,
  dosesForCustomer,
  dueStatus,
  lastDose,
  nextDoseDate,
  suggestedNextDose,
  totalPaid,
  weightLoss,
  type DueStatus,
} from '../lib/mounjaro'
import StatCard from '../components/StatCard'
import type { MounjaroCustomer, MounjaroDose } from '../types'

const DUE_BADGE: Record<DueStatus, string> = {
  overdue: 'bg-red-100 text-red-700',
  dueSoon: 'bg-amber-100 text-amber-700',
  ok: 'bg-[var(--brand)]/10 text-[var(--brand-dark)]',
  none: 'bg-gray-100 text-gray-500',
}

const STATUS_BADGE: Record<MounjaroCustomer['status'], string> = {
  active: 'bg-[var(--brand)]/10 text-[var(--brand-dark)]',
  paused: 'bg-amber-100 text-amber-700',
  completed: 'bg-gray-100 text-gray-600',
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

function emptyCustomerForm(): Omit<MounjaroCustomer, 'id' | 'updatedAt'> {
  return { name: '', phone: '', startDate: today(), startWeight: undefined, targetWeight: undefined, status: 'active', pricePerDose: undefined, notes: '' }
}

function emptyDoseForm(customerId: string, doseMg: number, price?: number): Omit<MounjaroDose, 'id'> {
  return { customerId, date: today(), doseMg, weight: undefined, price, note: '' }
}

function downloadCSV(filename: string, header: string[], rows: (string | number)[][]) {
  const escape = (v: string | number) => {
    const s = String(v)
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  const lines = [header.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))]
  const blob = new Blob(['﻿' + lines.join('\n') + '\n'], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export default function MounjaroTracking() {
  const {
    data,
    addMounjaroCustomer,
    updateMounjaroCustomer,
    deleteMounjaroCustomer,
    addMounjaroDose,
    updateMounjaroDose,
    deleteMounjaroDose,
  } = useAppData()

  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | MounjaroCustomer['status']>('all')

  const [showCustomerForm, setShowCustomerForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<MounjaroCustomer | null>(null)
  const [customerForm, setCustomerForm] = useState<Omit<MounjaroCustomer, 'id' | 'updatedAt'>>(emptyCustomerForm())

  const [doseModalCustomer, setDoseModalCustomer] = useState<MounjaroCustomer | null>(null)
  const [doseForm, setDoseForm] = useState<Omit<MounjaroDose, 'id'>>(emptyDoseForm('', DOSE_LEVELS[0]))
  const [editingDose, setEditingDose] = useState<MounjaroDose | null>(null)

  const [historyCustomer, setHistoryCustomer] = useState<MounjaroCustomer | null>(null)

  const stats = useMemo(() => {
    const active = data.mounjaroCustomers.filter((c) => c.status === 'active')
    const overdue = active.filter((c) => dueStatus(c, data.mounjaroDoses) === 'overdue').length
    const dueSoon = active.filter((c) => dueStatus(c, data.mounjaroDoses) === 'dueSoon').length
    const revenue = data.mounjaroCustomers.reduce((sum, c) => sum + totalPaid(c.id, data.mounjaroDoses), 0)
    const losses = data.mounjaroCustomers.map((c) => weightLoss(c, data.mounjaroDoses)).filter((v): v is number => v !== undefined)
    const avgLoss = losses.length > 0 ? losses.reduce((a, b) => a + b, 0) / losses.length : undefined
    return { activeCount: active.length, overdue, dueSoon, revenue, avgLoss }
  }, [data.mounjaroCustomers, data.mounjaroDoses])

  const rows = useMemo(() => {
    let list = [...data.mounjaroCustomers]
    if (statusFilter !== 'all') list = list.filter((c) => c.status === statusFilter)
    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q))
    }
    const severity: Record<DueStatus, number> = { overdue: 0, dueSoon: 1, ok: 2, none: 3 }
    return list.sort((a, b) => {
      const sa = severity[dueStatus(a, data.mounjaroDoses)]
      const sb = severity[dueStatus(b, data.mounjaroDoses)]
      if (sa !== sb) return sa - sb
      return a.name.localeCompare(b.name, 'ar')
    })
  }, [data.mounjaroCustomers, data.mounjaroDoses, statusFilter, search])

  function openAddCustomer() {
    setEditingCustomer(null)
    setCustomerForm(emptyCustomerForm())
    setShowCustomerForm(true)
  }

  function openEditCustomer(c: MounjaroCustomer) {
    setEditingCustomer(c)
    setCustomerForm(c)
    setShowCustomerForm(true)
  }

  function submitCustomer() {
    if (!customerForm.name.trim()) return
    if (editingCustomer) {
      updateMounjaroCustomer({ ...editingCustomer, ...customerForm })
    } else {
      addMounjaroCustomer(customerForm)
    }
    setShowCustomerForm(false)
  }

  function openAddDose(c: MounjaroCustomer) {
    setDoseModalCustomer(c)
    setEditingDose(null)
    const suggested = suggestedNextDose(c.id, data.mounjaroDoses) ?? DOSE_LEVELS[0]
    setDoseForm(emptyDoseForm(c.id, suggested, c.pricePerDose))
  }

  function openEditDose(c: MounjaroCustomer, d: MounjaroDose) {
    setDoseModalCustomer(c)
    setEditingDose(d)
    setDoseForm(d)
  }

  function submitDose() {
    if (!doseForm.customerId || !doseForm.doseMg) return
    if (editingDose) {
      updateMounjaroDose({ ...editingDose, ...doseForm })
    } else {
      addMounjaroDose(doseForm)
    }
    setDoseModalCustomer(null)
  }

  function exportSheet() {
    downloadCSV(
      'متابعة-جرعات-المونجارو.csv',
      [
        'اسم العميل',
        'الهاتف',
        'تاريخ البدء',
        'الحالة',
        'الوزن الابتدائي',
        'الوزن الحالي',
        'الوزن المستهدف',
        'فقدان الوزن',
        'الجرعة الحالية (مج)',
        'تاريخ آخر جرعة',
        'تاريخ الجرعة القادمة',
        'حالة الموعد',
        'إجمالي المدفوع',
        'ملاحظات',
      ],
      rows.map((c) => {
        const last = lastDose(c.id, data.mounjaroDoses)
        const next = nextDoseDate(last)
        const loss = weightLoss(c, data.mounjaroDoses)
        return [
          c.name,
          c.phone ?? '',
          c.startDate,
          STATUS_LABEL[c.status],
          c.startWeight ?? '',
          currentWeight(c, data.mounjaroDoses) ?? '',
          c.targetWeight ?? '',
          loss !== undefined ? loss.toFixed(1) : '',
          last?.doseMg ?? '',
          last?.date ?? '',
          next ?? '',
          DUE_STATUS_LABEL[dueStatus(c, data.mounjaroDoses)],
          totalPaid(c.id, data.mounjaroDoses),
          c.notes ?? '',
        ]
      }),
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">متابعة جرعات المونجارو</h1>
          <p className="text-sm text-[var(--text-muted)]">شيت متابعة احترافي لعملاء برنامج المونجارو — الجرعات، المواعيد القادمة، الوزن، والمدفوعات</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={exportSheet}
            className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-white px-3 py-2 text-sm font-medium text-[var(--text-muted)] hover:bg-gray-50"
          >
            <Download size={16} />
            تصدير الشيت (CSV)
          </button>
          <button
            onClick={openAddCustomer}
            className="flex items-center gap-2 rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]"
          >
            <Plus size={16} />
            إضافة عميل جديد
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="العملاء النشطين" value={formatNumber(stats.activeCount)} icon={Users} tone="brand" />
        <StatCard label="جرعات متأخرة" value={formatNumber(stats.overdue)} icon={AlertTriangle} tone={stats.overdue > 0 ? 'danger' : 'neutral'} />
        <StatCard label="مستحقة خلال يومين" value={formatNumber(stats.dueSoon)} icon={Clock} tone={stats.dueSoon > 0 ? 'warning' : 'neutral'} />
        <StatCard
          label="إجمالي إيرادات البرنامج"
          value={formatCurrency(stats.revenue)}
          icon={Wallet}
          tone="neutral"
          hint={stats.avgLoss !== undefined ? `متوسط فقدان الوزن: ${stats.avgLoss.toFixed(1)} كجم` : undefined}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو رقم الهاتف..."
            className="input w-full pr-9"
          />
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-white p-1">
          {(['all', 'active', 'paused', 'completed'] as const).map((s) => (
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
              <th className="px-4 py-3 font-medium">العميل</th>
              <th className="px-4 py-3 font-medium">تاريخ البدء</th>
              <th className="px-4 py-3 font-medium">الجرعة الحالية</th>
              <th className="px-4 py-3 font-medium">آخر جرعة</th>
              <th className="px-4 py-3 font-medium">الجرعة القادمة</th>
              <th className="px-4 py-3 font-medium">الوزن</th>
              <th className="px-4 py-3 font-medium">فقدان الوزن</th>
              <th className="px-4 py-3 font-medium">الحالة</th>
              <th className="px-4 py-3 font-medium">إجمالي المدفوع</th>
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const last = lastDose(c.id, data.mounjaroDoses)
              const next = nextDoseDate(last)
              const due = dueStatus(c, data.mounjaroDoses)
              const loss = weightLoss(c, data.mounjaroDoses)
              const wNow = currentWeight(c, data.mounjaroDoses)
              return (
                <tr key={c.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-[var(--text)]">
                    {c.name}
                    {c.phone && <div className="text-xs font-normal text-[var(--text-muted)]" dir="ltr">{c.phone}</div>}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{formatDate(c.startDate)}</td>
                  <td className="px-4 py-3">{last ? <span className="font-bold text-[var(--brand-dark)]">{formatNumber(last.doseMg)} مج</span> : '—'}</td>
                  <td className="px-4 py-3 text-[var(--text-muted)]">{last ? formatDate(last.date) : '—'}</td>
                  <td className="px-4 py-3">
                    {next ? (
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${DUE_BADGE[due]}`}>
                        {due === 'overdue' && <AlertTriangle size={12} />}
                        {formatDate(next)}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">{wNow !== undefined ? `${formatNumber(wNow)} كجم` : '—'}</td>
                  <td className="px-4 py-3">
                    {loss !== undefined ? (
                      <span className={loss > 0 ? 'font-medium text-[var(--brand-dark)]' : 'text-[var(--text-muted)]'}>
                        {loss > 0 ? '−' : ''}
                        {formatNumber(Math.abs(loss))} كجم
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(totalPaid(c.id, data.mounjaroDoses))}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openAddDose(c)}
                        title="تسجيل جرعة"
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-[var(--brand)]/10 hover:text-[var(--brand-dark)]"
                      >
                        <Syringe size={14} />
                      </button>
                      <button
                        onClick={() => setHistoryCustomer(c)}
                        title="سجل الجرعات"
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]"
                      >
                        <History size={14} />
                      </button>
                      <button
                        onClick={() => openEditCustomer(c)}
                        title="تعديل بيانات العميل"
                        className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`حذف العميل "${c.name}" وكل سجل جرعاته؟`)) deleteMounjaroCustomer(c.id)
                        }}
                        title="حذف"
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
                <td colSpan={10} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  {data.mounjaroCustomers.length === 0 ? 'لا يوجد عملاء مسجلين بعد — ابدأ بإضافة عميل جديد' : 'لا توجد نتائج مطابقة'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCustomerForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">{editingCustomer ? 'تعديل بيانات العميل' : 'إضافة عميل جديد'}</h2>
              <button onClick={() => setShowCustomerForm(false)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                اسم العميل
                <input value={customerForm.name} onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                رقم الهاتف
                <input value={customerForm.phone ?? ''} onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })} className="input" dir="ltr" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                تاريخ البدء
                <input type="date" value={customerForm.startDate} onChange={(e) => setCustomerForm({ ...customerForm, startDate: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الوزن الابتدائي (كجم)
                <input
                  type="number"
                  value={customerForm.startWeight ?? ''}
                  onChange={(e) => setCustomerForm({ ...customerForm, startWeight: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الوزن المستهدف (كجم)
                <input
                  type="number"
                  value={customerForm.targetWeight ?? ''}
                  onChange={(e) => setCustomerForm({ ...customerForm, targetWeight: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                السعر الافتراضي للجرعة
                <input
                  type="number"
                  value={customerForm.pricePerDose ?? ''}
                  onChange={(e) => setCustomerForm({ ...customerForm, pricePerDose: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الحالة
                <select
                  value={customerForm.status}
                  onChange={(e) => setCustomerForm({ ...customerForm, status: e.target.value as MounjaroCustomer['status'] })}
                  className="input"
                >
                  {(['active', 'paused', 'completed'] as const).map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABEL[s]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                ملاحظات
                <input value={customerForm.notes ?? ''} onChange={(e) => setCustomerForm({ ...customerForm, notes: e.target.value })} className="input" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setShowCustomerForm(false)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
                إلغاء
              </button>
              <button onClick={submitCustomer} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]">
                {editingCustomer ? 'حفظ التعديلات' : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {doseModalCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">
                {editingDose ? 'تعديل جرعة' : 'تسجيل جرعة جديدة'} — {doseModalCustomer.name}
              </h2>
              <button onClick={() => setDoseModalCustomer(null)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                تاريخ الجرعة
                <input type="date" value={doseForm.date} onChange={(e) => setDoseForm({ ...doseForm, date: e.target.value })} className="input" />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الجرعة (مج)
                <select value={doseForm.doseMg} onChange={(e) => setDoseForm({ ...doseForm, doseMg: Number(e.target.value) })} className="input">
                  {DOSE_LEVELS.map((mg) => (
                    <option key={mg} value={mg}>
                      {mg} مج
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                الوزن وقت الجرعة (كجم)
                <input
                  type="number"
                  value={doseForm.weight ?? ''}
                  onChange={(e) => setDoseForm({ ...doseForm, weight: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                السعر المدفوع
                <input
                  type="number"
                  value={doseForm.price ?? ''}
                  onChange={(e) => setDoseForm({ ...doseForm, price: e.target.value === '' ? undefined : Number(e.target.value) })}
                  className="input"
                />
              </label>
              <label className="col-span-2 flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)]">
                ملاحظة
                <input value={doseForm.note ?? ''} onChange={(e) => setDoseForm({ ...doseForm, note: e.target.value })} className="input" />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setDoseModalCustomer(null)} className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-muted)]">
                إلغاء
              </button>
              <button onClick={submitDose} className="rounded-lg bg-[var(--brand)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--brand-dark)]">
                {editingDose ? 'حفظ التعديلات' : 'تسجيل الجرعة'}
              </button>
            </div>
          </div>
        </div>
      )}

      {historyCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">سجل جرعات {historyCustomer.name}</h2>
                <p className="text-xs text-[var(--text-muted)]">
                  تاريخ البدء: {formatDate(historyCustomer.startDate)} — الجرعة القادمة المقترحة:{' '}
                  {suggestedNextDose(historyCustomer.id, data.mounjaroDoses) ?? '—'} مج
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openAddDose(historyCustomer)}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--brand)] px-3 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-dark)]"
                >
                  <Plus size={14} />
                  جرعة جديدة
                </button>
                <button onClick={() => setHistoryCustomer(null)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] bg-gray-50 text-right text-xs text-[var(--text-muted)]">
                    <th className="px-3 py-2 font-medium">التاريخ</th>
                    <th className="px-3 py-2 font-medium">الجرعة</th>
                    <th className="px-3 py-2 font-medium">الوزن</th>
                    <th className="px-3 py-2 font-medium">السعر</th>
                    <th className="px-3 py-2 font-medium">ملاحظة</th>
                    <th className="px-3 py-2 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {dosesForCustomer(historyCustomer.id, data.mounjaroDoses).map((d) => (
                    <tr key={d.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                      <td className="px-3 py-2">{formatDate(d.date)}</td>
                      <td className="px-3 py-2 font-medium text-[var(--brand-dark)]">{formatNumber(d.doseMg)} مج</td>
                      <td className="px-3 py-2">{d.weight !== undefined ? `${formatNumber(d.weight)} كجم` : '—'}</td>
                      <td className="px-3 py-2">{d.price !== undefined ? formatCurrency(d.price) : '—'}</td>
                      <td className="px-3 py-2 text-[var(--text-muted)]">{d.note || '—'}</td>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => openEditDose(historyCustomer, d)}
                            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm('حذف هذه الجرعة؟')) deleteMounjaroDose(d.id)
                            }}
                            className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {dosesForCustomer(historyCustomer.id, data.mounjaroDoses).length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--text-muted)]">
                        لا توجد جرعات مسجلة بعد لهذا العميل
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-2 text-xs text-[var(--text-muted)]">
              <CalendarClock size={14} />
              الجرعة القادمة المتوقعة: {nextDoseDate(lastDose(historyCustomer.id, data.mounjaroDoses)) ? formatDate(nextDoseDate(lastDose(historyCustomer.id, data.mounjaroDoses))!) : '—'}
              {(() => {
                const loss = weightLoss(historyCustomer, data.mounjaroDoses)
                return loss !== undefined ? (
                  <span className="mr-3 flex items-center gap-1 text-[var(--brand-dark)]">
                    <TrendingDown size={14} />
                    إجمالي فقدان الوزن: {formatNumber(loss)} كجم
                  </span>
                ) : null
              })()}
              {(() => {
                const total = totalPaid(historyCustomer.id, data.mounjaroDoses)
                return total > 0 ? (
                  <span className="mr-3 flex items-center gap-1">
                    <CheckCircle2 size={14} />
                    إجمالي المدفوع: {formatCurrency(total)}
                  </span>
                ) : null
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
