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
import { DollarSign, Package, TrendingUp, AlertTriangle, Receipt, Boxes } from 'lucide-react'
import { usePharmacy } from '../lib/storage'
import { buildDashboardStats } from '../lib/analytics'
import { formatCurrency, daysUntil } from '../lib/format'
import StatCard from '../components/StatCard'

const CATEGORY_COLORS = ['#2a78d6', '#eb6834', '#1baf7a', '#eda100', '#e87ba4', '#008300', '#4a3aa7', '#e34948']
const INK_MUTED = '#898781'
const INK_SECONDARY = '#52514e'
const GRIDLINE = '#e1e0d9'

const RANGE_OPTIONS = [
  { value: 7, label: '٧ أيام' },
  { value: 14, label: '١٤ يوم' },
  { value: 30, label: '٣٠ يوم' },
]

export default function Dashboard() {
  const { data } = usePharmacy()
  const [range, setRange] = useState(30)
  const stats = useMemo(() => buildDashboardStats(data, range), [data, range])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[var(--text)]">لوحة التحكم</h1>
          <p className="text-sm text-[var(--text-muted)]">نظرة تحليلية على أداء الصيدلية</p>
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

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="إجمالي المبيعات" value={formatCurrency(stats.totalRevenue)} icon={DollarSign} tone="brand" />
        <StatCard label="صافي الربح" value={formatCurrency(stats.totalProfit)} icon={TrendingUp} tone="brand" />
        <StatCard label="عدد الفواتير" value={stats.totalTransactions.toLocaleString('ar-EG')} icon={Receipt} tone="neutral" />
        <StatCard label="متوسط الفاتورة" value={formatCurrency(stats.avgTicket)} icon={Receipt} tone="neutral" />
        <StatCard
          label="مخزون منخفض"
          value={stats.lowStock.length.toLocaleString('ar-EG')}
          icon={Package}
          tone={stats.lowStock.length > 0 ? 'warning' : 'neutral'}
        />
        <StatCard
          label="قرب انتهاء الصلاحية"
          value={stats.expiringSoon.length.toLocaleString('ar-EG')}
          icon={AlertTriangle}
          tone={stats.expiringSoon.length > 0 ? 'danger' : 'neutral'}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-bold text-[var(--text)]">اتجاه المبيعات والأرباح</h2>
          </div>
          <div dir="ltr">
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={stats.trend} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
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
              <YAxis tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} width={70} tickFormatter={(v) => v.toLocaleString('ar-EG')} />
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
              <Area type="monotone" dataKey="revenue" name="المبيعات" stroke="#2a78d6" strokeWidth={2} fill="url(#revenueFill)" />
              <Area type="monotone" dataKey="profit" name="الربح" stroke="#1baf7a" strokeWidth={2} fill="url(#profitFill)" />
            </AreaChart>
          </ResponsiveContainer>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">المبيعات حسب الفئة</h2>
          {stats.categoryBreakdown.length === 0 ? (
            <EmptyState />
          ) : (
            <>
              <div dir="ltr">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={stats.categoryBreakdown}
                      dataKey="revenue"
                      nameKey="category"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="#fff"
                      strokeWidth={2}
                    >
                      {stats.categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(Number(value))} contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Cairo' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 flex flex-col gap-1.5">
                {stats.categoryBreakdown.slice(0, 5).map((c, i) => (
                  <div key={c.category} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }} />
                      <span className="text-[var(--text)]">{c.category}</span>
                    </div>
                    <span className="font-medium text-[var(--text-muted)]">{formatCurrency(c.revenue)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm lg:col-span-1">
          <h2 className="mb-3 text-sm font-bold text-[var(--text)]">الأكثر مبيعًا</h2>
          {stats.topItems.length === 0 ? (
            <EmptyState />
          ) : (
            <div dir="ltr">
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={stats.topItems} layout="vertical" margin={{ left: 8, right: 16 }}>
                  <CartesianGrid stroke={GRIDLINE} horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11, fill: INK_MUTED }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11, fill: INK_SECONDARY }} axisLine={false} tickLine={false} />
                  <Tooltip formatter={(value) => [`${Number(value).toLocaleString('ar-EG')} وحدة`, 'الكمية']} contentStyle={{ borderRadius: 12, fontSize: 12, fontFamily: 'Cairo' }} />
                  <Bar dataKey="qty" fill="#2a78d6" radius={[0, 4, 4, 0]} barSize={16} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <Boxes size={16} className="text-amber-600" />
            مخزون منخفض
          </h2>
          {stats.lowStock.length === 0 ? (
            <EmptyState text="لا يوجد نقص في المخزون" />
          ) : (
            <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {stats.lowStock.slice(0, 8).map((m) => (
                <li key={m.id} className="flex items-center justify-between rounded-lg bg-amber-50 px-3 py-2 text-xs">
                  <span className="font-medium text-[var(--text)]">{m.name}</span>
                  <span className="font-bold text-amber-700">{m.stock} {m.unit}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
            <AlertTriangle size={16} className="text-red-600" />
            قرب انتهاء الصلاحية
          </h2>
          {stats.expiringSoon.length === 0 ? (
            <EmptyState text="لا يوجد أدوية قريبة من الانتهاء" />
          ) : (
            <ul className="flex flex-col gap-2 max-h-60 overflow-y-auto">
              {stats.expiringSoon.slice(0, 8).map((m) => {
                const d = daysUntil(m.expiryDate)
                return (
                  <li key={m.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2 text-xs">
                    <span className="font-medium text-[var(--text)]">{m.name}</span>
                    <span className="font-bold text-red-700">{d <= 0 ? 'منتهي' : `${d} يوم`}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}

function EmptyState({ text = 'لا توجد بيانات كافية' }: { text?: string }) {
  return <div className="flex h-40 items-center justify-center text-xs text-[var(--text-muted)]">{text}</div>
}
