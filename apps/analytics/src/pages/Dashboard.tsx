import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { DollarSign, TrendingUp, UserCheck, Receipt, Truck, RotateCcw } from 'lucide-react'
import { useAppData } from '../lib/storage'
import { aggregate, buildTrend, invoiceBucketTotals, paymentBreakdown, filterByRange, isoDaysAgo } from '../lib/analytics'
import { formatCurrency, formatPercent, formatNumber } from '../lib/format'
import StatCard from '../components/StatCard'
import ComparisonPanel from '../components/ComparisonPanel'

const CATEGORY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const INK_MUTED = '#898781'
const INK_SECONDARY = '#52514e'
const GRIDLINE = '#e1e0d9'

const RANGE_OPTIONS = [
  { value: 7, label: '٧ أيام' },
  { value: 14, label: '١٤ يوم' },
  { value: 30, label: '٣٠ يوم' },
  { value: 9999, label: 'الكل' },
]

export default function Dashboard() {
  const { data } = useAppData()
  const [range, setRange] = useState(30)

  const scoped = useMemo(() => {
    if (range >= 9999) return data.records
    return filterByRange(data.records, isoDaysAgo(range), isoDaysAgo(-1))
  }, [data.records, range])

  const stats = useMemo(() => aggregate(scoped), [scoped])
  const trend = useMemo(() => buildTrend(scoped), [scoped])
  const buckets = useMemo(() => invoiceBucketTotals(scoped), [scoped])
  const payments = useMemo(() => paymentBreakdown(scoped), [scoped])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">لوحة التحكم</h1>
          <p className="text-sm text-[var(--text-muted)]">تحليل المبيعات وأداء الصيدلية من بيانات المتابعة اليومية</p>
        </div>
        <div className="flex gap-1 rounded-lg border border-[var(--border)] bg-white p-1">
          {RANGE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setRange(opt.value)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                range === opt.value ? 'bg-[var(--brand)] text-white' : 'text-[var(--text-muted)] hover:bg-gray-100'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {data.records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--border)] bg-white p-10 text-center text-sm text-[var(--text-muted)]">
          لا توجد بيانات بعد — روح لصفحة "البيانات اليومية" واستورد ملف CSV أو أضف يوم يدويًا
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <StatCard label="إجمالي المبيعات" value={formatCurrency(stats.totalSales)} icon={DollarSign} tone="brand" />
            <StatCard label="صافي الربح" value={formatCurrency(stats.totalProfit)} icon={TrendingUp} tone="brand" hint={formatPercent(stats.profitPercent) + ' نسبة الربح'} />
            <StatCard label="نسبة التسجيل بكود" value={formatPercent(stats.codeRegistrationRatio)} icon={UserCheck} tone="neutral" hint="أداء الصيادلة في تسجيل العملاء" />
            <StatCard label="عدد الفواتير" value={formatNumber(stats.totalInvoices)} icon={Receipt} tone="neutral" hint={formatCurrency(stats.avgInvoiceValue) + ' متوسط الفاتورة'} />
            <StatCard label="نسبة الدليفري" value={formatPercent(stats.deliveryRatio)} icon={Truck} tone="neutral" />
            <StatCard label="قيمة المرتجعات" value={formatCurrency(stats.totalReturnsValue)} icon={RotateCcw} tone={stats.totalReturnsValue > 0 ? 'warning' : 'neutral'} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm lg:col-span-2">
              <h2 className="mb-3 text-sm font-bold text-[var(--text)]">اتجاه المبيعات والأرباح</h2>
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={260}>
                  <AreaChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2a78d6" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2a78d6" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="profitFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#1baf7a" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#1baf7a" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid stroke={GRIDLINE} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={{ stroke: GRIDLINE }} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip
                      formatter={(value, name) => [formatCurrency(Number(value)), String(name)]}
                      contentStyle={{ borderRadius: 12, border: '1px solid #e6e9f0', fontSize: 12, fontFamily: 'Cairo' }}
                    />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={28}
                      formatter={(value) => <span style={{ color: INK_SECONDARY, fontSize: 12 }}>{value}</span>}
                    />
                    <Area type="monotone" dataKey="sales" name="المبيعات" stroke="#2a78d6" strokeWidth={2} fill="url(#salesFill)" />
                    <Area type="monotone" dataKey="profit" name="الربح" stroke="#1baf7a" strokeWidth={2} fill="url(#profitFill)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-[var(--text)]">توزيع طرق الدفع</h2>
              {payments.length === 0 ? (
                <EmptyState />
              ) : (
                <>
                  <div dir="ltr">
                    <ResponsiveContainer width="100%" height={180}>
                      <PieChart>
                        <Pie data={payments} dataKey="value" nameKey="method" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="#fff" strokeWidth={2}>
                          {payments.map((_, i) => (
                            <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Cairo' }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 flex flex-col gap-1.5">
                    {payments.map((p, i) => (
                      <div key={p.method} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                          <span className="text-[var(--text)]">{p.method}</span>
                        </div>
                        <span className="font-medium text-[var(--text-muted)]">{formatCurrency(p.value)}</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm lg:col-span-2">
              <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                <UserCheck size={16} className="text-[var(--brand-dark)]" />
                تسجيل الفواتير بالكود (أداء الصيادلة)
              </h2>
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={GRIDLINE} vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={{ stroke: GRIDLINE }} tickLine={false} minTickGap={24} />
                    <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip formatter={(value, name) => [`${formatNumber(Number(value))} فاتورة`, String(name)]} contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Cairo' }} />
                    <Legend
                      verticalAlign="top"
                      align="right"
                      height={28}
                      formatter={(value) => <span style={{ color: INK_SECONDARY, fontSize: 12 }}>{value}</span>}
                    />
                    <Bar dataKey="invoicesWithCode" name="بكود" stackId="invoices" fill="#1baf7a" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="invoicesWithoutCode" name="بدون كود" stackId="invoices" fill="#eda100" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
              <h2 className="mb-3 text-sm font-bold text-[var(--text)]">توزيع قيمة الفواتير</h2>
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={buckets} layout="vertical" margin={{ left: 8, right: 16 }}>
                    <CartesianGrid stroke={GRIDLINE} horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="bucket" width={90} tick={{ fontSize: 11, fill: INK_SECONDARY }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => [`${formatNumber(Number(value))} فاتورة`, 'العدد']} contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Cairo' }} />
                    <Bar dataKey="value" fill="#2a78d6" radius={[0, 4, 4, 0]} barSize={16} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <ComparisonPanel records={data.records} />
        </>
      )}
    </div>
  )
}

function EmptyState({ text = 'لا توجد بيانات كافية' }: { text?: string }) {
  return <div className="flex h-40 items-center justify-center text-xs text-[var(--text-muted)]">{text}</div>
}
