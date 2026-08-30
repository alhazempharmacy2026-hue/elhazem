import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import type { DailyRecord } from '../types'
import { aggregate, filterByRange } from '../lib/analytics'
import { buildPresets } from '../lib/periods'
import { formatCurrency, formatDate, formatNumber, formatPercent } from '../lib/format'

const INK_MUTED = '#898781'
const INK_SECONDARY = '#52514e'
const GRIDLINE = '#e1e0d9'
const SERIES_CURRENT = '#2a78d6'
const SERIES_PREVIOUS = '#eb6834'

interface MetricRow {
  label: string
  a: number
  b: number
  format: 'currency' | 'number' | 'percent'
  goodDirection: 'up' | 'down'
}

export default function ComparisonPanel({ records }: { records: DailyRecord[] }) {
  const presets = useMemo(() => buildPresets(), [])
  const [presetKey, setPresetKey] = useState(presets[0].key)
  const [customA, setCustomA] = useState({ start: presets[0].current.start, end: presets[0].current.end })
  const [customB, setCustomB] = useState({ start: presets[0].previous.start, end: presets[0].previous.end })
  const [useCustom, setUseCustom] = useState(false)

  const active = presets.find((p) => p.key === presetKey) ?? presets[0]
  const rangeA = useCustom ? customA : active.current
  const rangeB = useCustom ? customB : active.previous

  const aggA = useMemo(() => aggregate(filterByRange(records, rangeA.start, rangeA.end)), [records, rangeA])
  const aggB = useMemo(() => aggregate(filterByRange(records, rangeB.start, rangeB.end)), [records, rangeB])

  const labelA = `الفترة أ (${formatDate(rangeA.start)} - ${formatDate(rangeA.end)})`
  const labelB = `الفترة ب (${formatDate(rangeB.start)} - ${formatDate(rangeB.end)})`

  const rows: MetricRow[] = [
    { label: 'إجمالي المبيعات', a: aggA.totalSales, b: aggB.totalSales, format: 'currency', goodDirection: 'up' },
    { label: 'صافي الربح', a: aggA.totalProfit, b: aggB.totalProfit, format: 'currency', goodDirection: 'up' },
    { label: 'إجمالي الديون (آجل + معلق)', a: aggA.totalDebts, b: aggB.totalDebts, format: 'currency', goodDirection: 'down' },
    { label: 'عدد الفواتير', a: aggA.totalInvoices, b: aggB.totalInvoices, format: 'number', goodDirection: 'up' },
    { label: 'متوسط الفاتورة', a: aggA.avgInvoiceValue, b: aggB.avgInvoiceValue, format: 'currency', goodDirection: 'up' },
    { label: 'نسبة الربح', a: aggA.profitPercent, b: aggB.profitPercent, format: 'percent', goodDirection: 'up' },
    { label: 'نسبة الدليفري', a: aggA.deliveryRatio, b: aggB.deliveryRatio, format: 'percent', goodDirection: 'up' },
    { label: 'قيمة المرتجعات', a: aggA.totalReturnsValue, b: aggB.totalReturnsValue, format: 'currency', goodDirection: 'down' },
  ]

  const chartData = [
    { metric: 'المبيعات', الفترة_أ: aggA.totalSales, الفترة_ب: aggB.totalSales },
    { metric: 'الربح', الفترة_أ: aggA.totalProfit, الفترة_ب: aggB.totalProfit },
    { metric: 'الديون', الفترة_أ: aggA.totalDebts, الفترة_ب: aggB.totalDebts },
  ]

  function formatValue(v: number, format: MetricRow['format']) {
    if (format === 'currency') return formatCurrency(v)
    if (format === 'percent') return formatPercent(v)
    return formatNumber(v)
  }

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-[var(--text)]">مقارنة الفترات</h2>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={useCustom ? 'custom' : presetKey}
            onChange={(e) => {
              if (e.target.value === 'custom') {
                setUseCustom(true)
              } else {
                setUseCustom(false)
                setPresetKey(e.target.value)
              }
            }}
            className="input"
          >
            {presets.map((p) => (
              <option key={p.key} value={p.key}>
                {p.label}
              </option>
            ))}
            <option value="custom">فترة مخصصة...</option>
          </select>
        </div>
      </div>

      <p className="mb-4 text-xs text-[var(--text-muted)]">
        بيتم حساب الفترتين تلقائيًا حسب الاختيار اللي فوق —{' '}
        <span className="font-semibold" style={{ color: SERIES_CURRENT }}>
          {labelA}
        </span>{' '}
        مقابل{' '}
        <span className="font-semibold" style={{ color: SERIES_PREVIOUS }}>
          {labelB}
        </span>
        . اختار "فترة مخصصة" لو عايز تحدد تاريخين بنفسك.
      </p>

      {useCustom && (
        <div className="mb-4 grid grid-cols-1 gap-3 rounded-lg bg-gray-50 p-3 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[var(--brand-dark)]">الفترة أ</span>
            <div className="flex items-center gap-2">
              <input type="date" value={customA.start} onChange={(e) => setCustomA({ ...customA, start: e.target.value })} className="input flex-1" />
              <span className="text-xs text-[var(--text-muted)]">إلى</span>
              <input type="date" value={customA.end} onChange={(e) => setCustomA({ ...customA, end: e.target.value })} className="input flex-1" />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-[#eb6834]">الفترة ب</span>
            <div className="flex items-center gap-2">
              <input type="date" value={customB.start} onChange={(e) => setCustomB({ ...customB, start: e.target.value })} className="input flex-1" />
              <span className="text-xs text-[var(--text-muted)]">إلى</span>
              <input type="date" value={customB.end} onChange={(e) => setCustomB({ ...customB, end: e.target.value })} className="input flex-1" />
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-right text-xs text-[var(--text-muted)]">
                <th className="py-2 font-medium">المؤشر</th>
                <th className="py-2 font-medium" style={{ color: SERIES_CURRENT }}>
                  أ
                </th>
                <th className="py-2 font-medium" style={{ color: SERIES_PREVIOUS }}>
                  ب
                </th>
                <th className="py-2 font-medium">التغيّر</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const delta = row.b === 0 ? (row.a === 0 ? 0 : 1) : (row.a - row.b) / Math.abs(row.b)
                const isFlat = Math.abs(delta) < 0.001
                const isGood = isFlat ? null : (delta > 0) === (row.goodDirection === 'up')
                return (
                  <tr key={row.label} className="border-b border-[var(--border)] last:border-0">
                    <td className="py-2.5 font-medium text-[var(--text)]">{row.label}</td>
                    <td className="py-2.5">{formatValue(row.a, row.format)}</td>
                    <td className="py-2.5 text-[var(--text-muted)]">{formatValue(row.b, row.format)}</td>
                    <td className="py-2.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                          isFlat ? 'bg-slate-100 text-slate-600' : isGood ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                        }`}
                      >
                        {isFlat ? <Minus size={12} /> : delta > 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {formatPercent(Math.abs(delta))}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div dir="ltr">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={GRIDLINE} vertical={false} />
              <XAxis dataKey="metric" tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={{ stroke: GRIDLINE }} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Cairo' }} />
              <Legend
                verticalAlign="top"
                align="right"
                height={28}
                formatter={(value) => <span style={{ color: INK_SECONDARY, fontSize: 12 }}>{value === 'الفترة_أ' ? 'أ' : 'ب'}</span>}
              />
              <Bar dataKey="الفترة_أ" fill={SERIES_CURRENT} radius={[4, 4, 0, 0]} barSize={28} />
              <Bar dataKey="الفترة_ب" fill={SERIES_PREVIOUS} radius={[4, 4, 0, 0]} barSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}
