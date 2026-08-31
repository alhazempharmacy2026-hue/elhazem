// شارة صغيرة ملونة لعرض حالة (طلب/دفع/روشتة...) — التلوين حسب فئة الحالة بدل قيمة نصية بعينها
// عشان يتقدر يتظبط بسهولة لو اتضافت حالات جديدة.
export type BadgeTone = 'neutral' | 'brand' | 'warning' | 'danger'

const toneClasses: Record<BadgeTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  brand: 'bg-[var(--brand)]/10 text-[var(--brand-dark)]',
  warning: 'bg-amber-100 text-amber-700',
  danger: 'bg-red-100 text-red-700',
}

export default function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: BadgeTone }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${toneClasses[tone]}`}>
      {label}
    </span>
  )
}
