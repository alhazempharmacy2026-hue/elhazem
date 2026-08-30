import { useMemo, useRef, useState } from 'react'
import { Download, Pencil, Plus, Trash2, Upload, X } from 'lucide-react'
import { useAppData } from '../lib/storage'
import { COLUMNS } from '../data/columns'
import { importFromCSV } from '../lib/importRecords'
import { formatCurrency, formatDate } from '../lib/format'
import type { DailyRecord } from '../types'

const TABLE_COLUMNS: { key: keyof DailyRecord; label: string }[] = [
  { key: 'date', label: 'التاريخ' },
  { key: 'invoiceCount', label: 'عدد الفواتير' },
  { key: 'totalSales', label: 'اجمالي المبيعات' },
  { key: 'creditValue', label: 'قيمة آجل (دين)' },
  { key: 'pendingValue', label: 'قيمة معلق' },
  { key: 'netProfit', label: 'صافي الربح' },
]

function emptyForm(): DailyRecord {
  return { id: '', date: new Date().toISOString().slice(0, 10) }
}

function downloadTemplate() {
  const header = COLUMNS.map((c) => c.label).join(',')
  const blob = new Blob(['﻿' + header + '\n'], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'نموذج-المتابعة-اليومية.csv'
  a.click()
  URL.revokeObjectURL(url)
}

export default function DailyData() {
  const { data, addRecord, updateRecord, deleteRecord, importRecords, clearAllData } = useAppData()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<DailyRecord | null>(null)
  const [form, setForm] = useState<DailyRecord>(emptyForm())
  const [importMsg, setImportMsg] = useState<string | null>(null)

  const rows = useMemo(() => [...data.records].sort((a, b) => (a.date < b.date ? 1 : -1)), [data.records])

  function openAdd() {
    setEditing(null)
    setForm(emptyForm())
    setShowForm(true)
  }

  function openEdit(r: DailyRecord) {
    setEditing(r)
    setForm(r)
    setShowForm(true)
  }

  function submit() {
    if (!form.date) return
    if (editing) {
      updateRecord(form)
    } else {
      addRecord({ ...form, id: `rec-${Date.now()}-${Math.random().toString(36).slice(2, 7)}` })
    }
    setShowForm(false)
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const text = String(reader.result ?? '')
      const result = importFromCSV(text)
      if (result.records.length === 0) {
        setImportMsg('لم يتم العثور على صفوف صالحة. تأكد إن أول صف فيه أسماء الأعمدة وعمود "التاريخ" موجود.')
        return
      }
      const { added, updated } = importRecords(result.records)
      let msg = `تم استيراد ${added} يوم جديد و تحديث ${updated} يوم موجود.`
      if (result.unmatchedHeaders.length > 0) {
        msg += ` أعمدة لم يتم التعرف عليها وتم تجاهلها: ${result.unmatchedHeaders.join('، ')}`
      }
      setImportMsg(msg)
    }
    reader.readAsText(file, 'utf-8')
    e.target.value = ''
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">البيانات اليومية</h1>
          <p className="text-sm text-[var(--text-muted)]">{data.records.length} يوم مسجل — استورد ملف CSV من شيت المتابعة اليومية</p>
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
            إضافة يوم يدويًا
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

      <div className="overflow-x-auto rounded-2xl border border-[var(--border)] bg-white shadow-sm">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-gray-50 text-right text-xs text-[var(--text-muted)]">
              {TABLE_COLUMNS.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b border-[var(--border)] last:border-0 hover:bg-gray-50">
                {TABLE_COLUMNS.map((c) => (
                  <td key={c.key} className="px-4 py-3">
                    {c.key === 'date'
                      ? formatDate(r.date)
                      : typeof r[c.key] === 'number'
                        ? formatCurrency(r[c.key] as number)
                        : (r[c.key] as string) ?? '—'}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(r)} className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-gray-100 hover:text-[var(--text)]">
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`حذف بيانات يوم ${formatDate(r.date)}؟`)) deleteRecord(r.id)
                      }}
                      className="rounded-md p-1.5 text-[var(--text-muted)] hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={TABLE_COLUMNS.length + 1} className="px-4 py-10 text-center text-sm text-[var(--text-muted)]">
                  لا توجد بيانات — استورد ملف CSV أو أضف يومًا يدويًا
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <button
        onClick={() => {
          if (confirm('هل تريد حذف كل البيانات نهائيًا؟')) clearAllData()
        }}
        className="self-start text-xs font-medium text-[var(--text-muted)] hover:text-red-600"
      >
        حذف كل البيانات
      </button>

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-bold text-[var(--text)]">{editing ? 'تعديل بيانات اليوم' : 'إضافة يوم جديد'}</h2>
              <button onClick={() => setShowForm(false)} className="rounded-md p-1 text-[var(--text-muted)] hover:bg-gray-100">
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {COLUMNS.map((col) => (
                <label
                  key={col.key}
                  className={`flex flex-col gap-1 text-xs font-medium text-[var(--text-muted)] ${col.key === 'date' || col.key === 'peakHour' ? 'col-span-2' : ''}`}
                >
                  {col.label}
                  <input
                    type={col.kind === 'date' ? 'date' : col.kind === 'number' ? 'number' : 'text'}
                    value={(form[col.key] as string | number | undefined) ?? ''}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        [col.key]: col.kind === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value,
                      })
                    }
                    className="input"
                  />
                </label>
              ))}
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
