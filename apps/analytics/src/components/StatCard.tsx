import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string
  icon: LucideIcon
  tone?: 'brand' | 'warning' | 'danger' | 'neutral'
  hint?: string
}

const toneClasses: Record<NonNullable<StatCardProps['tone']>, string> = {
  brand: 'bg-[var(--brand)]/10 text-[var(--brand-dark)]',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
  neutral: 'bg-slate-100 text-slate-700',
}

export default function StatCard({ label, value, icon: Icon, tone = 'brand', hint }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
          <div className="mt-2 text-2xl font-bold text-[var(--text)]">{value}</div>
          {hint && <div className="mt-1 text-xs text-[var(--text-muted)]">{hint}</div>}
        </div>
        <div className={`rounded-xl p-2.5 ${toneClasses[tone]}`}>
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}
